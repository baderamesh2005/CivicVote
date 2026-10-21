import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CountdownTimer } from '../components/CountdownTimer';
import { Modal } from '../components/Modal';
import { AlertBanner } from '../components/AlertBanner';
import { 
  Vote, CheckCircle2, AlertCircle, ShieldAlert, 
  Lock, ArrowRight, Award, Info 
} from 'lucide-react';

export const CandidateList = ({ onNavigate, onVoteSuccess }) => {
  const { user, isVoter, updateUser } = useAuth();
  const [election, setElection] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [hasVoted, setHasVoted] = useState(user?.has_voted || false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchElectionData();
  }, []);

  const fetchElectionData = async () => {
    setLoading(true);
    setError('');

    const elRes = await apiRequest('/election/active');
    if (elRes.ok && elRes.election) {
      setElection(elRes.election);
    } else {
      setError(elRes.error || 'No active election found.');
    }

    if (isVoter) {
      const stRes = await apiRequest('/vote/status');
      if (stRes.ok) {
        setHasVoted(stRes.has_voted);
        updateUser({ has_voted: stRes.has_voted });
      }
    }

    setLoading(false);
  };

  const handleOpenConfirmModal = () => {
    if (!selectedCandidateId) {
      setError('Please select a candidate before proceeding to cast your ballot.');
      return;
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleConfirmVote = async () => {
    setSubmitting(true);
    setError('');

    const res = await apiRequest('/vote/cast', {
      method: 'POST',
      body: JSON.stringify({ candidate_id: selectedCandidateId }),
    });

    setSubmitting(false);
    setIsModalOpen(false);

    if (res.ok) {
      setHasVoted(true);
      updateUser({ has_voted: true });
      if (onVoteSuccess) {
        onVoteSuccess({
          receipt_id: res.receipt_id,
          cast_at: res.cast_at,
          election_title: res.election_title || election?.title,
        });
      }
    } else {
      if (res.code === 'ALREADY_VOTED') {
        setHasVoted(true);
        updateUser({ has_voted: true });
      }
      setError(res.error || 'Failed to submit vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Certified Ballot...</p>
      </div>
    );
  }

  const selectedCandidate = election?.candidates?.find(c => c.id === selectedCandidateId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="civic-card p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300">
              Official Voting Booth
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {election?.title || 'Class Representative Election 2026'}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            {election?.description || 'Select one candidate to cast your official encrypted ballot.'}
          </p>
        </div>

        {election && (
          <CountdownTimer
            secondsRemaining={election.seconds_remaining}
            isOpen={election.is_open}
            onExpire={() => fetchElectionData()}
          />
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {!user && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-blue-900 font-medium">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span>You are viewing the certified candidate list in preview mode. Please sign in to cast your ballot.</span>
          </div>
          <button
            onClick={() => onNavigate('voter-login')}
            className="civic-btn-primary text-xs font-bold whitespace-nowrap"
          >
            Sign In to Vote
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950">Your Ballot Has Been Recorded</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Our database confirms a ballot was submitted from your account. Multiple voting is strictly disabled.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="civic-btn-primary bg-emerald-700 hover:bg-emerald-800 text-xs font-bold whitespace-nowrap"
          >
            View Live Results Tally
          </button>
        </div>
      )}

      {election && !election.is_open && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3.5 text-rose-950">
          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-rose-950">Election Window is Currently Closed</h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Voting is only allowed during scheduled election hours. The ballot submission portal is locked.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            Select One Certified Candidate
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {election?.candidates?.length || 0} Candidates Running
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {election?.candidates?.map(candidate => {
            const isSelected = selectedCandidateId === candidate.id;
            const disabled = !user || hasVoted || !election?.is_open;

            let cardClass = 'civic-card p-5 cursor-pointer relative transition-all ';
            if (isSelected) {
              cardClass += 'ring-2 ring-teal-600 border-teal-600 bg-teal-50/20 shadow-md';
            } else if (disabled) {
              cardClass += 'opacity-70 cursor-not-allowed bg-white';
            } else {
              cardClass += 'hover:border-slate-300 hover:shadow-sm';
            }

            let selectorClass = 'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ';
            if (isSelected) {
              selectorClass += 'border-teal-600 bg-teal-600 text-white';
            } else {
              selectorClass += 'border-slate-300 bg-white';
            }

            return (
              <div
                key={candidate.id}
                onClick={() => !disabled && setSelectedCandidateId(candidate.id)}
                className={cardClass}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={candidate.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt={candidate.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {candidate.name}
                      </h3>
                      <div className={selectorClass}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded mt-1">
                      {candidate.party}
                    </span>

                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                      {candidate.bio || 'Candidate platform statement filed with the election commission.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {user && !hasVoted && election?.is_open && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-xl z-30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400 hidden sm:block" />
              <span className="text-xs text-slate-600 font-medium">
                {selectedCandidate ? (
                  <span>Selected: <strong className="text-slate-900 font-bold">{selectedCandidate.name}</strong> ({selectedCandidate.party})</span>
                ) : (
                  'Please choose a candidate above to enable submission'
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={!selectedCandidateId || submitting}
              className="civic-btn-primary py-2.5 px-6 text-sm font-bold gap-2 bg-teal-600 hover:bg-teal-500 shadow-md disabled:opacity-50"
            >
              <Vote className="w-4 h-4" />
              Submit Official Vote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmVote}
        isLoading={submitting}
        title="Confirm Irreversible Vote"
        confirmText="Yes, Cast My Official Vote"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              You are voting for:
            </span>
            <h4 className="text-lg font-extrabold text-teal-800 mt-1">
              {selectedCandidate?.name}
            </h4>
            <span className="text-xs font-medium text-slate-600 block">
              {selectedCandidate?.party}
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Important Warning:
            </p>
            <p>
              Once submitted, your vote is cryptographically sealed in the election ledger. <strong>This action cannot be undone, altered, or recasted.</strong>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
