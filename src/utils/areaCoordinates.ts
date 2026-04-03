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
  'nta':             { lat: 4.86447, lng: 6.96419, zone: 'A' },
  'ada george':      { lat: 4.82958, lng: 6.97649, zone: 'A' },
  'ozuoba':          { lat: 4.86558, lng: 6.93465, zone: 'A' },
  'mgbuogba':        { lat: 4.84252, lng: 6.97539, zone: 'A' },
  'rumuokwuta':      { lat: 4.84061, lng: 6.99206, zone: 'A' },
  'rumuigbo':        { lat: 4.85195, lng: 6.98596, zone: 'A' },
  'mile 4':          { lat: 4.82902, lng: 6.98506, zone: 'A' },
  'agip':            { lat: 4.81199, lng: 6.98136, zone: 'A' },
  'mile 3':          { lat: 4.80424, lng: 6.99240, zone: 'A' },
  'ust':             { lat: 4.79511, lng: 6.97962, zone: 'A' },
  'iwofe':           { lat: 4.80236, lng: 6.92080, zone: 'A' },
  'ogbogoro':        { lat: 4.84512, lng: 6.92896, zone: 'A' },
  'new road':        { lat: 4.82900, lng: 6.93100, zone: 'A' },
  'egbelu':          { lat: 4.87853, lng: 6.97496, zone: 'A' },
  'rumuokoro':       { lat: 4.86542, lng: 6.98189, zone: 'A' },
  'obirikwere':      { lat: 4.87573, lng: 6.95358, zone: 'A' },

  // ======== ZONE B — ₦3,000 ========
  'rumuola':         { lat: 4.8327, lng: 7.0055, zone: 'B' },
  'mile 2':          { lat: 4.7891, lng: 7.0028, zone: 'B' },
  'mile 1':          { lat: 4.7924, lng: 6.9978, zone: 'B' },
  'gra':             { lat: 4.8261, lng: 7.0007, zone: 'B' },
  'olu obasanjo':    { lat: 4.8157, lng: 7.0083, zone: 'B' },
  'sani abacha':     { lat: 4.8189, lng: 6.9840, zone: 'B' },
  'waterlines':      { lat: 4.8250, lng: 7.0100, zone: 'B' },
  'air force':       { lat: 4.8399, lng: 7.0265, zone: 'B' },
  'artillery':       { lat: 4.8449, lng: 7.0407, zone: 'B' },
  'garrison':        { lat: 4.7937, lng: 7.0145, zone: 'B' },
  'orazi':           { lat: 4.8210, lng: 6.9930, zone: 'B' },
  'nkpogu':          { lat: 4.8080, lng: 7.0310, zone: 'B' },
  'stadium road':    { lat: 4.8230, lng: 7.0250, zone: 'B' },
  'elekahia':        { lat: 4.8120, lng: 7.0230, zone: 'B' },
  'rumukalagbor':    { lat: 4.8190, lng: 7.0120, zone: 'B' },
  'ust backgate':    { lat: 4.7980, lng: 6.9850, zone: 'B' },
  'dline':           { lat: 4.7930, lng: 7.0080, zone: 'B' },
  'rumuomasi':       { lat: 4.8250, lng: 7.0310, zone: 'B' },
  'rumudara':        { lat: 4.8650, lng: 7.0350, zone: 'B' },
  'rumuibekwe':      { lat: 4.8460, lng: 7.0600, zone: 'B' },
  'eliozu':          { lat: 4.8620, lng: 7.0220, zone: 'B' },
  'sars road':       { lat: 4.8850, lng: 7.0050, zone: 'B' },
  'rumuodumaya':     { lat: 4.8760, lng: 7.0040, zone: 'B' },
  'rumuagholu':      { lat: 4.8900, lng: 7.0000, zone: 'B' },
  'rukpakulusi':     { lat: 4.8770, lng: 7.0300, zone: 'B' },
  'alakahia':        { lat: 4.9000, lng: 6.9200, zone: 'B' },
  'rumuekini':       { lat: 4.8950, lng: 6.9150, zone: 'B' },

  // ======== ZONE C — ₦3,500 ========
  'eagle island':    { lat: 4.78280, lng: 6.98266, zone: 'C' },
  'choba':           { lat: 4.88681, lng: 6.90117, zone: 'C' },
  'aluu':            { lat: 4.90917, lng: 6.91000, zone: 'C' },
  'peter odili':     { lat: 4.79391, lng: 7.04275, zone: 'C' },
  'old gra':         { lat: 4.79281, lng: 7.00953, zone: 'C' },
  'woji':            { lat: 4.82834, lng: 7.05791, zone: 'C' },
  'eastern by pass': { lat: 4.78087, lng: 7.02155, zone: 'C' },
  'ogbunabali':      { lat: 4.80310, lng: 7.00953, zone: 'C' },
  'trans amadi':     { lat: 4.81472, lng: 7.03722, zone: 'C' },
  'abuloma':         { lat: 4.74322, lng: 7.08212, zone: 'C' },
  'marine base':     { lat: 4.77600, lng: 7.02200, zone: 'C' },
  'creek road':      { lat: 4.75876, lng: 7.02594, zone: 'C' },
  'town':            { lat: 4.75700, lng: 7.01500, zone: 'C' },
  'rumukrushni':     { lat: 4.85541, lng: 7.05388, zone: 'C' },

  // ======== ZONE D — ₦4,000 ========
  'borikiri':        { lat: 4.73857, lng: 7.03371, zone: 'D' },
  'elelenwo':        { lat: 4.83977, lng: 7.07270, zone: 'D' },
  'eneka':           { lat: 4.87815, lng: 7.02951, zone: 'D' },

  // ======== ZONE E — ₦5,000 ========
  'eleme junction':  { lat: 4.85600, lng: 7.06677, zone: 'E' },
  'igwuruta':        { lat: 4.95625, lng: 7.02431, zone: 'E' },
  'airport':         { lat: 5.00433, lng: 6.94661, zone: 'E' },

  // ======== ZONE F — ₦6,000 ========
  'atali':           { lat: 4.86959, lng: 7.05253, zone: 'F' },
  'akpajo':          { lat: 4.81310, lng: 7.10028, zone: 'F' },
  'oyigbo':          { lat: 4.88123, lng: 7.13261, zone: 'F' },
  'igbo-etche':      { lat: 4.88842, lng: 7.07472, zone: 'F' },};

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
