import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar — Rainha do Lar" },
      { name: "description", content: "Acesse sua conta Rainha do Lar para acompanhar seus pedidos." },
      { property: "og:title", content: "Entrar — Rainha do Lar" },
      { property: "og:description", content: "Acesse sua conta e veja seus pedidos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/conta", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) nav({ to: "/conta", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setMsg("E-mail ou senha incorretos.");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin + "/conta", data: { nome } } });
      setMsg(error ? error.message : "Cadastro feito! Confirme pelo link que enviamos para o seu e-mail.");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg("Não foi possível entrar com o Google.");
  };

  const input = "w-full rounded-md border px-3 py-2.5";
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-bold text-navy">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <button onClick={google} className="mt-4 w-full rounded-md border py-2.5 font-semibold hover:bg-muted">Continuar com Google</button>
        <p className="my-4 text-center text-xs text-muted-foreground">ou com e-mail</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && <input className={input} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />}
          <input className={input} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Senha (mín. 6)" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          <button disabled={busy} className="w-full rounded-md bg-buy py-3 font-bold text-buy-foreground disabled:opacity-60">{mode === "in" ? "Entrar" : "Cadastrar"}</button>
        </form>
        {msg && <p className="mt-3 text-sm text-navy">{msg}</p>}
        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="mt-4 w-full text-sm text-link underline">
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
