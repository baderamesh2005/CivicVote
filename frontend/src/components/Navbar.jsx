import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Vote, Shield, User, LogOut } from 'lucide-react';

export const Navbar = ({ currentTab, onNavigate }) => {
  const { user, isVoter, isAdmin, logout } = useAuth();

  const getNavLinkClass = tab => {
    const base = 'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ';
    if (tab === currentTab) {
      return base + 'bg-slate-800 text-teal-400';
    }
    return base + 'text-slate-300 hover:text-white hover:bg-slate-800/60';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Civic<span className="text-teal-400">Vote</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium -mt-0.5">
                Verified Ballot System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={getNavLinkClass('home')}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('vote')}
              className={getNavLinkClass('vote')}
            >
              Cast Ballot
            </button>
            <button
              onClick={() => onNavigate('results')}
              className={getNavLinkClass('results')}
            >
              Election Results
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={
                  currentTab === 'admin-dashboard'
                    ? 'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 bg-teal-950/80 text-teal-300 border border-teal-700/50'
                    : 'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 text-teal-400 hover:bg-teal-950/50'
                }
              >
                <Shield className="w-4 h-4 text-teal-400" />
                Admin Console
              </button>
            )}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-teal-400" />
                  ) : (
                    <User className="w-4 h-4 text-teal-400" />
                  )}
                  <div className="text-left leading-tight hidden sm:block">
                    <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</p>
                    <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider flex items-center gap-1">
                      {isAdmin ? 'Admin' : (user.college_id || 'Voter')}
                      {user.has_voted && (
                        <span className="inline-flex items-center text-teal-400 font-bold ml-1">
                          ? Voted
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('voter-login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Voter Sign In
                </button>
                <button
                  onClick={() => onNavigate('voter-register')}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-sm"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
