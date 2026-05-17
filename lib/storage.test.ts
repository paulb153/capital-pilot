import { describe, it, expect, beforeEach, vi } from "vitest";
import { migrateGoalV1ToV2, GOAL_V1_KEY, GOALS_V2_KEY } from "./storage";

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
