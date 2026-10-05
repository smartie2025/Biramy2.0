import type {
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

export interface ShoulderLandmarks {
  leftShoulder: NormalizedLandmark;
  rightShoulder: NormalizedLandmark;
}

export interface PoseDetectionResult {
  shoulders: ShoulderLandmarks | null;
  poseDetected: boolean;
}

let poseLandmarker: PoseLandmarker | null = null;
let initPromise: Promise<PoseLandmarker> | null = null;
let hasLoggedDetectionWarning = false;

/**
 * Make sure the video actually contains a usable frame
 * before asking MediaPipe to process it.
 */
const isVideoReadyForPoseDetection = (
  videoElement: HTMLVideoElement
): boolean => {
  return (
    videoElement.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA &&
    !videoElement.paused &&
    !videoElement.ended &&
    videoElement.videoWidth > 0 &&
    videoElement.videoHeight > 0 &&
    Number.isFinite(videoElement.currentTime) &&
    videoElement.currentTime > 0
  );
};

/**
 * Initialise MediaPipe Pose Landmarker once and reuse it.
 */
export const initializePoseLandmarker =
  async (): Promise<PoseLandmarker> => {
    if (poseLandmarker) return poseLandmarker;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        console.log("[Galaxy Pose 001] Initializing Pose Landmarker...");

        const { FilesetResolver, PoseLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        );

        const detector = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        poseLandmarker = detector;

        console.log(
          "[Galaxy Pose 001] Pose Landmarker initialized successfully"
        );

        return detector;
      } catch (error) {
        initPromise = null;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.warn(
          "[Galaxy Pose 001] Pose Landmarker initialization failed:",
          errorMessage
        );

        throw new Error(
          `Pose detection setup failed: ${errorMessage}`
        );
      }
    })();

    return initPromise;
  };

/**
 * Detect only the two landmarks required for Galaxy Pose 001.
 *
 * MediaPipe Pose landmark indices:
 * 11 = left shoulder
 * 12 = right shoulder
 */
export const detectShoulders = (
  videoElement: HTMLVideoElement,
  detector?: PoseLandmarker
): PoseDetectionResult => {
  const landmarkerToUse = detector ?? poseLandmarker;

  if (
    !landmarkerToUse ||
    !videoElement ||
    !isVideoReadyForPoseDetection(videoElement)
  ) {
    return {
      shoulders: null,
      poseDetected: false,
    };
  }

  try {
    const results = landmarkerToUse.detectForVideo(
      videoElement,
      performance.now()
    );

    if (!results.landmarks || results.landmarks.length === 0) {
      return {
        shoulders: null,
        poseDetected: false,
      };
    }

    const pose = results.landmarks[0];

    const leftShoulder = pose?.[11];
    const rightShoulder = pose?.[12];

    if (!leftShoulder || !rightShoulder) {
      return {
        shoulders: null,
        poseDetected: false,
      };
    }

    hasLoggedDetectionWarning = false;

    return {
      shoulders: {
        leftShoulder,
        rightShoulder,
      },
      poseDetected: true,
    };
  } catch (error) {
    if (!hasLoggedDetectionWarning) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.warn(
        "[Galaxy Pose 001] Shoulder detection skipped for a frame:",
        errorMessage
      );

      hasLoggedDetectionWarning = true;
    }

    return {
      shoulders: null,
      poseDetected: false,
    };
  }
};