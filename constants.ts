
// 3D Visual Constants - Valentine Luxury Theme
export const BG_COLOR = "#050001"; // Deepest Ruby Black
export const LOVE_RED = "#8b0000"; // Royal Ruby
export const ROSE_GOLD = "#b76e79"; 
export const BLUSH_PINK = "#ffb7c5";
export const DIAMOND_WHITE = "#ffffff";
export const GOLD_COLOR = "#D4AF37"; // Metallic Gold

// Tree specific colors
export const TREE_COLOR_BASE = "#0a2f1f"; 
export const SHIMMER_COLOR = "#ffffff";

// Interaction Thresholds
export const PINCH_RATIO = 0.5;
export const FIST_RATIO = 1.6;
export const PALM_RATIO = 1.2;

// Movement Multipliers
export const ROTATION_SPEED = 4.5;
export const PAN_SPEED = 4.0;
export const ZOOM_SPEED = 3.0;

/**
 * Default Photo Data pointing to local /photos directory.
 * Assuming naming convention: /photos/1.jpg, /photos/2.jpg, etc.
 * We define 12 slots for a rich, balanced distribution on the tree.
 */
export const FRAME_DATA = [
    { url: "/photos/1.jpg", y: -0.8, angle: 0 },
    { url: "/photos/2.jpg", y: -0.6, angle: 1.05 },
    { url: "/photos/3.jpg", y: -0.4, angle: 2.1 },
    { url: "/photos/4.jpg", y: -0.2, angle: 3.15 },
    { url: "/photos/5.jpg", y: 0.0, angle: 4.2 },
    { url: "/photos/6.jpg", y: 0.2, angle: 5.25 },
    { url: "/photos/7.jpg", y: 0.4, angle: 0.5 },
    { url: "/photos/8.jpg", y: 0.6, angle: 1.55 },
    { url: "/photos/9.jpg", y: 0.8, angle: 2.6 },
    { url: "/photos/10.jpg", y: -0.7, angle: 3.7 },
    { url: "/photos/11.jpg", y: -0.3, angle: 4.8 },
    { url: "/photos/12.jpg", y: 0.1, angle: 5.8 }
];
