"use client";

import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";

import PredictionOverlay from "@/components/sketchpad/PredictionOverlay";

type CanvasProps = {
  predictionEnabled: boolean;
  clearVersion: number;
  onReady?: (api: { getDataURL: () => string | null }) => void;
};

export default function Canvas({
  predictionEnabled,
  clearVersion,
  onReady,
}: CanvasProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    const element = canvasElementRef.current;
    const wrapper = wrapperRef.current;
    if (!element || !wrapper) {
      return;
    }

    const fabricCanvas = new FabricCanvas(element, {
      isDrawingMode: true,
      selection: false,
    });

    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();

    const brush = new PencilBrush(fabricCanvas);
    brush.color = "#000000";
    brush.width = 3;
    fabricCanvas.freeDrawingBrush = brush;

    const resizeCanvas = () => {
      const width = wrapper.clientWidth;
      const height = 260;
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.renderAll();
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(wrapper);

    fabricRef.current = fabricCanvas;

    onReady?.({
      getDataURL: () =>
        fabricRef.current?.toDataURL({
          format: "png",
          multiplier: 1,
        }) ?? null,
    });

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
  }, [clearVersion]);

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <PredictionOverlay enabled={predictionEnabled} />
      <div
        ref={wrapperRef}
        className="overflow-hidden rounded-lg border border-zinc-700 bg-white"
      >
        <canvas ref={canvasElementRef} />
      </div>
    </div>
  );
}
