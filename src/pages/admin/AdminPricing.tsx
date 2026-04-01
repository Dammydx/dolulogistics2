import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Package as PackageIcon,
  Check,
  X,
  MapPin,
  Save,
  RefreshCw,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface Zone {
  id: string;
  city_id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface Area {
  id: string;
  city_id: string;
  zone_id: string | null;
  name: string;
  active: boolean;
}

interface ZoneRate {
  id: string;
  from_zone_id: string;
  to_zone_id: string;
  base_price: number;
  eta_text: string | null;
  active: boolean;
}

interface Addon {
  id: string;
  name: string;
  code: string;
  description: string | null;
  fee: number;
  active: boolean;
}

// ─── Component ──────────────────────────────────────────────────

const AdminPricing = () => {
  const [activeTab, setActiveTab] = useState<'areas' | 'zones' | 'addons'>('areas');
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [rates, setRates] = useState<ZoneRate[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Area Form State ─────────────────────────────────────
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaZoneId, setAreaZoneId] = useState('');
  const [isSubmittingArea, setIsSubmittingArea] = useState(false);
  const [areaFilter, setAreaFilter] = useState<string>('all');

  // ─── Zone Rate Editing ───────────────────────────────────
  const [editingRates, setEditingRates] = useState<Record<string, { price: string; eta: string }>>({});
  const [savingRateId, setSavingRateId] = useState<string | null>(null);

  // ─── Addon Form State ────────────────────────────────────
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState('');
  const [addonCode, setAddonCode] = useState('');
  const [addonFee, setAddonFee] = useState('');
  const [addonDescription, setAddonDescription] = useState('');
  const [isSubmittingAddon, setIsSubmittingAddon] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [zonesRes, areasRes, ratesRes, addonsRes] = await Promise.all([
        supabase.from('location_zones').select('*').order('name'),
        supabase.from('locations_areas').select('*').order('name'),
        supabase.from('pricing_zone_rates').select('*'),
        supabase.from('pricing_addons').select('*').order('name'),
      ]);

      if (zonesRes.error) throw zonesRes.error;
      if (areasRes.error) throw areasRes.error;
      if (ratesRes.error) throw ratesRes.error;
      if (addonsRes.error) throw addonsRes.error;

      setZones(zonesRes.data || []);
      setAreas(areasRes.data || []);
      setRates(ratesRes.data || []);
      setAddons(addonsRes.data || []);
    } catch (err) {
      console.error('Error fetching pricing data:', err);
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Helper Functions ────────────────────────────────────

  const getZoneName = (zoneId: string | null): string => {
    if (!zoneId) return 'Unassigned';
    const zone = zones.find((z) => z.id === zoneId);
    return zone ? zone.name : 'Unknown';
  };

  const getZonePrice = (zoneId: string): string => {
    // Find a rate where this zone is the to_zone (price is same regardless of from_zone)
    const rate = rates.find((r) => r.to_zone_id === zoneId);
    return rate ? `₦${rate.base_price.toLocaleString()}` : '—';
  };

  const getAreasForZone = (zoneId: string): Area[] => {
    return areas.filter((a) => a.zone_id === zoneId);
  };

  const getFilteredAreas = (): Area[] => {
    if (areaFilter === 'all') return areas;
    if (areaFilter === 'unassigned') return areas.filter((a) => !a.zone_id);
    return areas.filter((a) => a.zone_id === areaFilter);
  };

  // Get unique rates grouped by to_zone (since price is destination-based)
  const getUniqueDestinationRates = (): { zoneId: string; zoneName: string; rate: ZoneRate }[] => {
    const seen = new Set<string>();
    const result: { zoneId: string; zoneName: string; rate: ZoneRate }[] = [];

    for (const rate of rates) {
      if (!seen.has(rate.to_zone_id)) {
        seen.add(rate.to_zone_id);
        result.push({
          zoneId: rate.to_zone_id,
          zoneName: getZoneName(rate.to_zone_id),
          rate,
        });
      }
    }

    return result.sort((a, b) => a.zoneName.localeCompare(b.zoneName));
  };

  // ─── Area CRUD ───────────────────────────────────────────

  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    try {
      setIsSubmittingArea(true);

      // Get the city_id from the first zone (all share the same city)
      const cityId = zones.length > 0 ? zones[0].city_id : null;
      if (!cityId) {
        toast.error('No city found. Please set up zones first.');
        return;
      }

      if (editingAreaId) {
        const { error } = await supabase
          .from('locations_areas')
          .update({
            name: areaName.trim(),
            zone_id: areaZoneId || null,
          })
          .eq('id', editingAreaId);

        if (error) throw error;
        toast.success('Area updated');
      } else {
        const { error } = await supabase.from('locations_areas').insert([
          {
            city_id: cityId,
            zone_id: areaZoneId || null,
            name: areaName.trim(),
            active: true,
          },
        ]);

        if (error) throw error;
        toast.success('Area created');
      }

      await fetchData();
      resetAreaForm();
    } catch (err: any) {
      console.error('Error saving area:', err);
      if (err?.message?.includes('duplicate') || err?.code === '23505') {
        toast.error('An area with this name already exists');
      } else {
        toast.error('Failed to save area');
      }
    } finally {
      setIsSubmittingArea(false);
    }
  };

  const handleEditArea = (area: Area) => {
    setAreaName(area.name);
    setAreaZoneId(area.zone_id || '');
    setEditingAreaId(area.id);
    setShowAreaForm(true);
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!window.confirm(`Delete area "${name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase.from('locations_areas').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Area "${name}" deleted`);
      await fetchData();
    } catch (err) {
      console.error('Error deleting area:', err);
      toast.error('Failed to delete area. It may be referenced by bookings.');
    }
  };

  const resetAreaForm = () => {
    setAreaName('');
    setAreaZoneId('');
    setEditingAreaId(null);
    setShowAreaForm(false);
  };

  // ─── Zone Rate Editing ───────────────────────────────────

  const handleEditRate = (rate: ZoneRate) => {
    setEditingRates((prev) => ({
      ...prev,
      [rate.to_zone_id]: {
        price: rate.base_price.toString(),
        eta: rate.eta_text || '',
      },
    }));
  };

  const handleSaveRate = async (toZoneId: string) => {
    const edit = editingRates[toZoneId];
    if (!edit || !edit.price.trim()) {
      toast.error('Please enter a valid price');
      return;
    }

    const newPrice = parseFloat(edit.price);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid positive price');
      return;
    }

    try {
      setSavingRateId(toZoneId);

      // Update ALL rates that have this to_zone (since price is destination-based)
      const { error } = await supabase
        .from('pricing_zone_rates')
        .update({
          base_price: newPrice,
          eta_text: edit.eta.trim() || null,
        })
        .eq('to_zone_id', toZoneId);

      if (error) throw error;
      toast.success('Zone rate updated');
      await fetchData();

      // Remove from editing state
      setEditingRates((prev) => {
        const next = { ...prev };
        delete next[toZoneId];
        return next;
      });
    } catch (err) {
      console.error('Error saving rate:', err);
      toast.error('Failed to save rate');
    } finally {
      setSavingRateId(null);
    }
  };

  const handleCancelRateEdit = (toZoneId: string) => {
    setEditingRates((prev) => {
      const next = { ...prev };
      delete next[toZoneId];
      return next;
    });
  };

  // ─── Addon CRUD ──────────────────────────────────────────

  const handleSaveAddon = async () => {
    if (!addonName.trim() || !addonCode.trim() || !addonFee.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsSubmittingAddon(true);

      if (editingAddonId) {
        const { error } = await supabase
          .from('pricing_addons')
          .update({
            name: addonName,
            code: addonCode,
            description: addonDescription || null,
            fee: parseFloat(addonFee),
          })
          .eq('id', editingAddonId);

        if (error) throw error;
        toast.success('Add-on updated');
      } else {
        const { error } = await supabase.from('pricing_addons').insert([
          {
            name: addonName,
            code: addonCode,
            description: addonDescription || null,
            fee: parseFloat(addonFee),
            active: true,
          },
        ]);

        if (error) throw error;
        toast.success('Add-on created');
      }

      await fetchData();
      resetAddonForm();
    } catch (err) {
      console.error('Error saving addon:', err);
      toast.error('Failed to save add-on');
    } finally {
      setIsSubmittingAddon(false);
    }
  };

  const handleEditAddon = (addon: Addon) => {
    setAddonName(addon.name);
    setAddonCode(addon.code);
    setAddonFee(addon.fee.toString());
    setAddonDescription(addon.description || '');
    setEditingAddonId(addon.id);
    setShowAddonForm(true);
  };

  const handleDeleteAddon = async (id: string) => {
    if (!window.confirm('Delete this add-on?')) return;

    try {
      const { error } = await supabase.from('pricing_addons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Add-on deleted');
      await fetchData();
    } catch (err) {
      console.error('Error deleting addon:', err);
      toast.error('Failed to delete add-on');
    }
  };

  const resetAddonForm = () => {
    setAddonName('');
    setAddonCode('');
    setAddonFee('');
    setAddonDescription('');
    setEditingAddonId(null);
    setShowAddonForm(false);
  };

  // ─── Loading State ───────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Pricing & Locations
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage delivery areas, zone rates, and add-ons
          </p>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('areas')}
            className={`flex-1 px-4 py-4 font-medium text-center text-sm transition-colors ${
              activeTab === 'areas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-1.5" />
            Areas ({areas.length})
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`flex-1 px-4 py-4 font-medium text-center text-sm transition-colors ${
              activeTab === 'zones'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-4 w-4 inline mr-1.5" />
            Zone Rates ({zones.length})
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`flex-1 px-4 py-4 font-medium text-center text-sm transition-colors ${
              activeTab === 'addons'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <PackageIcon className="h-4 w-4 inline mr-1.5" />
            Add-ons ({addons.length})
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB 1: AREAS — Add, Edit, Delete, Change Zone
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'areas' && (
          <div className="p-6">
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {!showAreaForm && (
                <button
                  onClick={() => setShowAreaForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add New Area
                </button>
              )}

              {/* Zone Filter */}
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Zones ({areas.length})</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {getZonePrice(zone.id)} ({getAreasForZone(zone.id).length})
                  </option>
                ))}
                <option value="unassigned">Unassigned ({areas.filter((a) => !a.zone_id).length})</option>
              </select>
            </div>

            {/* Add/Edit Area Form */}
            {showAreaForm && (
              <div className="bg-blue-50 rounded-lg p-5 mb-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {editingAreaId ? 'Edit Area' : 'Add New Area'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area Name *
                    </label>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="e.g., Rumuola"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to Zone *
                    </label>
                    <select
                      value={areaZoneId}
                      onChange={(e) => setAreaZoneId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} — {getZonePrice(zone.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      onClick={handleSaveArea}
                      disabled={isSubmittingArea}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
                    >
                      {isSubmittingArea ? 'Saving...' : editingAreaId ? 'Update' : 'Add'}
                    </button>
                    <button
                      onClick={resetAreaForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Area Cards — Grouped by Zone */}
            {areaFilter === 'all' ? (
              <div className="space-y-6">
                {zones.map((zone) => {
                  const zoneAreas = getAreasForZone(zone.id);
                  return (
                    <div key={zone.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{zone.name}</span>
                          <span className="text-sm font-bold text-blue-600">{getZonePrice(zone.id)}</span>
                          <span className="text-xs text-gray-500">{zoneAreas.length} areas</span>
                        </div>
                      </div>
                      <div className="p-4">
                        {zoneAreas.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No areas in this zone</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {zoneAreas.map((area) => (
                              <div
                                key={area.id}
                                className="group flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <span className="text-sm text-gray-800">{area.name}</span>
                                <button
                                  onClick={() => handleEditArea(area)}
                                  className="hidden group-hover:inline-flex text-blue-500 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArea(area.id, area.name)}
                                  className="hidden group-hover:inline-flex text-red-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned areas */}
                {areas.filter((a) => !a.zone_id).length > 0 && (
                  <div className="border border-orange-200 rounded-lg overflow-hidden">
                    <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                      <span className="font-semibold text-orange-800">⚠️ Unassigned Areas</span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {areas
                          .filter((a) => !a.zone_id)
                          .map((area) => (
                            <div
                              key={area.id}
                              className="group flex items-center gap-1.5 bg-white border border-orange-200 rounded-full px-3 py-1.5 hover:border-blue-300 transition-colors"
                            >
                              <span className="text-sm text-gray-800">{area.name}</span>
                              <button
                                onClick={() => handleEditArea(area)}
                                className="text-blue-500 hover:text-blue-700"
                                title="Edit / Assign Zone"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteArea(area.id, area.name)}
                                className="text-red-400 hover:text-red-600"
                                title="Delete"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Flat list when filtering by specific zone */
              <div className="flex flex-wrap gap-2">
                {getFilteredAreas().length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 w-full text-center">No areas found</p>
                ) : (
                  getFilteredAreas().map((area) => (
                    <div
                      key={area.id}
                      className="group flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-800">{area.name}</span>
                      <span className="text-xs text-gray-400">({getZoneName(area.zone_id)})</span>
                      <button
                        onClick={() => handleEditArea(area)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area.id, area.name)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2: ZONE RATES — Edit prices & ETA
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'zones' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> Each zone has a base delivery rate. When a customer
                selects a pickup and drop-off area, the final price is determined by the highest rate between the two zones. The system uses "Highest-Zone" logic.
                Click "Edit" to change a zone's base price.
              </p>
            </div>

            {getUniqueDestinationRates().length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No zone rates configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getUniqueDestinationRates().map(({ zoneId, zoneName, rate }) => {
                  const isEditing = !!editingRates[zoneId];
                  const zoneAreas = getAreasForZone(zoneId);
                  const zone = zones.find((z) => z.id === zoneId);

                  return (
                    <div
                      key={zoneId}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="bg-gray-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{zoneName}</h3>
                          {zone?.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{zoneAreas.length} areas</p>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">₦</span>
                              <input
                                type="number"
                                value={editingRates[zoneId].price}
                                onChange={(e) =>
                                  setEditingRates((prev) => ({
                                    ...prev,
                                    [zoneId]: { ...prev[zoneId], price: e.target.value },
                                  }))
                                }
                                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                              />
                            </div>
                            <input
                              type="text"
                              value={editingRates[zoneId].eta}
                              onChange={(e) =>
                                setEditingRates((prev) => ({
                                  ...prev,
                                  [zoneId]: { ...prev[zoneId], eta: e.target.value },
                                }))
                              }
                              placeholder="ETA (e.g., 30-60 min)"
                              className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSaveRate(zoneId)}
                              disabled={savingRateId === zoneId}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancelRateEdit(zoneId)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-blue-600">
                              ₦{rate.base_price.toLocaleString()}
                            </span>
                            {rate.eta_text && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {rate.eta_text}
                              </span>
                            )}
                            <button
                              onClick={() => handleEditRate(rate)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expandable area list */}
                      <div className="px-5 py-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1.5">
                          {zoneAreas.map((area) => (
                            <span
                              key={area.id}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {area.name}
                            </span>
                          ))}
                          {zoneAreas.length === 0 && (
                            <span className="text-xs text-gray-400 italic">No areas assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 3: ADD-ONS — Add, Edit, Delete
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'addons' && (
          <div className="p-6">
            {/* Add Button */}
            {!showAddonForm && (
              <button
                onClick={() => setShowAddonForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                New Add-on
              </button>
            )}

            {/* Add/Edit Addon Form */}
            {showAddonForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {editingAddonId ? 'Edit Add-on' : 'Create New Add-on'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={addonName}
                      onChange={(e) => setAddonName(e.target.value)}
                      placeholder="e.g., Fragile Handling"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={addonCode}
                      onChange={(e) => setAddonCode(e.target.value.toUpperCase())}
                      placeholder="e.g., FRAGILE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee (₦) *
                    </label>
                    <input
                      type="number"
                      value={addonFee}
                      onChange={(e) => setAddonFee(e.target.value)}
                      placeholder="e.g., 300"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={addonDescription}
                      onChange={(e) => setAddonDescription(e.target.value)}
                      placeholder="Brief description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveAddon}
                    disabled={isSubmittingAddon}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
                  >
                    {isSubmittingAddon ? 'Saving...' : editingAddonId ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={resetAddonForm}
                    disabled={isSubmittingAddon}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add-ons List */}
            {addons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <PackageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No add-ons created yet</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">{addon.code}</p>
                      </div>
                      {addon.active && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      ₦{addon.fee.toLocaleString()}
                    </p>
                    {addon.description && (
                      <p className="text-xs text-gray-600 mb-4">{addon.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddon(addon)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPricing;
