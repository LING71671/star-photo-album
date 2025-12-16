import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store.ts';

const Overlay: React.FC = () => {
  const { addPhotoToCurrentAlbum, mode, gesture, albums, currentAlbumIndex, selectedPhotoId, deletePhoto, exitSingularity } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const currentAlbum = albums[currentAlbumIndex];
  const selectedPhoto = currentAlbum.photos.find(p => p.id === selectedPhotoId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addPhotoToCurrentAlbum(url);
    }
  };

  useEffect(() => {
    let msg = "";
    if (mode === 'VORTEX') msg = "GRAVITY WELL FORMED";
    if (mode === 'BIG_BANG') msg = "EXPANSION DETECTED";
    if (mode === 'SINGULARITY') msg = "QUANTUM FOCUS LOCKED";
    if (mode === 'WARP') msg = "WARP DRIVE ENGAGED";
    
    setStatusMsg(msg);
    const t = setTimeout(() => setStatusMsg(""), 2500);
    return () => clearTimeout(t);
  }, [mode]);

  const cursorLeft = `${(gesture.handPosition.x + 1) * 50}%`;
  const cursorTop = `${(gesture.handPosition.y + 1) * 50}%`;

  let cursorColor = "border-white";
  let cursorScale = "scale-100";
  
  if (gesture.isPinching) {
    cursorColor = "border-green-400 bg-green-400/30";
    cursorScale = "scale-75";
  } else if (gesture.isFist) {
    cursorColor = "border-purple-500 bg-purple-500/30";
    cursorScale = "scale-125";
  } else if (gesture.isOpenPalm) {
    cursorColor = "border-yellow-400";
    cursorScale = "scale-110";
  } else if (gesture.isVictory) {
    cursorColor = "border-cyan-400 bg-cyan-400/30 animate-pulse";
    cursorScale = "scale-125";
  }

  // --- SINGULARITY HUD (View Mode) ---
  if (mode === 'SINGULARITY' && selectedPhoto) {
      return (
        <div className="absolute inset-0 z-10 p-8 flex flex-col justify-between pointer-events-none">
             {/* Hand Cursor */}
            <div 
                className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-100 ease-out -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,255,255,0.5)] z-50 flex items-center justify-center ${cursorColor} ${cursorScale}`}
                style={{ left: cursorLeft, top: cursorTop, opacity: (gesture.handPosition.x === 0 && gesture.handPosition.y === 0) ? 0 : 0.8 }}
            >
                <div className="w-1 h-1 bg-white rounded-full" />
            </div>

            {/* Top Bar */}
            <div className="flex justify-between items-center bg-black/50 backdrop-blur-md p-4 rounded-xl border-b border-white/20 pointer-events-auto">
                <div>
                     <h2 className="text-3xl font-['Orbitron'] text-white">{selectedPhoto.title || "MEMORY FRAGMENT"}</h2>
                     <p className="text-blue-300 font-['Rajdhani'] tracking-widest text-sm">ARCHIVE ID: {selectedPhoto.id}</p>
                </div>
                <button 
                    onClick={exitSingularity}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold border border-white/20 transition-all"
                >
                    CLOSE X
                </button>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-center gap-4 pointer-events-auto">
                <button 
                    onClick={() => {
                        if (window.confirm("Delete this memory?")) {
                            deletePhoto(selectedPhoto.id);
                        }
                    }}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 px-8 py-3 rounded-xl font-['Orbitron'] tracking-widest transition-all"
                >
                    DELETE MEMORY
                </button>
            </div>
        </div>
      );
  }

  // --- MAIN HUD ---
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-8 overflow-hidden">
      
      {/* Hand Cursor */}
      <div 
        className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-100 ease-out -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(255,255,255,0.5)] z-50 flex items-center justify-center ${cursorColor} ${cursorScale}`}
        style={{ left: cursorLeft, top: cursorTop, opacity: (gesture.handPosition.x === 0 && gesture.handPosition.y === 0) ? 0 : 0.8 }}
      >
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold font-['Orbitron'] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
            MULTIVERSE GALLERY
          </h1>
          <div className="mt-2 flex items-center gap-4">
            <p className="text-blue-200 text-opacity-80 font-['Rajdhani'] text-lg tracking-widest">
              SYSTEM: <span className={mode === 'WARP' ? 'text-white blur-sm' : 'text-cyan-400'}>{currentAlbum.name}</span>
            </p>
            <div className="h-2 w-24 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                 <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((currentAlbumIndex + 1) / albums.length) * 100}%`}}></div>
            </div>
          </div>
        </div>
        
        <div className="pointer-events-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-900/40 border border-blue-500 text-blue-300 px-4 py-2 rounded hover:bg-blue-800/60 transition-colors backdrop-blur-md"
          >
            + UPLOAD TO SYSTEM
          </button>
        </div>
      </header>

      {/* Center Status Message */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-opacity duration-500 ${statusMsg ? 'opacity-100' : 'opacity-0'}`}>
         <h2 className="text-3xl font-['Orbitron'] text-white tracking-[0.5em] drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{statusMsg}</h2>
      </div>

      {/* Instructions */}
      <div className="flex flex-col items-center gap-4 text-center">
         <div className="flex gap-8 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div className={`transition-all duration-300 ${gesture.isFist ? 'scale-125 opacity-100 text-purple-400' : 'opacity-40'}`}>
                <div className="text-2xl mb-1">✊</div>
                <div className="text-xs uppercase tracking-wider">Reset</div>
            </div>
            <div className={`transition-all duration-300 ${gesture.isOpenPalm ? 'scale-125 opacity-100 text-yellow-400' : 'opacity-40'}`}>
                <div className="text-2xl mb-1">🖐️</div>
                <div className="text-xs uppercase tracking-wider">Expand</div>
            </div>
            <div className={`transition-all duration-300 ${gesture.isPinching ? 'scale-125 opacity-100 text-green-400' : 'opacity-40'}`}>
                <div className="text-2xl mb-1">👌</div>
                <div className="text-xs uppercase tracking-wider">View</div>
            </div>
             <div className={`transition-all duration-300 ${gesture.isVictory ? 'scale-125 opacity-100 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'opacity-40'}`}>
                <div className="text-2xl mb-1">✌️</div>
                <div className="text-xs uppercase tracking-wider">Warp</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Overlay;