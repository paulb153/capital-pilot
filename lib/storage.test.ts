import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  migrateGoalV1ToV2, GOAL_V1_KEY, GOALS_V2_KEY,
  loadPatrimoine, savePatrimoineEntry, patrimoineDelta, patrimoinePerf,
  PATRIMOINE_V1_KEY,
  type PatrimoineEntry,
} from "./storage";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("migrateGoalV1ToV2", () => {
  let ls: ReturnType<typeof makeLocalStorage>;

  beforeEach(() => {
    ls = makeLocalStorage();
    vi.stubGlobal("localStorage", ls);
  });

  it("no-op when goal:v1 is absent", () => {
    migrateGoalV1ToV2();
    expect(ls.getItem(GOALS_V2_KEY)).toBeNull();
  });

  it("migre goal:v1 valide vers goals:v2 quand goals:v2 est absent", () => {
    ls.setItem(GOAL_V1_KEY, JSON.stringify({
      label: "Retraite anticipée",
      targetAmount: 500_000,
      targetYear: 2045,
      supportLabel: "PEA / ETF",
      ratePct: 7,
      createdAt: 1_700_000_000_000,
    }));

    migrateGoalV1ToV2();

    // goal:v1 supprimé
    expect(ls.getItem(GOAL_V1_KEY)).toBeNull();

    // goals:v2 contient l'objectif migré
    const store = JSON.parse(ls.getItem(GOALS_V2_KEY)!);
    expect(store.lifeObjectives).toHaveLength(1);
    const obj = store.lifeObjectives[0];
    expect(obj.label).toBe("Retraite anticipée");
    expect(obj.targetAmount).toBe(500_000);
    expect(obj.targetYear).toBe(2045);
    expect(obj.emoji).toBe("🎯");
    expect(obj.allocatedMonthly).toBe(0);
    expect(obj.completed).toBe(false);
    expect(obj.id).toMatch(/^migrated-/);
  });

  it("ne crée pas de doublon si label+année existent déjà dans goals:v2", () => {
    const existingStore = {
      immediateProgress: {},
      lifeObjectives: [{
        id: "existing-1",
        label: "Retraite anticipée",
        emoji: "🏖️",
        targetAmount: 500_000,
        targetYear: 2045,
        supportLabel: "PEA / ETF",
        ratePct: 7,
        allocatedMonthly: 200,
        createdAt: 1_699_000_000_000,
        completed: false,
      }],
      celebratedIds: [],
    };
    ls.setItem(GOALS_V2_KEY, JSON.stringify(existingStore));
    ls.setItem(GOAL_V1_KEY, JSON.stringify({
      label: "Retraite anticipée",
      targetAmount: 500_000,
      targetYear: 2045,
      supportLabel: "PEA / ETF",
      ratePct: 7,
      createdAt: 1_700_000_000_000,
    }));

    migrateGoalV1ToV2();

    // goal:v1 supprimé (dédupliqué)
    expect(ls.getItem(GOAL_V1_KEY)).toBeNull();

    // goals:v2 toujours 1 seul objectif — pas de doublon
    const store = JSON.parse(ls.getItem(GOALS_V2_KEY)!);
    expect(store.lifeObjectives).toHaveLength(1);
    expect(store.lifeObjectives[0].id).toBe("existing-1");
    expect(store.lifeObjectives[0].emoji).toBe("🏖️"); // champs préservés
    expect(store.lifeObjectives[0].allocatedMonthly).toBe(200);
  });

  it("no-op silencieux si goal:v1 a un JSON invalide", () => {
    ls.setItem(GOAL_V1_KEY, "{ invalid json }}}");

    expect(() => migrateGoalV1ToV2()).not.toThrow();
    expect(ls.getItem(GOALS_V2_KEY)).toBeNull();
  });

  it("supprime goal:v1 silencieusement si les champs obligatoires sont absents", () => {
    ls.setItem(GOAL_V1_KEY, JSON.stringify({ label: "", targetAmount: 0, targetYear: 0 }));

    migrateGoalV1ToV2();

    expect(ls.getItem(GOAL_V1_KEY)).toBeNull();
    expect(ls.getItem(GOALS_V2_KEY)).toBeNull();
  });
});

// ─── patrimoine:v1 ───────────────────────────────────────────────────────────

describe("patrimoine:v1", () => {
  let ls: ReturnType<typeof makeLocalStorage>;

  beforeEach(() => {
    ls = makeLocalStorage();
    vi.stubGlobal("localStorage", ls);
  });

  const makeEntry = (month: string, total: number, contributions?: number): PatrimoineEntry => ({
    month,
    valuations: { pea: total },
    totalValue: total,
    ...(contributions !== undefined ? { contributions } : {}),
    createdAt: Date.now(),
  });

  it("loadPatrimoine — clé absente → { entries: [] }", () => {
    expect(loadPatrimoine()).toEqual({ entries: [] });
  });

  it("loadPatrimoine — JSON invalide → { entries: [] }", () => {
    ls.setItem(PATRIMOINE_V1_KEY, "{ bad json");
    expect(loadPatrimoine()).toEqual({ entries: [] });
  });

  it("loadPatrimoine — entries n'est pas un tableau → { entries: [] }", () => {
    ls.setItem(PATRIMOINE_V1_KEY, JSON.stringify({ entries: "not-an-array" }));
    expect(loadPatrimoine()).toEqual({ entries: [] });
  });

  it("savePatrimoineEntry — insère une nouvelle entrée", () => {
    const entry = makeEntry("2026-05", 10_000, 500);
    savePatrimoineEntry(entry);
    const store = loadPatrimoine();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].month).toBe("2026-05");
    expect(store.entries[0].totalValue).toBe(10_000);
  });

  it("savePatrimoineEntry — upsert même mois remplace l'entrée", () => {
    savePatrimoineEntry(makeEntry("2026-05", 10_000, 500));
    savePatrimoineEntry(makeEntry("2026-05", 12_000, 600));
    const store = loadPatrimoine();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].totalValue).toBe(12_000);
    expect(store.entries[0].contributions).toBe(600);
  });

  it("savePatrimoineEntry — entrées triées ASC par mois", () => {
    savePatrimoineEntry(makeEntry("2026-07", 30_000));
    savePatrimoineEntry(makeEntry("2026-05", 10_000));
    savePatrimoineEntry(makeEntry("2026-06", 20_000));
    const store = loadPatrimoine();
    expect(store.entries.map((e) => e.month)).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  it("patrimoineDelta — moins de 2 entrées → null", () => {
    expect(patrimoineDelta([])).toBeNull();
    expect(patrimoineDelta([makeEntry("2026-05", 10_000)])).toBeNull();
  });

  it("patrimoineDelta — 2 entrées → différence correcte", () => {
    const entries = [makeEntry("2026-05", 10_000), makeEntry("2026-06", 10_700)];
    expect(patrimoineDelta(entries)).toBe(700);
  });

  it("patrimoinePerf — firstValue = 0 → null", () => {
    expect(patrimoinePerf(0, 10_000)).toBeNull();
  });

  it("patrimoinePerf — calcul correct", () => {
    expect(patrimoinePerf(10_000, 11_000)).toBeCloseTo(10, 5);
  });

  it("rétrocompat — entrée sans champ contributions charge correctement", () => {
    // Simule une entrée sauvegardée avant l'ajout de contributions
    const oldEntry = { month: "2026-01", valuations: { pea: 5_000 }, totalValue: 5_000, createdAt: 1_700_000_000 };
    ls.setItem(PATRIMOINE_V1_KEY, JSON.stringify({ entries: [oldEntry] }));
    const store = loadPatrimoine();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].contributions).toBeUndefined();
    expect(store.entries[0].totalValue).toBe(5_000);
  });
});
