import React from 'react';
import { Sun, Moon, Bell, Sprout, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ unreadCount = 0, onNavigateTab, currentTab }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-tg-surface/90 dark:bg-tg-surface-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          {/* Logo Mark: Green Leaf with Gold Monogram */}
          <div className="relative w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <Sprout className="w-5 h-5 text-white absolute -top-1 -right-1 opacity-80" />
            <span className="font-serif font-bold text-brand-gold text-lg tracking-wider">TG</span>
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-tg-text dark:text-tg-text-dark group-hover:text-brand-green transition-colors">
              TerraGuard
            </h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-tg-muted dark:text-tg-muted-dark">
              Companion Module
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('notifications')}
            className={`relative p-2.5 rounded-xl transition-colors ${
              currentTab === 'notifications'
                ? 'bg-brand-green/15 text-brand-green dark:text-brand-green'
                : 'text-tg-text/70 dark:text-tg-text-dark/70 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-risk-high text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-tg-surface dark:ring-tg-surface-dark">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-tg-text/70 dark:text-tg-text-dark/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-brand-gold animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-tg-muted" />
            )}
          </button>

          {/* User Profile Pill (Desktop / Tablet) */}
          {user && (
            <div
              onClick={() => onNavigateTab && onNavigateTab('profile')}
              className="hidden sm:flex items-center gap-2 pl-2 border-l border-black/10 dark:border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-tg-text dark:text-tg-text-dark max-w-[100px] truncate">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
