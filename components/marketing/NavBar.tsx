// components/marketing/Navbar.tsx
import Link from "next/link";

export default function NavBar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-400 text-xs text-white">
                        ✦
                    </span>
                    <span className="font-semibold tracking-tight text-slate-900">
                        BIRAMY
                    </span>
                </Link>

                <nav className="hidden items-center gap-10 text-sm text-slate-600 md:flex">
                    <Link href="#features" className="hover:text-slate-900">
                        FEATURES
                    </Link>
                    <Link href="#how" className="hover:text-slate-900">
                        HOW IT WORKS
                    </Link>
                    <Link href="#collections" className="hover:text-slate-900">
                        COLLECTIONS
                    </Link>
                    <Link href="/closet" className="hover:text-slate-900">
                        MY CLOSET
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/closet"
                        className="hidden rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 sm:inline-flex"
                    >
                        MY CLOSET
                    </Link>

                    <Link
                        href="/try-on"
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
                    >
                        TRY ON
                    </Link>

                    <Link
                        href="/tryon"
                        className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 lg:inline-flex"
                    >
                        LAUNCH STUDIO
                    </Link>
                </div>
            </div>
        </header>
    );
}
