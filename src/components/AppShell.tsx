import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, ScanLine, ShoppingCart, Layers, Network, PackageX,
  type LucideIcon, ChevronsLeft, Search, Command as CmdIcon, Bell, Store, Package, Truck, FileText,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { navItems, products, vendors, invoiceLines } from "@/lib/data";
import { cn } from "@/lib/utils";

const icons: LucideIcon[] = [LayoutDashboard, ScanLine, ShoppingCart, Layers, Network, PackageX];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const go = (to: string) => { setOpen(false); navigate({ to }); };
  const current = navItems.find((n) => path.startsWith(n.to));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200", collapsed ? "w-16" : "w-60")}>
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Store className="size-4" /></div>
          {!collapsed && <div className="leading-tight"><div className="text-sm font-semibold">NexusRetail OS</div><div className="text-[10px] text-muted-foreground">Andheri West · Store #014</div></div>}
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((n, i) => {
            const Icon = icons[i] ?? Package;
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} title={n.label}
                className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed((c) => !c)} className="m-2 flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent">
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur">
          <div className="text-sm"><span className="text-muted-foreground">Operations /</span> <span className="font-medium">{current?.label}</span></div>
          <button onClick={() => setOpen(true)} className="ml-auto flex w-80 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-input">
            <Search className="size-4" /> Search SKUs, suppliers, invoices…
            <kbd className="num ml-auto flex items-center gap-0.5 rounded border border-border px-1.5 text-[10px]"><CmdIcon className="size-3" />K</kbd>
          </button>
          <button className="relative rounded-md p-2 hover:bg-accent" onClick={() => go("/dashboard")} aria-label="Alerts">
            <Bell className="size-4" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          </button>
          <div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">YG</div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search SKUs, suppliers, invoices, modules…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Modules">
            {navItems.map((n, i) => { const Icon = icons[i] ?? Package; return <CommandItem key={n.to} onSelect={() => go(n.to)}><Icon className="size-4" />{n.label}</CommandItem>; })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="SKUs">
            {products.map((p) => (
              <CommandItem key={p.sku} value={`${p.name} ${p.sku} ${p.hsn}`} onSelect={() => go(p.lastScanDays > 30 ? "/dead-stock" : "/procurement")}>
                <Package className="size-4" /><span className="truncate">{p.name}</span><span className="num ml-auto text-xs text-muted-foreground">{p.sku}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Suppliers">
            {vendors.map((v) => (
              <CommandItem key={v.id} value={`${v.name} ${v.gstin}`} onSelect={() => go("/procurement")}>
                <Truck className="size-4" /><span className="truncate">{v.name}</span><span className="num ml-auto text-xs text-muted-foreground">{v.gstin}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Invoices">
            <CommandItem value="HUL/24/88213 invoice" onSelect={() => go("/receiving")}><FileText className="size-4" />HUL/24/88213<span className="ml-auto text-xs text-muted-foreground">{invoiceLines.length} lines · pending</span></CommandItem>
            <CommandItem value="AWL/INV/55102 invoice" onSelect={() => go("/receiving")}><FileText className="size-4" />AWL/INV/55102<span className="ml-auto text-xs text-muted-foreground">posted</span></CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{sub}</p></div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

type Tone = "success" | "warning" | "danger" | "info" | "muted";
const tones: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  info: "bg-info/12 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
};
export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>{children}</span>;
}
