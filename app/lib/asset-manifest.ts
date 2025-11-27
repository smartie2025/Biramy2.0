"use client";

export type TryOnCategory = "glasses" | "earrings" | "necklace" | "headpiece";

export type TryOnOverlay = {
  id: string;
  name: string;
  category: TryOnCategory;
  src: string;
  anchor?: "center" | "top-left" | "bottom-center";
  defaultScale?: number;
};

export const OVERLAYS: TryOnOverlay[] = [
  {
    id: "glasses-green-01",
    name: "Green Frames",
    category: "glasses",
    src: "/assets/tryon/overlays/glasses.png",
    anchor: "center",
    defaultScale: 1.1,
  },
  {
    id: "crown-01",
    name: "Crown",
    category: "headpiece",
    src: "/assets/tryon/overlays/crown.png",
    anchor: "center",
    defaultScale: 1.4,
  },
  {
    id: "earrings-pave-01",
    name: "Pavé Drop",
    category: "earrings",
    src: "/assets/tryon/overlays/PaveDropEaringsAPM.png",
    anchor: "center",
    defaultScale: 1,
  },
  // add more from your folder as needed
];

export const CATEGORIES: TryOnCategory[] = [
  "glasses",
  "earrings",
  "necklace",
  "headpiece",
];

export const getOverlayById = (id?: string | null) =>
  OVERLAYS.find((o) => o.id === id) || null;
