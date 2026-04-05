import { useState } from 'react';
import { Parcel } from '../../../types/supabase';
import { Edit, Trash, Search, ChevronDown, ChevronUp } from 'lucide-react';

type ParcelsListProps = {
  parcels: Parcel[];
  isLoading: boolean;
  error: string | null;
  onEdit: (parcel: Parcel) => void;
  onDelete: (id: string) => void;
};

const statusLabels: Record<string, string> = {
  'awaiting_pickup': 'Awaiting Pickup',
  'in_transit': 'In Transit',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'delayed': 'Delayed',
  'cancelled': 'Cancelled',
};

const statusColors: Record<string, string> = {
  'awaiting_pickup': 'bg-amber-100 text-amber-800',
  'in_transit': 'bg-blue-100 text-blue-800',
  'out_for_delivery': 'bg-accent-100 text-accent-800',
  'delivered': 'bg-emerald-100 text-emerald-800',
  'delayed': 'bg-amber-100 text-amber-800',
  'cancelled': 'bg-red-100 text-red-800',
};

const ParcelsList = ({ parcels, isLoading, error, onEdit, onDelete }: ParcelsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredParcels = parcels.filter((parcel) => {
    const searchString = searchTerm.toLowerCase();
    return (
      parcel.tracking_id.toLowerCase().includes(searchString) ||
      parcel.sender_name.toLowerCase().includes(searchString) ||
      parcel.receiver_name.toLowerCase().includes(searchString) ||
      parcel.origin_city.toLowerCase().includes(searchString) ||
      parcel.destination_city.toLowerCase().includes(searchString)
    );
  });

  const sortedParcels = [...filteredParcels].sort((a, b) => {
    if (sortField === 'created_at') {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    const aValue = a[sortField as keyof Parcel];
    const bValue = b[sortField as keyof Parcel];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
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
    <div className="bg-white rounded-lg shadow">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search parcels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => handleSort('tracking_id')}
              >
                <div className="flex items-center">
                  Tracking ID
                  {sortField === 'tracking_id' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => handleSort('sender_name')}
              >
                <div className="flex items-center">
                  Sender
                  {sortField === 'sender_name' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => handleSort('receiver_name')}
              >
                <div className="flex items-center">
                  Receiver
                  {sortField === 'receiver_name' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Date
                  {sortField === 'created_at' && (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedParcels.map((parcel) => (
              <tr key={parcel.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {parcel.tracking_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div>{parcel.sender_name}</div>
                  <div className="text-xs text-gray-400">{parcel.origin_city}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div>{parcel.receiver_name}</div>
                  <div className="text-xs text-gray-400">{parcel.destination_city}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[parcel.status]}`}>
                    {statusLabels[parcel.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(parcel.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  <button
                    onClick={() => onEdit(parcel)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(parcel.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {sortedParcels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No parcels found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParcelsList;