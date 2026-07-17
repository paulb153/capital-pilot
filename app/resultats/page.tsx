"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadRaw } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { readDiagnosticFromSupabase } from "@/lib/sync";
import {
  clamp as fClamp,
  computeIncome, computeCapital, computeLiquidity,
  computeProjection, computeScores, computeDiagnostic, computeNextStep,
  classifyHousing, classifyGeneric,
} from "@/lib/finance";

const ACCENT = "#2563EB";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";
const WARNING = "#f59e0b";

function euro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(n)
    .replace(/\u202F/g, "\u00A0")
    .replace(/\u00A0/g, " ");
}

function clamp(n: number, min: number, max: number) {
  return fClamp(n, min, max);
}

type ExtraAccountType = "LEP" | "Livret Jeune" | "LDDS" | "Autre compte";
type ExtraAccount = { id: string; type: ExtraAccountType; amount: number; ratePct: number };
type Loan = { id: string; label: string; monthlyPayment: number; remainingCapital: number; ratePct: number; remainingYears: number };
type InvestmentBreakdown = { pea: number; cto: number; assuranceVieFondsEuro: number; assuranceVieUC: number; immobilier: number; crowdfunding: number; crypto: number; per: number; autres: number };
type Payload = {
  salary: number; otherIncome: number; housing: number; food: number;
  transport: number; leisure: number; subscriptions: number; misc: number;
  checkingAmount: number; livretAAmount: number; livretARatePct: number;
  extraAccounts: ExtraAccount[]; safetyMonths: 3 | 4 | 5 | 6;
  savingsMonthly: number; investmentMonthly: number; createdAt: number;
  // champs optionnels (form étendu ou valeurs par défaut)
  age?: number; electricity?: number; loans?: Loan[]; recommendedHorizon?: number;
  hasInvestedCapital?: boolean; investedCapitalTotal?: number;
  investmentBreakdown?: InvestmentBreakdown;
};
type Status = "Très bien" | "OK" | "Excessif" | "Très excessif" | "Critique";

const REQUIRED_NUMERICS = [
  "salary", "otherIncome", "housing", "food", "transport",
  "leisure", "subscriptions", "misc", "checkingAmount",
  "livretAAmount", "savingsMonthly", "investmentMonthly", "createdAt",
] as const;

function isValidPayload(raw: unknown): raw is Payload {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Record<string, unknown>;

  // All required numerics must be finite numbers (rejects NaN, Infinity, wrong type)
  for (const field of REQUIRED_NUMERICS) {
    if (typeof p[field] !== "number" || !Number.isFinite(p[field] as number)) return false;
  }

  // safetyMonths must be one of the allowed values
  if (![3, 4, 5, 6].includes(p.safetyMonths as number)) return false;

  // extraAccounts must be an array of well-formed objects
  if (!Array.isArray(p.extraAccounts)) return false;
  for (const acc of p.extraAccounts as unknown[]) {
    if (!acc || typeof acc !== "object") return false;
    const a = acc as Record<string, unknown>;
    if (typeof a.id !== "string") return false;
    if (typeof a.amount !== "number" || !Number.isFinite(a.amount as number)) return false;
    if (typeof a.ratePct !== "number" || !Number.isFinite(a.ratePct as number)) return false;
  }

  return true;
}


function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniLineChart({ years, seriesA, seriesB, labelA, labelB, seriesC, labelC }: {
  years: number[]; seriesA: number[]; seriesB: number[];
  labelA: string; labelB: string;
  seriesC?: number[]; labelC?: string;
}) {
  const W = 820, H = 300, PL = 74, PR = 28, PT = 24, PB = 38;
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const maxY = Math.max(...seriesA, ...seriesB, ...(seriesC ?? []), 1);
  const scaleX = (i: number) => PL + (i / Math.max(1, years.length - 1)) * (W - PL - PR);
  const scaleY = (v: number) => H - PB - (v / maxY) * (H - PT - PB);

  const pathStr = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ");
  const areaStr = (arr: number[]) =>
    `${pathStr(arr)} L${scaleX(arr.length - 1).toFixed(1)},${H - PB} L${PL},${H - PB} Z`;

  const pathLen = W * 3;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => maxY * t);
  const xStep = Math.max(1, Math.floor(years.length / 6));
  const xTickIdxs = years.reduce((acc: number[], _, i) => {
    if (i % xStep === 0 || i === years.length - 1) acc.push(i);
    return acc;
  }, []);

  function shortEuro(v: number) {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} M€`;
    if (v >= 1_000) return `${Math.round(v / 1_000)} k€`;
    return `${Math.round(v)} €`;
  }

  const tt = tooltipIdx;
  const ttRight = tt !== null && scaleX(tt) > W * 0.62;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #0c1a3a 100%)",
      borderRadius: 28, padding: "28px 24px", position: "relative", overflow: "hidden",
      boxShadow: "0 30px 90px rgba(15,23,42,0.35)"
    }}>
      <div style={{ position: "absolute", top: "5%", left: "15%", width: 320, height: 220, background: "radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 260, height: 200, background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 600, margin: 0 }}>Deux futurs. Un choix.</h3>
          <p style={{ color: "#64748b", fontSize: 13, margin: "5px 0 0" }}>Regarde ce que tu rates en ne changeant rien.</p>
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
          {seriesC && labelC && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
              <span style={{ color: "#fde68a", fontSize: 12 }}>{labelC}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
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
            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.03" />
            </linearGradient>
            <filter id="glowGreen" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowRed" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            <filter id="glowAmber" x="-20%" y="-60%" width="140%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {yTicks.map((v, i) => (
            <line key={i} x1={PL} y1={scaleY(v)} x2={W - PR} y2={scaleY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}

          <path d={areaStr(seriesA)} fill="url(#gA)" />
          <path d={areaStr(seriesB)} fill="url(#gB)" />
          {seriesC && <path d={areaStr(seriesC)} fill="url(#gC)" />}

          <path d={pathStr(seriesA)} fill="none" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="8 5" filter="url(#glowRed)" />
          <path
            d={pathStr(seriesB)} fill="none" stroke="#16a34a" strokeWidth="3.5"
            filter="url(#glowGreen)"
            style={{
              strokeDasharray: pathLen,
              strokeDashoffset: animated ? 0 : pathLen,
              transition: "stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
          {seriesC && (
            <path
              d={pathStr(seriesC)} fill="none" stroke="#f59e0b" strokeWidth="2.5"
              strokeDasharray="8 4" filter="url(#glowAmber)"
              style={{ opacity: animated ? 1 : 0, transition: "opacity 0.6s ease 1.8s" }}
            />
          )}

          {yTicks.map((v, i) => (
            <text key={i} x={PL - 8} y={scaleY(v) + 4} textAnchor="end" fontSize="10" fill="rgba(100,116,139,0.85)">{shortEuro(v)}</text>
          ))}
          {xTickIdxs.map((idx) => (
            <text key={idx} x={scaleX(idx)} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(100,116,139,0.85)">{years[idx]} ans</text>
          ))}

          {tt !== null && (() => {
            const hasC = seriesC != null;
            const tooltipH = hasC ? 110 : 90;
            const bx = ttRight ? scaleX(tt) - 192 : scaleX(tt) + 14;
            const by = Math.max(PT, Math.min(scaleY(seriesB[tt]) - 45, H - PB - tooltipH));
            const diff = Math.max(0, seriesB[tt] - seriesA[tt]);
            return (
              <g>
                <line x1={scaleX(tt)} y1={PT} x2={scaleX(tt)} y2={H - PB} stroke="rgba(255,255,255,0.13)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx={scaleX(tt)} cy={scaleY(seriesA[tt])} r="4.5" fill="#1e293b" stroke="#DC2626" strokeWidth="2" />
                <circle cx={scaleX(tt)} cy={scaleY(seriesB[tt])} r="6" fill="#15803d" stroke="#86efac" strokeWidth="2.5" />
                {hasC && seriesC && <circle cx={scaleX(tt)} cy={scaleY(seriesC[tt])} r="4.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />}
                <rect x={bx} y={by} width="178" height={tooltipH} rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                <text x={bx + 13} y={by + 20} fontSize="11" fill="#64748b" fontWeight="500">Année {years[tt]}</text>
                <text x={bx + 13} y={by + 42} fontSize="11" fill="#fca5a5">{labelA.length > 18 ? labelA.slice(0, 18) + "…" : labelA}</text>
                <text x={bx + 165} y={by + 42} fontSize="11" fill="#fca5a5" textAnchor="end" fontWeight="700">{shortEuro(seriesA[tt])}</text>
                <text x={bx + 13} y={by + 62} fontSize="11" fill="#86efac">{labelB.length > 18 ? labelB.slice(0, 18) + "…" : labelB}</text>
                <text x={bx + 165} y={by + 62} fontSize="11" fill="#86efac" textAnchor="end" fontWeight="700">{shortEuro(seriesB[tt])}</text>
                {hasC && seriesC && labelC
                  ? <><text x={bx + 13} y={by + 82} fontSize="11" fill="#fde68a">{labelC.length > 18 ? labelC.slice(0, 18) + "…" : labelC}</text>
                      <text x={bx + 165} y={by + 82} fontSize="11" fill="#fde68a" textAnchor="end" fontWeight="700">{shortEuro(seriesC[tt])}</text></>
                  : diff > 0 && <text x={bx + 13} y={by + 80} fontSize="10" fill="#22c55e" fontWeight="600">Tu rates {shortEuro(diff)}</text>
                }
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function PieChart({ title, subtitle, entries }: { title: string; subtitle?: string; entries: { label: string; value: number; color: string }[] }) {
  const filtered = entries.filter((e) => e.value > 0);
  const total = filtered.reduce((sum, e) => sum + e.value, 0);
  if (!filtered.length || total <= 0) {
    return <Card title={title}>{subtitle ? <p className="mb-3 text-sm text-zinc-600">{subtitle}</p> : null}<p className="text-sm text-zinc-600">Aucune répartition à afficher.</p></Card>;
  }
  const cx = 110, cy = 110, r = 82;
  let cumulative = 0;
  const slices = filtered.map((entry) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += entry.value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return { ...entry, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });
  return (
    <Card title={title}>
      {subtitle ? <p className="mb-4 text-sm text-zinc-600">{subtitle}</p> : null}
      <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
        <svg width="220" height="220" viewBox="0 0 220 220">
          {slices.map((slice, i) => <path key={i} d={slice.d} fill={slice.color} stroke="#fff" strokeWidth="2" />)}
        </svg>
        <div className="grid gap-3">
          {filtered.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium text-zinc-800">{entry.label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-950">{euro(entry.value)}</div>
                <div className="text-xs text-zinc-500">{((entry.value / total) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function getSimpleContextText(age: number, horizon: number) {
  if (age <= 30) return `Comme tu as ${age} ans, nous avons retenu un horizon de ${horizon} ans. Cela veut dire que tu as potentiellement du temps devant toi pour laisser travailler ton argent, tout en acceptant que certains placements puissent davantage évoluer dans le temps.`;
  if (age <= 45) return `Comme tu as ${age} ans, nous avons retenu un horizon de ${horizon} ans. L'idée est d'avoir un équilibre entre progression et stabilité, sans être trop prudent ni trop agressif.`;
  if (age <= 60) return `Comme tu as ${age} ans, nous avons retenu un horizon de ${horizon} ans. L'objectif reste de faire progresser ton argent, mais avec une attention plus forte à la stabilité.`;
  return `Comme tu as ${age} ans, nous avons retenu un horizon de ${horizon} ans. À ce stade, la stabilité du patrimoine et la disponibilité d'une partie de l'argent prennent souvent plus d'importance.`;
}

export default function ResultatsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [noData, setNoData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [horizon, setHorizon] = useState(30);
  const [ratePct, setRatePct] = useState(7);
  const fundsEuroRatePct = 2.5;
  const [showDetails, setShowDetails] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  function handleWaitlistSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const email = modalEmail.trim();
    if (!email) return;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem("capitalpilot:waitlist") ?? "[]");
      if (!existing.includes(email)) {
        localStorage.setItem("capitalpilot:waitlist", JSON.stringify([...existing, email]));
      }
    } catch { /* ignore */ }
    setModalSuccess(true);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;

        let parsed: Payload | null = null;

        if (user) {
          const diagResult = await readDiagnosticFromSupabase(supabase, user.id);
          if (cancelled) return;

          if (diagResult.status === "ok") {
            const p = diagResult.payload;
            if (!isValidPayload(p)) { setLoadError(true); return; }
            parsed = p;
          } else if (diagResult.status === "local") {
            const raw = loadRaw();
            if (!raw || !isValidPayload(raw)) { setNoData(true); return; }
            parsed = raw;
          } else {
            setNoData(true);
            return;
          }
        } else {
          const raw = loadRaw();
          if (!raw || !isValidPayload(raw)) { setNoData(true); return; }
          parsed = raw;
        }

        setData(parsed);
        const inferredAge = parsed.age ?? 30;
        const inferredHorizon = parsed.recommendedHorizon ?? Math.max(5, 65 - inferredAge);
        setHorizon(clamp(inferredHorizon, 5, 60));
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    // ── Paramètres de base ────────────────────────────────────────────────
    const age = data.age ?? 30;
    const loans = data.loans ?? [];
    const recommendedHorizonRaw = data.recommendedHorizon ?? Math.max(5, 65 - age);
    const H = clamp(Math.round(horizon), 5, 60);
    const annualMarket = clamp(ratePct, 0, 15) / 100;
    const annualPrudent = clamp(fundsEuroRatePct, 0, 8) / 100;

    // ── Appels aux fonctions financières pures ────────────────────────────
    const inc = computeIncome({
      salary: data.salary, otherIncome: data.otherIncome,
      housing: data.housing, food: data.food, transport: data.transport,
      electricity: data.electricity ?? 0, leisure: data.leisure,
      subscriptions: data.subscriptions, misc: data.misc,
      loans,
      savingsMonthly: data.savingsMonthly,
      investmentMonthly: data.investmentMonthly,
    });

    const cap = computeCapital(data.investmentBreakdown);

    const liq = computeLiquidity({
      checkingAmount: data.checkingAmount, livretAAmount: data.livretAAmount,
      livretARatePct: data.livretARatePct, extraAccounts: data.extraAccounts,
      safetyMonths: data.safetyMonths, expenses: inc.expenses,
    });

    const proj = computeProjection({
      ...cap, ...liq, annualMarket, annualPrudent, H,
      monthlyCurrent: inc.monthlyCurrent,
      savingsMonthly: inc.savingsMonthly,
      investmentMonthly: inc.investmentMonthly,
      additionalInvestable: inc.additionalInvestable,
      margin: inc.margin,
    });

    const pctOf = (v: number) => inc.income > 0 ? (v / inc.income) * 100 : 0;
    const housingPct = pctOf(data.housing);

    const scores = computeScores({
      income: inc.income, expenses: inc.expenses, margin: inc.margin,
      totalLoanMonthly: inc.totalLoanMonthly, monthlyCurrent: inc.monthlyCurrent,
      monthlyOptimized: inc.monthlyOptimized, investedCapital: cap.investedCapital,
      nonInvestedTotal: liq.nonInvestedTotal, safetyTarget: liq.safetyTarget,
      housingPct,
    });

    const diag = computeDiagnostic({
      checking0: liq.checking0, livretA0: liq.livretA0,
      livretARatePct: liq.livretARate * 100,
      extras: liq.extras.map(e => ({ ...e, id: (data?.extraAccounts ?? []).find(a => a.id === e.id)?.type ?? e.id })),
      expenses: inc.expenses, safetyTarget: liq.safetyTarget,
      prudentCurrentCapital: cap.prudentCurrentCapital,
      dynamicPct: cap.dynamicPct, annualMarket, annualPrudent, H,
    });

    const next = computeNextStep({
      profileTier: scores.profileTier, safetyGap: liq.safetyGap,
      margin: inc.margin, additionalInvestable: inc.additionalInvestable,
      annualMarket, H,
    });

    // ── Construction des chaînes d'affichage (euro() utilisé ici) ─────────
    const { monthlyCurrent, additionalInvestable, monthlyOptimized, income,
      totalRemainingDebt } = inc;
    const { dynamicCurrentCapital, prudentCurrentCapital, realCurrentCapital,
      investedCapital, dynamicPct, fundsEuroPct } = cap;
    const { checking0, livretA0, nonInvestedTotal, safetyTarget, safetyGap,
      immediateInvestable } = liq;
    const { deltaH, baseAtH, improvedAtH, delta20, delta30, delta40,
      yearsArr, seriesBase, seriesImproved } = proj;
    const { scoreGlobal, scoreSafety, scoreFlex, scoreAmbition, profileTier,
      savingsRate, currentSavingsRate, marginRate } = scores;
    const { monthlyTarget, futureImpactAmount } = next;

    const profileMessage =
      profileTier === "fragile"  ? "Tu peux nettement améliorer ta trajectoire." :
      profileTier === "medium"   ? "Tu es sur la bonne voie, mais tu peux aller plus loin." :
      profileTier === "good"     ? "Tu as déjà une bonne base, mais il te reste encore du potentiel." :
                                   "Tu fais déjà mieux que la majorité. Voici comment aller encore plus loin.";

    const investsAlready = investedCapital > 0 || monthlyCurrent > 0;
    const heroLine1 = investsAlready
      ? `Sans rien changer : ${euro(baseAtH)} dans ${H} ans.`
      : `Ton argent dort : ${euro(baseAtH)} dans ${H} ans.`;
    const heroLine2 = investsAlready
      ? `En t'organisant mieux : ${euro(improvedAtH)} dans ${H} ans.`
      : `Fais-le travailler : ${euro(improvedAtH)} dans ${H} ans.`;
    const heroDelta = `C'est ${euro(deltaH)} de plus en ${H} ans — juste en faisant les bons choix.`;

    let headline = "", subline = "";
    let bullets: string[] = [];
    if (income === 0 || (inc.margin === 0 && investedCapital === 0)) {
      headline = "Tes dépenses absorbent tes revenus";
      subline = "Avant d'aller plus loin, le plus important est de recréer une vraie marge chaque mois.";
      bullets = ["Réduire les dépenses", "Retrouver une marge", "Puis investir"];
    } else if (investedCapital === 0 && monthlyCurrent === 0) {
      headline = `Tu pourrais viser ${euro(deltaH)} de plus sur ${H} ans`;
      subline = "Le potentiel vient surtout de l'argent qui dort aujourd'hui et de ce que tu pourrais mettre de côté chaque mois.";
      bullets = [`+${euro(immediateInvestable)} disponibles maintenant`, `+${euro(monthlyOptimized)}/mois possibles`, `${H} ans d'horizon`];
    } else {
      headline = `En améliorant ta stratégie, tu peux viser ${euro(deltaH)} de plus`;
      subline = "La différence vient du cash disponible, de la régularité mensuelle et d'une lecture plus claire entre placements prudents et placements plus dynamiques.";
      bullets = [`+${euro(immediateInvestable)} mobilisables`, `+${euro(additionalInvestable)}/mois à optimiser`, `Horizon : ${H} ans`];
    }

    // nextStep titles (chaînes avec euro())
    let nextStepTitle = "", nextStepText = "";
    if (safetyGap > 0 && inc.margin > 0) {
      nextStepTitle = `Mettre ${euro(monthlyTarget)} sur ton matelas de sécurité`;
      nextStepText = "Ton filet de sécurité n'est pas encore complet. C'est la priorité absolue avant d'investir.";
    } else if (inc.margin < 100) {
      nextStepTitle = "Libérer 100 € par mois";
      nextStepText = "Commence par dégager de la marge — c'est le fondement de tout le reste.";
    } else if (profileTier === "advanced" || profileTier === "good") {
      nextStepTitle = `Investir ${euro(monthlyTarget)} supplémentaires ce mois-ci`;
      nextStepText = "Tu fais déjà bien. Voici comment optimiser encore ta trajectoire.";
    } else {
      nextStepTitle = `Investir ${euro(monthlyTarget)} ce mois-ci`;
      nextStepText = "C'est l'action la plus utile pour améliorer ta trajectoire aujourd'hui.";
    }

    // Diagnostic items (positives / negatives / reco)
    type DiagItem = { label: string; amount?: string };
    const positives: DiagItem[] = [], negatives: DiagItem[] = [], reco: string[] = [];

    if (safetyGap === 0 && safetyTarget > 0)
      positives.push({ label: "Matelas de sécurité couvert", amount: `${data.safetyMonths} mois` });
    else
      negatives.push({ label: "Matelas de sécurité insuffisant", amount: `− ${euro(safetyGap)}` });

    if (monthlyCurrent > 0)
      positives.push({ label: "Épargne mensuelle en place", amount: `${euro(monthlyCurrent)}/mois` });
    else
      negatives.push({ label: "Aucune épargne mensuelle" });

    if (investedCapital > 0)
      positives.push({ label: "Capital déjà investi", amount: euro(investedCapital) });
    else
      negatives.push({ label: "Aucun placement déclaré" });

    if (additionalInvestable > 0)
      positives.push({ label: "Marge supplémentaire investissable", amount: `${euro(additionalInvestable)}/mois` });
    if (totalRemainingDebt > 0)
      negatives.push({ label: "Dettes en cours", amount: euro(totalRemainingDebt) });

    const pushExp = (label: string, p: number, s: Status) => {
      if (p === 0) return;
      if (s === "Très bien" || s === "OK")
        positives.push({ label, amount: `${Math.round(p)}% du revenu` });
      else
        negatives.push({ label, amount: `${Math.round(p)}% du revenu` });
    };
    const foodPct = pctOf(data.food), transportPct = pctOf(data.transport);
    const leisurePct = pctOf(data.leisure), subsPct = pctOf(data.subscriptions);
    const miscPct = pctOf(data.misc), electricityPct = pctOf(data.electricity ?? 0);
    pushExp("Logement",    housingPct,     classifyHousing(housingPct));
    pushExp("Nourriture",  foodPct,        classifyGeneric(foodPct,       12, 18, 25));
    pushExp("Transport",   transportPct,   classifyGeneric(transportPct,  10, 18, 25));
    if (electricityPct > 0) pushExp("Électricité", electricityPct, classifyGeneric(electricityPct, 3, 5, 8));
    pushExp("Loisirs",     leisurePct,     classifyGeneric(leisurePct,    10, 15, 20));
    pushExp("Abonnements", subsPct,        classifyGeneric(subsPct,        3,  6, 10));
    pushExp("Divers",      miscPct,        classifyGeneric(miscPct,       10, 15, 20));

    const expensesPct = inc.income > 0 ? (inc.expenses / inc.income) * 100 : 100;
    if (expensesPct > 85) {
      negatives.push({ label: "Dépenses totales trop élevées", amount: `${Math.round(expensesPct)}% du revenu` });
    }

    if (prudentCurrentCapital > 0 && dynamicCurrentCapital === 0)
      reco.push("Ton assurance vie semble surtout placée sur des fonds euros. C'est utile pour la stabilité, mais cela peut limiter la progression sur le long terme.");
    if (fundsEuroPct > 70)
      reco.push("Une très grande partie de tes placements semble dans des supports prudents. C'est rassurant, mais cela peut freiner la croissance de ton argent.");
    if (dynamicPct > 0 && fundsEuroPct > 0)
      reco.push("Tu as à la fois une part stable et une part plus dynamique. C'est une base saine pour faire progresser ton argent tout en gardant de la sécurité.");
    const b = data.investmentBreakdown;
    if (b && Math.max(0, b.assuranceVieFondsEuro) > 0 && Math.max(0, b.assuranceVieUC) > 0)
      reco.push("Dans ton assurance vie, tu distingues bien fonds euros et autres supports. C'est une bonne base pour comprendre ce qui est prudent et ce qui est plus orienté progression.");
    if (b && Math.max(0, b.crypto) > investedCapital * 0.1 && investedCapital > 0)
      reco.push("Ta part en crypto paraît élevée. Cela peut offrir du potentiel, mais aussi beaucoup plus de variations.");
    if (!reco.length)
      reco.push("Ta structure est globalement lisible. Le point principal à travailler reste surtout la régularité et l'utilisation de la marge disponible.");

    // Graphiques de répartition
    const bd = b ?? { pea: 0, cto: 0, assuranceVieFondsEuro: 0, assuranceVieUC: 0, immobilier: 0, crowdfunding: 0, crypto: 0, per: 0, autres: 0 };
    const detailEntries = [
      { label: "PEA",                value: Math.max(0, bd.pea),                   color: "#2563eb" },
      { label: "CTO",                value: Math.max(0, bd.cto),                   color: "#60a5fa" },
      { label: "AV fonds euros",     value: Math.max(0, bd.assuranceVieFondsEuro), color: "#f59e0b" },
      { label: "AV autres supports", value: Math.max(0, bd.assuranceVieUC),        color: "#16a34a" },
      { label: "Immobilier",         value: Math.max(0, bd.immobilier),            color: "#8b5cf6" },
      { label: "Crowdfunding",       value: Math.max(0, bd.crowdfunding),          color: "#14b8a6" },
      { label: "Crypto",             value: Math.max(0, bd.crypto),                color: "#ef4444" },
      { label: "PER",                value: Math.max(0, bd.per),                   color: "#0ea5e9" },
      { label: "Autres",             value: Math.max(0, bd.autres),                color: "#a3a3a3" },
    ];
    const strategicEntries = [
      { label: "Partie plus dynamique", value: dynamicCurrentCapital, color: "#16a34a" },
      { label: "Partie stable",         value: prudentCurrentCapital, color: "#f59e0b" },
      { label: "Immobilier / autres",   value: realCurrentCapital,    color: "#8b5cf6" },
    ];

    return {
      income, expenses: inc.expenses, margin: inc.margin,
      nonInvestedTotal, investedCapital, totalRemainingDebt,
      safetyTarget, safetyGap, immediateInvestable, monthlyCurrent, monthlyOptimized,
      additionalInvestable, delta20, delta30, delta40, deltaH,
      headline, subline, bullets, heroLine1, heroLine2, heroDelta, baseAtH, improvedAtH,
      scoreSafety, scoreFlex, scoreAmbition, scoreGlobal,
      positives, negatives, reco, yearsArr, seriesBase, seriesImproved,
      savingsRate, recommendedHorizon: recommendedHorizonRaw,
      contextText: getSimpleContextText(age, H),
      detailEntries, strategicEntries,
      showLivretAReco: diag.showLivretAReco,
      amountToMoveToLivretA: diag.amountToMoveToLivretA,
      showSavingsReco: diag.showSavingsReco,
      allocationMoves: diag.allocationMoves,
      totalToMove: diag.totalToMove,
      livretA0, checking0,
      showFundsEuroReco: diag.showFundsEuroReco,
      suggestedUCAmount: diag.suggestedUCAmount,
      fundsEuroGainAtH: diag.fundsEuroGainAtH,
      prudentCurrentCapital,
      profileTier, profileMessage,
      monthlyTarget, nextStepTitle, nextStepText, futureImpactAmount,
      currentSavingsRate, marginRate,
    };
  }, [data, horizon, ratePct, fundsEuroRatePct]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-white to-white">
        <div className="mx-auto max-w-5xl px-5 py-8 animate-pulse">
          <div className="h-64 rounded-[34px] bg-zinc-200/70" />
          <div className="mt-6 h-52 rounded-[28px] bg-zinc-200/70" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-[28px] bg-zinc-100" />
            <div className="h-24 rounded-[28px] bg-zinc-100" />
            <div className="h-24 rounded-[28px] bg-zinc-100" />
          </div>
          <div className="mt-6 h-48 rounded-[28px] bg-zinc-100" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-semibold" style={{ color: ACCENT }}>Résultats</h1>
          <p className="mt-2 text-zinc-600">Une erreur s&apos;est produite lors du chargement. Vérifie ta connexion et recharge la page.</p>
        </div>
      </main>
    );
  }

  if (noData || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl font-semibold" style={{ color: ACCENT }}>Résultats</h1>
          <p className="mt-2 text-zinc-600">Tu n&apos;as pas encore de diagnostic. Remplis le formulaire pour voir ta projection financière.</p>
          <div className="mt-6">
            <Link href="/diagnostic" className="inline-flex items-center rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: ACCENT }}>
              Faire mon diagnostic
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!computed) return null;

  let globalColor = WARNING;
  if (computed.scoreGlobal >= 70) globalColor = SUCCESS;
  else if (computed.scoreGlobal >= 50) globalColor = ACCENT;
  else if (computed.scoreGlobal < 35) globalColor = DANGER;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-white to-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-5 py-8">

        {/* ── BLOC 1: HERO ── l'écart en euros est la star, score secondaire */}
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(132,204,22,0.10),transparent_24%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f172a_100%)] p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.05))]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-blue-300" />Résultat de ton diagnostic
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur" style={{ color: globalColor }}>
                {computed.scoreGlobal}/100 — {computed.scoreGlobal >= 70 ? "Solide" : computed.scoreGlobal >= 50 ? "Correct" : computed.scoreGlobal >= 35 ? "À renforcer" : "Fragile"}
              </div>
            </div>
            <div className="mt-8 text-center">
              {computed.deltaH > 500 ? (
                <>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-300/60">Voilà ce que tu gagnes si tu agis · sur {computed.recommendedHorizon} ans</p>
                  <p className="mt-2 text-7xl font-bold tracking-tight text-emerald-300 sm:text-8xl">+{euro(computed.deltaH)}</p>
                  <p className="mt-2 text-base text-blue-100/60">C&apos;est l&apos;écart entre rester immobile et faire les bons choix.</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-300/60">Diagnostic sur {computed.recommendedHorizon} ans</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-300">Ton argent est déjà bien placé.</p>
                  <p className="mt-2 text-base text-blue-100/60">Il reste des optimisations possibles — l&apos;essentiel est en ordre.</p>
                </>
              )}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-5 text-center backdrop-blur">
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300/50">Si tu ne changes rien</p>
                <p className="mt-3 text-3xl font-bold text-white/70">{euro(computed.seriesBase[computed.seriesBase.length - 1] ?? 0)}</p>
                <p className="mt-1 text-xs text-blue-200/30">{euro(computed.monthlyCurrent)}/mois · {computed.recommendedHorizon} ans</p>
              </div>
              <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-400/[0.06] p-5 text-center backdrop-blur">
                <p className="text-xs uppercase tracking-[0.14em] text-emerald-300/70">Ta trajectoire optimisée</p>
                <p className="mt-3 text-3xl font-bold text-emerald-200">{euro(computed.seriesImproved[computed.seriesImproved.length - 1] ?? 0)}</p>
                <p className="mt-1 text-xs text-emerald-300/40">{euro(computed.monthlyOptimized)}/mois · {computed.recommendedHorizon} ans</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOC 2: Graphique principal ── preuve visuelle */}
        <div className="mt-6">
          <MiniLineChart years={computed.yearsArr} seriesA={computed.seriesBase} seriesB={computed.seriesImproved} labelA="Si tu ne changes rien" labelB="Ta trajectoire optimisée" />
        </div>

        {/* ── BLOC 3: Bloc interactif ── sliders juste sous le graphique pour boucle immédiate */}
        <div className="mt-6 rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h3 className="text-base font-semibold text-zinc-950">Joue avec les paramètres → regarde l&apos;impact en direct</h3>
          <p className="mt-1 text-sm text-zinc-500">Change la durée ou le rendement et observe comment l&apos;écart évolue immédiatement.</p>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <div className="flex items-end justify-between">
                <p className="text-sm font-semibold text-zinc-800">Horizon</p>
                <p className="text-sm font-bold" style={{ color: ACCENT }}>{clamp(horizon, 5, 60)} ans</p>
              </div>
              <input type="range" min={5} max={60} step={1} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
              <p className="mt-1 text-xs text-zinc-400">Estimé à partir de ton âge</p>
            </div>

            <div>
              <div className="flex items-end justify-between">
                <p className="text-sm font-semibold text-zinc-800">Rendement marché</p>
                <p className="text-sm font-bold" style={{ color: ACCENT }}>{clamp(ratePct, 0, 15)}%</p>
              </div>
              <input type="range" min={0} max={15} step={0.5} value={ratePct} onChange={(e) => setRatePct(Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
              <p className="mt-1 text-xs text-zinc-400">7% = hypothèse ETF monde historique</p>
            </div>


            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 lg:min-w-[180px]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Écart estimé</p>
              <div className="mt-3 grid gap-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">20 ans</span>
                  <span className="font-semibold text-zinc-900">{euro(computed.delta20)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">30 ans</span>
                  <span className="font-semibold text-zinc-900">{euro(computed.delta30)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">40 ans</span>
                  <span className="font-semibold text-zinc-900">{euro(computed.delta40)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BLOC 4: Diagnostic ── */}
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Comprends ta situation</p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-950">Ton diagnostic</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Il te reste chaque mois</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{euro(computed.margin)}</p>
              {computed.income > 0 && <p className="mt-1 text-xs text-zinc-400">{computed.marginRate.toFixed(1)}% de tes revenus</p>}
            </div>
            <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Tu mets de côté</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{euro(computed.monthlyCurrent)}/mois</p>
              {computed.income > 0 && <p className="mt-1 text-xs text-zinc-400">{computed.currentSavingsRate.toFixed(1)}% de tes revenus</p>}
            </div>
            <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Tu pourrais mettre de côté</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: SUCCESS }}>{euro(computed.monthlyOptimized)}/mois</p>
              {computed.income > 0 && <p className="mt-1 text-xs" style={{ color: SUCCESS }}>{computed.savingsRate.toFixed(1)}% de tes revenus</p>}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-emerald-200/60 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs uppercase tracking-[0.14em] text-emerald-600/70">Ce que tu fais bien</p>
              <div className="mt-4 grid gap-2">
                {computed.positives.length ? computed.positives.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-zinc-800">{item.label}</span>
                    </div>
                    {item.amount && <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{item.amount}</span>}
                  </div>
                )) : <p className="text-sm text-zinc-400">—</p>}
              </div>
            </div>

            <div className="rounded-[28px] border border-red-200/50 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs uppercase tracking-[0.14em] text-red-500/70">Ce qui freine ta trajectoire</p>
              <div className="mt-4 grid gap-2">
                {computed.negatives.length ? computed.negatives.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                      <span className="text-sm font-medium text-zinc-800">{item.label}</span>
                    </div>
                    {item.amount && <span className="flex-shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">{item.amount}</span>}
                  </div>
                )) : <p className="text-sm text-zinc-400">Rien de critique — continue comme ça.</p>}
              </div>
            </div>
          </div>

          {computed.showLivretAReco && (
            <div className="mt-4 rounded-[28px] border border-blue-200 bg-blue-50 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xl" style={{ background: "rgba(37,99,235,0.10)" }}>💡</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Quick win · Déplace ton épargne de sécurité sur le Livret A</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                    Tu as <strong>{euro(computed.checking0)}</strong> sur ton compte courant.{" "}
                    Ton épargne de sécurité cible est de <strong>{euro(computed.safetyTarget)}</strong> ({data?.safetyMonths} mois de dépenses) — ton Livret A n&apos;en couvre que <strong>{euro(computed.livretA0)}</strong>.
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: ACCENT }}>
                    → Vire {euro(computed.amountToMoveToLivretA)} sur ton Livret A. Tu mets ta réserve au bon endroit — à 1,5 % au lieu de 0 %.
                  </p>
                </div>
              </div>
            </div>
          )}

          {computed.showFundsEuroReco && (
            <div className="mt-4 rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-[0_20px_60px_rgba(245,158,11,0.08)]">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xl" style={{ background: "rgba(245,158,11,0.12)" }}>📊</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Quick win · Rééquilibre ton assurance vie</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                    Tu as <strong>{euro(computed.prudentCurrentCapital)}</strong> en fonds euros — à {fundsEuroRatePct}%/an.
                    Sur un horizon de {computed.recommendedHorizon} ans, garder tout en fonds euros freine ta progression.
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: WARNING }}>
                    → Envisage de basculer ~{euro(computed.suggestedUCAmount)} (30%) en unités de compte.
                    Gain estimé sur {computed.recommendedHorizon} ans : <span style={{ color: SUCCESS }}>+{euro(computed.fundsEuroGainAtH)}</span>.
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Les UC comportent un risque de perte en capital. Ce chiffre est une simulation, non une garantie.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Card title="Ce que ton diagnostic met en avant">
              <div className="grid gap-3">
                {computed.reco.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700">{item}</div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* ── BLOC 6: Détails avancés ── collapsible */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex w-full items-center justify-between rounded-[28px] border border-zinc-200/70 bg-white px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:bg-zinc-50"
          >
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Pour aller plus loin</p>
              <h2 className="mt-0.5 text-xl font-bold text-zinc-950">Ta situation en détail</h2>
            </div>
            <span className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition">
              {showDetails ? "−" : "+"}
            </span>
          </button>

          {showDetails && (
            <div className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Épargne disponible",          value: euro(computed.nonInvestedTotal) },
                  { label: "Capital investi",              value: euro(computed.investedCapital) },
                  { label: "Matelas de sécurité visé",     value: euro(computed.safetyTarget) },
                  { label: "Mobilisable maintenant",       value: euro(computed.immediateInvestable), accent: true },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="mt-1 text-xl font-semibold" style={accent ? { color: ACCENT } : {}}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <PieChart title="Où est placé ton argent" subtitle="Voici le détail de tes placements actuels." entries={computed.detailEntries} />
                <PieChart title="Répartition simple de ton argent" subtitle="On regroupe ici ton argent entre une partie stable, une partie qui peut évoluer, et les autres actifs." entries={computed.strategicEntries} />
              </div>
            </div>
          )}
        </div>

        {/* ── BLOC 8: Premium ── */}
        <div className="relative mt-6 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#0B1F3A_0%,#172554_100%)] p-8 text-white shadow-[0_30px_80px_rgba(11,31,58,0.22)]">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-300/50">Trajectoire Active · Premium</p>
          <p className="mt-3 text-2xl font-bold leading-snug">Ne reste pas au stade du constat.</p>
          <p className="mt-2 text-base text-blue-100/70">
            Reviens chaque mois voir ce que ton futur gagne réellement.<br />
            Transforme ce diagnostic en progression concrète, mois après mois.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-blue-200/50">
            {["Objectif personnalisé", "Progression enregistrée", "Historique mensuel", "Jalons débloqués", "Impact mis à jour automatiquement"].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-blue-400/40" />{f}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/premium"
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
            >
              Activer ma trajectoire — 5,99 €/mois
            </Link>
            <p className="text-xs text-blue-200/30">Sans engagement · Résiliable à tout moment.</p>
          </div>

          {/* Modale inline */}
          {showPremiumModal && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B1F3A]/90 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#0f2a50] p-7 shadow-2xl">
                {modalSuccess ? (
                  <div className="text-center">
                    <p className="text-3xl">✓</p>
                    <p className="mt-3 text-lg font-bold text-white">Tu es sur la liste !</p>
                    <p className="mt-2 text-sm text-blue-200/70">On te contacte dès que l&apos;accès Premium est ouvert.</p>
                    <button
                      type="button"
                      onClick={() => setShowPremiumModal(false)}
                      className="mt-5 rounded-2xl border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Fermer
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-blue-300/50">Accès anticipé</p>
                        <p className="mt-1 text-lg font-bold text-white">Rejoins la liste d&apos;attente</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPremiumModal(false)}
                        className="rounded-full p-1 text-blue-300/40 transition hover:text-white"
                        aria-label="Fermer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-blue-100/70">
                      <p className="font-semibold text-white">Trajectoire Active — 5,99 €/mois</p>
                      <ul className="mt-2 space-y-1">
                        {["Objectif mensuel personnalisé", "Progression & jalons enregistrés", "Impact mis à jour automatiquement"].map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-blue-400/50" />{f}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-blue-200/40">Sans engagement · Résiliable à tout moment.</p>
                    </div>
                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs text-blue-200/60">Ton email</label>
                      <input
                        type="email"
                        required
                        value={modalEmail}
                        onChange={(e) => setModalEmail(e.target.value)}
                        placeholder="toi@exemple.fr"
                        className="h-11 w-full rounded-2xl border border-white/15 bg-white/8 px-4 text-sm text-white placeholder-blue-300/30 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
                    >
                      M&apos;inscrire sur la liste
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/diagnostic" className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50">
            Refaire le diagnostic
          </Link>
          <Link href="/suivi" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: ACCENT }}>
            Voir mon suivi →
          </Link>
          <Link href="/premium" className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
            Passer à l'actif →
          </Link>
          <Link href="/objectifs" className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50">
            Mes objectifs →
          </Link>
          <div className="text-xs text-zinc-500">
            Ce simulateur est un outil pédagogique. Les résultats reposent sur des hypothèses simplifiées et ne constituent pas un conseil en investissement.
          </div>
        </div>
      </div>
    </main>
  );
}