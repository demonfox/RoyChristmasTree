import React, { useEffect, useRef, useState, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import UI from './components/UI';
import { visionService } from './services/visionService';
import { ParticleMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<ParticleMode>(ParticleMode.TREE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gesture, setGesture] = useState<string>("None");
  const [isPinching, setIsPinching] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const initialized = useRef(false);

  // Initialize Camera and MediaPipe
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        await visionService.initialize();
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          visionService.startPrediction(videoRef.current!, (detectedGesture, pinchState) => {
            setGesture(detectedGesture);
            setIsPinching(pinchState);
          });
        };
      } catch (err) {
        console.error("Camera/Vision init failed:", err);
        alert("Camera access is required for gesture control. Please allow camera permissions.");
      }
    };

    startCamera();

    return () => {
      visionService.stop();
    };
  }, []);

  // Map gestures to modes
  useEffect(() => {
    // Priority logic
    if (isPinching && imageFile) {
      setMode(ParticleMode.IMAGE);
    } else if (gesture === "Open_Palm") {
      setMode(ParticleMode.EXPLODE);
    } else if (gesture === "Closed_Fist") {
      setMode(ParticleMode.TREE);
    }
    // If no specific gesture, we can optionally revert to Tree or stay in last state.
    // Let's stay in last state to make it less jittery, unless it was Image mode and we stopped pinching.
    else if (!isPinching && mode === ParticleMode.IMAGE) {
      setMode(ParticleMode.TREE); // Revert to tree if stopped pinching
    }
  }, [gesture, isPinching, imageFile, mode]);

  const handleUpload = useCallback((file: File) => {
    setImageFile(file);
    // Briefly switch to verify upload, then back
    setMode(ParticleMode.IMAGE);
    setTimeout(() => {
        if (!isPinching) setMode(ParticleMode.TREE);
    }, 1500);
  }, [isPinching]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Visualizer mode={mode} imageFile={imageFile} />
      <UI 
        currentMode={mode} 
        onUpload={handleUpload} 
        videoRef={videoRef}
        gesture={gesture}
        isPinching={isPinching}
        hasImage={!!imageFile}
      />
    </div>
  );
};

export default App;