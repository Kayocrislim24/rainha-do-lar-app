import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import logo from "@/assets/logo-r.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-12">
      <div className="bg-navy-deep text-sm text-primary-foreground/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1"><img src={logo.url} alt="Rainha do Lar" className="h-14 w-auto" /><p className="mt-3">Móveis e eletrodomésticos para sua casa com entrega própria no Distrito Federal.</p></div>
          <Col t="Departamentos" items={[["Sala de estar", "Sof"], ["Quarto", "Cama"], ["Guarda-roupas", "Guarda"], ["Sala de jantar", "Mesa"], ["Ofertas", ""]].map(([l, q]) => <Link key={l} to="/busca" search={q ? { q } : {}} className="hover:text-gold">{l}</Link>)} />
          <Col t="Institucional" items={[<Link key="s" to="/sobre" className="hover:text-gold">Sobre a Rainha do Lar</Link>, <Link key="e" to="/entrega" className="hover:text-gold">Política de entrega</Link>, <Link key="t" to="/trocas" className="hover:text-gold">Trocas e devoluções</Link>, <Link key="a" to="/ajuda" className="hover:text-gold">Dúvidas frequentes</Link>]} />
          <Col t="Minha conta" items={[<Link key="c" to="/conta" className="hover:text-gold">Meus pedidos</Link>, <Link key="f" to="/favoritos" className="hover:text-gold">Favoritos</Link>, <Link key="k" to="/carrinho" className="hover:text-gold">Carrinho</Link>]} />
          <div><p className="font-bold uppercase text-gold">Atendimento</p><ul className="mt-3 space-y-2"><li className="flex items-center gap-2"><MessageCircle className="size-4 text-gold" />(61) 98180-4734</li><li>Taguatinga - DF</li><li>Seg a Sáb, 8h às 18h</li></ul>
            <p className="mt-4 font-bold uppercase text-gold">Pagamento</p><div className="mt-2 flex flex-wrap gap-2 text-xs">{["PIX", "Visa", "Master", "Elo", "Amex", "Hipercard"].map((x) => <span key={x} className="rounded bg-background px-2 py-1 font-bold text-navy">{x}</span>)}</div></div>
        </div>
        <p className="border-t border-primary-foreground/10 px-4 py-4 text-center text-xs">© Rainha do Lar · Todos os direitos reservados · Preços e condições válidos apenas para compras no site.</p>
      </div>
    </footer>
  );
}

function Col({ t, items }: { t: string; items: React.ReactNode[] }) {
  return <div><p className="font-bold uppercase text-gold">{t}</p><ul className="mt-3 space-y-2">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}
