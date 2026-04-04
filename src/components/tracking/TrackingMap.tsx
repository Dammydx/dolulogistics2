import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { getAreaCoordinates } from '../../utils/areaCoordinates';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG drop pin marker
const createIcon = (color: string, pulse: boolean = false, label?: string, isLarge: boolean = false) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  const pulseHtml = pulse
    ? `<div class="absolute ${isLarge ? 'tracking-pin-pulse-large' : 'tracking-pin-pulse'}" style="--pulse-color: ${rgb}; width: 14px; height: 14px; border-radius: 50%; background: ${color}; bottom: -4px; left: 9px; opacity: 0.6; z-index: -1;"></div>`
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

// Pulse dot icon helper for the route
const createDotIcon = (baseColor: string, pulseColor: string, delay: number, duration: number) => {
  const hex = pulseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center pointer-events-none" style="width: 14px; height: 14px;">
        <div class="w-2.5 h-2.5 rounded-full z-10" style="background-color: ${baseColor};"></div>
        <div class="absolute inset-0 rounded-full" style="
          --pulse-color: ${rgb};
          background-color: ${pulseColor};
          animation: routePulse ${duration}s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: ${delay}s;
          opacity: 0;
        "></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// Map controller for auto-zoom and bounds
const MapController = ({
  bounds,
  activeMarkerPos
}: {
  bounds: L.LatLngBoundsExpression,
  activeMarkerPos: L.LatLng | null
}) => {
  const map = useMap();
  useEffect(() => {
    if (activeMarkerPos) {
      // Zoom into the marker to see the address clearly on mobile
      map.setView(activeMarkerPos, 16, { animate: true });
    } else {
      // Fit both markers when no popup is open
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true });
    }
  }, [map, bounds, activeMarkerPos]);
  return null;
};

// Interpolation helper for points along a line
const getInterpolatedPoints = (start: [number, number], end: [number, number], count: number) => {
  const points: [number, number][] = [];
  for (let i = 1; i < count; i++) {
    const lat = start[0] + (end[0] - start[0]) * (i / count);
    const lng = start[1] + (end[1] - start[1]) * (i / count);
    points.push([lat, lng]);
  }
  return points;
};

interface TrackingMapProps {
  pickupAreaName: string;
  dropoffAreaName: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
}

const TrackingMap = ({ pickupAreaName, dropoffAreaName, status, pickupAddress, dropoffAddress }: TrackingMapProps) => {
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [activeMarkerPos, setActiveMarkerPos] = useState<L.LatLng | null>(null);

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
      showRoute: false,
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

  // Generate intermediate points for dots (Clean minimal logic for mobile & desktop)
  const dist = Math.sqrt(
    Math.pow(pickupLatLng[0] - dropoffLatLng[0], 2) +
    Math.pow(pickupLatLng[1] - dropoffLatLng[1], 2)
  );
  const dotCount = Math.max(3, Math.min(10, Math.floor(dist * 60)));
  const routePoints = config.showRoute ? getInterpolatedPoints(pickupLatLng, dropoffLatLng, dotCount) : [];

  // Travelling pulse timing: dots staggered by 0.25s + 1s pause at the end
  const totalDuration = (routePoints.length * 0.25) + 1.0;

  return (
    <div className="mb-8 space-y-4">
      <style>{`
        .leaflet-grab { cursor: grab; }
        .leaflet-dragging .leaflet-grab { cursor: grabbing; }
        .custom-address-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          overflow: hidden;
        }
        .custom-address-popup .leaflet-popup-content {
          margin: 0;
          width: 250px !important;
        }

        @keyframes routePulse {
          0% { transform: scale(0.6); opacity: 0; box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0); }
          20% { transform: scale(1.4); opacity: 1; box-shadow: 0 0 14px 4px rgba(var(--pulse-color), 0.6); }
          45% { transform: scale(2.2); opacity: 0; box-shadow: 0 0 20px 8px rgba(var(--pulse-color), 0); }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

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
        className="relative overflow-hidden bg-white shadow-sm border border-gray-200 transition-all duration-500 flex flex-col w-full h-[400px] md:h-[550px] rounded-[1.5rem] md:rounded-[2rem]"
      >
        {/* Map Container */}
        <div className="relative flex-1 min-h-[350px] md:min-h-[450px]">
          <MapContainer
            center={pickupLatLng}
            zoom={13}
            style={{
              height: '100%',
              width: '100%',
              zIndex: 1
            }}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
          >
            <MapController bounds={bounds} activeMarkerPos={activeMarkerPos} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* Floating Top-Right Mini Card */}
            <div className={`absolute top-3 right-3 z-[1001] transition-all duration-300 origin-top-right ${isCardExpanded ? 'w-[160px] md:w-[240px]' : 'w-9 h-9'
              }`}>
              <div className={`bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40 rounded-2xl overflow-hidden ring-1 ring-black/5 transition-all ${isCardExpanded ? 'p-3 md:p-5' : 'p-0 h-9 w-9 flex items-center justify-center'
                }`}>
                {isCardExpanded ? (
                  <>
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-1">
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[9px] md:text-[11px] font-black text-gray-500 uppercase tracking-widest">Route Details</span>
                      </div>
                      <button
                        onClick={() => setIsCardExpanded(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors group"
                      >
                        <svg className="w-2.5 h-2.5 text-gray-500 group-hover:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>

                    <div className="relative pl-2 md:pl-3 border-l border-dashed border-gray-400/30 space-y-3 md:space-y-4">
                      <div className="absolute -left-[3.5px] top-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <div className="absolute -left-[3.5px] bottom-0 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>

                      <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-black mb-0.5 tracking-tighter">Origin</div>
                        <div className="text-[12px] md:text-sm font-black text-gray-900 leading-tight truncate tracking-tighter">{pickupAreaName}</div>
                      </div>
                      <div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-black mb-0.5 tracking-tighter">Dest.</div>
                        <div className="text-[12px] md:text-sm font-black text-gray-900 leading-tight truncate tracking-tighter">{dropoffAreaName}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setIsCardExpanded(true)}
                    className="w-full h-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors"
                    title="Show details"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 15l7-7 7 7" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Damp Guiding Line (Dashed) */}
            {status !== 'pending' && status !== 'confirmed' && status !== 'cancelled' && (
              <Polyline
                positions={[pickupLatLng, dropoffLatLng]}
                pathOptions={{
                  color: config.routeColor,
                  weight: 2.5,
                  opacity: 0.25,
                  dashArray: '5, 12'
                }}
              />
            )}

            {/* Flowing Animated Dots with Travelling Energy Pulse */}
            {routePoints.map((point, index) => (
              <Marker
                key={`dot-${index}`}
                position={point}
                icon={createDotIcon(config.routeColor, '#FDE047', index * 0.25, totalDuration)}
              />
            ))}

            {/* Pickup Marker */}
            <Marker
              position={pickupLatLng}
              icon={createIcon(config.pickupColor, config.pickupPulse, pickupAreaName, status === 'pending' || status === 'confirmed')}
              eventHandlers={{
                popupopen: (e) => setActiveMarkerPos(e.target.getLatLng()),
                popupclose: () => setActiveMarkerPos(null),
              }}
            >
              <Popup className="custom-address-popup shadow-2xl">
                <div className="p-4 bg-white">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Pickup Address</div>
                  <div className="text-sm font-black text-gray-900 leading-snug">{pickupAddress}</div>
                </div>
              </Popup>
            </Marker>

            {/* Dropoff Marker */}
            <Marker
              position={dropoffLatLng}
              icon={createIcon(config.dropoffColor, config.dropoffPulse, dropoffAreaName, status === 'delivered')}
              eventHandlers={{
                popupopen: (e) => setActiveMarkerPos(e.target.getLatLng()),
                popupclose: () => setActiveMarkerPos(null),
              }}
            >
              <Popup className="custom-address-popup shadow-2xl">
                <div className="p-4 bg-white">
                  <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-60">Drop-off Address</div>
                  <div className="text-sm font-black text-gray-900 leading-snug">{dropoffAddress}</div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Delivered Overlay (Center Bottom) - Premium Thanks */}
          {status === 'delivered' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] animate-in slide-in-from-bottom-8 fade-in-0 duration-1000">
              <div className="bg-white/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40 rounded-2xl flex items-center gap-3 px-6 py-3 ring-1 ring-black/5 min-w-[280px] justify-center">
                <div className="bg-green-500/20 rounded-full w-8 h-8 flex items-center justify-center shrink-0 border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-extrabold text-xs uppercase tracking-tighter leading-none mb-1">Delivered Successfully</h4>
                  <p className="text-[10px] font-bold text-gray-500 tracking-tight leading-none">Thank you for using Dolu Logistics</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Footer - Square Edge Style */}
        <div className="bg-white border-t border-gray-100 p-4 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <span className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-widest">Status:</span>
            <div className={`px-3 py-1 rounded-full text-[10px] md:text-sm font-black uppercase tracking-tighter border shadow-sm ${status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
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
