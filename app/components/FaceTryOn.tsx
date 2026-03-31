"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTryOnStore } from "../store/tryon";

import {
    initializeFaceLandmarker,
    detectFaceLandmarks,
    getGlassesPosition,
    getEarringPosition,
} from "./FaceLandmarkService";

type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

type FaceTryOnProps = {
    selectedOverlay?: OverlayItem | null;
};

type Smoothed = { x: number; y: number; scale: number; rotation: number };

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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const smoothRef = useRef<Smoothed | null>(null);
    const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
    const visibleLayersRef = useRef<ReturnType<typeof useTryOnStore.getState>["layers"]>([]);

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

    const stopCamera = () => {
        cancelAnimationFrame(rafRef.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        const video = videoRef.current;
        if (video) {
            video.pause();
            const mediaVideo = video as HTMLVideoElement & { srcObject: MediaStream | null };
            mediaVideo.srcObject = null;
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }

        smoothRef.current = null;
        setStatus("idle");
        setStarted(false);
    };

    useEffect(() => {
        const overlayUrl = selectedOverlay?.src ?? "";

        if (!overlayUrl) {
            setImgStatus("none");
            setImgError("");
            return;
        }

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

        const start = async () => {
            if (streamRef.current) return;

            try {
                setStatus("loading");

                const detector = await initializeFaceLandmarker();
                if (cancelled) return;

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false,
                });

                streamRef.current = stream;

                const video = videoRef.current;
                if (!video) throw new Error("Video element not ready");

                const mediaVideo = video as HTMLVideoElement & { srcObject: MediaStream | null };
                mediaVideo.srcObject = stream;

                await new Promise<void>((resolve) => {
                    video.onloadedmetadata = () => resolve();
                });

                await video.play();
                if (cancelled) return;

                setStatus("ready");

                const canvas = canvasRef.current;
                if (!canvas) throw new Error("Canvas element not ready");

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("2D context not available");

                const loop = () => {
                    const v = videoRef.current;
                    const c = canvasRef.current;
                    if (!v || !c) return;

                    if (c.width !== v.videoWidth) c.width = v.videoWidth;
                    if (c.height !== v.videoHeight) c.height = v.videoHeight;

                    ctx.clearRect(0, 0, c.width, c.height);

                    const { landmarks, faceDetected } = detectFaceLandmarks(v, detector);

                    if (faceDetected && landmarks) {
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

                        for (const layer of visibleLayersRef.current) {
                            const img = imageCacheRef.current[layer.asset.id];
                            if (!img || !img.complete) continue;

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
                                const t: Smoothed = {
                                    x: baseT.x + layer.x,
                                    y: baseT.y + layer.y,
                                    scale: baseT.scale * layer.scale * (1 + layer.z * 0.1),
                                    rotation: baseT.rotation + layer.rotation,
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
                        smoothRef.current = null;
                    }

                    rafRef.current = requestAnimationFrame(loop);
                };

                rafRef.current = requestAnimationFrame(loop);
            } catch (err) {
                console.error(err);
                setStatus("error");
                stopCamera();
            }
        };

        start();

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }
        };
    }, [started]);

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-slate-100 px-3 py-2">
                    <div className="opacity-60">XP</div>
                    <div className="font-semibold">{xp}</div>
                </div>

                <div className="rounded-xl bg-slate-100 px-3 py-2">
                    <div className="opacity-60">Level</div>
                    <div className="font-semibold">{level}</div>
                </div>

                <div className="rounded-xl bg-slate-100 px-3 py-2">
                    <div className="opacity-60">Mission</div>
                    <div className="font-semibold">
                        {tryMission ? `${tryMission.current}/${tryMission.target}` : "—"}
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-hidden rounded-2xl shadow">
                <video
                    ref={videoRef}
                    className="w-full h-auto transform scale-x-[-1]"
                    playsInline
                    muted
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
                />
            </div>

            <div className="mt-3 text-sm opacity-80">
                {status === "loading" && "Loading face tracker…"}
                {status === "ready" && "Tracker ready. Move your head—overlay should stay locked."}
                {status === "error" && "Camera/tracker error. Check permissions and console."}
                {status === "idle" && "Select an item, then start the camera."}
            </div>

            <div className="mt-2 text-xs">
                Selected overlay:{" "}
                <span className="font-semibold">
                    {selectedOverlay ? selectedOverlay.name : "none"}
                </span>
            </div>

            <div className="mt-2 text-xs">
                Image status: <span className="font-semibold">{imgStatus}</span>
                {imgError ? <div className="text-red-600 break-all">{imgError}</div> : null}
            </div>

            <div className="mt-2 text-xs">
                Visible layers:{" "}
                <span className="font-semibold">
                    {visibleLayers.length > 0
                        ? visibleLayers.map((l) => l.asset.name).join(" | ")
                        : "none"}
                </span>
            </div>

            {tryMission ? (
                <div className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <div className="font-semibold">{tryMission.title}</div>
                    <div className="text-xs opacity-70">
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
                    className="mt-3 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300"
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