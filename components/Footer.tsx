import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-100 py-5 px-6 text-center text-xs text-zinc-400">
      <Link href="/mentions-legales" className="transition-colors hover:text-zinc-600">
        Mentions légales
      </Link>
      {" · "}
      <Link href="/avertissement" className="transition-colors hover:text-zinc-600">
        Avertissement
      </Link>
      {" · "}
      © CapitalPilot 2026
    </footer>
  );
}
