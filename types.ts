
export type TreeState = 'CHAOS' | 'FORMED' | 'GALLERY';

export interface TransformState {
  rotationY: number;
  autoRotationSpeed: number; // Persistent rotation speed
  position: [number, number, number];
  scale: number;
  galleryOffset: number;
  handPosition: [number, number]; // [x, y] normalized 0-1
  treeState: TreeState;
  chaosFactor: number; // 0 (Formed) to 1 (Chaos)
  focusedPhotoIndex: number | null; // null means tree mode, number means specific photo focused
}

export enum HandGesture {
  NONE = 'NONE',
  PINCH_RIGHT = 'PINCH_RIGHT', // Next Photo / Rotate
  PINCH_LEFT = 'PINCH_LEFT',   // Prev Photo
  PINCH_BOTH = 'PINCH_BOTH',   // Old Zoom (Legacy)
  PALM_BOTH = 'PALM_BOTH',     // New Zoom: Both hands open, distance controls scale
  FIST_RIGHT = 'FIST_RIGHT',   // Form Tree
  OPEN_PALM_RIGHT = 'OPEN_PALM_RIGHT', // Open Gallery / Chaos
  DOUBLE_PINCH = 'DOUBLE_PINCH', // Focus Photo
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}
