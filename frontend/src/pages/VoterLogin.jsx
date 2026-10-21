import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';
import { Lock, UserCheck, ArrowRight, Shield } from 'lucide-react';

export const VoterLogin = ({ onNavigate, onRequiresOtp }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('alex.voter@college.edu');
  const [password, setPassword] = useState('VoterPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiRequest('/auth/voter/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    setLoading(false);

    if (res.ok) {
      login(res.user, res.token);
      onNavigate('vote');
    } else if (res.requires_otp) {
      if (res.dev_otp) setDevOtp(res.dev_otp);
      if (onRequiresOtp) {
        onRequiresOtp({
          voter_id: res.voter_id,
          email: res.email || identifier,
          dev_otp: res.dev_otp,
        });
      }
    } else {
      setError(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleFillSeeded = (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="civic-card p-8 bg-white border border-slate-200">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-50 text-teal-600 mb-1">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Voter Sign In</h2>
          <p className="text-sm text-slate-500">
            Authenticate to access your active ballot
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} />}
        {devOtp && <AlertBanner devOtp={devOtp} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              College ID or Email *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. STU-2026-001 or alex.voter@college.edu"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="civic-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="civic-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-3 mt-4 text-sm font-bold gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In & Access Ballot'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Seeded Voter Helpers */}
        <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <p className="font-bold text-slate-700 mb-2">Pre-Verified Demo Credentials:</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleFillSeeded('alex.voter@college.edu', 'VoterPass123!')}
              className="text-left px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-mono text-slate-800 transition-colors flex items-center justify-between"
            >
              <span>alex.voter@college.edu</span>
              <span className="text-teal-600 font-sans font-semibold">Load</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillSeeded('maya.voter@college.edu', 'VoterPass123!')}
              className="text-left px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 font-mono text-slate-800 transition-colors flex items-center justify-between"
            >
              <span>maya.voter@college.edu</span>
              <span className="text-teal-600 font-sans font-semibold">Load</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-slate-100 mt-6 flex justify-between text-xs">
          <button
            onClick={() => onNavigate('voter-register')}
            className="font-bold text-teal-600 hover:text-teal-700"
          >
            Create New Voter Account
          </button>
          <button
            onClick={() => onNavigate('admin-login')}
            className="font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <Shield className="w-3 h-3" /> Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};
