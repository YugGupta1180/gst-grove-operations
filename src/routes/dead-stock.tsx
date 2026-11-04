import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { products } from "@/lib/data";
import { inr, inrCompact } from "@/lib/format";

export const Route = createFileRoute("/dead-stock")({
  head: () => ({
    meta: [
      { title: "Dead-Stock Liquidation Studio · NexusRetail OS" },
      { name: "description", content: "Find non-moving SKUs, compute locked capital and launch clearance promos." },
      { property: "og:title", content: "Dead-Stock Liquidation Studio" },
      { property: "og:description", content: "Recover cash trapped in non-moving inventory." },
    ],
  }),
  component: DeadStock,
});

function DeadStock() {
  const [days, setDays] = useState("30");
  const [q, setQ] = useState("");
  const [markup, setMarkup] = useState([2]);
  const [done, setDone] = useState<Record<string, string>>({});
  const rows = products.filter((p) => p.lastScanDays >= +days && p.name.toLowerCase().includes(q.toLowerCase()));
  const locked = rows.reduce((s, p) => s + p.stock * p.cost, 0);
  const recover = rows.reduce((s, p) => s + p.stock * p.cost * (1 + (markup[0] ?? 0) / 100), 0);
  const act = (sku: string, label: string, desc: string) => { setDone((d) => ({ ...d, [sku]: label })); toast.success(label, { description: desc }); };

  return (
    <>
      <PageHeader title="Dead-Stock Liquidation Studio" sub="Zero-movement SKUs and the cash they're holding hostage.">
        <div className="relative"><Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter SKUs" className="h-8 w-56 pl-8" /></div>
        <Tabs value={days} onValueChange={setDays}><TabsList className="h-8"><TabsTrigger value="30">30d+</TabsTrigger><TabsTrigger value="60">60d+</TabsTrigger><TabsTrigger value="90">90d+</TabsTrigger></TabsList></Tabs>
      </PageHeader>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="panel p-4"><div className="text-xs text-muted-foreground">Capital locked ({rows.length} SKUs)</div><div className="num mt-1 text-2xl font-semibold text-warning">{inr(locked)}</div><div className="text-xs text-muted-foreground">{inrCompact(locked)} at landed cost</div></div>
        <div className="panel p-4 md:col-span-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Capital recovery calculator · clear at Cost + {markup[0]}%</span><span className="num text-base font-semibold text-success">{inr(recover)}</span></div>
          <Slider className="mt-4" value={markup} onValueChange={setMarkup} min={-20} max={20} step={1} />
          <div className="num mt-2 flex justify-between text-[11px] text-muted-foreground"><span>Cost −20%</span><span>Cost</span><span>Cost +20%</span></div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>{["SKU", "Idle", "Qty", "Cost", "MRP", "Locked", "AI recommendation", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => {
              const lock = p.stock * p.cost; const price = Math.round(p.cost * 1.02);
              const bogo = p.expiryDays < 60;
              return (
                <tr key={p.sku} className="hover:bg-accent/40">
                  <td className="px-3 py-2"><div className="max-w-60 truncate">{p.name}</div><div className="num text-[11px] text-muted-foreground">{p.sku} · HSN {p.hsn}</div></td>
                  <td className="px-3 py-2"><Pill tone={p.lastScanDays >= 90 ? "danger" : p.lastScanDays >= 60 ? "warning" : "muted"}>{p.lastScanDays}d</Pill></td>
                  <td className="num px-3 py-2">{p.stock}</td><td className="num px-3 py-2">{inr(p.cost)}</td><td className="num px-3 py-2">{inr(p.mrp)}</td>
                  <td className="num px-3 py-2 text-warning">{inr(lock)}</td>
                  <td className="px-3 py-2 text-xs"><div className="flex items-start gap-1.5"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {bogo ? `Expires in ${p.expiryDays}d — run Buy 1 Get 1 to clear before write-off.` : `Mark down ${inr(p.mrp)} → ${inr(price)} (Cost + 2%) to free ${inr(price * p.stock)}.`}</div></td>
                  <td className="px-3 py-2">{done[p.sku] ? <Pill tone="success">{done[p.sku]}</Pill> :
                    <Button size="sm" className="h-7 text-xs" onClick={() => bogo ? act(p.sku, "BOGO live", `${p.name} on POS + Blinkit`) : act(p.sku, `Repriced ${inr(price)}`, `Shelf labels queued for rack ${p.rack}`)}>
                      {bogo ? "Create BOGO promo" : "Apply markdown"}</Button>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No dead stock at this threshold.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
