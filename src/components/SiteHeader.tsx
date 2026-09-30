import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useFavs } from "@/lib/favorites";
import logo from "@/assets/logo-r.png.asset.json";

export function SiteHeader() {
  const { count } = useCart();
  const favs = useFavs();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-background shadow-sm">
      <div className="topbar-marquee overflow-hidden border-b-2 border-gold bg-navy text-xs font-bold uppercase tracking-wide text-primary-foreground sm:text-sm">
        <div className="topbar-track flex w-max gap-10 py-2.5">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center gap-10" aria-hidden={k === 1}>
              <span>👑 Fornecedora de <span className="text-gold">móveis e eletrodomésticos</span></span>
              <span className="rounded-full bg-gold px-3 py-0.5 text-navy">🏷️ Preço de atacado</span>
              <span>💳 Parcele em até <span className="text-gold">12x</span></span>
              <span>🚚 Entrega própria em todo o DF</span>
              <span>Desconto especial no <span className="text-gold">PIX</span></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-1.5">
          <img src={logo.url} alt="Rainha do Lar" className="h-12 w-auto" />
        </Link>
        <form className="relative hidden flex-1 md:block" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); navigate({ to: "/busca", search: q ? { q } : {} }); }}>
          <input name="q" placeholder="Busque por produtos, ambientes, marcas..." className="w-full rounded-full border-2 border-border bg-muted px-5 py-3 pr-12 text-sm outline-none focus:border-navy" />
          <button aria-label="Buscar" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-navy text-primary-foreground"><Search className="size-4" /></button>
        </form>
        <div className="ml-auto flex items-center gap-5 text-navy">
          <span className="hidden items-center gap-1.5 text-xs leading-tight lg:flex"><MapPin className="size-5" />Entregamos<br />no DF</span>
          {isAdmin && <Link to="/admin" className="hidden rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-navy sm:block">Painel</Link>}
          <Link to={user ? "/conta" : "/auth"} className="flex items-center gap-1.5 text-xs leading-tight"><User className="size-6" /><span className="hidden sm:inline">{user ? <>Olá!<br /><b>Minha conta</b></> : <>Olá, visitante<br /><b>Entre ou cadastre-se</b></>}</span></Link>
          <Link to="/favoritos" aria-label="Favoritos" className="relative hidden sm:block"><Heart className={`size-6 ${favs.length ? "fill-gold text-gold" : ""}`} />{favs.length > 0 && <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-primary-foreground">{favs.length}</span>}</Link>
          <Link to="/carrinho" className="relative" aria-label="Carrinho">
            <ShoppingCart className="size-7" />
            {count > 0 && <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-navy">{count}</span>}
          </Link>
        </div>
      </div>
      <form className="relative mx-4 mb-3 md:hidden" onSubmit={(e) => { e.preventDefault(); const q = String(new FormData(e.currentTarget).get("q") ?? "").trim(); navigate({ to: "/busca", search: q ? { q } : {} }); }}>
        <input name="q" placeholder="O que você procura?" className="w-full rounded-full border-2 border-border bg-muted px-4 py-2.5 pr-12 text-sm outline-none focus:border-navy" />
        <button aria-label="Buscar" className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-navy text-primary-foreground"><Search className="size-4" /></button>
      </form>
      <nav className="border-t">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-3 text-sm font-semibold whitespace-nowrap text-navy">
          <Link to="/busca" search={{}} className="hover:text-gold">Todos os departamentos</Link>
          {[["Sala de estar", "Sof"], ["Quarto", "Cama"], ["Guarda-roupas", "Guarda"], ["Sala de jantar", "Mesa"], ["Sofás", "Sof"], ["Camas", "Cama"], ["Mesas", "Mesa"]].map(([l, c]) => (
            <Link key={l} to="/busca" search={{ q: c }} className="hover:text-gold">{l}</Link>
          ))}
          <Link to="/busca" search={{}} className="font-bold text-gold">Ofertas</Link>
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
    <a
      href={`https://wa.me/5561981804734?text=${encodeURIComponent("Olá, Rainha do Lar! Vim pelo site e gostaria de atendimento.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      onClick={(e) => {
        const w = window.open(e.currentTarget.href, "_blank"); if (w) w.opener = null;
        if (w) e.preventDefault();
        else { e.preventDefault(); window.top ? (window.top.location.href = e.currentTarget.href) : (window.location.href = e.currentTarget.href); }
      }}
      className="fixed bottom-5 right-5 z-[9999] grid size-14 cursor-pointer place-items-center rounded-full bg-[#25D366] text-[#ffffff] shadow-lg transition hover:scale-110 hover:bg-[#1ebe5b]"
    >
      <svg viewBox="0 0 24 24" className="size-7 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.4.1.1.1.6-.1 1.2Z" /></svg>
    </a>
  );
}
