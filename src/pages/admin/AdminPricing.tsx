import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { ZoneRate, Addon, Zone } from '../../types/database';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Package as PackageIcon,
  Check,
} from 'lucide-react';

const AdminPricing = () => {
  const [activeTab, setActiveTab] = useState<'zones' | 'addons'>('zones');
  const [zones, setZones] = useState<Zone[]>([]);
  const [rates, setRates] = useState<ZoneRate[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addonName, setAddonName] = useState('');
  const [addonCode, setAddonCode] = useState('');
  const [addonFee, setAddonFee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [zonesRes, ratesRes, addonsRes] = await Promise.all([
        supabase.from('location_zones').select('*'),
        supabase.from('pricing_zone_rates').select('*'),
        supabase.from('pricing_addons').select('*'),
      ]);

      if (zonesRes.error) throw zonesRes.error;
      if (ratesRes.error) throw ratesRes.error;
      if (addonsRes.error) throw addonsRes.error;

      setZones(zonesRes.data || []);
      setRates(ratesRes.data || []);
      setAddons(addonsRes.data || []);
    } catch (err) {
      console.error('Error fetching pricing data:', err);
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddon = async () => {
    if (!addonName.trim() || !addonCode.trim() || !addonFee.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('pricing_addons')
          .update({
            name: addonName,
            code: addonCode,
            fee: parseFloat(addonFee),
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Addon updated');
      } else {
        // Create
        const { error } = await supabase
          .from('pricing_addons')
          .insert([
            {
              name: addonName,
              code: addonCode,
              fee: parseFloat(addonFee),
              active: true,
            },
          ]);

        if (error) throw error;
        toast.success('Addon created');
      }

      await fetchData();
      resetForm();
    } catch (err) {
      console.error('Error saving addon:', err);
      toast.error('Failed to save addon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!window.confirm('Delete this addon?')) return;

    try {
      const { error } = await supabase.from('pricing_addons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Addon deleted');
      await fetchData();
    } catch (err) {
      console.error('Error deleting addon:', err);
      toast.error('Failed to delete addon');
    }
  };

  const handleEditAddon = (addon: Addon) => {
    setAddonName(addon.name);
    setAddonCode(addon.code);
    setAddonFee(addon.fee.toString());
    setEditingId(addon.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setAddonName('');
    setAddonCode('');
    setAddonFee('');
    setEditingId(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Pricing Management
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage zones, rates, and add-ons
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('zones')}
            className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
              activeTab === 'zones'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <DollarSign className="h-5 w-5 inline mr-2" />
            Zones & Rates ({rates.length})
          </button>
          <button
            onClick={() => setActiveTab('addons')}
            className={`flex-1 px-6 py-4 font-medium text-center transition-colors ${
              activeTab === 'addons'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <PackageIcon className="h-5 w-5 inline mr-2" />
            Add-ons ({addons.length})
          </button>
        </div>

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Manage zone rates in Supabase directly.
                This feature allows viewing current rates.
              </p>
            </div>

            {rates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No rates configured yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        From Zone ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        To Zone ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Base Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        ETA
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {rate.from_zone_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {rate.to_zone_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ₦{rate.base_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rate.eta_text || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {rate.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              <Check className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Addons Tab */}
        {activeTab === 'addons' && (
          <div className="p-6">
            {/* Add Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-6"
              >
                <Plus className="h-4 w-4" />
                New Add-on
              </button>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {editingId ? 'Edit Add-on' : 'Create New Add-on'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
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
                      Code
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
                      Fee (₦)
                    </label>
                    <input
                      type="number"
                      value={addonFee}
                      onChange={(e) => setAddonFee(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveAddon}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
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
                        <h4 className="font-semibold text-gray-900">
                          {addon.name}
                        </h4>
                        <p className="text-xs text-gray-500">{addon.code}</p>
                      </div>
                      {addon.active && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-blue-600 mb-4">
                      ₦{addon.fee.toLocaleString()}
                    </p>
                    {addon.description && (
                      <p className="text-xs text-gray-600 mb-4">
                        {addon.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddon(addon)}
                        className="flex-1 flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon.id)}
                        className="flex-1 flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded"
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
