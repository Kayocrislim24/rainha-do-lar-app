import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/store";
import { SiteHeader, WhatsFab } from "@/components/SiteHeader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rainha do Lar" },
      { name: "description", content: "Móveis com ofertas e entrega no DF." },
      { property: "og:title", content: "Rainha do Lar" },
      { property: "og:description", content: "Móveis com ofertas e entrega no DF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: (props) => <ErrorComponent error={props.error} reset={props.reset} />,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SiteHeader />
        <Outlet />
        <footer className="mt-12 bg-navy-deep text-sm text-primary-foreground/80">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
            <div><p className="text-lg font-bold text-primary-foreground">Rainha<span className="text-gold"> do Lar</span></p><p className="mt-2">Móveis para sua casa com entrega própria no Distrito Federal.</p></div>
            <div><p className="font-bold text-gold">Ambientes</p><ul className="mt-2 space-y-1"><li>Sala de estar</li><li>Quarto</li><li>Sala de jantar</li><li>Guarda-roupas</li></ul></div>
            <div><p className="font-bold text-gold">Atendimento</p><ul className="mt-2 space-y-1"><li>WhatsApp (61) 98180-4734</li><li>Taguatinga - DF</li><li><Link to="/conta" className="hover:text-gold">Meus pedidos</Link></li><li><Link to="/rastreio" className="hover:text-gold">Rastrear pedido</Link></li></ul></div>
            <div><p className="font-bold text-gold">Pagamento</p><ul className="mt-2 space-y-1"><li>PIX com desconto</li><li>Cartão em até 12x</li><li>Compra segura</li></ul></div>
          </div>
          <p className="border-t border-primary-foreground/10 py-4 text-center text-xs">© Rainha do Lar · Todos os direitos reservados</p>
        </footer>
        <WhatsFab />
      </CartProvider>
    </QueryClientProvider>
  );
}
