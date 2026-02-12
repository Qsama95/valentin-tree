
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { GestureController } from './components/GestureController';
import { TransformState } from './types';
import { FRAME_DATA } from './constants';

// --- Music Player ---
const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio('https://ia800501.us.archive.org/11/items/pachelbel/Pachelbel%20Canon%20in%20D%20Major.mp3');
        audio.loop = true;
        audio.volume = 0.4; 
        audioRef.current = audio;

        const handleInteraction = () => {
            if (audio.paused) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
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
                    Upload Track
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
                <span>UPLOAD MEMORIES</span>
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

const Overlay = ({ showPrompt }: { showPrompt: boolean }) => {
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

            {/* Empty State Prompt */}
            {showPrompt && (
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                     <p className="font-display text-white/30 text-xs md:text-sm tracking-[0.3em] uppercase animate-pulse border border-white/10 px-6 py-3 rounded-full bg-black/20 backdrop-blur-sm">
                         Upload photos to begin
                     </p>
                 </div>
            )}

            {/* Footer Instructions */}
            <div className="flex flex-col items-center gap-2 mb-8 bg-black/10 backdrop-blur-sm p-4 rounded-3xl">
                 <p className="font-deco text-[10px] text-rose-500/70 tracking-[0.2em] uppercase">
                    Interactive Sensory Experience
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
  const [photos, setPhotos] = useState<typeof FRAME_DATA>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        
        // Map new files to the slot positions defined in FRAME_DATA.
        // If user uploads more files than slots, we cycle through the slots using modulo.
        const createdPhotos = files.map((file, i) => {
            const templateIndex = i % FRAME_DATA.length;
            const positionTemplate = FRAME_DATA[templateIndex];
            
            return {
                ...positionTemplate,
                url: URL.createObjectURL(file as Blob)
            };
        });
        
        setPhotos(createdPhotos);
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
      <Overlay showPrompt={photos.length === 0} />
      
      <GestureController transformRef={transformRef} />

      <Canvas 
        shadows 
        dpr={[1, 1.5]} 
        gl={{ 
            antialias: false, 
            toneMappingExposure: 1.1,
            powerPreference: "high-performance"
        }}
      >
        <Scene transformRef={transformRef} photos={photos} />
      </Canvas>
    </div>
  );
}
