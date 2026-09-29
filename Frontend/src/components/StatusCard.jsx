import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Sprout, MapPin, Activity } from 'lucide-react';
import RiskBadge from './RiskBadge';

const StatusCard = ({ latestTest, totalTests, activeRemediations }) => {
  if (!latestTest) {
    return (
      <div className="w-full bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-6 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-green">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark">Soil Health Summary</h2>
            <p className="text-xs text-tg-muted dark:text-tg-muted-dark">No test records recorded yet</p>
          </div>
        </div>
        <p className="text-sm text-tg-muted dark:text-tg-muted-dark my-4">
          Record your first soil lead test using the TerraGuard companion module to assess risk and start remediation tracking.
        </p>
      </div>
    );
  }

  const risk = (latestTest.risk_level || 'low').toLowerCase();

  const themeConfig = {
    low: {
      bgGradient: 'from-[#3E9142]/15 via-[#3E9142]/5 to-transparent dark:from-[#3E9142]/25 dark:via-[#3E9142]/10',
      borderAccent: 'border-[#3E9142]/30 dark:border-[#3E9142]/40',
      headline: 'Soil is Safe / Low Risk',
      subtitle: 'Lead concentration is within safe agricultural standards.',
      textColor: 'text-[#3E9142] dark:text-[#58C45E]',
      Icon: ShieldCheck,
    },
    moderate: {
      bgGradient: 'from-[#E0A526]/20 via-[#E0A526]/5 to-transparent dark:from-[#E0A526]/30 dark:via-[#E0A526]/10',
      borderAccent: 'border-[#E0A526]/30 dark:border-[#E0A526]/40',
      headline: 'Moderate Risk / Caution',
      subtitle: 'Elevated lead detected. Consider bio-remediation treatment.',
      textColor: 'text-[#C99015] dark:text-[#E9B645]',
      Icon: AlertTriangle,
    },
    high: {
      bgGradient: 'from-[#C24C3D]/20 via-[#C24C3D]/5 to-transparent dark:from-[#C24C3D]/30 dark:via-[#C24C3D]/10',
      borderAccent: 'border-[#C24C3D]/30 dark:border-[#C24C3D]/40',
      headline: 'Unsafe / High Lead Detected',
      subtitle: 'Immediate action required. Active remediation strongly advised.',
      textColor: 'text-[#C24C3D] dark:text-[#E2695B]',
      Icon: AlertOctagon,
    },
  };

  const currentTheme = themeConfig[risk] || themeConfig.low;
  const { Icon } = currentTheme;

  return (
    <div
      className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentTheme.bgGradient} bg-tg-surface dark:bg-tg-surface-dark border ${currentTheme.borderAccent} p-6 shadow-soft dark:shadow-soft-dark transition-all duration-300`}
    >
      {/* Background organic watermark */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.04] dark:opacity-[0.06] pointer-events-none text-tg-text dark:text-white">
        <Sprout className="w-56 h-56" />
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-tg-muted dark:text-tg-muted-dark">
            Latest Assessment
          </span>
          <span className="text-xs text-tg-muted dark:text-tg-muted-dark">•</span>
          <span className="text-xs font-medium text-tg-muted dark:text-tg-muted-dark flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-gold" />
            {latestTest.plot_label || 'Primary Plot'}
          </span>
        </div>
        <RiskBadge level={latestTest.risk_level} size="sm" />
      </div>

      {/* Primary focal headline */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon className={`w-8 h-8 ${currentTheme.textColor} flex-shrink-0`} />
          <h2 className={`text-2xl sm:text-3xl font-serif font-bold ${currentTheme.textColor} tracking-tight`}>
            {currentTheme.headline}
          </h2>
        </div>
        <p className="text-sm text-tg-text/80 dark:text-tg-text-dark/80 max-w-xl">
          {currentTheme.subtitle}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-black/5 dark:border-white/10">
        <div className="bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-xl">
          <span className="text-[11px] font-medium text-tg-muted dark:text-tg-muted-dark uppercase tracking-wider block">
            Lead Content
          </span>
          <span className="text-lg sm:text-xl font-bold font-serif text-tg-text dark:text-tg-text-dark">
            {latestTest.lead_concentration} <span className="text-xs font-sans font-normal text-tg-muted">ppm</span>
          </span>
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-xl">
          <span className="text-[11px] font-medium text-tg-muted dark:text-tg-muted-dark uppercase tracking-wider block">
            Total Plots Tested
          </span>
          <span className="text-lg sm:text-xl font-bold font-serif text-tg-text dark:text-tg-text-dark">
            {totalTests}
          </span>
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.03] p-3 rounded-xl">
          <span className="text-[11px] font-medium text-tg-muted dark:text-tg-muted-dark uppercase tracking-wider block">
            Active Cycles
          </span>
          <span className="text-lg sm:text-xl font-bold font-serif text-brand-green flex items-center gap-1">
            <Activity className="w-4 h-4 inline" /> {activeRemediations}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
