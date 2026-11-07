import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { invoiceLines, vendors } from "@/lib/data";
import { gstSplit, inr } from "@/lib/format";

export const Route = createFileRoute("/receiving")({
  head: () => ({
    meta: [
      { title: "Inward Scanner & Invoice OCR · NexusRetail OS" },
      { name: "description", content: "Scan distributor challans, reconcile against POs and raise debit notes." },
      { property: "og:title", content: "Inward Scanner & Invoice OCR" },
      { property: "og:description", content: "OCR delivery challans and reconcile with purchase orders." },
    ],
  }),
  component: Receiving,
});

function Receiving() {
  const vendor = vendors[0]!;
  const [state, setState] = useState<"idle" | "scanning" | "done">("done");
  const [file, setFile] = useState("HUL_challan_88213.pdf");
  const [lines, setLines] = useState(invoiceLines);
  const [drag, setDrag] = useState(false);
  const [debit, setDebit] = useState<null | (typeof invoiceLines)[number]>(null);
  const [posted, setPosted] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const load = (name: string) => { setFile(name); setState("scanning"); setPosted(false); setTimeout(() => { setLines(invoiceLines); setState("done"); }, 1400); };
  const taxable = lines.reduce((s, l) => s + l.verified * l.rate, 0);
  const tax = lines.reduce((s, l) => { const g = gstSplit(l.verified * l.rate, l.gst); return { c: s.c + g.cgst, s: s.s + g.sgst }; }, { c: 0, s: 0 });
  const mismatches = lines.filter((l) => l.verified !== l.billed || l.billed !== l.po).length;

  return (
    <>
      <PageHeader title="Inward Scanner & Invoice OCR" sub="Drop a challan photo or PDF — line items, batches and GST are extracted automatically." />
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) load(f.name); }}
            onClick={() => ref.current?.click()}
            className={`grid-bg panel flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-10 text-center transition-colors ${drag ? "border-primary" : "hover:border-input"}`}>
            <UploadCloud className="size-8 text-primary" />
            <div className="text-sm font-medium">Drop challan or click to upload</div>
            <div className="text-xs text-muted-foreground">JPG, PNG, PDF · ITC, HUL, Nestlé formats supported</div>
            <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0].name)} />
          </div>
          <div className="panel p-4">
            <div className="flex items-center gap-3"><FileText className="size-5 text-muted-foreground" /><div className="min-w-0 flex-1"><div className="truncate text-sm">{file}</div><div className="text-xs text-muted-foreground">{state === "scanning" ? "Extracting…" : "OCR confidence 97.4%"}</div></div>
              {state === "scanning" ? <Loader2 className="size-4 animate-spin text-primary" /> : <CheckCircle2 className="size-4 text-success" />}</div>
          </div>
          <div className="panel space-y-2 p-4 text-sm">
            {[["Invoice no.", "HUL/24/88213"], ["Vendor", vendor.name], ["Vendor GSTIN", vendor.gstin], ["Invoice date", "01 Nov 2026"], ["Against PO", "PO-014-2026-1182"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="num text-right">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="text-sm font-medium">Reconciliation · PO vs challan vs verified</div>
            {mismatches > 0 ? <Pill tone="danger"><AlertTriangle className="size-3" />{mismatches} discrepancies</Pill> : <Pill tone="success">Fully matched</Pill>}
          </div>
          {state === "scanning" ? <div className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Reading line items…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr>
                {["Item", "HSN", "PO", "Billed", "Verified", "Batch", "Mfg", "Expiry", "Rate", "GST"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {lines.map((l, i) => {
                  const short = l.billed - l.verified; const poGap = l.po - l.billed;
                  return (
                    <tr key={l.sku} className={short > 0 ? "bg-destructive/8" : ""}>
                      <td className="px-3 py-2"><div className="max-w-56 truncate">{l.name}</div><div className="num text-[11px] text-muted-foreground">{l.sku}</div></td>
                      <td className="num px-3 py-2">{l.hsn}</td>
                      <td className="num px-3 py-2">{l.po}{poGap > 0 && <div className="text-[11px] text-warning">−{poGap} unbilled</div>}</td>
                      <td className="num px-3 py-2">{l.billed}</td>
                      <td className="space-y-1 px-3 py-2"><Input type="number" value={l.verified} className={`num h-7 w-16 ${short > 0 ? "border-destructive text-destructive" : ""}`}
                        onChange={(e) => setLines((ls) => ls.map((x, j) => j === i ? { ...x, verified: Math.max(0, +e.target.value) } : x))} />{short > 0 && <Button size="sm" variant="destructive" className="h-6 px-2 text-[11px]" onClick={() => setDebit(l)}>Debit {inr(short * l.rate * (1 + l.gst / 100))}</Button>}</td>
                      <td className="num px-3 py-2">{l.batch}</td>
                      <td className="num px-3 py-2 text-xs">{l.mfg}</td>
                      <td className="num px-3 py-2 text-xs">{l.exp}</td>
                      <td className="num px-3 py-2">{inr(l.rate)}</td>
                      <td className="num px-3 py-2">{l.gst}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>)}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-4">
            <div className="num flex gap-6 text-xs">
              <div><div className="text-muted-foreground">Taxable</div>{inr(taxable, 2)}</div>
              <div><div className="text-muted-foreground">CGST</div>{inr(tax.c, 2)}</div>
              <div><div className="text-muted-foreground">SGST</div>{inr(tax.s, 2)}</div>
              <div><div className="text-muted-foreground">IGST</div>{inr(0, 2)}</div>
              <div><div className="text-muted-foreground">Total</div><span className="font-semibold">{inr(taxable + tax.c + tax.s, 2)}</span></div>
            </div>
            <Button disabled={posted || state !== "done"} onClick={async () => {
              const { data: u } = await supabase.auth.getUser();
              const invoice_no = file === "HUL_challan_88213.pdf" ? "HUL/24/88213" : `GRN-014-${Date.now().toString().slice(-5)}`;
              const { error } = await supabase.from("inward_invoices").upsert({ invoice_no, vendor_id: vendor.id, file_name: file, status: "posted", lines, taxable, tax: tax.c + tax.s, created_by: u.user?.id ?? null, posted_at: new Date().toISOString() }, { onConflict: "invoice_no" });
              if (error) { toast.error("Couldn't save invoice", { description: error.message }); return; }
              setPosted(true); toast.success("Saved to inward ledger", { description: `${invoice_no} · ${lines.length} lines` });
            }}>
              {posted ? "Posted ✓" : "Approve & Push to Inward Ledger"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!debit} onOpenChange={(o) => !o && setDebit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Debit Note · {vendor.name}</DialogTitle></DialogHeader>
          {debit && (() => {
            const q = debit.billed - debit.verified; const g = gstSplit(q * debit.rate, debit.gst);
            return (
              <div className="num space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span>{debit.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Short qty</span><span>{q} × {inr(debit.rate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CGST {debit.gst / 2}%</span><span>{inr(g.cgst, 2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">SGST {debit.gst / 2}%</span><span>{inr(g.sgst, 2)}</span></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Claim total</span><span className="text-destructive">{inr(g.total, 2)}</span></div>
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setDebit(null)}>Cancel</Button>
            <Button onClick={() => { toast.success("Debit note DN-2026-0412 issued", { description: `Emailed to ${vendor.name}` }); setDebit(null); }}>Issue debit note</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
