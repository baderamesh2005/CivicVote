import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { VoterRegister } from './pages/VoterRegister';
import { VoterLogin } from './pages/VoterLogin';
import { OTPVerify } from './pages/OTPVerify';
import { CandidateList } from './pages/CandidateList';
import { VoteReceipt } from './pages/VoteReceipt';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { Results } from './pages/Results';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState('home');
  const [pendingOtpData, setPendingOtpData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const handleNavigate = tab => {
    setCurrentTab(tab);
    window.scrollTo(0, 0);
  };

  const handleRegistrationSuccess = data => {
    setPendingOtpData(data);
    setCurrentTab('otp-verify');
  };

  const handleRequiresOtp = data => {
    setPendingOtpData(data);
    setCurrentTab('otp-verify');
  };

  const handleVoteSuccess = receipt => {
    setReceiptData(receipt);
    setCurrentTab('vote-receipt');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'home' && <Home onNavigate={handleNavigate} />}
        {currentTab === 'voter-register' && (
          <VoterRegister 
            onNavigate={handleNavigate} 
            onRegistrationSuccess={handleRegistrationSuccess} 
          />
        )}
        {currentTab === 'voter-login' && (
          <VoterLogin 
            onNavigate={handleNavigate} 
            onRequiresOtp={handleRequiresOtp} 
          />
        )}
        {currentTab === 'otp-verify' && (
          <OTPVerify 
            pendingData={pendingOtpData} 
            onNavigate={handleNavigate} 
          />
        )}
        {currentTab === 'vote' && (
          <CandidateList 
            onNavigate={handleNavigate} 
            onVoteSuccess={handleVoteSuccess} 
          />
        )}
        {currentTab === 'vote-receipt' && (
          <VoteReceipt 
            receiptData={receiptData} 
            onNavigate={handleNavigate} 
          />
        )}
        {currentTab === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
        {currentTab === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
        {currentTab === 'results' && <Results onNavigate={handleNavigate} />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-center text-xs mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">
            CivicVote Secure Online Voting System ? AES-Encrypted & One-Vote Guaranteed
          </p>
          <p className="text-slate-500">
            Designed for University and Organizational Governance Elections
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
