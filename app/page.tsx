"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAVY = "#0B1F3A";
const SKY = "#3b82f6";
const GREEN = "#16A34A";

function euro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n).replace(/\u202F/g, " ").replace(/\u00A0/g, " ");
}

function BrandLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" aria-hidden="true">
      <defs>
        <linearGradient id="cpGradHub" x1="18%" y1="82%" x2="82%" y2="18%">
          <stop offset="0%" stopColor={SKY} />
          <stop offset="55%" stopColor="#22c1c3" />
          <stop offset="100%" stopColor={GREEN} />
        </linearGradient>
      </defs>
      <path d="M18 46C18 28.3 31.8 14 49 14c6.5 0 12.3 2 17 5.2l-7.2 7.1c-3-1.7-6.2-2.8-10.4-2.8-11.5 0-20.5 9.2-20.5 20.6 0 1.8.2 3.3.7 4.9l-8.8 2.3c-1.2-3.2-1.8-6.4-1.8-10.3Z" fill="#13254B" />
      <path d="M66.5 57.2C61.9 63.1 54.5 67 46.4 67c-9.9 0-18.6-5.2-23.6-12.9l10.6-.9c3.4 3.3 8 5.3 13.5 5.3 3.7 0 7.1-.8 10.2-2.5l9.4 1.2Z" fill="#13254B" />
      <path d="M20 50.7c3.8 4.3 10.6 4.1 15.3.2L60.8 27l-4.2-3.6 20-5.6-5.8 19.5-4.4-3.7-24 22.5c-7.4 6.9-18.7 7.1-25 .4l2.6-5.8Z" fill="url(#cpGradHub)" />
    </svg>
  );
}

type QuickStats = {
  hasDiagnostic: boolean;
  margin: number;
  streak: number;
  monthlyTarget: number;
  cumulativeInvested: number;
};

function useQuickStats(): QuickStats {
  const [stats, setStats] = useState<QuickStats>({
    hasDiagnostic: false, margin: 0, streak: 0, monthlyTarget: 0, cumulativeInvested: 0,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("capitalpilot:v5");
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      const income = Number(d.salary ?? 0) + Number(d.otherIncome ?? 0);
      const expenses = Number(d.housing ?? 0) + Number(d.food ?? 0) +
        Number(d.transport ?? 0) + Number(d.leisure ?? 0) +
        Number(d.subscriptions ?? 0) + Number(d.misc ?? 0);
      const margin = Math.max(0, income - expenses);
      const monthlyInvestment = Number(d.monthlyInvestment ?? 0);

      const tracking = (() => {
        try { return JSON.parse(localStorage.getItem("capitalpilot:tracking:v1") ?? "{}"); }
        catch { return {}; }
      })();
      const streak = Number(tracking.streak ?? 0);

      const history = (() => {
        try { return JSON.parse(localStorage.getItem("capitalpilot:history:v1") ?? "[]") as Array<{ cumulative?: number }>; }
        catch { return []; }
      })();
      const lastEntry = history[history.length - 1];
      const cumulativeInvested = Number(lastEntry?.cumulative ?? 0);

      setStats({
        hasDiagnostic: true,
        margin,
        streak,
        monthlyTarget: monthlyInvestment,
        cumulativeInvested,
      });
    } catch { /* ignore */ }
  }, []);

  return stats;
}

// ─── Nav tiles ────────────────────────────────────────────────────────────────

const TILES = [
  {
    href: "/resultats",
    label: "Résultats",
    subtitle: "Analyse ta situation financière",
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="12" width="3" height="5" rx="1" fill="#2563EB" />
        <rect x="8.5" y="8" width="3" height="9" rx="1" fill="#2563EB" />
        <rect x="14" y="4" width="3" height="13" rx="1" fill="#2563EB" />
      </svg>
    ),
    color: "border-blue-200 bg-blue-50/60",
    badge: null as string | null,
  },
  {
    href: "/suivi",
    label: "Suivi",
    subtitle: "Valide ton mois et suis ta progression",
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#2563EB" strokeWidth="1.6" />
        <path d="M10 6V10L13 12" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    color: "border-violet-200 bg-violet-50/60",
    badge: null as string | null,
  },
  {
    href: "/objectifs",
    label: "Objectifs",
    subtitle: "Définis tes objectifs de vie",
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#16A34A" strokeWidth="1.6" />
        <circle cx="10" cy="10" r="3.5" stroke="#16A34A" strokeWidth="1.4" />
        <circle cx="10" cy="10" r="1" fill="#16A34A" />
      </svg>
    ),
    color: "border-emerald-200 bg-emerald-50/60",
    badge: null as string | null,
  },
  {
    href: "/bilan",
    label: "Bilan",
    subtitle: "Ton rapport mensuel automatique",
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="3" stroke="#f59e0b" strokeWidth="1.6" />
        <path d="M6 10.5L8.5 13L14 7.5" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "border-amber-200 bg-amber-50/60",
    badge: null as string | null,
  },
  {
    href: "/apprendre",
    label: "Apprendre",
    subtitle: "Livret A, PEA, ETF, immobilier…",
    icon: (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M3 6l7-3 7 3v2c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"
          stroke="#8b5cf6" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 10l1.5 1.5L12.5 8" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "border-purple-200 bg-purple-50/60",
    badge: "7 modules" as string | null,
  },
];

export default function HomePage() {
  const stats = useQuickStats();

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #F0F6FF 0%, #f8fafc 40%, #ffffff 100%)" }}>
      <div className="mx-auto max-w-2xl px-5 py-10">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <BrandLogo size={44} />
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: NAVY }}>
              Capital<span style={{ color: SKY }}>Pilot</span>
            </h1>
            <p className="text-sm text-zinc-500">Pilote ton patrimoine, mois après mois.</p>
          </div>
        </div>

        {/* ── CTA diagnostic ── */}
        {!stats.hasDiagnostic ? (
          /* Pas encore de diagnostic — landing card */
          <div className="relative overflow-hidden rounded-[28px] p-7 text-white shadow-[0_30px_80px_rgba(11,31,58,0.22)] mb-6"
            style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #172554 100%)" }}>
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_30%)]" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-200/80 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                Deux futurs. Un choix.
              </span>
              <h2 className="text-2xl font-bold leading-snug">
                Dans 20 ans, tu n'auras<br />pas la même vie.
              </h2>
              <p className="mt-2 text-sm text-blue-100/60 leading-relaxed">
                5 étapes · 2 minutes · Diagnostic complet et gratuit.
              </p>
              <Link
                href="/diagnostic"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
              >
                Voir ma trajectoire →
              </Link>
            </div>
          </div>
        ) : (
          /* Diagnostic existant — résumé rapide */
          <div className="rounded-[28px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Ta situation</p>
              <Link href="/diagnostic" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                Refaire le diagnostic →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-center">
                <p className="text-xs text-zinc-400 mb-1">Marge mensuelle</p>
                <p className="text-lg font-bold text-zinc-900">{euro(stats.margin)}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-center">
                <p className="text-xs text-zinc-400 mb-1">Objectif mensuel</p>
                <p className="text-lg font-bold text-blue-700">
                  {stats.monthlyTarget > 0 ? euro(stats.monthlyTarget) : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-center">
                <p className="text-xs text-zinc-400 mb-1">
                  {stats.streak > 0 ? "Série en cours" : "Investi total"}
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {stats.streak > 0
                    ? `${stats.streak} mois`
                    : stats.cumulativeInvested > 0
                      ? euro(stats.cumulativeInvested)
                      : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tiles navigation ── */}
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
          {stats.hasDiagnostic ? "Continuer" : "Explorer"}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TILES.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group flex items-center gap-4 rounded-2xl border p-4 transition hover:shadow-md hover:-translate-y-0.5 ${tile.color}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                {tile.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{tile.label}</p>
                  {tile.badge && (
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                      {tile.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 truncate">{tile.subtitle}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"
                className="flex-shrink-0 text-zinc-300 group-hover:text-zinc-500 transition">
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <p className="mt-10 text-center text-xs text-zinc-400">
          CapitalPilot · Outil pédagogique · Pas un conseil en investissement
        </p>

      </div>
    </main>
  );
}
