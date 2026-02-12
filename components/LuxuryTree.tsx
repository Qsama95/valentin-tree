
/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { GOLD_COLOR, LOVE_RED, ROSE_GOLD, BLUSH_PINK, DIAMOND_WHITE, FRAME_DATA } from '../constants';
import { TransformState } from '../types';

interface LuxuryTreeProps {
    transformRef: any;
    photoData?: any[];
}

// --- Shaders (Petals & Hearts) ---
const petalVertexShader = `
  uniform float uTime;
  uniform float uChaosFactor;
  uniform float uSize;
  
  attribute vec3 formedPosition;
  attribute vec3 chaosPosition;
  attribute float sizeRandom;
  attribute vec3 color;
  
  varying vec3 vColor;
  
  void main() {
    vColor = color;
    float t = smoothstep(0.0, 1.0, uChaosFactor);
    vec3 pos = mix(formedPosition, chaosPosition, t);
    
    // Romantic swaying movement for petals
    float sway = sin(uTime * 0.8 + pos.y) * 0.05 * (1.0 - t);
    pos.x += sway;
    pos.z += cos(uTime * 0.5 + pos.x) * 0.03;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * sizeRandom * (500.0 / -mvPosition.z);
  }
`;

const petalFragmentShader = `
  varying vec3 vColor;
  void main() {
    vec2 coord = 2.0 * gl_PointCoord - 1.0;
    float r = length(coord);
    if (r > 1.0) discard;
    float alpha = 1.0 - smoothstep(0.5, 1.0, r);
    gl_FragColor = vec4(vColor, alpha * 0.8);
  }
`;

// --- Helpers ---
const generateChaosData = (count: number, pushOut: number = 1.0, scaleVar: number = 0.4) => {
    const data = [];
    for(let i=0; i<count; i++) {
        const hVal = Math.sqrt(Math.random()); 
        const y = 1.6 - (hVal * 3.4);
        const maxR = (1.6 - y) * 0.48; 
        const r = maxR * (0.85 + Math.random() * 0.25) * pushOut; 
        const theta = Math.random() * Math.PI * 2;
        data.push({
            formed: new THREE.Vector3(r*Math.cos(theta), y, r*Math.sin(theta)),
            chaos: new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*12, (Math.random()-0.5)*12),
            scale: (0.8 + Math.random() * scaleVar),
            rotSpeed: (Math.random()-0.5) * 0.03,
            initialRot: [Math.random()*Math.PI, Math.random()*Math.PI, 0]
        });
    }
    return data;
};

const AnimatedGroup = ({ data, transformRef, children, baseScale = 1 }: { data: any, transformRef: any, children?: any, baseScale?: number, key?: any }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (ref.current && transformRef.current) {
            const factor = transformRef.current.chaosFactor;
            ref.current.position.lerpVectors(data.formed, data.chaos, factor);
            const s = THREE.MathUtils.lerp(data.scale * baseScale, 0, factor);
            ref.current.scale.set(s,s,s);
            ref.current.rotation.y = data.initialRot[1] + (factor * 5.0) + data.rotSpeed;
        }
    });
    return <group ref={ref}>{children}</group>;
};

const CupidArrowModel = () => (
    <group rotation={[0, 0, Math.PI / 4]} scale={0.6}>
        <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 1, 8]} /><meshStandardMaterial color={GOLD_COLOR} metalness={1} roughness={0} /></mesh>
        <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.05, 0.15, 8]} /><meshStandardMaterial color={GOLD_COLOR} metalness={1} roughness={0} /></mesh>
        <mesh position={[0, -0.4, 0]} rotation={[0,0,0.5]}><boxGeometry args={[0.1, 0.2, 0.01]} /><meshStandardMaterial color={BLUSH_PINK} transparent opacity={0.7} /></mesh>
        <mesh position={[0, -0.4, 0]} rotation={[0,0,-0.5]}><boxGeometry args={[0.1, 0.2, 0.01]} /><meshStandardMaterial color={BLUSH_PINK} transparent opacity={0.7} /></mesh>
    </group>
);

const LoveLetterModel = () => (
    <group scale={0.4}>
        <mesh><boxGeometry args={[0.4, 0.3, 0.02]} /><meshStandardMaterial color="#fdf5e6" roughness={1} /></mesh>
        {/* Fix: Moved rotation from cylinderGeometry to parent mesh */}
        <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
            <meshStandardMaterial color={LOVE_RED} metalness={0.5} roughness={0.2} />
        </mesh>
    </group>
);

const SpecialOrnamentSystem = ({ transformRef }: { transformRef: any }) => {
    const arrowData = useMemo(() => generateChaosData(40, 1.1, 0.2), []);
    const letterData = useMemo(() => generateChaosData(30, 1.05, 0.2), []);
    return (
        <group>
            {arrowData.map((d, i) => <AnimatedGroup key={`arrow-${i}`} data={d} transformRef={transformRef} baseScale={0.3}><CupidArrowModel /></AnimatedGroup>)}
            {letterData.map((d, i) => <AnimatedGroup key={`letter-${i}`} data={d} transformRef={transformRef} baseScale={0.4}><LoveLetterModel /></AnimatedGroup>)}
        </group>
    );
};

const InstanceItem = ({ data, transformRef }: { data: any, transformRef: any, key?: any }) => {
    const ref = useRef<any>(null);
    useFrame(() => {
        if (ref.current && transformRef.current) {
            const factor = transformRef.current.chaosFactor;
            ref.current.position.lerpVectors(data.formed, data.chaos, factor);
            const s = THREE.MathUtils.lerp(data.scale, 0, factor);
            ref.current.scale.set(s,s,s);
            ref.current.rotation.x += data.rotSpeed;
            ref.current.rotation.y += data.rotSpeed;
        }
    });
    return <Instance ref={ref} />;
};

const OrnamentSystem = ({ transformRef }: { transformRef: any }) => {
    const heartCount = 200; const diamondCount = 150; const pearlCount = 400;
    const heartsData = useMemo(() => generateChaosData(heartCount, 1.0), []);
    const diamonds = useMemo(() => generateChaosData(diamondCount, 0.98), []);
    const pearls = useMemo(() => generateChaosData(pearlCount, 1.02, 0.1), []);

    // Classic volumetric heart geometry
    const heartShapeGeometry = useMemo(() => {
        const x = 0, y = 0;
        const shape = new THREE.Shape();
        shape.moveTo(x, y);
        shape.bezierCurveTo(x, y - 0.3, x - 0.6, y - 0.3, x - 0.6, y + 0.2);
        shape.bezierCurveTo(x - 0.6, y + 0.6, x, y + 0.9, x, y + 1.2);
        shape.bezierCurveTo(x, y + 0.9, x + 0.6, y + 0.6, x + 0.6, y + 0.2);
        shape.bezierCurveTo(x + 0.6, y - 0.3, x, y - 0.3, x, y);

        const extrudeSettings = {
            depth: 0.1,
            bevelEnabled: true,
            bevelSegments: 5,
            steps: 1,
            bevelSize: 0.15,
            bevelThickness: 0.15,
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.scale(0.08, 0.08, 0.08);
        geo.rotateX(Math.PI); 
        return geo;
    }, []);

    return (
        <group>
            <Instances geometry={heartShapeGeometry} range={heartsData.length}>
                <meshPhysicalMaterial color={LOVE_RED} emissive={LOVE_RED} emissiveIntensity={0.6} roughness={0.1} metalness={0.7} clearcoat={1} />
                {heartsData.map((d, i) => <InstanceItem key={i} data={d} transformRef={transformRef} />)}
            </Instances>
            <Instances range={diamonds.length}>
                <octahedronGeometry args={[0.07, 0]} />
                <meshPhysicalMaterial color="#ffffff" transmission={0.9} thickness={2} roughness={0} metalness={0} ior={2.4} />
                {diamonds.map((d, i) => <InstanceItem key={i} data={d} transformRef={transformRef} />)}
            </Instances>
            <Instances range={pearls.length}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshPhysicalMaterial color={BLUSH_PINK} roughness={0.1} metalness={0.9} emissive={BLUSH_PINK} emissiveIntensity={0.1} />
                {pearls.map((d, i) => <InstanceItem key={i} data={d} transformRef={transformRef} />)}
            </Instances>
        </group>
    )
};

const BlossomParticleSystem = ({ count, type, transformRef }: { count: number, type: 'petal' | 'stem', transformRef: any }) => {
  const meshRef = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uChaosFactor: { value: 0 }, uSize: { value: type === 'petal' ? 0.12 : 0.08 } }), [type]);
  const attributes = useMemo(() => {
    const formedPositions = new Float32Array(count * 3);
    const chaosPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const baseColor = new THREE.Color(type === 'petal' ? LOVE_RED : "#300000");
    const highlightColor = new THREE.Color(type === 'petal' ? ROSE_GOLD : "#500000");

    for (let i = 0; i < count; i++) {
      const rChaos = 6.0 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      chaosPositions[i*3] = rChaos * Math.sin(phi) * Math.cos(theta);
      chaosPositions[i*3+1] = rChaos * Math.sin(phi) * Math.sin(theta);
      chaosPositions[i*3+2] = rChaos * Math.cos(phi);

      let x, y, z;
      if (type === 'petal') {
        const hVal = Math.sqrt(Math.random()); 
        const h = hVal * 3.6; 
        y = (h - 2.0);
        const maxR = (3.6 - h) * 0.46;
        const r = maxR * Math.sqrt(0.2 + 0.8*Math.random()); 
        const th = Math.random() * Math.PI * 2;
        x = r * Math.cos(th); z = r * Math.sin(th);
      } else {
        const h = Math.random() * 2.5; const yPos = h - 2.2;
        let r = 0.08 * Math.random(); const th = Math.random() * Math.PI * 2;
        if(yPos < -1.8) { r += (-1.8 - yPos); } 
        x = r * Math.cos(th); y = yPos; z = r * Math.sin(th);
      }
      formedPositions[i*3] = x; formedPositions[i*3+1] = y; formedPositions[i*3+2] = z;
      const c = baseColor.clone().lerp(highlightColor, Math.random());
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
      sizes[i] = Math.random();
    }
    return { formedPositions, chaosPositions, colors, sizes };
  }, [count, type]);

  useFrame((state) => {
    if (meshRef.current && transformRef.current) {
        uniforms.uTime.value = state.clock.getElapsedTime();
        uniforms.uChaosFactor.value = THREE.MathUtils.lerp(uniforms.uChaosFactor.value, transformRef.current.chaosFactor, 0.1);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-formedPosition" count={attributes.formedPositions.length / 3} array={attributes.formedPositions} itemSize={3} />
        <bufferAttribute attach="attributes-chaosPosition" count={attributes.chaosPositions.length / 3} array={attributes.chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={attributes.colors.length / 3} array={attributes.colors} itemSize={3} />
        <bufferAttribute attach="attributes-sizeRandom" count={attributes.sizes.length} array={attributes.sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial vertexShader={petalVertexShader} fragmentShader={petalFragmentShader} uniforms={uniforms} transparent depthWrite={false} />
    </points>
  );
};

const UnifiedPhotoFrame = ({ config, index, transformRef, totalCount }: { config: any, index: number, transformRef: any, totalCount: number, key?: any }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [dims, setDims] = useState({ w: 0.5, h: 0.7 });

    useEffect(() => {
        let isMounted = true;
        const loader = new THREE.TextureLoader();
        loader.load(
            config.url,
            (loadedTexture) => {
                if (!isMounted) return;
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                
                const img = loadedTexture.image;
                if (img && img.width && img.height) {
                    const aspect = img.width / img.height;
                    const MAX_DIM = 0.75; 
                    let w, h;
                    
                    if (aspect > 1) {
                        w = MAX_DIM;
                        h = MAX_DIM / aspect;
                    } else {
                        h = MAX_DIM;
                        w = MAX_DIM * aspect;
                    }
                    setDims({ w, h });
                }

                setTexture(loadedTexture);
            },
            undefined,
            (err) => console.warn(`Failed to load texture ${config.url}`, err)
        );
        return () => { isMounted = false; };
    }, [config.url]);
    
    // Smooth layout calculation
    const foliageR = (3.6 - (config.y + 2.0)) * 0.45;
    const r = foliageR + 0.15; 
    const formedPos = useMemo(() => new THREE.Vector3(r * Math.sin(config.angle), config.y, r * Math.cos(config.angle)), [config, r]);
    const chaosPos = useMemo(() => new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10), []);

    const treeRotation = useMemo(() => {
        return new THREE.Euler(0, config.angle, 0);
    }, [config.angle]);

    useFrame(() => {
        if (!meshRef.current || !transformRef.current) return;
        const { treeState, chaosFactor, galleryOffset } = transformRef.current;
        const isGallery = treeState === 'GALLERY';

        if (isGallery) {
             const spacing = 1.9;
             const relativeIndex = index - galleryOffset;
             const isFocused = Math.abs(relativeIndex) < 0.1; 
             const targetX = relativeIndex * spacing;
             const targetY = 0.0;
             const targetZ = isFocused ? 6.2 : 5.0 + (Math.abs(relativeIndex) * -1.2); 
             const lerpSpeed = isFocused ? 0.15 : 0.08;
             meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, lerpSpeed);
             meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, lerpSpeed);
             meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, lerpSpeed);
             meshRef.current.rotation.set(0,0,0);
             const targetScale = isFocused ? 2.6 : 1.0; 
             const s = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, lerpSpeed);
             meshRef.current.scale.set(s,s,s);
             meshRef.current.visible = true;
        } else {
             meshRef.current.position.lerpVectors(formedPos, chaosPos, chaosFactor);
             if (chaosFactor < 0.1) {
                 meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, treeRotation.x, 0.1);
                 meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, treeRotation.y, 0.1);
                 meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, treeRotation.z, 0.1);
             } else {
                 meshRef.current.rotation.x += 0.03;
                 meshRef.current.rotation.y += 0.03;
             }
             const s = THREE.MathUtils.lerp(1, 0, chaosFactor); 
             meshRef.current.scale.set(s, s, s);
             meshRef.current.visible = s > 0.01;
        }
    });

    return (
        <group ref={meshRef}>
            <mesh>
                <boxGeometry args={[dims.w + 0.05, dims.h + 0.05, 0.06]} />
                <meshStandardMaterial color={ROSE_GOLD} metalness={1} roughness={0.1} />
            </mesh>
            <mesh position={[0,0,0.04]}>
                <planeGeometry args={[dims.w, dims.h]} />
                {texture ? (
                    <meshBasicMaterial map={texture} />
                ) : (
                    <meshStandardMaterial color={ROSE_GOLD} transparent opacity={0.3} />
                )}
            </mesh>
        </group>
    );
}

const PhotoInstances = ({ transformRef, photoData }: { transformRef: any, photoData: any[] }) => {
    return (
        <group>
            {photoData.map((f, i) => (
                <UnifiedPhotoFrame 
                    key={f.url + i} 
                    config={f} 
                    index={i} 
                    transformRef={transformRef} 
                    totalCount={photoData.length}
                />
            ))}
        </group>
    );
};

const EternalHeartTopper = () => {
    const ref = useRef<THREE.Group>(null);
    const heartShapeGeometry = useMemo(() => {
        const x = 0, y = 0;
        const shape = new THREE.Shape();
        shape.moveTo(x, y);
        shape.bezierCurveTo(x, y - 0.4, x - 0.8, y - 0.4, x - 0.8, y + 0.3);
        shape.bezierCurveTo(x - 0.8, y + 0.9, x, y + 1.2, x, y + 1.6);
        shape.bezierCurveTo(x, y + 1.2, x + 0.8, y + 0.9, x + 0.8, y + 0.3);
        shape.bezierCurveTo(x + 0.8, y - 0.4, x, y - 0.4, x, y);

        const extrudeSettings = {
            depth: 0.2,
            bevelEnabled: true,
            bevelSegments: 8,
            steps: 2,
            bevelSize: 0.3,
            bevelThickness: 0.3,
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.rotateX(Math.PI); 
        return geo;
    }, []);

    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.8;
            const s = 0.35 + Math.sin(state.clock.elapsedTime * 2.5) * 0.03;
            ref.current.scale.set(s, s, s);
        }
    });

    return (
        <group ref={ref} position={[0, 1.6, 0]}>
            <mesh geometry={heartShapeGeometry}>
                <meshStandardMaterial color={DIAMOND_WHITE} emissive={BLUSH_PINK} emissiveIntensity={3} metalness={0.2} roughness={0} transparent opacity={0.95} />
            </mesh>
            <pointLight intensity={6} color={BLUSH_PINK} distance={7} decay={2} />
        </group>
    )
}

const LoveSpiral = ({ direction = 1, offset = 0 }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 2000;
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            const t = i/count; const y = (t*4.6)-2.3; const r = (2.6-y*0.5)*0.68;
            const th = t*Math.PI*20*direction + offset;
            const spread = (Math.random()-0.5)*0.15;
            arr[i*3] = (r+spread)*Math.cos(th); arr[i*3+1] = y+spread; arr[i*3+2] = (r+spread)*Math.sin(th);
        }
        return arr;
    }, [direction, offset]);
    useFrame((state) => { if(pointsRef.current) pointsRef.current.rotation.y = state.clock.elapsedTime*0.15*direction; });
    return <points ref={pointsRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial color={ROSE_GOLD} size={0.025} sizeAttenuation transparent opacity={0.5} blending={THREE.AdditiveBlending} /></points>;
};

export const EternalLoveTree = ({ transformRef, photoData = [] }: LuxuryTreeProps) => {
  const treeContentRef = useRef<THREE.Group>(null);
  const photoContentRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if(transformRef.current && treeContentRef.current && photoContentRef.current) {
        const { rotationY, treeState } = transformRef.current;
        const isGallery = treeState === 'GALLERY';
        const lerpFactor = isGallery ? 0.12 : 0.08;

        treeContentRef.current.rotation.y = THREE.MathUtils.lerp(treeContentRef.current.rotation.y, rotationY, lerpFactor);
        
        const targetPhotoRotY = isGallery ? 0 : rotationY;
        photoContentRef.current.rotation.y = THREE.MathUtils.lerp(photoContentRef.current.rotation.y, targetPhotoRotY, lerpFactor);
    }
  });

  return (
    <Suspense fallback={null}>
        <group>
            <group ref={treeContentRef}>
                <BlossomParticleSystem count={50000} type="petal" transformRef={transformRef} />
                <BlossomParticleSystem count={8000} type="stem" transformRef={transformRef} />
                <OrnamentSystem transformRef={transformRef} />
                <SpecialOrnamentSystem transformRef={transformRef} />
                <LoveSpiral direction={1} offset={0} />
                <LoveSpiral direction={-1} offset={Math.PI} />
                <Sparkles count={500} scale={7} size={2.5} speed={0.5} opacity={0.4} color="#ffb7c5" />
                <EternalHeartTopper />
            </group>
            
            <group ref={photoContentRef}>
                <PhotoInstances transformRef={transformRef} photoData={photoData} />
            </group>
        </group>
    </Suspense>
  );
};

export { EternalLoveTree as LuxuryTree };
