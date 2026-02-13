import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { ContactMessage, ContactMessageStatus } from '../../types/database';
import {
  Search,
  X,
  Eye,
  Trash2,
  MessageCircle,
  Mail,
  Check,
} from 'lucide-react';

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ContactMessageStatus | 'all'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [newMsgStatus, setNewMsgStatus] = useState<ContactMessageStatus>('new');

  const statuses: ContactMessageStatus[] = ['new', 'in_progress', 'resolved', 'spam'];

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, selectedStatus, searchTerm]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (m.email && m.email.toLowerCase().includes(term)) ||
          (m.phone && m.phone.includes(term)) ||
          m.message.toLowerCase().includes(term)
      );
    }

    setFilteredMessages(filtered);
  };

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setNewMsgStatus(message.status);
    setNewNote(message.admin_notes || '');
    setShowDetailsModal(true);
  };

  const handleUpdateMessage = async () => {
    if (!selectedMessage) return;

    try {
      setIsUpdatingNote(true);
      const { error } = await supabase
        .from('contact_messages')
        .update({
          status: newMsgStatus,
          admin_notes: newNote || null,
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast.success('Message updated successfully');
      await fetchMessages();
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error updating message:', err);
      toast.error('Failed to update message');
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Message deleted');
      await fetchMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
  };

  const getStatusBadgeColor = (status: ContactMessageStatus): string => {
    const colors = {
      new: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      spam: 'bg-gray-100 text-gray-800',
    };
    return colors[status];
  };

  const getStatusLabel = (status: ContactMessageStatus): string => {
    const labels = {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      spam: 'Spam',
    };
    return labels[status];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Contact Messages
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage customer inquiries and messages
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex-1 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({messages.length})
          </button>
          {statuses.map((status) => {
            const count = messages.filter((m) => m.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop View */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {message.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {message.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{message.email}</span>
                        </div>
                      )}
                      {message.phone && (
                        <div className="text-gray-600">{message.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 truncate">
                      {message.subject || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(
                          message.status
                        )}`}
                      >
                        {getStatusLabel(message.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(message)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{message.name}</p>
                      <p className="text-xs text-gray-500">
                        {message.email || message.phone}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(
                        message.status
                      )}`}
                    >
                      {getStatusLabel(message.status)}
                    </span>
                  </div>
                  {message.subject && (
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {message.subject}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mb-3">{message.message.substring(0, 100)}...</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleViewDetails(message)}
                      className="inline-flex items-center gap-2 text-blue-600 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-gray-200 p-6 bg-white flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Sender Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Sender Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedMessage.name}
                    </p>
                  </div>
                  {selectedMessage.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  )}
                  {selectedMessage.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {selectedMessage.phone}
                      </a>
                    </div>
                  )}
                  {selectedMessage.whatsapp && (
                    <div>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                      <a
                        href={`https://wa.me/${selectedMessage.whatsapp.replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 hover:text-green-700"
                      >
                        {selectedMessage.whatsapp}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                {selectedMessage.subject && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900">
                      {selectedMessage.subject}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Received: {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>

              {/* Update Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Message Status
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newMsgStatus}
                      onChange={(e) =>
                        setNewMsgStatus(e.target.value as ContactMessageStatus)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add internal notes about this message..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateMessage}
                      disabled={isUpdatingNote}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {isUpdatingNote ? 'Updating...' : 'Update Message'}
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;