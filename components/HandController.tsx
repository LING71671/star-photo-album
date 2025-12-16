import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store.ts';

// Helper for linear interpolation (Smoothing)
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setGesture, setMode, mode, setCameraRigRotation, setSelectedPhotoId, nextAlbum } = useStore((state) => state);
  const [loaded, setLoaded] = useState(false);
  const requestRef = useRef<number>(0);
  
  // Smoothing refs
  const smoothPos = useRef({ x: 0, y: 0 });
  const lastGestureTime = useRef<number>(0);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setLoaded(true);
        startCamera(handLandmarker);
      } catch (e) {
        console.error("Failed to load MediaPipe", e);
      }
    };

    const startCamera = async (landmarker: HandLandmarker) => {
        if (videoRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                
                const predict = () => {
                    if (videoRef.current && videoRef.current.readyState >= 2 && landmarker) {
                        const result = landmarker.detectForVideo(videoRef.current, performance.now());
                        processResults(result);
                    }
                    requestRef.current = requestAnimationFrame(predict);
                };
                requestRef.current = requestAnimationFrame(predict);
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }
    };

    setupMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handLandmarker) handLandmarker.close();
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processResults = (result: any) => {
    const now = Date.now();

    if (!result.landmarks || result.landmarks.length === 0) {
      return; 
    }

    const landmarks = result.landmarks[0]; 

    // --- REFERENCE SIZE ---
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    const handSize = Math.sqrt(
      Math.pow(middleMCP.x - wrist.x, 2) + Math.pow(middleMCP.y - wrist.y, 2)
    ) || 1;

    // --- GESTURE CALCULATIONS ---

    // 1. Pinch (Thumb Tip 4 to Index Tip 8)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const rawPinchDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2) + Math.pow(thumbTip.z - indexTip.z, 2)
    );
    const normalizedPinch = rawPinchDist / handSize; 
    const isPinching = normalizedPinch < 0.35;

    // 2. Finger Extensions (Distance from tip to wrist compared to knuckle to wrist)
    // Tips: 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
    const getExtension = (tipIdx: number, mcpIdx: number) => {
        const tip = landmarks[tipIdx];
        const mcp = landmarks[mcpIdx];
        const distTip = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
        const distMcp = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
        return distTip > distMcp * 1.2; // Tip significantly further than knuckle
    };

    const indexExt = getExtension(8, 5);
    const middleExt = getExtension(12, 9);
    const ringExt = getExtension(16, 13);
    const pinkyExt = getExtension(20, 17);

    // 3. Logic
    const isFist = !indexExt && !middleExt && !ringExt && !pinkyExt;
    const isOpenPalm = indexExt && middleExt && ringExt && pinkyExt && !isPinching;
    
    // Victory: Index & Middle UP, Ring & Pinky DOWN.
    const isVictory = indexExt && middleExt && !ringExt && !pinkyExt;

    // 4. Smooth Hand Position
    const rawX = -(middleMCP.x - 0.5) * 2;
    const rawY = -(middleMCP.y - 0.5) * 2;
    smoothPos.current.x = lerp(smoothPos.current.x, rawX, 0.2);
    smoothPos.current.y = lerp(smoothPos.current.y, rawY, 0.2);

    // Update Store
    setGesture({
      isFist,
      isOpenPalm,
      isPinching,
      isVictory,
      handPosition: { x: smoothPos.current.x, y: smoothPos.current.y },
      pinchDistance: normalizedPinch
    });

    // --- MODE SWITCHING LOGIC ---
    if (mode === 'WARP') return; // Lock inputs during warp

    const cooldown = 1500; 
    
    // VICTORY -> NEXT ALBUM (WARP)
    if (isVictory) {
        if (now - lastGestureTime.current > cooldown) {
            nextAlbum();
            lastGestureTime.current = now;
        }
    }

    // FIST -> RESET TO VORTEX
    if (isFist && mode !== 'VORTEX') {
       if (now - lastGestureTime.current > cooldown) {
         setMode('VORTEX');
         setSelectedPhotoId(null);
         lastGestureTime.current = now;
       }
    }

    // OPEN PALM -> EXPLODE (BIG BANG)
    if (isOpenPalm && !isPinching) {
        if (mode === 'VORTEX' || mode === 'SINGULARITY') {
            if (now - lastGestureTime.current > cooldown) {
                setMode('BIG_BANG');
                setSelectedPhotoId(null);
                lastGestureTime.current = now;
            }
        }
    }
    
    // Direct Camera Control
    if (mode === 'BIG_BANG') {
      setCameraRigRotation({ 
          x: smoothPos.current.y * 1.5,
          y: smoothPos.current.x * 1.5
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-32 h-24 border border-blue-500/30 rounded-lg overflow-hidden z-50 bg-black/50 pointer-events-none">
      <video ref={videoRef} className="w-full h-full object-cover opacity-60 -scale-x-100" playsInline muted />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-blue-300">Loading Vision...</div>}
    </div>
  );
};

export default HandController;