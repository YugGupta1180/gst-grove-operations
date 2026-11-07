import type { Product } from "@/lib/data";
import { useProducts } from "@/lib/store";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shuffle, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShelfMap, expiryLabel, expiryTone } from "@/components/ShelfMap";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/storage")({
  head: () => ({
    meta: [
      { title: "Batch & FEFO Storage Radar · NexusRetail OS" },
      { name: "description", content: "First-expired-first-out rack health and daily shrinkage audits." },
      { property: "og:title", content: "Batch & FEFO Storage Radar" },
      { property: "og:description", content: "Rack-level expiry health and shrinkage micro-audits." },
    ],
  }),
  component: Storage,
});

function pickAudit(products: Product[]) {
  return [...products].sort((a, b) => b.cost * b.stock - a.cost * a.stock).slice(0, 9).sort(() => Math.random() - 0.5).slice(0, 5)
    .map((p) => ({ ...p, counted: "" as string }));
}

function Storage() {
  const products = useProducts();
  const [filter, setFilter] = useState("all");
  const [audit, setAudit] = useState(() => products.slice(0, 5).map((p) => ({ ...p, counted: "" })));
  const fefo = [...products].sort((a, b) => a.expiryDays - b.expiryDays);
  const match = (d: number) => filter === "all" || expiryTone(d) === filter;

  return (
    <>
      <PageHeader title="Batch & FEFO Storage Radar" sub="Shelves sorted first-expired, first-out. Pick the red batches first.">
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)} variant="outline" size="sm">
          <ToggleGroupItem value="all">All</ToggleGroupItem><ToggleGroupItem value="danger">Red</ToggleGroupItem>
          <ToggleGroupItem value="warning">Amber</ToggleGroupItem><ToggleGroupItem value="success">Green</ToggleGroupItem>
        </ToggleGroup>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-3">
        <ShelfMap products={products} filter={filter} />

        <div className="panel">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><ClipboardCheck className="size-4 text-primary" />Shrinkage micro-audit</div>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setAudit(pickAudit(products))}><Shuffle className="size-3.5" />Reshuffle</Button>
          </div>
          <div className="divide-y divide-border">
            {audit.map((a, i) => {
              const diff = a.counted === "" ? null : +a.counted - a.stock;
              return (
                <div key={a.sku} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm">{a.name}</div><div className="num text-[11px] text-muted-foreground">System {a.stock} · Rack {a.rack}</div></div>
                  <Input placeholder="Count" type="number" className="num h-7 w-20" value={a.counted} onChange={(e) => setAudit((l) => l.map((x, j) => j === i ? { ...x, counted: e.target.value } : x))} />
                  <div className="w-20 text-right">{diff === null ? <span className="text-xs text-muted-foreground">—</span> : diff === 0 ? <Pill tone="success">Match</Pill> : <Pill tone="danger">{diff > 0 ? "+" : ""}{diff} · {inr(Math.abs(diff) * a.cost)}</Pill>}</div>
                </div>
              );
            })}
          </div>
          <div className="p-3"><Button className="w-full" size="sm" disabled={audit.some((a) => a.counted === "")} onClick={() => toast.success("Audit reconciled", { description: "Variances posted to shrinkage ledger" })}>Submit audit</Button></div>
        </div>
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="border-b border-border p-4 text-sm font-medium">FEFO pick order</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>{["#", "Item", "Batch", "Rack", "Qty", "Days left", "Aging"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {fefo.filter((p) => match(p.expiryDays)).map((p, i) => (
              <tr key={p.sku}><td className="num px-3 py-2 text-muted-foreground">{i + 1}</td><td className="px-3 py-2">{p.name}</td><td className="num px-3 py-2">{p.batch}</td><td className="num px-3 py-2">{p.rack}</td><td className="num px-3 py-2">{p.stock}</td><td className="num px-3 py-2">{p.expiryDays}</td><td className="px-3 py-2"><Pill tone={expiryTone(p.expiryDays)}>{expiryLabel(p.expiryDays)}</Pill></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
