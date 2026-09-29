import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import guardaRoupa from "@/assets/guarda-roupa.jpg";
import sofa from "@/assets/sofa.jpg";
import cama from "@/assets/cama.jpg";
import mesa from "@/assets/mesa.jpg";

export const WHATSAPP = "5561981804734";
export const ORIGIN = { name: "Taguatinga - DF", lat: -15.8335, lon: -48.0564 };
export const PRICE_PER_KM = 3;

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  oldPrice: number;
  price: number;
  badge?: string;
  stock: number;
  dims: { w: number; h: number; d: number }; // cm
};

export const products: Product[] = [
  { id: "guarda-roupa-lucca", title: "Guarda-Roupa Casal 6 Portas Lucca - Naturalle", category: "Guarda-roupa", description: "Guarda-roupa casal em MDP com acabamento amadeirado, 6 portas, cabideiros e prateleiras internas. Ideal para quartos amplos.", image: guardaRoupa, oldPrice: 3408.9, price: 2184.91, badge: "35% OFF", stock: 40, dims: { w: 240, h: 220, d: 55 } },
  { id: "sofa-oslo", title: "Sofá 3 Lugares Oslo Linho Cinza", category: "Sala de estar", description: "Sofá retrátil com tecido linho, pés em madeira maciça e almofadas soltas. Conforto para toda a família.", image: sofa, oldPrice: 1899, price: 1399, badge: "Mais vendido", stock: 15, dims: { w: 210, h: 90, d: 95 } },
  { id: "cama-box-aurora", title: "Cama Box Queen com Cabeceira Aurora", category: "Quarto", description: "Conjunto box queen com colchão de molas ensacadas e cabeceira estofada em linho branco.", image: cama, oldPrice: 2599, price: 1899, badge: "Oferta", stock: 12, dims: { w: 160, h: 120, d: 200 } },
  { id: "mesa-jantar-bella", title: "Mesa de Jantar Bella com 6 Cadeiras", category: "Sala de jantar", description: "Mesa em madeira maciça com 6 cadeiras estofadas. Perfeita para reunir quem você ama.", image: mesa, oldPrice: 899, price: 699, badge: "Novo", stock: 8, dims: { w: 160, h: 78, d: 90 } },
];

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
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
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
  if (!c) throw new Error("CartProvider missing");
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
