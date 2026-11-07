export type Product = {
  /** Database-computed: "Reorder Needed" | "In Stock" */
  status?: string;
  sku: string;
  name: string;
  brand: string;
  hsn: string;
  gst: number;
  cost: number;
  mrp: number;
  stock: number;
  avgDaily: number;
  vendorId: string;
  leadDays: number;
  buffer: number;
  lastScanDays: number;
  rack: string;
  batch: string;
  expiryDays: number;
  category: string;
};

export const vendors = [
  { id: "V01", name: "HUL North Distribution", gstin: "07AAACH1004N1Z3", city: "New Delhi", phone: "+91 98110 22341", state: "Delhi" },
  { id: "V02", name: "Adani Wilmar Hub", gstin: "24AABCA8056G1ZK", city: "Ahmedabad", phone: "+91 98250 77104", state: "Gujarat" },
  { id: "V03", name: "Gujarat Co-operative Milk Marketing Federation", gstin: "24AAAAG5588Q1ZJ", city: "Anand", phone: "+91 99090 11420", state: "Gujarat" },
  { id: "V04", name: "Nestlé India Distributors", gstin: "07AAACN0255D1ZB", city: "Gurugram", phone: "+91 98731 55290", state: "Haryana" },
  { id: "V05", name: "ITC Foods Channel Partner", gstin: "19AAACI5950L1Z7", city: "Kolkata", phone: "+91 98300 44812", state: "West Bengal" },
  { id: "V06", name: "Tata Consumer Products Depot", gstin: "27AAACT3518Q1ZW", city: "Mumbai", phone: "+91 98201 66310", state: "Maharashtra" },
];

export const vendorById = (id: string) => vendors.find((v) => v.id === id)!;

export const products: Product[] = [
  { sku: "FOR-SUN-1L", name: "Fortune Sunlite Sunflower Oil 1L", brand: "Fortune", hsn: "1512", gst: 5, cost: 132, mrp: 165, stock: 46, avgDaily: 18, vendorId: "V02", leadDays: 3, buffer: 20, lastScanDays: 0, rack: "A1", batch: "FS2409K", expiryDays: 182, category: "Edible Oil" },
  { sku: "AMU-BUT-500", name: "Amul Butter 500g", brand: "Amul", hsn: "0405", gst: 12, cost: 248, mrp: 285, stock: 22, avgDaily: 9, vendorId: "V03", leadDays: 2, buffer: 8, lastScanDays: 0, rack: "C2", batch: "AB1188", expiryDays: 21, category: "Dairy" },
  { sku: "MAG-NDL-280", name: "Maggi 2-Minute Noodles 280g", brand: "Maggi", hsn: "1902", gst: 12, cost: 48, mrp: 56, stock: 310, avgDaily: 34, vendorId: "V04", leadDays: 4, buffer: 40, lastScanDays: 0, rack: "B3", batch: "MG55T2", expiryDays: 96, category: "Packaged Food" },
  { sku: "TAT-SLT-1KG", name: "Tata Salt 1kg", brand: "Tata", hsn: "2501", gst: 0, cost: 23, mrp: 28, stock: 58, avgDaily: 26, vendorId: "V06", leadDays: 3, buffer: 30, lastScanDays: 0, rack: "B1", batch: "TS0921", expiryDays: 540, category: "Staples" },
  { sku: "ASH-ATA-5KG", name: "Aashirvaad Shudh Chakki Atta 5kg", brand: "Aashirvaad", hsn: "1101", gst: 5, cost: 238, mrp: 289, stock: 34, avgDaily: 14, vendorId: "V05", leadDays: 5, buffer: 15, lastScanDays: 0, rack: "A3", batch: "AA7712", expiryDays: 64, category: "Staples" },
  { sku: "DET-HW-RF", name: "Dettol Original Liquid Handwash Refill 750ml", brand: "Dettol", hsn: "3401", gst: 18, cost: 99, mrp: 129, stock: 140, avgDaily: 2, vendorId: "V01", leadDays: 4, buffer: 10, lastScanDays: 52, rack: "D2", batch: "DT3390", expiryDays: 420, category: "Home Care" },
  { sku: "AMU-TAZ-1L", name: "Amul Taaza Toned Milk 1L", brand: "Amul", hsn: "0401", gst: 0, cost: 62, mrp: 68, stock: 72, avgDaily: 40, vendorId: "V03", leadDays: 1, buffer: 30, lastScanDays: 0, rack: "C1", batch: "A29", expiryDays: 4, category: "Dairy" },
  { sku: "BRI-BRD-400", name: "Britannia Whole Wheat Bread 400g", brand: "Britannia", hsn: "1905", gst: 0, cost: 38, mrp: 50, stock: 25, avgDaily: 22, vendorId: "V05", leadDays: 1, buffer: 10, lastScanDays: 0, rack: "C3", batch: "BB0411", expiryDays: 3, category: "Bakery" },
  { sku: "SUR-XL-1KG", name: "Surf Excel Easy Wash 1kg", brand: "HUL", hsn: "3402", gst: 18, cost: 112, mrp: 140, stock: 88, avgDaily: 1, vendorId: "V01", leadDays: 4, buffer: 10, lastScanDays: 67, rack: "D1", batch: "SE8820", expiryDays: 610, category: "Home Care" },
  { sku: "KIS-KET-1KG", name: "Kissan Fresh Tomato Ketchup 950g", brand: "Kissan", hsn: "2103", gst: 12, cost: 118, mrp: 150, stock: 64, avgDaily: 0, vendorId: "V01", leadDays: 4, buffer: 8, lastScanDays: 94, rack: "B4", batch: "KK1201", expiryDays: 28, category: "Packaged Food" },
  { sku: "FOR-BAS-5KG", name: "Fortune Everyday Basmati Rice 5kg", brand: "Fortune", hsn: "1006", gst: 5, cost: 420, mrp: 545, stock: 52, avgDaily: 0, vendorId: "V02", leadDays: 3, buffer: 6, lastScanDays: 61, rack: "A2", batch: "FB4410", expiryDays: 300, category: "Staples" },
  { sku: "NES-KKT-4F", name: "Nestlé KitKat 4 Finger (Pack of 12)", brand: "Nestlé", hsn: "1806", gst: 18, cost: 210, mrp: 264, stock: 18, avgDaily: 6, vendorId: "V04", leadDays: 4, buffer: 6, lastScanDays: 0, rack: "E1", batch: "KK90X", expiryDays: 12, category: "Confectionery" },
  { sku: "HUL-LUX-4", name: "Lux Soft Touch Soap 4x100g", brand: "HUL", hsn: "3401", gst: 18, cost: 128, mrp: 165, stock: 41, avgDaily: 0, vendorId: "V01", leadDays: 4, buffer: 6, lastScanDays: 38, rack: "D3", batch: "LX5512", expiryDays: 700, category: "Personal Care" },
  { sku: "ITC-BIN-200", name: "Bingo Mad Angles 130g", brand: "ITC", hsn: "2106", gst: 12, cost: 16, mrp: 20, stock: 240, avgDaily: 0, vendorId: "V05", leadDays: 5, buffer: 20, lastScanDays: 47, rack: "E2", batch: "BG2207", expiryDays: 45, category: "Snacks" },
];

export const velocity = products.slice(0, 8).map((p) => ({
  name: p.brand === "Amul" ? p.name.split(" ").slice(0, 2).join(" ") : p.brand,
  runRate: p.avgDaily * 7,
  buffer: (p.avgDaily * p.leadDays + p.buffer),
  stock: p.stock,
}));

export const capitalTrend = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 38 + Math.sin(i / 4) * 2.4 + i * 0.12,
}));

export type Alert = { id: string; severity: "critical" | "warning" | "info"; title: string; detail: string; action: string; impact: string };

export const aiAlerts: Alert[] = [
  { id: "a1", severity: "critical", title: "Amul Taaza Milk batch #A29 expires in 4 days", detail: "72 units on rack C1. Pair with Britannia Bread (3 days left) for a 15% clearance combo.", action: "Trigger 15% combo", impact: "Recovers ₹4,284" },
  { id: "a2", severity: "critical", title: "Fortune Sunlite Oil will stock out in 2.5 days", detail: "Run-rate 18/day vs lead time 3 days. Adani Wilmar Hub PO not raised.", action: "Draft PO (304 units)", impact: "Protects ₹49,800 revenue" },
  { id: "a3", severity: "warning", title: "Kissan Ketchup — 94 days without a scan", detail: "64 units, ₹7,552 locked. Expires in 28 days.", action: "Mark down to Cost + 2%", impact: "Frees ₹7,700" },
  { id: "a4", severity: "warning", title: "Blinkit hub draining Amul Butter", detail: "62% of last 48h butter sales went online. Floor stock at 22.", action: "Enable safety reserve", impact: "Keeps 10% for walk-ins" },
  { id: "a5", severity: "info", title: "HUL invoice #HUL/24/88213 short-shipped", detail: "5 units Surf Excel billed but not received.", action: "Raise debit note", impact: "₹661 claim" },
];

export const invoiceLines = [
  { sku: "SUR-XL-1KG", name: "Surf Excel Easy Wash 1kg", hsn: "3402", billed: 48, po: 48, verified: 43, rate: 112, gst: 18, batch: "SE8820", mfg: "2026-08-12", exp: "2028-08-11" },
  { sku: "DET-HW-RF", name: "Dettol Original Liquid Handwash Refill 750ml", hsn: "3401", billed: 36, po: 36, verified: 36, rate: 99, gst: 18, batch: "DT3390", mfg: "2026-07-02", exp: "2027-12-31" },
  { sku: "HUL-LUX-4", name: "Lux Soft Touch Soap 4x100g", hsn: "3401", billed: 24, po: 30, verified: 24, rate: 128, gst: 18, batch: "LX5512", mfg: "2026-09-20", exp: "2028-09-19" },
  { sku: "KIS-KET-1KG", name: "Kissan Fresh Tomato Ketchup 950g", hsn: "2103", billed: 12, po: 12, verified: 12, rate: 118, gst: 12, batch: "KK1201", mfg: "2026-06-01", exp: "2026-12-01" },
];

export const channels = [
  { key: "pos", label: "Main Counter POS" },
  { key: "qc", label: "Blinkit / Instamart Hub" },
  { key: "web", label: "Online Storefront (Shopify)" },
] as const;

export type NavRole = "owner" | "supervisor" | "cashier";
const ALL: NavRole[] = ["owner", "supervisor", "cashier"];
const MGMT: NavRole[] = ["owner", "supervisor"];
const OWNER: NavRole[] = ["owner"];

/** Sidebar modules and which staff roles may open them. */
export const navItems = [
  { to: "/dashboard", label: "Command Center", roles: OWNER },
  { to: "/pos", label: "Quick POS / Register", roles: ALL },
  { to: "/receiving", label: "Inward & OCR", roles: ALL },
  { to: "/procurement", label: "Procurement", roles: MGMT },
  { to: "/storage", label: "FEFO Radar", roles: MGMT },
  { to: "/sync", label: "Omnichannel Sync", roles: MGMT },
  { to: "/dead-stock", label: "Dead-Stock Studio", roles: OWNER },
  { to: "/margin", label: "Margin Protection & Audit", roles: OWNER },
  { to: "/team", label: "Team & Roles", roles: OWNER },
] as const;

export const homeFor = (role: NavRole) => (role === "cashier" ? "/pos" : role === "supervisor" ? "/procurement" : "/dashboard");

/** Last agreed purchase rate (₹/unit) before the latest scanned invoice. Latest rate = product.cost. */
export const priceHistory: Record<string, { prevCost: number; invoice: string; announced: boolean }> = {
  "FOR-SUN-1L": { prevCost: 124, invoice: "AWL/INV/55102", announced: false },
  "AMU-BUT-500": { prevCost: 248, invoice: "GCM/24/7781", announced: true },
  "MAG-NDL-280": { prevCost: 45, invoice: "NES/DL/31120", announced: false },
  "TAT-SLT-1KG": { prevCost: 23, invoice: "TCP/MUM/9021", announced: true },
  "ASH-ATA-5KG": { prevCost: 226, invoice: "ITC/KOL/4410", announced: true },
  "DET-HW-RF": { prevCost: 94, invoice: "HUL/24/88213", announced: false },
  "SUR-XL-1KG": { prevCost: 112, invoice: "HUL/24/88213", announced: false },
  "KIS-KET-1KG": { prevCost: 118, invoice: "HUL/24/88213", announced: false },
  "NES-KKT-4F": { prevCost: 198, invoice: "NES/DL/31120", announced: false },
  "HUL-LUX-4": { prevCost: 121, invoice: "HUL/24/88213", announced: false },
};

/** Last physical shelf count (units) vs. what the system expects. */
export const shelfCounts: Record<string, { counted: number; countedDaysAgo: number }> = {
  "FOR-SUN-1L": { counted: 45, countedDaysAgo: 0 },
  "AMU-BUT-500": { counted: 16, countedDaysAgo: 0 },
  "MAG-NDL-280": { counted: 296, countedDaysAgo: 1 },
  "NES-KKT-4F": { counted: 11, countedDaysAgo: 0 },
  "DET-HW-RF": { counted: 140, countedDaysAgo: 2 },
  "ITC-BIN-200": { counted: 221, countedDaysAgo: 1 },
  "TAT-SLT-1KG": { counted: 57, countedDaysAgo: 0 },
  "HUL-LUX-4": { counted: 41, countedDaysAgo: 3 },
};
