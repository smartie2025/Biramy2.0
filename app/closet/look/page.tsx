import Link from "next/link";

const LOOK_PREVIEW_IMAGE = "/images/look-of-day-editorial.jpg";

export default function ClosetLookPage() {
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
                            BIRAMY Galaxy
                        </div>

                        <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Garden Party Elegance
                        </h1>

                        <p className="mt-2 font-serif text-lg italic text-amber-100/90">
                            Saved Look · Champagne Garden
                        </p>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            A saved editorial look from your BIRAMY walk-in closet.
                            Full layered-look details will appear here once backend look
                            bundles are ready.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/closet"
                            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:border-amber-100/50 hover:bg-white/10"
                        >
                            ← Back to Closet
                        </Link>

                        <Link
                            href="/try-on?look=midnight-starlight&src=closet"
                            className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-50"
                        >
                            Style Again
                        </Link>
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                            <img
                                src={LOOK_PREVIEW_IMAGE}
                                alt="Garden Party Elegance saved look"
                                className="h-full w-full object-cover opacity-90"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />

                            <div className="absolute left-5 top-5 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                                Saved Look
                            </div>

                            <div className="absolute right-5 top-5 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-950">
                                MVP Preview
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/80">
                                Editorial Look
                            </div>

                            <h2 className="mt-2 font-serif text-3xl font-semibold text-white">
                                Garden Party Elegance
                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                                Elegant afternoon style curated for graceful events and
                                special moments.
                            </p>
                        </div>
                    </article>

                    <aside className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                        <section>
                            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                                Look Summary
                            </div>

                            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Style Type</span>
                                    <span className="font-semibold text-white">
                                        Editorial Look
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Mood</span>
                                    <span className="font-semibold text-amber-100">
                                        Champagne Garden
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-400">Status</span>
                                    <span className="font-semibold text-white">
                                        Saved
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                                Pieces
                            </div>

                            <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-5">
                                <div className="font-serif text-xl font-semibold text-white">
                                    Walk-in closet pieces coming soon.
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Backend look-bundle support will let this page show each
                                    saved item, category, transform, and styling adjustment.
                                </p>
                            </div>
                        </section>

                        <section className="grid gap-3">
                            <Link
                                href="/try-on?look=midnight-starlight&src=closet"
                                className="rounded-2xl bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-50"
                            >
                                Style This Look Again
                            </Link>

                            <Link
                                href="/closet"
                                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-amber-100/50 hover:bg-white/10"
                            >
                                Return to Closet
                            </Link>
                        </section>
                    </aside>
                </section>
            </div>
        </main>
    );
}