import { create } from "zustand";

/** ========== Types ========== */

export type Category =
  | "rings"
  | "necklaces"
  | "earrings"
  | "bracelets"
  | "sunglasses"
  | "glasses"
  | "hats"
  | "scarves"
  | "watches";

export type OverlayItem = {
  id: string;      // unique overlay id (e.g. "glasses-1")
  name: string;    // display name
  src: string;     // image URL used on the canvas
  thumb?: string;  // optional thumbnail for picker
};

// Per-layer state for an item placed on the canvas
export type LayerState = {
  id: string;       // overlay id (from OverlayItem.id)
  x: number;        // position X
  y: number;        // position Y
  z: number;        // depth factor (for future Z controls)
  scale: number;    // scale multiplier
  rotation: number; // radians (current system uses radians)
  opacity: number;  // 0..1
};

/** ========== Store Shape ========== */

type TryOnState = {
  // Which catalog category is currently selected in the UI
  category: Category | null;

  // Catalog: which overlays exist in each shopping category
  overlays: Record<Category, OverlayItem[]>;

  // All layers currently placed in the scene
  layers: LayerState[];

  // Which layer we are editing with the transform controls
  activeLayerId: string | null;

  /** Layer actions */
  addLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string | null) => void;

  /** Modify a specific layer’s transform */
  updateLayer: (id: string, patch: Partial<LayerState>) => void;

  /** Remove everything */
  clearAllLayers: () => void;

  /** Catalog actions */
  setCategory: (c: Category | null) => void;
  setOverlays: (c: Category, items: OverlayItem[]) => void;
};

/** ========== Store ========== */
function  getOverlayItemData():any{


return fetch("https://brianyapi.azure-api.net/GetItems", {
                    method: 'GET', // GET is default, but can be specified
                    headers: {
                        'Ocp-Apim-Subscription-Key': '03b624f785954731958df20046afccbc',
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    // Check if the request was successful
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json(); // or .text() if the response is not JSON
                })
                .then(data => {
                    console.log(data); // The data returned from the URL
                        const newOverlayItems: {
                [key in Category]: OverlayItem[];
                        } = { rings: [],
                            necklaces: [],
                            earrings: [],
                            bracelets: [],
                            sunglasses: [],
                            glasses: [],
                            hats: [],
                            scarves: [],
                            watches: []};
                    data.forEach((item: any)=>{
                        item.id=item.name;
                        switch(item.categoryName.trim()){
                            case "Glasses":
                                newOverlayItems.glasses.push(item);
                                break; 
                            case "rings":
                                newOverlayItems.rings.push(item);
                                break;
                            case "Necklace":
                                newOverlayItems.necklaces.push(item);
                                break;
                            case "earrings":
                                newOverlayItems.earrings.push(item);
                                break;
                            case "bracelets":
                                newOverlayItems.bracelets.push(item);
                                break;
                            case "sunglasses":
                                newOverlayItems.sunglasses.push(item);
                                break;
                            case "hats":
                                newOverlayItems.hats.push(item);
                                break;
                            case "HeadPiece":
                            case "Scarf":
                                newOverlayItems.scarves.push(item);
                                break;
                            case "watches":
                                newOverlayItems.watches.push(item);
                                break;
                        }
                    });
                    //setoverlayItems(newOverlayItems);
                    return newOverlayItems;
                });



}
export const useTryOnStore = create<TryOnState>((set, get) => ({
  category: null,

  // 🔴 IMPORTANT: every Category key must exist here
  overlays: {
    rings: [],
    necklaces: [],
    earrings: [],
    bracelets: [],
    sunglasses: [],
    glasses: [],
    hats: [],
    scarves: [],
    watches: [],
  },

/*
    rings: [{
      id: "ring-1",
      name: "Diamond Ring",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\rings",
    },],
    necklaces: [{
      id: "necklace-1",
      name: "Pearl Necklace",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\necklaces",
    },],
    earrings: [ {
      id: "earings",
      name: "earings.png",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\earings",
    },],
    bracelets: [ {
      id: "bracelets-1",
      name: "APM Monaco",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\bracelets",
    },],
    sunglasses: [{
      id: "sunglass-1",
      name: "Aviator Shades",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\sunglasses",
    },],
    glasses: [{
      id: "glasses-1",
      name: "glasses",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\glasses",
    },],
    hats: [ {
      id: "hats-1",
      name: "crown.png",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\hats",
    },],
    scarves: [ {
      id: "scarves-1",
      name: "Classic Glasses",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlaysv\scarves",
    },],
    watches: [{
      id: "watches-1",
      name: "IWC Pilot's watch",
      src: "C:\Users\smart\Desktop\shopping-app-galaxy\Biarmy2.0\public\assets\tryon\overlays\watches",
    },],

    */
  

  layers: [],
  activeLayerId: null,

  /** Add a new layer with default transform values */
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

  /** Remove one layer and clear activeLayerId if it was that one */
  removeLayer: (id) =>
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
    })),

  /** Set which layer is currently controlled by the sliders */
  setActiveLayer: (id) => set({ activeLayerId: id }),

  /** Patch transform fields on a specific layer */
  updateLayer: (id, patch) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    })),

  /** Remove everything from the canvas */
  clearAllLayers: () => set({ layers: [], activeLayerId: null }),

  /** UI: change selected catalog category */
  setCategory: (c) => set({ category: c }),

  /** Load overlays into a catalog category */
  setOverlays: (c, items) =>
    set((s) => ({
      overlays: { ...s.overlays, [c]: items },
    })),
}));

// Load data after store initialization
getOverlayItemData().then((data: Record<Category, OverlayItem[]>) => {
  useTryOnStore.setState({ overlays: data });
});
