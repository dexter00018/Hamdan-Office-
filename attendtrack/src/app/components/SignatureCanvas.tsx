'use client';
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignatureCanvasHandle {
  clear: () => void;
  toDataURL: () => string;
  isEmpty: () => boolean;
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ width = 400, height = 130 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
    }, []);

    const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      isDrawing.current = true;
      hasDrawn.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }, []);

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if ('preventDefault' in e) e.preventDefault();
    }, []);

    const stopDrawing = useCallback(() => {
      isDrawing.current = false;
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        window.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [startDrawing, draw, stopDrawing]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
      },
      toDataURL: () => canvasRef.current?.toDataURL() ?? '',
      isEmpty: () => !hasDrawn.current,
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="signature-canvas w-full border-2 border-border rounded-lg bg-white"
        style={{ touchAction: 'none' }}
        aria-label="Digital signature pad — draw your signature here"
      />
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';
export default SignatureCanvas;