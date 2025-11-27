import type { Category, OverlayItem } from '../store/tryon';

// A library of overlays (images, 3D assets, etc.) for each product category.
// You can expand this list with your real assets later.
export const overlayLibrary: Record<Category, OverlayItem[]> = {
  rings: [
    { id: 'r1', name: 'Aurora Halo', src: '/assets/overlays/rings/aurora-halo.png' },
    { id: 'r2', name: 'Starlit Band', src: '/assets/overlays/rings/starlit-band.png' },
  ],
  necklaces: [
    { id: 'n1', name: 'Celestia Drop', src: '/assets/overlays/necklaces/celestia-drop.png' },
    { id: 'n2', name: 'Luna Pendant', src: '/assets/overlays/necklaces/luna-pendant.png' },
  ],
  earrings: [
    { id: 'e1', name: 'Galaxy Studs', src: '/assets/overlays/earrings/galaxy-studs.png' },
  ],
  bracelets: [
    { id: 'b1', name: 'Comet Chain', src: '/assets/overlays/bracelets/comet-chain.png' },
  ],
  sunglasses: [
    { id: 's1', name: 'Solar Ray', src: '/assets/overlays/sunglasses/solar-ray.png' },
  ],
  watches: [
    { id: 'w1', name: 'Orbit Chrono', src: '/assets/overlays/watches/orbit-chrono.png' },
  ],
};
