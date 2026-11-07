import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { products as seed, type Product } from "./data";
import type { CartLine } from "./format";

export type Role = "owner" | "supervisor" | "cashier";
export type Sale = { id: string; ts: number; lines: CartLine[]; revenue: number; profit: number };
export type Profile = { id: string; full_name: string; phone: string; branch: string; email: string };

type State = {
  ready: boolean;
  userId: string | null;
  role: Role | null;
  profile: Profile | null;
  products: Product[];
  sales: Sale[];
};

const initial: State = { ready: false, userId: null, role: null, profile: null, products: seed, sales: [] };
let state: State = initial;
const subs = new Set<() => void>();
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
const useStore = () => useSyncExternalStore(subscribe, () => state, () => initial);

type ProductRow = {
  sku: string; name: string; brand: string; hsn: string; gst: number; cost: number; mrp: number; stock: number;
  avg_daily: number; vendor_id: string | null; lead_days: number; buffer: number; last_scan_days: number;
  rack: string; batch: string; expiry_days: number; category: string;
};
const toProduct = (r: ProductRow): Product => ({
  sku: r.sku, name: r.name, brand: r.brand, hsn: r.hsn, gst: +r.gst, cost: +r.cost, mrp: +r.mrp, stock: r.stock,
  avgDaily: +r.avg_daily, vendorId: r.vendor_id ?? "", leadDays: r.lead_days, buffer: r.buffer,
  lastScanDays: r.last_scan_days, rack: r.rack, batch: r.batch, expiryDays: r.expiry_days, category: r.category,
});
type SaleRow = { sale_no: string; created_at: string; lines: unknown; revenue: number; profit: number };
const toSale = (r: SaleRow): Sale => ({ id: r.sale_no, ts: new Date(r.created_at).getTime(), lines: r.lines as CartLine[], revenue: +r.revenue, profit: +r.profit });

export async function refreshData() {
  if (!state.userId) return;
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [p, s] = await Promise.all([
    supabase.from("products").select("*").order("sku"),
    supabase.from("sales").select("sale_no, created_at, lines, revenue, profit").gte("created_at", startOfDay.toISOString()).order("created_at", { ascending: false }),
  ]);
  set({
    products: p.data?.length ? (p.data as ProductRow[]).map(toProduct) : state.products,
    sales: (s.data as SaleRow[] | null)?.map(toSale) ?? [],
  });
}

async function loadUser(userId: string | null) {
  if (!userId) { set({ ...initial, ready: true }); return; }
  set({ userId });
  const [r, pr] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("id, full_name, phone, branch, email").eq("id", userId).maybeSingle(),
  ]);
  set({ role: (r.data?.role as Role) ?? null, profile: pr.data as Profile | null });
  await refreshData();
  set({ ready: true });
}

let started = false;
/** Call once on the client: tracks the signed-in user, their role and live data. */
export function hydrateStore() {
  if (started) return;
  started = true;
  supabase.auth.getUser().then(({ data }) => loadUser(data.user?.id ?? null));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      const id = session?.user.id ?? null;
      if (id !== state.userId || event === "USER_UPDATED") setTimeout(() => loadUser(id), 0);
    }
  });
  window.addEventListener("focus", () => { void refreshData(); });
}

export const useAuthState = () => {
  const s = useStore();
  return { ready: s.ready, userId: s.userId, role: s.role, profile: s.profile };
};
export const useProducts = () => useStore().products;
export const useSales = () => useStore().sales;

/** Records the sale in the database (price, cost and stock checked there). */
export async function completeSale(lines: CartLine[]): Promise<{ sale?: Sale; error?: string }> {
  const { data, error } = await supabase.rpc("complete_sale", { _lines: lines.map((l) => ({ sku: l.sku, qty: l.qty })) });
  if (error || !data) return { error: error?.message ?? "Sale failed" };
  await refreshData();
  return { sale: toSale(data as unknown as SaleRow) };
}

/** Manually set a product's on-hand count (owner/supervisor; enforced by RLS). */
export async function updateStock(sku: string, stock: number): Promise<string | null> {
  const { data, error } = await supabase.from("products").update({ stock, updated_at: new Date().toISOString() }).eq("sku", sku).select("sku");
  if (error) return error.message;
  if (!data?.length) return "You don't have permission to edit stock";
  await refreshData();
  return null;
}

export async function signOut() { await supabase.auth.signOut(); }
