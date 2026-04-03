import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map as MapIcon, X } from 'lucide-react';
import {
  getAllAreaCoordinates,
  ZONE_COLORS,
  ZONE_PRICES,
  PORT_HARCOURT_CENTER,
  DEFAULT_ZOOM,
} from '../../utils/areaCoordinates';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Helper to parse hex to RGB
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

// Custom SVG SLEEK markers
const createIcon = (color: string, variant: 'pin' | 'dot' = 'dot', pulse: boolean = false, label?: string) => {
  const rgb = hexToRgb(color);

  const pulseHtml = pulse 
    ? `<div class="absolute tracking-pin-pulse" style="--pulse-color: ${rgb}; width: 14px; height: 14px; border-radius: 50%; background: ${color}; bottom: -4px; left: 9px; opacity: 0.6; z-index: -1;"></div>`
    : '';

  const labelHtml = label 
    ? `<div class="absolute top-[100%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 shadow-sm text-[9px] font-bold text-gray-700 mt-1 pointer-events-none">${label}</div>`
    : '';

  // Minimal dot variant for better performance and less clutter
  if (variant === 'dot') {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex flex-col items-center justify-center" style="width: 24px; height: 24px;">
          <div class="w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-150" style="background-color: ${color};"></div>
          ${labelHtml}
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  // Large pin variant for active selection
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex flex-col items-center justify-center" style="width: 32px; height: 40px;">
        <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" class="w-8 h-8 md:w-9 md:h-9 drop-shadow-md z-10 transition-transform hover:scale-110">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
        </svg>
        ${pulseHtml}
        ${labelHtml}
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};



// Reset map view component
const ResetView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, []);
  return null;
};

const AdminMap = () => {
  const allAreas = useMemo(() => getAllAreaCoordinates(), []);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState<number | null>(null);
  const polylineRef = useRef<L.Polyline>(null);
  const rafRef = useRef<number>();

  // Calculate price when both are selected
  useEffect(() => {
    if (selectedPickup && selectedDropoff) {
      const pickupArea = allAreas.find(a => a.name === selectedPickup);
      const dropoffArea = allAreas.find(a => a.name === selectedDropoff);
      if (pickupArea?.coord.zone && dropoffArea?.coord.zone) {
        const pickupPrice = ZONE_PRICES[pickupArea.coord.zone] || 0;
        const dropoffPrice = ZONE_PRICES[dropoffArea.coord.zone] || 0;
        setQuotePrice(Math.max(pickupPrice, dropoffPrice));
      }
    } else {
      setQuotePrice(null);
    }
  }, [selectedPickup, selectedDropoff]);

  const handleMarkerClick = (name: string) => {
    if (!selectedPickup) {
      setSelectedPickup(name);
    } else if (!selectedDropoff && name !== selectedPickup) {
      setSelectedDropoff(name);
    } else {
      // Reset and start new selection
      setSelectedPickup(name);
      setSelectedDropoff(null);
    }
  };

  const clearSelection = () => {
    setSelectedPickup(null);
    setSelectedDropoff(null);
    setQuotePrice(null);
  };

  // Get line coordinates
  const getLineCoords = (): [number, number][] => {
    if (!selectedPickup || !selectedDropoff) return [];
    const pickup = allAreas.find(a => a.name === selectedPickup);
    const dropoff = allAreas.find(a => a.name === selectedDropoff);
    if (!pickup || !dropoff) return [];
    return [
      [pickup.coord.lat, pickup.coord.lng],
      [dropoff.coord.lat, dropoff.coord.lng],
    ];
  };

  const lineCoords = getLineCoords();

  // Manual Path Animation (requestAnimationFrame) - Bulletproof v4
  useEffect(() => {
    if (!polylineRef.current || lineCoords.length !== 2) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let offset = 0;
    const animate = () => {
      offset = (offset - 0.5) % 24;
      const el = polylineRef.current?.getElement() as SVGPathElement | null;
      if (el) {
        el.style.strokeDashoffset = offset.toString();
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [lineCoords]);

  // Group areas by zone for legend
  const zones = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MapIcon className="h-7 w-7 text-blue-600" />
          Zone Map
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Click any two zones to see the delivery quote price
        </p>
      </div>

      {/* Instructions + Quote Display */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {!selectedPickup && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                Click a zone to set <strong>Pickup</strong>
              </span>
            )}
            {selectedPickup && !selectedDropoff && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  📍 Pickup: {selectedPickup}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Now click <strong>Drop-off</strong>
                </span>
              </div>
            )}
            {selectedPickup && selectedDropoff && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  📍 {selectedPickup}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  📍 {selectedDropoff}
                </span>
                {quotePrice !== null && (
                  <span className="text-lg font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-200">
                    ₦{quotePrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
          {(selectedPickup || selectedDropoff) && (
            <button
              onClick={clearSelection}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
        <style>{`
          .flowing-route {
            stroke-dasharray: 12 !important;
          }
          .leaflet-grab { cursor: grab; }
          .leaflet-dragging .leaflet-grab { cursor: grabbing; }
        `}</style>

        <MapContainer
          center={PORT_HARCOURT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '520px', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          touchZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <ResetView center={PORT_HARCOURT_CENTER} zoom={DEFAULT_ZOOM} />

          {/* Floating Quote Screen */}
          {selectedPickup && (
            <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 rounded-3xl p-5 min-w-[240px] animate-in slide-in-from-right-8 duration-500 ring-1 ring-black/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estimate</span>
                </div>
                <button 
                  onClick={clearSelection}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="relative pl-4 border-l-2 border-dashed border-gray-100 py-1">
                  <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                  <div className="mb-4">
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Pickup</div>
                    <div className="text-sm font-black text-gray-900 leading-tight">{selectedPickup}</div>
                  </div>

                  <div className="absolute -left-[7px] bottom-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Drop-off</div>
                    {selectedDropoff ? (
                      <div className="text-sm font-black text-gray-900 leading-tight">{selectedDropoff}</div>
                    ) : (
                      <div className="text-sm font-bold text-blue-400/60 italic animate-pulse">Select on map...</div>
                    )}
                  </div>
                </div>
                
                {selectedDropoff && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between items-end">
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Total Quote</div>
                        <div className="text-2xl font-black text-primary-600 tracking-tighter">
                          ₦{quotePrice?.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-primary-100">
                        Top Zone
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Line */}
          {lineCoords.length === 2 && (
            <Polyline
              ref={polylineRef}
              positions={lineCoords}
              pathOptions={{
                color: '#E8792F',
                weight: 3.5,
                opacity: 0.9,
                dashArray: '12',
                className: 'flowing-route'
              }}
            />
          )}

          {/* Optimized Area Markers */}
          {useMemo(() => {
            // Pre-calculate ALL icons once (60+ markers) so they are reused across renders
            // This allows us to keep the labels without the lag
            const iconCache: Record<string, L.DivIcon> = {};
            
            allAreas.forEach(({ name, coord }) => {
              const zoneColor = coord.zone ? ZONE_COLORS[coord.zone] : '#6B7280';
              // Base DOT icon for this specific area
              iconCache[name] = createIcon(zoneColor, 'dot', false, name);
            });

            return allAreas.map(({ name, coord }) => {
              const isPickup = selectedPickup === name;
              const isDropoff = selectedDropoff === name;
              
              // Use PIN for selection, DOT for default
              let icon;
              if (isPickup) icon = createIcon('#3B82F6', 'pin', true, name);
              else if (isDropoff) icon = createIcon('#10B981', 'pin', true, name);
              else icon = iconCache[name];

              return (
                <Marker
                  key={name}
                  position={[coord.lat, coord.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => handleMarkerClick(name),
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    className="custom-tooltip"
                  >
                    <div className="text-center">
                      <div className="font-semibold text-sm">{name}</div>
                      {coord.zone && (
                        <div className="text-xs text-gray-500">
                          Zone {coord.zone} — ₦{(ZONE_PRICES[coord.zone] || 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </Marker>
              );
            });
          }, [allAreas, selectedPickup, selectedDropoff])}
        </MapContainer>
      </div>

      {/* Zone Legend */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Zone Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {zones.map(zone => (
            <div
              key={zone}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100"
              style={{ borderLeftColor: ZONE_COLORS[zone], borderLeftWidth: 4 }}
            >
              <div>
                <div className="font-semibold text-gray-900 text-sm">Zone {zone}</div>
                <div className="text-xs text-gray-500">₦{ZONE_PRICES[zone].toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Price is based on the <strong>highest zone</strong> between pickup and drop-off.
        </p>
      </div>
    </div>
  );
};

export default AdminMap;
