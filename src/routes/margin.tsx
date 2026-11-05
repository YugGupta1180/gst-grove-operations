import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileWarning, Undo2, Radar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { priceHistory, shelfCounts, vendorById } from "@/lib/data";
import { useProducts } from "@/lib/store";
import { costCreepPct, inr, rtvEligible, rtvRecovery, shrinkage, RTV_WINDOW_DAYS } from "@/lib/format";

export const Route = createFileRoute("/margin")({
  head: () => ({
    meta: [
      { title: "Margin Protection & Audit · NexusRetail OS" },
      { name: "description", content: "Catch supplier cost creep, recover near-expiry stock from vendors and spot shrinkage." },
      { property: "og:title", content: "Margin Protection & Audit" },
      { property: "og:description", content: "Price-hike watchdog, RTV recovery and shrinkage radar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Margin,
});

function Margin() {
  const products = useProducts();
  const [done, setDone] = useState<Record<string, string>>({});
  const mark = (k: string, v: string) => setDone((d) => ({ ...d, [k]: v }));

  const creep = products
    .filter((p) => priceHistory[p.sku])
    .map((p) => {
      const h = priceHistory[p.sku]!;
      const pct = costCreepPct(h.prevCost, p.cost);
      return { p, h, pct, leak: (p.cost - h.prevCost) * p.avgDaily * 30, flagged: pct > 0 && !h.announced };
    })
    .sort((a, b) => b.pct - a.pct);
  const monthlyLeak = creep.filter((c) => c.flagged).reduce((s, c) => s + c.leak, 0);

  const rtv = products.filter((p) => rtvEligible(p.expiryDays) && p.stock > 0)
    .map((p) => ({ p, r: rtvRecovery(p.stock, p.cost, p.gst) }))
    .sort((a, b) => a.p.expiryDays - b.p.expiryDays);
  const rtvTotal = rtv.reduce((s, x) => s + x.r.total, 0);

  const shrink = products.filter((p) => shelfCounts[p.sku])
    .map((p) => ({ p, c: shelfCounts[p.sku]!, s: shrinkage(p.stock, shelfCounts[p.sku]!.counted, p.avgDaily) }))
    .sort((a, b) => b.s.gap * b.p.cost - a.s.gap * a.p.cost);
  const shrinkValue = shrink.filter((x) => x.s.flagged).reduce((s, x) => s + x.s.gap * x.p.cost, 0);

  return (
    <>
      <PageHeader title="Margin Protection & Audit" sub="Stop silent leaks: supplier cost creep, missed vendor returns and floor shrinkage." >
        <Pill tone="danger">High priority</Pill>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Cost creep leak / month" value={inr(monthlyLeak)} tone="text-destructive" />
        <Stat label="Recoverable via RTV" value={inr(rtvTotal)} tone="text-success" />
        <Stat label="Unexplained shrinkage" value={inr(shrinkValue)} tone="text-warning" />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4 text-destructive" />Supplier Price-Hike Watchdog</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr className="border-b border-border">
              <th className="py-2">SKU</th><th>Supplier</th><th>Latest invoice</th><th className="text-right">Historical</th><th className="text-right">Latest</th><th>Status</th><th className="text-right">Monthly impact</th><th />
            </tr></thead>
            <tbody>
              {creep.map(({ p, h, pct, leak, flagged }) => (
                <tr key={p.sku} className={flagged ? "border-b border-border bg-destructive/5" : "border-b border-border"}>
                  <td className="py-2"><div className="font-medium">{p.name}</div><div className="num text-xs text-muted-foreground">{p.sku}</div></td>
                  <td className="text-xs">{vendorById(p.vendorId).name}</td>
                  <td className="num text-xs">{h.invoice}</td>
                  <td className="num text-right">{inr(h.prevCost)}</td>
                  <td className={`num text-right ${flagged ? "font-semibold text-destructive" : ""}`}>{inr(p.cost)}</td>
                  <td>{flagged ? <Pill tone="danger">Cost Creep (+{pct}%)</Pill> : pct > 0 ? <Pill tone="muted">Announced +{pct}%</Pill> : <Pill tone="success">Stable</Pill>}</td>
                  <td className="num text-right">{flagged ? inr(leak) : "—"}</td>
                  <td className="text-right">
                    {flagged && (done[`d-${p.sku}`] ? <Pill tone="info">{done[`d-${p.sku}`]}</Pill> :
                      <Button size="sm" variant="destructive" onClick={() => {
                        const id = `RDN-${p.sku.slice(0, 3)}-${Date.now().toString().slice(-4)}`;
                        mark(`d-${p.sku}`, id);
                        toast.success(`Rate Dispute Note ${id} generated`, { description: `To ${vendorById(p.vendorId).name}: invoice ${h.invoice} billed ${inr(p.cost)} vs agreed ${inr(h.prevCost)} (+${pct}%). Requesting credit of ${inr((p.cost - h.prevCost) * p.stock)} on ${p.stock} units.` });
                      }}><FileWarning className="size-3.5" />Generate Rate Dispute Note</Button>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Undo2 className="size-4 text-success" />Return-to-Vendor Recovery Hub</CardTitle>
            <p className="text-xs text-muted-foreground">Batches with under {RTV_WINDOW_DAYS} days to expiry — still returnable to the supplier.</p></CardHeader>
          <CardContent className="space-y-3">
            {rtv.length === 0 && <p className="text-sm text-muted-foreground">No batches in the return window.</p>}
            {rtv.map(({ p, r }) => {
              const v = vendorById(p.vendorId);
              return (
                <div key={p.sku} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="text-sm font-medium">{p.name}</div><div className="num text-xs text-muted-foreground">Batch {p.batch} · {p.stock} units · {v.name}</div></div>
                    <Pill tone={p.expiryDays <= 7 ? "danger" : "warning"}>{p.expiryDays}d to expiry</Pill>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="num text-xs text-muted-foreground">{inr(r.taxable)} + GST {inr(r.gst)} = <span className="font-semibold text-success">{inr(r.total)}</span></div>
                    {done[`r-${p.sku}`] ? <Pill tone="info">{done[`r-${p.sku}`]}</Pill> :
                      <Button size="sm" variant="outline" onClick={() => {
                        const id = `DN-${Date.now().toString().slice(-5)}`;
                        mark(`r-${p.sku}`, `${id} raised`);
                        toast.success(`Debit Note ${id} & Return Challan ready`, { description: `${p.stock} × ${p.name} (batch ${p.batch}) back to ${v.name}. Recover ${inr(r.total, 2)} incl. GST.` });
                      }}>Generate Debit Note & Return Challan</Button>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Radar className="size-4 text-warning" />Shrinkage & Anomaly Radar</CardTitle>
            <p className="text-xs text-muted-foreground">System stock (after recorded sales) vs last physical shelf count.</p></CardHeader>
          <CardContent className="space-y-2">
            {shrink.map(({ p, c, s }) => (
              <div key={p.sku} className={`flex items-center justify-between gap-2 rounded-md border p-3 ${s.flagged ? "border-warning/40 bg-warning/5" : "border-border"}`}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="num text-xs text-muted-foreground">Expected {p.stock} · Counted {c.counted} · Sells {p.avgDaily}/day · Rack {p.rack}</div>
                  {s.flagged && <div className="mt-1 text-xs text-warning">{s.gap} units unaccounted ({s.pct.toFixed(1)}%) — check for floor theft or unrecorded damage</div>}
                </div>
                {s.flagged ? <Pill tone="danger">−{inr(s.gap * p.cost)}</Pill> : s.gap < 0 ? <Pill tone="info">+{-s.gap} surplus</Pill> : <Pill tone="success">OK</Pill>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`num mt-1 text-2xl font-semibold ${tone}`}>{value}</div></CardContent></Card>;
}
