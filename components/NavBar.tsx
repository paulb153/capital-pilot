"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  {
    href: "/",
    label: "Accueil",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10L10 3L17 10V17H13V13H7V17H3V10Z"
          stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6"
          strokeLinejoin="round" fill={active ? "rgba(37,99,235,0.1)" : "none"} />
      </svg>
    ),
  },
  {
    href: "/diagnostic",
    label: "Diagnostic",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v4M10 13v4M3 10h4M13 10h4" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.5"
          fill={active ? "rgba(37,99,235,0.12)" : "none"} />
      </svg>
    ),
  },
  {
    href: "/resultats",
    label: "Résultats",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="12" width="3" height="5" rx="1"
          fill={active ? "#2563EB" : "#94a3b8"} />
        <rect x="8.5" y="8" width="3" height="9" rx="1"
          fill={active ? "#2563EB" : "#94a3b8"} />
        <rect x="14" y="4" width="3" height="13" rx="1"
          fill={active ? "#2563EB" : "#94a3b8"} />
      </svg>
    ),
  },
  {
    href: "/suivi",
    label: "Mon point",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" />
        <path d="M10 6V10L13 12" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/objectifs",
    label: "Objectifs",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" />
        <circle cx="10" cy="10" r="3.5" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.4" />
        <circle cx="10" cy="10" r="1" fill={active ? "#2563EB" : "#94a3b8"} />
      </svg>
    ),
  },
  {
    href: "/apprendre",
    label: "Apprendre",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 6l7-3 7 3v2c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z"
          stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6"
          strokeLinejoin="round" fill={active ? "rgba(37,99,235,0.1)" : "none"} />
        <path d="M8 10l1.5 1.5L12.5 8" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Icône personne (non connecté)
function IconPerson({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7.5" r="3" stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" />
      <path d="M3.5 17c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"
        stroke={active ? "#2563EB" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function NavBar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const initial = userEmail ? userEmail[0].toUpperCase() : null;
  const isConnexionActive = pathname === "/connexion";

  return (
    <>
      {/* ── Desktop — barre latérale gauche ───────────────────────────── */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-20 flex-col items-center gap-1 border-r border-zinc-100 bg-white py-6 z-40 shadow-[2px_0_12px_rgba(15,23,42,0.04)]">
        {/* Logo */}
        <div className="mb-4">
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
            <span className="text-xs font-bold text-white">CP</span>
          </Link>
        </div>

        {/* Liens de navigation */}
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`group flex flex-col items-center gap-1 rounded-2xl px-2 py-3 w-16 transition ${
                active ? "bg-blue-50" : "hover:bg-zinc-50"
              }`}>
              {icon(active)}
              <span className={`text-[9px] font-medium leading-tight text-center ${
                active ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Indicateur de session — poussé en bas */}
        <div className="mt-auto w-full flex flex-col items-center gap-1 pt-3 border-t border-zinc-100">
          {userEmail ? (
            <>
              {/* Initiale de l'utilisateur */}
              <div
                title={userEmail}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white select-none"
                style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}
              >
                {initial}
              </div>
              <button
                onClick={handleSignOut}
                className="text-[9px] font-medium text-zinc-400 hover:text-red-500 transition-colors leading-tight"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/connexion"
              className={`group flex flex-col items-center gap-1 rounded-2xl px-2 py-3 w-16 transition ${
                isConnexionActive ? "bg-blue-50" : "hover:bg-zinc-50"
              }`}
            >
              <IconPerson active={isConnexionActive} />
              <span className={`text-[9px] font-medium leading-tight text-center ${
                isConnexionActive ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600"
              }`}>
                Connexion
              </span>
            </Link>
          )}
        </div>
      </nav>

      {/* ── Mobile — barre du bas ──────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-100 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-around px-1 py-2 overflow-x-auto">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 flex-shrink-0 transition ${
                  active ? "bg-blue-50" : ""
                }`}>
                {icon(active)}
                <span className={`text-[9px] font-medium leading-tight ${
                  active ? "text-blue-600" : "text-zinc-400"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Indicateur de session mobile */}
          {userEmail ? (
            <button
              onClick={handleSignOut}
              title={`Connecté : ${userEmail} — Appuyer pour se déconnecter`}
              className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 flex-shrink-0 transition"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
                {initial}
              </div>
              <span className="text-[9px] font-medium leading-tight text-zinc-400">
                Déco.
              </span>
            </button>
          ) : (
            <Link
              href="/connexion"
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 flex-shrink-0 transition ${
                isConnexionActive ? "bg-blue-50" : ""
              }`}
            >
              <IconPerson active={isConnexionActive} />
              <span className={`text-[9px] font-medium leading-tight ${
                isConnexionActive ? "text-blue-600" : "text-zinc-400"
              }`}>
                Connexion
              </span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
