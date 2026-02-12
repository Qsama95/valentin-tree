
import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { GestureController } from './components/GestureController';
import { TransformState } from './types';

// --- Music Player Component ---
const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio
        // Ensure you have the file at /public/music/cant_stop_love.mp3
        const audio = new Audio('/music/cant_stop_love.mp3');
        audio.loop = true;
        audio.volume = 0.4; // Set volume to 40%
        audioRef.current = audio;

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Playback failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <button 
            onClick={togglePlay}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-500 group ${isPlaying ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black/40 border-emerald-800/30 hover:bg-emerald-900/40'}`}
        >
            {/* Animated Bars */}
            <div className="flex items-end gap-1 h-4">
                <span className={`w-1 bg-yellow-400 rounded-t-sm transition-all duration-300 ${isPlaying ? 'h-4 animate-[bounce_1s_infinite]' : 'h-1'}`}></span>
                <span className={`w-1 bg-yellow-400 rounded-t-sm transition-all duration-300 delay-75 ${isPlaying ? 'h-3 animate-[bounce_1.2s_infinite]' : 'h-1'}`}></span>
                <span className={`w-1 bg-yellow-400 rounded-t-sm transition-all duration-300 delay-150 ${isPlaying ? 'h-4 animate-[bounce_0.8s_infinite]' : 'h-1'}`}></span>
            </div>
            
            <span className={`font-serif text-sm tracking-widest ${isPlaying ? 'text-yellow-100' : 'text-emerald-100/70'}`}>
                {isPlaying ? "PLAYING" : "PLAY MUSIC"}
            </span>
        </button>
    );
};

// UI Overlay Component
const UIOverlay = ({ isGalleryOpen }: { isGalleryOpen: boolean }) => (
    <div className="absolute top-0 w-full p-6 flex flex-col items-center pointer-events-none select-none z-10">
        <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-['Cinzel'] text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                Merry Christmas my dear Minmin
            </h1>
            <p className="text-emerald-300/80 font-serif italic text-sm mt-3 tracking-widest">
                by your dear husband
            </p>
        </div>
        
        {/* Dynamic Status Message */}
        <div className={`mt-8 transition-all duration-700 ${isGalleryOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
             <div className="bg-black/60 backdrop-blur-md border border-yellow-500/50 px-8 py-3 rounded-full shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                <p className="text-yellow-100 font-serif tracking-widest text-lg">
                    ✨ Gallery Active <span className="text-xs opacity-60 ml-2">| DRAG WITH ANY HAND TO BROWSE</span>
                </p>
             </div>
        </div>
    </div>
);

export default function App() {
  // Performance Optimization: Use Ref for animation data to avoid React reconciler overhead on every frame
  const transformRef = useRef<TransformState>({
    rotationY: 0,
    position: [0, -0.5, 0],
    scale: 1,
    galleryOffset: 1, // Start focused on the middle image
    handPosition: [0.5, 0.5], // Center screen
  });

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  return (
    <div className="relative w-full h-screen bg-black">
      <MusicPlayer />
      <UIOverlay isGalleryOpen={isGalleryOpen} />
      
      {/* Hand Tracking Input - Writes to Ref */}
      <GestureController 
        transformRef={transformRef}
        onGalleryToggle={setIsGalleryOpen}
        isGalleryOpen={isGalleryOpen}
      />

      {/* 3D Scene - Reads from Ref */}
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, toneMappingExposure: 1.5 }}>
        <Scene transformRef={transformRef} isGalleryOpen={isGalleryOpen} />
      </Canvas>
    </div>
  );
}
