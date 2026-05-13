"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { savePayload } from "@/lib/storage";

const ACCENT = "#2563EB";
const NAVY = "#0B1F3A";
const SKY = "#3b82f6";
const GREEN = "#16A34A";

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

type ExtraAccountType = "LEP" | "Livret Jeune" | "LDDS" | "Autre compte";
type ExtraAccount = {
  id: string;
  type: ExtraAccountType;
  amount: number;
  ratePct: number;
};

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
          <linearGradient id="cpArrowGradHome" x1="18%" y1="82%" x2="82%" y2="18%">
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
          fill="url(#cpArrowGradHome)"
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

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-zinc-900">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          disabled={disabled}
          className={[
            "h-12 w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 pr-12 text-zinc-900 shadow-sm outline-none transition",
            "focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
            "disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed",
            "placeholder:text-zinc-400",
          ].join(" ")}
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix ? (
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-zinc-500">
            {suffix}
          </div>
        ) : null}
      </div>
      {hint ? <p className="text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition",
        active
          ? "text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
      ].join(" ")}
      style={active ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
    >
      {children}
    </button>
  );
}

function SmallSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-zinc-900">{label}</label>
      <select
        className="h-12 w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(0);

  const stepNames = [
    "Ce que tu fais entrer",
    "Ce qui sort chaque mois",
    "Ce que tu as déjà de côté",
    "Ce que tu fais déjà travailler",
    "Ton filet de sécurité",
  ];
  const stepHints = [
    "On commence par ta base mensuelle.",
    "On voit ce qu'il te reste vraiment chaque mois.",
    "Ta réserve commence à prendre forme.",
    "Ta trajectoire s'affine.",
    "Dernière étape avant ta projection.",
  ];

  // Profil
  const [age, setAge] = useState(30);

  // Revenus
  const [salary, setSalary] = useState(1600);
  const [otherIncome, setOtherIncome] = useState(0);

  // Dépenses
  const [housing, setHousing] = useState(600);
  const [food, setFood] = useState(250);
  const [transport, setTransport] = useState(80);
  const [leisure, setLeisure] = useState(200);
  const [subscriptions, setSubscriptions] = useState(30);
  const [misc, setMisc] = useState(100);

  // Épargne non investie
  const [checkingAmount, setCheckingAmount] = useState(0);
  const [livretAAmount, setLivretAAmount] = useState(0);

  // Autres comptes
  const [showExtraAccounts, setShowExtraAccounts] = useState(false);
  const [extraAccounts, setExtraAccounts] = useState<ExtraAccount[]>([]);

  // Investissement
  const [hasInvestedCapital, setHasInvestedCapital] = useState(false);
  const [avFondsEuro, setAvFondsEuro] = useState(0);
  const [dynamicCapital, setDynamicCapital] = useState(0);
  const [immoCapital, setImmoCapital] = useState(0);

  // Distinction épargne / investissement mensuel
  const [hasSavingsMonthly, setHasSavingsMonthly] = useState(false);
  const [savingsMonthly, setSavingsMonthly] = useState(0);
  const [hasInvestmentMonthly, setHasInvestmentMonthly] = useState(false);
  const [investmentMonthly, setInvestmentMonthly] = useState(0);

  // Épargne de sécurité
  const [safetyMonths, setSafetyMonths] = useState<3 | 4 | 5 | 6>(3);

  const computed = useMemo(() => {
    const incomeTotal = Math.max(0, salary) + Math.max(0, otherIncome);
    const expensesTotal =
      Math.max(0, housing) +
      Math.max(0, food) +
      Math.max(0, transport) +
      Math.max(0, leisure) +
      Math.max(0, subscriptions) +
      Math.max(0, misc);

    const margin = Math.max(0, incomeTotal - expensesTotal);

    const extraTotal = extraAccounts.reduce((sum, a) => sum + Math.max(0, a.amount), 0);
    const nonInvestedTotal = Math.max(0, checkingAmount) + Math.max(0, livretAAmount) + extraTotal;

    // garde-fou : impossible d'investir + que la marge déclarée
    const declaredSavings = hasSavingsMonthly ? Math.max(0, savingsMonthly) : 0;
    const declaredInvestment = hasInvestmentMonthly ? Math.max(0, investmentMonthly) : 0;
    const declaredMonthly = declaredSavings + declaredInvestment;
    const monthlyUsedCap = Math.min(declaredMonthly, margin);

    const monthlyTooHigh = (hasSavingsMonthly || hasInvestmentMonthly) && declaredMonthly > margin && margin > 0;

    return { incomeTotal, expensesTotal, margin, nonInvestedTotal, monthlyTooHigh, monthlyUsedCap };
  }, [
    salary,
    otherIncome,
    housing,
    food,
    transport,
    leisure,
    subscriptions,
    misc,
    checkingAmount,
    livretAAmount,
    extraAccounts,
    hasSavingsMonthly,
    savingsMonthly,
    hasInvestmentMonthly,
    investmentMonthly,
  ]);

  function addExtraAccount() {
    setExtraAccounts((prev) => {
      if (prev.length >= 4) return prev;
      return [
        ...prev,
        {
          id: String(Date.now()) + "-" + Math.random().toString(16).slice(2),
          type: "LEP",
          amount: 0,
          ratePct: 0,
        },
      ];
    });
  }

  function updateExtraAccount(id: string, patch: Partial<ExtraAccount>) {
    setExtraAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeExtraAccount(id: string) {
    setExtraAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleGenerate() {
    const payload = {
      age,
      salary,
      otherIncome,

      housing,
      food,
      transport,
      leisure,
      subscriptions,
      misc,

      checkingAmount,
      livretAAmount,
      livretARatePct: 1.5,
      extraAccounts,

      safetyMonths,

      hasInvestedCapital,
      investedCapitalTotal: hasInvestedCapital ? avFondsEuro + dynamicCapital + immoCapital : 0,
      investmentBreakdown: hasInvestedCapital ? {
        pea: 0, cto: 0,
        assuranceVieFondsEuro: avFondsEuro,
        assuranceVieUC: dynamicCapital,
        immobilier: immoCapital,
        crowdfunding: 0, crypto: 0, per: 0, autres: 0,
      } : undefined,

      savingsMonthly: hasSavingsMonthly ? savingsMonthly : 0,
      investmentMonthly: hasInvestmentMonthly ? investmentMonthly : 0,
      // Rétrocompatibilité : montants combinés pour les anciens consommateurs
      investMonthly: hasSavingsMonthly || hasInvestmentMonthly,
      monthlyInvestment: (hasSavingsMonthly ? savingsMonthly : 0) + (hasInvestmentMonthly ? investmentMonthly : 0),

      createdAt: Date.now(),
    };

    savePayload(payload);

    setIsGenerating(true);
    setTimeout(() => router.push("/resultats"), 650);
  }

  return (
    <main
      className="min-h-screen text-zinc-900"
      style={{ background: "linear-gradient(180deg, #F0F6FF 0%, #F8FAFC 30%, #ffffff 100%)" }}
    >
      <div className="mx-auto max-w-xl px-6 py-10">

        {/* ── STEP 0 : HERO ── */}
        {step === 0 && (
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.22),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(22,163,74,0.10),transparent_40%),linear-gradient(155deg,#0B1F3A_0%,#0f2a50_55%,#0B1F3A_100%)] p-8 text-white shadow-[0_40px_100px_rgba(11,31,58,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
            <div className="relative">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-blue-200/70 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300/80" />
                Deux futurs. Un choix.
              </div>

              {/* Logo */}
              <div className="mt-5">
                <BrandLogo withWordmark />
              </div>

              {/* Titre */}
              <h1 className="mt-6 text-[2.4rem] font-bold tracking-tight leading-[1.08] sm:text-5xl">
                Dans 20 ans, tu n’auras<br className="hidden sm:block" /> pas la même vie.
              </h1>
              <p className="mt-3 text-sm leading-[1.8] text-blue-100/60 sm:text-base">
                Deux personnes, mêmes revenus — des patrimoines radicalement différents.{" "}
                CapitalPilot te montre l’écart, en euros.
              </p>

              {/* Visuel bifurcation */}
              <div className="mt-7 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-5">
                <svg viewBox="0 0 320 72" className="w-full" height="72" aria-hidden="true">
                  <defs>
                    <filter id="heroGlowG" x="-20%" y="-80%" width="140%" height="260%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <linearGradient id="greenHeroFade" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="1"/>
                    </linearGradient>
                    <linearGradient id="redHeroFade" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6"/>
                    </linearGradient>
                  </defs>
                  {/* Point de départ */}
                  <circle cx="22" cy="44" r="3.5" fill="#475569"/>
                  {/* Trajectoire rouge — inaction */}
                  <path d="M22,44 C80,46 180,54 298,62" stroke="url(#redHeroFade)" strokeWidth="1.8" strokeDasharray="7 4" fill="none"/>
                  <circle cx="298" cy="62" r="3" fill="#ef4444" opacity="0.6"/>
                  {/* Trajectoire verte — optimisée */}
                  <path d="M22,44 C80,34 180,16 298,6" stroke="url(#greenHeroFade)" strokeWidth="2.8" fill="none" filter="url(#heroGlowG)"/>
                  <circle cx="298" cy="6" r="4" fill="#22c55e"/>
                  {/* Label gauche */}
                  <text x="22" y="68" textAnchor="middle" fontSize="8.5" fill="#475569">Aujourd’hui</text>
                  {/* Labels droite */}
                  <text x="304" y="10" fontSize="8.5" fill="#86efac" fontWeight="600">Optimisé</text>
                  <text x="304" y="66" fontSize="8.5" fill="#fca5a5" opacity="0.7">Inaction</text>
                </svg>
              </div>

              {/* Cartes narratives */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-4 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-blue-200/50">Situation réelle</p>
                  <p className="mt-1.5 text-sm font-semibold leading-tight">Ton point de départ</p>
                  <p className="mt-1 text-[11px] text-blue-200/40">Sans filtre</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-4 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-blue-200/50">Projection</p>
                  <p className="mt-1.5 text-sm font-semibold leading-tight">Deux trajectoires</p>
                  <p className="mt-1 text-[11px] text-blue-200/40">Côte à côte</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.06] px-3 py-4 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-blue-200/50">Révélation</p>
                  <p className="mt-1.5 text-sm font-semibold leading-tight">L’écart réel</p>
                  <p className="mt-1 text-[11px] text-blue-200/40">En euros</p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-7 flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-2xl px-7 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.45)] transition hover:opacity-95 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 60%, #60a5fa 100%)" }}
                >
                  Voir ma trajectoire →
                </button>
                <p className="text-xs text-blue-200/30">5 étapes · ~2 minutes</p>
              </div>

            </div>
          </div>
        )}

        {/* ── STEPS 1–5 ── */}
        {step >= 1 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <BrandLogo size={36} withWordmark />
              <button type="button" onClick={() => setStep(0)} className="text-xs text-zinc-400 transition hover:text-zinc-600">
                Recommencer
              </button>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700">{stepNames[step - 1]}</span>
                <span className="text-zinc-400">{step} / 5</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(step / 5) * 100}%`, background: "linear-gradient(90deg, #2563EB, #16A34A)" }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-400">{stepHints[step - 1]}</p>
            </div>

            {/* Step content */}
            <div className="mt-8">

              {step === 1 && (
                <Panel title="Ton point de départ" subtitle="On commence par ta réalité — sans filtre, sans arrondi.">
                  {/* Bloc âge — point de départ narratif */}
                  <div className="mb-5 rounded-2xl border border-blue-100/80 bg-blue-50/40 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-blue-500/60">Ton horizon de vie</p>
                    <div className="mt-3 flex items-end gap-5">
                      <div className="w-32">
                        <Field label="Ton âge" value={age} onChange={(n) => setAge(Math.max(18, Math.min(80, n)))} suffix="ans" />
                      </div>
                      {age >= 18 && (
                        <p className="mb-1 text-sm text-zinc-500">
                          Projection sur <strong className="text-zinc-800">{Math.max(5, 65 - age)} ans</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Revenus */}
                  <p className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-400">Revenus mensuels nets</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Salaire net" value={salary} onChange={(n) => setSalary(Math.max(0, n))} suffix="€" />
                    <Field label="Autres revenus" value={otherIncome} onChange={(n) => setOtherIncome(Math.max(0, n))} suffix="€" hint="Freelance, aides, loyers…" />
                  </div>

                  {computed.incomeTotal > 0 && (
                    <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                      <div className="flex items-baseline justify-between">
                        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Ta base mensuelle</p>
                        <p className="text-2xl font-semibold text-zinc-950">{euro(computed.incomeTotal)}</p>
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">
                        {computed.incomeTotal >= 3000
                          ? "Tu as une bonne base pour construire quelque chose de solide."
                          : computed.incomeTotal >= 1500
                          ? "Une base correcte — tout dépend de ce qui en sort."
                          : "Même avec une marge serrée, l’organisation fait la différence."}
                      </p>
                    </div>
                  )}
                </Panel>
              )}

              {step === 2 && (
                <Panel title="Ce qui sort chaque mois" subtitle="C’est ici qu’on voit ce qu’il te reste vraiment pour construire ton futur.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Logement" value={housing} onChange={(n) => setHousing(Math.max(0, n))} suffix="€" />
                    <Field label="Nourriture" value={food} onChange={(n) => setFood(Math.max(0, n))} suffix="€" />
                    <Field label="Transport" value={transport} onChange={(n) => setTransport(Math.max(0, n))} suffix="€" />
                    <Field label="Loisirs" value={leisure} onChange={(n) => setLeisure(Math.max(0, n))} suffix="€" />
                    <Field label="Abonnements" value={subscriptions} onChange={(n) => setSubscriptions(Math.max(0, n))} suffix="€" />
                    <Field label="Divers" value={misc} onChange={(n) => setMisc(Math.max(0, n))} suffix="€" />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Tes sorties du mois</p>
                      <p className="mt-2 text-2xl font-semibold text-zinc-950">{euro(computed.expensesTotal)}</p>
                    </div>
                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(37,99,235,0.18)", background: "linear-gradient(180deg, rgba(239,246,255,0.92) 0%, rgba(255,255,255,0.95) 100%)" }}>
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Ce qu’il te reste pour avancer</p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: ACCENT }}>{euro(computed.margin)}</p>
                    </div>
                  </div>
                  {computed.incomeTotal > 0 && (
                    <p className="mt-3 text-xs text-zinc-400">
                      {computed.margin <= 0
                        ? "Tes dépenses absorbent tes revenus — c'est le premier point à résoudre."
                        : computed.margin / computed.incomeTotal >= 0.3
                        ? "Tu as déjà une vraie capacité à avancer."
                        : computed.margin / computed.incomeTotal >= 0.15
                        ? "Il y a de la marge — elle peut commencer à travailler."
                        : "Ta marge est serrée — le potentiel viendra surtout d'une meilleure répartition."}
                    </p>
                  )}
                </Panel>
              )}

              {step === 3 && (
                <Panel title="Ce que tu as déjà de côté" subtitle="Comptes courants et livrets — on regarde ce qui dort et ce qui peut travailler.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Compte courant" value={checkingAmount} onChange={(n) => setCheckingAmount(Math.max(0, n))} suffix="€" />
                    <Field label="Livret A" value={livretAAmount} onChange={(n) => setLivretAAmount(Math.max(0, n))} suffix="€" hint="Taux actuel : 1,5%" />
                  </div>
                  <label className="mt-5 flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input type="checkbox" checked={showExtraAccounts} onChange={(e) => { const v = e.target.checked; setShowExtraAccounts(v); if (!v) setExtraAccounts([]); }} className="h-4 w-4 rounded border-zinc-300" />
                    Autre compte à renseigner ?
                  </label>
                  {showExtraAccounts && (
                    <div className="mt-4 grid gap-4">
                      {extraAccounts.map((acc, idx) => (
                        <div key={acc.id} className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-zinc-900">Compte #{idx + 1}</p>
                            <button type="button" onClick={() => removeExtraAccount(acc.id)} className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-900">Supprimer</button>
                          </div>
                          <div className="mt-3 grid gap-4 sm:grid-cols-3">
                            <SmallSelect label="Type" value={acc.type} onChange={(v) => updateExtraAccount(acc.id, { type: v as ExtraAccountType })} options={["LEP", "Livret Jeune", "LDDS", "Autre compte"]} />
                            <Field label="Montant" value={acc.amount} onChange={(n) => updateExtraAccount(acc.id, { amount: Math.max(0, n) })} suffix="€" />
                            <Field label="Taux" value={acc.ratePct} onChange={(n) => updateExtraAccount(acc.id, { ratePct: clamp(n, 0, 20) })} suffix="%" hint="Tu choisis le taux." />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addExtraAccount} disabled={extraAccounts.length >= 4} className="w-fit rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60">
                        + Ajouter un compte {extraAccounts.length >= 4 ? "(max 4)" : ""}
                      </button>
                    </div>
                  )}
                  <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-zinc-600">Ta réserve disponible</span>
                      <span className="text-xl font-semibold text-zinc-950">{euro(computed.nonInvestedTotal)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    {computed.nonInvestedTotal === 0
                      ? "Pas encore d'épargne renseignée — c'est exactement ce que l'analyse peut changer."
                      : computed.nonInvestedTotal >= computed.margin * 6
                      ? "Tu as déjà une bonne réserve. On va voir ce qui peut vraiment travailler."
                      : "Tu as déjà une base exploitable."}
                  </p>
                </Panel>
              )}

              {step === 4 && (
                <Panel title="Ce qui travaille déjà" subtitle="Capital placé, effort mensuel — c’est ici que ta trajectoire commence à se dessiner.">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input type="checkbox" checked={hasInvestedCapital} onChange={(e) => { const v = e.target.checked; setHasInvestedCapital(v); if (!v) { setAvFondsEuro(0); setDynamicCapital(0); setImmoCapital(0); } }} className="h-4 w-4 rounded border-zinc-300" />
                    As-tu déjà un capital investi ?
                  </label>
                  {hasInvestedCapital && (
                    <div className="mt-4 grid gap-3">
                      <Field label="Fonds euros (assurance vie sécurisée)" value={avFondsEuro} onChange={(n) => setAvFondsEuro(Math.max(0, n))} suffix="€" hint="AV en fonds euros — capital garanti, rendement ~2–4%/an." />
                      <Field label="Placements boursiers (PEA, CTO, AV UC…)" value={dynamicCapital} onChange={(n) => setDynamicCapital(Math.max(0, n))} suffix="€" hint="Supports investis en actions ou ETF — plus dynamiques." />
                      <Field label="Immobilier locatif" value={immoCapital} onChange={(n) => setImmoCapital(Math.max(0, n))} suffix="€" hint="Valeur estimée de ton immobilier hors résidence principale." />
                    </div>
                  )}
                  {/* Épargne mensuelle */}
                  <label className="mt-5 flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input type="checkbox" checked={hasSavingsMonthly} onChange={(e) => { const v = e.target.checked; setHasSavingsMonthly(v); if (!v) setSavingsMonthly(0); }} className="h-4 w-4 rounded border-zinc-300" />
                    Tu épargnes chaque mois ?
                  </label>
                  {hasSavingsMonthly && (
                    <div className="mt-3">
                      <Field label="Épargne mensuelle" value={savingsMonthly} onChange={(n) => setSavingsMonthly(Math.max(0, n))} suffix="€/mois" hint="Livret A, LEP, fonds euros — capital garanti, disponible à tout moment." />
                    </div>
                  )}

                  {/* Investissement mensuel */}
                  <label className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input type="checkbox" checked={hasInvestmentMonthly} onChange={(e) => { const v = e.target.checked; setHasInvestmentMonthly(v); if (!v) setInvestmentMonthly(0); }} className="h-4 w-4 rounded border-zinc-300" />
                    Tu investis chaque mois ?
                  </label>
                  {hasInvestmentMonthly && (
                    <div className="mt-3">
                      <Field label="Investissement mensuel" value={investmentMonthly} onChange={(n) => setInvestmentMonthly(Math.max(0, n))} suffix="€/mois" hint="PEA, ETF, assurance vie UC, immobilier — capital non garanti, rendement potentiellement plus élevé." />
                    </div>
                  )}

                  {computed.monthlyTooHigh && (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                      Le total déclaré dépasse ta marge ({euro(computed.margin)}/mois). Le diagnostic s’ajustera à ta marge réelle.
                    </p>
                  )}
                  <p className="mt-5 text-xs text-zinc-400">
                    {hasInvestedCapital && (avFondsEuro + dynamicCapital + immoCapital) > 0
                      ? "Tu as déjà commencé à faire travailler ton argent. C’est un vrai avantage."
                      : !hasInvestedCapital
                      ? "Tu pars d’une page blanche — l’impact d’un changement peut être très fort."
                      : null}
                  </p>
                </Panel>
              )}

              {step === 5 && (
                <Panel title="Ton filet de sécurité" subtitle="C’est l’argent qui te protège en cas d’imprévu. Il ne doit pas être investi — il doit rester disponible.">
                  <div className="flex flex-wrap gap-2">
                    {[3, 4, 5, 6].map((m) => (
                      <Chip key={m} active={safetyMonths === m} onClick={() => setSafetyMonths(m as 3 | 4 | 5 | 6)}>
                        {m} mois
                      </Chip>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                    <p className="text-sm font-semibold text-zinc-900">Comment choisir ?</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700"><span className="font-semibold">Profil sécuritaire</span> : vise plutôt <span className="font-semibold">6 mois</span>.</p>
                    <p className="mt-1 text-sm leading-7 text-zinc-700"><span className="font-semibold">Situation stable (CDI)</span> : <span className="font-semibold">3 mois</span> peut suffire.</p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-zinc-600">Tout est prêt — tu vas voir ta trajectoire.</p>
                </Panel>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                ← Retour
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="rounded-2xl px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)] transition hover:opacity-95"
                  style={{ background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 60%, #60a5fa 100%)" }}
                >
                  Continuer →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-2xl px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 55%, #60a5fa 100%)" }}
                >
                  {isGenerating ? "Ta trajectoire se calcule…" : "Voir ma trajectoire →"}
                </button>
              )}
            </div>

            <p className="mt-5 text-center text-xs text-zinc-400">Simulation pédagogique. Pas un conseil financier.</p>
          </>
        )}

      </div>
    </main>
  );
}