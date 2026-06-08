'use client';
import React, { useState, useEffect } from 'react';

function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDate(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function LiveClock() {
  const [time, setTime] = useState('00:00:00');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(formatTime(now));
      setDate(formatDate(now));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      {/* Ginawang font-tabular para hindi umuuga o gumagalaw ang mga numero kada segundo */}
      <div className="clock-display text-5xl sm:text-6xl font-extrabold font-tabular leading-none mb-2 tracking-tight">
        {time}
      </div>
      {/* Ginawang opacity-90 o currentColor para sumunod sa kulay ng hero text */}
      <p className="text-xs sm:text-sm font-medium opacity-90 tracking-wide uppercase">
        {date}
      </p>
    </div>
  );
}
