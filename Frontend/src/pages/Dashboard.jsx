import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter, Sprout, Sparkles, AlertCircle } from 'lucide-react';
import StatusCard from '../components/StatusCard';
import TestCard from '../components/TestCard';
import NewTestModal from '../components/NewTestModal';
import TestDetailModal from '../components/TestDetailModal';
import api from '../api/client';

const Dashboard = ({ onRefreshNotifications }) => {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isNewTestOpen, setIsNewTestOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/tests');
      setTests(response.data);
    } catch (err) {
      console.error('Error fetching soil tests:', err);
      setError('Failed to load soil test records. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleToggleRemediation = async (testId, newState) => {
    setUpdatingId(testId);
    try {
      const response = await api.patch(`/tests/${testId}/remediation`, {
        remediation_active: newState,
      });

      // Update in local tests list
      setTests((prev) =>
        prev.map((t) => (t.id === testId ? response.data : t))
      );

      // Update selected test if open in modal
      if (selectedTest && selectedTest.id === testId) {
        setSelectedTest(response.data);
      }

      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error('Failed to toggle remediation:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTestCreated = (newTest) => {
    setTests((prev) => [newTest, ...prev]);
    if (onRefreshNotifications) {
      onRefreshNotifications();
    }
  };

  const handleSeedData = async () => {
    try {
      setIsLoading(true);
      await api.post('/seed');
      await fetchTests();
      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logic
  const filteredTests = tests.filter((t) => {
    if (filter === 'remediation') return t.remediation_active;
    if (filter === 'high') return t.risk_level === 'high';
    if (filter === 'moderate') return t.risk_level === 'moderate';
    if (filter === 'low') return t.risk_level === 'low';
    return true;
  });

  const latestTest = tests.length > 0 ? tests[0] : null;
  const activeRemediationsCount = tests.filter((t) => t.remediation_active).length;

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      
      {/* 1. Hero Focal Status Card (PRD & Design Doc Section 4) */}
      <StatusCard
        latestTest={latestTest}
        totalTests={tests.length}
        activeRemediations={activeRemediationsCount}
      />

      {/* 2. Action Bar & Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark">
            Soil Test Records
          </h2>
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark">
            Showing {filteredTests.length} of {tests.length} plots tested
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seed Demo Records Button */}
          {tests.length === 0 && (
            <button
              type="button"
              onClick={handleSeedData}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Seed Demo Plots
            </button>
          )}

          {/* Record New Soil Test Primary Button */}
          <button
            type="button"
            onClick={() => setIsNewTestOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-semibold shadow-md shadow-brand-green/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record New Test
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Plots' },
          { id: 'remediation', label: `Active Remediation (${activeRemediationsCount})` },
          { id: 'high', label: 'High Risk' },
          { id: 'moderate', label: 'Moderate' },
          { id: 'low', label: 'Safe' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-brand-green text-white shadow-sm'
                : 'bg-black/[0.03] dark:bg-white/[0.05] text-tg-muted dark:text-tg-muted-dark hover:text-tg-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-risk-high/10 border border-risk-high/20 text-risk-high text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Tests Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-5 shadow-soft border border-black/5 dark:border-white/5 animate-pulse h-48"
            />
          ))}
        </div>
      ) : filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onToggleRemediation={handleToggleRemediation}
              onSelectTest={(t) => setSelectedTest(t)}
              isUpdating={updatingId === test.id}
            />
          ))}
        </div>
      ) : (
        /* Empty State (Design Doc Section 6) */
        <div className="text-center py-12 px-4 bg-tg-surface dark:bg-tg-surface-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-brand-green/10 dark:bg-brand-green/20 text-brand-green flex items-center justify-center mx-auto mb-3">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="text-base font-serif font-bold text-tg-text dark:text-tg-text-dark mb-1">
            No Soil Records Found
          </h3>
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark max-w-sm mx-auto mb-5">
            {filter !== 'all'
              ? 'No soil tests match the selected filter criteria.'
              : 'Start by uploading your first soil colorimetric reaction test to measure lead ppm.'}
          </p>
          <div className="flex justify-center gap-3">
            {filter !== 'all' ? (
              <button
                onClick={() => setFilter('all')}
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold text-tg-text dark:text-tg-text-dark"
              >
                Clear Filter
              </button>
            ) : (
              <button
                onClick={() => setIsNewTestOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Record Test
              </button>
            )}
          </div>
        </div>
      )}

      {/* New Test Creation Modal */}
      <NewTestModal
        isOpen={isNewTestOpen}
        onClose={() => setIsNewTestOpen(false)}
        onTestCreated={handleTestCreated}
      />

      {/* Detailed Soil Test & Photo View Modal */}
      <TestDetailModal
        test={selectedTest}
        isOpen={!!selectedTest}
        onClose={() => setSelectedTest(null)}
        onToggleRemediation={handleToggleRemediation}
      />
    </div>
  );
};

export default Dashboard;
