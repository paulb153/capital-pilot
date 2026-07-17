// Middleware de rafraîchissement de session Supabase.
// S'exécute à chaque requête avant que Next.js ne rende la page.
// Sans ce fichier, les tokens d'accès expirés ne sont pas renouvelés et
// l'utilisateur se retrouve déconnecté de façon aléatoire.
// Ce middleware ne protège PAS les routes — il ne fait que maintenir la session active.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Écrire les cookies mis à jour dans la requête ET dans la réponse
          // garantit que les Server Components voient la session fraîche.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien écrire entre createServerClient et getUser().
  // C'est cet appel qui rafraîchit le token et synchronise les cookies de session.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Toutes les routes sauf fichiers statiques Next.js et images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
