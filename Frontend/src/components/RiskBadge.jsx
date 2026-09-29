import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

const RiskBadge = ({ level, size = 'md' }) => {
  const normalizedLevel = (level || 'low').toLowerCase();

  const configs = {
    low: {
      label: 'Safe / Low Risk',
      shortLabel: 'Safe',
      bgLight: 'bg-[#3E9142]/10',
      textLight: 'text-[#3E9142]',
      border: 'border-[#3E9142]/30',
      darkBg: 'dark:bg-[#3E9142]/20',
      darkText: 'dark:text-[#52B857]',
      Icon: ShieldCheck,
    },
    moderate: {
      label: 'Moderate / Warning',
      shortLabel: 'Warning',
      bgLight: 'bg-[#E0A526]/10',
      textLight: 'text-[#C99015]',
      border: 'border-[#E0A526]/30',
      darkBg: 'dark:bg-[#E0A526]/20',
      darkText: 'dark:text-[#E9B645]',
      Icon: AlertTriangle,
    },
    high: {
      label: 'Unsafe / High Risk',
      shortLabel: 'Danger',
      bgLight: 'bg-[#C24C3D]/10',
      textLight: 'text-[#C24C3D]',
      border: 'border-[#C24C3D]/30',
      darkBg: 'dark:bg-[#C24C3D]/20',
      darkText: 'dark:text-[#E2695B]',
      Icon: AlertOctagon,
    },
  };

  const config = configs[normalizedLevel] || configs.low;
  const { Icon } = config;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-semibold' 
    : size === 'lg'
    ? 'px-4 py-1.5 text-sm font-semibold'
    : 'px-3 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgLight} ${config.textLight} ${config.border} ${config.darkBg} ${config.darkText} ${sizeClasses} shadow-sm transition-colors`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};

export default RiskBadge;
