import { describe, it, expect } from "vitest";
import {
  futureValue,
  computeScores,
  computeIncome,
  computeProjection,
  computeNextStep,
  classifyHousing,
  classifyGeneric,
} from "./finance";

// ─── futureValue ────────────────────────────────────────────────────────────

describe("futureValue", () => {
  it("returns initial value when rate=0 and monthly=0", () => {
    expect(futureValue(10_000, 0, 0, 10)).toBe(10_000);
  });

  it("compounds correctly over 1 year at 12%/an (1%/mois)", () => {
    // 1 000 € × (1.01)^12 ≈ 1 126.83 €
    const result = futureValue(1_000, 0, 0.12, 1);
    expect(result).toBeCloseTo(1_126.83, 0);
  });

  it("adds monthly contributions correctly with rate=0", () => {
    // 0 € initial + 100 €/mois × 12 mois = 1 200 €
    expect(futureValue(0, 100, 0, 1)).toBe(1_200);
  });

  it("handles combined initial + monthly at 7% over 30 years", () => {
    // Valeur représentative : doit être > 100k
    const result = futureValue(10_000, 200, 0.07, 30);
    expect(result).toBeGreaterThan(100_000);
  });

  it("returns 0 for years=0", () => {
    expect(futureValue(5_000, 100, 0.07, 0)).toBe(5_000);
  });

  it("clamps negative initial to 0", () => {
    expect(futureValue(-1_000, 0, 0, 5)).toBe(0);
  });

  it("clamps negative monthly to 0", () => {
    // -100/mois should be treated as 0
    expect(futureValue(1_000, -100, 0, 1)).toBe(1_000);
  });
});

// ─── classifyHousing / classifyGeneric ──────────────────────────────────────

describe("classifyHousing", () => {
  it("returns Très bien below 30%", () => {
    expect(classifyHousing(20)).toBe("Très bien");
  });
  it("returns OK at exactly 30%", () => {
    expect(classifyHousing(30)).toBe("OK");
  });
  it("returns Excessif between 30 and 40", () => {
    expect(classifyHousing(35)).toBe("Excessif");
  });
  it("returns Très excessif between 40 and 50", () => {
    expect(classifyHousing(45)).toBe("Très excessif");
  });
  it("returns Critique at 50+", () => {
    expect(classifyHousing(55)).toBe("Critique");
  });
});

describe("classifyGeneric", () => {
  it("Très bien below t1", () => {
    expect(classifyGeneric(5, 10, 15, 20)).toBe("Très bien");
  });
  it("OK between t1 and t2", () => {
    expect(classifyGeneric(12, 10, 15, 20)).toBe("OK");
  });
  it("Excessif between t2 and t3", () => {
    expect(classifyGeneric(17, 10, 15, 20)).toBe("Excessif");
  });
  it("Très excessif above t3", () => {
    expect(classifyGeneric(25, 10, 15, 20)).toBe("Très excessif");
  });
});

// ─── computeIncome ──────────────────────────────────────────────────────────

describe("computeIncome", () => {
  // margin = 3 000 - 1 650 = 1 350
  const base = {
    salary: 3_000, otherIncome: 0,
    housing: 900, food: 300, transport: 150, electricity: 50,
    leisure: 100, subscriptions: 50, misc: 100,
    loans: [], savingsMonthly: 0, investmentMonthly: 300,
  };

  it("calculates income correctly", () => {
    const r = computeIncome(base);
    expect(r.income).toBe(3_000);
  });

  it("calculates expenses correctly", () => {
    const r = computeIncome(base);
    // 900+300+150+50+100+50+100 = 1 650
    expect(r.expenses).toBe(1_650);
  });

  it("calculates margin correctly", () => {
    const r = computeIncome(base);
    expect(r.margin).toBe(3_000 - 1_650);
  });

  it("caps monthlyCurrent at margin", () => {
    const r = computeIncome({ ...base, investmentMonthly: 9_999 });
    expect(r.monthlyCurrent).toBe(r.margin);
  });

  it("returns 0 for monthlyCurrent when both monthly amounts are zero", () => {
    const r = computeIncome({ ...base, savingsMonthly: 0, investmentMonthly: 0 });
    expect(r.monthlyCurrent).toBe(0);
  });

  it("margin is 0 when expenses > income", () => {
    const r = computeIncome({ ...base, salary: 500 });
    expect(r.margin).toBe(0);
  });

  it("accounts for loan payments in expenses", () => {
    const r = computeIncome({
      ...base,
      loans: [
        { monthlyPayment: 200, remainingCapital: 10_000 },
        { monthlyPayment: 100, remainingCapital: 5_000 },
      ],
    });
    expect(r.totalLoanMonthly).toBe(300);
    expect(r.expenses).toBe(1_650 + 300);
  });

  // ── Split-specific tests ──────────────────────────────────────────────────

  it("split nominal: monthlyCurrent = savingsMonthly + investmentMonthly", () => {
    const r = computeIncome({ ...base, savingsMonthly: 200, investmentMonthly: 100 });
    expect(r.monthlyCurrent).toBe(300);
    expect(r.savingsMonthly).toBe(200);
    expect(r.investmentMonthly).toBe(100);
  });

  it("split savings-only: investmentMonthly=0", () => {
    const r = computeIncome({ ...base, savingsMonthly: 400, investmentMonthly: 0 });
    expect(r.monthlyCurrent).toBe(400);
    expect(r.savingsMonthly).toBe(400);
    expect(r.investmentMonthly).toBe(0);
  });

  it("split investment-only: savingsMonthly=0", () => {
    const r = computeIncome({ ...base, savingsMonthly: 0, investmentMonthly: 500 });
    expect(r.monthlyCurrent).toBe(500);
    expect(r.savingsMonthly).toBe(0);
    expect(r.investmentMonthly).toBe(500);
  });

  it("cap: monthlyCurrent capped at margin, raw split values preserved", () => {
    // margin = 1 350, declared total = 2 000
    const r = computeIncome({ ...base, savingsMonthly: 1_000, investmentMonthly: 1_000 });
    expect(r.monthlyCurrent).toBe(1_350);  // capped
    expect(r.savingsMonthly).toBe(1_000);  // raw, uncapped
    expect(r.investmentMonthly).toBe(1_000); // raw, uncapped
  });

  it("cap with zero margin: monthlyCurrent=0, raw values still exposed", () => {
    const r = computeIncome({ ...base, salary: 500, savingsMonthly: 200, investmentMonthly: 100 });
    expect(r.margin).toBe(0);
    expect(r.monthlyCurrent).toBe(0);
    expect(r.savingsMonthly).toBe(200);
    expect(r.investmentMonthly).toBe(100);
  });
});

// ─── computeProjection ──────────────────────────────────────────────────────

describe("computeProjection", () => {
  const base = {
    dynamicCurrentCapital: 10_000,
    prudentCurrentCapital: 5_000,
    realCurrentCapital: 0,
    investedCapital: 15_000,
    monthlyCurrent: 300,
    savingsMonthly: 0,
    investmentMonthly: 300,
    additionalInvestable: 200,
    immediateInvestable: 0,
    checking0: 2_000,
    livretA0: 3_000,
    livretARate: 0.025,
    extras: [],
    safetyTarget: 5_000,
    margin: 500,
    annualMarket: 0.07,
    annualPrudent: 0.025,
    H: 20,
  };

  it("non-split: seriesBase[H] equals baseAtH", () => {
    const r = computeProjection({ ...base, savingsMonthly: 0, investmentMonthly: 0, monthlyCurrent: 0 });
    expect(r.seriesBase[r.seriesBase.length - 1]).toBeCloseTo(r.baseAtH, 0);
  });

  it("split: seriesBase[H] equals baseAtH", () => {
    const r = computeProjection({ ...base, savingsMonthly: 100, investmentMonthly: 200 });
    expect(r.seriesBase[r.seriesBase.length - 1]).toBeCloseTo(r.baseAtH, 0);
  });

  it("split: deltaH = improvedAtH - baseAtH", () => {
    const r = computeProjection(base);
    expect(r.deltaH).toBeCloseTo(r.improvedAtH - r.baseAtH, 0);
  });

  it("split savings-only: seriesBase[0] starts from livretA0 + investedCapital", () => {
    // At year 0: futureValue(3000, x, rate, 0) = 3000, futureValue(15000, x, rate, 0) = 15000
    const r = computeProjection({ ...base, savingsMonthly: 200, investmentMonthly: 0, monthlyCurrent: 200 });
    expect(r.seriesBase[0]).toBeCloseTo(3_000 + 15_000, 0);
  });

  it("split investment-only: seriesBase[0] starts from livretA0 + investedCapital", () => {
    const r = computeProjection({ ...base, savingsMonthly: 0, investmentMonthly: 200, monthlyCurrent: 200 });
    expect(r.seriesBase[0]).toBeCloseTo(3_000 + 15_000, 0);
  });

  it("improvedAtH > baseAtH for typical inputs", () => {
    const r = computeProjection(base);
    expect(r.improvedAtH).toBeGreaterThan(r.baseAtH);
  });

  it("seriesBase has H+1 entries", () => {
    const r = computeProjection(base);
    expect(r.seriesBase).toHaveLength(base.H + 1);
    expect(r.seriesImproved).toHaveLength(base.H + 1);
  });

  // ── Regression: base must never exceed improved ───────────────────────────

  it("seriesImproved[y] >= seriesBase[y] pour tout y avec portefeuille 100% prudent", () => {
    // Avant le fix, baseFV appliquait annualMarket (7%) à investedCapital entier,
    // faisant exploser la base vs l'optimisée sur un portefeuille en fonds euros.
    const r = computeProjection({
      ...base,
      dynamicCurrentCapital: 0,
      prudentCurrentCapital: 50_000,
      realCurrentCapital: 0,
      investedCapital: 50_000,
      savingsMonthly: 0,
      investmentMonthly: 300,
      monthlyCurrent: 300,
      additionalInvestable: 200,
      immediateInvestable: 0,
    });
    r.seriesImproved.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(r.seriesBase[i]);
    });
  });

  it("non-split fallback identique à la valeur de référence quand les deux montants sont zéro", () => {
    // Quand savingsMonthly=0 et investmentMonthly=0, baseFV = baseTotalFV.
    // seriesBase[H] doit égaler baseAtH (cohérence scalaire/série).
    const r = computeProjection({ ...base, savingsMonthly: 0, investmentMonthly: 0, monthlyCurrent: 0 });
    expect(r.seriesBase[r.seriesBase.length - 1]).toBeCloseTo(r.baseAtH, 0);
  });

  it("split avec investedCapital=0 : seriesBase[H] > 0 si investmentMonthly > 0", () => {
    // currentShares tombe sur le fallback (0.5/0.3/0.2) — les apports mensuels
    // doivent quand même s'accumuler correctement.
    const r = computeProjection({
      ...base,
      dynamicCurrentCapital: 0,
      prudentCurrentCapital: 0,
      realCurrentCapital: 0,
      investedCapital: 0,
      livretA0: 0,
      savingsMonthly: 0,
      investmentMonthly: 300,
      monthlyCurrent: 300,
    });
    expect(r.seriesBase[r.seriesBase.length - 1]).toBeGreaterThan(0);
  });
});

// ─── computeScores ──────────────────────────────────────────────────────────

describe("computeScores", () => {
  const perfectProfile = {
    income: 5_000,
    expenses: 2_000,          // 40% ratio → très souple
    margin: 3_000,
    totalLoanMonthly: 0,
    monthlyCurrent: 1_000,
    monthlyOptimized: 3_000,  // 60% taux d'épargne → ambition max
    investedCapital: 50_000,
    nonInvestedTotal: 20_000,
    safetyTarget: 10_000,     // 2 mois de dépenses
    housingPct: 20,           // logement <30%
  };

  it("returns advanced profileTier for a perfect profile", () => {
    const r = computeScores(perfectProfile);
    expect(r.profileTier).toBe("advanced");
    expect(r.scoreGlobal).toBeGreaterThanOrEqual(70);
  });

  it("returns fragile profileTier when margin=0 and no savings", () => {
    const r = computeScores({
      income: 2_000,
      expenses: 2_000,
      margin: 0,
      totalLoanMonthly: 0,
      monthlyCurrent: 0,
      monthlyOptimized: 0,
      investedCapital: 0,
      nonInvestedTotal: 0,
      safetyTarget: 6_000,
      housingPct: 50,
    });
    expect(r.profileTier).toBe("fragile");
    expect(r.scoreGlobal).toBeLessThan(35);
  });

  it("savingsRate is 0 when income is 0", () => {
    const r = computeScores({ ...perfectProfile, income: 0, expenses: 0, margin: 0 });
    expect(r.savingsRate).toBe(0);
    expect(r.currentSavingsRate).toBe(0);
    expect(r.marginRate).toBe(0);
  });

  it("scoreSafety is capped at 100", () => {
    const r = computeScores(perfectProfile);
    expect(r.scoreSafety).toBeLessThanOrEqual(100);
  });
});

// ─── computeNextStep ────────────────────────────────────────────────────────

describe("computeNextStep", () => {
  it("prioritises filling safety gap", () => {
    const r = computeNextStep({
      profileTier: "medium",
      safetyGap: 3_000,
      margin: 1_000,
      additionalInvestable: 700,
      annualMarket: 0.07,
      H: 20,
    });
    expect(r.monthlyTarget).toBeGreaterThanOrEqual(50);
    // Target should be bounded by margin*0.7 or safetyGap/3
    expect(r.monthlyTarget).toBeLessThanOrEqual(1_000);
  });

  it("returns monthlyTarget ≥ 50 always", () => {
    const r = computeNextStep({
      profileTier: "fragile",
      safetyGap: 0,
      margin: 0,
      additionalInvestable: 0,
      annualMarket: 0.07,
      H: 10,
    });
    expect(r.monthlyTarget).toBeGreaterThanOrEqual(50);
  });

  it("futureImpactAmount is positive for non-zero target", () => {
    const r = computeNextStep({
      profileTier: "good",
      safetyGap: 0,
      margin: 2_000,
      additionalInvestable: 500,
      annualMarket: 0.07,
      H: 30,
    });
    expect(r.futureImpactAmount).toBeGreaterThan(0);
  });
});
