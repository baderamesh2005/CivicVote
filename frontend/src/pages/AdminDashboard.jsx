import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Modal } from '../components/Modal';
import { AlertBanner } from '../components/AlertBanner';
import { 
  Shield, Users, CheckCircle2, Vote, Download, Plus, 
  Trash2, Edit3, Clock, RefreshCw, BarChart2 
} from 'lucide-react';

export const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWindowModalOpen, setIsWindowModalOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [candidateForm, setCandidateForm] = useState({ name: '', party: '', bio: '', photo_url: '' });
  const [windowForm, setWindowForm] = useState({ title: '', start_time: '', end_time: '', is_active: true });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    const res = await apiRequest('/admin/dashboard');
    if (res.ok) {
      setStats(res.stats);
      setElection(res.election);
      setCandidates(res.candidates || []);
      if (res.election) {
        setWindowForm({
          title: res.election.title,
          start_time: res.election.start_time ? res.election.start_time.slice(0, 16) : '',
          end_time: res.election.end_time ? res.election.end_time.slice(0, 16) : '',
          is_active: res.election.is_active,
        });
      }
    } else {
      setError(res.error || 'Failed to load administrative dashboard.');
    }
    setLoading(false);
  };

  const handleExportCSV = async () => {
    setError('');
    const res = await apiRequest('/admin/export-csv');
    if (res.ok && res.blob) {
      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Election_Results_' + new Date().toISOString().slice(0,10) + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccessMsg('Election results CSV downloaded successfully.');
    } else {
      setError('Failed to download CSV export.');
    }
  };

  const handleAddCandidate = async e => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    const res = await apiRequest('/admin/candidates', {
      method: 'POST',
      body: JSON.stringify({
        ...candidateForm,
        election_id: election?.id,
      }),
    });

    setActionLoading(false);

    if (res.ok) {
      setIsAddModalOpen(false);
      setCandidateForm({ name: '', party: '', bio: '', photo_url: '' });
      setSuccessMsg('Candidate created and immediately published to ballot.');
      fetchDashboardData();
    } else {
      setError(res.error || 'Failed to add candidate.');
    }
  };

  const handleEditCandidate = async e => {
    e.preventDefault();
    if (!activeCandidate) return;
    setActionLoading(true);
    setError('');

    const res = await apiRequest('/admin/candidates/' + activeCandidate.id, {
      method: 'PUT',
      body: JSON.stringify(candidateForm),
    });

    setActionLoading(false);

    if (res.ok) {
      setIsEditModalOpen(false);
      setActiveCandidate(null);
      setSuccessMsg('Candidate details updated.');
      fetchDashboardData();
    } else {
      setError(res.error || 'Failed to update candidate.');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!activeCandidate) return;
    setActionLoading(true);
    setError('');

    const res = await apiRequest('/admin/candidates/' + activeCandidate.id, {
      method: 'DELETE',
    });

    setActionLoading(false);

    if (res.ok) {
      setIsDeleteModalOpen(false);
      setActiveCandidate(null);
      setSuccessMsg('Candidate deleted from election.');
      fetchDashboardData();
    } else {
      setError(res.error || 'Failed to delete candidate.');
    }
  };

  const handleUpdateWindow = async e => {
    e.preventDefault();
    if (!election) return;
    setActionLoading(true);
    setError('');

    const res = await apiRequest('/admin/election/' + election.id, {
      method: 'PUT',
      body: JSON.stringify({
        title: windowForm.title,
        is_active: windowForm.is_active,
        start_time: new Date(windowForm.start_time).toISOString(),
        end_time: new Date(windowForm.end_time).toISOString(),
      }),
    });

    setActionLoading(false);

    if (res.ok) {
      setIsWindowModalOpen(false);
      setSuccessMsg('Election parameters updated.');
      fetchDashboardData();
    } else {
      setError(res.error || 'Failed to update election settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Election Authority Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-black text-slate-900">Election Management Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time voter turnout monitoring, candidate control, and verified audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="civic-btn-outline text-xs gap-1.5 py-2"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="civic-btn-primary text-xs gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Download className="w-3.5 h-3.5" /> Export Results (CSV)
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}
      {successMsg && <AlertBanner type="success" message={successMsg} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-5 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Registered Voters</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.total_registered_voters || 0}</p>
          <span className="text-[11px] text-slate-500">Accounts created on platform</span>
        </div>

        <div className="civic-card p-5 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Verified Voters</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.total_verified_voters || 0}</p>
          <span className="text-[11px] text-teal-700 font-medium">OTP Verified & eligible</span>
        </div>

        <div className="civic-card p-5 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Ballots Cast</span>
            <Vote className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.total_votes_cast || 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Cryptographically confirmed</span>
        </div>

        <div className="civic-card p-5 bg-white space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Turnout Rate</span>
            <BarChart2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats?.turnout_percentage || 0}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: Math.min(100, stats?.turnout_percentage || 0) + '%' }}
            />
          </div>
        </div>
      </div>

      <div className="civic-card p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Election Schedule & Window Control
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Server-enforced voting window; unauthorized votes outside this duration are blocked.
            </p>
          </div>
          <button
            onClick={() => setIsWindowModalOpen(true)}
            className="civic-btn-outline text-xs gap-1.5 py-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Election Settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block">Election Title</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">{election?.title}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block">Start Date & Time</span>
            <span className="font-mono text-slate-900 font-semibold block mt-0.5">
              {election?.start_time ? new Date(election.start_time).toLocaleString() : 'Not Set'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 block">End Date & Time</span>
            <span className="font-mono text-slate-900 font-semibold block mt-0.5">
              {election?.end_time ? new Date(election.end_time).toLocaleString() : 'Not Set'}
            </span>
          </div>
        </div>
      </div>

      <div className="civic-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-teal-600" />
            Live Ballot Standings & Tally
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Total Valid Ballots: {stats?.total_votes_cast || 0}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          {candidates.map((c, idx) => (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 font-mono">#{idx + 1}</span>
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <span className="text-slate-500">({c.party})</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="font-bold text-slate-900">{c.vote_count} votes</span>
                  <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">
                    {c.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-600 to-teal-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: Math.max(2, c.percentage) + '%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="civic-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              Candidate Roster Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, modify, or remove candidates. Changes immediately reflect in the voter ballot.
            </p>
          </div>
          <button
            onClick={() => {
              setCandidateForm({ name: '', party: '', bio: '', photo_url: '' });
              setIsAddModalOpen(true);
            }}
            className="civic-btn-primary text-xs gap-1.5 py-2 bg-teal-600 hover:bg-teal-500"
          >
            <Plus className="w-3.5 h-3.5" /> Add Candidate
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {candidates.map(c => (
            <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={c.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={c.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{c.name}</h4>
                  <span className="text-xs text-slate-500">{c.party}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setActiveCandidate(c);
                    setCandidateForm({
                      name: c.name,
                      party: c.party,
                      bio: c.bio || '',
                      photo_url: c.photo_url || '',
                    });
                    setIsEditModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Edit Candidate"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveCandidate(c);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Candidate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddCandidate}
        isLoading={actionLoading}
        title="Add Certified Candidate"
        confirmText="Publish to Ballot"
      >
        <form className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Mitchell"
              value={candidateForm.name}
              onChange={e => setCandidateForm({ ...candidateForm, name: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Party / Slate / Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Student Welfare Alliance"
              value={candidateForm.party}
              onChange={e => setCandidateForm({ ...candidateForm, party: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={candidateForm.photo_url}
              onChange={e => setCandidateForm({ ...candidateForm, photo_url: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Manifesto / Bio Summary
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of candidate platform..."
              value={candidateForm.bio}
              onChange={e => setCandidateForm({ ...candidateForm, bio: e.target.value })}
              className="civic-input"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleEditCandidate}
        isLoading={actionLoading}
        title={'Edit ' + (activeCandidate?.name || '')}
        confirmText="Save Modifications"
      >
        <form className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              value={candidateForm.name}
              onChange={e => setCandidateForm({ ...candidateForm, name: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Party / Slate *
            </label>
            <input
              type="text"
              required
              value={candidateForm.party}
              onChange={e => setCandidateForm({ ...candidateForm, party: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Photo URL
            </label>
            <input
              type="url"
              value={candidateForm.photo_url}
              onChange={e => setCandidateForm({ ...candidateForm, photo_url: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Manifesto / Bio
            </label>
            <textarea
              rows={3}
              value={candidateForm.bio}
              onChange={e => setCandidateForm({ ...candidateForm, bio: e.target.value })}
              className="civic-input"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCandidate}
        isLoading={actionLoading}
        title="Remove Candidate"
        confirmText="Permanently Delete Candidate"
        confirmVariant="danger"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <strong>{activeCandidate?.name}</strong> from the ballot? Any cast votes associated with this candidate record will be deleted.
        </p>
      </Modal>

      <Modal
        isOpen={isWindowModalOpen}
        onClose={() => setIsWindowModalOpen(false)}
        onConfirm={handleUpdateWindow}
        isLoading={actionLoading}
        title="Configure Election Parameters"
        confirmText="Save Election Window"
      >
        <form className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Election Title *
            </label>
            <input
              type="text"
              required
              value={windowForm.title}
              onChange={e => setWindowForm({ ...windowForm, title: e.target.value })}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={windowForm.start_time}
              onChange={e => setWindowForm({ ...windowForm, start_time: e.target.value })}
              className="civic-input font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={windowForm.end_time}
              onChange={e => setWindowForm({ ...windowForm, end_time: e.target.value })}
              className="civic-input font-mono"
            />
          </div>
          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={windowForm.is_active}
                onChange={e => setWindowForm({ ...windowForm, is_active: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span>Election Active Status (Enable / Disable voting)</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
