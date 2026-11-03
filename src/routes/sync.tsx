import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { channels, products } from "@/lib/data";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Omnichannel Stock Router · NexusRetail OS" },
      { name: "description", content: "Distribute stock across POS, Blinkit/Instamart and Shopify with walk-in safety reserves." },
      { property: "og:title", content: "Omnichannel Stock Router" },
      { property: "og:description", content: "Real-time stock split across offline and online channels." },
    ],
  }),
  component: Sync,
});

/** Split stock across channels; reserve locks 10% for walk-ins (POS only). */
function split(stock: number, reserve: boolean) {
  const locked = reserve ? Math.ceil(stock * 0.1) : 0;
  const free = stock - locked;
  const qc = Math.floor(free * 0.35), web = Math.floor(free * 0.15);
  return { pos: free - qc - web + locked, qc, web, locked };
}

function Sync() {
  const [global, setGlobal] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const on = (sku: string) => overrides[sku] ?? global;

  return (
    <>
      <PageHeader title="Omnichannel Stock Router" sub="Live allocation across counter, quick-commerce and web. Last sync 12s ago.">
        <div className="panel flex items-center gap-3 px-3 py-1.5"><Lock className="size-4 text-primary" /><span className="text-sm">Safety reserve (10%) for walk-ins</span>
          <Switch checked={global} onCheckedChange={(v) => { setGlobal(v); setOverrides({}); toast(v ? "Safety reserve enabled on all SKUs" : "Safety reserve disabled"); }} /></div>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.success("Pushed stock to 3 channels", { description: "Blinkit, Instamart, Shopify acknowledged" })}><RefreshCw className="size-3.5" />Sync now</Button>
      </PageHeader>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {channels.map((c, i) => (
          <div key={c.key} className="panel p-4">
            <div className="flex items-center justify-between"><span className="text-sm">{c.label}</span><Pill tone="success"><span className="size-1.5 rounded-full bg-success" />Live</Pill></div>
            <div className="num mt-2 text-2xl font-semibold">{products.reduce((s, p) => s + split(p.stock, on(p.sku))[c.key], 0).toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">units allocated · {["2,184", "1,042", "318"][i]} orders today</div>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>
            <th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium">Total</th>
            {channels.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
            <th className="px-3 py-2 font-medium">Reserve</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const s = split(p.stock, on(p.sku));
              return (
                <tr key={p.sku} className="hover:bg-accent/40">
                  <td className="px-3 py-2"><div className="max-w-64 truncate">{p.name}</div><div className="num text-[11px] text-muted-foreground">{p.sku}</div></td>
                  <td className="num px-3 py-2">{p.stock}</td>
                  {channels.map((c) => (
                    <td key={c.key} className="px-3 py-2">
                      <div className="num">{s[c.key]}{c.key === "pos" && s.locked > 0 && <span className="ml-1 text-[11px] text-primary">({s.locked} locked)</span>}</div>
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded bg-muted"><div className={c.key === "pos" ? "h-full bg-chart-1" : c.key === "qc" ? "h-full bg-chart-3" : "h-full bg-chart-2"} style={{ width: `${(s[c.key] / Math.max(1, p.stock)) * 100}%` }} /></div>
                    </td>
                  ))}
                  <td className="px-3 py-2"><Switch checked={on(p.sku)} onCheckedChange={(v) => setOverrides((o) => ({ ...o, [p.sku]: v }))} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
