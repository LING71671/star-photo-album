import { create } from 'zustand';
import { AppMode, PhotoData, HandGesture, Album } from './types';
import * as THREE from 'three';

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  albums: Album[];
  currentAlbumIndex: number;
  nextAlbum: () => void;
  addPhotoToCurrentAlbum: (url: string) => void;
  deletePhoto: (id: string) => void;
  
  selectedPhotoId: string | null;
  setSelectedPhotoId: (id: string | null) => void;
  exitSingularity: () => void;

  hoveredPhotoId: string | null;
  setHoveredPhotoId: (id: string | null) => void;

  gesture: HandGesture;
  setGesture: (gesture: HandGesture) => void;

  cameraRigRotation: { x: number; y: number };
  setCameraRigRotation: (rot: { x: number; y: number }) => void;
}

// Generate random photos for a new album
const generateRandomPhotos = (count: number): PhotoData[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: Math.random().toString(36).substr(2, 9),
    url: `https://picsum.photos/seed/${Math.random()}/400/600`, // Placeholder
    position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8],
    rotation: [Math.random() * 0.2, Math.random() * 0.2, 0],
    title: `Memory Fragment #${i + 1}`
  }));
};

export const useStore = create<AppState>((set, get) => ({
  mode: 'VORTEX',
  setMode: (mode) => set({ mode }),

  // Pre-defined albums/galaxies
  albums: [
    {
      id: 'galaxy-1',
      name: 'CYBER NEBULA',
      themeColor: '#00ccff',
      photos: [] // User uploads go here or placeholders
    },
    {
      id: 'galaxy-2',
      name: 'CRIMSON VOID',
      themeColor: '#ff0055',
      photos: generateRandomPhotos(5)
    },
    {
      id: 'galaxy-3',
      name: 'GOLDEN HORIZON',
      themeColor: '#ffaa00',
      photos: generateRandomPhotos(5)
    }
  ],
  currentAlbumIndex: 0,

  nextAlbum: () => {
    const { albums, currentAlbumIndex } = get();
    const nextIndex = (currentAlbumIndex + 1) % albums.length;
    
    // Trigger transition
    set({ mode: 'WARP' });
    
    // Switch data after delay
    setTimeout(() => {
      set({ currentAlbumIndex: nextIndex });
    }, 1000);

    // End warp
    setTimeout(() => {
      set({ mode: 'VORTEX' });
    }, 2500);
  },

  addPhotoToCurrentAlbum: (url) => set((state) => {
    const newAlbums = [...state.albums];
    const album = newAlbums[state.currentAlbumIndex];
    album.photos.push({
      id: Math.random().toString(36).substr(2, 9),
      url,
      position: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8],
      rotation: [Math.random() * 0.5, Math.random() * 0.5, 0],
      title: 'New Memory'
    });
    return { albums: newAlbums };
  }),

  deletePhoto: (id) => set((state) => {
    const newAlbums = state.albums.map((album, index) => {
      if (index === state.currentAlbumIndex) {
        return {
          ...album,
          photos: album.photos.filter(p => p.id !== id)
        };
      }
      return album;
    });
    
    // If deleting selected photo, exit singularity
    let newMode = state.mode;
    let newSelectedId = state.selectedPhotoId;
    if (state.selectedPhotoId === id) {
      newMode = 'BIG_BANG';
      newSelectedId = null;
    }

    return { 
      albums: newAlbums,
      mode: newMode,
      selectedPhotoId: newSelectedId
    };
  }),

  selectedPhotoId: null,
  setSelectedPhotoId: (id) => set({ selectedPhotoId: id }),
  
  exitSingularity: () => set({ 
    mode: 'BIG_BANG', 
    selectedPhotoId: null,
    hoveredPhotoId: null 
  }),

  hoveredPhotoId: null,
  setHoveredPhotoId: (id) => set({ hoveredPhotoId: id }),

  gesture: {
    isFist: false,
    isOpenPalm: false,
    isPinching: false,
    isVictory: false,
    handPosition: { x: 0, y: 0 },
    pinchDistance: 0
  },
  setGesture: (gesture) => set({ gesture }),

  cameraRigRotation: { x: 0, y: 0 },
  setCameraRigRotation: (rot) => set({ cameraRigRotation: rot })
}));