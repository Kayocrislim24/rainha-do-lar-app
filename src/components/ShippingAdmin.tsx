import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { shippingCitiesKey, useShippingCities } from "@/lib/shipping";
import { brl } from "@/lib/store";

const empty = { id: "", name: "", state: "DF", price: "" };
export function ShippingAdmin() {
  const { data: cities = [], isLoading, isError } = useShippingCities();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price.replace(",", "."));
    if (form.name.trim().length < 2 || !/^[A-Z]{2}$/.test(form.state) || !form.price.trim() || !Number.isFinite(price) || price < 0) {
      setMessage("Informe a cidade, a UF e um valor válido para o frete."); return;
    }
    setBusy(true); setMessage("");
    const row = { name: form.name.trim(), state: form.state, price };
    const { error } = form.id
      ? await supabase.from("shipping_cities").update(row).eq("id", form.id)
      : await supabase.from("shipping_cities").insert(row);
    setBusy(false);
    if (error) { setMessage(error.code === "23505" ? "Esta cidade já está cadastrada. Edite o valor existente." : "Não foi possível salvar a cidade."); return; }
    setForm(empty); setMessage("Cidade salva!");
    await qc.invalidateQueries({ queryKey: shippingCitiesKey });
  }
  async function remove(id: string) {
    if (!window.confirm("Remover esta cidade das opções de entrega? Pedidos existentes serão preservados.")) return;
    setBusy(true);
    const { error } = await supabase.from("shipping_cities").delete().eq("id", id);
    setBusy(false);
    if (error) { setMessage("Não foi possível apagar a cidade."); return; }
    if (form.id === id) setForm(empty);
    setMessage("Cidade removida.");
    await qc.invalidateQueries({ queryKey: shippingCitiesKey });
  }
  const input = "mt-1 w-full min-w-0 rounded-md border bg-background px-3 py-2";
  return <section className="mt-6">
    <h2 className="text-lg font-bold text-navy">Cidades e valores de entrega</h2>
    <form onSubmit={save} className="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,2fr)_80px_minmax(0,1fr)_auto]">
      <label className="text-sm">Cidade<input required maxLength={100} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label className="text-sm">UF<input required maxLength={2} className={input} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></label>
      <label className="text-sm">Frete (R$)<input required inputMode="decimal" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
      <div className="flex gap-2"><Button type="submit" disabled={busy}>{form.id ? <Save /> : <Plus />}{form.id ? "Salvar" : "Adicionar cidade"}</Button>{form.id && <Button type="button" variant="outline" size="icon" aria-label="Cancelar edição" title="Cancelar edição" onClick={() => setForm(empty)}><X /></Button>}</div>
    </form>
    {message && <p role="status" className="mt-3 text-sm text-navy">{message}</p>}
    {isLoading ? <p className="mt-4">Carregando cidades...</p> : isError ? <p className="mt-4 text-destructive">Não foi possível carregar as cidades.</p> : !cities.length ? <p className="mt-6 text-muted-foreground">Nenhuma cidade cadastrada.</p> : <div className="mt-6 divide-y border-y">
      {cities.map((city) => <div key={city.id} className="flex flex-wrap items-center gap-3 py-3">
        <span className="min-w-0 flex-1 break-words font-semibold">{city.name}/{city.state}</span><span className="font-bold text-navy">{brl(city.price)}</span>
        <Button variant="outline" size="icon" disabled={busy} aria-label={`Editar ${city.name}`} title="Editar cidade" onClick={() => { setForm({ ...city, price: String(city.price) }); setMessage(""); }}><Pencil /></Button>
        <Button variant="outline" size="icon" disabled={busy} aria-label={`Apagar ${city.name}`} title="Apagar cidade" onClick={() => remove(city.id)}><Trash2 className="text-destructive" /></Button>
      </div>)}
    </div>}
  </section>;
}