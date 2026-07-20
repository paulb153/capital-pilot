import Link from "next/link";

export const metadata = {
  title: "Mentions légales — CapitalPilot",
  description: "Mentions légales, éditeur, hébergeur et informations sur la protection des données personnelles.",
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
          ← Accueil
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-zinc-950">Mentions légales</h1>
        <p className="mt-2 text-sm text-zinc-500">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN).</p>

        {/* ── Éditeur ── */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-950">Éditeur du site</h2>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            <p><strong>Éditeur :</strong> Paul Bigo</p>
            <p><strong>Statut :</strong> Site édité à titre personnel et non professionnel</p>
            <p><strong>Directeur de la publication :</strong> Paul Bigo</p>
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Contact</h2>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            <p>Pour toute question relative au site ou à vos données personnelles :</p>
            <p className="mt-1">
              <strong>Email :</strong>{" "}
              <a href="mailto:capitalpilot.contact@gmail.com" className="text-blue-600 hover:text-blue-800 underline">
                capitalpilot.contact@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* ── Hébergeur ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Hébergeur</h2>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700">
            {/* TODO déploiement : compléter société, adresse et URL de l'hébergeur */}
            <p className="italic text-zinc-400">Hébergeur : à compléter au déploiement.</p>
          </div>
        </section>

        {/* ── Propriété intellectuelle ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Propriété intellectuelle</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">
            L&apos;ensemble des contenus présents sur CapitalPilot (textes, calculs, interfaces graphiques, code source) est la propriété exclusive de l&apos;éditeur.
            Toute reproduction, représentation ou diffusion, en tout ou en partie, est interdite sans autorisation écrite préalable.
          </p>
        </section>

        {/* ── Données personnelles ── */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-950">Données personnelles</h2>
          <div className="mt-3 space-y-4 text-sm leading-7 text-zinc-700">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-900">Stockage local (localStorage)</h3>
              <p className="mt-1 text-blue-800">
                Les données financières saisies lors du diagnostic (revenus, dépenses, épargne) sont stockées
                dans le <strong>localStorage de votre navigateur</strong>, sur votre appareil uniquement.
                Ce stockage est <strong>strictement nécessaire au fonctionnement du service</strong> et est exempté
                de consentement préalable conformément à l&apos;article 82 de la loi Informatique et Libertés.
              </p>
              <p className="mt-2 text-blue-800">
                Ces données ne quittent pas votre navigateur sauf si vous créez un compte et activez la synchronisation.
                Vous pouvez les supprimer à tout moment en vidant les données du site dans les paramètres de votre navigateur.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="font-semibold text-zinc-900">Compte utilisateur (Supabase)</h3>
              <p className="mt-1 text-zinc-700">
                Si vous créez un compte, vos données de connexion (adresse email) et vos données financières synchronisées
                sont stockées sur les serveurs de <strong>Supabase</strong>, hébergés dans la <strong>région Paris (UE)</strong>.
                Supabase agit en qualité de sous-traitant au sens du RGPD. Les données restent dans l&apos;Union européenne.
              </p>
              <p className="mt-2 text-zinc-700">
                Vous pouvez demander la suppression de votre compte et de vos données à tout moment en nous contactant
                par email.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="font-semibold text-zinc-900">Traceurs et publicité</h3>
              <p className="mt-1 text-zinc-700">
                CapitalPilot <strong>n&apos;utilise pas de traceurs publicitaires</strong>, de cookies de ciblage
                ni d&apos;outils de tracking tiers (Google Analytics, Facebook Pixel, etc.).
                Aucune donnée n&apos;est transmise à des régies publicitaires.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="font-semibold text-zinc-900">Vos droits (RGPD)</h3>
              <p className="mt-1 text-zinc-700">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés,
                vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité, d&apos;effacement et
                d&apos;opposition sur vos données personnelles.
              </p>
              <p className="mt-2 text-zinc-700">
                Pour exercer ces droits, contactez-nous à{" "}
                <a href="mailto:capitalpilot.contact@gmail.com" className="text-blue-600 hover:text-blue-800 underline">
                  capitalpilot.contact@gmail.com
                </a>.
                En cas de réclamation, vous pouvez saisir la{" "}
                <strong>Commission Nationale de l&apos;Informatique et des Libertés (CNIL)</strong> —{" "}
                <span className="text-zinc-500">www.cnil.fr</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Navigation ── */}
        <div className="mt-12 flex gap-4">
          <Link href="/" className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
            ← Accueil
          </Link>
          <Link href="/avertissement" className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
            Avertissement légal →
          </Link>
        </div>
      </div>
    </main>
  );
}
