import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { 
  Vote, ShieldCheck, Lock, CheckCircle2, 
  ArrowRight, Users, Sparkles, BarChart3, Clock, AlertCircle 
} from 'lucide-react';

export const Home = ({ onNavigate }) => {
  const { user, isVoter, isAdmin } = useAuth();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveElection = async () => {
      const res = await apiRequest('/election/active');
      if (res.ok && res.election) {
        setElection(res.election);
      }
      setLoading(false);
    };
    fetchActiveElection();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 md:p-14 shadow-xl border border-slate-800">
        <div className="absolute -right-16 -bottom-16 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Cryptographically Verified Voting
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Transparent, Secure & Anonymous Campus Democracy
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Cast your vote securely with end-to-end cryptographic voter secrecy, single-vote enforcement, and real-time verifiable turnout auditing.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {user ? (
              isVoter ? (
                user.has_voted ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate('results')}
                      className="civic-btn-primary gap-2 py-3 px-6 text-base"
                    >
                      <BarChart3 className="w-5 h-5" />
                      View Live Results
                    </button>
                    <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      Ballot Already Cast
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onNavigate('vote')}
                    className="civic-btn-primary gap-2 py-3 px-6 text-base bg-teal-500 hover:bg-teal-400"
                  >
                    <Vote className="w-5 h-5" />
                    Enter Voting Booth
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="civic-btn-primary gap-2 py-3 px-6 text-base bg-teal-600 hover:bg-teal-500"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Access Admin Dashboard
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => onNavigate('voter-login')}
                  className="civic-btn-primary gap-2 py-3 px-6 text-base"
                >
                  <Vote className="w-5 h-5" />
                  Voter Login & Cast Ballot
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('voter-register')}
                  className="civic-btn-outline py-3 px-6 text-base bg-slate-800/80 text-white border-slate-700 hover:bg-slate-800"
                >
                  New Voter Registration
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Active Election Banner Card */}
      <section className="civic-card p-6 md:p-8 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Official Current Election
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {election?.title || 'Class Representative Election 2026'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {election?.description || 'Official campus-wide ballot for student leadership representatives.'}
            </p>
          </div>

          {election && (
            <CountdownTimer
              secondsRemaining={election.seconds_remaining}
              isOpen={election.is_open}
            />
          )}
        </div>

        {/* Election Candidates Preview */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Certified Candidates ({election?.candidates?.length || 5})
            </h3>
            <button
              onClick={() => onNavigate('vote')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View Full Bios & Vote <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {election?.candidates?.map(candidate => (
              <div 
                key={candidate.id}
                onClick={() => onNavigate('vote')}
                className="group border border-slate-200 rounded-xl p-4 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 flex flex-col items-center text-center"
              >
                <img
                  src={candidate.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={candidate.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-3 group-hover:scale-105 transition-transform"
                />
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                  {candidate.name}
                </h4>
                <span className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
                  {candidate.party}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Architecture Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="civic-card p-6 bg-white space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Anonymized AES Ballots</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ballot choices are cryptographically decoupled from voter identity records at rest. Individual votes cannot be backtraced to student profiles.
          </p>
        </div>

        <div className="civic-card p-6 bg-white space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">1-Vote Database Integrity</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Double-voting is mathematically and transactionally blocked at the database engine level with atomic checks and unique integrity constraints.
          </p>
        </div>

        <div className="civic-card p-6 bg-white space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Verifiable Receipts</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Upon voting, each student receives a unique cryptographic reference ID proving participation while preserving complete ballot confidentiality.
          </p>
        </div>
      </section>
    </div>
  );
};
