import * as React from "react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useProducts, type Product } from "@/lib/products";

export type { Product } from "@/lib/products";
export const WHATSAPP = "5561981804734";

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

/** Valor mínimo do carrinho para ganhar frete grátis. */
export const FREE_SHIPPING_MIN = 1500;
