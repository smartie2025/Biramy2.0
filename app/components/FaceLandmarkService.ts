import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

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

declare global {
    interface Window {
        __biramyTFLiteConsoleFilterInstalled?: boolean;
    }
}

let faceLandmarker: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;
let hasLoggedDetectionWarning = false;

const TFLITE_INFO_MESSAGE = "Created TensorFlow Lite XNNPACK delegate for CPU";
type ConsoleMethod = "error" | "warn" | "info" | "log";

const stringifyConsoleArgs = (args: unknown[]) =>
    args
        .map((arg) => {
            if (typeof arg === "string") return arg;
            if (arg instanceof Error) return arg.message;

            try {
                return JSON.stringify(arg) ?? String(arg);
            } catch {
                return String(arg);
            }
        })
        .join(" ");

const isNoisyTFLiteInfoMessage = (args: unknown[]) =>
    stringifyConsoleArgs(args).includes(TFLITE_INFO_MESSAGE);

export const installNoisyTFLiteConsoleFilter = () => {
    if (typeof window === "undefined") return;
    if (window.__biramyTFLiteConsoleFilterInstalled) return;

    window.__biramyTFLiteConsoleFilterInstalled = true;

    const consoleRecord = console as unknown as Record<ConsoleMethod, (...args: unknown[]) => void>;
    const methods: ConsoleMethod[] = ["error", "warn", "info", "log"];

    methods.forEach((method) => {
        const original = consoleRecord[method].bind(console);

        consoleRecord[method] = (...args: unknown[]) => {
            if (isNoisyTFLiteInfoMessage(args)) {
                return;
            }

            original(...args);
        };
    });
};

installNoisyTFLiteConsoleFilter();

const isVideoReadyForDetection = (videoElement: HTMLVideoElement) => {
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

export const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
    installNoisyTFLiteConsoleFilter();

    if (faceLandmarker) return faceLandmarker;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log("Initializing MediaPipe Face Landmarker...");

            const { FaceLandmarker, FilesetResolver } = await import(
                "@mediapipe/tasks-vision"
            );

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
            );

            console.log("Vision tasks loaded successfully");

            const detector = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                },
                runningMode: "VIDEO",
                numFaces: 1,
                outputFaceBlendshapes: false,
            });

            faceLandmarker = detector;
            console.log("Face Landmarker initialized successfully");
            return detector;
        } catch (error) {
            console.warn("Face landmarker initialization issue:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            initPromise = null;
            throw new Error(`Face detection setup failed: ${errorMessage}`);
        }
    })();

    return initPromise;
};

export const detectFaceLandmarks = (
    videoElement: HTMLVideoElement,
    detector?: FaceLandmarker
): DetectionResult => {
    installNoisyTFLiteConsoleFilter();

    const landmarkerToUse = detector || faceLandmarker;

    if (!landmarkerToUse || !videoElement || !isVideoReadyForDetection(videoElement)) {
        return { landmarks: null, faceDetected: false };
    }

    try {
        const results = landmarkerToUse.detectForVideo(videoElement, performance.now());

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            return { landmarks: null, faceDetected: false };
        }

        const allLandmarks = results.faceLandmarks[0];

        if (!allLandmarks || allLandmarks.length < 455) {
            return { landmarks: null, faceDetected: false };
        }

        const leftEye = [
            allLandmarks[33],
            allLandmarks[133],
            allLandmarks[157],
            allLandmarks[158],
            allLandmarks[159],
            allLandmarks[160],
            allLandmarks[161],
        ].filter(Boolean);

        const rightEye = [
            allLandmarks[362],
            allLandmarks[263],
            allLandmarks[386],
            allLandmarks[387],
            allLandmarks[388],
            allLandmarks[389],
            allLandmarks[390],
        ].filter(Boolean);

        const noseBridge = allLandmarks[6];
        const leftEar = allLandmarks[234];
        const rightEar = allLandmarks[454];

        if (
            leftEye.length === 0 ||
            rightEye.length === 0 ||
            !noseBridge ||
            !leftEar ||
            !rightEar
        ) {
            return { landmarks: null, faceDetected: false };
        }

        const faceContourIndices = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
        ];

        const facePoints = faceContourIndices
            .map((i) => allLandmarks[i])
            .filter(Boolean);

        if (facePoints.length === 0) {
            return { landmarks: null, faceDetected: false };
        }

        const xs = facePoints.map((p) => p.x);
        const ys = facePoints.map((p) => p.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const faceWidth = maxX - minX;
        const faceHeight = maxY - minY;

        if (faceWidth <= 0 || faceHeight <= 0) {
            return { landmarks: null, faceDetected: false };
        }

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

        hasLoggedDetectionWarning = false;

        return { landmarks, faceDetected: true };
    } catch (error) {
        if (!hasLoggedDetectionWarning) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn("Face landmark detection skipped for a frame.", errorMessage);
            hasLoggedDetectionWarning = true;
        }

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

    const eyeCenterX = ((leftEyeAvg.x + rightEyeAvg.x) / 2) * canvasWidth;
    const eyeCenterY = ((leftEyeAvg.y + rightEyeAvg.y) / 2) * canvasHeight;

    const glassesScale = landmarks.faceWidth * canvasWidth * 1.6;
    const rotation =
        Math.atan2(
            rightEyeAvg.y - leftEyeAvg.y,
            rightEyeAvg.x - leftEyeAvg.x
        ) *
        (180 / Math.PI);

    return {
        x: eyeCenterX,
        y: eyeCenterY,
        scale: glassesScale,
        rotation,
    };
};

export const getEarringPosition = (
    landmarks: FaceLandmarks,
    side: "left" | "right",
    canvasWidth: number,
    canvasHeight: number
) => {
    const ear = side === "left" ? landmarks.leftEar : landmarks.rightEar;

    const earX = ear.x * canvasWidth;
    const earY = ear.y * canvasHeight;

    const earringScale = landmarks.faceWidth * canvasWidth * 0.6;

    return {
        x: earX,
        y: earY,
        scale: earringScale,
        rotation: 0,
    };
};
