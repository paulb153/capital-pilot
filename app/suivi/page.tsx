"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  migrateGoalV1ToV2,
  loadRaw,
  loadPatrimoine,
  savePatrimoineEntry,
  patrimoineDelta,
  patrimoinePerf,
  type PatrimoineValuations,
  type PatrimoineEntry,
} from "@/lib/storage";

// ── Types ─────────────────────────────────────────────────────────────────────

type ExtraAccount = { id: string; type: string; amount: number; ratePct: number };

type InvestmentBreakdown = {
  pea: number; cto: number; assuranceVieFondsEuro: number; assuranceVieUC: number;
  immobilier: number; crowdfunding: number; crypto: number; per: number; autres: number;
};

type Payload = {
  salary: number; housing: number; safetyMonths: number;
  checkingAmount: number; livretAAmount: number;
  extraAccounts: ExtraAccount[];
  savingsMonthly: number; investmentMonthly: number;
  investedCapitalTotal?: number;
  investmentBreakdown?: InvestmentBreakdown;
  createdAt: number;
};

type StandardValuationKey = keyof Omit<PatrimoineValuations, "extras">;

type ActiveEnvelope =
  | { kind: "standard"; key: StandardValuationKey; label: string; diagValue: number }
  | { kind: "extra"; id: string; label: string; diagValue: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const ENVELOPE_DEFS: Array<{
  key: StandardValuationKey;
  label: string;
  getDiagValue: (d: Payload) => number;
}> = [
  { key: "pea",            label: "PEA",                  getDiagValue: (d) => d.investmentBreakdown?.pea ?? 0 },
  { key: "cto",            label: "CTO",                  getDiagValue: (d) => d.investmentBreakdown?.cto ?? 0 },
  { key: "avFondsEuro",    label: "AV fonds euros",       getDiagValue: (d) => d.investmentBreakdown?.assuranceVieFondsEuro ?? 0 },
  { key: "avUC",           label: "AV unités de compte",  getDiagValue: (d) => d.investmentBreakdown?.assuranceVieUC ?? 0 },
  { key: "immobilier",     label: "Immobilier",           getDiagValue: (d) => d.investmentBreakdown?.immobilier ?? 0 },
  { key: "crowdfunding",   label: "Crowdfunding",         getDiagValue: (d) => d.investmentBreakdown?.crowdfunding ?? 0 },
  { key: "crypto",         label: "Crypto",               getDiagValue: (d) => d.investmentBreakdown?.crypto ?? 0 },
  { key: "per",            label: "PER",                  getDiagValue: (d) => d.investmentBreakdown?.per ?? 0 },
  { key: "autres",         label: "Autres placements",    getDiagValue: (d) => d.investmentBreakdown?.autres ?? 0 },
  { key: "checkingAmount", label: "Compte courant",       getDiagValue: (d) => d.checkingAmount },
  { key: "livretAAmount",  label: "Livret A / LEP",       getDiagValue: (d) => d.livretAAmount },
];

const PIE_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1", "#14b8a6",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n);
}

function formatChartY(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}

function formatMonthShort(month: string): string {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function totalFromValuations(v: PatrimoineValuations): number {
  return (v.pea ?? 0) + (v.cto ?? 0) + (v.avFondsEuro ?? 0) + (v.avUC ?? 0) +
    (v.immobilier ?? 0) + (v.crowdfunding ?? 0) + (v.crypto ?? 0) + (v.per ?? 0) +
    (v.autres ?? 0) + (v.checkingAmount ?? 0) + (v.livretAAmount ?? 0) +
    (v.extras ? Object.values(v.extras).reduce((s, x) => s + x, 0) : 0);
}

function buildEnvelopes(data: Payload | null): ActiveEnvelope[] {
  const standard: ActiveEnvelope[] = ENVELOPE_DEFS.map((def) => ({
    kind: "standard" as const,
    key: def.key,
    label: def.label,
    diagValue: data ? def.getDiagValue(data) : 0,
  }));
  const extras: ActiveEnvelope[] = (data?.extraAccounts ?? []).map((acc) => ({
    kind: "extra" as const,
    id: acc.id,
    label: acc.type || "Autre",
    diagValue: acc.amount,
  }));
  return [...standard, ...extras];
}

// ── PieChart ──────────────────────────────────────────────────────────────────

type PieSlice = { label: string; value: number; color: string };
type PiePath  = { d: string; color: string; label: string; pct: number };

function buildPiePaths(slices: PieSlice[]): PiePath[] {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return [];
  const r = 100; const cx = 120; const cy = 120;
  let cumAngle = -Math.PI / 2;
  return slices.map((sl) => {
    const angle = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return {
      d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: sl.color,
      label: sl.label,
      pct: Math.round((sl.value / total) * 100),
    };
  });
}

function PieChart({ slices }: { slices: PieSlice[] }) {
  const nonZero = slices.filter((s) => s.value > 0);
  if (nonZero.length === 0) {
    return <div className="text-zinc-500 text-sm py-4">Aucune donnée à afficher</div>;
  }
  const paths = buildPiePaths(nonZero);
  return (
    <div className="flex items-start gap-6 flex-wrap">
      <svg viewBox="0 0 240 240" className="w-36 h-36 flex-shrink-0">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke="#18181b" strokeWidth={2} />
        ))}
      </svg>
      <ul className="text-xs space-y-1.5 mt-1">
        {paths.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-zinc-300">{p.label}</span>
            <span className="text-zinc-500">{p.pct} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── PatrimoineChart ───────────────────────────────────────────────────────────

function PatrimoineChart({ entries }: { entries: PatrimoineEntry[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  if (entries.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 rounded-xl bg-zinc-900 text-zinc-500 text-sm">
        Saisissez au moins 2 mois pour voir l&apos;évolution
      </div>
    );
  }

  const W = 820; const H = 260;
  const PL = 56; const PR = 20; const PT = 16; const PB = 40;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const values = entries.map((e) => e.totalValue);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const px = (i: number) => PL + (i / (entries.length - 1)) * chartW;
  const py = (v: number) => PT + chartH - ((v - minV) / range) * chartH;

  const linePoints = entries.map((e, i) => `${px(i).toFixed(1)},${py(e.totalValue).toFixed(1)}`).join(" ");
  const areaPoints = `${px(0).toFixed(1)},${(PT + chartH).toFixed(1)} ${linePoints} ${px(entries.length - 1).toFixed(1)},${(PT + chartH).toFixed(1)}`;

  return (
    <div className="relative rounded-xl bg-zinc-900 overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200 }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-axis grid + labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const yy = PT + chartH - t * chartH;
          return (
            <g key={t}>
              <line x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="#27272a" strokeWidth={1} />
              <text x={PL - 5} y={yy + 4} textAnchor="end" fontSize={10} fill="#71717a">
                {formatChartY(minV + t * range)}
              </text>
            </g>
          );
        })}
        {/* Area fill */}
        <polygon points={areaPoints} fill="#22c55e" fillOpacity={0.07} />
        {/* Line */}
        <polyline points={linePoints} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
        {/* X-axis labels */}
        {entries.map((e, i) => (
          <text key={e.month} x={px(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#71717a">
            {formatMonthShort(e.month)}
          </text>
        ))}
        {/* Hover zones */}
        {entries.map((_, i) => {
          const x0 = i === 0 ? PL : (px(i - 1) + px(i)) / 2;
          const x1 = i === entries.length - 1 ? W - PR : (px(i) + px(i + 1)) / 2;
          return (
            <rect
              key={`hz-${i}`}
              x={x0} y={PT} width={x1 - x0} height={chartH}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTooltip({ x: px(i), y: py(entries[i].totalValue), idx: i })}
            />
          );
        })}
        {/* Dot on hover */}
        {tooltip !== null && (
          <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#22c55e" stroke="#18181b" strokeWidth={2} />
        )}
      </svg>
      {/* Tooltip bubble */}
      {tooltip !== null && (() => {
        const e = entries[tooltip.idx];
        const prev = tooltip.idx > 0 ? entries[tooltip.idx - 1] : null;
        const delta = prev ? e.totalValue - prev.totalValue : null;
        return (
          <div
            className="absolute pointer-events-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(tooltip.x / W) * 100}%`,
              top: `${(tooltip.y / H) * 100}%`,
              transform: "translate(-50%, -130%)",
              minWidth: 110,
            }}
          >
            <div className="font-semibold text-white mb-0.5">{formatMonthShort(e.month)}</div>
            <div className="text-zinc-300">{formatEur(e.totalValue)}</div>
            {delta !== null && (
              <div className={delta >= 0 ? "text-green-400" : "text-red-400"}>
                {delta >= 0 ? "+" : ""}{formatEur(delta)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── SaisieModal ───────────────────────────────────────────────────────────────

type SaisieModalProps = {
  month: string;
  envelopes: ActiveEnvelope[];
  previousEntry: PatrimoineEntry | null;
  diagMonthly: number;
  onSave: (entry: PatrimoineEntry) => void;
  onClose: () => void;
};

function SaisieModal({ month, envelopes, previousEntry, diagMonthly, onSave, onClose }: SaisieModalProps) {
  function initValues(): Record<string, string> {
    const vals: Record<string, string> = {};
    for (const env of envelopes) {
      const k = env.kind === "standard" ? env.key : `extra:${env.id}`;
      if (previousEntry) {
        const pv = env.kind === "standard"
          ? (previousEntry.valuations[env.key] ?? 0)
          : (previousEntry.valuations.extras?.[env.id] ?? 0);
        vals[k] = pv > 0 ? String(pv) : "";
      } else {
        vals[k] = env.diagValue > 0 ? String(env.diagValue) : "";
      }
    }
    return vals;
  }

  const [values, setValues] = useState<Record<string, string>>(initValues);
  const [contributions, setContributions] = useState<string>(
    diagMonthly > 0 ? String(diagMonthly) : ""
  );

  function getHint(env: ActiveEnvelope): string {
    if (previousEntry) {
      const pv = env.kind === "standard"
        ? (previousEntry.valuations[env.key] ?? 0)
        : (previousEntry.valuations.extras?.[env.id] ?? 0);
      if (pv > 0) return `Mois dernier : ${formatEur(pv)}`;
    }
    if (env.diagValue > 0) return `Diagnostic initial : ${formatEur(env.diagValue)}`;
    return "";
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const valuations: PatrimoineValuations = {};
    const extras: Record<string, number> = {};
    for (const env of envelopes) {
      const k = env.kind === "standard" ? env.key : `extra:${env.id}`;
      const v = parseFloat(values[k] || "0") || 0;
      if (env.kind === "standard") {
        (valuations as Record<string, number>)[env.key] = v;
      } else {
        extras[env.id] = v;
      }
    }
    if (Object.keys(extras).length > 0) valuations.extras = extras;
    const totalValue = totalFromValuations(valuations);
    const contributionsNum = parseFloat(contributions || "0") || 0;
    const entry: PatrimoineEntry = {
      month,
      valuations,
      totalValue,
      ...(contributionsNum > 0 ? { contributions: contributionsNum } : {}),
      createdAt: Date.now(),
    };
    onSave(entry);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              Saisie — {formatMonthShort(month)}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {envelopes.map((env) => {
              const k = env.kind === "standard" ? env.key : `extra:${env.id}`;
              const hint = getHint(env);
              return (
                <div key={k}>
                  <label className="block text-sm text-zinc-300 mb-1">{env.label}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={values[k] ?? ""}
                    onChange={(ev) => setValues((prev) => ({ ...prev, [k]: ev.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                  {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
                </div>
              );
            })}

            <hr className="border-zinc-800 my-2" />

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Versements totaux ce mois (€)</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={contributions}
                onChange={(e) => setContributions(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Virement épargne + investissement ce mois</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MonPatrimoinePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [entries, setEntries] = useState<PatrimoineEntry[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    migrateGoalV1ToV2();
    const raw = loadRaw();
    if (raw && typeof raw === "object") setData(raw as Payload);
    setEntries(loadPatrimoine().entries);
  }, []);

  const envelopes   = buildEnvelopes(data);
  const lastEntry   = entries.length > 0 ? entries[entries.length - 1] : null;
  const firstEntry  = entries.length > 0 ? entries[0] : null;

  // Diagnostic total from main payload
  const diagTotal = data
    ? data.checkingAmount + data.livretAAmount +
      (data.investedCapitalTotal ??
        (data.investmentBreakdown
          ? Object.values(data.investmentBreakdown).reduce((s, v) => s + v, 0)
          : 0)) +
      (data.extraAccounts ?? []).reduce((s, a) => s + a.amount, 0)
    : 0;

  const displayTotal = lastEntry?.totalValue ?? diagTotal;
  const diagMonthly  = data ? (data.savingsMonthly || 0) + (data.investmentMonthly || 0) : 0;

  // Delta ce mois
  const deltaTotal         = patrimoineDelta(entries);
  const deltaContributions = lastEntry?.contributions ?? 0;
  const deltaMarket        = deltaTotal !== null ? deltaTotal - deltaContributions : null;
  const hasContributions   = lastEntry?.contributions !== undefined;

  // Performance totale depuis le premier mois enregistré
  const perf = firstEntry && lastEntry && firstEntry !== lastEntry
    ? patrimoinePerf(firstEntry.totalValue, lastEntry.totalValue)
    : null;

  // Pie slices from last entry or diag values
  const pieSlices: PieSlice[] = envelopes.map((env, i) => {
    let value = 0;
    if (lastEntry) {
      value = env.kind === "standard"
        ? (lastEntry.valuations[env.key] ?? 0)
        : (lastEntry.valuations.extras?.[env.id] ?? 0);
    } else {
      value = env.diagValue;
    }
    return { label: env.label, value, color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter((s) => s.value > 0);

  function handleSave(entry: PatrimoineEntry) {
    savePatrimoineEntry(entry);
    setEntries(loadPatrimoine().entries);
    setShowModal(false);
  }

  const month = currentMonth();
  const isCurrentMonthSaved = entries.some((e) => e.month === month);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon patrimoine</h1>
            <p className="text-zinc-400 text-sm mt-1">Suivi mensuel de vos actifs</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {isCurrentMonthSaved ? "Mettre à jour" : `Saisir ${formatMonthShort(month)}`}
          </button>
        </div>

        {/* Section 1 : Valeur totale */}
        <section className="bg-zinc-900 rounded-2xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Valeur totale</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-white tabular-nums">{formatEur(displayTotal)}</span>
            {entries.length === 0 && (
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                Diagnostic initial
              </span>
            )}
          </div>

          {deltaTotal !== null && (
            <div className={`mt-3 text-sm font-medium ${deltaTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
              {deltaTotal >= 0 ? "↗" : "↘"}{" "}
              {deltaTotal >= 0 ? "+" : ""}{formatEur(deltaTotal)} ce mois
              {hasContributions && deltaMarket !== null && (
                <span className="text-zinc-400 font-normal">
                  {" "}(dont{" "}
                  <span className="text-blue-400">+{formatEur(deltaContributions)} versés</span>
                  ,{" "}
                  <span className={deltaMarket >= 0 ? "text-green-400" : "text-red-400"}>
                    {deltaMarket >= 0 ? "+" : ""}{formatEur(deltaMarket)} marché
                  </span>
                  )
                </span>
              )}
            </div>
          )}

          {entries.length === 1 && (
            <p className="mt-2 text-sm text-zinc-500">
              Premier mois enregistré — revenez le mois prochain pour voir l&apos;évolution.
            </p>
          )}

          {perf !== null && (
            <p className="mt-2 text-xs text-zinc-500">
              Performance totale :{" "}
              <span className={perf >= 0 ? "text-green-400" : "text-red-400"}>
                {perf >= 0 ? "+" : ""}{perf.toFixed(1)} %
              </span>
              {firstEntry && ` depuis ${formatMonthShort(firstEntry.month)}`}
            </p>
          )}
        </section>

        {/* Section 2 : Évolution */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Évolution</h2>
          <PatrimoineChart entries={entries} />
        </section>

        {/* Section 3 : Répartition */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Répartition</h2>
          <div className="bg-zinc-900 rounded-2xl p-6">
            {pieSlices.length > 0
              ? <PieChart slices={pieSlices} />
              : (
                <p className="text-sm text-zinc-500">
                  Complétez votre{" "}
                  <Link href="/" className="text-green-400 hover:text-green-300">diagnostic</Link>{" "}
                  pour voir la répartition de votre patrimoine.
                </p>
              )
            }
          </div>
        </section>

        {/* Section 4 : Historique */}
        {entries.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Historique</h2>
            <div className="bg-zinc-900 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Mois</th>
                    <th className="text-right px-4 py-3 text-zinc-500 font-medium">Total</th>
                    <th className="text-right px-4 py-3 text-zinc-500 font-medium">Évolution</th>
                    <th className="text-right px-4 py-3 text-zinc-500 font-medium">Versements</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map((e, idx, arr) => {
                    const prev = arr[idx + 1];
                    const delta = prev ? e.totalValue - prev.totalValue : null;
                    return (
                      <tr key={e.month} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 text-zinc-300">{formatMonthShort(e.month)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                          {formatEur(e.totalValue)}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums ${delta !== null ? (delta >= 0 ? "text-green-400" : "text-red-400") : "text-zinc-600"}`}>
                          {delta !== null ? `${delta >= 0 ? "+" : ""}${formatEur(delta)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                          {e.contributions !== undefined ? formatEur(e.contributions) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Encart /objectifs */}
        <section className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5">
          <p className="text-sm text-zinc-400">
            Construire de la richesse, c&apos;est bien — savoir <em>pourquoi</em> et{" "}
            <em>vers quoi</em>, c&apos;est mieux.
          </p>
          <Link
            href="/objectifs"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            Gérer mes objectifs de vie →
          </Link>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-600 pb-4 space-y-1.5">
          <div className="space-x-3">
            <Link href="/" className="hover:text-zinc-400 transition-colors">Diagnostic</Link>
            <span>·</span>
            <Link href="/objectifs" className="hover:text-zinc-400 transition-colors">Objectifs</Link>
            <span>·</span>
            <Link href="/apprendre" className="hover:text-zinc-400 transition-colors">Apprendre</Link>
          </div>
          <div>CapitalPilot — données stockées localement</div>
        </footer>

      </div>

      {/* Saisie modal */}
      {showModal && (
        <SaisieModal
          month={month}
          envelopes={envelopes}
          previousEntry={lastEntry}
          diagMonthly={diagMonthly}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
