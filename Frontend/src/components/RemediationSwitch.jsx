import React from 'react';
import { Activity, Clock } from 'lucide-react';

const RemediationSwitch = ({ active, daysElapsed, onToggle, isUpdating = false, compact = false }) => {
  return (
    <div className={`flex items-center justify-between ${compact ? 'gap-2' : 'gap-4'} py-1`}>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            active ? 'bg-brand-green animate-pulse' : 'bg-gray-400 dark:bg-gray-600'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-tg-text dark:text-tg-text-dark flex items-center gap-1">
            {active ? 'Remediation Active' : 'Remediation Off'}
          </span>
          {active && (
            <span className="text-[11px] text-brand-dark dark:text-brand-green font-medium flex items-center gap-0.5">
              <Clock className="w-3 h-3 inline" /> Day {daysElapsed} elapsed
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={isUpdating}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(!active);
        }}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
          active ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-700'
        } ${isUpdating ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default RemediationSwitch;
