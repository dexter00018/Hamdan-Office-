'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

interface PasscodeGateProps {
  onUnlock: () => void;
}

const ADMIN_PASSCODE = '1234'; // Backend integration point: validate against server-side secret

export default function PasscodeGate({ onUnlock }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (locked && lockTimer > 0) {
      const t = setTimeout(() => setLockTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
    if (locked && lockTimer === 0) {
      setLocked(false);
      setAttempts(0);
      setError('');
    }
  }, [locked, lockTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (passcode === ADMIN_PASSCODE) {
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPasscode('');
      if (newAttempts >= 3) {
        setLocked(true);
        setLockTimer(30);
        setError('Too many failed attempts. Try again in 30 seconds.');
      } else {
        setError(`Incorrect passcode. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card-elevated p-8 text-center animate-slide-up">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-5 shadow-elevated">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <AppLogo size={24} />
            <span className="font-bold text-base text-foreground">AttendTrack</span>
          </div>

          <h1 className="text-xl font-bold text-foreground mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your admin passcode to access attendance records and reports
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4 text-left">
              <label htmlFor="passcode" className="block text-sm font-semibold text-foreground mb-1">
                Admin Passcode
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter passcode"
                  maxLength={10}
                  disabled={locked}
                  className={[
                    'w-full px-3 py-2.5 pr-10 rounded-lg border text-sm bg-input text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring transition-all font-tabular tracking-widest',
                    error ? 'border-danger focus:ring-danger/30' : 'border-border focus:border-primary',
                    locked ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-danger flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {error}
                </p>
              )}
              {locked && (
                <p className="mt-1.5 text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Account locked. Try again in{' '}
                  <span className="font-tabular font-bold">{lockTimer}s</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={locked || !passcode}
              className={[
                'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all duration-150',
                locked || !passcode
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-sm hover:shadow-elevated',
              ].join(' ')}
            >
              <ShieldCheck className="w-4 h-4" />
              Unlock Admin View
            </button>
          </form>

          <div className="mt-5 p-3 rounded-lg bg-muted/60 border border-border text-left">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Demo Credentials</p>
            <p className="text-xs text-foreground font-tabular">
              Passcode: <span className="font-bold text-primary">1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}