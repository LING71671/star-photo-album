export type AppMode = 'VORTEX' | 'BIG_BANG' | 'SINGULARITY' | 'WARP';

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  title?: string;
}

export interface Album {
  id: string;
  name: string;
  themeColor: string; // Hex color for the galaxy
  photos: PhotoData[];
}

export interface HandGesture {
  isFist: boolean;
  isOpenPalm: boolean;
  isPinching: boolean;
  isVictory: boolean; // New gesture for switching albums
  handPosition: { x: number; y: number }; // Normalized -1 to 1
  pinchDistance: number;
}