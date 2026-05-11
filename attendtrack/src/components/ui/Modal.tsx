'use client';
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  closable?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  closable = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (closable && e.target === overlayRef.current) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
    >
      <div
        className={[
          'bg-card rounded-[var(--radius)] shadow-glass w-full mx-4 animate-slide-up',
          maxWidth,
        ].join(' ')}
      >
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {closable && onClose && (
              <button
                onClick={onClose}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
                aria-label="Close dialog"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}