import React from 'react';
import { User, Mail, MapPin, Moon, Sun, LogOut, Shield, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ProfileView = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-5 pb-24 animate-fade-in max-w-lg mx-auto">
      
      {/* Profile Header Card */}
      <div className="bg-tg-surface dark:bg-tg-surface-dark rounded-3xl p-6 sm:p-7 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center font-serif font-bold text-3xl mx-auto shadow-inner">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-tg-text dark:text-tg-text-dark">
            {user?.name || 'TerraGuard User'}
          </h2>
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark flex items-center justify-center gap-1 mt-0.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
        </div>

        {user?.farm_label && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{user.farm_label}</span>
          </div>
        )}
      </div>

      {/* Settings / Preferences Card */}
      <div className="bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-5 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-tg-muted dark:text-tg-muted-dark">
          Preferences & Appearance
        </h3>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-tg-text dark:text-tg-text-dark">
              {isDark ? <Moon className="w-5 h-5 text-brand-gold" /> : <Sun className="w-5 h-5 text-brand-green" />}
            </div>
            <div>
              <span className="text-sm font-semibold text-tg-text dark:text-tg-text-dark block">
                Dark Mode
              </span>
              <span className="text-xs text-tg-muted dark:text-tg-muted-dark">
                Optimized for outdoor and low-light field use
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-brand-green' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* App & System Info */}
      <div className="bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-5 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 space-y-2 text-xs text-tg-muted dark:text-tg-muted-dark">
        <div className="flex items-center justify-between">
          <span>System Version</span>
          <span className="font-semibold text-tg-text dark:text-tg-text-dark">TerraGuard v1.0.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Target Architecture</span>
          <span className="font-semibold text-tg-text dark:text-tg-text-dark">FastAPI + React + MySQL</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Safety Standard</span>
          <span className="font-semibold text-tg-text dark:text-tg-text-dark">Current Baseline Threshold (&lt;200 ppm)</span>
        </div>
      </div>

      {/* Logout Action Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-risk-high/10 text-risk-high font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-black/5 dark:border-white/5 cursor-pointer"
      >
        <LogOut className="w-4 h-4" /> Sign Out Account
      </button>
    </div>
  );
};

export default ProfileView;
