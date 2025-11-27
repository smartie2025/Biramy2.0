// components/marketing/Hero.tsx
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
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 grid md:grid-cols-2 gap-12 items-start">
        {/* LEFT: copy */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            THE FUTURE OF FASHION AR
          </div>

          <h1 className="text-6xl md:text-7xl font-light tracking-tight leading-tight">
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

          {/* CTA buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/tryon"
              className="px-6 py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              START YOUR AR EXPERIENCE →
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-50 transition"
            >
              WATCH DEMO
            </Link>
          </div>

          {/* Metrics */}
          <div className="mt-10 flex gap-10 text-slate-600">
            <Stat value="500K+" label="ACTIVE USERS" />
            <Stat value="10K+" label="LUXURY PIECES" />
            <Stat value="4.9★" label="APP RATING" />
          </div>
        </div>

        {/* RIGHT: device mock */}
        <div className="relative">
          <div className="mx-auto w-full max-w-[520px] rounded-[2rem] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-rose-100 to-orange-100 p-6 aspect-[9/16] relative overflow-hidden">
              {/* status bar */}
              <div className="absolute left-6 top-4 text-[10px] text-slate-500">
                9:41
              </div>
              <div className="absolute right-6 top-5 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>

              {/* center text */}
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-slate-600/90">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-slate-500 shadow">
                      📷
                    </span>
                  </div>
                  <div className="mt-4 text-xs tracking-wide text-slate-600">
                    EDITORIAL AR PREVIEW
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Multi-layer mode active
                  </div>
                </div>
              </div>

              {/* bottom controls */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button
                  aria-label="Layers"
                  className="h-10 w-10 rounded-full bg-white shadow border border-slate-100"
                />
                {/* MAIN CAMERA BUTTON → go to /tryon */}
                <button
                  aria-label="Capture"
                  onClick={() => router.push("/tryon")}
                  className="h-12 w-12 rounded-full shadow border border-transparent bg-gradient-to-br from-orange-400 to-rose-400"
                />
                <button
                  aria-label="Share"
                  className="h-10 w-10 rounded-full bg-white shadow border border-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Look of the Day strip */}
      <div className="border-t border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between">
          <div>
            <div className="text-3xl md:text-4xl font-light tracking-tight">
              ✦ LOOK OF THE DAY
            </div>
            <div className="text-stone-600">
              Curated by our editorial team
            </div>
          </div>
          <Link
            href="#"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            VIEW ALL LOOKS →
          </Link>
        </div>
      </div>
    </section>
  );
}
