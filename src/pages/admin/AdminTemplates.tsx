import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { MessageTemplate, MessageTemplateType } from '../../types/database';
import { FileText, Edit2, Trash2, Save } from 'lucide-react';

const AdminTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templName, setTemplName] = useState('');
  const [templType, setTemplType] = useState<MessageTemplateType>('sms');
  const [templSubject, setTemplSubject] = useState('');
  const [templBody, setTemplBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const templateTypes: MessageTemplateType[] = ['sms', 'whatsapp', 'email'];
  const placeholders = [
    '{tracking_id}',
    '{sender_name}',
    '{receiver_name}',
    '{status}',
    '{pickup_area}',
    '{dropoff_area}',
    '{rider_name}',
    '{customer_care_phone}',
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingId(template.id);
    setTemplName(template.name);
    setTemplType(template.type);
    setTemplSubject(template.subject || '');
    setTemplBody(template.body);
  };

  const handleSaveTemplate = async () => {
    if (!templName.trim() || !templBody.trim()) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('message_templates')
        .update({
          name: templName,
          type: templType,
          subject: templSubject || null,
          body: templBody,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast.success('Template updated');
      await fetchTemplates();
      setEditingId(null);
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTemplName('');
    setTemplSubject('');
    setTemplBody('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Message Templates
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Edit SMS, WhatsApp, and email templates
        </p>
      </div>

      {/* Placeholders Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          Available Placeholders:
        </p>
        <div className="flex flex-wrap gap-2">
          {placeholders.map((ph) => (
            <code
              key={ph}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono"
            >
              {ph}
            </code>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6">
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No templates found</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {editingId === template.id ? (
                // Edit Mode
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit Template
                    </h3>
                    <button
                      onClick={handleCancel}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={templName}
                      onChange={(e) => setTemplName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={templType}
                      onChange={(e) =>
                        setTemplType(e.target.value as MessageTemplateType)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {templateTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {templType === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject (Email Only)
                      </label>
                      <input
                        type="text"
                        value={templSubject}
                        onChange={(e) => setTemplSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body
                    </label>
                    <textarea
                      value={templBody}
                      onChange={(e) => setTemplBody(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    ></textarea>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: <span className="font-mono font-medium">{template.type.toUpperCase()}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {template.body}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTemplates;
