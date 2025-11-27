// components/marketing/Navbar.tsx
import Link from "next/link";

export default function NavBar() {
  return (
    <header className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-6xl h-16 flex items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-400 text-white text-xs">✦</span>
          <span className="font-semibold tracking-tight text-slate-900">BIRAMY</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm text-slate-600">
          <Link href="#features" className="hover:text-slate-900">FEATURES</Link>
          <Link href="#how" className="hover:text-slate-900">HOW IT WORKS</Link>
          <Link href="#collections" className="hover:text-slate-900">COLLECTIONS</Link>
        </nav>

        <Link
          href="/tryon"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
        >
          LAUNCH STUDIO
        </Link>
      </div>
    </header>
  );
}
