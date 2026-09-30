import { useSyncExternalStore } from "react";

const KEY = "rdl-favs";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const subs = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { cache = []; }
  return cache!;
}

export function toggleFav(id: string) {
  const cur = read();
  cache = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(cache));
  subs.forEach((f) => f());
}

export function useFavs() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    read,
    () => EMPTY,
  );
}
