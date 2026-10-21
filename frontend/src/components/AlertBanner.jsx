import React from 'react';
import { AlertCircle, CheckCircle2, Info, KeyRound } from 'lucide-react';

export const AlertBanner = ({ type = 'info', message, devOtp, onAutoFillOtp }) => {
  if (!message && !devOtp) return null;

  if (devOtp) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 my-4 shadow-sm animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  Dev Mode Notice
                </span>
                <span className="text-xs text-amber-700 font-medium">Auto-simulated SMS / Email OTP</span>
              </div>
              <p className="text-sm font-semibold text-amber-950 mt-1">
                Your One-Time Passcode is: <span className="text-lg font-mono font-extrabold tracking-widest text-slate-950 bg-amber-200 px-2.5 py-0.5 rounded ml-1 select-all">{devOtp}</span>
              </p>
            </div>
          </div>
          {onAutoFillOtp && (
            <button
              onClick={() => onAutoFillOtp(devOtp)}
              className="text-xs font-semibold px-3 py-1.5 bg-amber-900 text-amber-100 hover:bg-amber-800 rounded-lg transition-colors shadow-sm"
            >
              Fill OTP
            </button>
          )}
        </div>
      </div>
    );
  }

  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-teal-50 border-teal-200 text-teal-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
  };

  const containerClass = 'border rounded-xl p-3.5 my-3 flex items-start space-x-3 text-sm ' + (styles[type] || styles.info);

  return (
    <div className={containerClass}>
      {icons[type] || icons.info}
      <span className="leading-snug font-medium">{message}</span>
    </div>
  );
};
