export const PRODUCT_CATEGORIES = ["Sofás", "Guarda-roupas", "Camas", "Colchões", "Mesas", "Cadeiras", "Poltronas", "Racks e painéis", "Cômodas", "Armários de cozinha", "Sala de estar", "Sala de jantar", "Quarto", "Cozinha", "Eletrodomésticos", "Eletrônicos", "Decoração", "Geral"];

export const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
const compact = (text: string) => normalizeText(text).replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string> = {};
for (const category of PRODUCT_CATEGORIES) {
  const key = compact(category);
  aliases[key] = category;
  if (key.endsWith("s")) aliases[key.slice(0, -1)] = category;
}
Object.assign(aliases, { guardaroupa: "Guarda-roupas", guardaroupas: "Guarda-roupas", roupeiro: "Guarda-roupas", roupeiros: "Guarda-roupas", colchao: "Colchões", colchoes: "Colchões", rack: "Racks e painéis", racks: "Racks e painéis", painel: "Racks e painéis", paineis: "Racks e painéis", armariodecozinha: "Armários de cozinha", armariosdecozinha: "Armários de cozinha" });

export const canonicalCategory = (text: string) => aliases[compact(text)] ?? text.trim();
export const categoryKey = (text: string) => compact(canonicalCategory(text));
export const categoryMatches = (actual: string, expected: string) => categoryKey(actual) === categoryKey(expected);
export function categoryOptions(categories: string[], includePresets = true) {
  return Array.from(new Map([...(includePresets ? PRODUCT_CATEGORIES : []), ...categories].filter((c) => c.trim()).map((c) => [categoryKey(c), canonicalCategory(c)])).values());
}