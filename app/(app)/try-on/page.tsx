"use client";

import { useState } from "react";
import FaceTryOn from "../../components/FaceTryOn";
import AssetDropdown, { type OverlayItem } from "../../components/AssetDropdown";
import CategoryTabs, { type Category } from "../../components/CategoryTabs";
import TryOnPanel from "../../components/TryOnPanel";

export default function Page() {
    const [category, setCategory] = useState<Category>("glasses");
    const [selected, setSelected] = useState<OverlayItem | null>(null);

    return (
        <main className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">Try On</h1>

            {/* 🔥 Category at the TOP */}
            <div className="mb-4">
                <CategoryTabs value={category} onChange={setCategory} />
            </div>

            {/* 🎯 Dropdown */}
            <div className="mb-4">
                <AssetDropdown category={category} onSelectAction={setSelected} />
            </div>

            {/* 💫 Main layout */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">

                {/* LEFT SIDE: Camera + Button */}
                <div className="space-y-6">
                    <FaceTryOn selectedOverlay={selected} />

                    {/* 💎 Luxury Button */}
                    <button
                        type="button"
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.01] hover:from-emerald-500 hover:to-teal-400 transition-all duration-200"
                    >
                        ✨ Shop This Look
                    </button>
                </div>

                {/* RIGHT SIDE: Panel */}
                <TryOnPanel />
            </div>
        </main>
    );
}