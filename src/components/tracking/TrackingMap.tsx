import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Maximize2, Minimize2, MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { getAreaCoordinates } from '../../utils/areaCoordinates';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map resize handler for fullscreen
const MapResizeHandler = ({ isFullscreen }: { isFullscreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    // Invalidate multiple times during transition and after
    const intervals = [100, 300, 600, 1000];
    intervals.forEach(ms => {
      setTimeout(() => map.invalidateSize(), ms);
    });
  }, [isFullscreen, map]);
  return null;
};

// Custom SVG drop pin marker
const createIcon = (color: string, pulse: boolean = false, label?: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  const pulseHtml = pulse 
    ? `<div class="absolute tracking-pin-pulse" style="--pulse-color: ${rgb}; width: 14px; height: 14px; border-radius: 50%; background: ${color}; bottom: -4px; left: 9px; opacity: 0.6; z-index: -1;"></div>`
    : '';

  const labelHtml = label 
    ? `<div class="absolute top-[100%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 shadow-sm text-[9px] font-black text-gray-700 mt-1 pointer-events-none uppercase tracking-tighter">${label}</div>`
    : '';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex flex-col items-center justify-center pointer-events-none" style="width: 32px; height: 40px;">
        <svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" class="w-9 h-9 drop-shadow-md z-10 transition-transform hover:scale-110">
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

// Auto-fit map bounds
const FitBounds = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [map, bounds]);
  return null;
};

interface TrackingMapProps {
  pickupAreaName: string;
  dropoffAreaName: string;
  status: string;
}

const TrackingMap = ({ pickupAreaName, dropoffAreaName, status }: TrackingMapProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const pickupCoord = getAreaCoordinates(pickupAreaName);
  const dropoffCoord = getAreaCoordinates(dropoffAreaName);

  if (!pickupCoord || !dropoffCoord) return null;

  const pickupLatLng: [number, number] = [pickupCoord.lat, pickupCoord.lng];
  const dropoffLatLng: [number, number] = [dropoffCoord.lat, dropoffCoord.lng];
  const bounds: L.LatLngBoundsExpression = [pickupLatLng, dropoffLatLng];

  const statusConfig: Record<string, {
    pickupColor: string;
    dropoffColor: string;
    pickupPulse: boolean;
    dropoffPulse: boolean;
    showRoute: boolean;
    routeColor: string;
    label: string;
    themeColor: string;
    bgColor: string;
  }> = {
    pending: {
      pickupColor: '#F59E0B',
      dropoffColor: '#9CA3AF',
      pickupPulse: true,
      dropoffPulse: false,
      showRoute: false,
      routeColor: '#F59E0B',
      label: 'Awaiting Payment',
      themeColor: '#F59E0B',
      bgColor: 'bg-amber-50',
    },
    confirmed: {
      pickupColor: '#3B82F6',
      dropoffColor: '#9CA3AF',
      pickupPulse: true,
      dropoffPulse: false,
      showRoute: false,
      routeColor: '#3B82F6',
      label: 'Confirmed',
      themeColor: '#3B82F6',
      bgColor: 'bg-blue-50',
    },
    in_progress: {
      pickupColor: '#3B82F6',
      dropoffColor: '#10B981',
      pickupPulse: false,
      dropoffPulse: false,
      showRoute: true,
      routeColor: '#E8792F',
      label: 'In Progress',
      themeColor: '#E8792F',
      bgColor: 'bg-orange-50',
    },
    delivered: {
      pickupColor: '#9CA3AF',
      dropoffColor: '#10B981',
      pickupPulse: false,
      dropoffPulse: true,
      showRoute: true,
      routeColor: '#10B981',
      label: 'Delivered',
      themeColor: '#10B981',
      bgColor: 'bg-green-50',
    },
    cancelled: {
      pickupColor: '#9CA3AF',
      dropoffColor: '#9CA3AF',
      pickupPulse: false,
      dropoffPulse: false,
      showRoute: false,
      routeColor: '#9CA3AF',
      label: 'Cancelled',
      themeColor: '#9CA3AF',
      bgColor: 'bg-gray-50',
    },
    not_accepted: {
      pickupColor: '#9CA3AF',
      dropoffColor: '#9CA3AF',
      pickupPulse: false,
      dropoffPulse: false,
      showRoute: false,
      routeColor: '#9CA3AF',
      label: 'Not Accepted',
      themeColor: '#9CA3AF',
      bgColor: 'bg-red-50',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const fullRouteDashed: [number, number][] = config.showRoute ? [pickupLatLng, dropoffLatLng] : [];

  return (
    <div className="mb-8 space-y-4">
      {/* Map Section Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
          Delivery Route
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
          </span>
        </h3>
      </div>

      {/* Main Square Edge Card */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-white shadow-sm border border-gray-200 transition-all duration-500 flex flex-col ${
          isFullscreen 
            ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none' 
            : 'w-full h-[400px] md:h-[550px] rounded-[1.5rem] md:rounded-[2rem]'
        }`}
      >
        {/* Map Container */}
        <div className="relative flex-1 min-h-[350px] md:min-h-[450px]">
          <MapContainer
            center={bounds[0]}
            zoom={13}
            style={{ 
              height: '100%', 
              width: '100%',
              zIndex: 1
            }}
            zoomControl={false}
            attributionControl={false}
          >
            <MapResizeHandler isFullscreen={isFullscreen} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds bounds={bounds} />

            {/* Floating Top-Right Mini Card */}
            {!isFullscreen && (
              <div className={`absolute top-3 right-3 z-[1001] transition-all duration-300 origin-top-right ${
                isCardExpanded ? 'w-[140px] md:w-[220px]' : 'w-9 h-9'
              }`}>
                <div className={`bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl overflow-hidden ring-1 ring-black/5 transition-all ${
                  isCardExpanded ? 'p-3 md:p-5' : 'p-0 h-9 w-9 flex items-center justify-center'
                }`}>
                  {isCardExpanded ? (
                    <>
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center gap-1">
                          <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-[6px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] md:tracking-[0.2em]">Route Details</span>
                        </div>
                        <button 
                          onClick={() => setIsCardExpanded(false)}
                          className="p-0.5 md:p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      
                      <div className="relative pl-2 md:pl-3 border-l border-dashed border-gray-100 space-y-3 md:space-y-4">
                        <div className="absolute -left-[3.5px] top-0 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <div className="absolute -left-[3.5px] bottom-0 w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        
                        <div>
                          <div className="text-[6px] text-gray-400 uppercase font-black mb-0.5">Origin</div>
                          <div className="text-[8px] md:text-[11px] font-black text-gray-900 leading-tight truncate">{pickupAreaName}</div>
                        </div>
                        <div>
                          <div className="text-[6px] text-gray-400 uppercase font-black mb-0.5">Dest.</div>
                          <div className="text-[8px] md:text-[11px] font-black text-gray-900 leading-tight truncate">{dropoffAreaName}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsCardExpanded(true)}
                      className="w-full h-full flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                      title="Show details"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Flowing route */}
            {fullRouteDashed.length > 0 && (
              <Polyline
                positions={fullRouteDashed}
                pathOptions={{
                  color: config.routeColor,
                  weight: status === 'in_progress' ? 5 : 2.5,
                  opacity: status === 'in_progress' ? 0.95 : 0.6,
                  dashArray: status === 'in_progress' ? '12' : 'none',
                  className: status === 'in_progress' ? 'flowing-route' : '',
                }}
              />
            )}

            {/* Pickup Marker */}
            <Marker
              position={pickupLatLng}
              icon={createIcon(config.pickupColor, true, pickupAreaName)}
            />

            {/* Dropoff Marker */}
            <Marker
              position={dropoffLatLng}
              icon={createIcon(config.dropoffColor, true, dropoffAreaName)}
            />
          </MapContainer>

          {/* Fullscreen toggle button on top of map */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-[1001] p-2.5 rounded-xl bg-white/80 backdrop-blur shadow-lg border border-white/50 hover:bg-white transition-all text-gray-500 active:scale-90"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Delivered Overlay (Top Left) - Non-obtrusive */}
          {status === 'delivered' && (
            <div className="absolute top-4 left-4 z-[1000] animate-in slide-in-from-left-4 duration-700">
              <div className="bg-white/90 backdrop-blur-md shadow-lg border border-green-100 flex items-center gap-2 p-2.5 rounded-2xl ring-1 ring-black/5">
                <div className="bg-green-500 rounded-full w-7 h-7 flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div className="pr-1">
                  <h4 className="text-green-900 font-black text-[10px] uppercase tracking-tight leading-none">Delivered</h4>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Footer - Square Edge Style */}
        <div className="bg-white border-t border-gray-100 p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <span className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest">Status:</span>
            <div className={`px-3 py-1 rounded-full text-[10px] md:text-sm font-black uppercase tracking-tighter border shadow-sm ${
              status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
              status === 'cancelled' || status === 'not_accepted' ? 'bg-red-50 text-red-500 border-red-100' :
              'bg-orange-50 text-orange-600 border-orange-100'
            }`}>
              {config.label}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-2 sm:gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg">
                <Navigation className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] md:text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Pickup</div>
                <div className="text-[10px] md:text-sm font-black text-gray-900 leading-none truncate">{pickupAreaName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-50 rounded-lg">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
              </div>
              <div className="min-w-0">
                <div className="text-[8px] md:text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Drop-off</div>
                <div className="text-[10px] md:text-sm font-black text-gray-900 leading-none truncate">{dropoffAreaName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
