import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Award, BarChart3, Users, RefreshCw } from 'lucide-react';

export const Results = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    const res = await apiRequest('/election/results');
    if (res.ok) {
      setData(res);
    } else {
      setError(res.error || 'Failed to load election results.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Auditing Official Results...</p>
      </div>
    );
  }

  const leader = data?.candidates?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700 mb-1">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            Official Election Standings
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {data?.election?.title || 'Class Representative Election 2026'}
          </h1>
        </div>

        <button
          onClick={fetchResults}
          className="civic-btn-outline text-xs gap-1.5 py-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Tally
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="civic-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Certified Votes</span>
            <span className="text-2xl font-black text-slate-900">{data?.total_votes || 0}</span>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="civic-card p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Current Slate Leader</span>
            <span className="text-lg font-extrabold text-slate-900 truncate max-w-[200px] block">
              {data?.total_votes > 0 ? leader?.name : 'Awaiting Ballots'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data?.candidates?.map((candidate, idx) => {
          const isWinner = idx === 0 && data.total_votes > 0;
          const cardClass = 'civic-card p-5 bg-white border transition-all ' + 
            (isWinner ? 'border-amber-300 ring-1 ring-amber-300 bg-amber-50/10' : 'border-slate-200');
          const badgeClass = 'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono ' +
            (isWinner ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-600');
          const barClass = 'h-3 rounded-full transition-all duration-500 ' +
            (isWinner ? 'bg-gradient-to-r from-amber-500 to-teal-500' : 'bg-teal-600');

          return (
            <div key={candidate.id} className={cardClass}>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3.5">
                  <span className={badgeClass}>
                    #{idx + 1}
                  </span>

                  <img
                    src={candidate.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={candidate.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />

                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {candidate.name}
                      {isWinner && (
                        <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded">
                          Leading
                        </span>
                      )}
                    </h3>
                    <span className="text-xs font-semibold text-teal-700">{candidate.party}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 font-mono block">
                    {candidate.percentage}%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {candidate.vote_count} votes
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={barClass}
                  style={{ width: Math.max(1, candidate.percentage) + '%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
