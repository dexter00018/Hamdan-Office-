'use client';
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignatureCanvasHandle {
  clear: () => void;
  toDataURL: () => string;
  isEmpty: () => boolean;
  uploadImage: (file: File) => void; // Idinagdag para pwedeng i-trigger externally kung gusto mo
}

interface SignatureCanvasProps {
  width?: number;
  height?: number;
}

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  ({ width = 400, height = 130 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Function para ipasok ang image sa loob ng canvas
    const handleImageLoad = useCallback((file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Linisin muna ang canvas bago ilagay ang bagong image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // I-scale ang image para magkasya (aspect ratio aware)
          const hRatio = canvas.width / img.width;
          const vRatio = canvas.height / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShift_x = (canvas.width - img.width * ratio) / 2;
          const centerShift_y = (canvas.height - img.height * ratio) / 2;
          
          ctx.drawImage(
            img, 
            0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
          );
          
          hasDrawn.current = true;
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }, []);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageLoad(file);
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

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
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      },
      toDataURL: () => canvasRef.current?.toDataURL() ?? '',
      isEmpty: () => !hasDrawn.current,
      uploadImage: (file: File) => handleImageLoad(file)
    }));

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="signature-canvas w-full border-2 border-border rounded-lg bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
          aria-label="Digital signature pad — draw your signature here"
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={triggerFileInput}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors self-end underline"
        >
          Mag-upload ng picture ng pirma
        </button>
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';
export default SignatureCanvas;
