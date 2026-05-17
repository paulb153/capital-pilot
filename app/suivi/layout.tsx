import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon patrimoine — CapitalPilot",
};

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
