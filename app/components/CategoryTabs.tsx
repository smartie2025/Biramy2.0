"use client";

export type Category =
    | "glasses"
    | "earrings"
    | "rings"
    | "necklaces"
    | "bracelets"
    | "sunglasses"
    | "hats"
    | "scarves"
    | "watches";

type Props = {
    value: Category;
    onChange: (c: Category) => void;
};

const TABS: { key: Category; label: string }[] = [
    { key: "glasses", label: "Glasses" },
    { key: "earrings", label: "Earrings" },
    { key: "rings", label: "Rings" },
    { key: "necklaces", label: "Necklaces" },
    { key: "bracelets", label: "Bracelets" },
    { key: "sunglasses", label: "Sunglasses" },
    { key: "hats", label: "Hats" },
    { key: "scarves", label: "Scarves" },
    { key: "watches", label: "Watches" },
];

export default function CategoryTabs({ value, onChange }: Props) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-lg gap-1 overflow-x-auto px-2 py-2">
                {TABS.map((t) => {
                    const active = t.key === value;
                    return (
                        <button
                            key={t.key}
                            onClick={() => onChange(t.key)}
                            className={[
                                "shrink-0 rounded-full px-3 py-2 text-sm",
                                active
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                            ].join(" ")}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}