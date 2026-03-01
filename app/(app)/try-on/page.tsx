"use client";

import { useState } from "react";
import FaceTryOn from "../../components/FaceTryOn";
import AssetDropdown from "../../components/AssetDropdown";

type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

export default function Page() {
    const [selected, setSelected] = useState<OverlayItem | null>(null);

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Try On</h1>

            <AssetDropdown onSelect={setSelected} />

            <div className="mt-2 text-sm opacity-70">
                Selected: {selected ? `${selected.name} (${selected.src})` : "none"}
            </div>

            <div className="mt-4">
                <FaceTryOn selectedOverlay={selected} />
            </div>
        </main>
    );
}