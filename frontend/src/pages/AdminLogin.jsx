import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertBanner } from '../components/AlertBanner';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const AdminLogin = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@election.org');
  const [password, setPassword] = useState('AdminSecret2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.ok) {
      login(res.user, res.token);
      onNavigate('admin-dashboard');
    } else {
      setError(res.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="civic-card p-8 bg-white border border-slate-200 shadow-md">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 text-teal-400 mb-1 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Election Authority Login</h2>
          <p className="text-sm text-slate-500">
            Authorized portal for election administration and certification
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Admin Official Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="admin@election.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="civic-input pl-10 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Secret Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="civic-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-secondary w-full py-3 mt-4 text-sm font-bold gap-2 bg-slate-900 hover:bg-slate-800"
          >
            {loading ? 'Authenticating Authority...' : 'Sign In to Admin Console'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <p className="font-bold text-slate-700 mb-1">Seeded Administrator Account:</p>
          <div className="font-mono text-slate-800 bg-white p-2 rounded border border-slate-200">
            <p>email: admin@election.org</p>
            <p>password: AdminSecret2026!</p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-slate-100 mt-6">
          <button
            onClick={() => onNavigate('voter-login')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" /> Return to Voter Portal
          </button>
        </div>
      </div>
    </div>
  );
};
