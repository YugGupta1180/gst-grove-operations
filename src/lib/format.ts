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

/** Reorder rule: stock <= avgDaily * leadDays + buffer */
export function needsReorder(stock: number, avgDaily: number, leadDays: number, buffer: number) {
  return stock <= avgDaily * leadDays + buffer;
}

/** Quantity to cover a 15-day cycle plus lead time and buffer, minus stock on hand. */
export function reorderQty(stock: number, avgDaily: number, leadDays: number, buffer: number, cycle = 15) {
  return Math.max(0, Math.ceil(avgDaily * (cycle + leadDays) + buffer - stock));
}
