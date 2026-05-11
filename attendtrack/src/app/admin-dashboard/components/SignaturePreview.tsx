'use client';
import React, { useState } from 'react';
import { CheckCircle2, XCircle, ZoomIn } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface SignaturePreviewProps {
  signatureData: string | null;
  employeeName: string;
}

export default function SignaturePreview({ signatureData, employeeName }: SignaturePreviewProps) {
  const [open, setOpen] = useState(false);

  if (!signatureData || signatureData === 'data:image/png;base64,iVBORw0KGgo=') {
    return (
      <span className="flex items-center gap-1 text-xs text-danger">
        <XCircle className="w-3.5 h-3.5" />
        Missing
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:border-primary hover:bg-primary/5 transition-all duration-100 group"
        aria-label={`View signature for ${employeeName}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">View</span>
        <ZoomIn className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Signature — ${employeeName}`} maxWidth="max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full border-2 border-border rounded-lg overflow-hidden bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureData}
              alt={`Digital signature of ${employeeName}`}
              className="w-full h-auto"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Digital signature captured at submission time
          </p>
        </div>
      </Modal>
    </>
  );
}