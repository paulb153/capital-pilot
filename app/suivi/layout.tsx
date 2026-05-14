import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon point — CapitalPilot",
};

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
