import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Minus, Plus, ScanBarcode, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeSale, useProducts, useSales } from "@/lib/store";
import { inr, saleTotals, type CartLine } from "@/lib/format";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Quick POS / Register · NexusRetail OS" },
      { name: "description", content: "Scan or pick products, complete sales and update stock instantly." },
      { property: "og:title", content: "Quick POS / Register" },
      { property: "og:description", content: "Fast counter billing that deducts inventory in real time." },
    ],
  }),
  component: Pos,
});

function Pos() {
  const products = useProducts();
  const sales = useSales();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [q, setQ] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  const stockOf = (sku: string) => products.find((p) => p.sku === sku)?.stock ?? 0;
  const inCart = (sku: string) => cart.find((l) => l.sku === sku)?.qty ?? 0;

  const add = (sku: string) => {
    const p = products.find((x) => x.sku === sku);
    if (!p) return toast.error("Product not found", { description: sku });
    if (inCart(sku) >= p.stock) return toast.error("Not enough stock", { description: `${p.stock} left of ${p.name}` });
    setCart((c) => c.some((l) => l.sku === sku)
      ? c.map((l) => (l.sku === sku ? { ...l, qty: l.qty + 1 } : l))
      : [...c, { sku, name: p.name, qty: 1, price: p.mrp, cost: p.cost }]);
  };
  const setQty = (sku: string, qty: number) =>
    setCart((c) => c.map((l) => (l.sku === sku ? { ...l, qty: Math.min(Math.max(1, qty), stockOf(sku)) } : l)));

  const onScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = q.trim().toUpperCase();
    const exact = products.find((p) => p.sku === code);
    const match = exact ?? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))[0];
    if (code && match) { add(match.sku); setQ(""); } else if (code) toast.error("No product matches", { description: q });
  };

  const { revenue, profit } = saleTotals(cart);
  const checkout = () => {
    const sale = completeSale(cart);
    if (!sale) return toast.error("Sale failed", { description: "A quantity exceeds stock on hand." });
    setCart([]);
    toast.success(`Sale ${sale.id} completed`, { description: `${inr(sale.revenue)} billed · ${inr(sale.profit)} profit added to dashboard` });
    scanRef.current?.focus();
  };

  const list = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.includes(q.toUpperCase()));

  return (
    <>
      <PageHeader title="Quick POS / Register" sub="Scan a barcode / SKU or tap a product. Completing a sale deducts stock everywhere instantly." />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <form onSubmit={onScan} className="relative">
            <ScanBarcode className="absolute left-3 top-2.5 size-5 text-primary" />
            <Input ref={scanRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Scan barcode / type SKU or name, then press Enter" className="num h-10 pl-11" />
          </form>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => {
              const left = p.stock - inCart(p.sku);
              return (
                <button key={p.sku} onClick={() => add(p.sku)} disabled={left <= 0}
                  className="panel p-3 text-left transition-colors hover:border-primary/60 disabled:opacity-40">
                  <div className="line-clamp-2 min-h-10 text-sm font-medium">{p.name}</div>
                  <div className="num mt-1 text-[11px] text-muted-foreground">{p.sku}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="num font-semibold">{inr(p.mrp)}</span>
                    <Pill tone={left <= 0 ? "danger" : left < 20 ? "warning" : "muted"}>{left} in stock</Pill>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel flex flex-col">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Receipt className="size-4 text-primary" />Current bill</div>
              {cart.length > 0 && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCart([])}>Clear</Button>}
            </div>
            <div className="max-h-96 divide-y divide-border overflow-auto">
              {cart.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Scan or tap a product to start a bill.</div>}
              {cart.map((l) => (
                <div key={l.sku} className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm">{l.name}</div><div className="num text-[11px] text-muted-foreground">{inr(l.price)} each</div></div>
                  <Button size="icon" variant="outline" className="size-7" aria-label="Decrease" onClick={() => setQty(l.sku, l.qty - 1)}><Minus className="size-3" /></Button>
                  <Input type="number" value={l.qty} onChange={(e) => setQty(l.sku, +e.target.value)} className="num h-7 w-12 px-1 text-center" />
                  <Button size="icon" variant="outline" className="size-7" aria-label="Increase" onClick={() => add(l.sku)}><Plus className="size-3" /></Button>
                  <div className="num w-20 text-right text-sm">{inr(l.price * l.qty)}</div>
                  <button aria-label="Remove" onClick={() => setCart((c) => c.filter((x) => x.sku !== l.sku))}><Trash2 className="size-4 text-muted-foreground hover:text-destructive" /></button>
                </div>
              ))}
            </div>
            <div className="num space-y-1 border-t border-border p-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Items</span><span>{cart.reduce((s, l) => s + l.qty, 0)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Profit on bill</span><span className="text-success">{inr(profit)}</span></div>
              <div className="flex justify-between text-lg font-semibold"><span>Total (incl. GST)</span><span>{inr(revenue)}</span></div>
              <Button className="mt-3 w-full" size="lg" disabled={!cart.length} onClick={checkout}>Complete Sale</Button>
            </div>
          </div>

          <div className="panel">
            <div className="border-b border-border p-4 text-sm font-medium">Today's bills</div>
            <div className="max-h-64 divide-y divide-border overflow-auto">
              {sales.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">No sales yet.</div>}
              {sales.map((s) => (
                <div key={s.id} className="num flex items-center justify-between p-3 text-xs">
                  <div><div className="text-sm">{s.id}</div><div className="text-muted-foreground">{new Date(s.ts).toLocaleTimeString("en-IN")} · {s.lines.reduce((a, l) => a + l.qty, 0)} items</div></div>
                  <div className="text-right"><div className="text-sm">{inr(s.revenue)}</div><div className="text-success">+{inr(s.profit)}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
