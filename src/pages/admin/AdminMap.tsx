import { useState, useEffect, useMemo } from 'react';
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

// Custom SVG SLEEK markers for zones
const createIcon = (color: string, variant: 'pin' | 'dot' = 'dot', pulse: boolean = false, label?: string) => {
  const rgb = hexToRgb(color);

  const pulseHtml = pulse 
    ? `<div class="absolute tracking-pin-pulse" style="--pulse-color: ${rgb}; width: 14px; height: 14px; border-radius: 50%; background: ${color}; bottom: -4px; left: 9px; opacity: 0.6; z-index: -1;"></div>`
    : '';

  const labelHtml = label 
    ? `<div class="absolute top-[100%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 shadow-sm text-[9px] font-bold text-gray-700 mt-1 pointer-events-none uppercase tracking-tighter">${label}</div>`
    : '';

  // Minimal dot variant for zones
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

  // Large pin variant for selection
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex flex-col items-center justify-center pointer-events-none" style="width: 32px; height: 40px;">
        <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" class="w-8 h-8 md:w-9 md:h-9 drop-shadow-md z-10 transition-transform hover:scale-110">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round"></path>
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

// Route dot icon helper
const createRouteDotIcon = (color: string, delay: number) => {
  const rgb = hexToRgb(color);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center pointer-events-none" style="width: 14px; height: 14px;">
        <div class="w-2 h-2 rounded-full z-10" style="background-color: ${color};"></div>
        <div class="absolute inset-0 rounded-full tracking-pin-pulse" style="--pulse-color: ${rgb}; background-color: ${color}; animation-delay: ${delay}s;"></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// Interpolation helper
const getInterpolatedPoints = (start: [number, number], end: [number, number], count: number) => {
  const points: [number, number][] = [];
  for (let i = 1; i < count; i++) {
    const lat = start[0] + (end[0] - start[0]) * (i / count);
    const lng = start[1] + (end[1] - start[1]) * (i / count);
    points.push([lat, lng]);
  }
  return points;
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
  }, [selectedPickup, selectedDropoff, allAreas]);

  const handleMarkerClick = (name: string) => {
    if (!selectedPickup) {
      setSelectedPickup(name);
    } else if (!selectedDropoff && name !== selectedPickup) {
      setSelectedDropoff(name);
    } else {
      setSelectedPickup(name);
      setSelectedDropoff(null);
    }
  };

  const clearSelection = () => {
    setSelectedPickup(null);
    setSelectedDropoff(null);
    setQuotePrice(null);
  };

  // Route calculation
  const routeData = useMemo(() => {
    if (!selectedPickup || !selectedDropoff) return null;
    const p = allAreas.find(a => a.name === selectedPickup);
    const d = allAreas.find(a => a.name === selectedDropoff);
    if (!p || !d) return null;

    const pCoords: [number, number] = [p.coord.lat, p.coord.lng];
    const dCoords: [number, number] = [d.coord.lat, d.coord.lng];
    
    // Dynamic density (Synchronized scaling)
    const dist = Math.sqrt(Math.pow(pCoords[0] - dCoords[0], 2) + Math.pow(pCoords[1] - dCoords[1], 2));
    const dotCount = Math.max(4, Math.min(25, Math.floor(dist * 100)));
    
    return {
      coords: [pCoords, dCoords] as [number, number][],
      dots: getInterpolatedPoints(pCoords, dCoords, dotCount)
    };
  }, [selectedPickup, selectedDropoff, allAreas]);

  // Group areas by zone for legend
  const zones = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-6">
      <style>{`.leaflet-grab { cursor: grab; } .leaflet-dragging .leaflet-grab { cursor: grabbing; }`}</style>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
          <MapIcon className="h-7 w-7 text-blue-600" />
          ZONE MAP
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-bold uppercase tracking-widest opacity-60">
          SELECT ZONES TO CALCULATE DELIVERY QUOTES
        </p>
      </div>

      {/* Map Control / Quote Card Combined */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Display */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing Panel</span>
            </div>
            
            <div className="space-y-6">
              {/* Pickup Selection */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedPickup ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">Pickup Point</div>
                {selectedPickup ? (
                  <div className="text-sm font-black text-blue-700 uppercase">{selectedPickup}</div>
                ) : (
                  <div className="text-sm font-bold text-gray-400 italic">Select on map...</div>
                )}
              </div>

              {/* Destination Selection */}
              <div className={`p-4 rounded-2xl border transition-all ${selectedDropoff ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-2">Destination</div>
                {selectedDropoff ? (
                  <div className="text-sm font-black text-green-700 uppercase">{selectedDropoff}</div>
                ) : (
                  <div className="text-sm font-bold text-gray-400 italic">Select on map...</div>
                )}
              </div>
            </div>
          </div>

          {selectedPickup && selectedDropoff ? (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between items-end mb-4">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Delivery Fee</div>
                  <div className="text-3xl font-black text-primary-600 tracking-tighter">
                    ₦{quotePrice?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-primary-100">
                  Standard Rate
                </div>
              </div>
              <button 
                onClick={clearSelection}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <p className="text-amber-800 text-xs font-bold leading-relaxed">
                 Select both a pickup and a destination on the map to see the calculated delivery cost for that route.
               </p>
            </div>
          )}
        </div>

        {/* Map Display */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden relative min-h-[500px]">
          <MapContainer
            center={PORT_HARCOURT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '550px', width: '100%', zIndex: 1 }}
            zoomControl={true}
            attributionControl={false}
            dragging={true}
            scrollWheelZoom={true}
            touchZoom={true}
            doubleClickZoom={true}
            boxZoom={true}
            keyboard={true}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <ResetView center={PORT_HARCOURT_CENTER} zoom={DEFAULT_ZOOM} />

            {/* Damp Guiding Line */}
            {routeData && (
              <Polyline
                positions={routeData.coords}
                pathOptions={{
                  color: '#E8792F',
                  weight: 2.5,
                  opacity: 0.25,
                  dashArray: '5, 12'
                }}
              />
            )}

            {/* Dynamic Route Dots */}
            {routeData && routeData.dots.map((point, index) => (
              <Marker
                key={`dot-${index}`}
                position={point}
                icon={createRouteDotIcon('#E8792F', index * 0.25)}
              />
            ))}

            {/* Zone Markers */}
            {useMemo(() => {
              const iconCache: Record<string, L.DivIcon> = {};
              allAreas.forEach(({ name, coord }) => {
                const zoneColor = coord.zone ? ZONE_COLORS[coord.zone] : '#6B7280';
                iconCache[name] = createIcon(zoneColor, 'dot', false, name);
              });

              return allAreas.map(({ name, coord }) => {
                const isPickup = selectedPickup === name;
                const isDropoff = selectedDropoff === name;
                
                let icon;
                if (isPickup) icon = createIcon('#3B82F6', 'pin', true, name);
                else if (isDropoff) icon = createIcon('#10B981', 'pin', true, name);
                else icon = iconCache[name];

                return (
                  <Marker
                    key={name}
                    position={[coord.lat, coord.lng]}
                    icon={icon}
                    eventHandlers={{ click: () => handleMarkerClick(name) }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} className="custom-tooltip">
                      <div className="text-center p-1">
                        <div className="font-black text-gray-900 text-sm uppercase tracking-tighter">{name}</div>
                        {coord.zone && (
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Zone {coord.zone} — ₦{ZONE_PRICES[coord.zone].toLocaleString()}
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
      </div>

      {/* Zone Legend */}
      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6">
        <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-sm opacity-60">PRICE ZONES</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {zones.map(zone => (
            <div
              key={zone}
              className="group p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all transition-all duration-300"
              style={{ borderLeftColor: ZONE_COLORS[zone], borderLeftWidth: 4 }}
            >
              <div className="font-black text-gray-900 text-sm mb-1 uppercase tracking-tighter">Zone {zone}</div>
              <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest">₦{ZONE_PRICES[zone].toLocaleString()}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest opacity-50">
          * SYSTEM CALCULATES RATE BASED ON THE HIGHEST ZONE IN THE ROUTE.
        </p>
      </div>
    </div>
  );
};

export default AdminMap;
