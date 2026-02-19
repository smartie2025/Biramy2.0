import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface FaceLandmarks {
  leftEye: NormalizedLandmark[];
  rightEye: NormalizedLandmark[];
  noseBridge: NormalizedLandmark;
  leftEar: NormalizedLandmark;
  rightEar: NormalizedLandmark;
  faceCenter: NormalizedLandmark;
  faceWidth: number;
  faceHeight: number;
}

export interface DetectionResult {
  landmarks: FaceLandmarks | null;
  faceDetected: boolean;
}

let faceLandmarker: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

export const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) return faceLandmarker;
  if (initPromise) return initPromise;

   initPromise = (async () => {
    try {
      console.log('Initializing MediaPipe Face Landmarker...');
      const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
);
   
      console.log('Vision tasks loaded successfully');

      const detector = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
         "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
      });

      faceLandmarker = detector;
      console.log('Face Landmarker initialized successfully');
      return detector;
    } catch (error) {
      console.error('Full initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorMessage);
      initPromise = null;
      throw new Error(`Face detection setup failed: ${errorMessage}`);
    }
  })();

  return initPromise;
};

export const detectFaceLandmarks = (videoElement: HTMLVideoElement, detector?: FaceLandmarker): DetectionResult => {
  const landmarkerToUse = detector || faceLandmarker;

  if (!landmarkerToUse) {
    return { landmarks: null, faceDetected: false };
  }

  try {
    const results = landmarkerToUse.detectForVideo(
      videoElement,
      performance.now()
    );

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return { landmarks: null, faceDetected: false };
    }

    const allLandmarks = results.faceLandmarks[0];

    const leftEye = [allLandmarks[33], allLandmarks[133], allLandmarks[157], allLandmarks[158], allLandmarks[159], allLandmarks[160], allLandmarks[161]];
    const rightEye = [allLandmarks[362], allLandmarks[263], allLandmarks[386], allLandmarks[387], allLandmarks[388], allLandmarks[389], allLandmarks[390]];

    const noseBridge = allLandmarks[6];

    const leftEar = allLandmarks[234];
    const rightEar = allLandmarks[454];

    const faceContourIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    const facePoints = faceContourIndices.map(i => allLandmarks[i]);

    const xs = facePoints.map(p => p.x);
    const ys = facePoints.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const faceCenter: NormalizedLandmark = {
       x: (minX + maxX) / 2,
       y: (minY + maxY) / 2,
       z: 0,
       visibility: 1,     
      };



    const landmarks: FaceLandmarks = {
      leftEye,
      rightEye,
      noseBridge,
      leftEar,
      rightEar,
      faceCenter,
      faceWidth,
      faceHeight,
    };

    return { landmarks, faceDetected: true };
  } catch (error) {
    console.error('Error detecting face landmarks:', error);
    return { landmarks: null, faceDetected: false };
  }
};

export const getGlassesPosition = (
  landmarks: FaceLandmarks,
  canvasWidth: number,
  canvasHeight: number
) => {
  const leftEyeAvg = {
    x: landmarks.leftEye.reduce((sum, p) => sum + p.x, 0) / landmarks.leftEye.length,
    y: landmarks.leftEye.reduce((sum, p) => sum + p.y, 0) / landmarks.leftEye.length,
  };
  const rightEyeAvg = {
    x: landmarks.rightEye.reduce((sum, p) => sum + p.x, 0) / landmarks.rightEye.length,
    y: landmarks.rightEye.reduce((sum, p) => sum + p.y, 0) / landmarks.rightEye.length,
  };

  const eyeCenterX = (leftEyeAvg.x + rightEyeAvg.x) / 2 * canvasWidth;
  const eyeCenterY = (leftEyeAvg.y + rightEyeAvg.y) / 2 * canvasHeight;

  const glassesScale = landmarks.faceWidth * canvasWidth * 1.6; // tune 1.4–2.0
  const rotation = Math.atan2(rightEyeAvg.y - leftEyeAvg.y, rightEyeAvg.x - leftEyeAvg.x) * (180 / Math.PI);

  return {
    x: eyeCenterX,
    y: eyeCenterY,
    scale: glassesScale,
    rotation: rotation,
  };
};

export const getEarringPosition = (
  landmarks: FaceLandmarks,
  side: 'left' | 'right',
  canvasWidth: number,
  canvasHeight: number
) => {
  const ear = side === 'left' ? landmarks.leftEar : landmarks.rightEar;

  const earX = ear.x * canvasWidth;
  const earY = ear.y * canvasHeight;

const earringScale = landmarks.faceWidth * canvasWidth * 0.6; // tune 0.4–0.8

  return {
    x: earX,
    y: earY,
    scale: earringScale,
    rotation: 0,
  };
};
