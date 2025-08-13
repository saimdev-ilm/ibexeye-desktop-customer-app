// SolarRecentAlerts component with mock solar-related alerts
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaEye, FaSyncAlt, FaExclamationTriangle, FaTimes, FaSolarPanel, FaBolt, FaBatteryHalf, FaThermometerHalf } from "react-icons/fa";

interface SolarAlert {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  view: number; // 1 = unviewed, 0 = viewed
  severity: 'low' | 'medium' | 'high';
  value?: string;
  unit?: string;
}

interface SolarRecentAlertsProps {
  limit?: number;
  height?: string;
}

const SolarRecentAlerts: React.FC<SolarRecentAlertsProps> = ({
  limit = 10,
  height = "max-h-[40vh]"
}) => {
  const navigate = useNavigate();
  const [alertsData, setAlertsData] = useState<SolarAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SolarAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Mock solar alerts data
  const mockSolarAlerts: SolarAlert[] = [
    {
      id: 1,
      title: "Low Solar Production Alert",
      description: "Solar panel efficiency dropped below 80%. Current production: 350W (Expected: 466W)",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      type: "low_production",
      view: 1,
      severity: "medium",
      value: "350",
      unit: "W"
    },
    {
      id: 2,
      title: "Battery Discharge Warning",
      description: "Battery is discharging faster than expected. Current level: 5.7W (100%)",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      type: "battery_discharge",
      view: 1,
      severity: "high",
      value: "5.7",
      unit: "W"
    },
    {
      id: 3,
      title: "Grid Connection Restored",
      description: "Grid connection has been restored after maintenance. System now connected and stable.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      type: "grid_restored",
      view: 0,
      severity: "low",
      value: "0",
      unit: "KW"
    }
  ];

  // Simulate fetching solar alerts
  const fetchSolarAlerts = async () => {
    try {
      setRefreshing(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sortedAlerts = [...mockSolarAlerts]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      setAlertsData(sortedAlerts);
      const unviewed = sortedAlerts.filter(alert => alert.view === 1).length;
      setUnviewedCount(unviewed);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching solar alerts:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSolarAlerts();
    // Refresh every 30 seconds for demo purposes
    const refreshInterval = setInterval(fetchSolarAlerts, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleViewAll = () => {
    // Navigate to solar alerts page
    navigate("/solarAlerts");
  };

  const handleOpenAlert = async (alert: SolarAlert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);

    // Mark as viewed if unviewed
    if (alert.view === 1) {
      setAlertsData(prev =>
        prev.map(a => a.id === alert.id ? { ...a, view: 0 } : a)
      );
      setUnviewedCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) {
        return "Just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
      } else if (diffInMinutes < 1440) { // 24 hours
        return `${Math.floor(diffInMinutes / 60)} hr ago`;
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return dateString;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_production':
        return <FaSolarPanel className="text-yellow-600" />;
      case 'battery_discharge':
        return <FaBatteryHalf className="text-red-600" />;
      case 'grid_restored':
        return <FaBolt className="text-green-600" />;
      case 'temperature_high':
        return <FaThermometerHalf className="text-orange-600" />;
      default:
        return <FaExclamationTriangle className="text-gray-600" />;
    }
  };

  const getAlertTypeTitle = (type: string) => {
    switch (type) {
      case 'low_production':
        return 'Low Production';
      case 'battery_discharge':
        return 'Battery Warning';
      case 'grid_restored':
        return 'Grid Status';
      case 'temperature_high':
        return 'Temperature Alert';
      default:
        return 'Solar Alert';
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FaSolarPanel className="text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-800">Solar System Alerts</h2>
          {unviewedCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-yellow-500 rounded-full">
              {unviewedCount} new
            </span>
          )}
          {refreshing && (
            <FaSyncAlt className="text-gray-400 animate-spin" size={14} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSolarAlerts}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Refresh"
          >
            <FaSyncAlt size={14} />
          </button>
          <button
            onClick={handleViewAll}
            className="flex items-center text-sm text-yellow-600 hover:text-yellow-800"
          >
            View All <FaChevronRight size={12} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className={`${height} overflow-y-auto custom-scrollbar2 pr-1`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-t-2 border-b-2 border-yellow-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {alertsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32">
                <FaSolarPanel className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-gray-500">No solar alerts</p>
              </div>
            ) : (
              alertsData.map((alert) => (
                <div
                  key={alert.id}
                  className={`relative p-4 bg-gradient-to-r rounded-lg border shadow-sm hover:shadow transition cursor-pointer ${
                    alert.view === 1 
                      ? 'from-yellow-50 to-orange-50 border-l-4 border-l-yellow-500' 
                      : 'from-gray-50 to-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleOpenAlert(alert)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-sm font-semibold text-gray-800">{alert.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="mb-2 text-xs text-gray-500">
                        {formatDate(alert.timestamp)}
                      </p>
                      
                      <p className="mb-2 text-xs text-gray-600 line-clamp-2">
                        {alert.description}
                      </p>

                       
                    </div>

                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {alert.view === 1 && (
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {isModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-yellow-50">
              <div className="flex items-center gap-2">
                {getAlertIcon(selectedAlert.type)}
                <h3 className="text-lg font-bold text-gray-800">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-3 py-1.5 rounded-full border ${getSeverityColor(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()} PRIORITY
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="mb-4 text-gray-700">{selectedAlert.description}</p>

              {/* Alert Metrics */}
              <div className="p-4 mb-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="mb-3 text-sm font-medium text-gray-700">System Metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Alert Type</p>
                    <p className="font-medium">{getAlertTypeTitle(selectedAlert.type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Value</p>
                    <p className="font-medium">{selectedAlert.value} {selectedAlert.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Severity Level</p>
                    <p className="font-medium capitalize">{selectedAlert.severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium text-orange-600">Active</p>
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="mb-2 text-sm font-medium text-blue-800">Recommended Actions</h4>
                <ul className="space-y-1 text-xs text-blue-700">
                  {selectedAlert.type === 'low_production' && (
                    <>
                      <li>• Check for panel shading or debris</li>
                      <li>• Verify inverter status and connections</li>
                      <li>• Monitor weather conditions</li>
                    </>
                  )}
                  {selectedAlert.type === 'battery_discharge' && (
                    <>
                      <li>• Check battery health and connections</li>
                      <li>• Review power consumption patterns</li>
                      <li>• Consider load management</li>
                    </>
                  )}
                  {selectedAlert.type === 'grid_restored' && (
                    <>
                      <li>• System is operating normally</li>
                      <li>• Monitor for stable grid connection</li>
                      <li>• Resume normal operations</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Navigate to solar system details
                  navigate('/solarSystem');
                  handleCloseModal();
                }}
                className="px-4 py-2 text-white transition bg-yellow-600 rounded-md hover:bg-yellow-700"
              >
                View System Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarRecentAlerts;