
import { useEffect, useRef, useState } from 'react';
import { initializeHandLandmarker, detectHands, analyzeGestures } from '../services/gestureService';
import { HandGesture, TransformState } from '../types';
import { ROTATION_SPEED, ZOOM_SPEED, FRAME_DATA } from '../constants';

interface GestureControllerProps {
  transformRef: any;
}

export const GestureController = ({ transformRef }: GestureControllerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorStatus, setErrorStatus] = useState<'PERMISSION_DENIED' | 'OTHER_ERROR' | null>(null);
  const [activeGesture, setActiveGesture] = useState<HandGesture>(HandGesture.NONE);
  const requestRef = useRef<number>(0);
  
  const prevData = useRef<{ x?: number, y?: number, distance?: number, angle?: number, gesture: HandGesture } | null>(null);
  const navCooldown = useRef<number>(0);
  const gestureStabilityCounter = useRef<number>(0);
  const lastGesture = useRef<HandGesture>(HandGesture.NONE);

  const startCamera = async () => {
    setErrorStatus(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API unavailable.");
      }
      await initializeHandLandmarker();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Autoplay blocked", e));
        videoRef.current.onloadedmetadata = () => animate();
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorStatus('PERMISSION_DENIED');
      } else {
          setErrorStatus('OTHER_ERROR');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => cancelAnimationFrame(requestRef.current);
  }, []); 

  const drawDebug = (landmarks: any[]) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#00ffcc';
      landmarks.forEach((hand) => {
          for(const point of hand) {
              const x = (1 - point.x) * canvasRef.current!.width; 
              const y = point.y * canvasRef.current!.height;
              ctx.beginPath();
              ctx.arc(x, y, 2, 0, 2 * Math.PI);
              ctx.fill();
          }
      });
  };

  const animate = () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const now = performance.now();
    const results = detectHands(videoRef.current, now);
    const t = transformRef.current;

    // Apply persistent auto-rotation every frame
    // In Gallery mode, we typically stop auto-rotation, but if we want manual control, we can leave it.
    // However, usually Gallery is static unless moved. Let's keep auto-rotation only for non-Gallery for now,
    // or allow it if the user manually spins it. The prompt asked to "track hand rotation".
    // I'll leave the auto-rotation dampening logic as is, but allow manual impulse.
    if (t && t.treeState !== 'GALLERY') {
        t.rotationY += t.autoRotationSpeed;
    }
    
    if (results && results.landmarks && results.landmarks.length > 0) {
      if(canvasRef.current) drawDebug(results.landmarks);
      const { gesture: currentGesture, data } = analyzeGestures(results);
      
      if (currentGesture === lastGesture.current) {
          gestureStabilityCounter.current++;
      } else {
          gestureStabilityCounter.current = 0;
          lastGesture.current = currentGesture;
      }

      const threshold = (currentGesture === HandGesture.PINCH_RIGHT || 
                         currentGesture === HandGesture.PINCH_LEFT || 
                         currentGesture === HandGesture.PALM_BOTH ||
                         currentGesture === HandGesture.OPEN_PALM_RIGHT) ? 0 : 4;

      if (gestureStabilityCounter.current >= threshold && currentGesture !== activeGesture) {
          setActiveGesture(currentGesture);
      }

      handleGestureLogic(currentGesture, data || {}, now);
    } else {
        if(activeGesture !== HandGesture.NONE) setActiveGesture(HandGesture.NONE);
        lastGesture.current = HandGesture.NONE;
        gestureStabilityCounter.current = 0;
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  const handleGestureLogic = (gesture: HandGesture, data: any, now: number) => {
    const t = transformRef.current;
    
    // --- 1. ROTATION IMPULSE (Check Right Hand only) ---
    // ENABLED FOR ALL STATES NOW
    if (data && data.angle !== undefined) {
        if (prevData.current && prevData.current.angle !== undefined) {
            let deltaAngle = data.angle - prevData.current.angle;
            if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
            if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

            if (Math.abs(deltaAngle) > 0.05) { // Increased threshold to avoid noise
                const speedImpulse = -deltaAngle * 0.12; 
                // Directly modify rotationY for immediate response in Gallery mode 
                // since auto-rotation might be disabled in loop above
                if (t.treeState === 'GALLERY') {
                    t.rotationY += speedImpulse;
                } else {
                    t.autoRotationSpeed = Math.max(-0.007, Math.min(0.007, speedImpulse));
                }
            }
        }
    }

    // --- 2. REVERSED DUAL PALM ZOOM ---
    if (gesture === HandGesture.PALM_BOTH) {
        if (prevData.current && prevData.current.gesture === gesture && prevData.current.distance !== undefined) {
             const deltaDist = data.distance - prevData.current.distance;
             const zoomDelta = -deltaDist * ZOOM_SPEED * 1.5; 
             const newScale = t.scale + zoomDelta;
             
             // Dynamic Scale Limits:
             const maxScale = t.treeState === 'GALLERY' ? 1.4 : 2.0;
             const minScale = t.treeState === 'GALLERY' ? 0.7 : 0.6;
             
             t.scale = Math.max(minScale, Math.min(maxScale, newScale));
        }
        prevData.current = { distance: data.distance, angle: data.angle, gesture };
        return; 
    }

    // --- 3. OPEN PALM (Gallery Mode) ---
    if (gesture === HandGesture.OPEN_PALM_RIGHT) {
        if (t.treeState !== 'GALLERY') {
             t.treeState = 'GALLERY';
             t.chaosFactor = 1; 
             t.autoRotationSpeed = 0;
             t.rotationY = 0;
             t.position = [0, 0, 0];
             t.focusedPhotoIndex = 0;
             t.galleryOffset = 0;
             if (t.scale > 1.4) t.scale = 1.0;
        }
        t.chaosFactor = Math.min(1, t.chaosFactor + 0.05);
    } 
    // --- 4. FIST (Return to Tree) ---
    else if (gesture === HandGesture.FIST_RIGHT) {
        if (t.treeState !== 'FORMED') {
            t.treeState = 'FORMED';
            t.focusedPhotoIndex = null;
            t.position = [0, -0.5, 0];
        }
        t.chaosFactor = Math.max(0, t.chaosFactor - 0.05); 
    }
    // --- 5. NAVIGATION ---
    else if (t.treeState === 'GALLERY') {
        if (now - navCooldown.current > 400) { 
             if (gesture === HandGesture.PINCH_LEFT) {
                 t.focusedPhotoIndex = Math.max(0, (t.focusedPhotoIndex ?? 0) - 1);
                 t.galleryOffset = t.focusedPhotoIndex;
                 navCooldown.current = now;
             }
             else if (gesture === HandGesture.PINCH_RIGHT) {
                 t.focusedPhotoIndex = Math.min(FRAME_DATA.length - 1, (t.focusedPhotoIndex ?? 0) + 1);
                 t.galleryOffset = t.focusedPhotoIndex;
                 navCooldown.current = now;
             }
        }
    }

    prevData.current = { x: data.x, y: data.y, distance: data.distance, angle: data.angle, gesture };
  };

  return (
    <>
      {errorStatus === 'PERMISSION_DENIED' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
           <div className="max-w-md w-full text-center space-y-6 bg-emerald-950/20 p-8 rounded-3xl border border-yellow-500/30">
              <h2 className="font-display text-2xl text-yellow-100 uppercase tracking-widest text-shadow-glow">Interaction Required</h2>
              <p className="text-yellow-100/60 text-sm italic">Please enable camera to enter the experience.</p>
              <button onClick={startCamera} className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-yellow-400 transition-colors">Enable Sensor</button>
           </div>
        </div>
      )}

      <div className="hand-tracker-container fixed bottom-[20px] left-4 z-40 pointer-events-none flex flex-col items-start">
         <div className="relative w-44 h-34 bg-black/70 border border-yellow-900/40 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <video ref={videoRef} className="absolute opacity-0 w-full h-full" playsInline muted />
            <canvas ref={canvasRef} width={320} height={240} className="w-full h-full opacity-40" />
         </div>
         <div className="mt-4 px-3 py-1.5 bg-yellow-950/40 rounded-full border border-yellow-500/10 backdrop-blur-lg">
            <span className="text-yellow-400 font-bold text-[10px] tracking-widest uppercase">
                {activeGesture !== HandGesture.NONE ? activeGesture.replace('_RIGHT', '') : 'SCANNING...'}
            </span>
         </div>
      </div>
    </>
  );
};
