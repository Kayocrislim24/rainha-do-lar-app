import { Link } from "@tanstack/react-router";

export function InfoPage({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-muted-foreground"><Link to="/" className="underline">Início</Link> › {title}</p>
      <h1 className="mt-3 text-3xl font-bold text-navy">{title}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-row flex-wrap gap-2 text-sm md:flex-col">
          {[["/sobre", "Sobre nós"], ["/entrega", "Política de entrega"], ["/trocas", "Trocas e devoluções"], ["/ajuda", "Dúvidas frequentes"]].map(([to, l]) => (
            <Link key={to} to={to as "/sobre"} className="rounded-md border px-3 py-2 font-semibold text-navy" activeProps={{ className: "bg-navy text-primary-foreground" }}>{l}</Link>
          ))}
        </nav>
        <div className="space-y-3">
          {items.map((x) => (
            <details key={x.q} open className="rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-bold text-navy">{x.q}</summary>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
