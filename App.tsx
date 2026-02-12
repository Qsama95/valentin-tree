
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { GestureController } from './components/GestureController';
import { TransformState } from './types';

// --- Precise Asset Discovery Service ---
// Probes specifically for 01.jpg through nn.jpg and validates that they are actual images.
const probePhotos = async (maxCount = 99): Promise<string[]> => {
    const discovered: string[] = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    // Batch processing for efficiency
    const batchSize = 4;
    for (let i = 1; i <= maxCount; i += batchSize) {
        const batchPromises = [];
        for (let j = 0; j < batchSize && (i + j) <= maxCount; j++) {
            const num = i + j;
            const paddedNum = num.toString().padStart(2, '0');
            
            const validateImage = async () => {
                for (const ext of extensions) {
                    const url = `/photos/${paddedNum}${ext}`;
                    try {
                        const res = await fetch(url, { method: 'HEAD' });
                        const contentType = res.headers.get('content-type');
                        
                        // CRITICAL: Ensure the server actually returned an image, not a fallback HTML page
                        if (res.ok && contentType && contentType.startsWith('image/')) {
                            return url;
                        }
                    } catch (e) {
                        // Silently skip if network error
                    }
                }
                return null;
            };
            batchPromises.push(validateImage());
        }
        
        const results = await Promise.all(batchPromises);
        const validResults = results.filter((r): r is string => r !== null);
        
        // If we found nothing in this batch, we assume the sequence has ended.
        if (validResults.length === 0) {
            // Note: We only break if we haven't found anything in a whole batch to account for minor gaps
            if (i > batchSize) break; 
        } else {
            discovered.push(...validResults);
        }
    }
    return discovered;
};

// --- Music Player ---
const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.4; 
        audioRef.current = audio;

        // Directly target the specified filename
        audio.src = '/music/bgm.mp3';

        const handleInteraction = () => {
            if (audio.paused && audio.src) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {
                        console.log("Waiting for user interaction or file exists check failed.");
                    });
            }
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        
        return () => {
            audio.pause();
            audioRef.current = null;
            window.removeEventListener('click', handleInteraction);
        };
    }, []);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && audioRef.current) {
            const url = URL.createObjectURL(e.target.files[0]);
            audioRef.current.src = url;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(console.error);
        }
    };

    return (
        <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-3">
            <button 
                onClick={() => {
                    if(isPlaying) audioRef.current?.pause();
                    else audioRef.current?.play();
                    setIsPlaying(!isPlaying);
                }}
                className={`flex items-center gap-3 px-5 py-2 rounded-full border transition-all duration-700 font-display tracking-widest text-xs
                    ${isPlaying ? 'bg-black/40 border-rose-600/50 text-rose-100' : 'bg-transparent border-white/10 text-white/40'}`}
            >
                {isPlaying ? "PAUSE SYMPHONY" : "PLAY SYMPHONY"}
            </button>
            
            <label className="cursor-pointer flex items-center gap-2 group">
                <span className="text-[10px] text-white/30 group-hover:text-rose-300 transition-colors uppercase tracking-widest">
                    Custom Track
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-rose-500 transition-colors" />
                <input 
                    type="file" 
                    accept="audio/*" 
                    onChange={handleUpload} 
                    className="hidden" 
                />
            </label>
        </div>
    );
};

// --- Upload Button ---
const PhotoUploader = ({ onUpload }: { onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    return (
        <div className="fixed top-8 left-8 z-50">
            <label 
                className="cursor-pointer flex items-center gap-3 px-5 py-2 rounded-full border bg-black/40 border-rose-600/50 text-rose-100 transition-all duration-300 hover:bg-rose-900/40 hover:border-rose-400 font-display tracking-widest text-xs"
            >
                <span>ADD MEMORIES</span>
                <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={onUpload} 
                    className="hidden" 
                />
            </label>
        </div>
    );
};

const Overlay = ({ isScanning, photoCount }: { isScanning: boolean, photoCount: number }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between py-12">
            
            {/* Header */}
            <div className="text-center mt-4">
                <h1 className="font-script text-6xl md:text-8xl liquid-gold-text drop-shadow-2xl opacity-95">
                    Eternal Love
                </h1>
                <h2 className="font-display text-white/90 text-lg md:text-xl tracking-[0.4em] mt-2 uppercase">
                    Happy Valentine's, Minmin
                </h2>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent mx-auto mt-6" />
            </div>

            {/* Scanning State */}
            {isScanning && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                     <p className="font-display text-rose-300/60 text-xs md:text-sm tracking-[0.4em] uppercase animate-pulse">
                         Blossoming Memories...
                     </p>
                 </div>
            )}

            {/* Footer Instructions */}
            <div className="flex flex-col items-center gap-2 mb-8 bg-black/10 backdrop-blur-sm p-4 rounded-3xl">
                 <p className="font-deco text-[10px] text-rose-500/70 tracking-[0.2em] uppercase">
                    {photoCount > 0 ? `${photoCount} Memories Discovered` : 'Blossom Tree Formed • Add Memories'}
                 </p>
                 <div className="flex flex-wrap justify-center gap-4 text-[9px] text-white/50 font-display tracking-widest px-4 text-center">
                     <span>OPEN PALM: BLOSSOM GALLERY</span>
                     <span>TWO PALMS: ZOOM LENS</span>
                     <span>ROTATE HAND: SPIN THE WORLD</span>
                     <span>FIST: FORM THE TREE</span>
                 </div>
            </div>
        </div>
    );
};

export default function App() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
      const loadDefaults = async () => {
          setIsScanning(true);
          // Only loads what it actually finds in /photos/01.jpg...nn.jpg
          const photoFiles = await probePhotos(99);
          
          if (photoFiles.length > 0) {
              const mappedPhotos = photoFiles.map((url, i) => {
                  const t = i / photoFiles.length;
                  return {
                      url,
                      y: (t * 2.2) - 1.1, 
                      angle: t * Math.PI * 8 
                  };
              });
              setPhotos(mappedPhotos);
          } else {
              // No local files found - starts purely as a blossom tree
              setPhotos([]);
          }
          setIsScanning(false);
      };
      loadDefaults();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        const newPhotos = files.map((file, i) => {
            const index = photos.length + i;
            return {
                url: URL.createObjectURL(file as Blob),
                y: (Math.random() * 2.2) - 1.1,
                angle: Math.random() * Math.PI * 2
            };
        });
        setPhotos([...photos, ...newPhotos]);
    }
  };

  const transformRef = useRef<TransformState>({
    rotationY: 0,
    autoRotationSpeed: 0,
    position: [0, -0.5, 0],
    scale: 1,
    galleryOffset: 0, 
    handPosition: [0.5, 0.5],
    treeState: 'FORMED',
    chaosFactor: 0,
    focusedPhotoIndex: null
  });

  return (
    <div className="relative w-full h-screen bg-[#050001] text-white overflow-hidden">
      <MusicPlayer />
      <PhotoUploader onUpload={handlePhotoUpload} />
      <Overlay isScanning={isScanning} photoCount={photos.length} />
      
      <GestureController transformRef={transformRef} />

      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
            antialias: true, 
            toneMappingExposure: 1.1,
            powerPreference: "high-performance"
        }}
      >
        <Scene transformRef={transformRef} photos={photos} />
      </Canvas>
    </div>
  );
}
