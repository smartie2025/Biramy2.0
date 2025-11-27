import { create } from "zustand";

/** ========== Types ========== */

export type Category =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bracelets"
  | "sunglasses"
  | "watches";

export type OverlayItem = {
  id: string;
  name: string;
  src: string;
  thumb?: string;
};

// Per-layer transform state
export type LayerState = {
  id: string;        // overlay id
  x: number;         // position X
  y: number;         // position Y
  z: number;         // depth factor
  scale: number;     // scale multiplier
  rotation: number;  // radians
  opacity: number;   // 0..1
};

/** ========== Store Shape ========== */

type TryOnState = {
  category: Category | null;
  overlays: Record<Category, OverlayItem[]>;

  // All layers in the scene
  layers: LayerState[];

  // Which layer is selected for editing
  activeLayerId: string | null;

  /** Layer actions */
  addLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string | null) => void;

  /** Modify layer transforms */
  updateLayer: (id: string, patch: Partial<LayerState>) => void;

  /** Remove everything */
  clearAllLayers: () => void;

  /** Catalog actions */
  setCategory: (c: Category | null) => void;
  setOverlays: (c: Category, items: OverlayItem[]) => void;
};

/** ========== Store ========== */

export const useTryOnStore = create<TryOnState>((set, get) => ({
  category: null,

  overlays: {
    rings: [],
    necklaces: [],
    earrings: [],
    bracelets: [],
    sunglasses: [],
    watches: [],
  },

  layers: [],
  activeLayerId: null,

  /** Add layer with default transform values */
  addLayer: (id) =>
    set((s) => ({
      layers: [
        ...s.layers,
        {
          id,
          x: 0,
          y: 0,
          z: 0,
          scale: 1,
          rotation: 0,
          opacity: 0.95,
        },
      ],
      activeLayerId: id,
    })),

  /** Remove layer and clear activeLayer if needed */
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
    })),

  /** Set active layer */
  setActiveLayer: (id) => set({ activeLayerId: id }),

  /** Patch a layer’s transform fields */
  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    })),

  /** Clear all layers */
  clearAllLayers: () => set({ layers: [], activeLayerId: null }),

  /** Category selection */
  setCategory: (c) => set({ category: c }),

  /** Catalog loader */
  setOverlays: (c, items) =>
    set((s) => ({
      overlays: { ...s.overlays, [c]: items },
    })),
}));
