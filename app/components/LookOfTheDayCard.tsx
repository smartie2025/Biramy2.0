import Link from "next/link";
import { LOOK_OF_THE_DAY } from "../lib/lookOfDay";

function formatAssetName(assetId: string) {
    return assetId
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LookOfTheDayCard() {
    return (
        <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(254,243,199,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-100/10 blur-3xl" />
            <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.45em] text-amber-100">
                        Look of the Day
                    </p>

                    <h2 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl">
                        {LOOK_OF_THE_DAY.title}
                    </h2>

                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                        A curated style mission from the BIRAMY Galaxy. Layer the pieces,
                        activate the look, and earn today&apos;s Stardust reward.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {LOOK_OF_THE_DAY.items.map((item) => (
                            <div
                                key={item.assetId}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100"
                            >
                                {formatAssetName(item.assetId)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-100">
                                Editorial Mission
                            </p>

                            <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white">
                                {LOOK_OF_THE_DAY.title}
                            </h3>
                        </div>

                        <div className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
                            +{LOOK_OF_THE_DAY.rewardXp} XP
                        </div>
                    </div>

                    <div className="space-y-3">
                        {LOOK_OF_THE_DAY.items.map((item) => (
                            <div
                                key={`${item.category}-${item.assetId}`}
                                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                            >
                                <p className="text-sm font-semibold text-white">
                                    {formatAssetName(item.assetId)}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                                    {item.category}
                                </p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/try-on?look=${LOOK_OF_THE_DAY.id}`}
                        className="mt-6 block rounded-2xl bg-amber-100 px-5 py-4 text-center text-sm font-bold uppercase tracking-[0.25em] text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-50"
                    >
                        Try the Look
                    </Link>

                    <p className="mt-4 text-center text-sm text-slate-300">
                        Complete today&apos;s look mission to earn {LOOK_OF_THE_DAY.rewardXp} XP.
                    </p>
                </div>
            </div>
        </section>
    );
}