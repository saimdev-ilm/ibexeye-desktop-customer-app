import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface StoredAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  cameraId: string;
  timestamp: string;
  mediaPath?: string | null;
  networkId: string;
  nodeId: string;
  deviceId: number;
  read: boolean;
}

export const AlertNotificationsList: React.FC = () => {
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    // Load alerts from localStorage
    const loadAlerts = () => {
      const storedAlerts = JSON.parse(localStorage.getItem('alerts') || '[]');
      setAlerts(storedAlerts);
    };

    loadAlerts();

    // Listen for new alerts
    const handleNewAlert = (event: CustomEvent) => {
      loadAlerts();
    };

    window.addEventListener('newAlert', handleNewAlert as EventListener);

    return () => {
      window.removeEventListener('newAlert', handleNewAlert as EventListener);
    };
  }, []);

  const markAsRead = (alertId: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    );
    setAlerts(updatedAlerts);
    localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    localStorage.removeItem('alerts');
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(alert => !alert.read)
    : alerts;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'detection_enabled': return '✅';
      case 'detection_disabled': return '⚠️';
      case 'motion_detected': return '🚨';
      case 'intrusion_detected': return '🚨';
      default: return '📢';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'detection_enabled': return 'border-green-500 bg-green-50';
      case 'detection_disabled': return 'border-yellow-500 bg-yellow-50';
      case 'motion_detected': return 'border-blue-500 bg-blue-50';
      case 'intrusion_detected': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl p-4 mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Alert Notifications</h2>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              className="px-3 py-1 border rounded"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread Only</option>
            </select>
            <button
              onClick={clearAllAlerts}
              className="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No alerts found
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${getAlertColor(alert.type)} ${
                  !alert.read ? 'bg-opacity-100' : 'bg-opacity-50'
                } hover:bg-opacity-75 transition-all cursor-pointer`}
                onClick={() => markAsRead(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <h3 className="font-semibold text-gray-800">
                        {alert.title}
                      </h3>
                      {!alert.read && (
                        <span className="px-2 py-1 text-xs text-white bg-blue-500 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-gray-600">{alert.description}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span>Camera: {alert.cameraId}</span>
                      <span>Device: {alert.deviceId}</span>
                      <span>
                        {formatDistanceToNow(new Date(alert.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs tracking-wide text-gray-400 uppercase">
                    {alert.type.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};