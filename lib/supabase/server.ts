// Client Supabase côté serveur.
// À utiliser dans les Server Components, les Server Actions et les route handlers (app/api/).
// Lit la session de l'utilisateur depuis les cookies HTTP — ne fonctionne pas dans le navigateur.
// La fonction est async car cookies() de next/headers est une Promise depuis Next.js 15.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll peut être appelé depuis un Server Component où l'écriture
            // de cookies est interdite. Le middleware (middleware.ts) se charge
            // du rafraîchissement effectif de la session.
          }
        },
      },
    },
  );
}
