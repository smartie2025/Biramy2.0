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
            <h1 className="text-2xl font-bold mb-3">Try On</h1>

            {/* Dropdown */}
            <AssetDropdown category={category} onSelect={setSelected} />

            {/* MAIN AREA: Camera + Panel */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                {/* Left: AR Try-On */}
                <FaceTryOn selectedOverlay={selected} category={category} />

                {/* Right: Layers Panel */}
                <TryOnPanel />
            </div>

            {/* Bottom Tabs */}
            <div className="mt-6">
                <CategoryTabs value={category} onChange={setCategory} />
            </div>
        </main>
    );
}