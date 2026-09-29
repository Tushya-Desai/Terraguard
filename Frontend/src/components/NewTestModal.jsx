import React, { useState } from 'react';
import { X, AlertCircle, Camera } from 'lucide-react';
import RiskBadge from './RiskBadge';
import LocationPicker from './LocationPicker';
import api from '../api/client';

const NewTestModal = ({ isOpen, onClose, onTestCreated }) => {
  const [plotLabel, setPlotLabel] = useState('');
  const [leadConcentration, setLeadConcentration] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [remediationActive, setRemediationActive] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto compute risk level preview
  const numPpm = parseFloat(leadConcentration);
  const calculatedRisk = isNaN(numPpm)
    ? null
    : numPpm < 200
    ? 'low'
    : numPpm <= 400
    ? 'moderate'
    : 'high';

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleLocationChange = (lat, lng) => {
    setLatitude(lat !== null && lat !== undefined ? lat : '');
    setLongitude(lng !== null && lng !== undefined ? lng : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!photoFile) {
      setError('Please attach or capture a soil test reaction photo.');
      return;
    }
    if (!leadConcentration || isNaN(numPpm) || numPpm < 0) {
      setError('Please provide a valid numeric lead concentration (ppm).');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('plot_label', plotLabel || 'Plot 1');
      formData.append('lead_concentration', numPpm);
      if (calculatedRisk) formData.append('risk_level', calculatedRisk);
      if (latitude !== '' && latitude !== null && !isNaN(parseFloat(latitude))) {
        formData.append('latitude', parseFloat(latitude));
      }
      if (longitude !== '' && longitude !== null && !isNaN(parseFloat(longitude))) {
        formData.append('longitude', parseFloat(longitude));
      }
      formData.append('remediation_active', remediationActive);

      const response = await api.post('/tests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onTestCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating soil test:', err);
      setError(err.response?.data?.detail || 'Failed to submit soil test record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-tg-surface dark:bg-tg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark">
              Record New Soil Test
            </h2>
            <p className="text-xs text-tg-muted dark:text-tg-muted-dark">
              Enter reaction data, coordinates, and photo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-tg-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {error && (
            <div className="p-3 rounded-xl bg-risk-high/10 border border-risk-high/30 text-risk-high text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1.5 uppercase tracking-wider">
              Reaction Photo (Test Strip / Cuvette) *
            </label>
            <div className="relative border-2 border-dashed border-black/15 dark:border-white/15 rounded-xl p-4 text-center hover:border-brand-green transition-colors bg-black/[0.02] dark:bg-white/[0.02]">
              {photoPreview ? (
                <div className="space-y-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg object-contain shadow"
                  />
                  <label className="inline-block text-xs font-semibold text-brand-green hover:underline cursor-pointer">
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-tg-text dark:text-tg-text-dark">
                    Upload soil reaction image
                  </span>
                  <span className="text-xs text-tg-muted dark:text-tg-muted-dark mt-0.5">
                    PNG, JPG, or SVG
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Plot Label */}
          <div>
            <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark mb-1">
              Plot or Field Name
            </label>
            <input
              type="text"
              placeholder="e.g. North Plot, Tomato Patch, Sector 4"
              value={plotLabel}
              onChange={(e) => setPlotLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {/* Lead Concentration with live risk preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark">
                Lead Concentration (ppm) *
              </label>
              {calculatedRisk && <RiskBadge level={calculatedRisk} size="sm" />}
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 45.0 (Safe <200, Caution 200-400, High >400)"
              value={leadConcentration}
              onChange={(e) => setLeadConcentration(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-sm text-tg-text dark:text-tg-text-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {/* Interactive Location Picker */}
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
          />

          {/* Remediation Initial Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div>
              <span className="text-xs font-semibold text-tg-text dark:text-tg-text-dark block">
                Start Remediation Cycle
              </span>
              <span className="text-[11px] text-tg-muted dark:text-tg-muted-dark">
                Begin elapsed day tracking from today
              </span>
            </div>
            <input
              type="checkbox"
              checked={remediationActive}
              onChange={(e) => setRemediationActive(e.target.checked)}
              className="w-5 h-5 text-brand-green rounded border-gray-300 focus:ring-brand-green"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold text-tg-text dark:text-tg-text-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving Test...' : 'Save Soil Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTestModal;
