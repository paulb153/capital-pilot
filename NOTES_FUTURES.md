# Notes futures — CapitalPilot

Tous les sujets ouverts repérés lors de la reprise de projet (mai 2026).
À traiter quand tu auras du temps et de l'envie, pas en urgence.

Quand tu termines un chantier, déplace-le dans `## Fait` en bas avec la date.

---

## 🔴 À trancher (décisions produit en attente)

### 1. Modélisation du Livret A — matelas vs surplus

**Le problème.** Aujourd'hui, l'app traite le solde du Livret A comme un
bloc unique qui croît à ~3% pendant toute la durée de projection.
En réalité, le Livret A a deux rôles :

- **Matelas de sécurité** (3 à 6 mois de dépenses) — argent qui doit
  rester liquide, son rôle est assurantiel, pas de rendement attendu.
- **Surplus** (au-delà du matelas) — argent qui dort à 3% alors qu'il
  pourrait être investi à 5-7% sur du marché. C'est l'occasion ratée
  la plus visible pour beaucoup d'utilisateurs.

**Pourquoi ça compte.** C'est exactement le genre d'insight qui fait
la valeur de CapitalPilot — révéler à l'utilisateur que son argent
travaille mal. Aujourd'hui, l'app ne le révèle pas.

**Trois options à choisir quand on s'y mettra :**

1. **Décomposition automatique dans la projection** — la lib calcule
   `surplus = max(0, livretA0 − safetyTarget)` et projette les deux
   parties à des taux différents. Honnête, mais suppose que l'utilisateur
   va effectivement faire le transfert.

2. **Deux trajectoires côte à côte** — "Scénario actuel" vs "Scénario
   optimisé". L'écart entre les courbes devient le déclencheur d'action.
   Plus pédagogique, plus complexe à afficher. **Préféré a priori.**

3. **Recommandation isolée** — projection inchangée, mais encart séparé
   "Tu as X € qui dorment au-delà de ton matelas, voici ce qu'ils
   pourraient rapporter". Plus simple, garde le diagnostic principal lisible.

**Lien avec l'existant.** `computeDiagnostic` calcule déjà
`excessInChecking` (excédent sur compte courant). C'est exactement la
même logique à étendre au Livret A. Le `safetyTarget` actuellement
mort dans `computeDiagnostic` est peut-être le vestige d'une intention
non terminée sur ce sujet (voir point 3).

**Analyse Cowork.** Voir `analyses/01-livret-a.md`.
Note de contexte : taux Livret A à **1,7 % au 01/08/2026** — à intégrer
dans les projections dès qu'on touche à ce chantier.

---

### 2. `classifyHousing` — incohérence à trois niveaux

**Le problème.** Dans `lib/finance.ts` :
- Le type `Status` déclare le palier `"Très excessif"`
- Le test attend `"Très excessif"` pour un ratio de 45%
- La fonction `classifyHousing` saute directement de `"Excessif"`
  à `"Critique"`, sans passer par `"Très excessif"`

**À trancher.** C'est une question produit : combien de paliers de
gravité veut-on pour la classification du logement ?

- **Garder 4 paliers** ("Sain" → "Tendu" → "Excessif" → "Très excessif"
  → "Critique") : la fonction est cassée, ajouter le palier
- **Simplifier à 3 paliers** ("Sain" → "Tendu" → "Excessif" → "Critique") :
  le type et le test sont cassés, les corriger

**Avis perso.** Sur de la pédagogie financière grand public, trop de
paliers tue le message. "Excessif" puis "Critique" suffit. Pencher
pour la simplification.

**Effort.** 30 minutes max.

---

### 3. `safetyTarget` mort dans `computeDiagnostic`

**Le problème.** Le paramètre `safetyTarget` est destructuré en entrée
de la fonction mais jamais utilisé dans le corps. Détecté par lint
(ligne 368). La fonction calcule `excessInChecking` à partir de
`checking0` et `expenses` uniquement, sans tenir compte du matelas
de sécurité pour décider combien transférer.

**À trancher.**
- Soit c'est un vestige d'une refacto inachevée → supprimer le paramètre
- Soit c'était l'amorce du chantier "matelas vs surplus" (point 1) →
  garder le paramètre et finir le travail

**Effort.** 10 minutes pour décider et supprimer, ou à traiter avec le
chantier 1.

---

## 🟠 Dette technique (refactors qui font du bien)

### 4. Composant `<Card>` partagé

**Le problème.** La combinaison
`rounded-[28px]` + `shadow-[0_20px_60px_rgba(15,23,42,0.08)]`
apparaît 67+ fois dans le code. Toute évolution du look des cartes
demande 67 modifications.

**Solution.** Extraire un composant `<Card>` dans `components/ui/`.
Variantes possibles : `default`, `compact`, `highlighted`.

**Effort.** 1-2h.

---

### 5. Tokens de couleurs centralisés

**Le problème.** Chaque page redéfinit ses propres constantes
(`ACCENT`, `SUCCESS`, `NAVY`…) avec des valeurs identiques ou proches.
Pas de source de vérité.

**Solution.** Un fichier `lib/tokens.ts` avec toutes les couleurs,
ou (mieux) une extension du thème Tailwind dans `tailwind.config.ts`.

**Effort.** 1h.

---

### 6. Fonction `euro()` dupliquée 5 fois

**Le problème.** La fonction de formatage de devise existe en 5
exemplaires dans 5 fichiers différents. Si la logique change
(ex : afficher les centimes pour les petits montants), il faut
modifier 5 endroits.

**Solution.** Une seule version dans `lib/format.ts`, importée partout.

**Effort.** 15 minutes.

---

### 7. Clés localStorage non centralisées

**Le problème.** 4 clés sont utilisées en magic string dans les pages
sans passer par `lib/storage.ts` :
- `capitalpilot:goal:v1`
- `capitalpilot:goals:v2`
- `capitalpilot:history:v1`
- `capitalpilot:premium`

Risque : si on change un format, certaines pages cassent silencieusement.

**Solution.** Ajouter `GOAL_KEY`, `GOALS_KEY`, `HISTORY_KEY`, `PREMIUM_KEY`
dans `lib/storage.ts` et remplacer les magic strings.

**Effort.** 1h.

---

### 8. Tests manquants pour les fonctions complexes

**Le problème.** Les fonctions les plus utilisées et les plus complexes
ne sont pas testées :
- `computeCapital`
- `computeLiquidity`
- `computeProjection`
- `computeDiagnostic`

**Solution.** Ajouter une suite de tests pour chacune, avec cas
nominaux + cas limites.

**Effort.** 2-3h.

---

### 9. Erreurs de lint résiduelles

**Le problème.** Le projet a 9 erreurs et 2 warnings de lint :
- 3× `react/no-unescaped-entities` (caractère `'` non échappé)
- 5× `react-hooks/set-state-in-effect` (setState synchrone dans useEffect)
- 1× `react-hooks/immutability` (mutation après rendu dans PieChart)
- 1× `react-hooks/exhaustive-deps` (deps inutilisée)

**Solution.** Passe de nettoyage dédiée. Les `unescaped-entities` sont
mécaniques (`'` → `&apos;`). Les `set-state-in-effect` demandent une
revue cas par cas.

**Effort.** 1-2h.

---

### 10. Dossier parasite `./diagnostic/` à la racine

**Le problème.** Un dossier vide `diagnostic/` existe à la racine du repo,
en dehors de `app/`. Probablement un résidu d'un `mv` raté.

**Solution.** `rm -rf diagnostic/`

**Effort.** 10 secondes.

---

### Middleware deprecated → proxy

Le warning `"middleware" file convention is deprecated → use "proxy"` est
réapparu au `npm run build` (build du 2026-07-18). Le renommage en
`proxy.ts` est à refaire ou à vérifier — il n'a pas survécu.

---

### Compte de test Supabase à supprimer

Supprimer `paul.bigo@kedgebs.com` dans Supabase Auth → onglet
Authentication > Users. Créé lors des tests d'intégration, ne doit pas
rester en production.

---

## 🟡 Évolutions produit

### 11. Accessibilité — passe complète

**Améliorations identifiées :**
- Labels d'inputs sans `htmlFor`/`id` (formulaire diagnostic)
- SVG d'icônes sans `aria-hidden="true"` (NavBar)
- Contraste limite sur `text-zinc-400` (proche de la limite AA)
- Modales sans focus trap (Tab sort de la modale)

**Effort.** Une demi-journée pour faire les bases. Une journée pour un
audit WCAG sérieux.

---

### 12. SEO / Métadonnées par page

**Le problème.** Seul `layout.tsx` déclare des metadata (génériques).
Aucune page individuelle n'a son propre `export const metadata`.
Conséquence : Google indexe toutes les pages avec le même titre et la
même description.

**Solution.** Ajouter `export const metadata` sur chaque page, avec un
titre et une description spécifiques.

**Effort.** 1h.

---

### 14. Ton éditorial des modules `apprendre`

**Sujet à creuser.** 7 modules existent. À relire avec un œil de
copywriter financier :
- Le ton est-il accessible sans être condescendant ?
- Les exemples chiffrés sont-ils à jour (taux, plafonds 2026) ?
- Y a-t-il des modules manquants prioritaires (PEA-PME, SCPI, crypto…) ?
- L'ordre actuel a-t-il une logique pédagogique ?

À discuter en chat normal.

---

## 🔵 Sujets stratégiques (à traiter à part)

### 15. Conformité AMF

**Sujet sensible.** Un site qui parle d'investissement en France est
soumis à des règles strictes. À vérifier :
- Statut : éducation pure (OK) vs conseil en investissement
  (nécessite le statut CIF — Conseiller en Investissements Financiers,
  agrément ORIAS)
- Mentions obligatoires : avertissement sur les risques, performances
  passées, etc.
- Mentions légales : éditeur, hébergeur, contact, RGPD
- Les modules `apprendre` actuels donnent-ils des "conseils" ou de
  "l'information" ? La frontière est juridique.

**À faire avant tout lancement public.** Ne pas underestimer — l'AMF
sanctionne des sites pour bien moins que ça. Cela couvre : mentions légales
LCEN, page d'avertissement dédiée, et disclaimers DOC-2017-07 sur chaque
écran affichant une projection.

**Analyse Cowork.** Voir `analyses/15-conformite-amf.md`.

---

### 16. Stratégie de growth et activation

**Sujet à creuser quand le produit sera plus stable.**
- Comment acquérir les premiers utilisateurs ?
- Qu'est-ce qui fait revenir un user à J+7 ? La mécanique de streak
  dans `/suivi` est un bon début, mais suffisant ?
- Funnel : taux de complétion du diagnostic ? Taux de retour ?
- Mesures à mettre en place (analytics simple : Plausible, Umami…)
- Capture d'email au résultat du diagnostic (avant inscription complète) —
  levier d'activation fort avant même de créer un compte.

**Analyse Cowork.** Voir `analyses/16-growth-activation.md`.

---

## Comment utiliser ce fichier

- **Avant de commencer une session de travail** : relis cette liste pour
  voir s'il y a un sujet qui te chauffe particulièrement.
- **À la fin d'une session** : si tu as repéré un nouveau sujet, ajoute-le
  ici plutôt que de le garder en tête.
- **Quand tu termines un chantier** : déplace-le dans `## Fait` en bas,
  avec la date. Le fichier devient ton historique en même temps que ta todo.

**Priorité de reprise suggérée :**
1. **Premium** — teaser lecture seule + cadenas nav + gating (historique, courbe d'évolution, objectifs de vie). C'est le prochain chantier fonctionnel.
2. **Mentions AMF** (point 15) — obligatoires avant tout lancement public ; à intégrer juste après ou en parallèle du gating.
3. **Growth** (point 16) — capture email + analytics une fois le flux complet verrouillé.
4. Trancher `classifyHousing` + `safetyTarget` (points 2 et 3)
5. Fixer les lint errors (point 9)
6. Centraliser `euro()` + clés storage (points 6, 7)
7. Composant `Card` + tokens (points 4, 5)
8. Le gros morceau : modélisation Livret A (point 1) — penser au taux 1,7 % au 01/08/2026

---

## Fait

### 13 — Mécanique premium (tranché, juillet 2026)

Pricing retenu : **24,99 €/an** (affiché "4 mois offerts") ou **2,99 €/mois**
sans engagement. Idée "tarif fondateur" (ex. 14,99 €/an à vie pour les 100
premiers) mise en réserve.

Découpage freemium :
- **Gratuit sans compte** : diagnostic + résultats.
- **Gratuit avec inscription** : premier rituel patrimoine (saisie du mois en cours).
- **Premium** : historique complet, courbe d'évolution, objectifs de vie —
  teasés en lecture seule avec cadenas sur la nav.

Analyse détaillée dans `analyses/13-mecanique-premium.md`.

**Prérequis lot 3 Stripe :** créer le statut auto-entrepreneur, ajouter le SIREN
aux mentions légales (`/mentions-legales`), compléter l'hébergeur au déploiement.

---

### Chantier auth & synchronisation multi-appareils (juillet 2026)

Supabase opérationnel (projet hébergé Paris, RLS activé sur toutes les tables).
Login Google OAuth + Magic Link fonctionnels.
Migration localStorage → Supabase auto-réparante (runner déclenché au premier
accès post-login, idempotent).

Bascule complète des 4 sources de données :
- **Patrimoine** (`patrimoine_entries`) — blob mensuel, UNIQUE (user_id, month)
- **Objectifs** (`objectives`) — blob store, UNIQUE user_id (migration 002)
- **Diagnostic** (`diagnostics`) — payload complet, UNIQUE user_id (migration 003)
- **Résultats** — déduit du diagnostic Supabase, pas de table dédiée

Correctifs de robustesse intégrés : retry 1 s post-OAuth (RLS vide sans erreur),
flag `cancelled` contre les races de Strict Mode, fallback localStorage si
Supabase vide sans marqueur de migration.

L'app est désormais **multi-appareils** : les données suivent le compte,
pas le navigateur.

---

### Suppression d'entrées d'historique patrimoine (juillet 2026)

Suppression fonctionnelle en local (localStorage) et en Supabase (DELETE avec
RLS). Confirmation modale avant suppression, gestion d'erreur inline.
