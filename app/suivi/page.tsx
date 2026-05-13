"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ACCENT = "#2563EB";
const SUCCESS = "#16A34A";

function euro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(n)
    .replace(/\u202F/g, "\u00A0")
    .replace(/\u00A0/g, " ");
}

function futureValue(initial: number, monthly: number, annualRate: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const r = Math.max(0, annualRate) / 12;
  let value = Math.max(0, initial);
  for (let i = 0; i < months; i++) value = value * (1 + r) + Math.max(0, monthly);
  return value;
}

type Loan = { id: string; label: string; monthlyPayment: number; remainingCapital: number; ratePct: number; remainingYears: number };
type ExtraAccount = { id: string; type: string; amount: number; ratePct: number };
type InvestmentBreakdown = { pea: number; cto: number; assuranceVieFondsEuro: number; assuranceVieUC: number; immobilier: number; crowdfunding: number; crypto: number; per: number; autres: number };
type Payload = {
  salary: number; otherIncome: number; housing: number; food: number;
  transport: number; leisure: number; subscriptions: number; misc: number;
  checkingAmount: number; livretAAmount: number; livretARatePct: number;
  extraAccounts: ExtraAccount[]; safetyMonths: 3 | 4 | 5 | 6;
  investMonthly: boolean; monthlyInvestment: number; createdAt: number;
  age?: number; electricity?: number; loans?: Loan[]; recommendedHorizon?: number;
  hasInvestedCapital?: boolean; investedCapitalTotal?: number;
  investmentBreakdown?: InvestmentBreakdown;
  savingsMonthly?: number;
  investmentMonthly?: number;
};
type TrackingData = { month: string; progress: number; streak: number; milestones: string[] };
type LifeGoal = { label: string; targetAmount: number; targetYear: number; supportLabel: string; ratePct: number; createdAt: number };
type MonthEntry = { month: string; invested: number; cumulative: number; scoreAtMonth: number };

const ALL_MILESTONES = [
  { id: "first_month",    label: "1er mois validé",        icon: "✦" },
  { id: "streak_3",       label: "3 mois d'affilée",       icon: "◆" },
  { id: "streak_6",       label: "6 mois d'affilée",       icon: "★" },
  { id: "safety_reached", label: "Matelas de sécurité atteint", icon: "⬡" },
];

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function classifyHousing(p: number) {
  if (p < 30) return "Très bien";
  if (p < 35) return "OK";
  if (p < 45) return "Excessif";
  return "Critique";
}

function classifyGeneric(p: number, t1: number, t2: number, t3: number) {
  if (p < t1) return "Très bien";
  if (p < t2) return "OK";
  if (p < t3) return "Excessif";
  return "Très excessif";
}

function MiniLineChart({ years, seriesA, seriesB, seriesC, labelA, labelB, labelC }: {
  years: number[]; seriesA: number[]; seriesB: number[]; seriesC?: number[];
  labelA: string; labelB: string; labelC?: string;
}) {
  const W = 820, H = 300, PL = 74, PR = 28, PT = 24, PB = 38;
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const hasC = seriesC !== undefined && seriesC.length > 0;
  const maxY = Math.max(...seriesA, ...seriesB, ...(hasC ? seriesC! : []), 1);
  const scaleX = (i: number) => PL + (i / Math.max(1, years.length - 1)) * (W - PL - PR);
  const scaleY = (v: number) => H - PB - (v / maxY) * (H - PT - PB);
  const pathStr = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ");
  const areaStr = (arr: number[]) => `${pathStr(arr)} L${scaleX(arr.length - 1).toFixed(1)},${H - PB} L${PL},${H - PB} Z`;
  const pathLen = W * 3;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => maxY * t);
  const xStep = Math.max(1, Math.floor(years.length / 6));
  const xTickIdxs = years.reduce((acc: number[], _, i) => { if (i % xStep === 0 || i === years.length - 1) acc.push(i); return acc; }, []);

  function shortEuro(v: number) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} M€`;
    if (v >= 1_000) return `${Math.round(v / 1_000)} k€`;
    return `${Math.round(v)} €`;
  }

  const tt = tooltipIdx;
  const ttRight = tt !== null && scaleX(tt) > W * 0.62;

  return (
    <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #0c1a3a 100%)", borderRadius: 28, padding: "28px 24px", position: "relative", overflow: "hidden", boxShadow: "0 30px 90px rgba(15,23,42,0.35)" }}>
      <div style={{ position: "absolute", top: "5%", left: "15%", width: 320, height: 220, background: "radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 260, height: 200, background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 600, margin: 0 }}>Trois futurs. Un choix.</h3>
          <p style={{ color: "#64748b", fontSize: 13, margin: "5px 0 0" }}>L&apos;impact de corriger tes dépenses critiques sur le long terme.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
            <span style={{ color: "#fca5a5", fontSize: 12 }}>{labelA}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#16A34A" strokeWidth="3" /></svg>
            <span style={{ color: "#86efac", fontSize: 12 }}>{labelB}</span>
          </div>
          {hasC && labelC && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
              <span style={{ color: "#fde68a", fontSize: 12 }}>{labelC}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
          onMouseLeave={() => setTooltipIdx(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            let closest = 0, minDist = Infinity;
            years.forEach((_, i) => { const d = Math.abs(scaleX(i) - mx); if (d < minDist) { minDist = d; closest = i; } });
            setTooltipIdx(minDist < 50 ? closest : null);
          }}
        >
          <defs>
            <linearGradient id="sgA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sgB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="sgC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            <filter id="sGlowGreen" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="sGlowRed" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="sGlowAmber" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {yTicks.map((v, i) => <line key={i} x1={PL} y1={scaleY(v)} x2={W - PR} y2={scaleY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}

          <path d={areaStr(seriesA)} fill="url(#sgA)" />
          <path d={areaStr(seriesB)} fill="url(#sgB)" />
          {hasC && <path d={areaStr(seriesC!)} fill="url(#sgC)" />}

          <path d={pathStr(seriesA)} fill="none" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="8 5" filter="url(#sGlowRed)" />
          <path d={pathStr(seriesB)} fill="none" stroke="#16a34a" strokeWidth="3.5" filter="url(#sGlowGreen)"
            style={{ strokeDasharray: pathLen, strokeDashoffset: animated ? 0 : pathLen, transition: "stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {hasC && <path d={pathStr(seriesC!)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 4" filter="url(#sGlowAmber)"
            style={{ opacity: animated ? 1 : 0, transition: "opacity 0.6s ease 1.8s" }}
          />}

          {yTicks.map((v, i) => <text key={i} x={PL - 8} y={scaleY(v) + 4} textAnchor="end" fontSize="10" fill="rgba(100,116,139,0.85)">{shortEuro(v)}</text>)}
          {xTickIdxs.map(idx => <text key={idx} x={scaleX(idx)} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(100,116,139,0.85)">{years[idx]} ans</text>)}

          {tt !== null && (() => {
            const bx = ttRight ? scaleX(tt) - 192 : scaleX(tt) + 14;
            const by = Math.max(PT, Math.min(scaleY(seriesB[tt]) - 45, H - PB - 110));
            return (
              <g>
                <line x1={scaleX(tt)} y1={PT} x2={scaleX(tt)} y2={H - PB} stroke="rgba(255,255,255,0.13)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx={scaleX(tt)} cy={scaleY(seriesA[tt])} r="4.5" fill="#1e293b" stroke="#DC2626" strokeWidth="2" />
                <circle cx={scaleX(tt)} cy={scaleY(seriesB[tt])} r="6" fill="#15803d" stroke="#86efac" strokeWidth="2.5" />
                {hasC && <circle cx={scaleX(tt)} cy={scaleY(seriesC![tt])} r="4.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />}
                <rect x={bx} y={by} width="178" height={hasC ? 110 : 82} rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                <text x={bx + 13} y={by + 20} fontSize="11" fill="#64748b" fontWeight="500">Année {years[tt]}</text>
                <text x={bx + 13} y={by + 42} fontSize="11" fill="#fca5a5">{labelA.length > 20 ? labelA.slice(0, 20) + "…" : labelA}</text>
                <text x={bx + 165} y={by + 42} fontSize="11" fill="#fca5a5" textAnchor="end" fontWeight="700">{shortEuro(seriesA[tt])}</text>
                <text x={bx + 13} y={by + 62} fontSize="11" fill="#86efac">{labelB.length > 20 ? labelB.slice(0, 20) + "…" : labelB}</text>
                <text x={bx + 165} y={by + 62} fontSize="11" fill="#86efac" textAnchor="end" fontWeight="700">{shortEuro(seriesB[tt])}</text>
                {hasC && labelC && <>
                  <text x={bx + 13} y={by + 82} fontSize="11" fill="#fde68a">{labelC.length > 20 ? labelC.slice(0, 20) + "…" : labelC}</text>
                  <text x={bx + 165} y={by + 82} fontSize="11" fill="#fde68a" textAnchor="end" fontWeight="700">{shortEuro(seriesC![tt])}</text>
                </>}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function isValidPayload(raw: unknown): raw is Payload {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Record<string, unknown>;
  return (
    typeof p.salary === "number" &&
    typeof p.otherIncome === "number" &&
    typeof p.housing === "number" &&
    typeof p.safetyMonths === "number" &&
    Array.isArray(p.extraAccounts)
  );
}

function defaultTracking(): TrackingData {
  return { month: currentMonthKey(), progress: 0, streak: 0, milestones: [] };
}

function DriftAlert({ level, cost, monthLabel, daysRemaining, monthlyTarget }: {
  level: "none" | "warning" | "danger" | "missed";
  cost: number;
  monthLabel: string;
  daysRemaining: number;
  monthlyTarget: number;
}) {
  if (level === "none") return null;

  const configs = {
    warning: {
      bg: "border-amber-200 bg-amber-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 3L18 17H2L10 3Z" stroke="#d97706" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M10 9V12" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="10" cy="14.5" r="0.8" fill="#d97706"/>
        </svg>
      ),
      title: `Tu as encore ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} pour valider ${monthLabel}.`,
      sub: `Chaque jour sans investissement te coûte ${euro(Math.round(cost / new Date().getDate()))} sur ton objectif.`,
      titleColor: "text-amber-800",
      subColor: "text-amber-600",
    },
    danger: {
      bg: "border-red-200 bg-red-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#dc2626" strokeWidth="1.8"/>
          <path d="M10 6V10" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="10" cy="13.5" r="0.8" fill="#dc2626"/>
        </svg>
      ),
      title: `Tu as pris du retard sur ${monthLabel}.`,
      sub: `${daysRemaining} jours restants — l'inaction t'a déjà coûté ${euro(cost)} sur ton objectif.`,
      titleColor: "text-red-800",
      subColor: "text-red-600",
    },
    missed: {
      bg: "border-red-300 bg-red-100",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#b91c1c" strokeWidth="1.8"/>
          <path d="M7 7L13 13M13 7L7 13" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: `Tu as manqué un mois de validation.`,
      sub: `Ton streak est en danger. Valide ${monthLabel} maintenant pour ne pas perdre ta progression.`,
      titleColor: "text-red-900",
      subColor: "text-red-700",
    },
  };

  const config = configs[level];

  return (
    <div className={`rounded-[22px] border ${config.bg} px-5 py-4 mb-6`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div>
          <p className={`text-sm font-semibold ${config.titleColor}`}>{config.title}</p>
          <p className={`text-xs mt-1 leading-relaxed ${config.subColor}`}>{config.sub}</p>
          {level !== "warning" && monthlyTarget > 0 && (
            <p className={`text-xs mt-1 font-semibold ${config.titleColor}`}>
              → Investis {euro(monthlyTarget)} maintenant pour rester sur ta trajectoire.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuiviPage() {
  const [isPremium, setIsPremium] = useState(true);
  const [data, setData] = useState<Payload | null>(null);
  const [tracking, setTracking] = useState<TrackingData>(defaultTracking());
  const [progressInput, setProgressInput] = useState(0);
  const [horizon, setHorizon] = useState(5);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [goal, setGoal] = useState<LifeGoal | null>(null);
  const [history, setHistory] = useState<MonthEntry[]>([]);

  // Modal form state
  const [goalLabel, setGoalLabel] = useState("");
  const [goalAmount, setGoalAmount] = useState(0);
  const [goalYear, setGoalYear] = useState(new Date().getFullYear() + 10);
  const [goalSupport, setGoalSupport] = useState("PEA / ETF");
  const [goalRate, setGoalRate] = useState(7);

  useEffect(() => {
    try {
      const rawP = localStorage.getItem("capitalpilot:premium");
      if (rawP) setIsPremium(JSON.parse(rawP) === true);
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem("capitalpilot:v5");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidPayload(parsed)) {
          setData(parsed);
          const inferredAge = parsed.age ?? 30;
          const inferredHorizon = parsed.recommendedHorizon ?? Math.max(5, 65 - inferredAge);
          setHorizon(clamp(inferredHorizon, 5, 60));
        }
      }
    } catch { /* ignore */ }

    try {
      const rawT = localStorage.getItem("capitalpilot:tracking:v1");
      if (rawT) {
        const parsed = JSON.parse(rawT) as TrackingData;
        if (parsed.month && typeof parsed.streak === "number") {
          if (parsed.month !== currentMonthKey()) {
            setTracking({ month: currentMonthKey(), progress: 0, streak: parsed.streak, milestones: parsed.milestones ?? [] });
          } else {
            setTracking(parsed);
          }
        }
      }
    } catch { /* ignore */ }

    try {
      const rawG = localStorage.getItem("capitalpilot:goal:v1");
      if (rawG) {
        const parsed = JSON.parse(rawG) as LifeGoal;
        if (parsed.label && parsed.targetAmount && parsed.targetYear) setGoal(parsed);
      }
    } catch { /* ignore */ }

    try {
      const rawH = localStorage.getItem("capitalpilot:history:v1");
      if (rawH) {
        const parsed = JSON.parse(rawH) as MonthEntry[];
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;
    const age = data.age ?? 30;
    const loans = data.loans ?? [];
    const H = clamp(data.recommendedHorizon ?? Math.max(5, 65 - age), 5, 60);
    const income = data.salary + data.otherIncome;
    const loanPayments = loans.reduce((s, l) => s + l.monthlyPayment, 0);
    const expenses = data.housing + data.food + data.transport + data.leisure + data.subscriptions + data.misc + (data.electricity ?? 0) + loanPayments;
    const margin = income - expenses;
    const savingsMonthly = Math.max(0, data.savingsMonthly ?? 0);
    const investmentMonthly = Math.max(0, data.investmentMonthly ?? data.monthlyInvestment ?? 0);
    const monthlyCurrent = savingsMonthly + investmentMonthly;
    const additionalInvestable = Math.max(0, margin - monthlyCurrent);
    const monthlyOptimized = monthlyCurrent + additionalInvestable;
    const investedCapital = data.investedCapitalTotal ?? 0;
    const safetyTarget = expenses * data.safetyMonths;
    const nonInvestedTotal = data.checkingAmount + data.livretAAmount + (data.extraAccounts ?? []).reduce((s, a) => s + a.amount, 0);
    const safetyGap = Math.max(0, safetyTarget - nonInvestedTotal);
    const baseAtH = futureValue(investedCapital, monthlyCurrent, 0.04, H);
    const improvedAtH = futureValue(investedCapital, monthlyOptimized, 0.07, H);
    const deltaH = Math.max(0, improvedAtH - baseAtH);

    const monthlyTarget = monthlyCurrent > 0
      ? monthlyCurrent
      : Math.round(Math.max(0, margin) * 0.1);

    let nextStepTitle = "Automatise ton investissement mensuel";
    let nextStepText = `Mets en place un virement automatique de ${euro(monthlyTarget)}/mois vers ton placement principal.`;
    if (safetyGap > 0) {
      nextStepTitle = "Complète ton matelas de sécurité";
      nextStepText = `Il te manque ${euro(safetyGap)} pour atteindre ${data.safetyMonths} mois de dépenses. Priorise ça avant tout.`;
    } else if (additionalInvestable > 50) {
      nextStepTitle = "Tu peux investir davantage";
      nextStepText = `Tu as ${euro(additionalInvestable)}/mois non utilisés. Augmente ton investissement mensuel.`;
    }

    const futureImpactAmount = futureValue(0, monthlyTarget, 0.07, H);

    const pctOf = (v: number) => income > 0 ? (v / income) * 100 : 0;
    const housingPct   = pctOf(data.housing);
    const foodPct      = pctOf(data.food);
    const transportPct = pctOf(data.transport);
    const leisurePct   = pctOf(data.leisure);
    const subsPct      = pctOf(data.subscriptions);
    const miscPct      = pctOf(data.misc);

    const surplusHousing   = Math.max(0, data.housing      - income * 0.35);
    const surplusFood      = Math.max(0, data.food          - income * 0.18);
    const surplusTransport = Math.max(0, data.transport     - income * 0.18);
    const surplusLeisure   = Math.max(0, data.leisure       - income * 0.15);
    const surplusSubs      = Math.max(0, data.subscriptions - income * 0.06);
    const surplusMisc      = Math.max(0, data.misc          - income * 0.15);
    const totalMonthlySurplus = surplusHousing + surplusFood + surplusTransport + surplusLeisure + surplusSubs + surplusMisc;

    const surplusBreakdown = [
      { label: "Logement",    amount: surplusHousing,   pct: income > 0 ? Math.round(data.housing / income * 100)      : 0, status: classifyHousing(housingPct) },
      { label: "Nourriture",  amount: surplusFood,       pct: income > 0 ? Math.round(data.food / income * 100)         : 0, status: classifyGeneric(foodPct,      12, 18, 25) },
      { label: "Transport",   amount: surplusTransport,  pct: income > 0 ? Math.round(data.transport / income * 100)    : 0, status: classifyGeneric(transportPct,  10, 18, 25) },
      { label: "Loisirs",     amount: surplusLeisure,    pct: income > 0 ? Math.round(data.leisure / income * 100)      : 0, status: classifyGeneric(leisurePct,    10, 15, 20) },
      { label: "Abonnements", amount: surplusSubs,       pct: income > 0 ? Math.round(data.subscriptions / income * 100): 0, status: classifyGeneric(subsPct,        3,  6, 10) },
      { label: "Divers",      amount: surplusMisc,       pct: income > 0 ? Math.round(data.misc / income * 100)         : 0, status: classifyGeneric(miscPct,       10, 15, 20) },
    ].filter(e => e.amount > 0);

    const yearsArr = Array.from({ length: H + 1 }, (_, i) => i);
    const hasSplit = data.savingsMonthly !== undefined;
    const livretARate = clamp((data.livretARatePct ?? 1.5), 0, 8) / 100;
    const seriesBase = hasSplit
      ? yearsArr.map(y => futureValue(0, savingsMonthly, livretARate, y) + futureValue(investedCapital, investmentMonthly, 0.04, y))
      : yearsArr.map(y => futureValue(investedCapital, monthlyCurrent, 0.04, y));
    const seriesImproved  = yearsArr.map(y => futureValue(investedCapital, monthlyOptimized,                     0.07, y));
    const seriesOptimized = yearsArr.map(y => futureValue(investedCapital, monthlyCurrent + totalMonthlySurplus, 0.07, y));

    // ── Premium-only calculations ──
    let monthsRemaining = 0;
    let projectedAtTarget = 0;
    let progressToGoalPct = 0;
    let monthlyNeededForGoal = 0;
    let onTrack = false;
    let score = 50;
    let cumulativeInvested = 0;

    if (goal) {
      const today = new Date();
      const targetDate = new Date(goal.targetYear, 0, 1);
      monthsRemaining = Math.max(0,
        (targetDate.getFullYear() - today.getFullYear()) * 12
        + (targetDate.getMonth() - today.getMonth())
      );
      const yearsRemaining = monthsRemaining / 12;
      cumulativeInvested = history.reduce((s, e) => s + e.invested, 0);

      const goalRate = (goal.ratePct ?? 7) / 100;

      projectedAtTarget = futureValue(
        (data?.investedCapitalTotal ?? 0) + cumulativeInvested,
        monthlyCurrent,
        goalRate,
        yearsRemaining
      );

      progressToGoalPct = goal.targetAmount > 0
        ? Math.min(100, (projectedAtTarget / goal.targetAmount) * 100)
        : 0;

      monthlyNeededForGoal = (() => {
        const months = Math.max(1, monthsRemaining);
        const r = goalRate / 12;
        const capital = (data?.investedCapitalTotal ?? 0) + cumulativeInvested;
        const fvCapital = capital * Math.pow(1 + r, months);
        const remaining = Math.max(0, goal.targetAmount - fvCapital);
        return remaining > 0 ? remaining * r / (Math.pow(1 + r, months) - 1) : 0;
      })();

      onTrack = monthlyCurrent >= monthlyNeededForGoal * 0.9;

      score = (() => {
        let s = 50;
        if (monthlyCurrent >= monthlyNeededForGoal) s += 30;
        else if (monthlyCurrent >= monthlyNeededForGoal * 0.7) s += 15;
        if (history.length >= 3) s += 10;
        if (history.length >= 6) s += 10;
        const lastThree = history.slice(-3);
        const allHitTarget = lastThree.every(e => e.invested >= (monthlyCurrent * 0.9));
        if (lastThree.length >= 3 && allHitTarget) s += 10;
        return Math.min(100, Math.max(0, s));
      })();
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    const currentMonth = currentMonthKey();
    const hasNotValidatedThisMonth = tracking.month !== currentMonth;

    const dailyCost = monthlyCurrent > 0
      ? (monthlyCurrent * 0.07) / 365
      : (monthlyTarget * 0.07) / 365;

    const driftCost = Math.round(dailyCost * dayOfMonth);

    const driftLevel: "none" | "warning" | "danger" | "missed" = (() => {
      if (!hasNotValidatedThisMonth) return "none";
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
      if (tracking.month !== currentMonth && tracking.month !== lastMonthKey) return "missed";
      if (dayOfMonth > 15) return "danger";
      return "warning";
    })();

    const driftMonthLabel = (() => {
      const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
      return months[today.getMonth()];
    })();

    const daysRemaining = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - dayOfMonth;

    const hasBoth = savingsMonthly > 0 && investmentMonthly > 0;
    const monthlyTargetLabel = hasBoth
      ? "à mettre de côté ce mois"
      : savingsMonthly > 0
      ? "à épargner ce mois"
      : "à investir ce mois";
    const monthlyTargetDetail = hasBoth
      ? `${euro(savingsMonthly)} épargne + ${euro(investmentMonthly)} investissement`
      : null;

    return {
      H, monthlyTarget, nextStepTitle, nextStepText, futureImpactAmount, deltaH, safetyGap, safetyTarget,
      totalMonthlySurplus, surplusBreakdown, yearsArr, seriesBase, seriesImproved, seriesOptimized,
      monthlyCurrent, monthsRemaining, projectedAtTarget, progressToGoalPct, monthlyNeededForGoal,
      onTrack, score, cumulativeInvested, expenses,
      driftLevel, driftCost, driftMonthLabel, daysRemaining,
      monthlyTargetLabel, monthlyTargetDetail,
    };
  }, [data, horizon, goal, history, tracking]);

  function handleProgressUpdate() {
    if (!computed) return;
    const val = Math.max(0, progressInput);
    const milestones = [...tracking.milestones];
    let streak = tracking.streak;
    if (val >= computed.monthlyTarget) {
      if (!milestones.includes("first_month")) milestones.push("first_month");
      if (tracking.progress < computed.monthlyTarget) {
        streak = tracking.streak + 1;
        if (streak >= 3 && !milestones.includes("streak_3")) milestones.push("streak_3");
        if (streak >= 6 && !milestones.includes("streak_6")) milestones.push("streak_6");
      }
    }
    if (computed.safetyGap === 0 && !milestones.includes("safety_reached")) milestones.push("safety_reached");
    const newT: TrackingData = { month: currentMonthKey(), progress: val, streak, milestones };
    localStorage.setItem("capitalpilot:tracking:v1", JSON.stringify(newT));
    setTracking(newT);

    // Update history
    const newCumulative = history.reduce((s, e) => s + e.invested, 0) + val;
    const newEntry: MonthEntry = {
      month: currentMonthKey(),
      invested: val,
      cumulative: newCumulative,
      scoreAtMonth: computed?.score ?? 0,
    };
    const existingIdx = history.findIndex(e => e.month === currentMonthKey());
    const newHistory = existingIdx >= 0
      ? history.map((e, i) => i === existingIdx ? newEntry : e)
      : [...history, newEntry];
    localStorage.setItem("capitalpilot:history:v1", JSON.stringify(newHistory));
    setHistory(newHistory);

    setProgressInput(0);
  }

  function handleSaveGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!goalLabel.trim() || goalAmount <= 0 || goalYear <= new Date().getFullYear()) return;
    const newGoal: LifeGoal = {
      label: goalLabel,
      targetAmount: goalAmount,
      targetYear: goalYear,
      supportLabel: goalSupport,
      ratePct: goalRate,
      createdAt: Date.now(),
    };
    localStorage.setItem("capitalpilot:goal:v1", JSON.stringify(newGoal));
    setGoal(newGoal);
    setShowObjectiveModal(false);
  }

  const monthlyTarget = computed?.monthlyTarget ?? 0;
  const pct = monthlyTarget > 0 ? Math.min(100, (tracking.progress / monthlyTarget) * 100) : 0;
  const isValidated = pct >= 100;

  // ── Shared blocs (same in both free and premium) ──
  const blocObjectifDuMois = (
    <div className="overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Ce mois-ci</p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-950">Objectif du mois</h2>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-zinc-950">{euro(monthlyTarget)}</span>
              <div className="flex flex-col">
                <span className="text-sm text-zinc-400">{computed?.monthlyTargetLabel ?? "à investir ce mois"}</span>
                {computed?.monthlyTargetDetail && (
                  <span className="text-xs text-zinc-400">{computed.monthlyTargetDetail}</span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-500">Progression</span>
                <span className="font-semibold" style={{ color: isValidated ? SUCCESS : ACCENT }}>
                  {euro(tracking.progress)} / {euro(monthlyTarget)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isValidated ? SUCCESS : `linear-gradient(90deg, ${ACCENT}, #60a5fa)`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {isValidated ? "Objectif atteint — bien joué !" : pct >= 50 ? "Tu es sur la bonne voie" : "Valide ton versement ci-contre"}
              </p>
            </div>
          </div>

          <div className="sm:w-56">
            <p className="text-xs text-zinc-400 mb-2">Montant investi ce mois</p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={progressInput || ""}
                onChange={(e) => setProgressInput(Number(e.target.value))}
                placeholder="ex : 300 €"
                className="h-11 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleProgressUpdate}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Valider
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Sauvegardé localement sur ton appareil.
            </p>
          </div>
        </div>
      </div>

      {computed && (
        <div className="border-t border-zinc-100 bg-emerald-50/60 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-600/70">Impact futur estimé</p>
              <p className="mt-1 text-2xl font-bold text-zinc-950">+{euro(computed.futureImpactAmount)}</p>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs">
              Si tu maintiens {euro(monthlyTarget)}/mois pendant {computed.H} ans à 7%/an.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const blocProchainerEtape = computed && (
    <div className="mt-6 rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Action prioritaire</p>
      <h2 className="mt-1 text-xl font-bold text-zinc-950">{computed.nextStepTitle}</h2>
      <p className="mt-2 text-sm leading-7 text-zinc-600">{computed.nextStepText}</p>
    </div>
  );

  const blocSurplus = computed && computed.totalMonthlySurplus > 50 && (
    <div className="mt-6 rounded-[28px] border border-amber-200/60 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
      <p className="text-xs uppercase tracking-[0.16em] text-amber-500/70">Potentiel inexploité</p>
      <h2 className="mt-1 text-xl font-bold text-zinc-950">Et si tu optimisais tes dépenses ?</h2>
      <p className="mt-1 text-sm text-zinc-500">Voilà ce que tu laisses sur la table chaque mois.</p>

      <div className="mt-5 grid gap-2">
        {computed.surplusBreakdown.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
            <span className="text-sm font-medium text-zinc-800">{entry.label}</span>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={entry.status === "Critique"
                  ? { background: "#fee2e2", color: "#dc2626" }
                  : { background: "#fef3c7", color: "#d97706" }}
              >
                {entry.pct}%
              </span>
              <span className="text-sm font-semibold text-red-600">− {euro(entry.amount)}/mois</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-sm font-semibold text-zinc-800">Total récupérable</span>
          <span className="text-sm font-bold" style={{ color: SUCCESS }}>{euro(computed.totalMonthlySurplus)}/mois</span>
        </div>
      </div>

      <div className="mt-6">
        <MiniLineChart
          years={computed.yearsArr}
          seriesA={computed.seriesBase}
          seriesB={computed.seriesImproved}
          seriesC={computed.seriesOptimized}
          labelA="Si tu ne changes rien"
          labelB="Trajectoire actuelle"
          labelC="Dépenses optimisées"
        />
      </div>
    </div>
  );

  const blocRegularite = (
    <div className="mt-6">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Ta progression</p>
      <h2 className="mt-1 text-2xl font-bold text-zinc-950">Régularité & jalons</h2>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Série en cours</p>

          {tracking.streak === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-6 text-center">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 text-sm font-semibold text-zinc-800">Valide ton premier mois</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Entre le montant investi ce mois-ci et clique Valider. La régularité, c&apos;est ce qui fait vraiment la différence.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-5xl font-bold text-zinc-950">{tracking.streak}</p>
                <p className="text-sm text-zinc-400">mois validés d&apos;affilée</p>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {tracking.streak >= 6
                  ? "Très forte régularité — tu es dans le top des épargnants."
                  : tracking.streak >= 3
                  ? "Bonne discipline — continue sur ta lancée."
                  : "Régularité en cours — ne t'arrête pas là."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from({ length: Math.min(tracking.streak, 12) }).map((_, i) => (
                  <div key={i} className="h-3 w-3 rounded-full" style={{ background: i < tracking.streak ? ACCENT : "#e4e4e7" }} />
                ))}
                {tracking.streak > 12 && <span className="text-xs text-zinc-400">+{tracking.streak - 12}</span>}
              </div>
            </>
          )}
        </div>

        <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Jalons débloqués</p>
          <p className="mt-1 text-xs text-zinc-400">{tracking.milestones.length} / {ALL_MILESTONES.length} atteints</p>

          <div className="mt-4 flex flex-col gap-3">
            {ALL_MILESTONES.map((m) => {
              const unlocked = tracking.milestones.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    unlocked ? "border-zinc-300 bg-zinc-950 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-400"
                  }`}
                >
                  <span className={`text-base ${unlocked ? "opacity-100" : "opacity-30"}`}>{m.icon}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                  {unlocked && <span className="ml-auto text-xs text-zinc-400">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/resultats"
        className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
      >
        ← Retour au diagnostic
      </Link>
      <Link href="/objectifs"
        className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50">
        Mes objectifs →
      </Link>
      <div className="text-xs text-zinc-500">
        Les données sont sauvegardées uniquement sur ton appareil.
      </div>
    </div>
  );

  // ── FREE version ──
  if (!isPremium) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8">
            <Link href="/resultats" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition">
              ← Retour au diagnostic
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-zinc-950">Mon suivi</h1>
            <p className="mt-1 text-sm text-zinc-500">Valide chaque mois et regarde ta trajectoire prendre forme.</p>
          </div>

          {computed && (
            <DriftAlert
              level={computed.driftLevel}
              cost={computed.driftCost}
              monthLabel={computed.driftMonthLabel}
              daysRemaining={computed.daysRemaining}
              monthlyTarget={monthlyTarget}
            />
          )}

          {blocObjectifDuMois}
          {blocProchainerEtape}
          {blocSurplus}
          {blocRegularite}

          {/* Promo bloc */}
          <div className="mt-8 rounded-[28px] bg-[linear-gradient(135deg,#0B1F3A,#172554)] p-8 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-blue-300/50">Trajectoire Active</p>
            <p className="mt-2 text-xl font-bold">Passe à la version complète</p>
            <p className="mt-2 text-sm text-blue-100/60">
              Objectif de vie personnalisé, score mensuel, historique de progression.
            </p>
            <Link href="/premium" className="mt-5 inline-flex rounded-2xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
              Découvrir Trajectoire Active →
            </Link>
          </div>

          {footer}
        </div>
      </main>
    );
  }

  // ── PREMIUM version ──
  const scoreColor = computed && computed.score >= 70 ? "#16A34A" : computed && computed.score >= 50 ? "#2563EB" : "#f59e0b";

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/resultats" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition">
            ← Retour au diagnostic
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-zinc-950">Mon suivi</h1>
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
              Trajectoire Active
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Valide chaque mois et regarde ta trajectoire prendre forme.</p>
        </div>

        {computed && (
          <DriftAlert
            level={computed.driftLevel}
            cost={computed.driftCost}
            monthLabel={computed.driftMonthLabel}
            daysRemaining={computed.daysRemaining}
            monthlyTarget={monthlyTarget}
          />
        )}

        {/* ── BLOC OBJECTIF DE VIE ── */}
        {!goal ? (
          <div className="rounded-[28px] border-2 border-dashed border-zinc-200 bg-white p-8 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
              <circle cx="24" cy="24" r="20" stroke="#2563EB" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="13" stroke="#2563EB" strokeWidth="2" />
              <circle cx="24" cy="24" r="6" stroke="#2563EB" strokeWidth="2" />
              <circle cx="24" cy="24" r="2" fill="#2563EB" />
            </svg>
            <p className="mt-4 text-lg font-bold text-zinc-950">Définis ton objectif de vie</p>
            <p className="mt-2 text-sm text-zinc-500">C&apos;est ce qui donne du sens à chaque euro investi.</p>
            <button
              type="button"
              onClick={() => setShowObjectiveModal(true)}
              className="mt-6 inline-flex rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Choisir mon objectif
            </button>
          </div>
        ) : (
          <div className="rounded-[28px] bg-[#0B1F3A] p-8 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.16em] text-blue-300/50">Ton objectif</p>
              <button
                type="button"
                onClick={() => setShowObjectiveModal(true)}
                className="rounded-xl border border-white/10 px-3 py-1 text-xs text-zinc-400 transition hover:text-white"
              >
                Modifier
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-white">{goal.label}</p>
              <p className="mt-2 text-5xl font-bold" style={{ color: "#34d399" }}>{euro(goal.targetAmount)}</p>
              <p className="mt-2 text-lg" style={{ color: "rgba(191,219,254,0.6)" }}>d&apos;ici {goal.targetYear}</p>
              <p className="text-xs text-blue-300/40 mt-1">
                {goal.supportLabel} · {goal.ratePct}%/an
                {goal.supportLabel === "PEA / ETF" && " (estimatif)"}
              </p>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-blue-300/50">Progression projetée</span>
                <span className="text-white font-semibold">{computed ? computed.progressToGoalPct.toFixed(1) : "0.0"}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${computed?.progressToGoalPct ?? 0}%`, background: "linear-gradient(90deg, #2563EB, #34d399)" }} />
              </div>
            </div>

            {computed && (
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-blue-300/50 mb-1">Projeté</p>
                  <p className="text-sm font-semibold" style={{ color: "#34d399" }}>{euro(computed.projectedAtTarget)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-300/50 mb-1">Nécessaire/mois</p>
                  <p className="text-sm font-semibold text-white">{euro(computed.monthlyNeededForGoal)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-300/50 mb-1">Mois restants</p>
                  <p className="text-sm font-semibold text-white">{computed.monthsRemaining}</p>
                </div>
              </div>
            )}

            {computed && (
              <div className="mt-5 rounded-2xl px-4 py-3"
                style={{ background: computed.onTrack ? "rgba(22,163,74,0.15)" : "rgba(245,158,11,0.15)" }}>
                <p className="text-sm font-medium" style={{ color: computed.onTrack ? "#4ade80" : "#fbbf24" }}>
                  {computed.onTrack
                    ? "Tu es en bonne voie pour atteindre ton objectif."
                    : `Tu dois investir ${euro(computed.monthlyNeededForGoal - computed.monthlyCurrent)}/mois de plus pour rester sur ta trajectoire.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── BLOC SCORE MENSUEL ── */}
        {computed && (
          <div className="mt-6 rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(computed.score / 100) * 314} 314`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray 1s ease" }}/>
                  <text x="60" y="64" textAnchor="middle" fontSize="26" fontWeight="700" fill={scoreColor}>
                    {computed.score}
                  </text>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-950">Score de trajectoire</p>
                <p className="mt-1 text-sm font-medium"
                  style={{ color: computed.score >= 70 ? "#16A34A" : computed.score >= 50 ? "#2563EB" : "#f59e0b" }}>
                  {computed.score >= 70
                    ? "Excellent — tu es sur la bonne voie."
                    : computed.score >= 50
                    ? "Correct — quelques ajustements possibles."
                    : "À améliorer — augmente ton investissement mensuel."}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Basé sur ta régularité, l&apos;atteinte de ton objectif et ta progression sur 6 mois.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── BLOC HISTORIQUE ── */}
        {isPremium && (
          <div className="mt-6 rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-base font-semibold text-zinc-950">Historique de ta progression</p>
            {history.length === 0 ? (
              <p className="mt-6 text-center text-sm text-zinc-400">Valide ton premier mois pour commencer l&apos;historique.</p>
            ) : (
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-xs uppercase text-zinc-400 border-b border-zinc-100">
                    <th className="text-left pb-3">Mois</th>
                    <th className="text-right pb-3">Investi</th>
                    <th className="text-right pb-3">Cumulé</th>
                    <th className="text-right pb-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((entry, i) => (
                    <tr key={entry.month} className={`border-b border-zinc-50 ${i === 0 ? "font-semibold" : ""}`}>
                      <td className="py-3 text-zinc-600">{entry.month}</td>
                      <td className="py-3 text-right text-zinc-900">{euro(entry.invested)}</td>
                      <td className="py-3 text-right text-zinc-900">{euro(entry.cumulative)}</td>
                      <td className="py-3 text-right" style={{
                        color: entry.scoreAtMonth >= 70 ? "#16A34A" : entry.scoreAtMonth >= 50 ? "#2563EB" : "#f59e0b"
                      }}>{entry.scoreAtMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Shared blocs ── */}
        {blocObjectifDuMois}
        {blocProchainerEtape}
        {blocSurplus}
        {blocRegularite}
        {footer}
      </div>

      {/* ── MODAL OBJECTIF ── */}
      {showObjectiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 rounded-[28px] bg-white p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-lg font-bold text-zinc-950">Quel est ton objectif ?</p>
              <button
                type="button"
                onClick={() => setShowObjectiveModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Label de l&apos;objectif</label>
                <input
                  type="text"
                  value={goalLabel}
                  onChange={(e) => setGoalLabel(e.target.value)}
                  placeholder="ex : Apport immobilier, Indépendance financière…"
                  className="w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Montant cible</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={goalAmount || ""}
                    onChange={(e) => setGoalAmount(Number(e.target.value))}
                    placeholder="ex : 200000"
                    className="w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 pr-8 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">€</span>
                </div>
                {goalAmount > 0 && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Ce capital générerait environ{" "}
                    <span className="font-semibold text-zinc-600">
                      {euro((goalAmount * 0.04) / 12)}/mois
                    </span>{" "}
                    de revenus passifs (règle des 4% · estimatif).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Année cible</label>
                <input
                  type="number"
                  min={new Date().getFullYear() + 1}
                  max={2080}
                  value={goalYear}
                  onChange={(e) => setGoalYear(Number(e.target.value))}
                  className="w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Support d&apos;épargne</label>
                <select
                  value={goalSupport}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGoalSupport(v);
                    if (v === "Livret A / LEP") setGoalRate(2);
                    else if (v === "Assurance vie (fonds euros)") setGoalRate(2.5);
                    else if (v === "PEA / ETF") setGoalRate(7);
                    else setGoalRate(0);
                  }}
                  className="w-full h-11 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Livret A / LEP">Livret A / LEP</option>
                  <option value="Assurance vie (fonds euros)">Assurance vie (fonds euros)</option>
                  <option value="PEA / ETF">PEA / ETF</option>
                  <option value="Autre support">Autre support</option>
                </select>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={goalRate || ""}
                      readOnly={goalSupport !== "Autre support"}
                      onChange={(e) => { if (goalSupport === "Autre support") setGoalRate(Number(e.target.value)); }}
                      placeholder="Taux annuel"
                      className={`w-full h-11 rounded-2xl border px-3 pr-8 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${goalSupport !== "Autre support" ? "border-zinc-200 bg-zinc-100 text-zinc-500" : "border-zinc-200 bg-zinc-50"}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">%</span>
                  </div>
                  {goalSupport === "PEA / ETF" && (
                    <p className="mt-1 text-xs text-zinc-400">Taux estimatif basé sur la performance historique des marchés. Non garanti.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Enregistrer mon objectif
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
