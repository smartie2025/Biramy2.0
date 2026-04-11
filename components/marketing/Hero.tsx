"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">
                {label}
            </div>
        </div>
    );
}

export default function Hero() {
    const router = useRouter();

    return (
        <section className="bg-gradient-to-br from-rose-50 to-orange-50">
            <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 pt-16 pb-24 md:grid-cols-2">
                {/* LEFT: copy */}
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        THE FUTURE OF FASHION AR
                    </div>

                    <h1 className="text-6xl font-light leading-tight tracking-tight md:text-7xl">
                        TRY IT.
                        <br />
                        <span className="italic text-slate-900/90">LAYER IT.</span>
                        <br />
                        SHARE IT.
                    </h1>

                    <p className="mt-6 max-w-xl text-[15px] leading-7 text-slate-600">
                        Experience high-end jewellery and accessories in augmented reality.
                        Layer multiple pieces, view yourself in editorial-style layouts, and
                        discover your perfect look before you buy.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4">
                        <Link
                            href="/try-on"
                            className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800"
                        >
                            START YOUR AR EXPERIENCE →
                        </Link>
                        <Link
                            href="/demo"
                            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-900 transition hover:bg-gray-50"
                        >
                            WATCH DEMO
                        </Link>
                    </div>

                    <div className="mt-10 flex gap-10 text-slate-600">
                        <Stat value="500K+" label="ACTIVE USERS" />
                        <Stat value="10K+" label="LUXURY PIECES" />
                        <Stat value="4.9★" label="APP RATING" />
                    </div>
                </div>

                {/* RIGHT: device mock */}
                <div className="relative">
                    <div className="mx-auto w-full max-w-[520px] rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[#f6ede7]">
                            {/* soft luxury base */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.85),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,209,220,0.28),transparent_30%),linear-gradient(135deg,#f7eee8_0%,#f2e5db_48%,#eedfce_100%)]" />

                            {/* editorial image */}
                            <div
                                className="absolute inset-0 opacity-95"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(15,23,42,0.14)), url('/images/look-of-day-editorial.jpg')",
                                    backgroundSize: "cover",
                                    backgroundPosition: "50% 18%",
                                }}
                            />

                            {/* soft top readability wash */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/12 via-transparent to-black/10" />

                            {/* top speaker / notch feel */}
                            <div className="absolute left-1/2 top-3 z-20 h-6 w-32 -translate-x-1/2 rounded-full bg-black/90 shadow-sm" />

                            {/* status */}
                            <div className="absolute left-5 top-5 z-20 text-[10px] font-medium tracking-[0.2em] text-slate-700">
                                9:41
                            </div>
                            <div className="absolute right-5 top-5 z-20 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-600/70" />
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-600/70" />
                                <span className="h-1.5 w-3 rounded-full bg-slate-600/70" />
                            </div>

                            {/* top icons only */}
                            <div className="absolute inset-x-0 top-12 z-20 flex items-center justify-between px-5">
                                <button
                                    aria-label="Back"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[11px] text-slate-700 shadow-sm backdrop-blur"
                                >
                                    ←
                                </button>

                                <div className="w-24" aria-hidden="true" />

                                <button
                                    aria-label="Saved looks"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[11px] text-slate-700 shadow-sm backdrop-blur"
                                >
                                    ♡
                                </button>
                            </div>

                            {/* editorial marks */}
                            <div className="absolute left-6 top-36 z-20">
                                <div className="text-5xl font-light leading-none tracking-tight text-white/92 drop-shadow-sm">
                                    AR
                                </div>
                                <div className="mt-2 text-[10px] uppercase tracking-[0.38em] text-white/82">
                                    editorial preview
                                </div>
                            </div>

                            {/*<div className="absolute right-6 top-34 z-20 text-right">*/}
                            {/*    <div className="text-[10px] uppercase tracking-[0.34em] text-white/85">*/}
                            {/*        LOOK OF THE DAY*/}
                            {/*    </div>*/}
                            {/*    <div className="mt-1 text-xs text-white/78">*/}
                            {/*        Community-selected*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            {/* right side category chips */}
                            <div className="absolute right-5 top-52 z-20 flex flex-col gap-3">
                                <button
                                    aria-label="Glasses"
                                    className="h-10 w-10 rounded-full border border-white/45 bg-white/58 text-[9px] font-medium tracking-[0.14em] text-slate-700/75 shadow-sm backdrop-blur"
                                >
                                    GL
                                </button>
                                <button
                                    aria-label="Earrings"
                                    className="h-10 w-10 rounded-full border border-white/45 bg-white/58 text-[9px] font-medium tracking-[0.14em] text-slate-700/75 shadow-sm backdrop-blur"
                                >
                                    ER
                                </button>
                            </div>
                            {/*<div className="absolute right-5 top-52 z-20 flex flex-col gap-3">*/}
                            {/*    <button*/}
                            {/*        aria-label="Glasses"*/}
                            {/*        className="h-10 w-10 rounded-full border border-white/45 bg-white/58 text-[9px] font-medium tracking-[0.14em] text-slate-700/75 shadow-sm backdrop-blur"*/}
                            {/*    >*/}
                            {/*        GL*/}
                            {/*    </button>*/}
                            {/*    <button*/}
                            {/*        aria-label="Earrings"*/}
                            {/*        className="h-10 w-10 rounded-full border border-white/45 bg-white/58 text-[9px] font-medium tracking-[0.14em] text-slate-700/75 shadow-sm backdrop-blur"*/}
                            {/*    >*/}
                            {/*        ER*/}
                            {/*    </button>*/}
                            {/*    <button*/}
                            {/*        aria-label="Top look"*/}
                            {/*        className="h-10 w-10 rounded-full border border-white/45 bg-white/58 text-[10px] text-slate-700/75 shadow-sm backdrop-blur"*/}
                            {/*    >*/}
                            {/*        ✦*/}
                            {/*    </button>*/}
                            {/*</div>*/}

                            {/* featured copy */}
                            <div className="absolute inset-x-0 bottom-56 z-20 px-6">
                                <div className="max-w-[78%] rounded-[1.6rem] border border-white/50 bg-white/24 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>{/* right side category chips */}
                                            <div className="text-[10px] font-semibold tracking-[0.34em] text-white/88">
                                                LOOK OF THE DAY
                                            </div>
                                            <h3 className="mt-3 text-[30px] font-light leading-[1.02] tracking-tight text-white drop-shadow-sm">
                                                Midnight
                                                <br />
                                                Starlight
                                            </h3>
                                            <p className="mt-3 max-w-[220px] text-sm leading-6 text-white/92">
                                                Rose-gold glasses + moon-drop earrings
                                            </p>
                                        </div>

                                        <div className="shrink-0 rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white shadow-sm">
                                            +25 XP
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <div className="text-[11px] text-white/78">
                                            Selected from today&apos;s top styling energy
                                        </div>

                                        <button
                                            onClick={() => router.push("/try-on?look=midnight-starlight&src=hero")}
                                            className="rounded-full bg-slate-900 px-4 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-white transition hover:bg-slate-800"
                                        >
                                            TRY THE LOOK
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* product rail */}
                            {/*<div className="absolute inset-x-0 bottom-20 z-20 px-4">*/}
                            {/*    <div className="rounded-[1.4rem] border border-white/50 bg-white/52 p-3 shadow-[0_12px_35px_rgba(0,0,0,0.10)] backdrop-blur-md">*/}
                            {/*        <div className="flex items-center gap-3 overflow-hidden">*/}
                            {/*            {["GLASSES", "EARRINGS"].map(*/}
                            {/*                (label) => (*/}
                            {/*                    <div*/}
                            {/*                        key={label}*/}
                            {/*                        className="min-w-[74px] flex-1 rounded-[1rem] border border-white/55 bg-white/52 px-2 py-3 text-center shadow-sm"*/}
                            {/*                    >*/}
                            {/*                        <div className="mx-auto h-8 w-8 rounded-full bg-gradient-to-br from-rose-200/70 via-orange-100/70 to-stone-200/70 shadow-inner" />*/}
                            {/*                        <div className="mt-2 text-[8px] font-medium tracking-[0.14em] text-slate-600/75">*/}
                            {/*                            {label}*/}
                            {/*                        </div>*/}
                            {/*                    </div>*/}
                            {/*                )*/}
                            {/*            )}*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            {/* bottom controls */}
                            {/*<div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-5">*/}
                            {/*    <button*/}
                            {/*        aria-label="Layers"*/}
                            {/*        className="h-11 w-11 rounded-full border border-white/70 bg-white/80 shadow-md backdrop-blur"*/}
                            {/*    />*/}
                            {/*    <button*/}
                            {/*        aria-label="Open Try On"*/}
                            {/*        onClick={() => router.push("/try-on")}*/}
                            {/*        className="h-14 w-14 rounded-full border border-transparent bg-gradient-to-br from-orange-400 to-rose-400 shadow-[0_10px_30px_rgba(251,113,133,0.35)]"*/}
                            {/*    />*/}
                            {/*    <button*/}
                            {/*        aria-label="Share"*/}
                            {/*        className="h-11 w-11 rounded-full border border-white/70 bg-white/80 shadow-md backdrop-blur"*/}
                            {/*    />*/}
                            {/*</div>*/}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}