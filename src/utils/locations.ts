/**
 * LOCATION UTILITIES
 *
 * Helper functions for working with locations data (states, cities, areas, zones).
 * Used by Get Quote and Request Pickup forms.
 */

import { supabase } from '../lib/supabase';
import type { State, City, Area, Zone, DropdownOption } from '../types/database';

/**
 * Fetch all active states
 */
export async function fetchStates(): Promise<State[]> {
  const { data, error } = await supabase
    .from('locations_states')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch cities for a given state
 */
export async function fetchCitiesByState(stateId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from('locations_cities')
    .select('*')
    .eq('state_id', stateId)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch areas for a given city
 */
export async function fetchAreasByCity(cityId: string): Promise<Area[]> {
  const { data, error } = await supabase
    .from('locations_areas')
    .select('*')
    .eq('city_id', cityId)
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch zone for an area (needed for pricing)
 */
export async function fetchZoneForArea(areaId: string): Promise<Zone | null> {
  const { data: area, error: areaError } = await supabase
    .from('locations_areas')
    .select('zone_id')
    .eq('id', areaId)
    .single();

  if (areaError || !area?.zone_id) return null;

  const { data: zone, error: zoneError } = await supabase
    .from('location_zones')
    .select('*')
    .eq('id', area.zone_id)
    .single();

  if (zoneError) return null;
  return zone;
}

/**
 * Convert states to dropdown options
 */
export function statesToOptions(states: State[]): DropdownOption[] {
  return states.map((state) => ({
    value: state.id,
    label: state.name,
  }));
}

/**
 * Convert cities to dropdown options
 */
export function citiesToOptions(cities: City[]): DropdownOption[] {
  return cities.map((city) => ({
    value: city.id,
    label: city.name,
  }));
}

/**
 * Convert areas to dropdown options
 */
export function areasToOptions(areas: Area[]): DropdownOption[] {
  return areas.map((area) => ({
    value: area.id,
    label: area.name,
  }));
}

/**
 * Get area name by ID (for display)
 */
export async function getAreaName(areaId: string): Promise<string> {
  const { data, error } = await supabase
    .from('locations_areas')
    .select('name')
    .eq('id', areaId)
    .single();

  if (error || !data) return 'Unknown Area';
  return data.name;
}
