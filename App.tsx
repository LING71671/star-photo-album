import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene.tsx';
import Overlay from './components/Overlay.tsx';
import HandController from './components/HandController.tsx';

function App() {
  return (
    <div className="w-full h-screen relative bg-black">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        dpr={[1, 2]} // Optimization for varying screens
        // Lower tone mapping exposure to prevent the whiteout effect
        gl={{ antialias: false, toneMapping: 1, toneMappingExposure: 1.0 }} 
      >
        <Scene />
      </Canvas>

      {/* UI & Logic */}
      <Overlay />
      <HandController />
    </div>
  );
}

export default App;