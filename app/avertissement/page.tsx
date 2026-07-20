import Link from "next/link";

export const metadata = {
  title: "Avertissement légal — CapitalPilot",
  description: "CapitalPilot est un outil pédagogique. Son contenu ne constitue pas un conseil en investissement au sens de la réglementation financière.",
};

export default function AvertissementPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
          ← Accueil
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-zinc-950">Avertissement légal</h1>
        <p className="mt-2 text-sm text-zinc-500">
          À lire avant d&apos;utiliser CapitalPilot pour toute décision financière.
        </p>

        {/* ── Nature du service ── */}
        <section className="mt-10">
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">CapitalPilot est un outil d&apos;éducation financière</h2>
            <p className="mt-3 text-sm leading-7 text-amber-800">
              Le contenu de ce site — diagnostics, projections, simulations, modules pédagogiques — est fourni
              <strong> à titre purement informatif et éducatif</strong>.
              Il ne constitue en aucun cas un <strong>conseil en investissement</strong>,
              un conseil en gestion de patrimoine, une recommandation personnalisée
              ou une incitation à l&apos;achat ou à la vente d&apos;instruments financiers
              au sens de l&apos;article D321-1 du Code monétaire et financier.
            </p>
          </div>
        </section>

        {/* ── Statut réglementaire ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Statut réglementaire</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            CapitalPilot n&apos;est pas un <strong>Conseiller en Investissements Financiers (CIF)</strong>
            et n&apos;est pas enregistré auprès de l&apos;ORIAS (Organisme pour le Registre des Intermédiaires en Assurance,
            Banque et Finance). CapitalPilot n&apos;est pas habilité à fournir de conseil en investissement au sens
            réglementaire du terme.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            Toute décision d&apos;investissement ou de gestion de votre patrimoine relève de votre seule
            responsabilité et devrait, pour les décisions significatives, être prise après consultation
            d&apos;un professionnel habilité.
          </p>
        </section>

        {/* ── Projections et simulations ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Projections et simulations</h2>
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-700">
            <p>
              Les projections financières présentées sur ce site reposent sur des <strong>hypothèses simplifiées</strong>
              (rendements constants, absence d&apos;inflation, comportements stables) et ne constituent pas une garantie
              de résultat.
            </p>
            <p className="mt-2">
              <strong>Les performances passées ne préjugent pas des performances futures.</strong>
              Tout investissement comporte un <strong>risque de perte en capital</strong>, partielle ou totale.
              Les marchés financiers sont soumis à des fluctuations qui peuvent être significatives.
            </p>
          </div>
        </section>

        {/* ── Responsabilité ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Limitation de responsabilité</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            L&apos;éditeur de CapitalPilot ne saurait être tenu responsable des décisions financières prises
            par les utilisateurs sur la base des informations ou simulations présentées sur ce site.
            L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait des informations fournies.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            Les informations présentées sont susceptibles d&apos;évoluer et peuvent ne pas refléter la situation
            fiscale ou réglementaire la plus récente. CapitalPilot s&apos;efforce de maintenir les données à jour
            mais ne garantit pas l&apos;exactitude ou l&apos;exhaustivité des informations à tout moment.
          </p>
        </section>

        {/* ── Conseil d'un professionnel ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Consulter un professionnel habilité</h2>
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-800">
            <p>
              Avant toute décision financière significative — investissement, souscription d&apos;un produit d&apos;épargne,
              restructuration de patrimoine — nous vous encourageons vivement à consulter un professionnel
              habilité, notamment :
            </p>
            <ul className="mt-3 space-y-1">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                Un <strong>Conseiller en Investissements Financiers (CIF)</strong> agréé et enregistré à l&apos;ORIAS
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                Un <strong>Conseiller en Gestion de Patrimoine (CGP)</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                Un <strong>conseiller bancaire</strong> ou un établissement financier réglementé
              </li>
            </ul>
            <p className="mt-3">
              Vous pouvez vérifier l&apos;habilitation d&apos;un intermédiaire financier sur{" "}
              <span className="font-medium">www.orias.fr</span>.
            </p>
          </div>
        </section>

        {/* ── Cadre AMF ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Références réglementaires</h2>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400" />
                Article D321-1 du Code monétaire et financier — définition du conseil en investissement
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400" />
                Directive MIF II (2014/65/UE) — services et activités d&apos;investissement
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-400" />
                Autorité des marchés financiers (AMF) — <span className="text-zinc-500">www.amf-france.org</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Navigation ── */}
        <div className="mt-12 flex gap-4">
          <Link href="/" className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
            ← Accueil
          </Link>
          <Link href="/mentions-legales" className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
            Mentions légales →
          </Link>
        </div>
      </div>
    </main>
  );
}
