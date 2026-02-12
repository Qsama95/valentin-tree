
import { useMemo, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Instance, Instances, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TREE_COLOR_BASE, GOLD_COLOR, SHIMMER_COLOR } from '../constants';
import { TransformState } from '../types';

interface TreeProps {
    isGalleryOpen: boolean;
    transformRef: any;
}

// --- Basic Shapes & Helpers ---

const TreeLayer = ({ position, scale, radius }: { position: [number, number, number], scale: number, radius: number }) => {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <coneGeometry args={[radius, 1.5, 32]} />
        <meshStandardMaterial 
          color={TREE_COLOR_BASE} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

// --- Decorations (Optimized Segments) ---

const Stocking = () => (
    <group scale={0.15}>
        {/* Leg */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.3, 0.25, 0.8, 10]} />
            <meshStandardMaterial color="#d32f2f" roughness={0.8} />
        </mesh>
        {/* Foot */}
        <mesh position={[0.2, -0.4, 0]} rotation={[0, 0, 0.3]}>
            <capsuleGeometry args={[0.26, 0.5, 4, 8]} />
            <meshStandardMaterial color="#d32f2f" roughness={0.8} />
        </mesh>
        {/* Trim */}
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0.1]}>
             <cylinderGeometry args={[0.32, 0.32, 0.25, 10]} />
             <meshStandardMaterial color="#eeeeee" roughness={1} />
        </mesh>
    </group>
);

const Bell = () => (
    <group scale={0.12}>
        <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.4, 0.5, 12, 1, true]} />
            <meshStandardMaterial color={GOLD_COLOR} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color={GOLD_COLOR} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Clapper */}
        <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#b8860b" />
        </mesh>
    </group>
);

const Bow = () => (
    <group scale={0.15}>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.5]}>
            <torusGeometry args={[0.2, 0.08, 6, 12, Math.PI * 1.5]} />
            <meshStandardMaterial color="#d32f2f" />
        </mesh>
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, -2.6]}>
            <torusGeometry args={[0.2, 0.08, 6, 12, Math.PI * 1.5]} />
            <meshStandardMaterial color="#d32f2f" />
        </mesh>
        <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <meshStandardMaterial color="#b71c1c" />
        </mesh>
    </group>
);

const CandyCane = () => (
    <group scale={0.15}>
        <mesh position={[0, 0.5, 0.25]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.25, 0.08, 12, 16, Math.PI]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.25, -0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.5, 10]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.25, 0, 0]}>
             <cylinderGeometry args={[0.085, 0.085, 0.2, 10]} />
             <meshStandardMaterial color="red" />
        </mesh>
         <mesh position={[0.25, -0.5, 0]}>
             <cylinderGeometry args={[0.085, 0.085, 0.2, 10]} />
             <meshStandardMaterial color="red" />
        </mesh>
    </group>
);

// Generic Spiral Placer for decorations
const DecorationSet = ({ count, type, offset = 0, scaleBase = 1 }: { count: number, type: 'candy' | 'stocking' | 'bell' | 'bow', offset?: number, scaleBase?: number }) => {
    const items = useMemo(() => {
        const arr = [];
        for(let i=0; i<count; i++) {
             // Golden Angle distribution for uniform look
             const phi = Math.PI * (3 - Math.sqrt(5)); 
             const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
             const radius = Math.sqrt(1 - y * y); // sphere
             const theta = phi * i + offset;
             
             // Map to cone shape
             const treeY = (y * 1.2) - 0.2; 
             const treeR = (1.5 - treeY) * 0.45;
             
             const x = Math.cos(theta) * treeR;
             const z = Math.sin(theta) * treeR;
             
             const rot = [0, theta + Math.PI/2, 0];
             // Random wobble
             if (type === 'candy') { rot[0] += 0.2; rot[2] += (Math.random()-0.5); }
             
             arr.push({ pos: [x, treeY, z] as [number, number, number], rot: rot as [number, number, number] });
        }
        return arr;
    }, [count, offset, type]);

    return (
        <group>
            {items.map((item, i) => (
                <group key={i} position={item.pos} rotation={new THREE.Euler(...item.rot)}>
                    {type === 'candy' && <CandyCane />}
                    {type === 'stocking' && <Stocking />}
                    {type === 'bell' && <Bell />}
                    {type === 'bow' && <Bow />}
                </group>
            ))}
        </group>
    );
}

const TopDecorations = () => {
  // Decorations for the very top of the tree (above y=1.0)
  const items = useMemo(() => {
    const pos = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const y = 1.1 + (Math.random() * 0.4); // 1.1 to 1.5
      const r = (1.6 - y) * 0.4;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pos.push({ position: [x, y, z] as [number, number, number], type: i % 2 === 0 ? 'red' : 'gold' });
    }
    return pos;
  }, []);

  return (
    <group>
      {items.map((item, i) => (
        <mesh key={i} position={item.position}>
           <sphereGeometry args={[0.08, 10, 10]} />
           <meshStandardMaterial 
              color={item.type === 'red' ? '#d32f2f' : GOLD_COLOR} 
              metalness={0.8} 
              roughness={0.2}
           />
        </mesh>
      ))}
    </group>
  );
};

const Ornaments = () => {
  const count = 120;
  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2.5) - 1.2; 
      const r = (1.5 - y) * 0.45; 
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      pos.push([x, y, z]);
    }
    return pos;
  }, []);

  return (
    <Instances range={count}>
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial 
        color={GOLD_COLOR} 
        roughness={0.1} 
        metalness={0.9} 
        emissive={GOLD_COLOR}
        emissiveIntensity={0.2}
      />
      {positions.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
};

const RedOrnaments = () => {
  const count = 80;
  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2.5) - 1.2; 
      const r = (1.5 - y) * 0.45; 
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      pos.push([x, y, z]);
    }
    return pos;
  }, []);

  return (
    <Instances range={count}>
      <sphereGeometry args={[0.06, 10, 10]} />
      <meshStandardMaterial 
        color="#d32f2f" 
        roughness={0.1} 
        metalness={0.6} 
        emissive="#500000"
        emissiveIntensity={0.2}
      />
      {positions.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
};

const Star = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.5;
      const scale = 1 + Math.sin(t * 3) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 1.6, 0]}>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color={SHIMMER_COLOR} 
          emissive={GOLD_COLOR}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight distance={3} intensity={2} color={GOLD_COLOR} decay={2} />
    </group>
  );
};

// --- Photos ---

interface FrameConfig { 
    y: number; 
    angle: number; 
    radius: number; 
    url: string; 
}

// Fix: Added optional key to PhotoFrameProps to satisfy strict type checking on JSX attributes
interface PhotoFrameProps {
  config: FrameConfig;
  index: number;
  isGalleryOpen: boolean;
  transformRef: any;
  key?: any;
}

const PhotoFrame = ({ config, index, isGalleryOpen, transformRef }: PhotoFrameProps) => {
  // Use Suspense-friendly texture loading
  const texture = useTexture(config.url);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const frameMatRef = useRef<THREE.MeshStandardMaterial>(null);
  // Removed spotLightRef as requested
  
  const treePos = useMemo(() => new THREE.Vector3(
    Math.sin(config.angle) * config.radius,
    config.y,
    Math.cos(config.angle) * config.radius
  ), [config]);

  const treeRot = useMemo(() => new THREE.Euler(-0.2, config.angle, 0), [config]);

  useFrame((state) => {
    if (!groupRef.current || !transformRef.current) return;

    if (isGalleryOpen) {
        // Gallery Mode
        const galleryOffset = transformRef.current.galleryOffset;
        const relativeIndex = index - galleryOffset;
        const distFromCenter = Math.abs(relativeIndex);
        const isFocused = distFromCenter < 0.6;
        
        const spacing = 1.6;
        const targetX = relativeIndex * spacing;
        const targetZ = 3.6 - (Math.pow(distFromCenter, 1.2) * 0.8); 
        const targetRotY = -relativeIndex * 0.25;
        const targetScale = isFocused ? 1.4 : 0.85;
        const targetY = 0.55;

        const lerpFactor = 0.1;
        
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, lerpFactor);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, lerpFactor); 
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, lerpFactor);

        const currentScale = groupRef.current.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpFactor);
        groupRef.current.scale.set(newScale, newScale, newScale);

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, lerpFactor);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, lerpFactor);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, lerpFactor);
        
        if (materialRef.current) {
            const targetEmissive = isFocused ? 1.2 : 0.1;
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, targetEmissive, 0.1);
            materialRef.current.roughness = THREE.MathUtils.lerp(materialRef.current.roughness, 0.5, 0.1);
        }
        if (frameMatRef.current) {
             const targetColor = isFocused ? new THREE.Color(SHIMMER_COLOR) : new THREE.Color(GOLD_COLOR);
             frameMatRef.current.color.lerp(targetColor, 0.1);
             frameMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(frameMatRef.current.emissiveIntensity, isFocused ? 0.5 : 0, 0.1);
        }

    } else {
        // Tree Mode
        groupRef.current.position.lerp(treePos, 0.08);
        const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.08);
        groupRef.current.scale.set(s,s,s);
        
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, treeRot.x, 0.08);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, treeRot.y, 0.08);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, treeRot.z, 0.08);

        if (materialRef.current) {
            materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, 0, 0.1);
            materialRef.current.roughness = THREE.MathUtils.lerp(materialRef.current.roughness, 0.4, 0.1);
        }
        if (frameMatRef.current) {
            frameMatRef.current.color.lerp(new THREE.Color(GOLD_COLOR), 0.1);
            frameMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(frameMatRef.current.emissiveIntensity, 0, 0.1);
        }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.74, 0.04]} />
        <meshStandardMaterial 
            ref={frameMatRef}
            color={GOLD_COLOR} 
            metalness={0.8} 
            roughness={0.2} 
            emissive={GOLD_COLOR}
            emissiveIntensity={0}
        />
      </mesh>
      
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial 
            ref={materialRef}
            map={texture} 
            color="white"
            emissiveMap={texture}
            emissive="white"
            roughness={0.4}
            metalness={0} 
            envMapIntensity={0}
            emissiveIntensity={0}
            toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// Data moved outside component to prevent texture reloading on re-renders
const frameData = [
    { 
      y: -0.8, 
      angle: 0, 
      radius: 1.25, 
      url: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600&q=80" // Matches 'kiss' theme
    },
    { 
      y: -0.1, 
      angle: (Math.PI * 2) / 3, 
      radius: 1.1, 
      url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80" // Matches 'xi' (festive/happy) theme
    },
    { 
      y: 0.6, 
      angle: (Math.PI * 4) / 3, 
      radius: 0.95, 
      url: "https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?w=600&q=80" // Matches 'lofuten' (snow landscape) theme
    },
];

export const ChristmasTree = ({ isGalleryOpen, transformRef }: TreeProps) => {

  return (
    <group>
      {/* Trunk */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 12]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>

      <TreeLayer position={[0, -1.0, 0]} scale={1.2} radius={1.2} />
      <TreeLayer position={[0, -0.4, 0]} scale={1.1} radius={1.1} />
      <TreeLayer position={[0, 0.2, 0]} scale={1.0} radius={1.0} />
      <TreeLayer position={[0, 0.8, 0]} scale={0.9} radius={0.9} />

      <Ornaments />
      <RedOrnaments />
      <TopDecorations />
      
      {/* Extremely Full Decoration Load */}
      <DecorationSet count={100} type="candy" offset={0} />
      <DecorationSet count={80} type="stocking" offset={2} />
      <DecorationSet count={80} type="bell" offset={4} />
      <DecorationSet count={80} type="bow" offset={1} />
      
      <Star />

      <Suspense fallback={null}>
        {frameData.map((f, i) => (
          <PhotoFrame 
            key={i}
            config={f}
            index={i}
            isGalleryOpen={isGalleryOpen}
            transformRef={transformRef}
          />
        ))}
      </Suspense>

      <Sparkles 
        count={250} 
        scale={6} 
        size={3} 
        speed={0.3} 
        opacity={0.6} 
        color={GOLD_COLOR}
      />
    </group>
  );
};
