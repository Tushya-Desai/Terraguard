import React, { useState } from 'react';
import { Sprout, Lock, Mail, User, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [farmLabel, setFarmLabel] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password, farmLabel);
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.response?.data?.detail || 'Registration failed. Please check your information and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-tg-bg dark:bg-tg-bg-dark transition-colors">
      <div className="w-full max-w-md bg-tg-surface dark:bg-tg-surface-dark rounded-3xl p-7 sm:p-9 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-green items-center justify-center shadow-lg shadow-brand-green/20 mb-1">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-tg-text dark:text-tg-text-dark tracking-tight">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-tg-muted dark:text-tg-muted-dark max-w-xs mx-auto">
            Join TerraGuard to monitor soil contamination and manage remediation cycles
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-risk-high/10 border border-risk-high/20 text-risk-high text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1 uppercase tracking-wider">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-tg-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. Tushar Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-tg-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1 uppercase tracking-wider">
              Farm / Location Name (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-tg-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Green Valley Farm (Sector 7)"
                value={farmLabel}
                onChange={(e) => setFarmLabel(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1 uppercase tracking-wider">
              Password (Min 6 chars) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-tg-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-sm font-semibold shadow-md shadow-brand-green/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Creating Account...' : 'Complete Signup'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch to Login */}
        <div className="text-center pt-2 border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-brand-green font-semibold hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
