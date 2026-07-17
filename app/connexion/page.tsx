// Page de connexion CapitalPilot.
// Propose deux modes : Google OAuth et Magic Link (lien e-mail).
// Le callback après authentification passe par /auth/callback.

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading-google" | "loading-magic" | "sent" | "error";

// ── Formulaire — doit être dans un <Suspense> car useSearchParams() le requiert ──

function ConnexionForm() {
  const searchParams = useSearchParams();
  const hasCallbackError = searchParams.get("erreur") === "1";

  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const busy = status === "loading-google" || status === "loading-magic";

  async function handleGoogle() {
    setStatus("loading-google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
    // Si succès : le navigateur est redirigé, rien d'autre à faire.
  }

  async function handleMagicLink(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading-magic");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  // ── État : lien envoyé ──
  if (status === "sent") {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">
          Vérifie ta boîte mail
        </h2>
        <p className="text-sm text-zinc-500">
          Un lien de connexion a été envoyé à{" "}
          <span className="font-medium text-zinc-700">{email}</span>.
        </p>
        <p className="text-xs text-zinc-400 mt-3">
          Le lien expire dans 10 minutes. Vérifie aussi les spams.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Erreur renvoyée par le callback OAuth */}
      {hasCallbackError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          La connexion a échoué. Réessaie ou utilise le lien par e-mail.
        </div>
      )}

      {/* Erreur locale (réseau, quota, etc.) */}
      {status === "error" && errorMessage && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Bouton Google */}
      <button
        onClick={handleGoogle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        {status === "loading-google" ? "Redirection…" : "Continuer avec Google"}
      </button>

      {/* Séparateur */}
      <div className="flex items-center gap-3 my-5">
        <hr className="flex-1 border-zinc-200" />
        <span className="text-xs text-zinc-400">ou</span>
        <hr className="flex-1 border-zinc-200" />
      </div>

      {/* Magic Link */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-zinc-700 mb-1.5"
          >
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="toi@exemple.fr"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading-magic"
            ? "Envoi en cours…"
            : "Recevoir un lien de connexion"}
        </button>
      </form>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConnexionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}
          >
            <span className="text-sm font-bold text-white">CP</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 text-center mb-1">
          Connexion
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-8">
          Accède à ton tableau de bord financier
        </p>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <Suspense fallback={null}>
            <ConnexionForm />
          </Suspense>
        </div>

        <p className="text-xs text-zinc-400 text-center mt-6">
          En continuant, tu acceptes les conditions d&apos;utilisation.
        </p>
      </div>
    </div>
  );
}
