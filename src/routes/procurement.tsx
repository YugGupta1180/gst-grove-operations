import { useProducts } from "@/lib/store";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vendorById, vendors, type Product } from "@/lib/data";
import { inr, needsReorder, reorderQty, SAFETY_BUFFER } from "@/lib/format";
import { updateStock, useAuthState } from "@/lib/store";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Autonomous Procurement Engine · NexusRetail OS" },
      { name: "description", content: "Auto-computed reorder suggestions and WhatsApp PO dispatch." },
      { property: "og:title", content: "Autonomous Procurement Engine" },
      { property: "og:description", content: "Reorder points, 15-day PO builder and distributor WhatsApp dispatch." },
    ],
  }),
  component: Procurement,
});

function Procurement() {
  const products = useProducts();
  const [vendor, setVendor] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Product | null>(null);
  const { role } = useAuthState();
  const canEdit = role === "owner" || role === "supervisor";
  const [editing, setEditing] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveStock = async () => {
    if (!editing) return;
    setSaving(true);
    const err = await updateStock(editing.sku, Math.max(0, Math.floor(newStock)));
    setSaving(false);
    if (err) toast.error(err); else { toast.success("Stock updated", { description: `${editing.name}: ${newStock} units` }); setEditing(null); }
  };

  const rows = useMemo(() => products
    .filter((p) => p.avgDaily > 0)
    .filter((p) => vendor === "all" || p.vendorId === vendor)
    .map((p) => ({ ...p, rop: p.avgDaily * p.leadDays + SAFETY_BUFFER, flag: p.status ? p.status === "Reorder Needed" : needsReorder(p.stock, p.avgDaily, p.leadDays), suggest: reorderQty(p.avgDaily) }))
    .filter((p) => showAll || p.flag), [vendor, showAll, products]);

  const q = (p: (typeof rows)[number]) => qty[p.sku] ?? p.suggest;
  const total = rows.reduce((s, p) => s + q(p) * p.cost, 0);
  const due = new Date(2026, 10, 3 + (preview?.leadDays ?? 0)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <PageHeader title="Autonomous Procurement Engine" sub="Reorder when Stock ≤ (Avg daily sales × Lead days) + Safety buffer · quantities cover a 15-day cycle">
        <Select value={vendor} onValueChange={setVendor}><SelectTrigger className="h-8 w-60"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All distributors</SelectItem>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" variant={showAll ? "secondary" : "outline"} onClick={() => setShowAll((s) => !s)}>{showAll ? "Showing all SKUs" : "Only flagged"}</Button>
      </PageHeader>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>
            {["SKU", "Category", "Cost", "Sell", "Stock", "Avg/day", "Lead", "Reorder pt", "Status", "Order qty", "Value", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.sku} className="hover:bg-accent/40">
                <td className="px-3 py-2"><div className="max-w-60 truncate">{p.name}</div><div className="num text-[11px] text-muted-foreground">{p.sku} · HSN {p.hsn}</div></td>
                <td className="max-w-32 truncate px-3 py-2 text-xs text-muted-foreground">{p.category}<div className="truncate">{vendorById(p.vendorId).name}</div></td>
                <td className="num px-3 py-2">{inr(p.cost)}</td>
                <td className="num px-3 py-2">{inr(p.mrp)}</td>
                <td className={`num px-3 py-2 ${p.flag ? "text-destructive" : ""}`}>
                  <div className="flex items-center gap-1">{p.stock}
                    {canEdit && <Button size="icon" variant="ghost" className="size-6" aria-label={`Edit stock for ${p.name}`} title="Edit Stock" onClick={() => { setEditing(p); setNewStock(p.stock); }}><Pencil className="size-3" /></Button>}
                  </div>
                </td>
                <td className="num px-3 py-2">{p.avgDaily}</td>
                <td className="num px-3 py-2">{p.leadDays}d</td>
                <td className="num px-3 py-2">{p.rop}</td>
                <td className="px-3 py-2">{sent.has(p.sku) ? <Pill tone="info">PO sent</Pill> : p.flag ? <Pill tone="danger">Reorder Needed</Pill> : <Pill tone="success">In Stock</Pill>}</td>
                <td className="px-3 py-2"><Input type="number" className="num h-7 w-20" value={q(p)} onChange={(e) => setQty((s) => ({ ...s, [p.sku]: Math.max(0, +e.target.value) }))} /></td>
                <td className="num px-3 py-2">{inr(q(p) * p.cost)}</td>
                <td className="px-3 py-2"><Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={q(p) === 0} onClick={() => setPreview(p)}><MessageCircle className="size-3.5 text-success" />Dispatch via WhatsApp</Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={12} className="p-10 text-center text-muted-foreground">No SKUs below reorder point for this distributor.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">{rows.length} lines · PO value (pre-GST)</span><span className="num font-semibold">{inr(total)}</span>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>WhatsApp preview · {preview && vendorById(preview.vendorId).phone}</DialogTitle></DialogHeader>
          {preview && (
            <div className="rounded-lg bg-muted p-4">
              <div className="ml-auto max-w-[90%] whitespace-pre-line rounded-lg rounded-tr-none bg-success/15 p-3 text-sm leading-relaxed">
{`*Purchase Order — PO-014-${preview.sku}*
To: ${vendorById(preview.vendorId).name}

*Item:* ${preview.name}
*HSN:* ${preview.hsn}
*Quantity:* ${q(preview as never)} units
*Rate:* ${inr(preview.cost)} + ${preview.gst}% GST
*Target delivery:* ${due}

*Bill to:* NexusMart Andheri West (Store #014)
GSTIN 27AAKCN4412R1Z9
Shop 4, Link Road, Mumbai 400053

Kindly confirm dispatch. 🙏`}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
            <Button className="gap-1" onClick={() => { if (preview) { setSent((s) => new Set(s).add(preview.sku)); toast.success("PO dispatched on WhatsApp", { description: vendorById(preview.vendorId).name }); } setPreview(null); }}><Send className="size-4" />Send PO</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit stock · {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Current count: <span className="num">{editing?.stock}</span> units</p>
            <Input type="number" min={0} className="num" value={newStock} autoFocus onChange={(e) => setNewStock(+e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveStock()} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={saving || newStock < 0} onClick={saveStock}>{saving ? "Saving…" : "Save count"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
