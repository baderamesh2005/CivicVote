import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { AlertBanner } from '../components/AlertBanner';
import { User, Mail, Phone, Lock, Key, ShieldCheck, ArrowRight } from 'lucide-react';

export const VoterRegister = ({ onNavigate, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    college_id: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiRequest('/auth/voter/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    setLoading(false);

    if (res.ok) {
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      if (onRegistrationSuccess) {
        onRegistrationSuccess({
          voter_id: res.voter_id,
          email: res.email || formData.email,
          dev_otp: res.dev_otp,
        });
      }
    } else {
      setError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="civic-card p-8 bg-white border border-slate-200">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-50 text-teal-600 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Voter Registration</h2>
          <p className="text-sm text-slate-500">
            Create your certified voter credentials for campus elections
          </p>
        </div>

        {error && <AlertBanner type="error" message={error} />}
        {devOtp && <AlertBanner devOtp={devOtp} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Legal Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Jordan Mitchell"
                value={formData.name}
                onChange={handleChange}
                className="civic-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              College ID / Voter ID *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="college_id"
                required
                placeholder="e.g. STU-2026-894"
                value={formData.college_id}
                onChange={handleChange}
                className="civic-input pl-10 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Institutional Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                placeholder="student@college.edu"
                value={formData.email}
                onChange={handleChange}
                className="civic-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="civic-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="civic-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-3 mt-4 text-sm font-bold gap-2"
          >
            {loading ? 'Submitting Registration...' : 'Register & Receive OTP'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-6 border-t border-slate-100 mt-6">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('voter-login')}
              className="font-bold text-teal-600 hover:text-teal-700"
            >
              Sign In to Ballot
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
