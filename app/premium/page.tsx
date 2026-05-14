"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const ACCENT = "#2563EB";
const SUCCESS = "#16A34A";
const NAVY = "#0B1F3A";

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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="7" fill="#dcfce7" />
      <path d="M5 8 L7 10 L11 6" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="7" fill="#fee2e2" />
      <path d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function PremiumPage() {
  const [deltaH, setDeltaH] = useState(74000);
  const [waitlistCount, setWaitlistCount] = useState(47);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("capitalpilot:v5");
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const salary        = Number(data.salary        ?? 0);
        const otherIncome   = Number(data.otherIncome   ?? 0);
        const housing       = Number(data.housing       ?? 0);
        const food          = Number(data.food          ?? 0);
        const transport     = Number(data.transport     ?? 0);
        const leisure       = Number(data.leisure       ?? 0);
        const subscriptions = Number(data.subscriptions ?? 0);
        const misc          = Number(data.misc          ?? 0);
        const investedCapital   = Number(data.investedCapitalTotal ?? 0);
        const savingsMonthly    = Number(data.savingsMonthly    ?? 0);
        const investmentMonthly = Number(data.investmentMonthly ?? 0);
        const age = Number(data.age ?? 30);
        const H = clamp(Number(data.recommendedHorizon ?? Math.max(5, 65 - age)), 5, 60);
        const income   = salary + otherIncome;
        const expenses = housing + food + transport + leisure + subscriptions + misc;
        const margin   = Math.max(0, income - expenses);
        const monthlyCurrent   = Math.min(savingsMonthly + investmentMonthly, margin);
        const monthlyOptimized = margin;
        const base      = futureValue(investedCapital, monthlyCurrent,   0.04, H);
        const optimized = futureValue(investedCapital, monthlyOptimized, 0.07, H);
        const delta = Math.max(0, optimized - base);
        setDeltaH(delta > 100 ? delta : 74000);

      }
    } catch { /* ignore */ }

    try {
      const wl = localStorage.getItem("capitalpilot:waitlist");
      const arr: string[] = wl ? (JSON.parse(wl) as string[]) : [];
      setWaitlistCount((Array.isArray(arr) ? arr.length : 0) + 47);
    } catch { /* ignore */ }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem("capitalpilot:waitlist") ?? "[]");
      if (!existing.includes(email.trim())) {
        const updated = [...existing, email.trim()];
        localStorage.setItem("capitalpilot:waitlist", JSON.stringify(updated));
        setWaitlistCount(updated.length + 47);
      }
    } catch { /* ignore */ }
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">

      {/* ── BLOC 1: Hero ── */}
      <section style={{ background: NAVY }} className="px-6 py-20">
        <div className="mx-auto max-w-[640px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span style={{ color: "rgba(147,197,253,0.7)", fontSize: 11 }}>Accès anticipé · Lancement septembre 2025</span>
          </div>

          <div className="mt-8">
            <p className="text-xl" style={{ color: "rgba(148,163,184,0.7)" }}>Tu laisses</p>
            <p className="mt-1 font-bold leading-none tracking-tight text-[5rem] sm:text-[7rem]" style={{ color: "#34d399" }}>
              +{euro(deltaH)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">sur la table.</p>
          </div>

          <p className="mx-auto mt-4 max-w-[420px] text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
            CapitalPilot Actif transforme ce constat en progression réelle, mois après mois.
          </p>

          <div className="mx-auto mt-12 flex max-w-sm items-stretch"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-1 px-6 pt-6 text-center">
              <p className="text-lg font-bold text-white">1 diagnostic sur 3</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>est oublié en moins d&apos;une semaine</p>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex-1 px-6 pt-6 text-center">
              <p className="text-lg font-bold text-white">40% de plus</p>
              <p className="mt-1 text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>investi après 6 mois de suivi régulier</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-10 rounded-2xl px-8 py-4 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
          >
            Rejoindre la liste d&apos;attente →
          </button>
        </div>
      </section>

      {/* ── BLOC 2: Trois transformations ── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-950">Ce qui change quand tu passes à l&apos;action</h2>
            <p className="mt-2 text-sm text-zinc-500">Pas une feature de plus. Une façon différente de gérer ton argent.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M4 24 L10 16 L16 18 L22 10 L28 6" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="28" cy="6" r="2.5" fill={ACCENT} />
                  </svg>
                ),
                title: "Ta trajectoire en temps réel",
                desc: "Chaque mois, tu vois si tu es en avance ou en retard sur ton objectif — en euros réels. Pas en pourcentages abstraits.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" stroke={SUCCESS} strokeWidth="2" />
                    <circle cx="16" cy="16" r="7" stroke={SUCCESS} strokeWidth="2" />
                    <circle cx="16" cy="16" r="2.5" fill={SUCCESS} />
                  </svg>
                ),
                title: "Un objectif de vie concret",
                desc: "50 000 € d'ici 5 ans, 500 €/mois passifs à 55 ans — tu choisis ton cap et l'app te dit chaque mois la distance restante.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M18 4 L10 18 H16 L14 28 L24 14 H18 L20 4 Z" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                ),
                title: "Une action chaque mois",
                desc: "Pas un article générique. Une recommandation issue de ta situation réelle, avec l'impact chiffré si tu l'appliques.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-[28px] border border-zinc-200/70 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                {card.icon}
                <h3 className="mt-4 text-base font-semibold text-zinc-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOC 3: Comparaison ── */}
      <section className="px-6 py-16" style={{ background: "#F8FAFC" }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-zinc-950">Deux façons d&apos;utiliser CapitalPilot</h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Gratuit */}
            <div className="rounded-[28px] border border-zinc-200 bg-white p-8">
              <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">Gratuit</span>
              <h3 className="mt-4 text-xl font-bold text-zinc-950">Diagnostic</h3>
              <p className="mt-2 text-3xl font-bold text-zinc-400">0 €</p>
              <div className="my-5 border-t border-zinc-100" />
              <ul className="space-y-3">
                {["Diagnostic ponctuel", "Une projection unique", "Pas de suivi dans le temps", "Résultats qui s'effacent"].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CrossIcon />
                    <span className="text-sm text-zinc-500">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/diagnostic"
                className="mt-8 flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Faire le diagnostic
              </Link>
            </div>

            {/* Actif */}
            <div className="relative rounded-[28px] border-2 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]" style={{ borderColor: ACCENT }}>
              <span className="absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: ACCENT }}>
                Recommandé
              </span>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: ACCENT }}>Actif</span>
              <h3 className="mt-4 text-xl font-bold text-zinc-950">Trajectoire Active</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold" style={{ color: ACCENT }}>5,99 €</span>
                <span className="ml-1 text-sm text-zinc-400">/mois</span>
              </p>
              <div className="my-5 border-t border-zinc-100" />
              <ul className="space-y-3">
                {[
                  "Trajectoire mise à jour chaque mois",
                  "Score de progression réel",
                  "Objectif de vie personnalisé",
                  "Action concrète mensuelle",
                  "Historique de tes décisions",
                  "Alertes si ta trajectoire dévie",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-sm font-medium text-zinc-800">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-400">Sans engagement · Résiliable à tout moment</p>
              <button
                type="button"
                onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-6 w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
              >
                Rejoindre la liste →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOC 4: Comment ça marche ── */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-zinc-950">Ta progression, mois après mois</h2>

          <div className="relative mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Ligne pointillée desktop */}
            <div className="absolute left-[16.66%] right-[16.66%] top-6 hidden border-t-2 border-dashed border-zinc-200 sm:block" />

            {[
              {
                num: "01",
                bg: "bg-blue-50",
                color: ACCENT,
                title: "Tu fais ton diagnostic",
                desc: "Tu renseignes ta situation réelle. L'app calcule ton écart et ton objectif personnalisé.",
              },
              {
                num: "02",
                bg: "bg-zinc-100",
                color: "#52525b",
                title: "Tu valides chaque mois",
                desc: "Tu entres ce que tu as réellement investi. Ton score de trajectoire se met à jour en temps réel.",
              },
              {
                num: "03",
                bg: "bg-emerald-50",
                color: SUCCESS,
                title: "Tu vois ta progression",
                desc: "Ton graphique grandit. La distance vers ton objectif diminue. Tu mesures l'impact de chaque décision.",
              },
            ].map((step) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold ${step.bg}`} style={{ color: step.color }}>
                  {step.num}
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOC 5: Preuve sociale ── */}
      <section className="px-6 py-16 text-center" style={{ background: "#F8FAFC" }}>
        <div className="mx-auto max-w-xl">
          <p className="text-5xl font-bold" style={{ color: ACCENT }}>{waitlistCount}</p>
          <p className="mt-1 text-lg text-zinc-600">personnes ont déjà rejoint la liste d&apos;attente.</p>

          <div className="relative mx-auto mt-8 max-w-lg rounded-[28px] border border-zinc-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <svg className="mb-4" width="32" height="24" viewBox="0 0 32 24" fill="none">
              <path d="M0 24 C0 14 4 6 12 0 L14 3 C9 7 7 12 8 16 L14 16 L14 24 Z" fill="#dbeafe" />
              <path d="M18 24 C18 14 22 6 30 0 L32 3 C27 7 25 12 26 16 L32 16 L32 24 Z" fill="#dbeafe" />
            </svg>
            <p className="text-sm leading-7 text-zinc-600 italic">
              J&apos;avais fait le diagnostic et j&apos;avais oublié dans la semaine. Avec le suivi mensuel je reviens voir mes chiffres comme je vérifie mon compte bancaire.
            </p>
            <p className="mt-4 text-xs text-zinc-400">— Utilisateur CapitalPilot</p>
          </div>
        </div>
      </section>

      {/* ── BLOC 6: Formulaire waitlist ── */}
      <section id="waitlist" style={{ background: NAVY }} className="px-6 py-20">
        <div className="mx-auto max-w-[520px] text-center">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto">
                <circle
                  cx="32" cy="32" r="28" fill="none" stroke="#34d399" strokeWidth="3"
                  style={{ strokeDasharray: 176, strokeDashoffset: 0, transition: "stroke-dashoffset 0.6s ease" }}
                />
                <path
                  d="M20 32 L28 40 L44 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 1, transition: "opacity 0.3s ease 0.5s" }}
                />
              </svg>
              <p className="text-2xl font-bold text-white">Tu es sur la liste !</p>
              <p className="text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
                On te contacte dès l&apos;ouverture de l&apos;accès anticipé.
              </p>
              <Link href="/resultats" className="mt-2 text-sm transition hover:text-blue-200" style={{ color: "rgba(147,197,253,0.6)" }}>
                ← Retour au diagnostic
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white">Rejoins la liste d&apos;attente</h2>
              <p className="mt-2 text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
                Tu seras parmi les premiers prévenus au lancement. Aucun spam, aucun engagement.
              </p>

              <div className="mt-6 rounded-2xl p-5 text-left" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)" }}>
                <p className="text-sm font-semibold text-white">Trajectoire Active — 5,99 €/mois</p>
                <ul className="mt-3 space-y-2">
                  {["Objectif mensuel personnalisé", "Score de progression réel", "Action concrète chaque mois"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(147,197,253,0.5)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs" style={{ color: "rgba(147,197,253,0.4)" }}>Sans engagement · Résiliable à tout moment</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.fr"
                  className="mt-4 h-12 w-full rounded-2xl px-4 text-sm text-white outline-none"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                  }}
                />
                <button
                  type="submit"
                  className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
                >
                  Rejoindre la liste →
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── BLOC 7: Footer ── */}
      <footer className="border-t border-zinc-100 bg-white px-6 py-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/resultats" className="text-sm text-zinc-500 transition hover:text-zinc-800">← Retour au diagnostic</Link>
          <Link href="/diagnostic" className="text-sm text-zinc-500 transition hover:text-zinc-800">Refaire le diagnostic</Link>
          <Link href="/suivi" className="text-sm text-zinc-500 transition hover:text-zinc-800">Mon suivi</Link>
        </div>
        <p className="mx-auto mt-4 max-w-lg text-center text-xs text-zinc-400">
          CapitalPilot est un outil pédagogique. Les projections sont des simulations basées sur des hypothèses simplifiées et ne constituent pas un conseil en investissement.
        </p>
      </footer>

    </main>
  );
}
