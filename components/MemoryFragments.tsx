import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useStore } from '../store.ts';
import { holoFragmentShader, holoVertexShader } from '../shaders.ts';
import { Text } from '@react-three/drei';

// Error Boundary to catch texture loading failures
class TextureErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    console.warn("Texture loading failed:", error);
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface FragmentProps {
  id: string;
  url: string;
  title?: string;
  initialPos: [number, number, number];
}

const Fragment: React.FC<FragmentProps> = ({ id, url, initialPos, title }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const texture = useLoader(THREE.TextureLoader, url, (loader) => {
    loader.crossOrigin = 'Anonymous';
  });

  const { mode, selectedPhotoId, setSelectedPhotoId, gesture, setHoveredPhotoId, setMode, hoveredPhotoId } = useStore();
  const { camera } = useThree();
  
  const isSelected = selectedPhotoId === id;
  const isHovered = hoveredPhotoId === id;

  // Physics Refs
  const targetPos = useRef(new THREE.Vector3(...initialPos));
  const currentPos = useRef(new THREE.Vector3(...initialPos));
  const randomOffset = useRef(Math.random() * 100);
  
  // Glitch effect state
  const glitchRef = useRef(0);

  // Trigger glitch impulse when selected
  useEffect(() => {
    if (isSelected) {
        glitchRef.current = 2.0; // Start strong
    }
  }, [isSelected]);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // --- INTERACTION ---
    if (mode === 'BIG_BANG') {
        const screenPos = currentPos.current.clone().project(camera);
        // Normalize screenPos from -1..1 to 0..1? 
        // No, gesture handPosition is typically computed relative to screen center.
        // Actually handController smoothPos is -1 to 1.
        // Project gives -1 to 1.
        
        // Simple distance check in Normalized Device Coordinates (NDC)
        const dist = Math.sqrt(
            Math.pow(screenPos.x - gesture.handPosition.x, 2) + 
            Math.pow(screenPos.y - gesture.handPosition.y, 2)
        );

        if (dist < 0.2) { // Increased threshold slightly
            if (hoveredPhotoId !== id) setHoveredPhotoId(id);
            if (gesture.isPinching) {
                setSelectedPhotoId(id);
                setMode('SINGULARITY');
            }
        } else {
            if (hoveredPhotoId === id) setHoveredPhotoId(null);
        }
    }

    // --- UNIFORMS & GLITCH DECAY ---
    if (isSelected) {
        // Decay glitch over time
        glitchRef.current = THREE.MathUtils.lerp(glitchRef.current, 0.1, delta * 2);
    } else {
        glitchRef.current = THREE.MathUtils.lerp(glitchRef.current, isHovered ? 0.3 : 0.0, delta * 5);
    }

    materialRef.current.uniforms.uTime.value = time;
    const hoverVal = isSelected ? 0.2 : (isHovered && mode === 'BIG_BANG' ? 0.5 : 0.0);
    materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uHover.value, hoverVal, delta * 10);
    materialRef.current.uniforms.uGlitchStrength.value = glitchRef.current;
    
    // Selected = Pure White glow, Hover = Green, Idle = Cyan/Blue
    const baseColor = new THREE.Color(isSelected ? '#ffffff' : (isHovered ? '#00ff88' : '#4fd4ff'));
    materialRef.current.uniforms.uColor.value.lerp(baseColor, delta * 5);


    // --- POSITIONS ---
    if (mode === 'VORTEX') {
      const angle = time * 0.2 + randomOffset.current;
      const radius = 3 + Math.sin(time + randomOffset.current) * 1;
      targetPos.current.set(
          Math.cos(angle) * radius,
          Math.sin(time * 0.5 + randomOffset.current) * 0.5,
          Math.sin(angle) * radius
      );
    } else if (mode === 'BIG_BANG') {
      targetPos.current.set(
          initialPos[0] * 4 + Math.sin(time * 0.1 + id.charCodeAt(0)), 
          initialPos[1] * 4 + Math.cos(time * 0.1 + id.charCodeAt(0)), 
          initialPos[2] * 4
      );
    } else if (mode === 'SINGULARITY') {
      if (isSelected) {
        // Place right in front of camera
        const offset = new THREE.Vector3(0, 0, -5.5);
        offset.applyQuaternion(camera.quaternion);
        targetPos.current.copy(camera.position).add(offset);
        
        // Strict LookAt to ensure flat facing
        meshRef.current.lookAt(camera.position);
      } else {
        // Push others far away
        targetPos.current.set(initialPos[0] * 30, initialPos[1] * 30, initialPos[2] * 30);
      }
    } else if (mode === 'WARP') {
        targetPos.current.z += delta * 50;
    }

    const smooth = isSelected ? 6 : 2;
    currentPos.current.lerp(targetPos.current, delta * smooth);
    meshRef.current.position.copy(currentPos.current);

    if (!isSelected) {
      meshRef.current.lookAt(camera.position);
    }
  });

  return (
    <group>
        <mesh ref={meshRef}>
        <planeGeometry args={[1.5, 1.5 * (texture.image.height / texture.image.width)]} />
        <shaderMaterial
            ref={materialRef}
            vertexShader={holoVertexShader}
            fragmentShader={holoFragmentShader}
            uniforms={{
            uTime: { value: 0 },
            uTexture: { value: texture },
            uColor: { value: new THREE.Color('#4fd4ff') },
            uHover: { value: 0 },
            uGlitchStrength: { value: 0 }
            }}
            transparent
            side={THREE.DoubleSide}
            depthTest={!isSelected}
        />
        </mesh>
    </group>
  );
};

const MemoryFragments: React.FC = () => {
  const { albums, currentAlbumIndex } = useStore();
  const photos = albums[currentAlbumIndex]?.photos || [];

  return (
    <group>
      {photos.map((photo) => (
        <TextureErrorBoundary key={photo.id}>
          <React.Suspense fallback={null}>
             <Fragment {...photo} initialPos={photo.position} />
          </React.Suspense>
        </TextureErrorBoundary>
      ))}
    </group>
  );
};

export default MemoryFragments;