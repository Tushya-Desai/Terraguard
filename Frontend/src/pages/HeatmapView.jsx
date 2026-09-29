import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import {
  MapPin,
  Layers,
  Search,
  Crosshair,
  Loader2,
  X,
  Eye,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import TestDetailModal from '../components/TestDetailModal';
import api from '../api/client';
import 'leaflet/dist/leaflet.css';

// Tile Layer Options (Free, reliable, no Google Maps API keys required)
const TILE_PROVIDERS = {
  osm: {
    name: 'OpenStreetMap (Standard)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: 'Satellite (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  carto: {
    name: 'Clean Light (Carto)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
};

const DEFAULT_CENTER = [22.9734, 78.6569]; // Center of India fallback
const DEFAULT_ZOOM = 5;

// Dynamic Map Controller: handles auto-fit bounds, programmatic flyTo, and resize observers
const MapController = ({ bounds, targetFly, pointsCount }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    const timer1 = setTimeout(() => map.invalidateSize(), 200);
    const timer2 = setTimeout(() => map.invalidateSize(), 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  // Auto-fit bounds on points update
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 14, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    }
  }, [bounds, map, pointsCount]);

  // Programmatic pan when searching
  useEffect(() => {
    if (targetFly) {
      map.flyTo([targetFly.lat, targetFly.lng], targetFly.zoom || 14, { duration: 1.2 });
    }
  }, [targetFly, map]);

  return null;
};

const HeatmapView = () => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [currentTileKey, setCurrentTileKey] = useState('osm');
  const [showHeatGlow, setShowHeatGlow] = useState(true);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [targetFly, setTargetFly] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const searchBoxRef = useRef(null);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tests/heatmap-data');
      setPoints(response.data || []);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getMarkerColor = (risk) => {
    switch ((risk || '').toLowerCase()) {
      case 'high':
        return '#C24C3D';
      case 'moderate':
        return '#E0A526';
      default:
        return '#3E9142';
    }
  };

  const filteredPoints = points.filter((p) => {
    if (selectedRiskFilter === 'all') return true;
    return (p.risk_level || '').toLowerCase() === selectedRiskFilter;
  });

  // Calculate bounding box
  const bounds = useMemo(() => {
    if (filteredPoints.length === 0) return null;
    return filteredPoints.map((p) => [p.lat, p.lng]);
  }, [filteredPoints, recenterTrigger]);

  // OpenStreetMap Nominatim search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=5&addressdetails=1`;
      const response = await fetch(endpoint, {
        headers: { 'Accept-Language': 'en' },
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data || []);
      }
    } catch (err) {
      console.warn('Map place search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setTargetFly({ lat, lng, zoom: 14, timestamp: Date.now() });
      setShowSearchResults(false);
      setSearchQuery(place.display_name.split(',')[0]);
    }
  };

  const handleRecenter = () => {
    setTargetFly(null);
    setRecenterTrigger((prev) => prev + 1);
  };

  // Metrics summary
  const highRiskCount = points.filter((p) => (p.risk_level || '').toLowerCase() === 'high').length;
  const modRiskCount = points.filter((p) => (p.risk_level || '').toLowerCase() === 'moderate').length;
  const safeCount = points.filter((p) => (p.risk_level || '').toLowerCase() === 'low').length;

  const handleOpenDetailModal = async (pointId) => {
    try {
      const response = await api.get(`/tests/${pointId}`);
      setSelectedTestDetail(response.data);
    } catch (err) {
      console.warn('Could not load test detail:', err);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-tg-surface dark:bg-tg-surface-dark p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-green" /> Geospatial Lead Heatmap
            </h2>
            <p className="text-xs text-tg-muted dark:text-tg-muted-dark">
              OpenStreetMap-powered geospatial risk visualization for all tested soil plots
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] text-tg-text dark:text-tg-text-dark font-medium border border-black/5 dark:border-white/5">
              {points.length} Plots Plotted
            </span>
            {highRiskCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-risk-high/15 text-risk-high font-semibold">
                {highRiskCount} High Danger
              </span>
            )}
            {modRiskCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-risk-moderate/15 text-risk-moderate font-semibold">
                {modRiskCount} Moderate
              </span>
            )}
            {safeCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-risk-low/15 text-risk-low font-semibold">
                {safeCount} Safe
              </span>
            )}
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1 border-t border-black/5 dark:border-white/5">
          {/* Risk Level Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `All Plots (${points.length})` },
              { id: 'high', label: `High Risk (${highRiskCount})` },
              { id: 'moderate', label: `Moderate (${modRiskCount})` },
              { id: 'low', label: `Safe (${safeCount})` },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedRiskFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedRiskFilter === item.id
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-tg-muted dark:text-tg-muted-dark hover:text-tg-text'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Place Search on Map */}
          <div className="relative flex-1 max-w-sm" ref={searchBoxRef}>
            <form onSubmit={handleSearch} className="flex gap-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search village, city, farm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true);
                  }}
                  className="w-full pl-7 pr-7 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-tg-text dark:text-tg-text-dark placeholder-tg-muted focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <Search className="w-3.5 h-3.5 text-tg-muted absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-tg-muted hover:text-tg-text p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-2.5 py-1.5 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
              >
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Search Suggestions */}
            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[1000] bg-tg-surface dark:bg-tg-surface-dark border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
                {isSearching ? (
                  <div className="p-2.5 text-center text-xs text-tg-muted flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" />
                    <span>Searching OpenStreetMap...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="divide-y divide-black/5 dark:divide-white/5">
                    {searchResults.map((res, idx) => (
                      <li key={res.place_id || idx}>
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(res)}
                          className="w-full text-left px-3 py-2 hover:bg-brand-green/10 dark:hover:bg-brand-green/15 text-xs transition-colors flex items-start gap-2 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-brand-green mt-0.5 shrink-0" />
                          <span className="text-tg-text dark:text-tg-text-dark line-clamp-1">
                            {res.display_name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-2.5 text-center text-xs text-tg-muted">
                    No results found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[65vh] min-h-[440px] rounded-2xl overflow-hidden shadow-soft dark:shadow-soft-dark border border-black/10 dark:border-white/10 bg-[#e5e3df] dark:bg-[#1a1f18]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-black/40">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-tg-muted dark:text-tg-muted-dark">Loading geospatial map data...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={bounds && bounds.length > 0 ? bounds[0] : DEFAULT_CENTER}
            zoom={bounds && bounds.length > 0 ? 13 : DEFAULT_ZOOM}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
          >
            <MapController
              bounds={bounds}
              targetFly={targetFly}
              pointsCount={filteredPoints.length}
            />

            {/* Selected Tile Provider */}
            <TileLayer
              attribution={TILE_PROVIDERS[currentTileKey].attribution}
              url={TILE_PROVIDERS[currentTileKey].url}
            />

            {/* Plot Circular Risk Heat Markers */}
            {filteredPoints.map((point) => {
              const color = getMarkerColor(point.risk_level);
              return (
                <React.Fragment key={point.id}>
                  {/* Heat glow ring representing risk-weighted intensity */}
                  {showHeatGlow && (
                    <CircleMarker
                      center={[point.lat, point.lng]}
                      radius={point.intensity * 28 + 12}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.22,
                        weight: 1,
                      }}
                    />
                  )}

                  {/* Core solid marker */}
                  <CircleMarker
                    center={[point.lat, point.lng]}
                    radius={9}
                    pathOptions={{
                      color: '#FFFFFF',
                      fillColor: color,
                      fillOpacity: 0.95,
                      weight: 2.5,
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 space-y-2.5 min-w-[210px]">
                        <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5">
                          <span className="font-bold text-xs text-tg-text truncate">
                            {point.plot_label || 'Soil Test'}
                          </span>
                          <RiskBadge level={point.risk_level} size="sm" />
                        </div>

                        {point.photo_url && (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-black/10">
                            <img
                              src={point.photo_url}
                              alt="Reaction"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-tg-muted">Lead Level:</span>
                          <span className="font-bold text-sm text-tg-text">
                            {point.lead_concentration} ppm
                          </span>
                        </div>

                        <div className="text-[10px] text-tg-muted font-mono">
                          GPS: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(point.id)}
                          className="w-full py-1.5 rounded-lg bg-brand-green hover:bg-brand-dark text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> View Trend &amp; Details
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        )}

        {/* Top-Right Map Controls Overlay */}
        <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
          {/* Fit all plots button */}
          {filteredPoints.length > 0 && (
            <button
              type="button"
              onClick={handleRecenter}
              title="Fit All Plots in View"
              className="bg-tg-surface/95 dark:bg-tg-surface-dark/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-black/10 dark:border-white/10 text-xs font-semibold text-tg-text dark:text-tg-text-dark flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-brand-green" /> Fit Plots
            </button>
          )}

          {/* Basemap Switcher Dropdown */}
          <div className="bg-tg-surface/95 dark:bg-tg-surface-dark/95 backdrop-blur-md rounded-xl shadow-md border border-black/10 dark:border-white/10 p-1 flex items-center gap-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-brand-green ml-1.5" />
            <select
              value={currentTileKey}
              onChange={(e) => setCurrentTileKey(e.target.value)}
              className="bg-transparent text-tg-text dark:text-tg-text-dark text-xs font-medium py-1 px-1.5 focus:outline-none cursor-pointer"
            >
              <option value="osm" className="bg-tg-surface dark:bg-tg-surface-dark">
                Street (OSM)
              </option>
              <option value="satellite" className="bg-tg-surface dark:bg-tg-surface-dark">
                Satellite (Esri)
              </option>
              <option value="carto" className="bg-tg-surface dark:bg-tg-surface-dark">
                Clean Light
              </option>
            </select>
          </div>
        </div>

        {/* Bottom-Left Heat Toggle */}
        <div className="absolute bottom-4 left-4 z-[500] bg-tg-surface/95 dark:bg-tg-surface-dark/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-black/10 dark:border-white/10 text-xs flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-tg-text dark:text-tg-text-dark font-medium text-[11px]">
            <input
              type="checkbox"
              checked={showHeatGlow}
              onChange={(e) => setShowHeatGlow(e.target.checked)}
              className="w-3.5 h-3.5 text-brand-green rounded border-gray-300 focus:ring-brand-green cursor-pointer"
            />
            <span>Heat Intensity Rings</span>
          </label>
        </div>

        {/* Bottom-Right Legend Overlay Card */}
        <div className="absolute bottom-4 right-4 z-[500] bg-tg-surface/95 dark:bg-tg-surface-dark/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-black/10 dark:border-white/10 text-xs space-y-1.5">
          <span className="font-semibold text-[11px] text-tg-text dark:text-tg-text-dark block uppercase tracking-wider">
            Risk Map Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3E9142]" />
            <span className="text-tg-text dark:text-tg-text-dark font-medium">Safe (&lt;200 ppm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E0A526]" />
            <span className="text-tg-text dark:text-tg-text-dark font-medium">Moderate (200–400 ppm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C24C3D]" />
            <span className="text-tg-text dark:text-tg-text-dark font-medium">High / Danger (&gt;400 ppm)</span>
          </div>
        </div>
      </div>

      {/* Embedded Test Detail Modal (when user clicks 'View Trend & Details' in map popup) */}
      <TestDetailModal
        test={selectedTestDetail}
        isOpen={!!selectedTestDetail}
        onClose={() => setSelectedTestDetail(null)}
        onToggleRemediation={async (testId, newState) => {
          try {
            const response = await api.patch(`/tests/${testId}/remediation`, {
              remediation_active: newState,
            });
            setSelectedTestDetail(response.data);
            fetchHeatmapData();
          } catch (err) {
            console.error('Failed to toggle remediation:', err);
          }
        }}
      />
    </div>
  );
};

export default HeatmapView;
