"use client";

import { useRouter } from "next/navigation";
import { useTryOnStore, type Category } from "../store/tryon";
import { overlayLibrary } from "../lib/overlayLibrary";

export default function ProductGrid() {
  const router = useRouter();
  const { setCategory, setOverlays } = useTryOnStore();

  const categories: { key: Category; label: string; count: string }[] = [
    { key: "rings",      label: "RINGS",      count: "2.4K pieces" },
    { key: "necklaces",  label: "NECKLACES",  count: "3.1K pieces" },
    { key: "earrings",   label: "EARRINGS",   count: "1.8K pieces" },
    { key: "bracelets",  label: "BRACELETS",  count: "1.2K pieces" },
    { key: "sunglasses", label: "SUNGLASSES", count: "890 pieces" },
    { key: "watches",    label: "WATCHES",    count: "650 pieces" },
  ];

  const openCategory = (key: Category) => {
    setCategory(key);
    setOverlays(key, overlayLibrary[key] ?? []);
    router.push("/tryon");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {categories.map((c) => (
        <button
          key={c.key}
          onClick={() => openCategory(c.key)}
          className="rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition flex flex-col items-center"
        >
          <div className="h-14 w-14 mb-3 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
            {c.label[0]}
          </div>
          <div className="text-lg font-semibold">{c.label}</div>
          <div className="text-sm text-gray-500">{c.count}</div>
        </button>
      ))}
    </div>
  );
}
