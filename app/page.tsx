"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ACCENT = "#2563eb";
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
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
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
  const [investedCapitalTotal, setInvestedCapitalTotal] = useState(0);

  const [investMonthly, setInvestMonthly] = useState(false);
  const [monthlyInvestment, setMonthlyInvestment] = useState(0);

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
    const declaredMonthly = investMonthly ? Math.max(0, monthlyInvestment) : 0;
    const monthlyUsedCap = Math.min(declaredMonthly, margin);

    const monthlyTooHigh = investMonthly && declaredMonthly > margin && margin > 0;

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
    investMonthly,
    monthlyInvestment,
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
      investedCapitalTotal: hasInvestedCapital ? investedCapitalTotal : 0,

      investMonthly,
      monthlyInvestment: investMonthly ? monthlyInvestment : 0,

      createdAt: Date.now(),
    };

    localStorage.setItem("capitalpilot:v5", JSON.stringify(payload));

    setIsGenerating(true);
    setTimeout(() => router.push("/resultats"), 650);
  }

  return (
    <main
      className="min-h-screen text-zinc-900"
      style={{
        background:
          "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(248,250,252,1) 22%, rgba(255,255,255,1) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(132,204,22,0.10),transparent_24%),linear-gradient(135deg,#0f172a_0%,#172554_48%,#0f172a_100%)] p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.05))]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                Diagnostic financier — V5
              </div>

             <div className="mt-5">
  <div className="text-[24px] font-semibold tracking-tight leading-none sm:text-[28px]">
    <span className="text-white">Capital</span>
    <span style={{ color: "#6bb8f0" }}>Pilot</span>
  </div>
</div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Pilote ton capital avec un diagnostic clair et une projection qui donne envie d’agir.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/85 sm:text-base">
                Tu renseignes ta situation actuelle, CapitalPilot analyse ta structure financière,
                estime ce que tu peux investir et te montre l’impact concret de tes décisions.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">Revenus mensuels</p>
                  <p className="mt-1 text-lg font-semibold">{euro(computed.incomeTotal)}</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">Marge actuelle</p>
                  <p className="mt-1 text-lg font-semibold">{euro(computed.margin)}</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-blue-100/70">Cash non investi</p>
                  <p className="mt-1 text-lg font-semibold">{euro(computed.nonInvestedTotal)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 self-stretch">
              <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
                <p className="text-sm font-semibold text-white">Ce que tu obtiens</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50/90">
                    Un diagnostic simple sur ta sécurité, ta flexibilité et ton ambition.
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50/90">
                    Une projection long terme entre situation actuelle et scénario optimisé.
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50/90">
                    Un résultat lisible qui donne tout de suite une direction d’action.
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
                <p className="text-sm font-semibold text-white">Lecture rapide</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs text-blue-100/70">Total dépenses</p>
                    <p className="mt-1 text-xl font-semibold">{euro(computed.expensesTotal)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-xs text-blue-100/70">Investissement retenu</p>
                    <p className="mt-1 text-xl font-semibold">{euro(computed.monthlyUsedCap)}/mois</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Colonne gauche */}
          <div className="grid gap-6">
            <Panel title="1) Revenus" subtitle="La base du diagnostic. Plus cette donnée est juste, plus la projection sera pertinente.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Salaire net mensuel" value={salary} onChange={(n) => setSalary(Math.max(0, n))} suffix="€" />
                <Field label="Autres revenus (optionnel)" value={otherIncome} onChange={(n) => setOtherIncome(Math.max(0, n))} suffix="€" />
              </div>
            </Panel>

            <Panel title="2) Dépenses mensuelles" subtitle="Renseigne tes dépenses par catégorie pour obtenir un diagnostic plus précis.">
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
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Total dépenses</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950">{euro(computed.expensesTotal)}</p>
                </div>
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "rgba(37,99,235,0.18)",
                    background: "linear-gradient(180deg, rgba(239,246,255,0.92) 0%, rgba(255,255,255,0.95) 100%)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Marge mensuelle</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: ACCENT }}>
                    {euro(computed.margin)}
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          {/* Colonne droite */}
          <div className="grid gap-6">
            <Panel title="3) Épargne non investie" subtitle="Le cash et les livrets servent aussi à estimer ta réserve de sécurité.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Compte courant" value={checkingAmount} onChange={(n) => setCheckingAmount(Math.max(0, n))} suffix="€" />
                <Field
                  label="Livret A"
                  value={livretAAmount}
                  onChange={(n) => setLivretAAmount(Math.max(0, n))}
                  suffix="€"
                  hint="Taux actuel : 1,5%"
                />
              </div>

              <label className="mt-5 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={showExtraAccounts}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setShowExtraAccounts(v);
                    if (!v) setExtraAccounts([]);
                  }}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Autre compte à renseigner ?
              </label>

              {showExtraAccounts ? (
                <div className="mt-4 grid gap-4">
                  {extraAccounts.map((acc, idx) => (
                    <div key={acc.id} className="rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900">Compte #{idx + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeExtraAccount(acc.id)}
                          className="text-xs font-semibold text-zinc-500 transition hover:text-zinc-900"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="mt-3 grid gap-4 sm:grid-cols-3">
                        <SmallSelect
                          label="Type"
                          value={acc.type}
                          onChange={(v) => updateExtraAccount(acc.id, { type: v as ExtraAccountType })}
                          options={["LEP", "Livret Jeune", "LDDS", "Autre compte"]}
                        />
                        <Field
                          label="Montant"
                          value={acc.amount}
                          onChange={(n) => updateExtraAccount(acc.id, { amount: Math.max(0, n) })}
                          suffix="€"
                        />
                        <Field
                          label="Taux"
                          value={acc.ratePct}
                          onChange={(n) => updateExtraAccount(acc.id, { ratePct: clamp(n, 0, 20) })}
                          suffix="%"
                          hint="Tu choisis le taux."
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExtraAccount}
                    disabled={extraAccounts.length >= 4}
                    className="w-fit rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Ajouter un compte {extraAccounts.length >= 4 ? "(max 4)" : ""}
                  </button>
                </div>
              ) : null}

              <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-zinc-600">Total non investi</span>
                  <span className="text-xl font-semibold text-zinc-950">{euro(computed.nonInvestedTotal)}</span>
                </div>
              </div>
            </Panel>

            <Panel title="4) Investissement" subtitle="On distingue ici le capital déjà investi et ton éventuelle routine mensuelle.">
              <label className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasInvestedCapital}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setHasInvestedCapital(v);
                    if (!v) setInvestedCapitalTotal(0);
                  }}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                As-tu déjà un capital investi ?
              </label>

              {hasInvestedCapital ? (
                <div className="mt-4">
                  <Field
                    label="Capital total investi (PEA / CTO / AV investie…)"
                    value={investedCapitalTotal}
                    onChange={(n) => setInvestedCapitalTotal(Math.max(0, n))}
                    suffix="€"
                  />
                </div>
              ) : null}

              <label className="mt-5 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={investMonthly}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setInvestMonthly(v);
                    if (!v) setMonthlyInvestment(0);
                  }}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Investis-tu tous les mois ?
              </label>

              {investMonthly ? (
                <div className="mt-4">
                  <Field
                    label="Investissement mensuel actuel"
                    value={monthlyInvestment}
                    onChange={(n) => setMonthlyInvestment(Math.max(0, n))}
                    suffix="€"
                    hint={`Repère : ta marge déclarée est ~${euro(computed.margin)}/mois.`}
                  />
                  {computed.monthlyTooHigh ? (
                    <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                      Attention : tu déclares investir plus que ta marge (revenus - dépenses). Le diagnostic limitera l’investissement pris en compte à ta marge.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Panel>

            <Panel title="5) Épargne de sécurité" subtitle="Le bon niveau dépend surtout de la stabilité de tes revenus et de ton besoin de confort psychologique.">
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6].map((m) => (
                  <Chip key={m} active={safetyMonths === m} onClick={() => setSafetyMonths(m as 3 | 4 | 5 | 6)}>
                    {m} mois
                  </Chip>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/90 p-4">
                <p className="text-sm font-semibold text-zinc-900">Comment choisir ?</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  <span className="font-semibold">Profil sécuritaire</span> : vise plutôt{" "}
                  <span className="font-semibold">6 mois</span>.
                </p>
                <p className="mt-1 text-sm leading-7 text-zinc-700">
                  <span className="font-semibold">Situation stable (CDI)</span> :{" "}
                  <span className="font-semibold">3 mois</span> peut suffire.
                </p>
              </div>
            </Panel>

            <div className="rounded-[28px] border border-zinc-200/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(59,130,246,1) 55%, rgba(78,165,232,1) 100%)",
                }}
              >
                {isGenerating ? "Analyse en cours…" : "Générer mon diagnostic"}
              </button>

              <p className="mt-3 text-center text-xs text-zinc-500">
                Outil pédagogique. Pas un conseil en investissement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}