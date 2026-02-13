import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { AppSetting, SmsSendMode } from '../../types/database';
import { Settings, Save, AlertCircle } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [customerCarePhone, setCustomerCarePhone] = useState('');
  const [customerCareWhatsapp, setCustomerCareWhatsapp] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [adminEmails, setAdminEmails] = useState('');
  const [smsSendMode, setSmsSendMode] = useState<SmsSendMode>('manual_only');
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('settings_app').select('*');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      (data || []).forEach((s: AppSetting) => {
        settingsMap[s.key] = s.value;
      });

      setSettings(settingsMap);

      // Set form fields
      setCustomerCarePhone(settingsMap['customer_care_phone'] || '');
      setCustomerCareWhatsapp(settingsMap['customer_care_whatsapp'] || '');
      setBusinessHours(settingsMap['business_hours_text'] || '');
      setAdminEmails(
        (settingsMap['admin_emails'] || []).join(', ')
      );
      setSmsSendMode(settingsMap['sms_send_mode'] || 'manual_only');
      setSmsEnabled(settingsMap['sms_enabled'] || false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);

      const updates = [
        {
          key: 'customer_care_phone',
          value: customerCarePhone || null,
          description: 'Main customer care phone number',
        },
        {
          key: 'customer_care_whatsapp',
          value: customerCareWhatsapp || null,
          description: 'Customer care WhatsApp number',
        },
        {
          key: 'business_hours_text',
          value: businessHours || null,
          description: 'Business hours text (e.g., Mon-Fri 9AM-6PM)',
        },
        {
          key: 'admin_emails',
          value: adminEmails.split(',').filter(e => e.trim()),
          description: 'Comma-separated admin email addresses',
        },
        {
          key: 'sms_enabled',
          value: smsEnabled,
          description: 'Enable SMS notifications',
        },
        {
          key: 'sms_send_mode',
          value: smsSendMode,
          description: 'SMS sending mode (manual_only or auto_on_in_progress)',
        },
      ];

      // Upsert each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('settings_app')
          .upsert({
            key: update.key,
            value: update.value,
            description: update.description,
          }, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
      await fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Configure application settings
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Customer Care Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Customer Care
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerCarePhone}
                onChange={(e) => setCustomerCarePhone(e.target.value)}
                placeholder="e.g., 08012345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={customerCareWhatsapp}
                onChange={(e) => setCustomerCareWhatsapp(e.target.value)}
                placeholder="e.g., 08012345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Hours Text
              </label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Admin Settings Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Admin Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email Addresses
              </label>
              <textarea
                value={adminEmails}
                onChange={(e) => setAdminEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple addresses with commas
              </p>
            </div>
          </div>
        </div>

        {/* SMS Configuration Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            SMS Configuration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable SMS Notifications
              </label>
            </div>

            {smsEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Send Mode
                </label>
                <select
                  value={smsSendMode}
                  onChange={(e) => setSmsSendMode(e.target.value as SmsSendMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual_only">
                    Manual Only (Admin clicks button)
                  </option>
                  <option value="auto_on_in_progress">
                    Auto Send (When status is In Progress)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Manual mode prevents accidental SMS costs
                </p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">SMS Cost Control</p>
                <p>
                  SMS is disabled by default. When enabled, manual mode is
                  recommended to prevent accidental costs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 max-w-lg flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Some settings may require Supabase Edge
          Functions to be fully functional (SMS sending, Email notifications,
          etc.).
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
