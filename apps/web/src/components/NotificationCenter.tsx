'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'sms' | 'telegram' | 'email';
  zone: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: number;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'sms',
    zone: 'Port Louis',
    message: '🚨 CRITICAL ALERT: Cyclone Freddy approaching. Evacuate immediately to nearest shelter. Stay safe!',
    status: 'sent',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    priority: 'critical',
    recipients: 15420
  },
  {
    id: '2',
    type: 'telegram',
    zone: 'Quatre Bornes',
    message: '⚠️ HIGH RISK: Heavy rainfall expected in next 2 hours. Flood risk in low-lying areas. Monitor conditions.',
    status: 'sent',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    priority: 'high',
    recipients: 8930
  },
  {
    id: '3',
    type: 'sms',
    zone: 'Grand Baie',
    message: '🌊 FLOOD WARNING: Water levels rising. Avoid coastal roads. Emergency services on standby.',
    status: 'pending',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    priority: 'high',
    recipients: 5670
  },
  {
    id: '4',
    type: 'email',
    zone: 'Curepipe',
    message: 'Weather Update: Moderate winds expected. Secure outdoor items. School closure notices will follow.',
    status: 'sent',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    priority: 'medium',
    recipients: 12340
  }
];

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'sms' | 'telegram' | 'email'>('all');
  const [showStats, setShowStats] = useState(true);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return '📱';
      case 'telegram': return '✈️';
      case 'email': return '📧';
      default: return '📨';
    }
  };

  const filteredNotifications = notifications.filter(
    n => filter === 'all' || n.type === filter
  );

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    pending: notifications.filter(n => n.status === 'pending').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    totalRecipients: notifications.reduce((sum, n) => sum + n.recipients, 0)
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.map(n => 
          n.status === 'pending' && Math.random() > 0.7
            ? { ...n, status: 'sent' as const }
            : n
        )
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📢 Notification Center</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-600 font-medium">Live Updates</span>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total Alerts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-green-800">Sent</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-800">Pending</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-800">Failed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRecipients.toLocaleString()}</div>
            <div className="text-sm text-purple-800">Recipients</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'sms', 'telegram', 'email'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? '📊 All' : `${getTypeIcon(type)} ${type.toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-1 h-12 rounded ${getPriorityColor(notification.priority)}`}></div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{notification.zone}</div>
                    <div className="text-sm text-gray-500">
                      {notification.recipients.toLocaleString()} recipients
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                  {notification.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{notification.message}</p>
            </div>

            {/* Sample delivery info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Priority: {notification.priority.toUpperCase()}</span>
                <span>Channel: {notification.type.toUpperCase()}</span>
              </div>
              {notification.status === 'sent' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Delivered</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          🚨 Send Emergency Alert
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          📊 View Analytics
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
          ⚙️ Configure Settings
        </button>
      </div>
    </div>
  );
}