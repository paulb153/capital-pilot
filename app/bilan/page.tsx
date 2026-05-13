"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ── Utilitaires ────────────────────────────────────────────────────────────

function euro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(n).replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
}

function futureValue(initial: number, monthly: number, annualRate: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const r = Math.max(0, annualRate) / 12;
  let value = Math.max(0, initial);
  for (let i = 0; i < months; i++) value = value * (1 + r) + Math.max(0, monthly);
  return value;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const MONTH_LABELS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function formatMonth(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_LABELS[parseInt(m) - 1]} ${y}`;
}

// ── Types ──────────────────────────────────────────────────────────────────

type Loan = { monthlyPayment: number; remainingCapital: number };
type ExtraAccount = { id: string; type: string; amount: number; ratePct: number };
type Payload = {
  salary: number; otherIncome: number; housing: number; food: number;
  transport: number; leisure: number; subscriptions: number; misc: number;
  checkingAmount: number; livretAAmount: number; livretARatePct: number;
  extraAccounts: ExtraAccount[]; safetyMonths: 3 | 4 | 5 | 6;
  investMonthly: boolean; monthlyInvestment: number; createdAt: number;
  age?: number; electricity?: number; loans?: Loan[]; recommendedHorizon?: number;
  investedCapitalTotal?: number;
};
type TrackingData = { month: string; progress: number; streak: number; milestones: string[] };
type LifeGoal = { label: string; targetAmount: number; targetYear: number; supportLabel: string; ratePct: number; createdAt: number };
type MonthEntry = { month: string; invested: number; cumulative: number; scoreAtMonth: number };

// ── Mini sparkline ─────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const W = 120, H = 36;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const scaleX = (i: number) => (i / (values.length - 1)) * W;
  const scaleY = (v: number) => H - ((v - min) / range) * H * 0.85 - 2;
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BilanPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [history, setHistory] = useState<MonthEntry[]>([]);
  const [goal, setGoal] = useState<LifeGoal | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    try {
      const raw = localStorage.getItem("capitalpilot:v5");
      if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") setData(p); }
    } catch { }
    try {
      const raw = localStorage.getItem("capitalpilot:tracking:v1");
      if (raw) setTracking(JSON.parse(raw));
    } catch { }
    try {
      const raw = localStorage.getItem("capitalpilot:history:v1");
      if (raw) { const h = JSON.parse(raw); if (Array.isArray(h)) setHistory(h); }
    } catch { }
    try {
      const raw = localStorage.getItem("capitalpilot:goal:v1");
      if (raw) { const g = JSON.parse(raw); if (g?.label) setGoal(g); }
    } catch { }

    setSelectedMonth(currentKey);
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    const today = new Date();
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const age = data.age ?? 30;
    const H = clamp(data.recommendedHorizon ?? Math.max(5, 65 - age), 5, 60);
    const loans = data.loans ?? [];
    const loanPayments = loans.reduce((s, l) => s + l.monthlyPayment, 0);
    const income = data.salary + data.otherIncome;
    const expenses = data.housing + data.food + data.transport + data.leisure +
      data.subscriptions + data.misc + (data.electricity ?? 0) + loanPayments;
    const margin = Math.max(0, income - expenses);
    const monthlyCurrent = data.investMonthly ? Math.min(data.monthlyInvestment, margin) : 0;
    const investedCapital = data.investedCapitalTotal ?? 0;

    // History stats
    const cumulativeInvested = history.reduce((s, e) => s + e.invested, 0);
    const totalMonths = history.length;
    const avgMonthly = totalMonths > 0 ? cumulativeInvested / totalMonths : 0;
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    const prevEntry = history.length > 1 ? history[history.length - 2] : null;
    const deltaVsPrev = lastEntry && prevEntry ? lastEntry.invested - prevEntry.invested : null;

    // Selected month entry
    const selectedEntry = history.find(e => e.month === selectedMonth) ?? null;
    const selectedIdx = history.findIndex(e => e.month === selectedMonth);
    const prevSelectedEntry = selectedIdx > 0 ? history[selectedIdx - 1] : null;

    // Projection at H years from now
    const projectedAtH = futureValue(investedCapital + cumulativeInvested, monthlyCurrent, 0.07, H);
    const projectedAtH_noNew = futureValue(investedCapital, 0, 0.04, H);
    const gainFromRegularity = Math.max(0, projectedAtH - projectedAtH_noNew);

    // Goal projection
    let goalProjectPct = 0;
    let goalMonthlyNeeded = 0;
    let goalOnTrack = false;
    if (goal) {
      const targetDate = new Date(goal.targetYear, 0, 1);
      const monthsRemaining = Math.max(1,
        (targetDate.getFullYear() - today.getFullYear()) * 12 +
        (targetDate.getMonth() - today.getMonth())
      );
      const rate = (goal.ratePct ?? 7) / 100;
      const projected = futureValue(investedCapital + cumulativeInvested, monthlyCurrent, rate, monthsRemaining / 12);
      goalProjectPct = goal.targetAmount > 0 ? Math.min(100, (projected / goal.targetAmount) * 100) : 0;
      const r = rate / 12;
      const fvCap = (investedCapital + cumulativeInvested) * Math.pow(1 + r, monthsRemaining);
      const remaining = Math.max(0, goal.targetAmount - fvCap);
      goalMonthlyNeeded = remaining > 0 ? remaining * r / (Math.pow(1 + r, monthsRemaining) - 1) : 0;
      goalOnTrack = monthlyCurrent >= goalMonthlyNeeded * 0.9;
    }

    // Streak
    const streak = tracking?.streak ?? 0;

    // Month-over-month series for sparkline (last 6)
    const last6 = history.slice(-6);

    // Insight sentence
    const insight = (() => {
      if (totalMonths === 0) return "Valide ton premier mois sur la page Suivi pour commencer l'historique.";
      if (streak >= 6) return `${streak} mois d'affilée — tu es dans le top des épargnants réguliers.`;
      if (streak >= 3) return `${streak} mois consécutifs validés. La régularité fait 80% du travail.`;
      if (deltaVsPrev !== null && deltaVsPrev > 0) return `+${euro(deltaVsPrev)} de plus que le mois dernier. Continue sur cette lancée.`;
      if (deltaVsPrev !== null && deltaVsPrev < 0) return `${euro(Math.abs(deltaVsPrev))} de moins que le mois dernier. Essaie de rattraper ce mois-ci.`;
      if (totalMonths === 1) return "Premier mois validé. La trajectoire commence maintenant.";
      return `${totalMonths} mois de données — tu construis quelque chose de solide.`;
    })();

    // Is current month validated?
    const currentMonthValidated = history.some(e => e.month === currentKey && e.invested > 0);

    return {
      income, expenses, margin, monthlyCurrent, investedCapital, H,
      cumulativeInvested, totalMonths, avgMonthly, lastEntry, prevEntry,
      deltaVsPrev, selectedEntry, prevSelectedEntry,
      projectedAtH, gainFromRegularity,
      goalProjectPct, goalMonthlyNeeded, goalOnTrack,
      streak, last6, insight, currentKey, currentMonthValidated,
    };
  }, [data, history, tracking, goal, selectedMonth]);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center px-6">
          <p className="text-zinc-500 text-sm">Aucun diagnostic trouvé.</p>
          <Link href="/diagnostic" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
            Faire mon diagnostic →
          </Link>
        </div>
      </main>
    );
  }

  const monthOptions = [...history].reverse().map(e => e.month);
  if (computed && !monthOptions.includes(computed.currentKey)) {
    monthOptions.unshift(computed.currentKey);
  }

  return (
    <main className="min-h-screen text-zinc-900"
      style={{ background: "linear-gradient(180deg, #F0F6FF 0%, #F8FAFC 30%, #ffffff 100%)" }}>

      {/* ── HEADER ── */}
      <div style={{ background: "#0B1F3A" }} className="w-full px-6 py-8 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-blue-300/50">Rapport automatique</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Mon bilan</h1>
            <p className="mt-1 text-sm text-blue-200/50">
              Généré depuis tes données — aucune saisie requise.
            </p>
          </div>

          {/* Sélecteur de mois */}
          {monthOptions.length > 1 && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-blue-300/50">Mois affiché</p>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="h-9 rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-blue-400"
              >
                {monthOptions.map(m => (
                  <option key={m} value={m} className="text-zinc-900 bg-white">
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 sm:px-10">

        {/* ── LIGNE 1 : 4 KPI ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

          {/* Investi ce mois */}
          <div className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              {selectedMonth === computed?.currentKey ? "Ce mois" : formatMonth(selectedMonth)}
            </p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">
              {computed?.selectedEntry ? euro(computed.selectedEntry.invested) : "—"}
            </p>
            {computed?.prevSelectedEntry && computed.selectedEntry && (
              <p className={`mt-1 text-xs font-medium ${
                computed.selectedEntry.invested >= computed.prevSelectedEntry.invested
                  ? "text-emerald-600" : "text-red-500"
              }`}>
                {computed.selectedEntry.invested >= computed.prevSelectedEntry.invested ? "+" : ""}
                {euro(computed.selectedEntry.invested - computed.prevSelectedEntry.invested)} vs mois préc.
              </p>
            )}
          </div>

          {/* Cumulatif total */}
          <div className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Total investi</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">
              {euro(computed?.cumulativeInvested ?? 0)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              sur {computed?.totalMonths ?? 0} mois validés
            </p>
          </div>

          {/* Moyenne mensuelle */}
          <div className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Moyenne/mois</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">
              {euro(computed?.avgMonthly ?? 0)}
            </p>
            {computed && computed.monthlyCurrent > 0 && (
              <p className={`mt-1 text-xs font-medium ${
                (computed.avgMonthly ?? 0) >= computed.monthlyCurrent ? "text-emerald-600" : "text-amber-500"
              }`}>
                Objectif : {euro(computed.monthlyCurrent)}/mois
              </p>
            )}
          </div>

          {/* Streak */}
          <div className="rounded-[24px] border border-zinc-200/70 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Régularité</p>
            <p className="mt-3 text-3xl font-bold text-zinc-950">
              {computed?.streak ?? 0}
              <span className="text-base font-normal text-zinc-400 ml-1">mois</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {(computed?.streak ?? 0) >= 6 ? "Excellente régularité"
                : (computed?.streak ?? 0) >= 3 ? "Bonne régularité"
                : "En construction"}
            </p>
          </div>
        </div>

        {/* ── INSIGHT AUTO ── */}
        {computed?.insight && (
          <div className="mt-5 rounded-[22px] border border-blue-100 bg-blue-50 px-5 py-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="9" cy="9" r="7.5" stroke="#2563EB" strokeWidth="1.5"/>
              <path d="M9 8V12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="6" r="0.75" fill="#2563EB"/>
            </svg>
            <p className="text-sm text-blue-800">{computed.insight}</p>
          </div>
        )}

        {/* ── LIGNE 2 : Projection + Objectif ── */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Projection */}
          <div className="rounded-[28px] bg-[#0B1F3A] p-7 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-blue-300/50">Projection</p>
            <h2 className="mt-1 text-lg font-bold">Dans {computed?.H ?? 20} ans</h2>

            <div className="mt-5 flex items-end gap-4">
              <div>
                <p className="text-xs text-blue-300/40">Capital projeté</p>
                <p className="mt-1 text-4xl font-bold" style={{ color: "#34d399" }}>
                  {euro(computed?.projectedAtH ?? 0)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/5 px-4 py-3">
              <div className="flex justify-between text-xs">
                <span className="text-blue-300/50">Gain grâce à ta régularité</span>
                <span className="text-emerald-400 font-semibold">+{euro(computed?.gainFromRegularity ?? 0)}</span>
              </div>
              <p className="mt-1 text-xs text-blue-300/30">vs capital actuel sans nouveaux versements</p>
            </div>

            {/* Sparkline */}
            {(computed?.last6.length ?? 0) >= 2 && (
              <div className="mt-5">
                <p className="text-xs text-blue-300/40 mb-2">Tes 6 derniers mois</p>
                <Sparkline values={computed!.last6.map(e => e.invested)} color="#34d399" />
              </div>
            )}
          </div>

          {/* Objectif de vie */}
          {goal ? (
            <div className="rounded-[28px] border border-zinc-200/70 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Objectif de vie</p>
              <h2 className="mt-1 text-lg font-bold text-zinc-950">{goal.label}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{goal.supportLabel} · {goal.ratePct}%/an · {goal.targetYear}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-950">{euro(goal.targetAmount)}</span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Progression projetée</span>
                  <span className="font-semibold text-zinc-800">{computed?.goalProjectPct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-zinc-100">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${computed?.goalProjectPct ?? 0}%`, background: "linear-gradient(90deg, #2563EB, #34d399)" }} />
                </div>
              </div>

              <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-medium ${
                computed?.goalOnTrack ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {computed?.goalOnTrack
                  ? "Tu es en bonne voie pour atteindre cet objectif."
                  : `Il te faudrait ${euro(computed?.goalMonthlyNeeded ?? 0)}/mois pour y arriver.`}
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border-2 border-dashed border-zinc-200 bg-white p-7 flex flex-col items-center justify-center text-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto">
                <circle cx="20" cy="20" r="15" stroke="#2563EB" strokeWidth="2"/>
                <circle cx="20" cy="20" r="8" stroke="#2563EB" strokeWidth="1.5"/>
                <circle cx="20" cy="20" r="2.5" fill="#2563EB"/>
              </svg>
              <p className="mt-3 text-sm font-semibold text-zinc-800">Aucun objectif défini</p>
              <p className="mt-1 text-xs text-zinc-400">Définis un cap sur la page Suivi pour voir ta progression ici.</p>
              <Link href="/suivi" className="mt-4 text-xs font-semibold text-blue-600 hover:underline">
                Définir mon objectif →
              </Link>
            </div>
          )}
        </div>

        {/* ── HISTORIQUE COMPLET ── */}
        {history.length > 0 && (
          <div className="mt-6 rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <p className="text-base font-semibold text-zinc-950 mb-4">Historique complet</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-zinc-400 border-b border-zinc-100">
                  <th className="text-left pb-3">Mois</th>
                  <th className="text-right pb-3">Investi</th>
                  <th className="text-right pb-3">Cumulé</th>
                  <th className="text-right pb-3">Score</th>
                  <th className="text-right pb-3">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((entry, i, arr) => {
                  const prev = arr[i + 1];
                  const delta = prev ? entry.invested - prev.invested : null;
                  const isCurrent = entry.month === computed?.currentKey;
                  return (
                    <tr key={entry.month}
                      className={`border-b border-zinc-50 ${isCurrent ? "bg-blue-50/50" : ""}`}>
                      <td className="py-3 text-zinc-600">
                        {formatMonth(entry.month)}
                        {isCurrent && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Ce mois</span>}
                      </td>
                      <td className="py-3 text-right font-semibold text-zinc-900">{euro(entry.invested)}</td>
                      <td className="py-3 text-right text-zinc-500">{euro(entry.cumulative)}</td>
                      <td className="py-3 text-right font-semibold" style={{
                        color: entry.scoreAtMonth >= 70 ? "#16A34A" : entry.scoreAtMonth >= 50 ? "#2563EB" : "#f59e0b"
                      }}>
                        {entry.scoreAtMonth}
                      </td>
                      <td className="py-3 text-right text-xs font-medium">
                        {delta === null ? <span className="text-zinc-300">—</span>
                          : delta > 0 ? <span className="text-emerald-600">+{euro(delta)}</span>
                          : delta < 0 ? <span className="text-red-500">{euro(delta)}</span>
                          : <span className="text-zinc-400">=</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CTA si pas encore validé ce mois ── */}
        {computed && !computed.currentMonthValidated && (
          <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-amber-800">
              Tu n&apos;as pas encore validé {formatMonth(computed.currentKey)}.
            </p>
            <Link href="/suivi"
              className="flex-shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: "#f59e0b" }}>
              Valider maintenant →
            </Link>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-6">
          <div className="flex flex-wrap gap-3">
            <Link href="/suivi"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              ← Mon suivi
            </Link>
            <Link href="/objectifs"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Mes objectifs
            </Link>
            <Link href="/resultats"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Mon diagnostic
            </Link>
          </div>
          <p className="text-xs text-zinc-400">
            Simulation pédagogique — non garanti.
          </p>
        </div>

      </div>
    </main>
  );
}
