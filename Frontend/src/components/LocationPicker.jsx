import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, AlertCircle, Loader2, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Default center (Center of India fallback)
const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 };
const DEFAULT_ZOOM = 13;
const FALLBACK_ZOOM = 5;

// Custom SVG pin icon for crisp rendering without broken default leaflet asset paths
const createPinIcon = () => {
  const svgHtml = `
    <div style="width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; user-select: none;">
      <svg viewBox="0 0 32 42" width="32" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
        <defs>
          <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
          </filter>
        </defs>
        <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.163 24.837 0 16 0Z" 
              fill="#2F5C3A" filter="url(#pinShadow)"/>
        <path d="M16 2.5C8.544 2.5 2.5 8.544 2.5 16C2.5 25 16 38.5 16 38.5C16 38.5 29.5 25 29.5 16C29.5 8.544 23.456 2.5 16 2.5Z" 
              fill="#4C8C5C"/>
        <circle cx="16" cy="15.5" r="6" fill="#FAF7F0"/>
        <circle cx="16" cy="15.5" r="3.2" fill="#B8863B"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-location-pin',
    iconSize: [32, 42],
    iconAnchor: [16, 42], // Anchor tip is exactly bottom center
    popupAnchor: [0, -42],
  });
};

// Map controller to handle resize invalidation and programmatic camera movements (Search/GPS ONLY)
function MapController({ targetView, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Robust resize observer so Leaflet never loses coordinate calculations inside modal or responsive layout
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    map.invalidateSize();

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  // Only move camera when a deliberate programmatic view is requested (search or GPS auto-detect)
  useEffect(() => {
    if (targetView && targetView.lat !== undefined && targetView.lng !== undefined) {
      map.flyTo([targetView.lat, targetView.lng], targetView.zoom || DEFAULT_ZOOM, {
        duration: 1.2,
      });
    }
  }, [targetView, map]);

  return null;
}

// Map click event handler to move pin directly on click
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Helper to format coordinates with cardinal indicators (e.g. 23.0225° N, 72.5714° E)
export function formatCoordinates(lat, lng) {
  if (lat === null || lat === undefined || isNaN(lat) || lng === null || lng === undefined || isNaN(lng)) {
    return 'Coordinates not selected';
  }
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

const LocationPicker = ({
  latitude = null,
  longitude = null,
  onLocationChange,
}) => {
  // Check if initial coordinates were supplied
  const initialCoords = useMemo(() => {
    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return { lat: numLat, lng: numLng };
    }
    return null;
  }, []);

  const [position, setPosition] = useState(() => initialCoords || DEFAULT_CENTER);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [targetView, setTargetView] = useState(() =>
    initialCoords ? { lat: initialCoords.lat, lng: initialCoords.lng, zoom: DEFAULT_ZOOM } : null
  );

  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const searchContainerRef = useRef(null);
  const userInteractedRef = useRef(false);
  const pinIcon = useMemo(() => createPinIcon(), []);

  // Request browser geolocation
  const detectCurrentLocation = useCallback((isInitial = false) => {
    if (!navigator.geolocation) {
      if (!userInteractedRef.current) {
        setStatusMessage('Location not detected — please drag the pin to your plot.');
        if (isInitial && !initialCoords) {
          setPosition(DEFAULT_CENTER);
          setTargetView({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: FALLBACK_ZOOM });
          if (onLocationChange) onLocationChange(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        }
      }
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        // If user already dragged or searched before geolocation resolved, don't overwrite
        if (isInitial && userInteractedRef.current) {
          return;
        }

        const newCoords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setPosition(newCoords);
        setStatusMessage('');
        setTargetView({ lat: newCoords.lat, lng: newCoords.lng, zoom: 15 });

        if (onLocationChange) {
          onLocationChange(newCoords.lat, newCoords.lng);
        }
      },
      (err) => {
        console.warn('Geolocation access unavailable or denied:', err.message);
        setIsDetecting(false);
        if (!userInteractedRef.current) {
          setStatusMessage('Location not detected — please drag the pin to your plot.');
          if (isInitial && !initialCoords) {
            setPosition(DEFAULT_CENTER);
            setTargetView({ lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: FALLBACK_ZOOM });
            if (onLocationChange) onLocationChange(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000,
      }
    );
  }, [initialCoords, onLocationChange]);

  // Initial detection on mount only if no initial coordinates
  useEffect(() => {
    if (!initialCoords) {
      detectCurrentLocation(true);
    }
  }, [detectCurrentLocation, initialCoords]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drag marker end handler - Smoothly updates position without resetting zoom or map camera
  const handleMarkerDragEnd = useCallback((e) => {
    userInteractedRef.current = true;
    const marker = e.target;
    if (marker) {
      const latLng = marker.getLatLng();
      const updated = {
        lat: parseFloat(latLng.lat.toFixed(6)),
        lng: parseFloat(latLng.lng.toFixed(6)),
      };
      setPosition(updated);
      setStatusMessage('');
      if (onLocationChange) {
        onLocationChange(updated.lat, updated.lng);
      }
    }
  }, [onLocationChange]);

  // Map click handler - Jump pin to clicked position without zooming out
  const handleMapClick = useCallback((lat, lng) => {
    userInteractedRef.current = true;
    const updated = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
    };
    setPosition(updated);
    setStatusMessage('');
    if (onLocationChange) {
      onLocationChange(updated.lat, updated.lng);
    }
  }, [onLocationChange]);

  // OpenStreetMap Nominatim Free Search API
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=5&addressdetails=1`;

      const response = await fetch(endpoint, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (err) {
      console.warn('Nominatim search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search results - Smoothly pans camera to the found place
  const handleSelectSearchResult = (result) => {
    userInteractedRef.current = true;
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (!isNaN(lat) && !isNaN(lng)) {
      const newCoords = {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      };
      setPosition(newCoords);
      setStatusMessage('');
      setShowResults(false);
      setSearchQuery(result.display_name.split(',')[0]);
      setTargetView({ lat: newCoords.lat, lng: newCoords.lng, zoom: 15 });

      if (onLocationChange) {
        onLocationChange(newCoords.lat, newCoords.lng);
      }
    }
  };

  const handleManualGPSDetect = () => {
    userInteractedRef.current = false;
    detectCurrentLocation(false);
  };

  return (
    <div className="space-y-2">
      {/* Search Bar & Auto GPS Button */}
      <div className="space-y-1.5" ref={searchContainerRef}>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-tg-text dark:text-tg-text-dark">
            Plot Location Picker (Drag pin or search)
          </label>
          <button
            type="button"
            onClick={handleManualGPSDetect}
            disabled={isDetecting}
            className="text-[11px] text-brand-green hover:text-brand-dark dark:hover:text-brand-green/80 flex items-center gap-1 font-medium transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS...
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3" /> Auto-detect GPS
              </>
            )}
          </button>
        </div>

        {/* Nominatim Search Input */}
        <div className="relative">
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search village, city, farm, or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
                className="w-full pl-8 pr-8 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-tg-text dark:text-tg-text-dark placeholder-tg-muted focus:outline-none focus:ring-2 focus:ring-brand-green transition-all"
              />
              <Search className="w-3.5 h-3.5 text-tg-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tg-muted hover:text-tg-text p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-2 rounded-xl bg-brand-green hover:bg-brand-dark text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Search Suggestions Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-1 z-[1000] bg-tg-surface dark:bg-tg-surface-dark border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-tg-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" />
                  <span>Searching OpenStreetMap...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="divide-y divide-black/5 dark:divide-white/5">
                  {searchResults.map((result, idx) => (
                    <li key={result.place_id || idx}>
                      <button
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left px-3 py-2.5 hover:bg-brand-green/10 dark:hover:bg-brand-green/15 text-xs transition-colors flex items-start gap-2 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-brand-green mt-0.5 shrink-0" />
                        <span className="text-tg-text dark:text-tg-text-dark line-clamp-2">
                          {result.display_name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-xs text-tg-muted">
                  No locations found for "{searchQuery}". Try a broader place name.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Warning / Notification Note (Location denied or not detected) */}
      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#e5e3df] dark:bg-[#1a1f18] shadow-inner">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={initialCoords ? DEFAULT_ZOOM : 13}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <MapController
            targetView={targetView}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
          <MapClickHandler onLocationSelect={handleMapClick} />

          {/* OpenStreetMap Standard Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draggable Marker Pin */}
          <Marker
            position={[position.lat, position.lng]}
            draggable={true}
            autoPan={true}
            autoPanPadding={[40, 40]}
            icon={pinIcon}
            ref={markerRef}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>

        {/* Small Helper Badge over Map */}
        <div className="absolute top-2 right-2 z-[400] bg-tg-surface/90 dark:bg-tg-surface-dark/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 text-[10px] text-tg-muted dark:text-tg-muted-dark pointer-events-none shadow-sm">
          Click or drag pin to adjust
        </div>
      </div>

      {/* Read-Only Selected Location Output */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="w-4 h-4 text-brand-green shrink-0" />
          <div className="text-xs truncate">
            <span className="text-tg-muted dark:text-tg-muted-dark mr-1.5">Selected location:</span>
            <span className="font-semibold text-tg-text dark:text-tg-text-dark">
              {formatCoordinates(position.lat, position.lng)}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-tg-muted dark:text-tg-muted-dark shrink-0 ml-2">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
