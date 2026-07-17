// Route handler de callback OAuth / Magic Link.
// Supabase redirige ici après authentification (Google ou lien e-mail).
// Le paramètre `code` (flux PKCE) est échangé contre une session HTTP,
// puis l'utilisateur est redirigé vers l'application.

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/connexion?erreur=1", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/connexion?erreur=1", request.url));
  }

  return NextResponse.redirect(new URL("/suivi", request.url));
}
