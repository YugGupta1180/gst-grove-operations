// Indian numbering: 12,34,567.89
export function inr(n: number, decimals = 0) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Compact: ₹4.32 L / ₹1.2 Cr
export function inrCompact(n: number) {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return inr(n);
}

export function gstSplit(taxable: number, rate: number, interState = false) {
  const tax = (taxable * rate) / 100;
  return interState
    ? { cgst: 0, sgst: 0, igst: tax, total: taxable + tax }
    : { cgst: tax / 2, sgst: tax / 2, igst: 0, total: taxable + tax };
}

/** Fixed safety buffer used by the reorder rule (mirrors products.status in the database). */
export const SAFETY_BUFFER = 5;

/** Reorder rule: stock <= avgDaily * leadDays + 5 */
export function needsReorder(stock: number, avgDaily: number, leadDays: number) {
  return stock <= avgDaily * leadDays + SAFETY_BUFFER;
}

/** Suggested order quantity: avgDaily * 15 (15-day cycle). */
export function reorderQty(avgDaily: number, cycle = 15) {
  return Math.ceil(avgDaily * cycle);
}

export type CartLine = { sku: string; name: string; qty: number; price: number; cost: number };

/** Sale revenue at selling price; profit = (price - cost) * qty. */
export function saleTotals(lines: CartLine[]) {
  const revenue = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const profit = lines.reduce((s, l) => s + (l.price - l.cost) * l.qty, 0);
  return { revenue, profit };
}

/** % cost increase vs previous rate, rounded to 1 decimal. Positive = creep. */
export function costCreepPct(prevCost: number, latestCost: number) {
  return prevCost > 0 ? Math.round(((latestCost - prevCost) / prevCost) * 1000) / 10 : 0;
}

/** RTV window: batch is returnable while it still has 40 days or fewer to expiry (and is not yet expired). */
export const RTV_WINDOW_DAYS = 40;
export function rtvEligible(expiryDays: number) {
  return expiryDays > 0 && expiryDays < RTV_WINDOW_DAYS;
}
/** Debit-note value: units × cost, plus GST on it. */
export function rtvRecovery(units: number, cost: number, gst: number) {
  const taxable = units * cost;
  return { taxable, gst: (taxable * gst) / 100, total: taxable + (taxable * gst) / 100 };
}

/** Shrinkage: units missing vs system stock; flagged if gap > 5% or more than one day of sales. */
export function shrinkage(systemStock: number, counted: number, avgDaily: number) {
  const gap = systemStock - counted;
  const pct = systemStock > 0 ? (gap / systemStock) * 100 : 0;
  return { gap, pct, flagged: gap > 0 && (pct > 5 || gap > Math.max(1, avgDaily)) };
}
