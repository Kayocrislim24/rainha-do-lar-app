import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useFavs } from "@/lib/favorites";
import logo from "@/assets/logo-r.png.asset.json";
import { LiveSearch } from "@/components/LiveSearch";
import { FreeShippingBar } from "@/components/FreeShippingBar";

export function SiteHeader() {
  const { count } = useCart();
  const favs = useFavs();
  const { user, isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-background shadow-sm">
      <div className="topbar-marquee overflow-hidden border-b-2 border-gold bg-navy text-xs font-bold uppercase tracking-wide text-primary-foreground sm:text-sm">
        <div className="topbar-track flex w-max gap-10 py-2.5">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center gap-10" aria-hidden={k === 1}>
              <span>👑 Sua casa digna de <span className="text-gold">uma rainha</span></span>
              <span>🔥 Ofertas imperdíveis todo dia</span>
              <span>💳 Parcele em até <span className="text-gold">12x</span></span>
              <span>🚚 Entrega própria em todo o DF</span>
              <span>Desconto especial no <span className="text-gold">PIX</span></span>
              <span>✨ Transforme seu lar hoje</span>
              <span>🛋️ Conforto que <span className="text-gold">cabe no seu bolso</span></span>
              <span>💛 Qualidade de rainha, <span className="text-gold">preço de amiga</span></span>
              <span>🎁 Aproveite antes que <span className="text-gold">acabe</span></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center gap-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr]">
        <LiveSearch big className="hidden md:block md:max-w-lg" placeholder="Encontre tudo sobre móveis e decoração..." />
        <Link to="/" className="flex shrink-0 items-center justify-center">
          <img src={logo.url} alt="Rainha do Lar" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center justify-end gap-4 text-navy sm:gap-7">
          {isAdmin && <Link to="/admin" className="hidden rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-navy sm:block">Painel</Link>}
          <Link to={user ? "/conta" : "/auth"} className="flex flex-col items-center gap-0.5 text-[11px] font-bold sm:text-xs"><User className="size-6" />Minha conta</Link>
          <Link to="/favoritos" className="relative hidden flex-col items-center gap-0.5 text-xs font-bold sm:flex"><Heart className={`size-6 ${favs.length ? "fill-gold text-gold" : ""}`} />Favoritos{favs.length > 0 && <span className="absolute -right-1 -top-2 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-primary-foreground">{favs.length}</span>}</Link>
          <a href="https://wa.me/5561981804734" target="_blank" rel="noopener noreferrer" className="hidden flex-col items-center gap-0.5 text-xs font-bold lg:flex"><MessageCircle className="size-6" />Atendimento</a>
          <Link to="/carrinho" className="relative flex flex-col items-center gap-0.5 text-[11px] font-bold sm:text-xs"><ShoppingCart className="size-6" />Carrinho{count > 0 && <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-navy">{count}</span>}</Link>
        </div>
      </div>
      <LiveSearch className="mx-4 mb-3 md:hidden" placeholder="O que você procura?" />
      <FreeShippingBar />
      <nav className="relative border-y bg-muted">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 overflow-x-auto px-4 text-xs font-semibold uppercase whitespace-nowrap text-muted-foreground lg:overflow-visible">
          {([["Sofás", "Sof"], ["Guarda-roupas", "Guarda"], ["Camas", "Cama"], ["Mesas de jantar", "Mesa"], ["Eletrodomésticos", "Geladeira"]] as const).map(([l, q]) => (
            <Link key={l} to="/busca" search={{ q }} className="shrink-0 py-3 hover:text-navy">{l}</Link>
          ))}
          <div className="group/mega shrink-0 lg:static">
            <Link to="/busca" search={{}} className="block border-r border-navy py-3 pr-6 font-bold text-navy">Ver todos</Link>
            <div className="invisible absolute left-0 right-0 top-full z-50 border-t-2 border-gold bg-background normal-case opacity-0 shadow-xl transition group-hover/mega:visible group-hover/mega:opacity-100">
              <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4">
                {([["Sala de estar", [["Sofás", "Sof"], ["Racks", "Rack"], ["Poltronas", "Poltrona"]]], ["Quarto", [["Camas", "Cama"], ["Guarda-roupas", "Guarda"], ["Cômodas", "Cômoda"]]], ["Sala de jantar", [["Mesas", "Mesa"], ["Cadeiras", "Cadeira"], ["Buffets", "Buffet"]]], ["Eletrodomésticos", [["Geladeiras", "Geladeira"], ["Fogões", "Fogão"], ["Máquinas de lavar", "Máquina"]]]] as const).map(([t, subs]) => (
                  <div key={t}><p className="text-sm font-bold uppercase text-gold">{t}</p><ul className="mt-2 space-y-1.5 font-semibold text-navy">{subs.map(([l, q]) => <li key={l}><Link to="/busca" search={{ q }} className="hover:text-gold">{l}</Link></li>)}</ul></div>
                ))}
              </div>
            </div>
          </div>
          <Link to="/busca" search={{}} className="shrink-0 py-3 hover:text-navy">Ofertas</Link>
          <Link to="/rastreio" className="shrink-0 py-3 hover:text-navy">Rastrear pedido</Link>
          <Link to="/ajuda" className="shrink-0 py-3 hover:text-navy">Ajuda</Link>
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
