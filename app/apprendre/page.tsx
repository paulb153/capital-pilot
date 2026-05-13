"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Épargne" | "Bourse" | "Immobilier" | "Fiscalité" | "Crypto";
type Difficulty = "Débutant" | "Intermédiaire" | "Avancé";

interface Section {
  title: string;
  body: string;
}

interface Article {
  intro: string;
  sections: Section[];
  pros: string[];
  cons: string[];
  keyPoints: string[];
  insight?: string;
  warning?: string;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  difficulty: Difficulty;
  duration: string;
  readTime: string;
  avatarInitial: string;
  tags: string[];
  summary: string;
  article: Article;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: "livret-a",
    title: "Livret A",
    subtitle: "L'épargne de précaution par excellence",
    category: "Épargne",
    difficulty: "Débutant",
    duration: "5 min",
    readTime: "3 min",
    avatarInitial: "LA",
    tags: ["Sans risque", "Disponible", "Défiscalisé"],
    summary:
      "Le Livret A est le placement d'épargne le plus populaire en France. Zéro risque, argent disponible à tout moment, et intérêts exonérés d'impôts.",
    article: {
      intro:
        "Le Livret A est un compte d'épargne réglementé par l'État français. Il est proposé par toutes les banques et offre un taux d'intérêt garanti, fixé deux fois par an. C'est le placement idéal pour votre épargne de précaution.",
      sections: [
        {
          title: "Comment ça fonctionne ?",
          body: "Vous déposez de l'argent sur votre Livret A, et vous percevez des intérêts calculés par quinzaine. Le taux est actuellement de 2,4% (jusqu'au 31 juillet 2026). Le plafond de dépôt est de 22 950 €.",
        },
        {
          title: "Pour qui ?",
          body: "Tout le monde : toute personne physique résidant en France peut ouvrir un Livret A. Un seul Livret A par personne est autorisé. Les mineurs peuvent en avoir un ouvert par leurs parents.",
        },
      ],
      pros: [
        "Intérêts 100% exonérés d'impôt sur le revenu et de prélèvements sociaux",
        "Capital garanti par l'État — zéro risque de perte",
        "Argent disponible immédiatement, sans délai ni pénalité",
        "Ouverture dans n'importe quelle banque ou La Banque Postale",
        "Taux révisé par l'État : protège partiellement contre l'inflation",
      ],
      cons: [
        "Rendement faible : 2,4% — souvent en dessous de l'inflation réelle",
        "Plafond limité à 22 950 € (intérêts capitalisés non plafonnés)",
        "Un seul livret autorisé par personne",
        "Pas adapté pour faire fructifier un capital sur le long terme",
        "Taux révisable à la baisse (était à 0,5% en 2020)",
      ],
      insight:
        "Le Livret A n'est pas un investissement. L'inflation limite le rendement réel du Livret A, réduisant ainsi le pouvoir d'achat de votre épargne — si l'inflation est à 3% et le taux à 2,4%, vous perdez 0,6% de pouvoir d'achat chaque année.",
      keyPoints: [
        "Taux actuel : 2,4% net d'impôts (jusqu'au 31/07/2026)",
        "Plafond : 22 950 €",
        "Disponibilité : immédiate",
        "Risque : aucun (garanti par l'État)",
        "Idéal pour : épargne de précaution (3–6 mois de salaire)",
      ],
      warning:
        "Ne pas y mettre plus que votre épargne de précaution. Au-delà, des placements plus rémunérateurs existent.",
    },
  },
  {
    id: "pea",
    title: "PEA",
    subtitle: "Investir en bourse avec avantage fiscal après 5 ans",
    category: "Bourse",
    difficulty: "Intermédiaire",
    duration: "12 min",
    readTime: "7 min",
    avatarInitial: "PE",
    tags: ["Actions", "Fiscalité avantageuse", "Long terme"],
    summary:
      "Le PEA permet d'investir en actions européennes avec une fiscalité très avantageuse après 5 ans de détention. Un incontournable pour construire un patrimoine boursier.",
    article: {
      intro:
        "Le Plan d'Épargne en Actions (PEA) est une enveloppe fiscale permettant d'investir en bourse tout en bénéficiant d'une exonération d'impôt sur les plus-values après 5 ans de détention.",
      sections: [
        {
          title: "Fonctionnement",
          body: "Vous alimentez votre PEA avec des versements en cash (plafond 150 000 €), puis investissez dans des actions d'entreprises européennes ou des ETF éligibles. Les gains restent dans l'enveloppe sans être imposés tant que vous ne retirez pas.",
        },
        {
          title: "Avantage fiscal après 5 ans",
          body: "Après 5 ans, vos retraits sont exonérés d'impôt sur le revenu. Seuls les prélèvements sociaux de 17,2% s'appliquent sur les plus-values. Avant 5 ans, le taux global est de 30% (flat tax).",
        },
        {
          title: "Stratégie recommandée",
          body: "Ouvrez votre PEA le plus tôt possible pour faire courir le délai des 5 ans. Investissez régulièrement (DCA) dans des ETF World éligibles pour capter la croissance mondiale avec des frais réduits.",
        },
      ],
      pros: [
        "Exonération d'impôt sur le revenu sur les plus-values après 5 ans",
        "Seuls 17,2% de prélèvements sociaux s'appliquent à la sortie (vs 30% flat tax)",
        "Capitalisation des gains sans imposition annuelle",
        "Plafond de versement de 150 000 €, généreux pour un investisseur particulier",
        "Compatible avec les ETF World éligibles pour une diversification mondiale",
      ],
      cons: [
        "Tout retrait avant 5 ans entraîne la clôture automatique du PEA",
        "Univers limité aux actions et ETF de l'Union Européenne (pas d'ETF US direct)",
        "Pas de levier, pas d'options, pas de vente à découvert",
        "Un seul PEA par personne (PEA + PEA-PME possibles en parallèle)",
        "Risque de perte en capital : la bourse peut baisser, surtout à court terme",
      ],
      keyPoints: [
        "Plafond versements : 150 000 €",
        "Fiscalité après 5 ans : 17,2% (prélèvements sociaux uniquement)",
        "Univers : actions et ETF européens (dont ETF MSCI World éligibles)",
        "Horizon recommandé : 8–10 ans minimum",
        "Risque : élevé à court terme, historiquement positif sur longue durée",
      ],
      warning:
        "Tout retrait avant 5 ans entraîne la clôture du PEA. Ne pas investir de l'argent dont vous pourriez avoir besoin à court terme.",
    },
  },
  {
    id: "cto",
    title: "CTO — Compte-Titres Ordinaire",
    subtitle: "Investir sans limites, mais sans avantage fiscal",
    category: "Bourse",
    difficulty: "Intermédiaire",
    duration: "10 min",
    readTime: "6 min",
    avatarInitial: "CT",
    tags: ["Actions", "Monde entier", "Flexible"],
    summary:
      "Le CTO est l'enveloppe boursière la plus flexible : aucun plafond, accès à tous les marchés mondiaux. En contrepartie, les plus-values sont taxées chaque année.",
    article: {
      intro:
        "Le Compte-Titres Ordinaire (CTO) est une enveloppe d'investissement en bourse sans restrictions géographiques ni plafond de versement. Contrairement au PEA, vous pouvez y investir dans n'importe quelle action mondiale, ETF, obligation ou produit dérivé.",
      sections: [
        {
          title: "Fonctionnement",
          body: "Vous ouvrez un CTO auprès d'un courtier (Boursorama, Trade Republic, IBKR…) et investissez librement. Chaque cession génère une plus-value imposable l'année où elle est réalisée, au taux de 30% (flat tax : 12,8% IR + 17,2% PS).",
        },
        {
          title: "Fiscalité",
          body: "Les dividendes et les plus-values sont imposés à la flat tax de 30% ou, sur option globale, au barème progressif de l'IR si vous êtes faiblement imposé. L'imposition se fait l'année de la cession, pas à la sortie — contrairement au PEA ou à l'assurance-vie.",
        },
        {
          title: "Quand choisir le CTO ?",
          body: "Quand votre PEA est plein (150 000 €), quand vous souhaitez investir hors Europe (actions US, émergents, crypto-ETF), ou quand vous avez besoin de produits non éligibles au PEA (obligations, ETF à effet de levier, warrants).",
        },
      ],
      pros: [
        "Aucun plafond de versement — investissez autant que vous voulez",
        "Accès à tous les marchés : actions US, monde entier, obligations, ETF…",
        "Plusieurs CTO possibles auprès de courtiers différents",
        "Retraits à tout moment sans contrainte ni clôture du compte",
        "Pertes déductibles des plus-values de même nature sur 10 ans",
      ],
      cons: [
        "Flat tax de 30% sur chaque plus-value réalisée et chaque dividende",
        "Aucune capitalisation fiscale : l'impôt est dû l'année de la cession",
        "Moins efficace fiscalement que le PEA sur le long terme",
        "Dividendes imposés même si réinvestis (pas de capitalisation nette)",
        "Peut inciter à réaliser des moins-values pour optimiser la fiscalité",
      ],
      keyPoints: [
        "Plafond : aucun",
        "Fiscalité : 30% flat tax sur plus-values et dividendes",
        "Univers : monde entier, tous produits financiers",
        "Disponibilité : immédiate, sans contrainte",
        "Idéal pour : compléter un PEA saturé ou investir hors Europe",
      ],
      warning:
        "Préférez toujours remplir votre PEA en premier. Le CTO est complémentaire, pas un substitut, car la fiscalité est nettement moins avantageuse sur la durée.",
    },
  },
  {
    id: "etf",
    title: "ETF (Trackers)",
    subtitle: "Investir sur des centaines d'entreprises en un clic",
    category: "Bourse",
    difficulty: "Débutant",
    duration: "10 min",
    readTime: "5 min",
    avatarInitial: "ET",
    tags: ["Diversification", "Frais réduits", "Passif"],
    summary:
      "Les ETF sont des fonds indiciels cotés en bourse qui répliquent un indice (CAC 40, MSCI World…). Simple, peu coûteux, et ultra-diversifié.",
    article: {
      intro:
        "Un ETF (Exchange-Traded Fund) est un fonds qui suit automatiquement la performance d'un indice boursier. En achetant un seul ETF MSCI World, vous investissez dans plus de 1 500 entreprises mondiales en une transaction.",
      sections: [
        {
          title: "Pourquoi les ETF ?",
          body: "Les études montrent que 90% des gérants actifs ne battent pas leur indice de référence sur 10 ans. Les ETF répliquent fidèlement l'indice à moindre coût (frais de 0,1% à 0,5%/an vs 1,5–2% pour les fonds actifs).",
        },
        {
          title: "Les principaux indices",
          body: "MSCI World (1 500+ entreprises mondiales), S&P 500 (500 grandes entreprises US), CAC 40 (40 plus grandes entreprises françaises), MSCI Emerging Markets (marchés émergents).",
        },
        {
          title: "Comment investir ?",
          body: "Via un PEA (ETF européens éligibles), un CTO (tous ETF mondiaux), ou une assurance-vie. La stratégie DCA consiste à investir un montant fixe chaque mois, quelle que soit la situation du marché.",
        },
      ],
      pros: [
        "Frais annuels ultra-réduits : 0,1% à 0,5%/an (vs 1,5–2% pour les fonds actifs)",
        "Diversification immédiate sur des centaines ou milliers d'entreprises",
        "Liquidité : achat et vente en temps réel pendant les heures de marché",
        "Transparence totale : vous savez exactement ce que vous détenez",
        "Rendement historique MSCI World : ~7%/an sur 20 ans (avant impôts)",
      ],
      cons: [
        "Risque de perte en capital — la valeur fluctue avec le marché",
        "Pas de sur-performance possible : vous suivez l'indice, ni plus ni moins",
        "Nécessite un horizon long terme (5–10 ans minimum) pour lisser la volatilité",
        "Dividendes taxables chaque année sur CTO (pas sur PEA)",
        "Peut donner une fausse impression de sécurité par la diversification",
      ],
      keyPoints: [
        "Frais annuels : 0,1% à 0,5% (vs 1,5–2% fonds actifs)",
        "Diversification immédiate sur des centaines d'entreprises",
        "Rendement historique MSCI World : ~7%/an sur 20 ans",
        "Stratégie DCA : investir régulièrement pour lisser le risque",
        "À loger en priorité dans un PEA pour optimiser la fiscalité",
      ],
    },
  },
  {
    id: "assurance-vie",
    title: "Assurance Vie",
    subtitle: "Épargne long terme et avantage successoral unique",
    category: "Fiscalité",
    difficulty: "Intermédiaire",
    duration: "15 min",
    readTime: "8 min",
    avatarInitial: "AV",
    tags: ["Succession", "Fonds euros", "Unités de compte"],
    summary:
      "L'assurance-vie est un placement polyvalent : fonds euros sécurisés ou unités de compte dynamiques, avec des avantages fiscaux uniques en cas de décès.",
    article: {
      intro:
        "L'assurance-vie est le placement préféré des Français avec plus de 1 900 milliards d'euros d'encours. Elle combine sécurité (fonds euros), performance potentielle (unités de compte) et avantages successoraux uniques.",
      sections: [
        {
          title: "Fonds euros vs Unités de compte",
          body: "Le fonds en euros est garanti en capital avec un rendement de 2–3%/an. Les unités de compte (UC) sont des fonds investis en bourse, sans garantie mais avec un potentiel de rendement supérieur. Un bon contrat mixe les deux.",
        },
        {
          title: "Avantage fiscal après 8 ans",
          body: "Après 8 ans, vous bénéficiez d'un abattement annuel de 4 600 € (célibataire) ou 9 200 € (couple) sur les plus-values. Au-delà, le taux est de 24,7% (vs 30% flat tax). Idéal pour des retraits réguliers à la retraite.",
        },
        {
          title: "Avantage successoral",
          body: "Les capitaux transmis via une assurance-vie bénéficient d'un abattement de 152 500 € par bénéficiaire pour les versements avant 70 ans. Les capitaux sont hors succession classique, ce qui permet de transmettre à qui vous voulez.",
        },
      ],
      pros: [
        "Abattement successoral de 152 500 € par bénéficiaire (versements avant 70 ans)",
        "Fiscalité réduite après 8 ans : abattement annuel de 4 600 € (ou 9 200 € couple)",
        "Capitalisation des gains sans imposition tant qu'il n'y a pas de rachat",
        "Pas de plafond de versement",
        "Souplesse : mixer fonds euros sécurisés et UC dynamiques selon votre profil",
      ],
      cons: [
        "Frais variables selon les contrats : frais d'entrée (éviter), frais de gestion annuels (0,5–1%)",
        "Fonds euros en baisse de rendement sur 10 ans (2–3% aujourd'hui)",
        "Moins performant que le PEA pour l'investissement en bourse pur",
        "Complexité des contrats : comparer les UC disponibles est fastidieux",
        "Avantage successoral réduit pour les versements après 70 ans (abattement global 30 500 €)",
      ],
      keyPoints: [
        "Pas de plafond de versement",
        "Fiscalité réduite après 8 ans",
        "Abattement succession : 152 500 € par bénéficiaire",
        "Fonds euros : capital garanti, ~2–3%/an",
        "Idéal pour : transmission patrimoniale et épargne long terme",
      ],
      warning:
        "Comparer les frais de gestion (viser <0,7%/an sur UC) et les performances des fonds euros. Éviter les contrats bancaires avec frais d'entrée.",
    },
  },
  {
    id: "immobilier-locatif",
    title: "Immobilier Locatif",
    subtitle: "Construire un patrimoine tangible avec effet de levier",
    category: "Immobilier",
    difficulty: "Avancé",
    duration: "20 min",
    readTime: "12 min",
    avatarInitial: "IL",
    tags: ["Effet de levier", "Revenus passifs", "LMNP"],
    summary:
      "L'investissement locatif permet de se constituer un patrimoine immobilier en utilisant l'effet de levier du crédit, avec des revenus réguliers et des avantages fiscaux.",
    article: {
      intro:
        "L'immobilier locatif reste une valeur refuge pour les Français. En empruntant pour acheter un bien, vous utilisez l'effet de levier du crédit : c'est en partie votre locataire qui rembourse le prêt chaque mois.",
      sections: [
        {
          title: "L'effet de levier",
          body: "Avec 20 000 € d'apport, vous pouvez acheter un bien à 100 000 €. Si le bien prend 20% de valeur, vous avez gagné 20 000 € sur votre mise initiale de 20 000 € — soit 100% de rendement sur apport. C'est l'effet de levier.",
        },
        {
          title: "Régimes fiscaux (LMNP, Pinel…)",
          body: "En LMNP (Location Meublée Non Professionnelle), vous pouvez amortir comptablement le bien et les meubles, réduisant fortement la fiscalité sur les loyers. Le régime Pinel (avantage fiscal en neuf) s'est terminé fin 2024.",
        },
        {
          title: "Points de vigilance",
          body: "La rentabilité locative brute doit être supérieure au taux d'emprunt. Prévoir la vacance locative (1–2 mois/an), les charges, la taxe foncière, et les travaux imprévus. La gestion locative prend du temps ou coûte 7–10% des loyers.",
        },
      ],
      pros: [
        "Effet de levier : amplifier le rendement grâce au crédit bancaire",
        "Revenus passifs réguliers via les loyers",
        "Patrimoine tangible et transmissible",
        "LMNP : fiscalité optimisée via amortissements comptables",
        "Protection contre l'inflation : les loyers sont indexés (IRL)",
      ],
      cons: [
        "Apport initial important (généralement 10–20% du prix)",
        "Illiquidité : impossible de vendre rapidement sans perte potentielle",
        "Gestion chronophage (locataires, travaux, assemblées de copropriété)",
        "Risques : vacance locative, loyers impayés, dégradations",
        "Frais d'acquisition élevés : 7–8% de frais de notaire dans l'ancien",
      ],
      keyPoints: [
        "Rentabilité brute visée : >5% dans les villes secondaires",
        "Effet de levier : amplifier le rendement sur apport",
        "LMNP : fiscalité optimisée via amortissements",
        "Risques : vacance locative, travaux imprévus, loyers impayés",
        "Horizon : 10–15 ans minimum pour amortir les frais de notaire",
      ],
      warning:
        "Calculer la rentabilité nette nette (après charges, fiscalité et vacance locative) avant tout achat. Sous-estimer les charges est l'erreur la plus fréquente.",
    },
  },
  {
    id: "per",
    title: "PER — Plan Épargne Retraite",
    subtitle: "Défiscaliser maintenant, préparer sa retraite pour demain",
    category: "Fiscalité",
    difficulty: "Intermédiaire",
    duration: "12 min",
    readTime: "6 min",
    avatarInitial: "PR",
    tags: ["Retraite", "Déduction fiscale", "Long terme"],
    summary:
      "Le PER permet de déduire vos versements de votre revenu imposable maintenant, et de récupérer votre épargne à la retraite avec une fiscalité réduite.",
    article: {
      intro:
        "Le Plan d'Épargne Retraite (PER) individuel est un placement long terme permettant de réduire votre impôt aujourd'hui en déduisant vos versements de votre revenu imposable, dans la limite d'un plafond annuel.",
      sections: [
        {
          title: "Déduction fiscale immédiate",
          body: "Vos versements sont déductibles de votre revenu imposable dans la limite de 10% de vos revenus professionnels (plafond 2024 : 35 194 €). Pour une tranche à 30%, chaque 1 000 € versés vous économise 300 € d'impôt.",
        },
        {
          title: "Sortie à la retraite",
          body: "À la retraite, vous récupérez votre épargne en rente viagère ou en capital. La sortie en capital est imposée à votre tranche marginale (souvent plus basse à la retraite) + 17,2% de prélèvements sociaux sur les plus-values.",
        },
        {
          title: "Cas de déblocage anticipé",
          body: "Le PER est normalement bloqué jusqu'à la retraite. Exceptions : achat de la résidence principale, invalidité, décès du conjoint, surendettement, fin de droits au chômage.",
        },
      ],
      pros: [
        "Déduction fiscale immédiate sur les versements (jusqu'à 41% selon la TMI)",
        "Capitalisation des gains sans imposition annuelle jusqu'à la retraite",
        "Sortie en capital ou en rente au choix à la retraite",
        "Déblocage anticipé possible pour l'achat de la résidence principale",
        "Plafond reportable sur 3 ans si non utilisé les années précédentes",
      ],
      cons: [
        "Épargne bloquée jusqu'à la retraite (hors cas exceptionnels)",
        "Imposition à la sortie : vous payez l'impôt plus tard, pas jamais",
        "Moins intéressant en dessous de 30% de TMI",
        "Rente viagère fiscalement moins avantageuse que le capital",
        "Frais variables selon les contrats — comparer avant de souscrire",
      ],
      keyPoints: [
        "Plafond déduction 2024 : 10% des revenus, max 35 194 €",
        "Avantage : réduction d'impôt immédiate",
        "Sortie : rente ou capital à la retraite",
        "Idéal pour : TMI 30% et au-dessus",
        "Épargne bloquée (sauf cas exceptionnels dont résidence principale)",
      ],
      warning:
        "Plus votre taux marginal d'imposition est élevé, plus le PER est intéressant. En dessous de 30% de TMI, l'avantage fiscal est limité et l'assurance-vie reste souvent préférable.",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<Category, string> = {
  Épargne: "bg-green-100 text-green-700",
  Bourse: "bg-blue-100 text-blue-700",
  Immobilier: "bg-orange-100 text-orange-700",
  Fiscalité: "bg-purple-100 text-purple-700",
  Crypto: "bg-yellow-100 text-yellow-700",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Débutant: "bg-emerald-50 text-emerald-600",
  Intermédiaire: "bg-amber-50 text-amber-600",
  Avancé: "bg-red-50 text-red-600",
};

const CATEGORIES: Category[] = ["Épargne", "Bourse", "Immobilier", "Fiscalité", "Crypto"];
const DIFFICULTIES: Difficulty[] = ["Débutant", "Intermédiaire", "Avancé"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function VideoPlayer({ avatarInitial, title }: { avatarInitial: string; title: string }) {
  const [played, setPlayed] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", minHeight: 180 }}
      onClick={() => setPlayed(true)}
    >
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
          {avatarInitial}
        </div>
        <span className="text-xs font-medium text-white/80">{title}</span>
      </div>
      <div className="absolute top-4 right-4 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
        Vidéo courte
      </div>
      {!played ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-white/60">Bientôt disponible</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span className="text-xs text-white/60">Chargement…</span>
        </div>
      )}
    </div>
  );
}

function ModuleCard({ mod, active, onClick }: { mod: Module; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition ${
        active ? "border-blue-200 bg-blue-50 shadow-sm" : "border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[mod.category]}`}>
              {mod.category}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DIFFICULTY_COLORS[mod.difficulty]}`}>
              {mod.difficulty}
            </span>
          </div>
          <p className={`font-semibold text-sm truncate ${active ? "text-blue-700" : "text-zinc-900"}`}>{mod.title}</p>
          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{mod.subtitle}</p>
        </div>
        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
          {mod.avatarInitial}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {mod.duration}
        </span>
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
            <path d="M4 6h12M4 10h8M4 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {mod.readTime} de lecture
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {mod.tags.map((t) => (
          <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">{t}</span>
        ))}
      </div>
    </button>
  );
}

function ProsConsGrid({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Avantages */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill="#16A34A" fillOpacity="0.15" stroke="#16A34A" strokeWidth="1.5" />
            <path d="M6 10l2.5 2.5L14 7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Avantages
        </p>
        <ul className="space-y-2">
          {pros.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
              <span className="mt-0.5 text-emerald-500 flex-shrink-0">+</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Inconvénients */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" fill="#DC2626" fillOpacity="0.12" stroke="#DC2626" strokeWidth="1.5" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Inconvénients
        </p>
        <ul className="space-y-2">
          {cons.map((c) => (
            <li key={c} className="flex items-start gap-2 text-xs text-red-800 leading-relaxed">
              <span className="mt-0.5 text-red-400 flex-shrink-0">−</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ArticleContent({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className="text-sm text-zinc-600 leading-relaxed">{article.intro}</p>

      {/* Pros / Cons — always visible */}
      <ProsConsGrid pros={article.pros} cons={article.cons} />

      {/* Insight */}
      {article.insight && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="mt-0.5 flex-shrink-0">
            <circle cx="10" cy="10" r="8" stroke="#2563EB" strokeWidth="1.5" />
            <path d="M10 9v5" stroke="#2563EB" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="10" cy="6.5" r="0.8" fill="#2563EB" />
          </svg>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500 mb-0.5">En mieux</p>
            <p className="text-xs text-blue-800 leading-relaxed">{article.insight}</p>
          </div>
        </div>
      )}

      {/* Sections — expandable */}
      <div className={`mt-4 space-y-3 overflow-hidden transition-all duration-300 ${expanded ? "max-h-[2000px]" : "max-h-0"}`}>
        {article.sections.map((s) => (
          <div key={s.title} className="rounded-xl bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-800 mb-1">{s.title}</p>
            <p className="text-sm text-zinc-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
      >
        {expanded ? "Réduire" : "Lire l'article complet"}
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Key points */}
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">Points clés</p>
        <ul className="space-y-2">
          {article.keyPoints.map((kp) => (
            <li key={kp} className="flex items-start gap-2 text-sm text-zinc-700">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {kp}
            </li>
          ))}
        </ul>
      </div>

      {/* Warning */}
      {article.warning && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mt-0.5 flex-shrink-0">
            <path d="M10 3L18 17H2L10 3Z" stroke="#D97706" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M10 9v4M10 14.5v.5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">{article.warning}</p>
        </div>
      )}
    </div>
  );
}

// ─── Detail panel (shared between desktop sticky and mobile bottom) ────────────

function DetailPanel({ mod }: { mod: Module }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <VideoPlayer avatarInitial={mod.avatarInitial} title={mod.title} />
      </div>
      <div className="px-5 pb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_COLORS[mod.category]}`}>
            {mod.category}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[mod.difficulty]}`}>
            {mod.difficulty}
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {mod.duration}
          </span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900">{mod.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{mod.subtitle}</p>
        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3">
          <p className="text-sm text-blue-800 leading-relaxed">{mod.summary}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mod.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">{t}</span>
          ))}
        </div>
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <ArticleContent article={mod.article} />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApprendrePage() {
  const [selectedId, setSelectedId] = useState<string>(MODULES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | "">("");

  const selected = MODULES.find((m) => m.id === selectedId) ?? MODULES[0];

  const filtered = useMemo(() => {
    return MODULES.filter((m) => {
      if (filterCategory && m.category !== filterCategory) return false;
      if (filterDifficulty && m.difficulty !== filterDifficulty) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filterCategory, filterDifficulty, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Apprendre</h1>
              <p className="text-sm text-white/60 mt-0.5">
                {MODULES.length} modules · Épargne, Bourse, Immobilier &amp; plus
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{MODULES.length}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Modules</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {MODULES.filter((m) => m.difficulty === "Débutant").length}
                </p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Débutant</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {MODULES.filter((m) => m.difficulty === "Avancé").length}
                </p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Avancé</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="white" strokeWidth="1.6" strokeOpacity="0.6" />
              <path d="M13 13L17 17" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.6" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un sujet…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white/80 transition">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mr-1">Filtrer :</span>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filterCategory === cat ? CATEGORY_COLORS[cat] : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}>
              {cat}
            </button>
          ))}
          <div className="h-4 w-px bg-zinc-200 mx-1" />
          {DIFFICULTIES.map((diff) => (
            <button key={diff} onClick={() => setFilterDifficulty(filterDifficulty === diff ? "" : diff)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filterDifficulty === diff ? DIFFICULTY_COLORS[diff] : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}>
              {diff}
            </button>
          ))}
          {(filterCategory || filterDifficulty || searchQuery) && (
            <button onClick={() => { setFilterCategory(""); setFilterDifficulty(""); setSearchQuery(""); }}
              className="ml-auto text-xs font-medium text-zinc-400 hover:text-zinc-700 transition">
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold text-zinc-700">Aucun module trouvé</p>
            <p className="text-sm text-zinc-400 mt-1">Essayez d'autres filtres ou termes de recherche.</p>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            {/* Module list */}
            <div className="w-full lg:w-[340px] lg:flex-shrink-0 space-y-3">
              {filtered.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} active={mod.id === selectedId} onClick={() => setSelectedId(mod.id)} />
              ))}
            </div>

            {/* Desktop sticky detail */}
            <div className="hidden lg:block flex-1 sticky top-32">
              <DetailPanel mod={selected} />
            </div>
          </div>
        )}

        {/* Mobile detail */}
        <div className="lg:hidden mt-4">
          <DetailPanel mod={selected} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white mt-8 px-4 py-6">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© 2025 CapitalPilot — Contenu éducatif, pas de conseil financier personnalisé.</p>
          <div className="flex gap-4">
            <a href="/resultats" className="hover:text-zinc-700 transition">Mon diagnostic</a>
            <a href="/objectifs" className="hover:text-zinc-700 transition">Mes objectifs</a>
            <a href="/suivi" className="hover:text-zinc-700 transition">Mon suivi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
