"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ACCENT = "#2563eb";
const SUCCESS = "#16a34a";
const WARNING = "#f59e0b";
const NAVY = "#0f172a";
const SKY = "#3b82f6";
const GREEN = "#84cc16";

function euro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function futureValue(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
) {
  const months = Math.max(0, Math.round(years * 12));
  const r = annualRate / 12;
  let value = Math.max(0, initial);

  for (let i = 0; i < months; i++) {
    value = value * (1 + r) + Math.max(0, monthly);
  }

  return value;
}

function BrandLogo({
  size = 56,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 88 88" aria-hidden="true">
        <defs>
          <linearGradient id="cpArrowGradResults" x1="18%" y1="82%" x2="82%" y2="18%">
            <stop offset="0%" stopColor={SKY} />
            <stop offset="55%" stopColor="#22c1c3" />
            <stop offset="100%" stopColor={GREEN} />
          </linearGradient>
        </defs>

        <path
          d="M18 46C18 28.3 31.8 14 49 14c6.5 0 12.3 2 17 5.2l-7.2 7.1c-3-1.7-6.2-2.8-10.4-2.8-11.5 0-20.5 9.2-20.5 20.6 0 1.8.2 3.3.7 4.9l-8.8 2.3c-1.2-3.2-1.8-6.4-1.8-10.3Z"
          fill="#13254B"
        />
        <path
          d="M66.5 57.2C61.9 63.1 54.5 67 46.4 67c-9.9 0-18.6-5.2-23.6-12.9l10.6-.9c3.4 3.3 8 5.3 13.5 5.3 3.7 0 7.1-.8 10.2-2.5l9.4 1.2Z"
          fill="#13254B"
        />
        <path
          d="M20 50.7c3.8 4.3 10.6 4.1 15.3.2L60.8 27l-4.2-3.6 20-5.6-5.8 19.5-4.4-3.7-24 22.5c-7.4 6.9-18.7 7.1-25 .4l2.6-5.8Z"
          fill="url(#cpArrowGradResults)"
        />
      </svg>

      {withWordmark ? (
        <div className="leading-none">
          <div className="text-[28px] font-semibold tracking-tight">
            <span style={{ color: NAVY }}>Capital</span>
            <span style={{ color: "#4ea5e8" }}>Pilot</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniLineChart({
  years,
  seriesA,
  seriesB,
  labelA,
  labelB,
}: {
  years: number[];
  seriesA: number[];
  seriesB: number[];
  labelA: string;
  labelB: string;
}) {
  const W = 760;
  const H = 280;
  const P = 28;

  const maxY = Math.max(...seriesA, ...seriesB, 1);
  const minY = Math.min(...seriesA, ...seriesB, 0);

  const scaleX = (i: number) => {
    const n = years.length - 1;
    return P + (i / Math.max(1, n)) * (W - 2 * P);
  };

  const scaleY = (v: number) => {
    const t = (v - minY) / (maxY - minY || 1);
    return H - P - t * (H - 2 * P);
  };

  const pathFrom = (arr: number[]) =>
    arr
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"} ${scaleX(i).toFixed(1)} ${scaleY(v).toFixed(
            1
          )}`
      )
      .join(" ");

  return (
    <div className="overflow-hidden rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-950">Projection (comparaison)</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Patrimoine financier projeté selon 2 scénarios.
          </p>
        </div>

        <div className="grid gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#0f172a" }}
            />
            {labelA}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
            {labelB}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="lineBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#4ea5e8" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={W} height={H} rx="18" fill="transparent" />
          <line x1={P} y1={P} x2={P} y2={H - P} stroke="#e5e7eb" />
          <line
            x1={P}
            y1={H - P}
            x2={W - P}
            y2={H - P}
            stroke="#e5e7eb"
          />
          <line
            x1={P}
            y1={H / 2}
            x2={W - P}
            y2={H / 2}
            stroke="#f1f5f9"
          />

          <path d={pathFrom(seriesA)} fill="none" stroke="#0f172a" strokeWidth="3.2" />
          <path d={pathFrom(seriesB)} fill="none" stroke="url(#lineBlue)" strokeWidth="3.6" />

          <text x={P} y={P - 8} fontSize="11" fill="#6b7280">
            {euro(maxY)}
          </text>
          <text x={P} y={H / 2 - 8} fontSize="11" fill="#6b7280">
            {euro((maxY + minY) / 2)}
          </text>
          <text x={P} y={H - 8} fontSize="11" fill="#6b7280">
            0
          </text>
          <text x={W - P - 18} y={H - 8} fontSize="11" fill="#6b7280">
            {years[years.length - 1]}
          </text>
        </svg>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellente situation";
  if (score >= 70) return "Situation solide";
  if (score >= 55) return "Bonne base mais améliorable";
  if (score >= 40) return "Situation fragile";
  return "Situation à corriger rapidement";
}

function RingMeter({ label, score }: { label: string; score: number }) {
  const s = clamp(score, 0, 100);
  const color = s >= 70 ? SUCCESS : s >= 50 ? ACCENT : WARNING;

  return (
    <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-semibold text-zinc-900">{label}</p>
      <div className="mt-4 flex items-center gap-4">
        <div
          className="grid place-items-center rounded-full"
          style={{
            width: 88,
            height: 88,
            background: `conic-gradient(${color} ${s * 3.6}deg, #e5e7eb 0deg)`,
          }}
        >
          <div
            className="grid place-items-center rounded-full bg-white"
            style={{ width: 70, height: 70 }}
          >
            <div className="text-center">
              <div className="text-xl font-semibold" style={{ color }}>
                {Math.round(s)}
              </div>
              <div className="text-[10px] text-zinc-500">/100</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-zinc-600">{scoreLabel(s)}</div>
      </div>
    </div>
  );
}

type ExtraAccountType = "LEP" | "Livret Jeune" | "LDDS" | "Autre compte";
type ExtraAccount = {
  id: string;
  type: ExtraAccountType;
  amount: number;
  ratePct: number;
};

type Payload = {
  salary: number;
  otherIncome: number;

  housing: number;
  food: number;
  transport: number;
  leisure: number;
  subscriptions: number;
  misc: number;

  checkingAmount: number;
  livretAAmount: number;
  livretARatePct: number;
  extraAccounts: ExtraAccount[];

  safetyMonths: 3 | 4 | 5 | 6;

  hasInvestedCapital: boolean;
  investedCapitalTotal: number;

  investMonthly: boolean;
  monthlyInvestment: number;

  createdAt: number;
};

type Status =
  | "Très bien"
  | "OK"
  | "Excessif"
  | "Très excessif"
  | "Critique";

function classifyHousing(p: number): Status {
  if (p < 30) return "Très bien";
  if (Math.round(p) === 30) return "OK";
  if (p < 40) return "Excessif";
  if (p < 50) return "Très excessif";
  return "Critique";
}

function classifyGeneric(
  p: number,
  t1: number,
  t2: number,
  t3: number
): Status {
  if (p < t1) return "Très bien";
  if (p < t2) return "OK";
  if (p < t3) return "Excessif";
  return "Très excessif";
}

function allocateSafety(
  keepTotal: number,
  checking: number,
  livretA: number,
  extras: { id: string; amount: number; ratePct: number }[]
) {
  let remaining = Math.max(0, keepTotal);

  const keepChecking = Math.min(Math.max(0, checking), remaining);
  remaining -= keepChecking;

  const keepLivretA = Math.min(Math.max(0, livretA), remaining);
  remaining -= keepLivretA;

  const keepExtras = extras.map((e) => {
    const keep = Math.min(Math.max(0, e.amount), remaining);
    remaining -= keep;
    return { ...e, kept: keep };
  });

  return { keepChecking, keepLivretA, keepExtras };
}

export default function ResultatsPage() {
  const [data, setData] = useState<Payload | null>(null);

  const [horizon, setHorizon] = useState(40);
  const [ratePct, setRatePct] = useState(7);

  const [extraInvest, setExtraInvest] = useState(0);
  const [extraSpend, setExtraSpend] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("capitalpilot:v5");
    if (!raw) return;

    try {
      setData(JSON.parse(raw));
    } catch {
      setData(null);
    }
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    const income = Math.max(0, data.salary) + Math.max(0, data.otherIncome);

    const expenses =
      Math.max(0, data.housing) +
      Math.max(0, data.food) +
      Math.max(0, data.transport) +
      Math.max(0, data.leisure) +
      Math.max(0, data.subscriptions) +
      Math.max(0, data.misc);

    const margin = income > 0 ? Math.max(0, income - expenses) : 0;

    const declaredMonthly = data.investMonthly
      ? Math.max(0, data.monthlyInvestment)
      : 0;

    const monthlyInvestUsed = Math.min(declaredMonthly, margin);
    const remainingMargin = Math.max(0, margin - monthlyInvestUsed);
    const monthlyInconsistency =
      data.investMonthly && declaredMonthly > margin && margin > 0;

    const extras = (data.extraAccounts || []).map((a) => ({
      id: a.id,
      amount: Math.max(0, a.amount),
      ratePct: clamp(a.ratePct ?? 0, 0, 20),
    }));

    const checking0 = Math.max(0, data.checkingAmount);
    const livretA0 = Math.max(0, data.livretAAmount);
    const livretARate = (data.livretARatePct ?? 1.5) / 100;

    const nonInvestedTotal =
      checking0 + livretA0 + extras.reduce((s, e) => s + e.amount, 0);

    const safetyTarget = expenses * data.safetyMonths;
    const safetyGap = Math.max(0, safetyTarget - nonInvestedTotal);
    const immediateInvestable = Math.max(0, nonInvestedTotal - safetyTarget);

    const investedCapital = data.hasInvestedCapital
      ? Math.max(0, data.investedCapitalTotal)
      : 0;

    const annualMarket = clamp(ratePct, 0, 15) / 100;
    const H = clamp(Math.round(horizon), 5, 60);

    const baseInvestedFV = (years: number) =>
      futureValue(investedCapital, monthlyInvestUsed, annualMarket, years);

    const baseCashFV = (years: number) => {
      const checkingFV = futureValue(checking0, remainingMargin, 0, years);
      const livretAFV = futureValue(livretA0, 0, livretARate, years);
      const extrasFV = extras.reduce(
        (sum, e) => sum + futureValue(e.amount, 0, e.ratePct / 100, years),
        0
      );
      return checkingFV + livretAFV + extrasFV;
    };

    const baseTotalFV = (years: number) =>
      baseInvestedFV(years) + baseCashFV(years);

    const safetyKept = allocateSafety(
      safetyTarget,
      checking0,
      livretA0,
      extras
    );

    const improvedCashFV = (years: number) => {
      const checkingFV = futureValue(safetyKept.keepChecking, 0, 0, years);
      const livretAFV = futureValue(
        safetyKept.keepLivretA,
        0,
        livretARate,
        years
      );
      const extrasFV = safetyKept.keepExtras.reduce(
        (sum, e) => sum + futureValue(e.kept, 0, e.ratePct / 100, years),
        0
      );
      return checkingFV + livretAFV + extrasFV;
    };

    const improvedInvestedFV = (years: number) =>
      futureValue(
        investedCapital + immediateInvestable,
        margin,
        annualMarket,
        years
      );

    const improvedTotalFV = (years: number) =>
      improvedInvestedFV(years) + improvedCashFV(years);

    const simulatedMonthlyInvest = Math.max(
      0,
      monthlyInvestUsed + extraInvest - extraSpend
    );

    const simulatedInvestedFV = (years: number) =>
      futureValue(
        investedCapital + immediateInvestable,
        simulatedMonthlyInvest,
        annualMarket,
        years
      );

    const simulatedTotalFV = (years: number) =>
      simulatedInvestedFV(years) + improvedCashFV(years);

    const simulationImpact = simulatedTotalFV(H) - baseTotalFV(H);

    const delta20 = Math.max(0, improvedTotalFV(20) - baseTotalFV(20));
    const delta30 = Math.max(0, improvedTotalFV(30) - baseTotalFV(30));
    const delta40 = Math.max(0, improvedTotalFV(40) - baseTotalFV(40));

    const investsAlreadyMonthly = monthlyInvestUsed > 0;
    const labelA = investsAlreadyMonthly
      ? "Continuer comme aujourd’hui"
      : "Ne pas investir";
    const labelB = investsAlreadyMonthly ? "Optimiser" : "Investir";

    let headline = "";
    let subline = "";
    let bullets: string[] = [];

    if (!margin && !investsAlreadyMonthly) {
      headline = "Tes dépenses absorbent tes revenus";
      subline =
        "Avant d’investir, tu dois recréer une marge mensuelle.";
      bullets = ["Réduire dépenses", "Revenir en marge", "Puis investir"];
    } else if (!investsAlreadyMonthly) {
      headline = "Si tu n’investis pas, tu laisses de l’argent sur la table";
      subline =
        "En investissant ta marge et ton surplus, tu changes complètement la trajectoire.";
      bullets = [
        `≈ ${euro(delta20)} dans 20 ans`,
        `≈ ${euro(delta30)} dans 30 ans`,
        `≈ ${euro(delta40)} dans 40 ans`,
      ];
    } else {
      const investRate = margin > 0 ? monthlyInvestUsed / margin : 0;

      if (investRate >= 0.95) {
        headline = "Ta discipline d’investissement est excellente";
        subline =
          "Tu investis déjà quasiment toute ta marge. Le vrai levier est surtout le temps.";
      } else if (investRate >= 0.7) {
        headline = "Tu investis déjà une grande partie de ta marge";
        subline =
          "Ta trajectoire est solide. Tu peux encore optimiser le surplus restant.";
      } else if (investRate >= 0.3) {
        headline = "Tu es sur une bonne trajectoire, mais il reste du potentiel";
        subline =
          "Augmenter progressivement ton investissement mensuel accélérerait ta croissance.";
      } else {
        headline = "Tu investis déjà, mais tu peux accélérer fortement";
        subline =
          "Une plus grande part de ta marge pourrait être investie chaque mois.";
      }

      bullets = [
        `≈ +${euro(delta20)} dans 20 ans`,
        `≈ +${euro(delta30)} dans 30 ans`,
        `≈ +${euro(delta40)} dans 40 ans`,
      ];
    }

    const pct = (v: number) => (income > 0 ? (v / income) * 100 : 0);

    const housingPct = pct(data.housing);
    const foodPct = pct(data.food);
    const transportPct = pct(data.transport);
    const leisurePct = pct(data.leisure);
    const subsPct = pct(data.subscriptions);
    const miscPct = pct(data.misc);

    const housingStatus = classifyHousing(housingPct);
    const foodStatus = classifyGeneric(foodPct, 10, 15, 20);
    const transportStatus = classifyGeneric(transportPct, 10, 15, 20);
    const leisureStatus = classifyGeneric(leisurePct, 10, 15, 20);
    const subsStatus = classifyGeneric(subsPct, 5, 8, 12);
    const miscStatus = classifyGeneric(miscPct, 10, 15, 20);

    const positives: string[] = [];
    const negatives: string[] = [];

    if (safetyGap === 0 && safetyTarget > 0) {
      positives.push(
        `Épargne de sécurité OK (objectif ${data.safetyMonths} mois).`
      );
    } else {
      negatives.push(
        `Épargne de sécurité insuffisante : il manque ${euro(safetyGap)}.`
      );
    }

    if (immediateInvestable > 0) {
      positives.push(
        `Investissable maintenant : ${euro(immediateInvestable)}.`
      );
    } else {
      negatives.push(
        "Aucun excédent au-dessus de l’épargne de sécurité."
      );
    }

    if (monthlyInconsistency) {
      negatives.push(
        "Incohérence : investissement mensuel déclaré supérieur à la marge."
      );
    } else if (investsAlreadyMonthly) {
      positives.push(`Tu investis déjà : ${euro(monthlyInvestUsed)}/mois.`);
      if (remainingMargin > 0) {
        negatives.push(
          `Tu laisses encore ${euro(
            remainingMargin
          )}/mois sur le compte courant.`
        );
      }
    } else {
      negatives.push("Tu n’investis pas tous les mois.");
    }

    if (margin > 0) {
      positives.push(`Marge mensuelle : ${euro(margin)}/mois.`);
    } else {
      negatives.push("Aucune marge mensuelle : dépenses ≥ revenus.");
    }

    const line = (label: string, p: number, s: Status) =>
      `${label} : ${Math.round(p)}% — ${s}`;

    const pushExp = (label: string, p: number, s: Status) => {
      const l = line(label, p, s);
      if (s === "Très bien" || s === "OK") positives.push(l);
      else negatives.push(l);
    };

    pushExp("Logement", housingPct, housingStatus);
    pushExp("Nourriture", foodPct, foodStatus);
    pushExp("Transport", transportPct, transportStatus);
    pushExp("Loisirs", leisurePct, leisureStatus);
    pushExp("Abonnements", subsPct, subsStatus);
    pushExp("Divers", miscPct, miscStatus);

    const yearsArr = Array.from({ length: H + 1 }, (_, i) => i);
    const seriesBase = yearsArr.map((y) => baseTotalFV(y));
    const seriesImproved = yearsArr.map((y) => improvedTotalFV(y));

    const safetyRatio =
      safetyTarget > 0 ? Math.min(1, nonInvestedTotal / safetyTarget) : 0;

    let scoreSafety = Math.round(
      safetyRatio * 70 +
        (margin > 0 ? 20 : 0) +
        (income > 0 && expenses / income <= 0.8 ? 10 : 0)
    );
    scoreSafety = clamp(scoreSafety, 0, 100);

    let safetyExplanation = "";
    if (safetyRatio >= 1) {
      safetyExplanation =
        "Ton épargne de sécurité couvre entièrement l’objectif.";
    } else if (safetyRatio >= 0.7) {
      safetyExplanation =
        "Ton épargne de sécurité est presque complète.";
    } else if (safetyRatio > 0.3) {
      safetyExplanation =
        "Ton épargne de sécurité est partielle.";
    } else {
      safetyExplanation =
        "Ton épargne de sécurité est insuffisante.";
    }

    let scoreFlex = 100;
    const expensesPct = income > 0 ? (expenses / income) * 100 : 100;

    if (housingPct > 35) scoreFlex -= 40;
    else if (housingPct > 30) scoreFlex -= 25;
    else if (housingPct > 25) scoreFlex -= 12;

    if (expensesPct > 85) scoreFlex -= 40;
    else if (expensesPct > 75) scoreFlex -= 25;
    else if (expensesPct > 65) scoreFlex -= 12;

    scoreFlex = clamp(scoreFlex, 0, 100);

    let flexExplanation = "";
    if (housingPct <= 30 && expensesPct <= 70) {
      flexExplanation =
        "Ta structure de dépenses te laisse une bonne marge de manœuvre.";
    } else if (housingPct <= 35 && expensesPct <= 80) {
      flexExplanation =
        "Ta flexibilité est correcte, mais certaines dépenses pèsent déjà.";
    } else if (housingPct <= 40 && expensesPct <= 90) {
      flexExplanation =
        "Ta structure de dépenses commence à limiter fortement ta marge.";
    } else {
      flexExplanation =
        "Tes dépenses fixes sont trop lourdes par rapport à tes revenus.";
    }

    const ambitionPct = income > 0 ? (margin / income) * 100 : 0;
    let scoreAmbition = 15;
    if (ambitionPct >= 30) scoreAmbition = 90;
    else if (ambitionPct >= 20) scoreAmbition = 75;
    else if (ambitionPct >= 10) scoreAmbition = 55;
    else if (ambitionPct > 0) scoreAmbition = 35;

    if (investsAlreadyMonthly) {
      scoreAmbition = Math.min(100, scoreAmbition + 10);
    }

    let ambitionExplanation = "";
    if (investsAlreadyMonthly && monthlyInvestUsed >= margin * 0.9) {
      ambitionExplanation =
        "Tu investis déjà presque toute ta marge disponible.";
    } else if (investsAlreadyMonthly && monthlyInvestUsed > 0) {
      ambitionExplanation =
        "Tu investis déjà régulièrement, mais tu peux encore accélérer.";
    } else if (margin > 0) {
      ambitionExplanation =
        "Tu as une capacité d’investissement, mais elle n’est pas encore exploitée.";
    } else {
      ambitionExplanation =
        "Sans marge mensuelle, il est difficile de construire une stratégie ambitieuse.";
    }

    const scoreGlobal = Math.round(
      scoreSafety * 0.35 + scoreFlex * 0.3 + scoreAmbition * 0.35
    );

    return {
      margin,
      monthlyInvestUsed,
      remainingMargin,
      nonInvestedTotal,
      safetyTarget,
      safetyGap,
      immediateInvestable,

      headline,
      subline,
      bullets,

      scoreSafety,
      scoreFlex,
      scoreAmbition,
      scoreGlobal,

      safetyExplanation,
      flexExplanation,
      ambitionExplanation,

      positives,
      negatives,

      yearsArr,
      seriesBase,
      seriesImproved,
      labelA,
      labelB,

      simulationImpact,
    };
  }, [data, horizon, ratePct, extraInvest, extraSpend]);

  if (!data || !computed) {
    return (
      <main
        className="min-h-screen text-zinc-900"
        style={{
          background:
            "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(248,250,252,1) 24%, rgba(255,255,255,1) 100%)",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-[32px] border border-zinc-200/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <BrandLogo withWordmark size={62} />
            <h1 className="mt-6 text-3xl font-semibold" style={{ color: ACCENT }}>
              Résultats
            </h1>
            <p className="mt-2 text-zinc-600">
              Aucune donnée trouvée. Retourne à l’accueil et génère ton diagnostic.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 100%)",
                }}
              >
                Retour au formulaire
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const globalColor =
    computed.scoreGlobal >= 70
      ? SUCCESS
      : computed.scoreGlobal >= 50
      ? ACCENT
      : WARNING;

  return (
    <main
      className="min-h-screen text-zinc-900"
      style={{
        background:
          "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(248,250,252,1) 20%, rgba(255,255,255,1) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
<div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(132,204,22,0.10),transparent_24%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f172a_100%)] p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.05))]" />

  <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
    <div>
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-blue-50/90 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-blue-300" />
        Résultats — Diagnostic
      </div>

      <div className="mt-5">
  <div className="text-[24px] font-semibold tracking-tight leading-none sm:text-[28px]">
    <span className="text-white">Capital</span>
    <span style={{ color: "#6bb8f0" }}>Pilot</span>
  </div>
</div>

      <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Ton diagnostic financier, rendu lisible et actionnable.
      </h1>

      <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/85 sm:text-base">
        Une lecture claire de ta situation actuelle, de ton potentiel
        d’investissement et de l’impact concret de tes décisions sur le long terme.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">
            Cash non investi
          </p>
          <p className="mt-1 text-lg font-semibold">
            {euro(computed.nonInvestedTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">
            Objectif sécurité
          </p>
          <p className="mt-1 text-lg font-semibold">
            {euro(computed.safetyTarget)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">
            Investissable now
          </p>
          <p className="mt-1 text-lg font-semibold">
            {euro(computed.immediateInvestable)}
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-4">
      <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">Score global</p>
        <div className="mt-3 flex items-end gap-3">
          <p className="text-6xl font-semibold tracking-tight" style={{ color: "#ffffff" }}>
            {computed.scoreGlobal}
          </p>
          <p className="pb-2 text-sm text-blue-100/75">/100</p>
        </div>
        <p className="mt-2 text-sm text-blue-50/85">
          Basé sur Sécurité (35%), Flexibilité (30%), Ambition (35%).
        </p>
      </div>

      <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">Lecture rapide</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs text-blue-100/70">Investi aujourd’hui</p>
            <p className="mt-1 text-xl font-semibold">
              {euro(computed.monthlyInvestUsed)}/mois
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs text-blue-100/70">Cash laissé</p>
            <p className="mt-1 text-xl font-semibold">
              {euro(computed.remainingMargin)}/mois
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">Action clé</p>
        <p className="mt-3 text-sm leading-7 text-blue-50/85">
          {computed.headline} — {computed.subline}
        </p>
      </div>
    </div>
  </div>
</div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Épargne non investie</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">{euro(computed.nonInvestedTotal)}</p>
          </div>
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Objectif sécurité</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">{euro(computed.safetyTarget)}</p>
          </div>
          <div
            className="rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
            style={{
              borderColor: "rgba(37,99,235,0.16)",
              background: "linear-gradient(180deg, rgba(239,246,255,0.92) 0%, rgba(255,255,255,0.98) 100%)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Investissable maintenant</p>
            <p className="mt-2 text-3xl font-semibold" style={{ color: ACCENT }}>
              {euro(computed.immediateInvestable)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Ce montant est investi immédiatement dans le scénario optimisé.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Message clé</p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                {computed.headline}
              </h2>
             <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500">
  Ce scénario estime l’effet d’une optimisation simple : investir immédiatement
  votre surplus cash, puis investir votre marge disponible chaque mois.
</p>
            </div>

            <Link
              href="/"
              className="hidden h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 md:inline-flex"
            >
              Modifier mes infos
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {computed.bullets.map((b, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/85 p-4"
              >
                <p className="text-sm font-semibold" style={{ color: ACCENT }}>
                  {b}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Actuel : {euro(computed.monthlyInvestUsed)}/mois investis —{" "}
            {euro(computed.remainingMargin)}/mois laissés en cash.
          </p>

          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 md:hidden"
          >
            Modifier mes infos
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-end justify-between">
              <p className="text-sm font-semibold text-zinc-900">Horizon</p>
              <p
                className="text-sm font-semibold"
                style={{ color: ACCENT }}
              >
                {clamp(horizon, 5, 60)} ans
              </p>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <p className="mt-2 text-xs text-zinc-500">Par défaut : 40 ans.</p>
          </div>

          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-end justify-between">
              <p className="text-sm font-semibold text-zinc-900">Rendement annuel</p>
              <p
                className="text-sm font-semibold"
                style={{ color: ACCENT }}
              >
                {clamp(ratePct, 0, 15)}%
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Par défaut : 7% — marché actions mondial.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <RingMeter label="🛡 Sécurité" score={computed.scoreSafety} />
            <p className="mt-2 px-1 text-xs leading-6 text-zinc-500">
              {computed.safetyExplanation}
            </p>
          </div>

          <div>
            <RingMeter label="🔄 Flexibilité" score={computed.scoreFlex} />
            <p className="mt-2 px-1 text-xs leading-6 text-zinc-500">
              {computed.flexExplanation}
            </p>
          </div>

          <div>
            <RingMeter label="🚀 Ambition" score={computed.scoreAmbition} />
            <p className="mt-2 px-1 text-xs leading-6 text-zinc-500">
              {computed.ambitionExplanation}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <MiniLineChart
            years={computed.yearsArr}
            seriesA={computed.seriesBase}
            seriesB={computed.seriesImproved}
            labelA={computed.labelA}
            labelB={computed.labelB}
          />
        </div>

        <div className="mt-6 rounded-[30px] border border-zinc-200/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-lg font-semibold text-zinc-950">Simuler une décision</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Teste l’impact de tes choix financiers.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-zinc-900">
                Investir plus chaque mois
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={extraInvest}
                onChange={(e) => setExtraInvest(Number(e.target.value))}
                className="mt-3 w-full accent-blue-600"
              />
              <p className="mt-2 text-sm text-zinc-600">
                +{euro(extraInvest)} / mois
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">
                Dépenser plus chaque mois
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={extraSpend}
                onChange={(e) => setExtraSpend(Number(e.target.value))}
                className="mt-3 w-full accent-blue-600"
              />
              <p className="mt-2 text-sm text-zinc-600">
                +{euro(extraSpend)} / mois
              </p>
            </div>
          </div>

          <div
            className="mt-6 rounded-2xl border p-5"
            style={{
              borderColor: "rgba(37,99,235,0.16)",
              background: "linear-gradient(180deg, rgba(239,246,255,0.92) 0%, rgba(255,255,255,0.98) 100%)",
            }}
          >
            <p className="text-sm text-zinc-600">Impact sur {horizon} ans</p>
            <p className="mt-1 text-3xl font-semibold text-blue-600">
              {computed.simulationImpact > 0 ? "+" : ""}
              {euro(computed.simulationImpact)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="✅ Points positifs">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
              {computed.positives.length ? (
                computed.positives.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li>—</li>
              )}
            </ul>
          </Card>

          <Card title="⚠️ Points à améliorer">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
              {computed.negatives.length ? (
                computed.negatives.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li>Rien d’urgent détecté.</li>
              )}
            </ul>
          </Card>
        </div>
<div className="mt-8 flex justify-center">
  <button
    type="button"
    disabled
    className="inline-flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm"
  >
    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
    Recommandations personnalisées — bientôt disponible
  </button>
</div>
        <p className="mt-8 text-center text-xs text-zinc-500">
          Disclaimer : outil pédagogique basé sur des hypothèses simplifiées.
          Ceci ne constitue pas un conseil en investissement.
        </p>
      </div>
    </main>
  );
}