import * as React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useProducts, type Product } from "@/lib/products";

export type { Product } from "@/lib/products";
export const WHATSAPP = "5561981804734";
export const ORIGIN = { name: "Taguatinga - DF", lat: -15.8335, lon: -48.0564 };
export const PRICE_PER_KM = 3;

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CartItem = { id: string; qty: number };
type Ctx = {
  items: (CartItem & { product: Product })[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};
// Mantém o mesmo contexto mesmo quando o arquivo é recarregado durante a edição.
const g = globalThis as unknown as { __rdlCartCtx?: React.Context<Ctx | null> };
const CartCtx = (g.__rdlCartCtx ??= createContext<Ctx | null>(null));

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { data: products = [] } = useProducts();
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("rdl-cart") || "[]")); } catch { /* empty */ }
  }, []);
  const save = (c: CartItem[]) => { setCart(c); localStorage.setItem("rdl-cart", JSON.stringify(c)); };
  const items = cart.flatMap((i) => {
    const product = products.find((p) => p.id === i.id);
    return product ? [{ ...i, product }] : [];
  });
  const value: Ctx = {
    items,
    add: (id, qty = 1) => {
      const ex = cart.find((i) => i.id === id);
      save(ex ? cart.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i)) : [...cart, { id, qty }]);
    },
    setQty: (id, qty) => save(qty <= 0 ? cart.filter((i) => i.id !== id) : cart.map((i) => (i.id === id ? { ...i, qty } : i))),
    clear: () => save([]),
    subtotal: items.reduce((s, i) => s + i.product.price * i.qty, 0),
    count: items.reduce((s, i) => s + i.qty, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) return { items: [], add: () => {}, setQty: () => {}, clear: () => {}, subtotal: 0, count: 0 } as Ctx;
  return c;
}

/** Calcula distância aproximada por estrada a partir do CEP (ViaCEP + OpenStreetMap). */
export async function quoteShipping(cep: string) {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) throw new Error("CEP inválido");
  const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  const a = await r.json();
  if (a.erro) throw new Error("CEP não encontrado");
  const q = encodeURIComponent(`${a.logradouro ? a.logradouro + ", " : ""}${a.bairro ? a.bairro + ", " : ""}${a.localidade}, ${a.uf}, Brasil`);
  let g = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`)).json();
  if (!g.length) g = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${a.localidade}, ${a.uf}, Brasil`)}`)).json();
  if (!g.length) throw new Error("Não foi possível localizar o endereço");
  const lat = +g[0].lat, lon = +g[0].lon;
  const R = 6371, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(lat - ORIGIN.lat), dLon = toR(lon - ORIGIN.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(ORIGIN.lat)) * Math.cos(toR(lat)) * Math.sin(dLon / 2) ** 2;
  const km = Math.max(1, Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.3));
  return { km, cost: km * PRICE_PER_KM, address: a as { logradouro: string; bairro: string; localidade: string; uf: string } };
}
