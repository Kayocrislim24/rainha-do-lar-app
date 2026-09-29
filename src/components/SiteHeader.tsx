import { Link } from "@tanstack/react-router";
import { Crown, CreditCard, Percent, ShoppingBag, Truck, User } from "lucide-react";
import { useCart } from "@/lib/store";

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header>
      <div className="bg-navy-deep text-primary-foreground text-xs sm:text-sm">
        <div className="mx-auto flex max-w-6xl justify-around gap-4 px-4 py-2">
          <span className="flex items-center gap-2"><CreditCard className="size-4 text-gold" />Até 12x no cartão</span>
          <span className="hidden sm:flex items-center gap-2"><Percent className="size-4 text-gold" />Desconto no PIX</span>
          <span className="flex items-center gap-2"><Truck className="size-4 text-gold" />Entrega própria no DF</span>
        </div>
      </div>
      <div className="bg-navy text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Crown className="size-8 text-gold" />
            <span className="text-2xl font-bold leading-none">Rainha<span className="text-gold"> do Lar</span></span>
          </Link>
          <input placeholder="O que você procura?" className="hidden md:block flex-1 rounded-md bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none" />
          <div className="ml-auto flex items-center gap-5">
            <span className="hidden sm:flex items-center gap-2 text-sm leading-tight"><User className="size-5" /><span>Entre ou cadastre-se<br /><span className="opacity-70">para ver seus pedidos</span></span></span>
            <Link to="/carrinho" className="relative" aria-label="Carrinho">
              <ShoppingBag className="size-6" />
              {count > 0 && <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-accent-foreground">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
      <nav className="bg-navy text-primary-foreground border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold whitespace-nowrap">
          {["Guarda-roupa", "Sala de estar", "Quarto", "Sala de jantar", "Ofertas da semana"].map((c) => (
            <Link key={c} to="/" className="hover:text-gold">{c}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function Price({ old, price, big }: { old: number; price: number; big?: boolean }) {
  const f = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <div>
      <p className={`text-price-old line-through ${big ? "text-base" : "text-sm"}`}>de {f(old)}</p>
      <p className={`font-bold text-price-new leading-tight ${big ? "text-4xl" : "text-2xl"}`}>{f(price)}</p>
    </div>
  );
}

export function WhatsFab() {
  return (
    <a href="https://wa.me/5561981804734" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-buy text-buy-foreground shadow-lg">
      <svg viewBox="0 0 24 24" className="size-7 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.4.1.1.1.6-.1 1.2Z" /></svg>
    </a>
  );
}
