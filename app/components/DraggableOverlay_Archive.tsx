"use client";
import React, { useRef, useState } from "react";

type Props = {
  src: string;
  initialX?: number;
  initialY?: number;
  initialScale?: number;
  initialRot?: number;
};

export default function DraggableOverlay({
  src,
  initialX = 80,
  initialY = 80,
  initialScale = 1,
  initialRot = 0,
}: Props) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [scale, setScale] = useState(initialScale);
  const [rot, setRot] = useState(initialRot);

  const activeId = useRef<number | null>(null);
  const dragOrigin = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    activeId.current = e.pointerId;
    dragOrigin.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId || !dragOrigin.current) return;
    const { sx, sy, ox, oy } = dragOrigin.current;
    setX(ox + (e.clientX - sx));
    setY(oy + (e.clientY - sy));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (activeId.current === e.pointerId) {
      activeId.current = null;
      dragOrigin.current = null;
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      // Rotate with Shift + wheel
      setRot((r) => r + e.deltaY * 0.1);
    } else {
      // Zoom with wheel
      setScale((s) => Math.min(4, Math.max(0.2, s * (e.deltaY < 0 ? 1.05 : 0.95))));
    }
  };

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      className="absolute select-none touch-none cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`,
        transformOrigin: "center center",
      }}
    />
  );
}
