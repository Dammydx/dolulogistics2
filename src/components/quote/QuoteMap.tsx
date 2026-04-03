import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';
import { getAreaCoordinates, PORT_HARCOURT_CENTER } from '../../utils/areaCoordinates';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG drop pin marker with label & pulse
const createIcon = (color: string, label: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  const pulseHtml = `<div class="absolute tracking-pin-pulse" style="--pulse-color: ${rgb}; width: 14px; height: 14px; border-radius: 50%; background: ${color}; bottom: -4px; left: 9px; opacity: 0.6; z-index: -1;"></div>`;
  
  const labelHtml = `<div class="absolute top-[100%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-100 shadow-sm text-[9px] font-black text-gray-700 mt-1 pointer-events-none uppercase tracking-tighter">${label}</div>`;

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
const createDotIcon = (color: string, delay: number) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

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

// Map helper to fit bounds and handle resize
const MapHandler = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    const t = setTimeout(() => map.invalidateSize(), 400);
    return () => clearTimeout(t);
  }, [map, bounds]);
  return null;
};

interface QuoteMapProps {
  pickupAreaName: string;
  dropoffAreaName: string;
}

const QuoteMap = ({ pickupAreaName, dropoffAreaName }: QuoteMapProps) => {
  const pickupCoord = getAreaCoordinates(pickupAreaName);
  const dropoffCoord = getAreaCoordinates(dropoffAreaName);

  if (!pickupCoord || !dropoffCoord) return null;

  const pickupLatLng: [number, number] = [pickupCoord.lat, pickupCoord.lng];
  const dropoffLatLng: [number, number] = [dropoffCoord.lat, dropoffCoord.lng];
  const bounds: L.LatLngBoundsExpression = [pickupLatLng, dropoffLatLng];

  // Dynamic dot generation based on city-scale distance
  const dist = Math.sqrt(
    Math.pow(pickupLatLng[0] - dropoffLatLng[0], 2) + 
    Math.pow(pickupLatLng[1] - dropoffLatLng[1], 2)
  );
  const dotCount = Math.max(4, Math.min(25, Math.floor(dist * 100)));
  const routePoints = getInterpolatedPoints(pickupLatLng, dropoffLatLng, dotCount);

  return (
    <div className="relative w-full aspect-square md:aspect-square bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm animate-in fade-in zoom-in duration-500 group">
      <style>{`
        .leaflet-grab { cursor: grab; }
        .leaflet-dragging .leaflet-grab { cursor: grabbing; }
      `}</style>
      
      {/* Map */}
      <MapContainer
        center={PORT_HARCOURT_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <MapHandler bounds={bounds} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        {/* Damp Guiding Line (Dashed) */}
        <Polyline
          positions={[pickupLatLng, dropoffLatLng]}
          pathOptions={{
            color: '#E8792F',
            weight: 2.5,
            opacity: 0.25,
            dashArray: '5, 12'
          }}
        />

        {/* Dynamic Pulsing Route Dots */}
        {routePoints.map((point, index) => (
          <Marker
            key={`dot-${index}`}
            position={point}
            icon={createDotIcon('#E8792F', index * 0.25)}
          />
        ))}

        {/* Pickup Pin */}
        <Marker position={pickupLatLng} icon={createIcon('#3B82F6', pickupAreaName)} />
        
        {/* Dropoff Pin */}
        <Marker position={dropoffLatLng} icon={createIcon('#10B981', dropoffAreaName)} />
      </MapContainer>

      {/* Subtle Bottom Indicators (Mobile Friendly) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001] bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-gray-100 shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-1.5 min-w-0 max-w-[100px] md:max-w-none">
          <Navigation className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="text-[10px] font-black text-gray-800 truncate">{pickupAreaName}</span>
        </div>
        <div className="w-px h-3 bg-gray-200"></div>
        <div className="flex items-center gap-1.5 min-w-0 max-w-[100px] md:max-w-none">
          <MapPin className="w-3 h-3 text-green-500 shrink-0" />
          <span className="text-[10px] font-black text-gray-800 truncate">{dropoffAreaName}</span>
        </div>
      </div>
    </div>
  );
};

export default QuoteMap;
