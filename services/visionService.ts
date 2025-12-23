import { FilesetResolver, GestureRecognizer, DrawingUtils } from "@mediapipe/tasks-vision";

// Singleton to manage MediaPipe instances
class VisionService {
  private gestureRecognizer: GestureRecognizer | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private animationFrameId: number | null = null;

  // Configuration
  private readonly runningMode = "VIDEO";
  
  public async initialize(): Promise<void> {
    if (this.gestureRecognizer) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: this.runningMode,
        numHands: 1
      });
    } catch (error) {
      console.error("Failed to load MediaPipe:", error);
      throw new Error("Could not initialize vision system.");
    }
  }

  public startPrediction(
    videoElement: HTMLVideoElement, 
    onResult: (gesture: string, isPinching: boolean) => void
  ) {
    this.video = videoElement;

    const predict = async () => {
      if (!this.gestureRecognizer || !this.video) return;

      if (this.video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.video.currentTime;
        
        try {
          const results = this.gestureRecognizer.recognizeForVideo(this.video, Date.now());
          
          let gestureName = "None";
          let isPinching = false;

          if (results.gestures.length > 0) {
            gestureName = results.gestures[0][0].categoryName;
            
            // Custom Pinch Logic based on Landmarks (Index Tip vs Thumb Tip)
            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0];
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              
              if (thumbTip && indexTip) {
                // Calculate Euclidean distance (simple 2D approximation for Z-normalized landmarks)
                const distance = Math.sqrt(
                  Math.pow(thumbTip.x - indexTip.x, 2) + 
                  Math.pow(thumbTip.y - indexTip.y, 2)
                );
                // Threshold for pinch
                if (distance < 0.05) {
                  isPinching = true;
                }
              }
            }
          }

          onResult(gestureName, isPinching);

        } catch (e) {
          console.warn("Prediction error:", e);
        }
      }
      this.animationFrameId = requestAnimationFrame(predict);
    };

    predict();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

export const visionService = new VisionService();