# Audit CapitalPilot — État des lieux
> Généré le 2026-05-13. Lecture seule — aucun fichier modifié.

---

## Phase 1 — Inventaire

### Arborescence complète

```
capital-pilot/
├── app/
│   ├── apprendre/page.tsx
│   ├── bilan/page.tsx
│   ├── diagnostic/page.tsx
│   ├── objectifs/page.tsx
│   ├── premium/page.tsx
│   ├── resultats/page.tsx
│   ├── suivi/page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── NavBar.tsx
├── diagnostic/                  ← dossier vide parasite à la racine (pas dans app/)
├── lib/
│   ├── finance.ts
│   ├── finance.test.ts
│   └── storage.ts
├── public/                      ← assets SVG Next.js par défaut, non utilisés
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

### Pages (`app/**/page.tsx`)

| Route | Fichier | Rôle |
|---|---|---|
| `/` | `app/page.tsx` | Hub de navigation — affiche les KPIs si diagnostic existant, sinon CTA vers le diagnostic |
| `/diagnostic` | `app/diagnostic/page.tsx` | Formulaire d'onboarding 5 étapes (revenus, dépenses, épargne, investissement, horizon) |
| `/resultats` | `app/resultats/page.tsx` | Tableau de bord financier complet : scores, projections, graphiques, recommandations |
| `/suivi` | `app/suivi/page.tsx` | Validation mensuelle, streak, jalons, historique (premium), objectif de vie (premium) |
| `/objectifs` | `app/objectifs/page.tsx` | Définition et suivi d'objectifs de vie chiffrés (apport, retraite…) |
| `/bilan` | `app/bilan/page.tsx` | Rapport mensuel automatique généré depuis localStorage |
| `/apprendre` | `app/apprendre/page.tsx` | 7 modules pédagogiques (Livret A, PEA, CTO, ETF, AV, Immobilier, PER) avec pros/cons |
| `/premium` | `app/premium/page.tsx` | Page de conversion "Trajectoire Active" — waitlist + projections personnalisées |

### Modules

| Fichier | Rôle |
|---|---|
| `lib/finance.ts` | Fonctions pures de calcul financier : `futureValue`, `computeIncome`, `computeCapital`, `computeLiquidity`, `computeProjection`, `computeScores`, `computeDiagnostic`, `computeNextStep` |
| `lib/finance.test.ts` | Suite Vitest — 30 tests couvrant `futureValue`, `classifyHousing`, `classifyGeneric`, `computeIncome`, `computeScores`, `computeNextStep` |
| `lib/storage.ts` | Accès centralisé au localStorage : clés exportées, `savePayload()`, `loadRaw()` avec vérification de version de schéma |
| `components/NavBar.tsx` | Barre de navigation responsive — sidebar gauche (desktop) + bottom bar (mobile), 7 items |

Pas de dossier `hooks/`.

### package.json

```
Next.js   16.1.6
React     19.2.3
TypeScript 5.x
Tailwind  4.x
Vitest    4.1.2
```

Scripts disponibles : `dev`, `build`, `start`, `lint`, `test`

---

## Phase 2 — État de fonctionnement

### Build

```
✅ Build réussi — 0 erreur TypeScript, 0 erreur de compilation
```

9 routes générées en statique (SSG) :

```
○ /           ○ /apprendre    ○ /bilan
○ /diagnostic ○ /objectifs    ○ /premium
○ /resultats  ○ /suivi        ○ /_not-found
```

### Lint — 9 erreurs, 2 warnings

**Erreurs :**

| Fichier | Ligne | Règle | Description |
|---|---|---|---|
| `app/apprendre/page.tsx` | 809 | `react/no-unescaped-entities` | `'` non échappé dans le JSX |
| `app/bilan/page.tsx` | 82 | `react-hooks/set-state-in-effect` | `setState` synchrone dans `useEffect` |
| `app/objectifs/page.tsx` | 95 | `react-hooks/set-state-in-effect` | `setState` synchrone dans `useEffect` |
| `app/page.tsx` | 71 | `react-hooks/set-state-in-effect` | `setState` synchrone dans `useEffect` |
| `app/page.tsx` | 187 | `react/no-unescaped-entities` | `'` non échappé dans le JSX |
| `app/premium/page.tsx` | 77 | `react-hooks/set-state-in-effect` | `setState` synchrone dans `useEffect` |
| `app/resultats/page.tsx` | 275 | `react-hooks/immutability` | `cumulative +=` après le rendu (dans PieChart) |
| `app/resultats/page.tsx` | 986 | `react/no-unescaped-entities` | `'` non échappé dans le JSX |
| `app/suivi/page.tsx` | 326 | `react-hooks/set-state-in-effect` | `setState` synchrone dans `useEffect` |

**Warnings :**

| Fichier | Ligne | Règle | Description |
|---|---|---|---|
| `app/suivi/page.tsx` | 546 | `react-hooks/exhaustive-deps` | `horizon` dans les deps du `useMemo` mais jamais lu dans le corps |
| `lib/finance.ts` | 368 | `@typescript-eslint/no-unused-vars` | `safetyTarget` destructuré dans `computeDiagnostic` mais jamais utilisé dans le corps de la fonction |

### TODO / FIXME / HACK / XXX

**Aucun** dans tout le codebase.

### console.log

**Aucun** dans tout le codebase.

### Tests

```
29 / 30 passent.
1 échec : classifyHousing — attend "Très excessif" pour la valeur 45, reçoit "Critique"
```

La fonction `classifyHousing` saute directement de `"Excessif"` (p < 45) à `"Critique"` (p ≥ 45),
sans palier `"Très excessif"` que le type `Status` et le test attendent pourtant.
Le test et la fonction sont incohérents — l'un des deux est faux.

---

## Phase 3 — Historique récent

### git log

```
b6f1de2  10 weeks ago  premiere version
```

**Un seul commit dans toute l'histoire du projet.**

### Changements non commités

**Fichiers modifiés (tracked) :**
```
M  app/layout.tsx
M  app/page.tsx
M  app/resultats/page.tsx
M  package-lock.json
M  package.json
```

**Fichiers non trackés (jamais commités) :**
```
??  app/apprendre/
??  app/bilan/
??  app/diagnostic/
??  app/objectifs/
??  app/premium/
??  app/suivi/
??  components/
??  lib/
??  vitest.config.ts
```

La quasi-totalité du code fonctionnel n'a jamais été commité.
En cas de corruption du disque ou de reset accidentel, tout serait perdu.

### Branches

Une seule branche : `main` (en sync avec `origin/main`).

### Sur quoi travaillais-tu avant d'arrêter ?

Le dernier travail en date porte sur la distinction **épargne garantie / investissement marché**
dans le parcours diagnostic. Les trois fichiers concernés (`app/diagnostic/page.tsx`,
`app/resultats/page.tsx`, `app/suivi/page.tsx`) ont été mis à jour pour accepter deux champs
séparés (`savingsMonthly`, `investmentMonthly`) et projeter les deux enveloppes à des taux
différents (taux Livret A vs taux marché). Ce chantier est partiellement terminé —
voir Phase 5 pour les points incomplets.

---

## Phase 4 — Audit qualité ciblé

### Logique financière (`lib/finance.ts`)

**Tests existants :** `futureValue`, `classifyHousing`, `classifyGeneric`, `computeIncome`,
`computeScores`, `computeNextStep` — couverts.

**Fonctions sans tests :** `computeCapital`, `computeLiquidity`, `computeProjection`,
`computeDiagnostic`. Ce sont pourtant les fonctions les plus complexes et les plus utilisées.

**Cas limites :**
- `futureValue` : valeurs négatives clampées à 0 ✅, années = 0 retourne l'initial ✅, pas de division par zéro (boucle) ✅
- `computeIncome` : income = 0 → margin = 0 ✅, expenses > income → margin = 0 ✅
- `computeScores` : income = 0 → rates = 0 ✅, safetyTarget = 0 → ratio = 0 ✅
- `computeDiagnostic` : le paramètre `safetyTarget` est **destructuré mais jamais utilisé** dans le corps de la fonction (lint warning ligne 368). Probablement un oubli lors d'une refacto — la fonction calcule `excessInChecking` à partir de `checking0` et `expenses` uniquement, sans tenir compte du matelas de sécurité pour décider combien transférer.
- `classifyHousing` : incohérence entre le type `Status` (qui inclut `"Très excessif"`), les tests (qui l'attendent) et la fonction (qui ne le retourne jamais).

**Désynchronisation lib / pages :** `computeIncome` dans `lib/finance.ts` utilise toujours
les anciens champs `investMonthly` / `monthlyInvestment`. La distinction
`savingsMonthly` / `investmentMonthly` a été ajoutée dans les pages mais pas dans
la fonction de la lib — les deux approches coexistent.

### Cohérence du design

- `rounded-[28px]` + `shadow-[0_20px_60px_rgba(15,23,42,0.08)]` apparaît **67+ fois** dans le code.
  Un composant `<Card>` permettrait d'en finir avec cette répétition.
- Chaque page redéfinit ses propres constantes de couleur (`ACCENT`, `SUCCESS`, `NAVY`…)
  avec des valeurs identiques ou proches — pas de fichier de tokens centralisé.
- Les SVG d'icônes sont inline partout (NavBar, pages, tiles). Candidat à une lib d'icônes
  interne minimale.
- La fonction `euro()` (formateur de devise) est **dupliquée** dans au moins 5 fichiers.
  Elle devrait être dans `lib/` et importée.

### localStorage

**Clés exportées dans `storage.ts` :** `capitalpilot:v5`, `capitalpilot:tracking:v1`,
`capitalpilot:waitlist`

**Clés utilisées en magic string dans les pages :**

| Clé | Fichiers |
|---|---|
| `capitalpilot:goal:v1` | `app/suivi/page.tsx`, `app/objectifs/page.tsx` |
| `capitalpilot:goals:v2` | `app/objectifs/page.tsx` |
| `capitalpilot:history:v1` | `app/suivi/page.tsx`, `app/bilan/page.tsx`, `app/page.tsx` |
| `capitalpilot:premium` | `app/suivi/page.tsx`, `app/premium/page.tsx`, `app/bilan/page.tsx` |

**Robustesse :**
- `savePayload()` attrape `QuotaExceededError` ✅
- `loadRaw()` vérifie `schemaVersion` et efface les données obsolètes ✅
- Mais tous les `localStorage.getItem` directs dans les pages ne passent pas par `loadRaw()` —
  ils n'ont donc ni vérification de version ni protection contre les données corrompues.
  Un changement de format de `capitalpilot:goal:v1` ou `capitalpilot:history:v1` casserait
  silencieusement les pages concernées.

### Accessibilité

- **Labels sans `htmlFor`** : dans `app/diagnostic/page.tsx`, tous les `<label>` enveloppent
  leur `<input>` sans association `id`/`htmlFor` explicite. Fonctionnel mais non conforme WCAG.
- **Icônes SVG** : dans `components/NavBar.tsx`, les SVG n'ont pas `aria-hidden="true"` — les
  lecteurs d'écran les liront comme du contenu vide.
- **Contraste** : les textes `text-zinc-400` sur fond blanc sont proches de la limite AA (4.5:1).
  Non vérifié automatiquement, à confirmer avec un outil dédié.
- **Navigation clavier** : les `<button>` et `<Link>` sont accessibles nativement. Les modales
  (suivi/objectifs) ne trappent pas le focus — Tab sort de la modale.

### SEO / Métadonnées

Seul `app/layout.tsx` déclare des metadata (title générique + description générique).
Aucune page individuelle n'a de `export const metadata` — toutes héritent du layout.

---

## Phase 5 — Synthèse et reprise

### 1. Ce qui est fini et fonctionne

1. **Formulaire de diagnostic (5 étapes)** — collecte revenus, dépenses, épargne, patrimoine,
   horizon. Build propre, rendu statique.
2. **Page résultats** — scores (sécurité, flexibilité, ambition), projections long terme,
   graphiques animés, recommandations d'allocation. La distinction épargne/investissement y est active.
3. **NavBar responsive** — sidebar desktop + bottom bar mobile, 7 items, état actif.
4. **Page Apprendre** — 7 modules avec pros/cons, expand/collapse, insight "En mieux" Livret A.
5. **Suite de tests** — 30 tests dans `lib/finance.test.ts`, 29 passent, 1 échec connu.

### 2. Ce qui est en cours / incomplet

| Quoi | Où |
|---|---|
| `computeIncome` ne connaît pas `savingsMonthly`/`investmentMonthly` | `lib/finance.ts:66-98` |
| `safetyTarget` ignoré dans `computeDiagnostic` (param destructuré, jamais lu) | `lib/finance.ts:368` |
| Test `classifyHousing` échoue — incohérence fonction vs test vs type | `lib/finance.ts:39-44` + `lib/finance.test.ts:61-63` |
| `horizon` dans les deps du useMemo de suivi mais pas lu dans le corps | `app/suivi/page.tsx:546` |
| 4 clés localStorage non centralisées dans `storage.ts` | partout |
| Dossier parasite `./diagnostic/` à la racine | racine du projet |

### 3. Les 3 problèmes les plus urgents

**🔴 1. Rien n'est commité depuis 10 semaines**
Tout le code fonctionnel (pages, composants, lib, tests) n'existe que localement.
Un `rm -rf` accidentel ou un reset git suffit à tout effacer.
Action : `git add -A && git commit -m "..."` immédiatement.

**🟠 2. `classifyHousing` incohérence à trois niveaux**
Le type `Status` déclare `"Très excessif"`, le test l'attend pour p=45,
mais la fonction saute directement à `"Critique"`. L'un des trois est faux.
Si la fonction est juste (pas de palier "Très excessif" pour le logement),
le test doit être corrigé. Si le test est juste, la fonction doit ajouter
le palier à 45-50%. À trancher.

**🟡 3. `computeIncome` désynchronisé des nouvelles données de diagnostic**
La lib ignore les champs `savingsMonthly`/`investmentMonthly` du nouveau schéma —
elle utilise encore `investMonthly`/`monthlyInvestment`. Les pages contournent
cela en calculant `monthlyCurrent` localement. C'est de la dette technique
qui rendra les futures évolutions de la lib fragiles.

### 4. Les 3 meilleurs candidats pour reprendre

**1. Commit (5 min, risque zéro)**
Commiter tout le travail existant. Aucune dépendance, aucun risque, impact maximal
sur la sécurité du projet. Faire ça en premier.

**2. Fix `classifyHousing` + 3 erreurs `unescaped-entities` (30 min, facile)**
Les `unescaped-entities` sont des remplacements mécaniques (`'` → `&apos;`).
Le fix `classifyHousing` est une ligne dans la fonction ou deux mots dans le test.
Cela rend la suite de tests 100% verte et réduit les erreurs lint de 4.

**3. Centraliser les 4 clés localStorage dans `storage.ts` (1h, valeur réelle)**
Ajouter `GOAL_KEY`, `GOALS_KEY`, `HISTORY_KEY`, `PREMIUM_KEY` dans `storage.ts`
et remplacer les magic strings. Pas de changement fonctionnel, mais toute future
migration de schéma devient gérée à un seul endroit.

### 5. Une question

`computeIncome` dans `lib/finance.ts` est utilisée par `app/resultats/page.tsx` mais
**pas** par `app/suivi/page.tsx` ni `app/diagnostic/page.tsx` — ces pages recalculent
`monthlyCurrent` elles-mêmes. Est-ce volontaire (tu veux garder la lib stable pour
ne pas casser resultats) ou est-ce un oubli qu'il faudrait corriger en mettant à jour
`computeIncome` pour accepter les nouveaux champs ?
La réponse change la stratégie : soit on met à jour la lib (cohérence), soit on documente
que les pages calculent en local (isolation).
