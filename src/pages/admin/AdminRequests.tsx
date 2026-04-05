import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { Request } from '../../types/supabase';
import { Search, Copy, Check, X, Clock } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  processed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: Clock,
  processed: Check,
  cancelled: X,
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      
      setRequests(data as Request[]);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'processed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchRequests();
      toast.success('Request status updated successfully');
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Failed to update request status');
    }
  };

  const handleCopyTrackingNumber = async (trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedId(trackingNumber);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Tracking number copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy tracking number');
    }
  };

  const filteredRequests = requests.filter((request) => {
    const searchString = searchTerm.toLowerCase();
    return (
      request.name.toLowerCase().includes(searchString) ||
      request.email.toLowerCase().includes(searchString) ||
      request.tracking_number.toLowerCase().includes(searchString)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pickup Requests</h2>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
          {requests.filter(r => r.status === 'pending').length} Pending
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pickup Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => {
                const StatusIcon = statusIcons[request.status];
                return (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {request.tracking_number}
                        </span>
                        <button
                          onClick={() => handleCopyTrackingNumber(request.tracking_number)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedId === request.tracking_number ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{request.name}</div>
                      <div className="text-sm text-gray-500">{request.email}</div>
                      <div className="text-sm text-gray-500">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.address}</div>
                      <div className="text-sm text-gray-500 mt-1">{request.parcel_info}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.submitted_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id, e.target.value as 'pending' | 'processed' | 'cancelled')}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="processed">Processed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No requests found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;