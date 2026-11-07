import { describe, expect, it } from "vitest";
import { inrCompact, needsReorder, reorderQty, gstSplit } from "@/lib/format";

describe("procurement rules", () => {
  it("flags reorder when stock <= avg*lead + 5", () => {
    expect(needsReorder(59, 18, 3)).toBe(true);
    expect(needsReorder(60, 18, 3)).toBe(false);
  });
  it("suggests avg daily × 15 units", () => {
    expect(reorderQty(18)).toBe(270);
    expect(reorderQty(2.5)).toBe(38);
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

import { costCreepPct, rtvEligible, rtvRecovery, shrinkage } from "@/lib/format";
describe("margin protection", () => {
  it("cost creep % vs previous rate", () => { expect(costCreepPct(124, 132)).toBe(6.5); });
  it("RTV window is under 40 days to expiry", () => {
    expect(rtvEligible(39)).toBe(true); expect(rtvEligible(40)).toBe(false); expect(rtvEligible(0)).toBe(false);
  });
  it("debit note adds GST", () => { expect(rtvRecovery(10, 100, 12).total).toBe(1120); });
  it("shrinkage flags gaps over 5%", () => { expect(shrinkage(22, 16, 9).flagged).toBe(true); expect(shrinkage(140, 140, 2).flagged).toBe(false); });
});
