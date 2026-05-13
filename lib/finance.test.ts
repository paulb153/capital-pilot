import { describe, it, expect } from "vitest";
import {
  futureValue,
  computeScores,
  computeIncome,
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
  const base = {
    salary: 3_000, otherIncome: 0,
    housing: 900, food: 300, transport: 150, electricity: 50,
    leisure: 100, subscriptions: 50, misc: 100,
    loans: [], monthlyInvestment: 300, investMonthly: true,
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
    // If monthlyInvestment > margin, monthlyCurrent = margin
    const r = computeIncome({ ...base, monthlyInvestment: 9_999 });
    expect(r.monthlyCurrent).toBe(r.margin);
  });

  it("returns 0 for monthlyCurrent when investMonthly=false", () => {
    const r = computeIncome({ ...base, investMonthly: false });
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
