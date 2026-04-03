/**
 * AREA GPS COORDINATES FOR PORT HARCOURT, RIVERS STATE
 *
 * Maps area names to their real-world GPS coordinates [latitude, longitude].
 * Used by the tracking map and admin map components.
 *
 * These coordinates are hardcoded for zero-bandwidth map loading.
 * Only needs updating when a brand new area is added to the database.
 */

export interface AreaCoordinate {
  lat: number;
  lng: number;
  zone?: string;
}

// Port Harcourt center coordinates
export const PORT_HARCOURT_CENTER: [number, number] = [4.8156, 7.0498];
export const DEFAULT_ZOOM = 13;

/**
 * Area name → GPS coordinates lookup
 * Keys are lowercase for case-insensitive matching
 */
const areaCoordinatesMap: Record<string, AreaCoordinate> = {
  // ======== ZONE A — ₦2,500 ========
  'nta':          { lat: 4.8472, lng: 6.9814, zone: 'A' },
  'ada george':   { lat: 4.8396, lng: 6.9762, zone: 'A' },
  'ozuoba':       { lat: 4.8650, lng: 6.9156, zone: 'A' },
  'mgbuogba':     { lat: 4.8520, lng: 6.9680, zone: 'A' },
  'rumuokwuta':   { lat: 4.8480, lng: 6.9710, zone: 'A' },
  'rumuigbo':     { lat: 4.8550, lng: 6.9760, zone: 'A' },
  'mile 4':       { lat: 4.8410, lng: 6.9830, zone: 'A' },
  'agip':         { lat: 4.8350, lng: 6.9750, zone: 'A' },
  'mile 3':       { lat: 4.8320, lng: 6.9880, zone: 'A' },
  'ust':          { lat: 4.8630, lng: 6.9200, zone: 'A' },
  'iwofe':        { lat: 4.8250, lng: 6.9550, zone: 'A' },
  'ogbogoro':     { lat: 4.8700, lng: 6.9060, zone: 'A' },
  'new road':     { lat: 4.8540, lng: 6.9720, zone: 'A' },
  'egbelu':       { lat: 4.8580, lng: 6.9650, zone: 'A' },
  'rumuokoro':    { lat: 4.8668, lng: 6.9819, zone: 'A' },
  'obirikwere':   { lat: 4.8440, lng: 6.9600, zone: 'A' },

  // ======== ZONE B — ₦3,000 ========
  'rumuola':      { lat: 4.8200, lng: 7.0100, zone: 'B' },
  'mile 2':       { lat: 4.8230, lng: 6.9960, zone: 'B' },
  'mile 1':       { lat: 4.8100, lng: 7.0050, zone: 'B' },
  'gra':          { lat: 4.7987, lng: 7.0105, zone: 'B' },
  'olu obasanjo': { lat: 4.8050, lng: 7.0150, zone: 'B' },
  'sani abacha':  { lat: 4.8080, lng: 7.0200, zone: 'B' },
  'waterlines':   { lat: 4.8020, lng: 7.0250, zone: 'B' },
  'air force':    { lat: 4.8160, lng: 7.0020, zone: 'B' },
  'artillery':    { lat: 4.7950, lng: 7.0150, zone: 'B' },
  'garrison':     { lat: 4.7980, lng: 7.0080, zone: 'B' },
  'orazi':        { lat: 4.8350, lng: 7.0000, zone: 'B' },
  'nkpogu':       { lat: 4.8180, lng: 7.0180, zone: 'B' },
  'stadium road': { lat: 4.8000, lng: 7.0220, zone: 'B' },
  'elekahia':     { lat: 4.8100, lng: 7.0300, zone: 'B' },
  'rumukalagbor': { lat: 4.8250, lng: 7.0080, zone: 'B' },
  'ust backgate': { lat: 4.8600, lng: 6.9250, zone: 'B' },
  'dline':        { lat: 4.7850, lng: 7.0200, zone: 'B' },
  'rumuomasi':    { lat: 4.8150, lng: 7.0120, zone: 'B' },
  'rumudara':     { lat: 4.8300, lng: 7.0250, zone: 'B' },
  'rumuibekwe':   { lat: 4.8280, lng: 7.0150, zone: 'B' },
  'eliozu':       { lat: 4.8556, lng: 7.0200, zone: 'B' },
  'sars road':    { lat: 4.8500, lng: 7.0150, zone: 'B' },
  'rumuodumaya':  { lat: 4.8400, lng: 7.0100, zone: 'B' },
  'rumuagholu':   { lat: 4.8450, lng: 7.0050, zone: 'B' },
  'rukpakulusi':  { lat: 4.8550, lng: 7.0100, zone: 'B' },
  'alakahia':     { lat: 4.8700, lng: 6.9200, zone: 'B' },
  'rumuekini':    { lat: 4.8620, lng: 6.9350, zone: 'B' },

  // ======== ZONE C — ₦3,500 ========
  'eagle island':   { lat: 4.7850, lng: 6.9950, zone: 'C' },
  'choba':          { lat: 4.8750, lng: 6.9100, zone: 'C' },
  'aluu':           { lat: 4.8900, lng: 6.9200, zone: 'C' },
  'peter odili':    { lat: 4.8200, lng: 7.0400, zone: 'C' },
  'old gra':        { lat: 4.7900, lng: 7.0250, zone: 'C' },
  'woji':           { lat: 4.8150, lng: 7.0500, zone: 'C' },
  'eastern by pass':{ lat: 4.8300, lng: 7.0450, zone: 'C' },
  'ogbunabali':     { lat: 4.7880, lng: 7.0350, zone: 'C' },
  'trans amadi':    { lat: 4.8050, lng: 7.0450, zone: 'C' },
  'abuloma':        { lat: 4.7750, lng: 7.0400, zone: 'C' },
  'marine base':    { lat: 4.7700, lng: 7.0350, zone: 'C' },
  'creek road':     { lat: 4.7780, lng: 7.0300, zone: 'C' },
  'town':           { lat: 4.7770, lng: 7.0230, zone: 'C' },
  'rumukrushni':    { lat: 4.8350, lng: 7.0350, zone: 'C' },

  // ======== ZONE D — ₦4,000 ========
  'borikiri':     { lat: 4.7650, lng: 7.0250, zone: 'D' },
  'elelenwo':     { lat: 4.8350, lng: 7.0550, zone: 'D' },
  'eneka':        { lat: 4.8700, lng: 7.0500, zone: 'D' },

  // ======== ZONE E — ₦5,000 ========
  'eleme junction': { lat: 4.8050, lng: 7.1100, zone: 'E' },
  'igwuruta':       { lat: 4.9100, lng: 7.0400, zone: 'E' },
  'airport':        { lat: 4.9200, lng: 6.9500, zone: 'E' },

  // ======== ZONE F — ₦6,000 ========
  'atali':          { lat: 4.8900, lng: 7.0600, zone: 'F' }, // Moved from E
  'akpajo':         { lat: 4.8100, lng: 7.1200, zone: 'F' }, // Moved from E
  'oyigbo':         { lat: 4.8800, lng: 7.1500, zone: 'F' }, // Moved from E
  'igbo-etche':     { lat: 4.9000, lng: 7.0800, zone: 'F' }, // Moved from E
};

/**
 * Get GPS coordinates for an area name (case-insensitive)
 */
export function getAreaCoordinates(areaName: string): AreaCoordinate | null {
  const key = areaName.toLowerCase().trim();
  return areaCoordinatesMap[key] || null;
}

/**
 * Get all areas with coordinates (for admin map)
 */
export function getAllAreaCoordinates(): { name: string; coord: AreaCoordinate }[] {
  return Object.entries(areaCoordinatesMap).map(([name, coord]) => ({
    name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    coord,
  }));
}

/**
 * Zone color mapping for map markers
 */
export const ZONE_COLORS: Record<string, string> = {
  'A': '#3B82F6', // blue
  'B': '#8B5CF6', // purple
  'C': '#F59E0B', // amber
  'D': '#EF4444', // red
  'E': '#10B981', // green
  'F': '#EC4899', // pink
};

export const ZONE_PRICES: Record<string, number> = {
  'A': 2500,
  'B': 3000,
  'C': 3500,
  'D': 4000,
  'E': 5000,
  'F': 6000,
};
