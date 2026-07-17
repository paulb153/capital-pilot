// Client Supabase côté navigateur.
// À utiliser dans les composants "use client" : formulaires de login, boutons,
// tout composant qui s'exécute dans le navigateur.
// NE PAS utiliser dans les Server Components ou les routes API — utiliser server.ts à la place.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
