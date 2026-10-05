"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";

import { useTryOnStore } from "../store/tryon";

import {

    initializeFaceLandmarker,

    detectFaceLandmarks,

    getGlassesPosition,

    getEarringPosition,


    getHatPosition,

} from "./FaceLandmarkService";

import {

  detectShoulders,

  initializePoseLandmarker,

} from "./PoseLandmarkService";

type OverlayItem = {

    id: string;

    name: string;

    src: string;

    thumb?: string;

};

type FaceTryOnProps = {

    selectedOverlay?: OverlayItem | null;

    category?: string;

};

type Smoothed = { x: number; y: number; scale: number; rotation: number };

type ShoulderGeometry = {

  centerX: number;

  centerY: number;

  distance: number;

  angle: number;

};

const getShoulderGeometry = (

  left: { x: number; y: number },

  right: { x: number; y: number }

): ShoulderGeometry => {

  const dx = right.x - left.x;

  const dy = right.y - left.y;

  return {

    centerX: (left.x + right.x) / 2,

    centerY: (left.y + right.y) / 2,

    distance: Math.hypot(dx, dy),

    angle: Math.atan2(dy, dx),

  };

};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const smoothTransform = (prev: Smoothed | null, next: Smoothed, t = 0.22): Smoothed => {

    if (!prev) return next;

    const r1 = prev.rotation;

    const r2 = next.rotation;

    const diff = ((r2 - r1 + 540) % 360) - 180;

    const r = r1 + diff * t;

    return {

        x: lerp(prev.x, next.x, t),

        y: lerp(prev.y, next.y, t),

        scale: lerp(prev.scale, next.scale, t),

        rotation: r,

    };

};

export default function FaceTryOn({ selectedOverlay }: FaceTryOnProps) {

    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

    const [started, setStarted] = useState(false);

    const [imgStatus, setImgStatus] = useState<"none" | "loading" | "loaded" | "error">("none");

    const [imgError, setImgError] = useState<string>("");

    const videoRef = useRef<HTMLVideoElement>(null);

    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const rafRef = useRef<number>(0);

    const streamRef = useRef<MediaStream | null>(null);

    const smoothRef = useRef<Smoothed | null>(null);

    const lastVideoTimeRef = useRef<number>(-1);

    // Galaxy Pose 001-MC — necklace pose-loss protection

    const lastGoodNecklaceAnchorRef = useRef<Smoothed | null>(null);

    const necklacePoseLostFramesRef = useRef<number>(0);

    const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

    const visibleLayersRef = useRef<ReturnType<typeof useTryOnStore.getState>["layers"]>([]);

    const lostFramesRef = useRef<number>(0);

    const isCameraStoppingRef = useRef(false);

    const layers = useTryOnStore((s) => s.layers);

    const xp = useTryOnStore((s) => s.xp);

    const level = useTryOnStore((s) => s.level);

    const missions = useTryOnStore((s) => s.missions);

    const tryMission = missions.find((m) => m.id === "try-3-items");

    const visibleLayers = useMemo(

        () => layers.filter((layer) => !!layer.asset?.src && layer.visible !== false),

        [layers]

    );

    useEffect(() => {

        visibleLayersRef.current = visibleLayers;

    }, [visibleLayers]);

    const resetTrackingState = () => {

        lastVideoTimeRef.current = -1;

        lostFramesRef.current = 0;

        smoothRef.current = null;

        lastGoodNecklaceAnchorRef.current = null;

        necklacePoseLostFramesRef.current = 0;

    };

    const clearCanvas = () => {

        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        ctx?.clearRect(0, 0, canvas.width, canvas.height);

    };

    const stopCamera = () => {

        isCameraStoppingRef.current = true;

        cancelAnimationFrame(rafRef.current);

        if (streamRef.current) {

            streamRef.current.getTracks().forEach((track) => track.stop());

            streamRef.current = null;

        }

        const video = videoRef.current;

        if (video) {

            video.pause();

            video.onloadedmetadata = null;

            const mediaVideo = video as HTMLVideoElement & { srcObject: MediaStream | null };

            mediaVideo.srcObject = null;

        }

        clearCanvas();

        resetTrackingState();

        setStatus("idle");

        setStarted(false);

    };

    // Galaxy Pose 001-M — production debug controls

    const SHOW_POSE_DEBUG = false;

    useEffect(() => {

        const overlayUrl = selectedOverlay?.src ?? "";

        if (!overlayUrl) {

            setImgStatus("none");

            setImgError("");

            return;

        }

        resetTrackingState();

        setImgStatus("loading");

        setImgError("");

        const img = new Image();

        img.src = overlayUrl;

        img.onload = () => setImgStatus("loaded");

        img.onerror = () => {

            setImgStatus("error");

            setImgError(`Failed to load: ${overlayUrl}`);

        };

    }, [selectedOverlay]);

    useEffect(() => {

        visibleLayers.forEach((layer) => {

            const asset = layer.asset;

            if (!asset?.id || !asset?.src) return;

            if (imageCacheRef.current[asset.id]) return;

            const img = new Image();

            img.src = asset.src;

            imageCacheRef.current[asset.id] = img;

        });

    }, [visibleLayers]);

    useEffect(() => {

        if (!started) return;

        let cancelled = false;

        isCameraStoppingRef.current = false;

        const start = async () => {

            if (streamRef.current) return;

            try {

                setStatus("loading");

                const detector = await initializeFaceLandmarker();

                const poseDetector = await initializePoseLandmarker();

                poseLandmarkerRef.current = poseDetector;

                if (cancelled || isCameraStoppingRef.current) return;

                const stream = await navigator.mediaDevices.getUserMedia({

                    video: { facingMode: "user" },

                    audio: false,

                });

                if (cancelled || isCameraStoppingRef.current) {

                    stream.getTracks().forEach((track) => track.stop());

                    return;

                }

                streamRef.current = stream;

                const video = videoRef.current;

                if (!video) throw new Error("Video element not ready");

                const mediaVideo = video as HTMLVideoElement & { srcObject: MediaStream | null };

                mediaVideo.srcObject = stream;

                await new Promise<void>((resolve) => {

                    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {

                        resolve();

                        return;

                    }

                    video.onloadedmetadata = () => resolve();

                });

                if (cancelled || isCameraStoppingRef.current) return;

                await video.play();

                if (cancelled || isCameraStoppingRef.current) return;

                setStatus("ready");

                const canvas = canvasRef.current;

                if (!canvas) throw new Error("Canvas element not ready");

                const ctx = canvas.getContext("2d");

                if (!ctx) throw new Error("2D context not available");

                const loop = () => {

                    const v = videoRef.current;

                    const c = canvasRef.current;

                    if (cancelled || isCameraStoppingRef.current || !streamRef.current || !v || !c) {

                        return;

                    }

                    if (v.videoWidth <= 0 || v.videoHeight <= 0) {

                        rafRef.current = requestAnimationFrame(loop);

                        return;

                    }

                    if (c.width !== v.videoWidth) c.width = v.videoWidth;

                    if (c.height !== v.videoHeight) c.height = v.videoHeight;

                    if (

                        v.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ||

                        v.paused ||

                        v.ended ||

                        !Number.isFinite(v.currentTime) ||

                        v.currentTime <= 0

                    ) {

                        rafRef.current = requestAnimationFrame(loop);

                        return;

                    }

                    if (v.currentTime <= lastVideoTimeRef.current) {

                        rafRef.current = requestAnimationFrame(loop);

                        return;

                    }

                    lastVideoTimeRef.current = v.currentTime;

                    const { landmarks, faceDetected } = detectFaceLandmarks(v, detector);

                    const { shoulders, poseDetected } = detectShoulders(

                    v,

                    poseLandmarkerRef.current ?? undefined

                    );

                 let shoulderPixels: {

                     left: { x: number; y: number };

                     right: { x: number; y: number };

                     center: { x: number; y: number };

                     distance: number;

                     angle: number;

                 } | null = null;

                 if (poseDetected && shoulders) {

                    const shoulderGeometry = getShoulderGeometry(

                        shoulders.leftShoulder,

                        shoulders.rightShoulder

                    );

                    shoulderPixels = {

                        left: {

                        x: shoulders.leftShoulder.x * c.width,

                        y: shoulders.leftShoulder.y * c.height,

                        },

                        right: {

                        x: shoulders.rightShoulder.x * c.width,

                        y: shoulders.rightShoulder.y * c.height,

                        },

                        center: {

                        x: shoulderGeometry.centerX * c.width,

                        y: shoulderGeometry.centerY * c.height,

                        },

                        distance: shoulderGeometry.distance * c.width,

                        angle: shoulderGeometry.angle,

                    };

                    //console.log("[Galaxy Pose 001-G] CAMERA-SPACE SHOULDERS", shoulderPixels);

                    }

                    if (faceDetected && landmarks) {

                        lostFramesRef.current = 0;

                        ctx.clearRect(0, 0, c.width, c.height);

                        const glassesAnchor = getGlassesPosition(landmarks, c.width, c.height);

                        const next: Smoothed = {

                            x: glassesAnchor.x,

                            y: glassesAnchor.y,

                            scale: glassesAnchor.scale,

                            rotation: glassesAnchor.rotation,

                        };

                        const baseT = (smoothRef.current = smoothTransform(

                            smoothRef.current,

                            next,

                            0.22

                        ));

                        // Galaxy Pose 001-MC — necklace pose-loss protection
                        let necklaceAnchor: Smoothed | null = null;

                        if (shoulderPixels) {
                            necklaceAnchor = {
                                x: shoulderPixels.center.x,
                                y: shoulderPixels.center.y,
                                scale: shoulderPixels.distance * 0.45,
                                rotation: (() => {
                                    let deg = shoulderPixels.angle * (180 / Math.PI);
                                    if (deg > 90) deg -= 180;
                                    if (deg < -90) deg += 180;
                                    return deg;
                                })(),
                            };
                            lastGoodNecklaceAnchorRef.current = necklaceAnchor;
                            necklacePoseLostFramesRef.current = 0;
                        } else {
                            necklacePoseLostFramesRef.current += 1;
                            if (necklacePoseLostFramesRef.current <= 12 && lastGoodNecklaceAnchorRef.current) {
                                necklaceAnchor = lastGoodNecklaceAnchorRef.current;
                            }
                        }

                        for (const layer of visibleLayersRef.current) {

                            const img = imageCacheRef.current[layer.asset.id];

                            if (!img || !img.complete || img.naturalWidth <= 0) continue;

                            if (layer.category === "earrings") {

                                const leftAnchor = getEarringPosition(

                                    landmarks,

                                    "left",

                                    c.width,

                                    c.height

                                );

                                const rightAnchor = getEarringPosition(

                                    landmarks,

                                    "right",

                                    c.width,

                                    c.height

                                );

                                const leftT: Smoothed = {

                                    x: leftAnchor.x + layer.x,

                                    y: leftAnchor.y + layer.y,

                                    scale: leftAnchor.scale * layer.scale * (1 + layer.z * 0.1),

                                    rotation: leftAnchor.rotation + layer.rotation,

                                };

                                const rightT: Smoothed = {

                                    x: rightAnchor.x + layer.x,

                                    y: rightAnchor.y + layer.y,

                                    scale: rightAnchor.scale * layer.scale * (1 + layer.z * 0.1),

                                    rotation: rightAnchor.rotation + layer.rotation,

                                };

                                drawOverlayImage(ctx, img, leftT, 0.55, 0.55, layer.opacity);

                                drawOverlayImage(ctx, img, rightT, 0.55, 0.55, layer.opacity);

                            } else {

                                const anchor =

                                    layer.category === "necklaces"

                                        ? necklaceAnchor

                                        : layer.category === "hats"

                                        ? getHatPosition(landmarks, c.width, c.height)

                                        : baseT;

                                if (!anchor) continue;

                                const t: Smoothed = {

                                    x: anchor.x + layer.x,

                                    y: anchor.y + layer.y,

                                    scale: anchor.scale * layer.scale * (1 + layer.z * 0.1),

                                    rotation: anchor.rotation + layer.rotation,

                                };

                                if (

                                    layer.category === "glasses" ||

                                    layer.category === "sunglasses"

                                ) {

                                    drawOverlayImage(ctx, img, t, 1.15, 0.45, layer.opacity);

                                } else {

                                    drawOverlayImage(ctx, img, t, 0.9, 0.9, layer.opacity);

                                }

                            }

                        }

                    } else {

                        lostFramesRef.current += 1;

                        if (lostFramesRef.current > 6) {

                            ctx.clearRect(0, 0, c.width, c.height);

                            smoothRef.current = null;

                        }

                    }

                    // Galaxy Pose 001-J — Camera Mirror Audit

                    if (SHOW_POSE_DEBUG && shoulderPixels) {

                        ctx.save();

                        // LEFT shoulder = red circle

                        ctx.fillStyle = "red";

                        ctx.beginPath();

                        ctx.arc(

                            shoulderPixels.left.x,

                            shoulderPixels.left.y,

                            10,

                            0,

                            Math.PI * 2

                        );

                        ctx.fill();

                        // RIGHT shoulder = blue square

                        ctx.fillStyle = "blue";

                        ctx.fillRect(

                            shoulderPixels.right.x - 10,

                            shoulderPixels.right.y - 10,

                            20,

                            20

                        );

                        ctx.restore();

                    }

                    rafRef.current = requestAnimationFrame(loop);

                };

                rafRef.current = requestAnimationFrame(loop);

            } catch (err) {

                console.warn("Camera/tracker startup issue:", err);

                setStatus("error");

                stopCamera();

            }

        };

        start();

        return () => {

            cancelled = true;

            isCameraStoppingRef.current = true;

            cancelAnimationFrame(rafRef.current);

            if (streamRef.current) {

                streamRef.current.getTracks().forEach((track) => track.stop());

                streamRef.current = null;

            }

            resetTrackingState();

        };

    }, [started]);

    return (

        <div className="mx-auto w-full max-w-lg">

            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">

                <div className="rounded-xl border border-amber-100/20 bg-slate-900/80 px-3 py-2 text-white">

                    <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/70">

                        XP

                    </div>

                    <div className="mt-1 font-semibold text-amber-100">{xp}</div>

                </div>

                <div className="rounded-xl border border-amber-100/20 bg-slate-900/80 px-3 py-2 text-white">

                    <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/70">

                        Level

                    </div>

                    <div className="mt-1 font-semibold text-amber-100">{level}</div>

                </div>

                <div className="rounded-xl border border-amber-100/20 bg-slate-900/80 px-3 py-2 text-white">

                    <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100/70">

                        Mission

                    </div>

                    <div className="mt-1 font-semibold text-amber-100">

                        {tryMission ? `${tryMission.current}/${tryMission.target}` : "—"}

                    </div>

                </div>

            </div>

            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow">

                <video

                    ref={videoRef}

                    className="h-auto w-full transform scale-x-[-1]"

                    playsInline

                    muted

                    autoPlay

                />

                <canvas

                    ref={canvasRef}

                    className="pointer-events-none absolute inset-0 h-full w-full transform scale-x-[-1]"

                />

            </div>

            <div className="mt-3 text-sm text-slate-300">

                {status === "loading" && "Loading face tracker…"}

                {status === "ready" && "Tracker ready. Move your head—overlay should stay locked."}

                {status === "error" && "Camera/tracker error. Check permissions and console."}

                {status === "idle" && "Select an item, then start the camera."}

            </div>
            
            {SHOW_POSE_DEBUG && (
                <div className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-bold text-white">
                    GALAXY POSE DEBUG ON
                </div>
            )}

            <div className="mt-2 text-xs text-slate-300">

                Selected overlay:{" "}

                <span className="font-semibold text-white">

                    {selectedOverlay ? selectedOverlay.name : "none"}

                </span>

            </div>

            <div className="mt-2 text-xs text-slate-300">

                Image status: <span className="font-semibold text-white">{imgStatus}</span>

                {imgError ? <div className="break-all text-red-300">{imgError}</div> : null}

            </div>

            <div className="mt-2 text-xs text-slate-300">

                Visible layers:{" "}

                <span className="font-semibold text-white">

                    {visibleLayers.length > 0

                        ? visibleLayers.map((l) => l.asset.name).join(" | ")

                        : "none"}

                </span>

            </div>

            {tryMission ? (

                <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white">

                    <div className="font-semibold">{tryMission.title}</div>

                    <div className="text-xs text-slate-400">

                        Progress: {tryMission.current}/{tryMission.target}

                        {tryMission.completed ? " • Complete!" : ""}

                    </div>

                </div>

            ) : null}

            {!started ? (

                <button

                    onClick={() => setStarted(true)}

                    className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"

                >

                    Start Camera

                </button>

            ) : (

                <button

                    onClick={stopCamera}

                    className="mt-3 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-300"

                >

                    Stop Camera

                </button>

            )}

        </div>

    );

}

function drawOverlayImage(

    ctx: CanvasRenderingContext2D,

    img: HTMLImageElement,

    t: Smoothed,

    widthScale = 1,

    heightScale = 1,

    opacity = 1

) {

    ctx.save();

    ctx.globalAlpha = opacity;

    ctx.translate(t.x, t.y);

    ctx.rotate((t.rotation * Math.PI) / 180);

    const w = t.scale * widthScale;

    const h = t.scale * heightScale;

    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    ctx.restore();

}