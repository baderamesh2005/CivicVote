import React from 'react';
import { ShieldCheck, CheckCircle2, Copy, Printer, ArrowRight, Lock } from 'lucide-react';

export const VoteReceipt = ({ receiptData, onNavigate }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (receiptData?.receipt_id) {
      navigator.clipboard.writeText(receiptData.receipt_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-lg mx-auto py-8 print:py-0">
      <div className="civic-card p-8 bg-white border border-slate-200 print:shadow-none print:border-none">
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Ballot Cast Successfully</h2>
          <p className="text-sm text-slate-500">
            Your vote has been cryptographically sealed and recorded in the election database.
          </p>
        </div>

        <div className="my-6 p-5 bg-slate-900 rounded-2xl text-white space-y-4 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-widest font-semibold">
            <span>Anonymous Ballot Receipt</span>
            <span className="flex items-center gap-1 text-teal-400">
              <Lock className="w-3 h-3" /> Sealed
            </span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <span className="font-mono text-sm md:text-base font-bold text-teal-300 tracking-wider select-all truncate">
              {receiptData?.receipt_id || 'VOTE-A8F2-4D91-E0B7'}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copy Receipt ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 block">Election</span>
              <span className="font-semibold text-slate-200 truncate block">
                {receiptData?.election_title || 'Class Representative Election 2026'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Timestamp</span>
              <span className="font-semibold text-slate-200 block">
                {receiptData?.cast_at ? new Date(receiptData.cast_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-teal-950">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Ballot Secrecy Guarantee
          </p>
          <p className="text-teal-800 leading-relaxed">
            In accordance with standard civic voting principles, your specific candidate choice is never linked to this receipt ID or your personal account in any database query.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-6 print:hidden">
          <button
            onClick={handlePrint}
            className="civic-btn-outline flex-1 text-sm font-semibold gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="civic-btn-primary flex-1 text-sm font-bold gap-1.5"
          >
            View Live Results
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
