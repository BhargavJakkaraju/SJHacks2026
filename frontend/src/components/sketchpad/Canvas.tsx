"use client";

import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, FabricImage, PencilBrush } from "fabric";

type CanvasApi = {
  getDataURL: () => string | null;
  applyImage: (dataUrl: string) => void;
  undoApplied: () => void;
  getJSON: () => object | null;
  loadJSON: (state: object | null) => Promise<void>;
};

type CanvasProps = {
  predictionEnabled: boolean;
  clearVersion: number;
  onReady?: (api: CanvasApi) => void;
  fillHeight?: boolean;
  brushColor?: string;
  eraserMode?: boolean;
  selectionMode?: boolean;
};

const CANVAS_BG = "#0a0a0a";

export default function Canvas({
  predictionEnabled: _predictionEnabled,
  clearVersion,
  onReady,
  fillHeight = false,
  brushColor = "#ffffff",
  eraserMode = false,
  selectionMode = false,
}: CanvasProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fillHeightRef = useRef(fillHeight);
  const appliedImageRef = useRef<FabricImage | null>(null);
  // Keep the latest onReady callback in a ref so the mount effect can be
  // dependency-free and the Fabric canvas mounts exactly once.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    fillHeightRef.current = fillHeight;
    const fabricCanvas = fabricRef.current;
    const wrapper = wrapperRef.current;
    if (!fabricCanvas || !wrapper) return;
    const width = wrapper.clientWidth;
    const height = fillHeight ? wrapper.clientHeight || 260 : 260;
    fabricCanvas.setDimensions({ width, height });
    fabricCanvas.renderAll();
  }, [fillHeight]);

  useEffect(() => {
    const element = canvasElementRef.current;
    const wrapper = wrapperRef.current;
    if (!element || !wrapper) return;

    const fabricCanvas = new FabricCanvas(element, {
      isDrawingMode: true,
      selection: false,
    });

    fabricCanvas.backgroundColor = CANVAS_BG;
    fabricCanvas.renderAll();

    const brush = new PencilBrush(fabricCanvas);
    brush.color = "#ffffff";
    brush.width = 3;
    fabricCanvas.freeDrawingBrush = brush;

    const resizeCanvas = () => {
      const width = wrapper.clientWidth;
      const height = fillHeightRef.current ? wrapper.clientHeight || 260 : 260;
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.renderAll();
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(wrapper);

    fabricRef.current = fabricCanvas;

    onReadyRef.current?.({
      getDataURL: () =>
        fabricRef.current?.toDataURL({ format: "png", multiplier: 1 }) ?? null,

      applyImage: (dataUrl: string) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        FabricImage.fromURL(dataUrl).then((img) => {
          const scale = Math.min(
            (canvas.width ?? 300) / (img.width ?? 1),
            (canvas.height ?? 260) / (img.height ?? 1),
            1,
          ) * 0.8;
          img.scale(scale);
          img.set({
            left: ((canvas.width ?? 300) - (img.width ?? 0) * scale) / 2,
            top: ((canvas.height ?? 260) - (img.height ?? 0) * scale) / 2,
            selectable: false,
            evented: false,
          });
          canvas.add(img);
          canvas.renderAll();
          appliedImageRef.current = img;
        });
      },

      undoApplied: () => {
        const canvas = fabricRef.current;
        if (!canvas || !appliedImageRef.current) return;
        canvas.remove(appliedImageRef.current);
        appliedImageRef.current = null;
        canvas.renderAll();
      },

      getJSON: () => {
        const canvas = fabricRef.current;
        if (!canvas) return null;
        // toJSON returns a plain object snapshot of the canvas state
        return canvas.toJSON() as object;
      },

      loadJSON: async (state: object | null) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        appliedImageRef.current = null;
        if (!state) {
          canvas.clear();
          canvas.backgroundColor = CANVAS_BG;
          canvas.renderAll();
          return;
        }
        await canvas.loadFromJSON(state);
        canvas.backgroundColor = CANVAS_BG;
        canvas.renderAll();
      },
    });

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
    // Mount Fabric canvas exactly once. onReady is read via a ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (selectionMode) {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
    } else {
      canvas.isDrawingMode = true;
      canvas.selection = false;
      if (canvas.freeDrawingBrush) {
        const brush = canvas.freeDrawingBrush as PencilBrush;
        if (eraserMode) {
          // Eraser paints with the canvas background color so strokes vanish
          brush.color = CANVAS_BG;
          brush.width = 16;
        } else {
          brush.color = brushColor;
          brush.width = 3;
        }
      }
    }
  }, [brushColor, eraserMode, selectionMode]);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = CANVAS_BG;
    fabricCanvas.renderAll();
    appliedImageRef.current = null;
  }, [clearVersion]);

  return (
    <div
      className={
        fillHeight
          ? "relative flex h-full flex-col rounded-xl border border-white/10 bg-zinc-950 p-4"
          : "relative rounded-xl border border-white/10 bg-zinc-950 p-4"
      }
    >
      <div
        ref={wrapperRef}
        className={
          fillHeight
            ? "min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a]"
            : "overflow-hidden rounded-lg border border-white/10 bg-[#0a0a0a]"
        }
      >
        <canvas ref={canvasElementRef} />
      </div>
    </div>
  );
}
