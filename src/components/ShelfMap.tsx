import { useState } from "react";
import { Pencil, Layers } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import { updateStock, useAuthState } from "@/lib/store";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill } from "@/components/AppShell";

export type ExpiryTone = "danger" | "warning" | "success";
export const expiryTone = (d: number): ExpiryTone => (d < 15 ? "danger" : d <= 60 ? "warning" : "success");
export const expiryLabel = (d: number) => (d < 15 ? "< 15d" : d <= 30 ? "15–30d" : d <= 60 ? "30–60d" : "> 60d");

const racks = ["A", "B", "C", "D", "E"];
const shelves = [1, 2, 3, 4];

const tileTone: Record<ExpiryTone, string> = {
  danger: "border-destructive/40 bg-destructive/12",
  warning: "border-warning/40 bg-warning/12",
  success: "border-success/30 bg-success/10",
};

export function ShelfMap({ products, filter }: { products: Product[]; filter: string }) {
  const { role } = useAuthState();
  const canEdit = role === "owner" || role === "supervisor";
  const [editing, setEditing] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [saving, setSaving] = useState(false);
  const match = (d: number) => filter === "all" || expiryTone(d) === filter;

  const totalShelves = racks.length * shelves.length;
  const stocked = products.filter((p) => racks.includes(p.rack[0]) && shelves.includes(+p.rack.slice(1))).length;

  const openEdit = (p: Product) => { setEditing(p); setNewStock(p.stock); };
  const saveStock = async () => {
    if (!editing) return;
    setSaving(true);
    const err = await updateStock(editing.sku, Math.max(0, Math.floor(newStock)));
    setSaving(false);
    if (err) toast.error(err);
    else { toast.success("Stock updated", { description: `${editing.name}: ${Math.max(0, Math.floor(newStock))} units` }); setEditing(null); }
  };

  return (
    <div className="panel p-4 xl:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium"><Layers className="size-4 text-primary" />Visual shelf map</div>
        <span className="num text-xs text-muted-foreground">{stocked} of {totalShelves} shelves stocked</span>
      </div>
      <div className="grid gap-3">
        {racks.map((r) => (
          <div key={r} className="flex items-center gap-3">
            <div className="num w-14 text-xs text-muted-foreground">Rack {r}</div>
            <div className="grid flex-1 grid-cols-4 gap-2">
              {shelves.map((s) => {
                const p = products.find((x) => x.rack === `${r}${s}`);
                if (!p) return <div key={s} className="h-16 rounded-md border border-dashed border-border" />;
                const t = expiryTone(p.expiryDays);
                return (
                  <button
                    type="button"
                    key={s}
                    title={p.name}
                    disabled={!canEdit}
                    onClick={() => openEdit(p)}
                    className={cn("group h-16 rounded-md border p-2 text-left transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:shadow-sm disabled:cursor-default",
                      tileTone[t], !match(p.expiryDays) && "opacity-20")}
                  >
                    <div className="num flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{r}{s} · {p.batch}</span>
                      {canEdit && <Pencil className="size-2.5 opacity-0 transition-opacity group-hover:opacity-100" />}
                    </div>
                    <div className="truncate text-xs font-medium">{p.name}</div>
                    <div className="num text-[10px]">{p.expiryDays}d left · {p.stock} u</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Shelf {editing?.rack} · {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Batch <span className="num text-foreground">{editing?.batch}</span></span>
              {editing && <Pill tone={expiryTone(editing.expiryDays)}>{expiryLabel(editing.expiryDays)} to expiry</Pill>}
            </div>
            <p className="text-muted-foreground">Unit value <span className="num text-foreground">{editing && inr(editing.cost)}</span> · Current count <span className="num text-foreground">{editing?.stock}</span> units</p>
            <Input type="number" min={0} className="num" value={newStock} autoFocus onChange={(e) => setNewStock(+e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveStock()} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={saving || newStock < 0} onClick={saveStock}>{saving ? "Saving…" : "Save count"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
