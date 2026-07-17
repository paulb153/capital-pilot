"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalDataToSupabase } from "@/lib/migration";

// Composant monté dans le layout racine.
// Déclenche silencieusement la migration localStorage → Supabase dès que
// l'utilisateur est connecté. Affiche un indicateur discret pendant l'opération.
// Erreurs : loggées, jamais bloquantes — la migration sera retentée à la
// prochaine visite grâce à l'absence du marqueur.

export default function MigrationRunner() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function run() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setRunning(true);
      try {
        await migrateLocalDataToSupabase(supabase, user.id);
      } catch (err) {
        console.error(
          "[MigrationRunner] Migration échouée, nouvelle tentative à la prochaine visite.",
          err,
        );
      } finally {
        setRunning(false);
      }
    }

    run();
  }, []);

  if (!running) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="mt-3 bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-md text-xs text-zinc-500 flex items-center gap-2 pointer-events-auto">
        <span
          className="inline-block h-3 w-3 rounded-full border-2 border-zinc-200 border-t-blue-500 animate-spin"
          aria-hidden="true"
        />
        Synchronisation de tes données…
      </div>
    </div>
  );
}
