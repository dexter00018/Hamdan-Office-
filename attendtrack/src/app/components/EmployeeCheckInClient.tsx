'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { LogIn, LogOut, PenLine, RotateCcw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import LiveClock from './LiveClock';
import SignatureCanvas, { SignatureCanvasHandle } from './SignatureCanvas';
import TodaySubmissions from './TodaySubmissions';
import { ToastContainer, ToastMessage } from '@/components/ui/Toast';
import { saveRecord, getTodayRecords, generateId, AttendanceRecord } from '@/lib/attendanceStore';

interface FormValues {
  employeeName: string;
  employeeId: string;
}

function formatNow(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function isLate(timeStr: string): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  return h > 9 || (h === 9 && m > 0);
}

export default function EmployeeCheckInClient() {
  const sigRef = useRef<SignatureCanvasHandle>(null);
  const [timeInStamp, setTimeInStamp] = useState<string | null>(null);
  const [timeOutStamp, setTimeOutStamp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const refreshTodayRecords = useCallback(async () => {
    try {
      const records = await getTodayRecords();
      setTodayRecords(records);
    } catch (error) {
      console.error('Failed to load today records:', error);
      setTodayRecords([]);
    }
  }, []);

  useEffect(() => {
    refreshTodayRecords();
  }, [refreshTodayRecords]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTimeIn = () => {
    if (timeInStamp) {
      addToast({ type: 'warning', title: 'Time-In already recorded', description: `Logged at ${timeInStamp}` });
      return;
    }
    const t = formatNow();
    setTimeInStamp(t);
    addToast({
      type: 'success',
      title: 'Time-In recorded',
      description: `Logged at ${t}${isLate(t) ? ' — marked as Late' : ''}`,
    });
  };

  const handleTimeOut = () => {
    if (!timeInStamp) {
      addToast({ type: 'error', title: 'Log Time-In first', description: 'You must record Time-In before Time-Out.' });
      return;
    }
    if (timeOutStamp) {
      addToast({ type: 'warning', title: 'Time-Out already recorded', description: `Logged at ${timeOutStamp}` });
      return;
    }
    const t = formatNow();
    setTimeOutStamp(t);
    addToast({ type: 'success', title: 'Time-Out recorded', description: `Logged at ${t}` });
  };

  const onSubmit = async (data: FormValues) => {
    if (!timeInStamp) {
      addToast({ type: 'error', title: 'Time-In required', description: 'Press the Time In button before submitting.' });
      return;
    }
    if (sigRef.current?.isEmpty()) {
      addToast({ type: 'error', title: 'Signature required', description: 'Please draw your signature before submitting.' });
      return;
    }

    setSubmitting(true);

    const today = new Date().toISOString().split('T')[0];
    const sigData = sigRef.current?.toDataURL() ?? null;

    let status: AttendanceRecord['status'] = 'pending';
    if (timeInStamp && timeOutStamp) {
      status = isLate(timeInStamp) ? 'late' : 'complete';
    } else if (timeInStamp) {
      status = isLate(timeInStamp) ? 'late' : 'present';
    }

    const record: AttendanceRecord = {
      id: generateId(),
      employeeName: data.employeeName.trim(),
      employeeId: data.employeeId.trim(),
      date: today,
      timeIn: timeInStamp,
      timeOut: timeOutStamp,
      signatureData: sigData,
      status,
      submittedAt: new Date().toISOString(),
    };

    try {
      await saveRecord(record);
      await refreshTodayRecords();
      setSubmitted(true);
      addToast({
        type: 'success',
        title: `Attendance logged for ${data.employeeName}`,
        description: timeOutStamp
          ? `Time In: ${timeInStamp} · Time Out: ${timeOutStamp}`
          : `Time In: ${timeInStamp} · Time-Out not yet recorded`,
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
      addToast({
        type: 'error',
        title: 'Save failed',
        description: 'Unable to save attendance. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }

    // Reset after 2s
    setTimeout(() => {
      reset();
      sigRef.current?.clear();
      setTimeInStamp(null);
      setTimeOutStamp(null);
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-64px-4rem)]">
      <div className="w-full max-w-lg">
        {/* Clock Hero */}
        <div className="card-elevated p-6 mb-5 gradient-hero text-white rounded-[var(--radius)]">
          <div className="text-center">
            <LiveClock />
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-widest">
                Live Attendance Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Check-In Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="card-elevated p-6 mb-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
              Employee Details
            </h2>

            {/* Name */}
            <div className="mb-4">
              <label htmlFor="employeeName" className="block text-sm font-semibold text-foreground mb-1">
                Full Name <span className="text-danger">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">Enter your full legal name as registered in HR</p>
              <input
                id="employeeName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Marcus Chen"
                className={[
                  'w-full px-3 py-2.5 rounded-lg border text-sm bg-input text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all',
                  errors.employeeName ? 'border-danger focus:ring-danger/30' : 'border-border',
                ].join(' ')}
                {...register('employeeName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              {errors.employeeName && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />
                  {errors.employeeName.message}
                </p>
              )}
            </div>

            {/* Employee ID */}
            <div className="mb-4">
              <label htmlFor="employeeId" className="block text-sm font-semibold text-foreground mb-1">
                Employee Number <span className="text-danger">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-1.5">Your HR-assigned employee number (e.g. HSM202603004)</p>
              <input
                id="employeeId"
                type="text"
                placeholder="e.g. HSM202603004"
                className={[
                  'w-full px-3 py-2.5 rounded-lg border text-sm bg-input text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all font-tabular',
                  errors.employeeId ? 'border-danger focus:ring-danger/30' : 'border-border',
                ].join(' ')}
                {...register('employeeId', {
                  required: 'Employee number is required',
                  pattern: { value: /^[A-Z]{3}\d{4}\d{2}\d{3}$/, message: 'Format must be HSM202603004 (3 letters + year + month + sequence)' },
                })}
              />
              {errors.employeeId && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" />
                  {errors.employeeId.message}
                </p>
              )}
            </div>
          </div>

          {/* Time In / Out */}
          <div className="card-elevated p-6 mb-5">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
              Attendance Action
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleTimeIn}
                disabled={!!timeInStamp}
                className={[
                  'flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 font-semibold text-sm transition-all duration-150',
                  timeInStamp
                    ? 'border-success bg-success/10 text-success cursor-default' :'border-success/40 hover:border-success hover:bg-success/5 text-success active:scale-95',
                ].join(' ')}
                aria-label="Record Time In"
              >
                <LogIn className="w-5 h-5" />
                <span>Time In</span>
                {timeInStamp && (
                  <span className="text-xs font-tabular font-medium bg-success/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {timeInStamp}
                  </span>
                )}
                {!timeInStamp && (
                  <span className="text-xs text-muted-foreground font-normal">Tap to record</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleTimeOut}
                disabled={!!timeOutStamp || !timeInStamp}
                className={[
                  'flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 font-semibold text-sm transition-all duration-150',
                  timeOutStamp
                    ? 'border-danger bg-danger/10 text-danger cursor-default'
                    : !timeInStamp
                    ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                    : 'border-danger/40 hover:border-danger hover:bg-danger/5 text-danger active:scale-95',
                ].join(' ')}
                aria-label="Record Time Out"
              >
                <LogOut className="w-5 h-5" />
                <span>Time Out</span>
                {timeOutStamp && (
                  <span className="text-xs font-tabular font-medium bg-danger/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {timeOutStamp}
                  </span>
                )}
                {!timeOutStamp && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {timeInStamp ? 'Tap to record' : 'Log Time-In first'}
                  </span>
                )}
              </button>
            </div>

            {isLate(timeInStamp ?? '08:00:00') && timeInStamp && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-xs font-medium text-warning">
                  This check-in will be marked as <strong>Late</strong> — scheduled start is 9:00 AM
                </p>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="card-elevated p-6 mb-5">
            <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
              Digital Signature
            </h2>
            <p className="text-xs text-muted-foreground mb-3 ml-7">
              Draw your signature below using a mouse, finger, or stylus
            </p>

            <div className="relative">
              <SignatureCanvas ref={sigRef} width={500} height={130} />
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <PenLine className="w-3.5 h-3.5" />
                  <span className="text-xs">Sign here</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Signature
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || submitted}
            className={[
              'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg font-semibold text-sm transition-all duration-150',
              submitted
                ? 'bg-success text-white cursor-default'
                : submitting
                ? 'bg-primary/70 text-white cursor-wait' :'bg-primary text-white hover:bg-primary/90 hover:shadow-elevated active:scale-[0.98]',
            ].join(' ')}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting Record…
              </>
            ) : submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Record Submitted!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Attendance Record
              </>
            )}
          </button>
        </form>

        {/* Today's Submissions */}
        <div className="mt-5">
          <TodaySubmissions records={todayRecords} />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}