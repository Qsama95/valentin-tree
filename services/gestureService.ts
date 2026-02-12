
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { HandGesture, HandLandmark } from "../types";
import { PINCH_RATIO, FIST_RATIO, PALM_RATIO } from "../constants";

let handLandmarker: HandLandmarker | null = null;

export const initializeHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  return handLandmarker;
};

export const detectHands = (video: HTMLVideoElement, startTimeMs: number): HandLandmarkerResult | null => {
  if (handLandmarker) {
    return handLandmarker.detectForVideo(video, startTimeMs);
  }
  return null;
};

// --- Geometry Helpers ---

const distance = (p1: HandLandmark, p2: HandLandmark) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const getHandScale = (landmarks: HandLandmark[]) => {
  return distance(landmarks[0], landmarks[9]);
};

const isPinching = (landmarks: HandLandmark[], scale: number) => {
  const d = distance(landmarks[4], landmarks[8]);
  return d < (0.35 * scale); 
};

const isFist = (landmarks: HandLandmark[], scale: number) => {
  const tips = [8, 12, 16, 20];
  const wrist = landmarks[0];
  let foldedCount = 0;
  tips.forEach(idx => {
    if (distance(landmarks[idx], wrist) < (1.4 * scale)) {
        foldedCount++;
    }
  });
  return foldedCount >= 3;
};

const isOpenPalm = (landmarks: HandLandmark[], scale: number) => {
  if (isPinching(landmarks, scale)) return false;
  const wrist = landmarks[0];
  const tips = [8, 12, 16, 20];
  let extendedCount = 0;
  tips.forEach(idx => {
    if (distance(landmarks[idx], wrist) > (1.6 * scale)) {
        extendedCount++;
    }
  });
  return extendedCount >= 3; 
};

export const analyzeGestures = (result: HandLandmarkerResult): { gesture: HandGesture, data: any } => {
  const hands = result.landmarks;
  const handedness = result.handedness;

  if (!hands || hands.length === 0) return { gesture: HandGesture.NONE, data: null };

  let rightHandIdx = -1;
  let leftHandIdx = -1;

  for (let i = 0; i < handedness.length; i++) {
    const label = handedness[i][0].categoryName;
    if (label === 'Left') rightHandIdx = i; // User's Right Hand
    if (label === 'Right') leftHandIdx = i; // User's Left Hand
  }

  if (hands.length === 1 && rightHandIdx === -1 && leftHandIdx === -1) {
      rightHandIdx = 0;
  }

  const rh = rightHandIdx !== -1 ? hands[rightHandIdx] : null;
  const lh = leftHandIdx !== -1 ? hands[leftHandIdx] : null;
  
  const rhScale = rh ? getHandScale(rh) : 1;
  const lhScale = lh ? getHandScale(lh) : 1;

  // Rotation data for right hand
  let rightHandAngle = 0;
  if (rh) {
      // Calculate angle between Wrist(0) and Middle MCP(9)
      rightHandAngle = Math.atan2(rh[9].y - rh[0].y, rh[9].x - rh[0].x);
  }

  // Check for Dual Hand Open Palm Zoom
  const rightOpen = rh && isOpenPalm(rh, rhScale);
  const leftOpen = lh && isOpenPalm(lh, lhScale);

  if (rightOpen && leftOpen) {
      const dist = distance(rh[9], lh[9]);
      return { gesture: HandGesture.PALM_BOTH, data: { distance: dist } };
  }

  const rightPinch = rh && isPinching(rh, rhScale);
  const leftPinch = lh && isPinching(lh, lhScale);

  if (rightPinch && leftPinch) {
       const dist = distance(rh[4], lh[4]);
       return { gesture: HandGesture.PINCH_BOTH, data: { distance: dist } };
  }

  if (leftPinch) {
      return { gesture: HandGesture.PINCH_LEFT, data: { x: lh[4].x, y: lh[4].y } };
  }
  
  if (rh) {
      const basicData = { x: rh[9].x, y: rh[9].y, angle: rightHandAngle };
      
      if (rightPinch) {
          return { gesture: HandGesture.PINCH_RIGHT, data: { ...basicData, x: rh[4].x, y: rh[4].y } };
      }

      if (isFist(rh, rhScale)) {
          return { gesture: HandGesture.FIST_RIGHT, data: basicData };
      }

      if (rightOpen) {
          return { gesture: HandGesture.OPEN_PALM_RIGHT, data: basicData };
      }
      
      // Default to returning right hand data even if no specific "trigger" gesture is active
      // so we can track orientation continuously
      return { gesture: HandGesture.NONE, data: basicData };
  }

  return { gesture: HandGesture.NONE, data: null };
};
