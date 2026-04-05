import { useState } from 'react';
import { Message } from '../../../types/supabase';
import { Search, Trash, CheckCircle, Mail } from 'lucide-react';

type MessagesListProps = {
  messages: Message[];
  onToggleRead: (id: string, currentReadStatus: boolean) => void;
  onDelete: (id: string) => void;
};

const MessagesList = ({ messages, onToggleRead, onDelete }: MessagesListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField] = useState('created_at');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

// Sorting Logic

  const filteredMessages = messages.filter((message) => {
    const searchString = searchTerm.toLowerCase();
    return (
      message.name.toLowerCase().includes(searchString) ||
      message.email.toLowerCase().includes(searchString) ||
      message.message.toLowerCase().includes(searchString)
    );
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (sortField === 'created_at') {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    const aValue = a[sortField as keyof Message];
    const bValue = b[sortField as keyof Message];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-gray-200">
        {sortedMessages.map((message) => (
          <div 
            key={message.id} 
            className={`p-4 hover:bg-gray-50 transition-colors ${
              !message.read ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`mt-1 ${message.read ? 'text-gray-400' : 'text-primary-500'}`}>
                  {message.read ? <CheckCircle className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{message.name}</h3>
                  <p className="text-sm text-gray-500">{message.email}</p>
                  <p className="mt-2 text-sm text-gray-700">{message.message}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(message.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleRead(message.id, message.read)}
                  className={`text-sm px-3 py-1 rounded-md ${
                    message.read
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                  }`}
                >
                  {message.read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sortedMessages.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No messages found
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesList;