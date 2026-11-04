import { useProducts, useSales } from "@/lib/store";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Sparkles, TrendingUp, Wallet, Archive, Percent, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aiAlerts, capitalTrend } from "@/lib/data";
import { inr, inrCompact, needsReorder } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Command Center · NexusRetail OS" },
      { name: "description", content: "Working capital, stockout risk, dead stock and margin at a glance." },
      { property: "og:title", content: "Executive Command Center · NexusRetail OS" },
      { property: "og:description", content: "Live retail KPIs and AI action feed." },
    ],
  }),
  component: Dashboard,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--muted-foreground)" } };

function Dashboard() {
  const products = useProducts();
  const sales = useSales();
  const posRev = sales.reduce((s, x) => s + x.revenue, 0);
  const posProfit = sales.reduce((s, x) => s + x.profit, 0);
  // MTD baseline before today's register sales
  const baseRev = 4200000, baseProfit = 785400;
  const margin = ((baseProfit + posProfit) / (baseRev + posRev)) * 100;
  const velocity = products.slice(0, 8).map((p) => ({
    name: p.brand === "Amul" ? p.name.split(" ").slice(0, 2).join(" ") : p.brand,
    runRate: p.avgDaily * 7, buffer: p.avgDaily * p.leadDays + p.buffer, stock: p.stock,
  }));
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(aiAlerts);
  const [filter, setFilter] = useState("all");
  const working = products.reduce((s, p) => s + p.stock * p.cost, 0) * 18.4;
  const risk = products.filter((p) => needsReorder(p.stock, p.avgDaily, p.leadDays, p.buffer) && p.avgDaily > 0).length;
  const dead = products.filter((p) => p.lastScanDays > 45).reduce((s, p) => s + p.stock * p.cost, 0);
  const shown = alerts.filter((a) => filter === "all" || a.severity === filter);

  return (
    <>
      <PageHeader title="Executive Command Center" sub="Tuesday, 3 Nov 2026 · Live across 1 store, 3 channels">
        <Button variant="outline" size="sm" onClick={() => toast.success("Report exported", { description: "nexus-cc-03-11-2026.pdf" })}>Export</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4 xl:col-span-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="size-3.5" />Working capital tied in stock</div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div><div className="num text-3xl font-semibold">{inrCompact(working)}</div><div className="mt-1 flex items-center gap-1 text-xs text-success"><TrendingUp className="size-3" />+4.1% vs last 30d</div></div>
            <div className="h-16 w-1/2">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={capitalTrend}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity={0.4} /><stop offset="1" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                <Area dataKey="value" stroke="var(--primary)" fill="url(#g)" strokeWidth={1.5} />
              </AreaChart></ResponsiveContainer>
            </div>
          </div>
        </div>
        <button onClick={() => navigate({ to: "/procurement" })} className="panel p-4 text-left transition-colors hover:border-destructive/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-3.5" />Stockout risk</div>
          <div className="mt-2 flex items-center gap-3"><span className="num text-3xl font-semibold text-destructive">{risk}</span><Pill tone="danger" className="pulse-risk">Below lead-time</Pill></div>
          <div className="mt-1 text-xs text-muted-foreground">SKUs under reorder point →</div>
        </button>
        <div className="grid gap-4">
          <button onClick={() => navigate({ to: "/dead-stock" })} className="panel p-4 text-left hover:border-warning/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Archive className="size-3.5" />Trapped in dead stock (&gt;45d)</div>
            <div className="num mt-1 text-xl font-semibold text-warning">{inrCompact(dead)}</div>
          </button>
          <div className="panel p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Percent className="size-3.5" />Gross margin MTD</div>
            <div className="num mt-1 text-xl font-semibold text-success">{margin.toFixed(2)}%</div>
            <div className="mt-1 text-xs text-muted-foreground">Register today: <span className="num text-success">+{inr(posProfit)}</span> profit · {sales.length} bills · {inr(posRev)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <div className="panel p-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between"><div><div className="text-sm font-medium">Velocity health map</div><div className="text-xs text-muted-foreground">7-day run-rate vs safety buffer vs on-hand (units)</div></div></div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%"><ComposedChart data={velocity}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tip} cursor={{ fill: "var(--accent)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="stock" name="On hand" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="runRate" name="7d run-rate" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Line dataKey="buffer" name="Reorder point" stroke="var(--destructive)" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart></ResponsiveContainer>
          </div>
        </div>

        <div className="panel flex flex-col xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" />AI action feed</div>
            <Tabs value={filter} onValueChange={setFilter}><TabsList className="h-7">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger><TabsTrigger value="critical" className="text-xs">Critical</TabsTrigger><TabsTrigger value="warning" className="text-xs">Warn</TabsTrigger>
            </TabsList></Tabs>
          </div>
          <div className="flex-1 divide-y divide-border overflow-auto">
            {shown.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">All clear. Nothing to action.</div>}
            {shown.map((a) => (
              <div key={a.id} className="group p-4">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-info"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.detail}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => { setAlerts((l) => l.filter((x) => x.id !== a.id)); toast.success(a.action, { description: a.impact }); }}>{a.action}</Button>
                      <Pill tone="success">{a.impact}</Pill>
                    </div>
                  </div>
                  <button aria-label="Dismiss" className="opacity-0 group-hover:opacity-100" onClick={() => setAlerts((l) => l.filter((x) => x.id !== a.id))}><X className="size-4 text-muted-foreground" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
