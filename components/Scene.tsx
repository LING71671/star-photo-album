import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useStore } from '../store.ts';
import GalaxyParticles from './GalaxyParticles.tsx';
import MemoryFragments from './MemoryFragments.tsx';
import * as THREE from 'three';

const Scene: React.FC = () => {
  const { mode, cameraRigRotation, albums, currentAlbumIndex } = useStore();
  const controlsRef = useRef<any>(null);
  const galaxyGroupRef = useRef<THREE.Group>(null);

  // Smooth color transition for environment
  const targetColor = new THREE.Color(albums[currentAlbumIndex].themeColor);
  const currentColor = useRef(new THREE.Color(albums[currentAlbumIndex].themeColor));

  // Handle Control State changes
  useEffect(() => {
    if (controlsRef.current) {
      if (mode === 'VORTEX') {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.8;
        controlsRef.current.enableZoom = true;
      } else if (mode === 'BIG_BANG' || mode === 'WARP') {
        controlsRef.current.autoRotate = false;
        controlsRef.current.enableZoom = true;
      } else if (mode === 'SINGULARITY') {
        controlsRef.current.autoRotate = false;
        controlsRef.current.enableZoom = true;
      }
    }
  }, [mode]);

  useFrame((state, delta) => {
    // 1. Color Lerp
    currentColor.current.lerp(targetColor, delta);

    // 2. Hand Pan Logic
    if (galaxyGroupRef.current && mode === 'BIG_BANG') {
       const targetRotX = cameraRigRotation.x * 0.3;
       const targetRotY = cameraRigRotation.y * 0.3;
       
       galaxyGroupRef.current.rotation.x = THREE.MathUtils.lerp(galaxyGroupRef.current.rotation.x, targetRotX, delta * 2);
       galaxyGroupRef.current.rotation.y = THREE.MathUtils.lerp(galaxyGroupRef.current.rotation.y, targetRotY, delta * 2);
    } 
    
    // Reset rotation in other modes
    if (galaxyGroupRef.current && mode !== 'BIG_BANG') {
       galaxyGroupRef.current.rotation.x = THREE.MathUtils.lerp(galaxyGroupRef.current.rotation.x, 0, delta);
       galaxyGroupRef.current.rotation.y = THREE.MathUtils.lerp(galaxyGroupRef.current.rotation.y, 0, delta);
    }
    
    // Warp Camera shake
    if (mode === 'WARP') {
        state.camera.position.x += (Math.random() - 0.5) * 0.1;
        state.camera.position.y += (Math.random() - 0.5) * 0.1;
    }
  });

  return (
    <>
      <color attach="background" args={['#000005']} />
      <fog attach="fog" args={['#000005', 5, 40]} /> 
      
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight 
        position={[0, 0, 0]} 
        intensity={1.5} 
        color={currentColor.current} 
        distance={30} 
        decay={2} 
      />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color={currentColor.current} />

      {/* Main Group */}
      <group ref={galaxyGroupRef}>
        <GalaxyParticles />
        <MemoryFragments />
        <Stars radius={80} depth={20} count={4000} factor={4} saturation={0.8} fade speed={0.5} />
      </group>

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.3} mipmapBlur intensity={0.6} radius={0.4} />
        <Noise opacity={0.04} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>

      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={40}
      />
    </>
  );
};

export default Scene;