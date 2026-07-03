"use client";

import { useEffect, useRef } from "react";
import { getAnalyser } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

const BAR_COUNT = 20;

/** Compact frequency-bars visualizer fed by the shared Web Audio analyser. */
export function Visualizer({
  width = 96,
  height = 28,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.9)");
    gradient.addColorStop(1, "rgba(232, 121, 249, 0.9)");
    ctx.fillStyle = gradient;

    let frame = 0;
    const barWidth = width / BAR_COUNT;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const analyser = getAnalyser();

      if (analyser && isPlaying) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        for (let i = 0; i < BAR_COUNT; i++) {
          // skip the lowest bin (DC-ish rumble) for a livelier picture
          const value = data[i + 1] ?? 0;
          const barHeight = Math.max(2, (value / 255) * height);
          ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }
      } else {
        // idle: flat dots
        for (let i = 0; i < BAR_COUNT; i++) {
          ctx.fillRect(i * barWidth + 1, height - 2, barWidth - 2, 2);
        }
      }
      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [width, height, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      aria-hidden
      className={cn("hidden opacity-90 xl:block", className)}
    />
  );
}
