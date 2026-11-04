import { useSyncExternalStore } from "react";
import { products as seed, type Product } from "./data";
import { saleTotals, type CartLine } from "./format";

export type Sale = { id: string; ts: number; lines: CartLine[]; revenue: number; profit: number };
type State = { stock: Record<string, number>; sales: Sale[] };

const KEY = "nexus-pos-v1";
const initial: State = { stock: Object.fromEntries(seed.map((p) => [p.sku, p.stock])), sales: [] };
let state: State = initial;
const subs = new Set<() => void>();
const emit = () => { subs.forEach((f) => f()); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };

export function hydrateStore() {
  try { const raw = localStorage.getItem(KEY); if (raw) { state = { ...initial, ...JSON.parse(raw) }; subs.forEach((f) => f()); } } catch { /* ignore */ }
}

const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
const useStore = () => useSyncExternalStore(subscribe, () => state, () => initial);

/** Products with live stock levels. */
export function useProducts(): Product[] {
  const s = useStore();
  return seed.map((p) => ({ ...p, stock: s.stock[p.sku] ?? p.stock }));
}
export const useSales = () => useStore().sales;

/** Deducts stock and records the sale. Returns null if any line exceeds stock. */
export function completeSale(lines: CartLine[]): Sale | null {
  if (!lines.length || lines.some((l) => l.qty <= 0 || l.qty > (state.stock[l.sku] ?? 0))) return null;
  const { revenue, profit } = saleTotals(lines);
  const sale: Sale = { id: `INV-${Date.now().toString().slice(-6)}`, ts: Date.now(), lines, revenue, profit };
  const stock = { ...state.stock };
  lines.forEach((l) => { stock[l.sku] = (stock[l.sku] ?? 0) - l.qty; });
  state = { stock, sales: [sale, ...state.sales] };
  emit();
  return sale;
}

export function resetStore() { state = initial; emit(); }
