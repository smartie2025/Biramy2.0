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
        <div className="w-full overflow-x-auto">
            <div className="flex gap-2 min-w-max">
                {TABS.map((t) => {
                    const active = t.key === value;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onChange(t.key)}
                            className={[
                                "shrink-0 rounded-full px-3 py-2 text-sm transition",
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