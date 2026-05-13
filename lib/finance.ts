/**
 * Pure financial computation functions for CapitalPilot.
 * No React, no DOM, no formatting — only numbers in, numbers (and typed objects) out.
 * Each function is independently testable.
 */

// ─── Shared helpers ────────────────────────────────────────────────────────

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function futureValue(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number,
): number {
  const months = Math.max(0, Math.round(years * 12));
  const r = Math.max(0, annualRate) / 12;
  let value = Math.max(0, initial);
  for (let i = 0; i < months; i++) value = value * (1 + r) + Math.max(0, monthly);
  return value;
}

// ─── Types used as function parameters ─────────────────────────────────────

type LoanLike = { monthlyPayment: number; remainingCapital: number };
type ExtraLike = { id: string; amount: number; ratePct: number };
type BreakdownLike = {
  pea: number; cto: number; assuranceVieFondsEuro: number; assuranceVieUC: number;
  immobilier: number; crowdfunding: number; crypto: number; per: number; autres: number;
};

// ─── Status classification ──────────────────────────────────────────────────

export type Status = "Très bien" | "OK" | "Excessif" | "Très excessif" | "Critique";

export function classifyHousing(p: number): Status {
  if (p < 30) return "Très bien";
  if (p < 35) return "OK";
  if (p < 45) return "Excessif";
  return "Critique";
}

export function classifyGeneric(p: number, t1: number, t2: number, t3: number): Status {
  if (p < t1) return "Très bien";
  if (p < t2) return "OK";
  if (p < t3) return "Excessif";
  return "Très excessif";
}

// ─── computeIncome ──────────────────────────────────────────────────────────

export type IncomeResult = {
  income: number;
  expenses: number;
  margin: number;
  totalLoanMonthly: number;
  totalRemainingDebt: number;
  monthlyCurrent: number;
  additionalInvestable: number;
  monthlyOptimized: number;
};

export function computeIncome(params: {
  salary: number;
  otherIncome: number;
  housing: number;
  food: number;
  transport: number;
  electricity: number;
  leisure: number;
  subscriptions: number;
  misc: number;
  loans: LoanLike[];
  monthlyInvestment: number;
  investMonthly: boolean;
}): IncomeResult {
  const { salary, otherIncome, housing, food, transport, electricity,
    leisure, subscriptions, misc, loans, monthlyInvestment, investMonthly } = params;

  const income = Math.max(0, salary) + Math.max(0, otherIncome);
  const totalLoanMonthly = loans.reduce((s, l) => s + Math.max(0, l.monthlyPayment), 0);
  const totalRemainingDebt = loans.reduce((s, l) => s + Math.max(0, l.remainingCapital), 0);
  const expenses =
    Math.max(0, housing) + Math.max(0, food) + Math.max(0, transport) +
    Math.max(0, electricity) + Math.max(0, leisure) + Math.max(0, subscriptions) +
    Math.max(0, misc) + totalLoanMonthly;
  const margin = income > 0 ? Math.max(0, income - expenses) : 0;
  const monthlyDeclared = investMonthly ? Math.max(0, monthlyInvestment) : 0;
  const monthlyCurrent = Math.min(monthlyDeclared, margin);
  const additionalInvestable = Math.max(0, margin - monthlyCurrent);
  const monthlyOptimized = monthlyCurrent + additionalInvestable;

  return { income, expenses, margin, totalLoanMonthly, totalRemainingDebt,
    monthlyCurrent, additionalInvestable, monthlyOptimized };
}

// ─── computeCapital ─────────────────────────────────────────────────────────

export type CapitalResult = {
  dynamicCurrentCapital: number;
  prudentCurrentCapital: number;
  realCurrentCapital: number;
  investedCapital: number;
  dynamicPct: number;
  fundsEuroPct: number;
};

export function computeCapital(breakdown: BreakdownLike | undefined): CapitalResult {
  const b: BreakdownLike = breakdown ?? {
    pea: 0, cto: 0, assuranceVieFondsEuro: 0, assuranceVieUC: 0,
    immobilier: 0, crowdfunding: 0, crypto: 0, per: 0, autres: 0,
  };
  const dynamic = Math.max(0, b.pea) + Math.max(0, b.cto) + Math.max(0, b.assuranceVieUC) +
    Math.max(0, b.crowdfunding) + Math.max(0, b.crypto) + Math.max(0, b.per);
  const prudent = Math.max(0, b.assuranceVieFondsEuro);
  const real = Math.max(0, b.immobilier) + Math.max(0, b.autres);
  const total = dynamic + prudent + real;
  return {
    dynamicCurrentCapital: dynamic,
    prudentCurrentCapital: prudent,
    realCurrentCapital: real,
    investedCapital: total,
    dynamicPct: total > 0 ? (dynamic / total) * 100 : 0,
    fundsEuroPct: total > 0 ? (prudent / total) * 100 : 0,
  };
}

// ─── computeLiquidity ───────────────────────────────────────────────────────

export type LiquidityResult = {
  checking0: number;
  livretA0: number;
  livretARate: number;
  extras: ExtraLike[];
  nonInvestedTotal: number;
  safetyTarget: number;
  safetyGap: number;
  immediateInvestable: number;
};

export function computeLiquidity(params: {
  checkingAmount: number;
  livretAAmount: number;
  livretARatePct: number;
  extraAccounts: ExtraLike[];
  safetyMonths: number;
  expenses: number;
}): LiquidityResult {
  const { checkingAmount, livretAAmount, livretARatePct, extraAccounts, safetyMonths, expenses } = params;
  const checking0 = Math.max(0, checkingAmount);
  const livretA0 = Math.max(0, livretAAmount);
  const livretARate = clamp((livretARatePct ?? 1.5) / 100, 0, 0.2);
  const extras = extraAccounts.map((a) => ({
    id: a.id,
    amount: Math.max(0, a.amount),
    ratePct: clamp(a.ratePct ?? 0, 0, 20),
  }));
  const nonInvestedTotal = checking0 + livretA0 + extras.reduce((s, e) => s + e.amount, 0);
  const safetyTarget = expenses * safetyMonths;
  const safetyGap = Math.max(0, safetyTarget - nonInvestedTotal);
  const immediateInvestable = Math.max(0, nonInvestedTotal - safetyTarget);
  return { checking0, livretA0, livretARate, extras, nonInvestedTotal, safetyTarget, safetyGap, immediateInvestable };
}

// ─── computeProjection ──────────────────────────────────────────────────────

export type ProjectionResult = {
  baseAtH: number;
  improvedAtH: number;
  deltaH: number;
  delta20: number;
  delta30: number;
  delta40: number;
  yearsArr: number[];
  seriesBase: number[];
  seriesImproved: number[];
};

export function computeProjection(p: {
  dynamicCurrentCapital: number;
  prudentCurrentCapital: number;
  realCurrentCapital: number;
  investedCapital: number;
  monthlyCurrent: number;
  additionalInvestable: number;
  immediateInvestable: number;
  checking0: number;
  livretA0: number;
  livretARate: number;
  extras: ExtraLike[];
  safetyTarget: number;
  margin: number;
  annualMarket: number;
  annualPrudent: number;
  H: number;
}): ProjectionResult {
  const {
    dynamicCurrentCapital, prudentCurrentCapital, realCurrentCapital, investedCapital,
    monthlyCurrent, additionalInvestable, immediateInvestable,
    checking0, livretA0, livretARate, extras, safetyTarget,
    margin, annualMarket, annualPrudent, H,
  } = p;
  const annualReal = 0.035;

  const currentShares = {
    dynamic: investedCapital > 0 ? dynamicCurrentCapital / investedCapital : 0.5,
    prudent: investedCapital > 0 ? prudentCurrentCapital / investedCapital : 0.3,
    real:    investedCapital > 0 ? realCurrentCapital    / investedCapital : 0.2,
  };

  const baseCashFV = (years: number) => {
    const cashNotInvested = Math.max(0, margin - monthlyCurrent);
    return futureValue(checking0, cashNotInvested * 0.5, 0, years)
      + futureValue(livretA0, cashNotInvested * 0.5, livretARate, years)
      + extras.reduce((sum, e) => sum + futureValue(e.amount, 0, e.ratePct / 100, years), 0);
  };

  const baseTotalFV = (years: number) =>
    futureValue(dynamicCurrentCapital, monthlyCurrent * currentShares.dynamic, annualMarket, years) +
    futureValue(prudentCurrentCapital, monthlyCurrent * currentShares.prudent, annualPrudent, years) +
    futureValue(realCurrentCapital,    monthlyCurrent * currentShares.real,    annualReal,    years) +
    baseCashFV(years);

  const improvedCashFV = (years: number) => {
    const safetyInLivret = Math.min(livretA0, safetyTarget);
    return futureValue(safetyInLivret, 0, livretARate, years)
      + futureValue(Math.max(0, Math.min(checking0, safetyTarget - safetyInLivret)), 0, 0, years)
      + extras.reduce((sum, e) => sum + futureValue(e.amount, 0, e.ratePct / 100, years), 0);
  };

  const improvedTotalFV = (years: number) =>
    futureValue(dynamicCurrentCapital + immediateInvestable * 0.6, (monthlyCurrent + additionalInvestable) * 0.6, annualMarket, years) +
    futureValue(prudentCurrentCapital + immediateInvestable * 0.25, (monthlyCurrent + additionalInvestable) * 0.25, annualPrudent, years) +
    futureValue(realCurrentCapital    + immediateInvestable * 0.15, (monthlyCurrent + additionalInvestable) * 0.15, annualReal, years) +
    improvedCashFV(years);

  const baseAtH = baseTotalFV(H);
  const improvedAtH = improvedTotalFV(H);
  const yearsArr = Array.from({ length: H + 1 }, (_, i) => i);

  return {
    baseAtH,
    improvedAtH,
    deltaH: Math.max(0, improvedAtH - baseAtH),
    delta20: Math.max(0, improvedTotalFV(Math.min(20, H)) - baseTotalFV(Math.min(20, H))),
    delta30: Math.max(0, improvedTotalFV(Math.min(30, H)) - baseTotalFV(Math.min(30, H))),
    delta40: Math.max(0, improvedTotalFV(Math.min(40, H)) - baseTotalFV(Math.min(40, H))),
    yearsArr,
    seriesBase: yearsArr.map((y) => baseTotalFV(y)),
    seriesImproved: yearsArr.map((y) => improvedTotalFV(y)),
  };
}

// ─── computeScores ──────────────────────────────────────────────────────────

export type ProfileTier = "fragile" | "medium" | "good" | "advanced";

export type ScoreResult = {
  scoreSafety: number;
  scoreFlex: number;
  scoreAmbition: number;
  scoreGlobal: number;
  profileTier: ProfileTier;
  savingsRate: number;
  currentSavingsRate: number;
  marginRate: number;
};

export function computeScores(p: {
  income: number;
  expenses: number;
  margin: number;
  totalLoanMonthly: number;
  monthlyCurrent: number;
  monthlyOptimized: number;
  investedCapital: number;
  nonInvestedTotal: number;
  safetyTarget: number;
  housingPct: number;
}): ScoreResult {
  const { income, expenses, margin, totalLoanMonthly, monthlyCurrent,
    monthlyOptimized, investedCapital, nonInvestedTotal, safetyTarget, housingPct } = p;

  const hasMargin = margin > 0;
  const safetyRatio = safetyTarget > 0 ? Math.min(1, nonInvestedTotal / safetyTarget) : 0;
  const scoreSafety = clamp(
    Math.round(safetyRatio * 70 + (hasMargin ? 20 : 0) + (income > 0 && expenses / income <= 0.8 ? 10 : 0)),
    0, 100,
  );

  let scoreFlex = 100;
  const expensesPct = income > 0 ? (expenses / income) * 100 : 100;
  if (housingPct > 35) scoreFlex -= 40; else if (housingPct > 30) scoreFlex -= 25; else if (housingPct > 25) scoreFlex -= 12;
  if (expensesPct > 85) scoreFlex -= 40; else if (expensesPct > 75) scoreFlex -= 25; else if (expensesPct > 65) scoreFlex -= 12;
  if (totalLoanMonthly > 0 && income > 0 && totalLoanMonthly / income > 0.2) scoreFlex -= 12;
  scoreFlex = clamp(scoreFlex, 0, 100);

  const ambitionPct = income > 0 ? (monthlyOptimized / income) * 100 : 0;
  let scoreAmbition = 15;
  if (ambitionPct >= 30) scoreAmbition = 90;
  else if (ambitionPct >= 20) scoreAmbition = 75;
  else if (ambitionPct >= 10) scoreAmbition = 55;
  else if (ambitionPct > 0) scoreAmbition = 35;
  if (investedCapital > 0) scoreAmbition = Math.min(100, scoreAmbition + 10);

  const scoreGlobal = Math.round(scoreSafety * 0.35 + scoreFlex * 0.3 + scoreAmbition * 0.35);
  const profileTier: ProfileTier =
    scoreGlobal >= 70 ? "advanced" : scoreGlobal >= 50 ? "good" : scoreGlobal >= 35 ? "medium" : "fragile";

  return {
    scoreSafety,
    scoreFlex,
    scoreAmbition,
    scoreGlobal,
    profileTier,
    savingsRate: income > 0 ? (monthlyOptimized / income) * 100 : 0,
    currentSavingsRate: income > 0 ? (monthlyCurrent / income) * 100 : 0,
    marginRate: income > 0 ? (Math.max(0, income - expenses) / income) * 100 : 0,
  };
}

// ─── computeDiagnostic ──────────────────────────────────────────────────────

// Known legal caps per account type (in euros)
const ACCOUNT_CAPS: Record<string, number> = {
  "Livret A": 22950,
  "LEP": 10000,
  "LDDS": 12000,
  "Livret Jeune": 1600,
};

export type AllocationMove = {
  targetLabel: string; // e.g. "LEP", "Livret A", "Mon compte épargne"
  amount: number;
  ratePct: number;
  isCapped: boolean;
  remainingCapacity: number; // capacity left after the move (0 if filled to cap)
};

export type DiagnosticResult = {
  showSavingsReco: boolean;
  allocationMoves: AllocationMove[];
  totalToMove: number;
  showFundsEuroReco: boolean;
  suggestedUCAmount: number;
  fundsEuroGainAtH: number;
  // kept for backward compat
  showLivretAReco: boolean;
  amountToMoveToLivretA: number;
};

export function computeDiagnostic(p: {
  checking0: number;
  livretA0: number;
  livretARatePct: number;
  extras: ExtraLike[];
  expenses: number;
  safetyTarget: number;
  prudentCurrentCapital: number;
  dynamicPct: number;
  annualMarket: number;
  annualPrudent: number;
  H: number;
}): DiagnosticResult {
  const { checking0, livretA0, livretARatePct, extras, expenses, safetyTarget,
    prudentCurrentCapital, dynamicPct, annualMarket, annualPrudent, H } = p;

  // Amount to move = excess above one month of expenses in checking
  const excessInChecking = Math.max(0, checking0 - expenses);

  // Build candidate accounts sorted by rate descending
  type Candidate = {
    label: string;
    currentAmount: number;
    ratePct: number;
    cap: number; // Infinity if uncapped
  };

  const candidates: Candidate[] = [
    {
      label: "Livret A",
      currentAmount: livretA0,
      ratePct: livretARatePct > 0 ? livretARatePct : 1.5,
      cap: ACCOUNT_CAPS["Livret A"],
    },
    ...extras.map((e) => ({
      label: e.id, // we use id as label key; caller passes type as id
      currentAmount: e.amount,
      ratePct: e.ratePct,
      cap: ACCOUNT_CAPS[e.id] ?? Infinity,
    })),
  ]
    .filter((c) => c.ratePct > 0)
    .sort((a, b) => b.ratePct - a.ratePct);

  // Greedy allocation
  let remaining = excessInChecking;
  const moves: AllocationMove[] = [];

  for (const c of candidates) {
    if (remaining <= 0) break;
    const capacity = Math.max(0, c.cap - c.currentAmount);
    if (capacity <= 0) continue; // account full
    const move = Math.min(remaining, capacity);
    if (move < 1) continue;
    remaining -= move;
    const capacityAfter = Math.max(0, capacity - move);
    moves.push({
      targetLabel: c.label,
      amount: Math.round(move),
      ratePct: c.ratePct,
      isCapped: c.cap !== Infinity,
      remainingCapacity: Math.round(capacityAfter),
    });
  }

  const totalToMove = moves.reduce((s, m) => s + m.amount, 0);
  const showSavingsReco = totalToMove > 200;

  // Backward compat: first move to Livret A (or best)
  const livretMove = moves.find((m) => m.targetLabel === "Livret A");
  const showLivretAReco = showSavingsReco;
  const amountToMoveToLivretA = livretMove?.amount ?? (showSavingsReco ? totalToMove : 0);

  // Fonds euros quick win
  const showFundsEuroReco = prudentCurrentCapital > 3000 && H > 10 && dynamicPct < 40;
  const suggestedUCAmount = Math.round(prudentCurrentCapital * 0.3);
  const fundsEuroGainAtH = showFundsEuroReco
    ? Math.max(0, futureValue(suggestedUCAmount, 0, annualMarket, H) - futureValue(suggestedUCAmount, 0, annualPrudent, H))
    : 0;

  return {
    showSavingsReco, allocationMoves: moves, totalToMove,
    showLivretAReco, amountToMoveToLivretA,
    showFundsEuroReco, suggestedUCAmount, fundsEuroGainAtH,
  };
}

// ─── computeNextStep ────────────────────────────────────────────────────────

export type NextStepResult = {
  monthlyTarget: number;
  futureImpactAmount: number;
};

export function computeNextStep(p: {
  profileTier: ProfileTier;
  safetyGap: number;
  margin: number;
  additionalInvestable: number;
  annualMarket: number;
  H: number;
}): NextStepResult {
  const { profileTier, safetyGap, margin, additionalInvestable, annualMarket, H } = p;

  let monthlyTarget = 50;
  if (safetyGap > 0 && margin > 0) {
    monthlyTarget = Math.max(50, Math.min(
      Math.round(margin * 0.7 / 10) * 10,
      Math.ceil(safetyGap / 3 / 10) * 10,
    ));
  } else if (margin < 100) {
    monthlyTarget = 100;
  } else if (profileTier === "advanced" || profileTier === "good") {
    monthlyTarget = Math.max(50, Math.round(Math.max(0, additionalInvestable) * 0.5 / 50) * 50);
  } else {
    monthlyTarget = Math.max(50, Math.round(Math.max(0, additionalInvestable) * 0.7 / 50) * 50);
  }

  return {
    monthlyTarget,
    futureImpactAmount: Math.round(futureValue(0, monthlyTarget, annualMarket, H)),
  };
}
