<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Review videos are stored in the private `review-media` bucket and referenced from the existing review media array with a `review-video:` prefix, because signed URLs keep public playback controlled without exposing a public bucket.
- Muted review videos have their audio track removed client-side with FFmpeg before upload, because playback muting alone would still expose spoken audio.
- Shipping rates live in a dedicated public-readable, admin-writable city table and are applied by an order insert trigger, because prices must remain consistent across product pages, checkout, and saved orders.
- Checkout looks up street and neighborhood through ViaCEP after eight postal-code digits, with cancellation and manual fallback, because address convenience must not alter city shipping rates.
- Product cards and detail pages share SoldBadge with semantic glass tokens, because sales counts must have consistent styling across the storefront.
- Admin authorization requires both an admin role and the designated account's verified database email in has_role, because a role alone must not grant other accounts administrator access.
