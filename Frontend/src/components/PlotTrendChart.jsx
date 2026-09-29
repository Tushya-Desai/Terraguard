import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, AlertCircle, Loader2, LineChart as ChartIcon, Sparkles } from 'lucide-react';
import RiskBadge from './RiskBadge';
import api from '../api/client';

// Custom Tooltip Component for Recharts
const CustomChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const ppm = data.ppm_value;
  const riskColor =
    ppm < 200 ? '#3E9142' : ppm <= 400 ? '#E0A526' : '#C24C3D';

  return (
    <div className="bg-tg-surface dark:bg-tg-surface-dark p-3 rounded-xl shadow-xl border border-black/10 dark:border-white/10 text-xs space-y-1.5 min-w-[160px] animate-fade-in z-50">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-1">
        <span className="font-semibold text-tg-text dark:text-tg-text-dark">
          {data.test_date || 'Soil Test'}
        </span>
        <RiskBadge level={data.risk_level} size="sm" />
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <span className="text-tg-muted dark:text-tg-muted-dark">Lead Level:</span>
        <span className="font-bold text-sm" style={{ color: riskColor }}>
          {ppm} <span className="text-[10px] text-tg-muted dark:text-tg-muted-dark">ppm</span>
        </span>
      </div>

      {data.remediation_active && (
        <div className="text-[10px] text-brand-green flex items-center gap-1 font-medium">
          <span>Remediation Active</span>
          {data.days_elapsed > 0 && <span>(Day {data.days_elapsed})</span>}
        </div>
      )}
    </div>
  );
};

// Customized Dot displaying color matching the reading's risk tier
const CustomizedDot = (props) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;

  const ppm = payload.ppm_value;
  const color = ppm < 200 ? '#3E9142' : ppm <= 400 ? '#E0A526' : '#C24C3D';

  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke={color} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </g>
  );
};

const PlotTrendChart = ({ plotIdentifier }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plotIdentifier) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/plots/${encodeURIComponent(plotIdentifier)}/history`);
        if (isMounted) {
          setHistory(response.data || []);
        }
      } catch (err) {
        console.warn('Could not fetch plot trend history:', err);
        if (isMounted) {
          setError('Could not load historical trend data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [plotIdentifier]);

  // Loading State
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-tg-muted dark:text-tg-muted-dark min-h-[140px]">
        <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
        <span>Loading historical lead trends...</span>
      </div>
    );
  }

  // Error State (Graceful non-blocking fallback)
  if (error) {
    return (
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>{error}</span>
      </div>
    );
  }

  // Fallback State: Exactly 1 test (or 0 tests) - Friendly educational guidance
  if (history.length <= 1) {
    const singleReading = history.length === 1 ? history[0].ppm_value : null;

    return (
      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-brand-green" />
          <span className="text-xs font-semibold text-tg-text dark:text-tg-text-dark">
            Historical Lead Trend
          </span>
        </div>
        <div className="flex items-start gap-3 py-1">
          <div className="w-8 h-8 rounded-lg bg-brand-green/10 dark:bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-tg-text dark:text-tg-text-dark">
              Add more tests over time to see a trend.
            </p>
            <p className="text-[11px] text-tg-muted dark:text-tg-muted-dark leading-relaxed">
              {singleReading !== null ? (
                <>
                  Baseline recording: <span className="font-semibold text-tg-text dark:text-tg-text-dark">{singleReading} ppm</span>.
                  Record follow-up soil reaction tests to track ppm reductions and remediation velocity.
                </>
              ) : (
                'Once multiple soil tests are logged for this plot, a timeline trend chart will appear here.'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multi-test Trend Line Chart Calculation
  const firstReading = history[0].ppm_value;
  const lastReading = history[history.length - 1].ppm_value;
  const diff = lastReading - firstReading;
  const isImproving = diff < 0; // Lower lead ppm is better

  // Determine Y-axis max domain with room for threshold lines
  const maxVal = Math.max(...history.map((h) => h.ppm_value), 420);
  const yAxisMax = Math.ceil((maxVal + 40) / 50) * 50;

  return (
    <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
      {/* Header & Trend Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-brand-green" />
          <div>
            <h4 className="text-xs font-semibold text-tg-text dark:text-tg-text-dark">
              Historical Lead Trendline ({history.length} tests)
            </h4>
            <span className="text-[10px] text-tg-muted dark:text-tg-muted-dark block">
              Tracking lead reduction from {history[0].test_date} to {history[history.length - 1].test_date}
            </span>
          </div>
        </div>

        {/* Change Indicator Pill */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            isImproving
              ? 'bg-[#3E9142]/15 text-[#3E9142]'
              : diff > 0
              ? 'bg-[#C24C3D]/15 text-[#C24C3D]'
              : 'bg-black/5 dark:bg-white/5 text-tg-muted'
          }`}
        >
          {isImproving ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{Math.abs(diff).toFixed(1)} ppm reduction</span>
            </>
          ) : diff > 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{diff.toFixed(1)} ppm increase</span>
            </>
          ) : (
            <>
              <Minus className="w-3.5 h-3.5" />
              <span>No change</span>
            </>
          )}
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="w-full h-48 sm:h-52 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 106, 99, 0.15)" vertical={false} />
            
            <XAxis
              dataKey="test_date"
              stroke="#6B6A63"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(107, 106, 99, 0.2)' }}
            />
            
            <YAxis
              domain={[0, yAxisMax]}
              stroke="#6B6A63"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(107, 106, 99, 0.2)' }}
              unit=" ppm"
            />

            <Tooltip content={<CustomChartTooltip />} />

            {/* Threshold Reference Line: 200 ppm (Safe Limit) */}
            <ReferenceLine
              y={200}
              stroke="#3E9142"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Safe (200 ppm)',
                fill: '#3E9142',
                fontSize: 9,
                position: 'insideBottomRight',
              }}
            />

            {/* Threshold Reference Line: 400 ppm (Danger Limit) */}
            <ReferenceLine
              y={400}
              stroke="#C24C3D"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Danger (400 ppm)',
                fill: '#C24C3D',
                fontSize: 9,
                position: 'insideTopRight',
              }}
            />

            {/* Main Trend Line */}
            <Line
              type="monotone"
              dataKey="ppm_value"
              name="Lead Concentration"
              stroke="#4C8C5C"
              strokeWidth={2.5}
              dot={<CustomizedDot />}
              activeDot={{ r: 7, fill: '#4C8C5C', stroke: '#FFFFFF', strokeWidth: 2 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-between text-[10px] text-tg-muted dark:text-tg-muted-dark pt-1 border-t border-black/5 dark:border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3E9142]" />
            <span>Safe (&lt;200)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0A526]" />
            <span>Moderate (200–400)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C24C3D]" />
            <span>Danger (&gt;400)</span>
          </div>
        </div>
        <span className="italic">Dashed lines indicate regulatory safety thresholds</span>
      </div>
    </div>
  );
};

export default PlotTrendChart;
