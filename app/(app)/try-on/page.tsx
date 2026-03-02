"use client";

import { useState } from "react";
import FaceTryOn from "../../components/FaceTryOn";
import AssetDropdown, { type OverlayItem } from "../../components/AssetDropdown";
import CategoryTabs, { type Category } from "../../components/CategoryTabs";
export default function Page() {
    const [category, setCategory] = useState<Category>("glasses");
    const [selected, setSelected] = useState<OverlayItem | null>(null);

    return (
        <main className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-3">Try On</h1>

            <AssetDropdown category={category} onSelect={setSelected} />

            <div className="mt-4">
                <FaceTryOn selectedOverlay={selected} category={category} />
            </div>

            <CategoryTabs value={category} onChange={setCategory} />
        </main>
    );
}