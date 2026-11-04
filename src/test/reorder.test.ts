import { describe, expect, it } from "vitest";
import { inrCompact, needsReorder, reorderQty, gstSplit } from "@/lib/format";

describe("procurement rules", () => {
  it("flags reorder when stock <= avg*lead + buffer", () => {
    expect(needsReorder(74, 18, 3, 20)).toBe(true);
    expect(needsReorder(75, 18, 3, 20)).toBe(false);
  });
  it("orders enough for a 15-day cycle", () => {
    expect(reorderQty(46, 18, 3, 20)).toBe(18 * 18 + 20 - 46);
  });
  it("formats lakhs and crores", () => {
    expect(inrCompact(432000)).toBe("₹4.32 L");
    expect(inrCompact(12000000)).toBe("₹1.20 Cr");
  });
  it("splits intra-state GST into CGST/SGST", () => {
    expect(gstSplit(1000, 18)).toEqual({ cgst: 90, sgst: 90, igst: 0, total: 1180 });
  });
});

import { saleTotals } from "@/lib/format";
describe("POS sale", () => {
  it("profit is (price - cost) x qty", () => {
    expect(saleTotals([{ sku: "a", name: "Amul Butter", qty: 2, price: 285, cost: 248 }])).toEqual({ revenue: 570, profit: 74 });
  });
});
