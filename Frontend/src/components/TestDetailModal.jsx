import React, { useState } from 'react';
import { X, Calendar, MapPin, Activity, Clock, ShieldAlert, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import RiskBadge from './RiskBadge';
import RemediationSwitch from './RemediationSwitch';
import PlotTrendChart from './PlotTrendChart';
import api, { API_BASE_URL } from '../api/client';

const TestDetailModal = ({ test, isOpen, onClose, onToggleRemediation }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (!isOpen || !test) return null;

  const photoSrc = test.photo_url || (test.photo_path ? `${API_BASE_URL}/uploads/${test.photo_path}` : '');
  const formattedDate = new Date(test.tested_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setDownloadError('');
      
      const plotParam = test.plot_label || test.id;
      const response = await api.get(`/plots/${encodeURIComponent(plotParam)}/report`, {
        responseType: 'blob',
      });

      // Create blob link and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const safeName = (test.plot_label || `Plot_${test.id}`).replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.setAttribute('download', `TerraGuard_Report_${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 200);
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      setDownloadError('Unable to generate PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-tg-surface dark:bg-tg-surface-dark w-full max-w-xl rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <MapPin className="w-5 h-5 text-brand-gold shrink-0" />
            <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark truncate">
              {test.plot_label || 'Soil Test Record'}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Report Button in Header */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3 py-1.5 rounded-xl bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              title="Download official PDF report summary"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Report (PDF)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-tg-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {downloadError && (
            <div className="p-3 rounded-xl bg-risk-high/10 border border-risk-high/30 text-risk-high text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}
          {/* Prominent Reaction Photo Frame (PRD 4.4 & Design Doc) */}
          <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 aspect-[16/10] flex items-center justify-center">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt="Reaction Reaction Detail"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-sm text-tg-muted">No reaction photo available</span>
            )}
            <div className="absolute top-3 right-3">
              <RiskBadge level={test.risk_level} size="lg" />
            </div>
          </div>

          {/* Key Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <span className="text-[10px] uppercase font-semibold text-tg-muted dark:text-tg-muted-dark block">
                Lead Concentration
              </span>
              <span className="text-xl font-bold font-serif text-tg-text dark:text-tg-text-dark">
                {test.lead_concentration} <span className="text-xs font-sans text-tg-muted">ppm</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <span className="text-[10px] uppercase font-semibold text-tg-muted dark:text-tg-muted-dark block">
                Risk Classification
              </span>
              <span className="text-base font-bold font-serif capitalize text-tg-text dark:text-tg-text-dark">
                {test.risk_level} Risk
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold text-tg-muted dark:text-tg-muted-dark block">
                Remediation Status
              </span>
              <span className="text-sm font-semibold text-brand-green">
                {test.remediation_active ? `Active (Day ${test.days_elapsed})` : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Historical Trendline Chart (Recharts) */}
          <PlotTrendChart plotIdentifier={test.plot_label || test.id} />

          {/* Details & Location */}
          <div className="space-y-2 text-xs text-tg-muted dark:text-tg-muted-dark bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-tg-muted" />
              <span>Sample Tested: {formattedDate}</span>
            </div>
            {test.latitude && test.longitude && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-tg-muted" />
                <span>
                  GPS: {test.latitude.toFixed(6)}, {test.longitude.toFixed(6)}
                </span>
              </div>
            )}
            {test.remediation_start_date && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-tg-muted" />
                <span>
                  Remediation Cycle Began:{' '}
                  {new Date(test.remediation_start_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Remediation Toggle */}
          <div className="p-4 rounded-xl bg-brand-green/10 dark:bg-brand-green/15 border border-brand-green/20">
            <span className="text-xs font-semibold text-brand-dark dark:text-brand-green block mb-2">
              Remediation Management
            </span>
            <RemediationSwitch
              active={test.remediation_active}
              daysElapsed={test.days_elapsed || 0}
              onToggle={(newState) => onToggleRemediation(test.id, newState)}
            />
          </div>

          {/* Export Action Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div>
              <span className="text-xs font-semibold text-tg-text dark:text-tg-text-dark block">
                Official Plot Assessment Report
              </span>
              <span className="text-[11px] text-tg-muted dark:text-tg-muted-dark">
                Export printable summary with test history, risk analysis, and reaction photo
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shrink-0 ml-3"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailModal;
