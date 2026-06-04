import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-500">
            <div className="flex flex-col items-center justify-center gap-2">
                <p>
                    © {new Date().getFullYear()} BIRAMY Galaxy{" "}
                    <span aria-hidden="true">✦</span> Made with starlight ✨
                </p>

                <nav className="flex flex-wrap items-center justify-center gap-3">
                    <Link href="/disclaimer" className="hover:text-slate-900">
                        Disclaimer
                    </Link>

                    <span aria-hidden="true" className="text-slate-300">
                        ✧
                    </span>

                    <Link href="/privacy" className="hover:text-slate-900">
                        Privacy Policy
                    </Link>

                    <span aria-hidden="true" className="text-slate-300">
                        ✧
                    </span>

                    <Link href="/terms" className="hover:text-slate-900">
                        Terms of Use
                    </Link>

                    <span className="text-slate-400">
                        AR previews are approximate. Product details and availability may vary.
                    </span>
                </nav>
            </div>
        </footer>
    );
}