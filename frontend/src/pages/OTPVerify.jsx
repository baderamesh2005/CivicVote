import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';
import { KeyRound, RefreshCw, ArrowRight } from 'lucide-react';

export const OTPVerify = ({ pendingData, onNavigate }) => {
  const { login } = useAuth();
  const [otp, setOtp] = useState(pendingData?.dev_otp || '');
  const [devOtp, setDevOtp] = useState(pendingData?.dev_otp || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiRequest('/auth/voter/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        voter_id: pendingData?.voter_id,
        email: pendingData?.email,
        otp,
      }),
    });

    setLoading(false);

    if (res.ok) {
      login(res.user, res.token);
      onNavigate('vote');
    } else {
      setError(res.error || 'Invalid or expired OTP code.');
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccessMsg('');
    setResending(true);

    const res = await apiRequest('/auth/voter/resend-otp', {
      method: 'POST',
      body: JSON.stringify({
        voter_id: pendingData?.voter_id,
        email: pendingData?.email,
      }),
    });

    setResending(false);

    if (res.ok) {
      setSuccessMsg('A new verification code has been dispatched.');
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        setOtp(res.dev_otp);
      }
    } else {
      setError(res.error || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="civic-card p-8 bg-white border border-slate-200">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 mb-1">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">OTP Identity Verification</h2>
          <p className="text-sm text-slate-500">
            Sent to: <span className="font-semibold text-slate-800">{pendingData?.email || 'Registered Email'}</span>
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} />}
        {successMsg && <AlertBanner type="success" message={successMsg} />}
        {devOtp && (
          <AlertBanner
            devOtp={devOtp}
            onAutoFillOtp={code => setOtp(code)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 text-center">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="??????"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center tracking-[0.6em] text-2xl font-mono font-bold py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="civic-btn-primary w-full py-3 text-sm font-bold gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Code & Complete Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-6 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-xs font-semibold text-slate-600 hover:text-teal-600 inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={resending ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            {resending ? 'Generating Code...' : "Didn't receive code? Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};
