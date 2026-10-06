import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pathSchema = z.string().max(250).regex(/^[a-f0-9-]+\/[a-f0-9-]+(?:\/[a-f0-9-]+)?\.(mp4|webm|mov)$/);

// Only media actually attached to a visible review may receive a playback link.
export const getReviewVideoUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ reviewId: z.string().uuid(), path: pathSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: review } = await supabaseAdmin.from("reviews").select("product_id, fotos").eq("id", data.reviewId).single();
    if (!review || !Array.isArray(review.fotos) || !review.fotos.includes(`review-video:${data.path}`)) return null;
    const { data: product } = await supabaseAdmin.from("products").select("active").eq("id", review.product_id).single();
    if (!product?.active) return null;
    const { data: signed } = await supabaseAdmin.storage.from("review-media").createSignedUrl(data.path, 900);
    return signed?.signedUrl ?? null;
  });

// Guest writers use their private edit capability, never a public storage policy.
export const prepareReviewVideoUpload = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ reviewId: z.string().uuid(), token: z.string().uuid(), productId: z.string().min(1).max(200), extension: z.enum(["mp4", "webm", "mov"]) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product } = await supabaseAdmin.from("products").select("active").eq("id", data.productId).single();
    if (!product?.active) throw new Error("Produto indisponível para avaliação.");
    const { data: review, error } = await supabaseAdmin.from("reviews").select("edit_token, product_id").eq("id", data.reviewId).maybeSingle();
    if (error || (review && (review.edit_token !== data.token || review.product_id !== data.productId))) throw new Error("Não foi possível autorizar o envio.");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.token));
    const namespace = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const path = `${namespace}/${data.reviewId}/${crypto.randomUUID()}.${data.extension}`;
    const { data: signed, error: uploadError } = await supabaseAdmin.storage.from("review-media").createSignedUploadUrl(path, { upsert: false });
    if (uploadError || !signed) throw new Error("Não foi possível preparar o envio.");
    return { path, token: signed.token };
  });