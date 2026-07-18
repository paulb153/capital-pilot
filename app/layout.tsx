import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import MigrationRunner from "@/components/MigrationRunner";
import { createClient } from "@/lib/supabase/server";
import { readPremiumStatus } from "@/lib/sync";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CapitalPilot",
  description: "Diagnostic financier",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPremium = false;
  if (user) {
    const { isPremium: prem } = await readPremiumStatus(supabase, user.id);
    isPremium = prem;
  }

  return (
    <html lang="fr">
      <body className={plusJakartaSans.className}>
        <NavBar userEmail={user?.email ?? null} isPremium={isPremium} />
        <MigrationRunner />
        <div className="lg:pl-20 pb-16 lg:pb-0">{children}</div>
      </body>
    </html>
  );
}
