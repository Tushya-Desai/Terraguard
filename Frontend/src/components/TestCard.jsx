import React from 'react';
import { Calendar, MapPin, ZoomIn, FlaskConical } from 'lucide-react';
import RiskBadge from './RiskBadge';
import RemediationSwitch from './RemediationSwitch';
import { API_BASE_URL } from '../api/client';

const TestCard = ({ test, onToggleRemediation, onSelectTest, isUpdating = false }) => {
  const formattedDate = new Date(test.tested_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const photoSrc = test.photo_url || (test.photo_path ? `${API_BASE_URL}/uploads/${test.photo_path}` : '');

  return (
    <div className="group bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-4 sm:p-5 shadow-soft dark:shadow-soft-dark border border-black/5 dark:border-white/5 transition-all duration-200 hover:shadow-lift flex flex-col justify-between">
      {/* Top: Header with Plot Label and Risk Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <MapPin className="w-4 h-4 text-brand-gold flex-shrink-0" />
            <h3 className="font-semibold text-sm sm:text-base text-tg-text dark:text-tg-text-dark truncate">
              {test.plot_label || 'Plot Record'}
            </h3>
          </div>
          <RiskBadge level={test.risk_level} size="sm" />
        </div>

        {/* Reaction Photo and Info Column */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Soil Reaction Photo preview */}
          <div
            onClick={() => onSelectTest && onSelectTest(test)}
            className="col-span-5 relative aspect-[4/3] rounded-xl overflow-hidden bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 cursor-pointer group-hover:border-brand-green/40 transition-colors"
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={`Reaction for ${test.plot_label}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback for visual continuity
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-tg-muted">
                <FlaskConical className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white drop-shadow" />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="col-span-7 flex flex-col justify-center space-y-1.5">
            <div>
              <span className="text-[10px] uppercase font-semibold text-tg-muted dark:text-tg-muted-dark tracking-wider block">
                Lead Concentration
              </span>
              <span className="text-xl font-bold font-serif text-tg-text dark:text-tg-text-dark">
                {test.lead_concentration} <span className="text-xs font-sans font-normal text-tg-muted">ppm</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-tg-muted dark:text-tg-muted-dark">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>

            {test.latitude && test.longitude && (
              <div className="text-[11px] text-tg-muted dark:text-tg-muted-dark font-mono">
                {test.latitude.toFixed(4)}, {test.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Remediation Switch */}
      <div className="pt-3 border-t border-black/5 dark:border-white/5 mt-auto">
        <RemediationSwitch
          active={test.remediation_active}
          daysElapsed={test.days_elapsed || 0}
          onToggle={(newState) => onToggleRemediation(test.id, newState)}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
};

export default TestCard;
