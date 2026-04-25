"use client";

import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush, Point } from "fabric";

import PredictionOverlay from "@/components/sketchpad/PredictionOverlay";

type CanvasProps = {
  predictionEnabled: boolean;
  clearVersion: number;
  brushColor: string;
  activeTool: "brush" | "picker" | "transform";
  onBrushColorChange: (color: string) => void;
  canvasHeight: number;
  canvasWidth?: number;
  onCanvasSizeChange: (size: { width?: number; height: number }) => void;
};

const MIN_WIDTH = 280;
const MAX_WIDTH = 1400;
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 900;

type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

type ResizeState = {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

const RESIZE_HANDLES: ResizeDirection[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const HANDLE_CLASS_BY_DIRECTION: Record<ResizeDirection, string> = {
  n: "absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-n-resize rounded-full border border-zinc-400 bg-zinc-100",
  ne: "absolute right-0 top-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-ne-resize rounded-full border border-zinc-400 bg-zinc-100",
  e: "absolute right-0 top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 cursor-e-resize rounded-full border border-zinc-400 bg-zinc-100",
  se: "absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border border-zinc-400 bg-zinc-100",
  s: "absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-s-resize rounded-full border border-zinc-400 bg-zinc-100",
  sw: "absolute bottom-0 left-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 cursor-sw-resize rounded-full border border-zinc-400 bg-zinc-100",
  w: "absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-w-resize rounded-full border border-zinc-400 bg-zinc-100",
  nw: "absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize rounded-full border border-zinc-400 bg-zinc-100",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Canvas({
  predictionEnabled,
  clearVersion,
  brushColor,
  activeTool,
  onBrushColorChange,
  canvasHeight,
  canvasWidth,
  onCanvasSizeChange,
}: CanvasProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const activeToolRef = useRef(activeTool);

  const applyTransformMode = (fabricCanvas: FabricCanvas, canTransform: boolean) => {
    fabricCanvas.selection = canTransform;
    fabricCanvas.defaultCursor = canTransform ? "move" : "crosshair";
    fabricCanvas.forEachObject((object) => {
      object.set({
        selectable: canTransform,
        evented: canTransform,
      });
    });
    fabricCanvas.requestRenderAll();
  };

  useEffect(() => {
    const element = canvasElementRef.current;
    if (!element) {
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
    applyTransformMode(fabricCanvas, false);

    const onPathCreated = () => {
      applyTransformMode(fabricCanvas, activeToolRef.current === "transform");
    };
    fabricCanvas.on("path:created", onPathCreated);

    fabricRef.current = fabricCanvas;

    return () => {
      fabricCanvas.off("path:created", onPathCreated);
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    const wrapper = wrapperRef.current;
    if (!fabricCanvas || !wrapper) {
      return;
    }

    const width = Math.floor(wrapper.clientWidth);
    const height = Math.floor(canvasHeight);
    if (width <= 0 || height <= 0) {
      return;
    }

    fabricCanvas.setDimensions({ width, height });
    fabricCanvas.renderAll();
  }, [canvasHeight, canvasWidth]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const hostWidth = Math.floor(host.clientWidth);
      if (hostWidth <= 0) {
        return;
      }

      if (canvasWidth === undefined) {
        const initialWidth = clamp(hostWidth, MIN_WIDTH, MAX_WIDTH);
        onCanvasSizeChange({ width: initialWidth, height: canvasHeight });
        return;
      }

      const clampedWidth = clamp(canvasWidth, MIN_WIDTH, Math.min(MAX_WIDTH, hostWidth));
      if (clampedWidth !== canvasWidth) {
        onCanvasSizeChange({ width: clampedWidth, height: canvasHeight });
      }
    });

    resizeObserver.observe(host);
    return () => resizeObserver.disconnect();
  }, [canvasHeight, canvasWidth, onCanvasSizeChange]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    const brush = fabricCanvas.freeDrawingBrush;
    if (brush) {
      brush.color = brushColor;
    }
  }, [brushColor]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    const isBrush = activeTool === "brush";
    const canTransform = activeTool === "transform";
    fabricCanvas.isDrawingMode = isBrush;
    applyTransformMode(fabricCanvas, canTransform);
  }, [activeTool]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    const onMouseWheel = (eventData: { e: WheelEvent }) => {
      const event = eventData.e;
      event.preventDefault();
      event.stopPropagation();

      const currentZoom = fabricCanvas.getZoom();
      const zoomFactor = Math.pow(0.999, event.deltaY);
      const nextZoom = clamp(currentZoom * zoomFactor, 0.25, 6);
      const point = new Point(event.offsetX, event.offsetY);

      fabricCanvas.zoomToPoint(point, nextZoom);
      fabricCanvas.requestRenderAll();
    };

    fabricCanvas.on("mouse:wheel", onMouseWheel);
    return () => {
      fabricCanvas.off("mouse:wheel", onMouseWheel);
    };
  }, []);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    if (activeTool !== "picker") {
      return;
    }

    const onMouseDown = (eventData: { e: Event }) => {
      const pointer = fabricCanvas.getViewportPoint(eventData.e as unknown as PointerEvent);
      const context = canvasElementRef.current?.getContext("2d");
      if (!context) {
        return;
      }

      const pixel = context.getImageData(Math.round(pointer.x), Math.round(pointer.y), 1, 1).data;
      const alpha = pixel[3] / 255;
      if (alpha <= 0) {
        return;
      }

      const toHex = (value: number) => value.toString(16).padStart(2, "0");
      const sampledColor = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
      onBrushColorChange(sampledColor);
    };

    fabricCanvas.on("mouse:down", onMouseDown);
    return () => {
      fabricCanvas.off("mouse:down", onMouseDown);
    };
  }, [activeTool, onBrushColorChange]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) {
      return;
    }

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
  }, [clearVersion]);

  const handleResizeStart = (direction: ResizeDirection, event: React.PointerEvent<HTMLButtonElement>) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    resizeStateRef.current = {
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: wrapper.clientWidth,
      startHeight: canvasHeight,
    };
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const state = resizeStateRef.current;
      const host = hostRef.current;
      if (!state || !host) {
        return;
      }

      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;

      const hostWidth = Math.floor(host.clientWidth);
      const maxAllowedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, hostWidth));

      let nextWidth = state.startWidth;
      let nextHeight = state.startHeight;

      if (state.direction.includes("e")) {
        nextWidth = state.startWidth + dx;
      }
      if (state.direction.includes("w")) {
        nextWidth = state.startWidth - dx;
      }
      if (state.direction.includes("s")) {
        nextHeight = state.startHeight + dy;
      }
      if (state.direction.includes("n")) {
        nextHeight = state.startHeight - dy;
      }

      onCanvasSizeChange({
        width: clamp(Math.round(nextWidth), MIN_WIDTH, maxAllowedWidth),
        height: clamp(Math.round(nextHeight), MIN_HEIGHT, MAX_HEIGHT),
      });
    };

    const onPointerUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onCanvasSizeChange]);

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <PredictionOverlay enabled={predictionEnabled} />
      <div ref={hostRef} className="w-full">
        <div
          ref={wrapperRef}
          className="relative overflow-hidden rounded-lg border border-zinc-700 bg-white"
          style={{
            width: canvasWidth ? `${canvasWidth}px` : "100%",
            height: `${canvasHeight}px`,
          }}
        >
          <canvas ref={canvasElementRef} />
          {RESIZE_HANDLES.map((direction) => (
            <button
              key={direction}
              type="button"
              aria-label={`Resize sketchpad ${direction}`}
              onPointerDown={(event) => handleResizeStart(direction, event)}
              className={HANDLE_CLASS_BY_DIRECTION[direction]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
