import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store.ts';
import { particleVertexShader, particleFragmentShader } from '../shaders.ts';

const COUNT = 5000;
const dummy = new THREE.Object3D();

const GalaxyParticles: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const { mode, albums, currentAlbumIndex } = useStore();
  
  const currentThemeColor = new THREE.Color(albums[currentAlbumIndex].themeColor);

  // Data for positions
  const vortexPositions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const angle = i * 0.1;
      const r = 2 + (i * 0.005);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * 1.5; 
      arr[i*3] = x;
      arr[i*3+1] = y;
      arr[i*3+2] = z;
    }
    return arr;
  }, []);

  const bigBangPositions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      arr[i*3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i*3+2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  // State buffers
  const currentPositions = useMemo(() => new Float32Array(vortexPositions), [vortexPositions]);
  const targetPositions = useRef<Float32Array>(vortexPositions);
  
  // Attributes
  const randoms = useMemo(() => {
    const arr = new Float32Array(COUNT);
    for(let i=0; i<COUNT; i++) arr[i] = Math.random();
    return arr;
  }, []);
  
  const scales = useMemo(() => {
    const arr = new Float32Array(COUNT);
    for(let i=0; i<COUNT; i++) arr[i] = Math.random();
    return arr;
  }, []);

  useEffect(() => {
    if (mode === 'VORTEX') targetPositions.current = vortexPositions;
    else if (mode === 'BIG_BANG' || mode === 'SINGULARITY') targetPositions.current = bigBangPositions;
  }, [mode, vortexPositions, bigBangPositions]);

  useFrame((state, delta) => {
    if (!meshRef.current || !shaderRef.current) return;

    // Update Color Uniform
    if (!shaderRef.current.uniforms.uBaseColor) {
        shaderRef.current.uniforms.uBaseColor = { value: new THREE.Color() };
    }
    
    // Dim color if Singularity
    const targetColor = mode === 'SINGULARITY' 
      ? currentThemeColor.clone().multiplyScalar(0.2) 
      : currentThemeColor;
      
    shaderRef.current.uniforms.uBaseColor.value.lerp(targetColor, delta * 2);

    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Physics Loop
    const speed = mode === 'WARP' ? 0.0 : (mode === 'BIG_BANG' ? 3.0 : 2.0);
    const lerpFactor = THREE.MathUtils.clamp(delta * speed, 0, 1);

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Logic Split
      if (mode === 'WARP') {
          // Warp Speed Effect
          if (currentPositions[iz] > 20) {
              currentPositions[iz] = -50;
              currentPositions[ix] = (Math.random() - 0.5) * 50;
              currentPositions[iy] = (Math.random() - 0.5) * 50;
          }
          currentPositions[iz] += 80 * delta; 
          
      } else {
          // Normal Interp
          currentPositions[ix] += (targetPositions.current[ix] - currentPositions[ix]) * lerpFactor;
          currentPositions[iy] += (targetPositions.current[iy] - currentPositions[iy]) * lerpFactor;
          currentPositions[iz] += (targetPositions.current[iz] - currentPositions[iz]) * lerpFactor;

          // Vortex Spin
          if (mode === 'VORTEX') {
            const rotSpeed = 0.2 * delta;
            const cos = Math.cos(rotSpeed);
            const sin = Math.sin(rotSpeed);
            const nx = currentPositions[ix] * cos - currentPositions[iz] * sin;
            const nz = currentPositions[ix] * sin + currentPositions[iz] * cos;
            currentPositions[ix] = nx;
            currentPositions[iz] = nz;
          }
      }

      dummy.position.set(currentPositions[ix], currentPositions[iy], currentPositions[iz]);
      
      // Scale logic
      let s = scales[i];
      if (mode === 'SINGULARITY') s = s * 0.3; // Make particles smaller in view mode
      if (mode === 'WARP') {
          dummy.scale.set(0.1, 0.1, 8.0); 
      } else {
          dummy.scale.setScalar(s);
      }
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[0.2, 0.2]}>
        <instancedBufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <instancedBufferAttribute attach="attributes-aRandom" args={[randoms, 1]} />
      </planeGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uBaseColor: { value: new THREE.Color('#88ccff') }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default GalaxyParticles;