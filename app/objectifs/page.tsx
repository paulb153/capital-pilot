"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { migrateGoalV1ToV2, loadRaw, GOALS_V2_KEY } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { isMigrationComplete, readDiagnosticFromSupabase, type ObjectivesRow } from "@/lib/sync";

// ── Types ──────────────────────────────────────────────────────────────────

type Loan = { id: string; label: string; monthlyPayment: number; remainingCapital: number; ratePct: number; remainingYears: number };
type ExtraAccount = { id: string; type: string; amount: number; ratePct: number };
type Payload = {
  salary: number; otherIncome: number; housing: number; food: number;
  transport: number; leisure: number; subscriptions: number; misc: number;
  checkingAmount: number; livretAAmount: number; livretARatePct: number;
  extraAccounts: ExtraAccount[]; safetyMonths: 3 | 4 | 5 | 6;
  savingsMonthly: number; investmentMonthly: number; createdAt: number;
  age?: number; electricity?: number; loans?: Loan[]; recommendedHorizon?: number;
  hasInvestedCapital?: boolean; investedCapitalTotal?: number;
};

type ImmediateObjective = {
  id: string;
  label: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  priority: 1 | 2 | 3 | 4;
  category: "safety" | "debt" | "savings" | "investment";
  completed: boolean;
};

type LifeObjective = {
  id: string;
  label: string;
  emoji: string;
  targetAmount: number;
  targetYear: number;
  supportLabel: string;
  ratePct: number;
  allocatedMonthly: number;
  createdAt: number;
  completed: boolean;
};

type ObjectivesStore = {
  immediateProgress: Record<string, number>;
  lifeObjectives: LifeObjective[];
  celebratedIds: string[];
};

type MonthEntry = { month: string; invested: number; cumulative: number; scoreAtMonth: number };

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

function readStoreFromLocalStorage(): ObjectivesStore {
  try {
    const raw = localStorage.getItem(GOALS_V2_KEY);
    if (!raw) return { immediateProgress: {}, lifeObjectives: [], celebratedIds: [] };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { immediateProgress: {}, lifeObjectives: [], celebratedIds: [] };
    }
    return {
      immediateProgress: (
        parsed.immediateProgress != null &&
        typeof parsed.immediateProgress === "object" &&
        !Array.isArray(parsed.immediateProgress)
      ) ? parsed.immediateProgress as Record<string, number> : {},
      lifeObjectives: Array.isArray(parsed.lifeObjectives)
        ? parsed.lifeObjectives as LifeObjective[]
        : [],
      celebratedIds: Array.isArray(parsed.celebratedIds)
        ? parsed.celebratedIds as string[]
        : [],
    };
  } catch {
    return { immediateProgress: {}, lifeObjectives: [], celebratedIds: [] };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ObjectifsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [store, setStore] = useState<ObjectivesStore>({
    immediateProgress: {},
    lifeObjectives: [],
    celebratedIds: [],
  });
  const [history, setHistory] = useState<MonthEntry[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectedUserId, setConnectedUserId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [showCelebration, setShowCelebration] = useState<ImmediateObjective | null>(null);
  const [newObj, setNewObj] = useState({
    label: "", emoji: "🎯", targetAmount: 0,
    targetYear: new Date().getFullYear() + 5,
    supportLabel: "PEA / ETF", ratePct: 7, allocatedMonthly: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      migrateGoalV1ToV2();

      try {
        const rawH = localStorage.getItem("capitalpilot:history:v1");
        if (rawH) setHistory(JSON.parse(rawH));
      } catch {}

      try {
        const rawP = localStorage.getItem("capitalpilot:premium");
        setIsPremium(rawP === "true");
      } catch {}

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (user) {
        setConnectedUserId(user.id);

        // Lecture du diagnostic depuis Supabase (inclut retry 1 s post-OAuth)
        const diagResult = await readDiagnosticFromSupabase(supabase, user.id);
        if (cancelled) return;
        if (diagResult.status === "ok") {
          setData(diagResult.payload as Payload);
        } else if (diagResult.status === "local") {
          const raw = loadRaw();
          if (raw && typeof raw === "object") setData(raw as Payload);
        }
        // "empty" : pas encore de diagnostic → data reste null

        const doQuery = () =>
          supabase
            .from("objectives")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1);

        let { data: rows, error } = await doQuery();

        if (cancelled) return;

        // 0 lignes au premier essai : possible faux-vide si la session n'est
        // pas encore committée dans le client PostgREST juste après login OAuth.
        // Retry unique après 1 s. Si encore vide, on passe à la logique marqueur.
        if (!error && (!rows || rows.length === 0)) {
          await new Promise<void>(r => setTimeout(r, 1_000));
          if (cancelled) return;
          ({ data: rows, error } = await doQuery());
          if (cancelled) return;
        }

        if (error) {
          console.error("[objectifs] Erreur lecture Supabase :", error);
          setStore(readStoreFromLocalStorage());
        } else if (rows && rows.length > 0) {
          const d = (rows[0] as ObjectivesRow).data;
          setStore({
            immediateProgress: (
              d.immediateProgress != null &&
              typeof d.immediateProgress === "object" &&
              !Array.isArray(d.immediateProgress)
            ) ? d.immediateProgress as Record<string, number> : {},
            lifeObjectives: Array.isArray(d.lifeObjectives)
              ? d.lifeObjectives as LifeObjective[]
              : [],
            celebratedIds: Array.isArray(d.celebratedIds)
              ? d.celebratedIds as string[]
              : [],
          });
        } else if (isMigrationComplete(user.id)) {
          // Supabase vide confirmé + marqueur présent → le vide est une vérité
        } else {
          setStore(readStoreFromLocalStorage());
        }
      } else {
        const raw = loadRaw();
        if (raw && typeof raw === "object") setData(raw as Payload);
        setStore(readStoreFromLocalStorage());
      }

      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    const income = Math.max(0, data.salary + data.otherIncome);
    const loans = data.loans ?? [];
    const loanPayments = loans.reduce((s, l) => s + l.monthlyPayment, 0);
    const expenses = Math.max(0, data.housing + data.food + data.transport +
      data.leisure + data.subscriptions + data.misc + (data.electricity ?? 0) + loanPayments);
    const margin = Math.max(0, income - expenses);
    const monthlyCurrent = Math.min(data.savingsMonthly + data.investmentMonthly, margin);
    const additionalInvestable = Math.max(0, margin - monthlyCurrent);
    const checkingAmount = Math.max(0, data.checkingAmount);
    const livretAAmount = Math.max(0, data.livretAAmount);
    const safetyTarget = expenses * data.safetyMonths;
    const nonInvestedTotal = checkingAmount + livretAAmount +
      (data.extraAccounts ?? []).reduce((s, a) => s + a.amount, 0);
    const safetyGap = Math.max(0, safetyTarget - nonInvestedTotal);
    const checkingBuffer = expenses;
    const excessInChecking = Math.max(0, checkingAmount - checkingBuffer);
    const missingInLivretA = Math.max(0, safetyTarget - livretAAmount);
    const amountToMoveLivret = Math.min(excessInChecking, missingInLivretA);
    const totalDebt = loans.reduce((s, l) => s + l.remainingCapital, 0);
    const cumulativeInvested = history.reduce((s, e) => s + e.invested, 0);

    const immediateObjectives: ImmediateObjective[] = [];

    if (safetyGap > 0) {
      immediateObjectives.push({
        id: "safety",
        label: "Constituer ton matelas de sécurité",
        description: `Il te manque ${euro(safetyGap)} pour couvrir ${data.safetyMonths} mois de dépenses. C'est la priorité absolue avant tout investissement.`,
        targetAmount: safetyGap,
        currentAmount: Math.min(store.immediateProgress["safety"] ?? 0, safetyGap),
        priority: 1,
        category: "safety",
        completed: (store.immediateProgress["safety"] ?? 0) >= safetyGap,
      });
    }

    if (amountToMoveLivret > 200) {
      immediateObjectives.push({
        id: "livret",
        label: "Basculer ton épargne sur le Livret A",
        description: `Tu as ${euro(checkingAmount)} sur ton compte courant à 0%. Bascule ${euro(amountToMoveLivret)} sur ton Livret A à 1,5% — c'est gratuit et immédiat.`,
        targetAmount: amountToMoveLivret,
        currentAmount: Math.min(store.immediateProgress["livret"] ?? 0, amountToMoveLivret),
        priority: 2,
        category: "savings",
        completed: (store.immediateProgress["livret"] ?? 0) >= amountToMoveLivret,
      });
    }

    if (totalDebt > 0) {
      immediateObjectives.push({
        id: "debt",
        label: "Rembourser tes dettes",
        description: `Tu as ${euro(totalDebt)} de dettes en cours. Chaque euro remboursé est un rendement garanti égal au taux de ton crédit.`,
        targetAmount: totalDebt,
        currentAmount: Math.min(store.immediateProgress["debt"] ?? 0, totalDebt),
        priority: 3,
        category: "debt",
        completed: (store.immediateProgress["debt"] ?? 0) >= totalDebt,
      });
    }

    if (additionalInvestable > 50) {
      immediateObjectives.push({
        id: "invest",
        label: "Investir ta marge disponible",
        description: `Tu as ${euro(additionalInvestable)}/mois non investis. Mets-les au travail — chaque mois de retard a un coût sur le long terme.`,
        targetAmount: additionalInvestable * 12,
        currentAmount: Math.min(store.immediateProgress["invest"] ?? 0, additionalInvestable * 12),
        priority: 4,
        category: "investment",
        completed: (store.immediateProgress["invest"] ?? 0) >= additionalInvestable * 12,
      });
    }

    immediateObjectives.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.priority - b.priority;
    });

    const totalImmediate = immediateObjectives.length;
    const completedImmediate = immediateObjectives.filter(o => o.completed).length;
    const activeLifeObjectives = store.lifeObjectives.filter(o => !o.completed);

    const today = new Date();

    const lifeObjectivesWithProgress = store.lifeObjectives.map(obj => {
      const targetDate = new Date(obj.targetYear, 0, 1);
      const yearsRemaining = Math.max(0,
        (targetDate.getFullYear() - today.getFullYear()) +
        (targetDate.getMonth() - today.getMonth()) / 12
      );
      const rate = (obj.ratePct ?? 7) / 100;
      const projected = futureValue(
        cumulativeInvested * (obj.allocatedMonthly / Math.max(1, margin)),
        obj.allocatedMonthly,
        rate,
        yearsRemaining
      );
      const progressPct = obj.targetAmount > 0
        ? Math.min(100, (projected / obj.targetAmount) * 100)
        : 0;
      const monthlyNeeded = (() => {
        const months = Math.max(1, Math.round(yearsRemaining * 12));
        const r = rate / 12;
        if (r === 0) return obj.targetAmount / months;
        return obj.targetAmount * r / (Math.pow(1 + r, months) - 1);
      })();
      const onTrack = obj.allocatedMonthly >= monthlyNeeded * 0.9;
      return { ...obj, projected, progressPct, monthlyNeeded, onTrack, yearsRemaining };
    });

    return {
      income, expenses, margin, monthlyCurrent, additionalInvestable,
      safetyGap, amountToMoveLivret, totalDebt, cumulativeInvested,
      immediateObjectives, totalImmediate, completedImmediate,
      activeLifeObjectives, lifeObjectivesWithProgress,
    };
  }, [data, store, history]);

  async function saveStore(s: ObjectivesStore): Promise<boolean> {
    if (connectedUserId) {
      const supabase = createClient();
      const { error } = await supabase
        .from("objectives")
        .upsert({ user_id: connectedUserId, data: s }, { onConflict: "user_id" });

      if (error) {
        console.error("[objectifs] Erreur Supabase :", error);
        return false;
      }
    }

    localStorage.setItem(GOALS_V2_KEY, JSON.stringify(s));
    return true;
  }

  async function updateImmediateProgress(id: string, amount: number) {
    const obj = computed?.immediateObjectives.find(o => o.id === id);
    if (!obj) return;
    const newProgress = Math.min(obj.targetAmount, Math.max(0, amount));
    const wasCompleted = obj.completed;
    const newStore = {
      ...store,
      immediateProgress: { ...store.immediateProgress, [id]: newProgress },
    };
    const ok = await saveStore(newStore);
    if (!ok) { setSaveError(true); setTimeout(() => setSaveError(false), 3000); return; }
    setStore(newStore);
    if (!wasCompleted && newProgress >= obj.targetAmount) {
      setShowCelebration({ ...obj, completed: true });
    }
  }

  async function addLifeObjective() {
    if (!newObj.label || newObj.targetAmount <= 0) return;
    const obj: LifeObjective = {
      id: `life-${Date.now()}`,
      label: newObj.label,
      emoji: newObj.emoji,
      targetAmount: newObj.targetAmount,
      targetYear: newObj.targetYear,
      supportLabel: newObj.supportLabel,
      ratePct: newObj.ratePct,
      allocatedMonthly: newObj.allocatedMonthly,
      createdAt: Date.now(),
      completed: false,
    };
    const newStore = { ...store, lifeObjectives: [...store.lifeObjectives, obj] };
    const ok = await saveStore(newStore);
    if (!ok) { setSaveError(true); setTimeout(() => setSaveError(false), 3000); return; }
    setStore(newStore);
    setShowAddObjective(false);
    setNewObj({
      label: "", emoji: "🎯", targetAmount: 0,
      targetYear: new Date().getFullYear() + 5,
      supportLabel: "PEA / ETF", ratePct: 7, allocatedMonthly: 0,
    });
  }

  async function deleteLifeObjective(id: string) {
    const newStore = {
      ...store,
      lifeObjectives: store.lifeObjectives.filter(o => o.id !== id),
    };
    const ok = await saveStore(newStore);
    if (!ok) { setSaveError(true); setTimeout(() => setSaveError(false), 3000); return; }
    setStore(newStore);
  }

  // suppress unused warning
  void isPremium;

  return (
    <main className="min-h-screen text-zinc-900"
      style={{ background: "linear-gradient(180deg, #F0F6FF 0%, #F8FAFC 30%, #ffffff 100%)" }}>

      {/* ── BANDEAU RÉCAP ── */}
      <div style={{ background: "#0B1F3A" }} className="w-full px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/suivi" className="text-xs text-blue-300/50 hover:text-blue-300/80 transition">
                ← Suivi
              </Link>
              <span className="text-blue-300/20">·</span>
              <span className="text-xs text-blue-300/80 font-medium">Mes objectifs</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white">Mes objectifs</h1>
            <p className="mt-1 text-sm text-blue-200/50">
              Tes missions immédiates et tes caps à long terme.
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-blue-400 animate-spin" aria-hidden="true" />
              <span>Chargement…</span>
            </div>
          )}
          {!loading && computed && (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {computed.completedImmediate}/{computed.totalImmediate}
                </p>
                <p className="text-xs text-blue-300/50 mt-0.5">Missions complétées</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {computed.activeLifeObjectives.length}
                </p>
                <p className="text-xs text-blue-300/50 mt-0.5">Objectifs actifs</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "#34d399" }}>
                  {euro(computed.cumulativeInvested)}
                </p>
                <p className="text-xs text-blue-300/50 mt-0.5">Investi au total</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-24 text-zinc-400">
          <span className="inline-block h-6 w-6 rounded-full border-2 border-zinc-200 border-t-blue-500 animate-spin" aria-hidden="true" />
          <span className="text-sm">Chargement des objectifs…</span>
        </div>
      ) : (
        <div className="w-full px-6 py-8 sm:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">

          {/* ── COLONNE GAUCHE : Missions immédiates ── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Priorités</p>
                <h2 className="mt-1 text-xl font-bold text-zinc-950">Missions immédiates</h2>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-600">
                Générées depuis ton diagnostic
              </span>
            </div>

            {computed?.immediateObjectives.length === 0 ? (
              <div className="rounded-[28px] border-2 border-dashed border-zinc-200 bg-white p-10 text-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
                  <circle cx="24" cy="24" r="20" stroke="#16A34A" strokeWidth="2.5"/>
                  <path d="M15 24L21 30L33 18" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="mt-4 text-base font-semibold text-zinc-800">
                  Toutes tes missions sont complétées
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Tu es sur la bonne voie — concentre-toi sur tes objectifs de vie.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {computed?.immediateObjectives.map((obj) => {
                  const pct = obj.targetAmount > 0
                    ? Math.min(100, (obj.currentAmount / obj.targetAmount) * 100) : 0;
                  const categoryColors = {
                    safety: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", bar: "#f59e0b" },
                    debt: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", bar: "#dc2626" },
                    savings: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", bar: "#2563EB" },
                    investment: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", bar: "#16A34A" },
                  };
                  const colors = categoryColors[obj.category];
                  const categoryLabels = {
                    safety: "Sécurité",
                    debt: "Dette",
                    savings: "Épargne",
                    investment: "Investissement",
                  };

                  return (
                    <div key={obj.id}
                      className={`rounded-[24px] border ${colors.border} ${colors.bg} p-6 transition ${obj.completed ? "opacity-60" : ""}`}>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
                              {categoryLabels[obj.category]}
                            </span>
                            {obj.priority === 1 && !obj.completed && (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-900 text-white">
                                Priorité 1
                              </span>
                            )}
                          </div>
                          <p className={`text-base font-semibold ${obj.completed ? "line-through text-zinc-400" : "text-zinc-950"}`}>
                            {obj.label}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                            {obj.description}
                          </p>
                        </div>
                        {obj.completed && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
                            <path d="M8 12L11 15L16 9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {!obj.completed && (
                        <>
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                              <span>Progression</span>
                              <span className="font-semibold text-zinc-800">
                                {euro(obj.currentAmount)} / {euro(obj.targetAmount)}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/60">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: colors.bar }} />
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <input
                              type="number"
                              placeholder="Montant accompli (€)"
                              className="h-10 flex-1 rounded-2xl border border-white/60 bg-white/80 px-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              id={`input-${obj.id}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`input-${obj.id}`) as HTMLInputElement;
                                updateImmediateProgress(obj.id, Number(input.value));
                                input.value = "";
                              }}
                              className="rounded-2xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                              style={{ backgroundColor: colors.bar }}
                            >
                              Valider
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── COLONNE DROITE : Objectifs de vie ── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Long terme</p>
                <h2 className="mt-1 text-xl font-bold text-zinc-950">Objectifs de vie</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddObjective(true)}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
              >
                + Ajouter
              </button>
            </div>

            {store.lifeObjectives.length === 0 ? (
              <div className="rounded-[28px] border-2 border-dashed border-zinc-200 bg-white p-10 text-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
                  <circle cx="24" cy="24" r="18" stroke="#2563EB" strokeWidth="2"/>
                  <circle cx="24" cy="24" r="10" stroke="#2563EB" strokeWidth="2"/>
                  <circle cx="24" cy="24" r="3" fill="#2563EB"/>
                </svg>
                <p className="mt-4 text-base font-semibold text-zinc-800">
                  Aucun objectif défini
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Ajoute ton premier objectif de vie — apport immobilier, liberté financière, projet personnel.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddObjective(true)}
                  className="mt-5 rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
                >
                  Définir mon premier objectif
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {computed?.lifeObjectivesWithProgress.map((obj) => (
                  <div key={obj.id}
                    className="rounded-[24px] border border-zinc-200/70 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{obj.emoji}</span>
                        <div>
                          <p className="text-base font-semibold text-zinc-950">{obj.label}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {obj.supportLabel} · {obj.ratePct}%/an
                            {obj.supportLabel === "PEA / ETF" && " (estimatif)"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLifeObjective(obj.id)}
                        className="text-zinc-300 hover:text-zinc-500 transition text-lg leading-none"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Objectif</p>
                        <p className="text-sm font-semibold text-zinc-950 mt-1">{euro(obj.targetAmount)}</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Horizon</p>
                        <p className="text-sm font-semibold text-zinc-950 mt-1">{obj.targetYear}</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 p-3 text-center">
                        <p className="text-xs text-zinc-400">Mensuel</p>
                        <p className="text-sm font-semibold mt-1"
                          style={{ color: obj.onTrack ? "#16A34A" : "#f59e0b" }}>
                          {euro(obj.allocatedMonthly)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">Progression projetée</span>
                        <span className="font-semibold text-zinc-800">
                          {obj.progressPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-100">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${obj.progressPct}%`,
                            background: "linear-gradient(90deg, #2563EB, #34d399)"
                          }} />
                      </div>
                    </div>

                    <div className={`mt-4 rounded-2xl px-4 py-3 text-xs font-medium ${
                      obj.onTrack ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {obj.onTrack
                        ? `Tu es en bonne voie — projeté à ${euro(obj.projected)} en ${obj.targetYear}.`
                        : `Il te faudrait ${euro(obj.monthlyNeeded)}/mois pour atteindre cet objectif.`
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      )}

      {/* ── MODAL AJOUT OBJECTIF DE VIE ── */}
      {showAddObjective && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-950">Nouvel objectif</h2>
              <button type="button" onClick={() => setShowAddObjective(false)}
                className="text-zinc-400 hover:text-zinc-700 transition text-xl">✕</button>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Apport immobilier", emoji: "🏠", amount: 30000, year: new Date().getFullYear() + 5 },
                    { label: "Liberté financière", emoji: "🚀", amount: 300000, year: new Date().getFullYear() + 20 },
                    { label: "Voyage", emoji: "✈️", amount: 5000, year: new Date().getFullYear() + 2 },
                    { label: "Voiture cash", emoji: "🚗", amount: 15000, year: new Date().getFullYear() + 4 },
                    { label: "Études enfants", emoji: "🎓", amount: 40000, year: new Date().getFullYear() + 15 },
                    { label: "Projet perso", emoji: "💡", amount: 10000, year: new Date().getFullYear() + 3 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setNewObj(prev => ({
                        ...prev, label: s.label, emoji: s.emoji,
                        targetAmount: s.amount, targetYear: s.year,
                      }))}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 block mb-1.5">
                  Nom de l&apos;objectif
                </label>
                <input
                  type="text"
                  value={newObj.label}
                  onChange={(e) => setNewObj(p => ({ ...p, label: e.target.value }))}
                  placeholder="ex : Apport immobilier, Liberté financière…"
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-zinc-900 block mb-1.5">Montant cible</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newObj.targetAmount || ""}
                      onChange={(e) => setNewObj(p => ({ ...p, targetAmount: Number(e.target.value) }))}
                      placeholder="0"
                      className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 pr-8 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">€</span>
                  </div>
                  {newObj.targetAmount > 0 && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Revenus passifs : {euro((newObj.targetAmount * 0.04) / 12)}/mois
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-900 block mb-1.5">Année cible</label>
                  <input
                    type="number"
                    value={newObj.targetYear}
                    min={new Date().getFullYear() + 1}
                    max={2080}
                    onChange={(e) => setNewObj(p => ({ ...p, targetYear: Number(e.target.value) }))}
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 block mb-1.5">
                  Support d&apos;épargne
                </label>
                <select
                  value={newObj.supportLabel}
                  onChange={(e) => {
                    const rates: Record<string, number> = {
                      "Livret A / LEP": 2,
                      "Assurance vie (fonds euros)": 2.5,
                      "PEA / ETF": 7,
                      "Autre support": newObj.ratePct,
                    };
                    setNewObj(p => ({
                      ...p,
                      supportLabel: e.target.value,
                      ratePct: rates[e.target.value] ?? p.ratePct,
                    }));
                  }}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Livret A / LEP</option>
                  <option>Assurance vie (fonds euros)</option>
                  <option>PEA / ETF</option>
                  <option>Autre support</option>
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Taux annuel :</span>
                  {newObj.supportLabel === "Autre support" ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={newObj.ratePct}
                        min={0} max={30} step={0.1}
                        onChange={(e) => setNewObj(p => ({ ...p, ratePct: Number(e.target.value) }))}
                        className="h-8 w-20 rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-6 text-xs text-zinc-900 outline-none focus:border-blue-300"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">%</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-zinc-700">{newObj.ratePct}%</span>
                  )}
                  {newObj.supportLabel === "PEA / ETF" && (
                    <span className="text-xs text-zinc-400">(estimatif, non garanti)</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900 block mb-1.5">
                  Montant mensuel alloué
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newObj.allocatedMonthly || ""}
                    onChange={(e) => setNewObj(p => ({ ...p, allocatedMonthly: Number(e.target.value) }))}
                    placeholder="0"
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 pr-16 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">€/mois</span>
                </div>
                {computed && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Ta marge disponible : {euro(computed.additionalInvestable)}/mois
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={addLifeObjective}
              disabled={!newObj.label || newObj.targetAmount <= 0}
              className="mt-6 w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #2563EB, #3b82f6)" }}
            >
              Enregistrer cet objectif
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL CÉLÉBRATION ── */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[#0B1F3A] p-10 text-center shadow-2xl">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto">
              <circle cx="36" cy="36" r="32" fill="rgba(52,211,153,0.15)"/>
              <circle cx="36" cy="36" r="24" fill="rgba(52,211,153,0.2)"/>
              <path d="M24 36L32 44L48 28" stroke="#34d399" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-blue-300/50">
              Mission accomplie
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {showCelebration.label}
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: "#34d399" }}>
              {euro(showCelebration.targetAmount)}
            </p>
            <p className="mt-3 text-sm text-blue-200/60">
              Tu as atteint cet objectif. C&apos;est une vraie étape dans ta trajectoire.
            </p>
            <button
              type="button"
              onClick={() => setShowCelebration(null)}
              className="mt-6 w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="w-full px-6 py-8 sm:px-10 border-t border-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/suivi"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              ← Mon suivi
            </Link>
            <Link href="/resultats"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
              Voir mon diagnostic
            </Link>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm">
            Les projections sont des simulations basées sur des hypothèses simplifiées. Non garanti.
          </p>
        </div>
      </div>

      {saveError && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          <span className="text-red-600 font-bold">✕</span>
          Sauvegarde échouée — vérifie ta connexion et réessaie.
        </div>
      )}

    </main>
  );
}
