import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export const CountdownTimer = ({ secondsRemaining, isOpen, onExpire }) => {
  const [seconds, setSeconds] = useState(secondsRemaining || 0);

  useEffect(() => {
    setSeconds(secondsRemaining || 0);
  }, [secondsRemaining]);

  useEffect(() => {
    if (seconds <= 0) {
      if (onExpire && isOpen) onExpire();
      return;
    }
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, isOpen, onExpire]);

  if (!isOpen || seconds <= 0) {
    return (
      <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl text-sm font-medium">
        <AlertCircle className="w-4 h-4 text-rose-600" />
        <span>Voting Window Closed</span>
      </div>
    );
  }

  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 text-white px-4 py-2 rounded-xl text-sm font-mono shadow-inner">
      <Clock className="w-4 h-4 text-teal-400 animate-pulse" />
      <span className="text-xs font-sans text-slate-400 font-medium mr-1">Closes in:</span>
      <div className="flex items-center space-x-1 font-bold text-teal-300">
        {days > 0 && <span>{days}d </span>}
        <span>{String(hours).padStart(2, '0')}h : </span>
        <span>{String(minutes).padStart(2, '0')}m : </span>
        <span>{String(secs).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};
