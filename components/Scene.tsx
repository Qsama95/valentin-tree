/// <reference types="@react-three/fiber" />
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Float, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { LuxuryTree } from './LuxuryTree';
import * as THREE from 'three';
import { TransformState } from '../types';
import { LOVE_RED, ROSE_GOLD, BLUSH_PINK, FRAME_DATA } from '../constants';

interface SceneProps {
  transformRef: any;
  photos: typeof FRAME_DATA;
}

export const Scene = ({ transformRef, photos }: SceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current && transformRef.current) {
        const { position, scale, treeState } = transformRef.current;
        const isGallery = treeState === 'GALLERY';
        const lerpFactor = isGallery ? 0.12 : 0.08;
        
        // Rotation is now handled inside LuxuryTree to allow splitting 
        // tree rotation and photo rotation independently.
        
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], lerpFactor);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], lerpFactor);
        
        const s = THREE.MathUtils.lerp(groupRef.current.scale.x, scale, lerpFactor);
        groupRef.current.scale.set(s, s, s);
    }
  });

  const isGallery = transformRef.current?.treeState === 'GALLERY';

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={45} />
      
      <color attach="background" args={['#050001']} />
      <fog attach="fog" args={['#050001', 5, 25]} />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={2000} 
        factor={3} 
        saturation={0.5} 
        fade 
        speed={0.4} 
      />
      
      <Environment preset="night" environmentIntensity={0.5} />
      <ambientLight intensity={0.3} color="#200000" />
      
      <spotLight 
        position={[5, 10, 5]} 
        angle={0.3} 
        penumbra={1} 
        intensity={15} 
        castShadow 
        color={BLUSH_PINK} 
      />
      
      <spotLight position={[-5, 5, -5]} intensity={8} color="#400010" angle={0.5} />
      <pointLight position={[0, -2, 3]} intensity={3} color={ROSE_GOLD} distance={10} />

      <Float 
        speed={isGallery ? 0.05 : 1.2} 
        rotationIntensity={isGallery ? 0.005 : 0.05} 
        floatIntensity={isGallery ? 0.005 : 0.05}
      >
        <group ref={groupRef}>
          <LuxuryTree transformRef={transformRef} photoData={photos} />
        </group>
      </Float>

      <ContactShadows 
        opacity={0.6} 
        scale={15} 
        blur={3} 
        far={5} 
        resolution={256} 
        color="#200000" 
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.5} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.8}
        />
        <Noise opacity={0.015} />
        <Vignette eskil={false} offset={0.15} darkness={1.0} />
      </EffectComposer>
    </>
  );
};