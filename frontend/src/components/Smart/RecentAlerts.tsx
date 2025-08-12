// Enhanced RecentAlerts component with Map integration
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaEye, FaVideo, FaSyncAlt, FaExclamationTriangle, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import {
  getAlerts,
  markAlertAsViewed,
  isImage as checkIsImage,
  getMediaUrl as getAlertMediaUrl,
  Alert
} from '../../services/alertService';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { PiDrone } from "react-icons/pi";
import { useDroneDeployment } from '../../contexts/DroneDeploymentContext';


interface RecentAlertsProps {
  limit?: number;
  height?: string;
  onDroneDeploymentRequest?: (location: { latitude: number; longitude: number }) => void;
}

interface TheftDetection {
  channel: string;
  body: {
    type: string;
    alert_id: string;
    cameraId: string;
    timestamp: string;
    frame_number: number;
    time_detection: string;
    location: {
      latitude: number;
      longitude: number;
    };
    detection_summary: {
      total_suspects: number;
      total_weapons: number;
      total_faces_extracted: number;
      suspects_on_bikes: number;
      license_plates_found: number;
      clothing_classifications: number;
    };
    suspects: Array<{
      suspect_id: number;
      confidence: number;
      bbox: { x1: number; y1: number; x2: number; y2: number };
      image_url: string;
      clothing_info: {
        clothing_type: string;
        classification_status: string;
      };
    }>;
    faces: Array<{
      face_id: number;
      associated_suspect: number;
      image_url: string;
    }>;
    face_detect: boolean;
    facial_attributes: {
      gender: Array<{ attribute: string; confidence: number }>;
    };
    gender: string;
    clothing_info: {
      clothing_type: string;
      classification_status: string;
    };
    weapons: Array<{
      weapon_id: number;
      confidence: number;
      bbox: { x1: number; y1: number; x2: number; y2: number };
      image_url: string;
      weapon_type: string;
    }>;
    weapon: boolean;
    weapon_type: string;
    vehicle: boolean;
    vehicle_type: string | null;
    images: {
      original_frame: string;
      annotated_frame: string;
      suspects: string[];
      weapons: string[];
      faces: string[];
    };
    confidence_scores: {
      suspects: number[];
      weapons: number[];
    };
    description: string;
  };
}


interface DroneAlert {
  id: string;
  data: TheftDetection;
  timestamp: Date;
  status: 'pending' | 'deployed' | 'aborted';
}

// Map Component using Leaflet
const ThreatLocationMap: React.FC<{
  latitude: number;
  longitude: number;
  cameraId: string;
}> = ({ latitude, longitude, cameraId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initializeMap();
        document.head.appendChild(script);
      } else if ((window as any).L) {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (mapRef.current && (window as any).L && !mapInstanceRef.current) {
        const L = (window as any).L;
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const threatIcon = L.divIcon({
          html: `
            <div style="
              background: #dc2626;
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-weight: bold;
              ">⚠</div>
            </div>
          `,
          className: 'threat-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        const marker = L.marker([latitude, longitude], { icon: threatIcon }).addTo(map);
        marker.bindPopup(`
          <div style="text-align: center; font-family: sans-serif;">
            <h4 style="color: #dc2626; margin: 0 0 8px 0;">🚨 THREAT DETECTED</h4>
            <p style="margin: 4px 0;"><strong>Camera:</strong> ${cameraId}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
            <p style="margin: 4px 0; color: #dc2626;"><strong>Status:</strong> Active Alert</p>
          </div>
        `);

        mapInstanceRef.current = map;
        setTimeout(() => marker.openPopup(), 500);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, cameraId]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '200px',
        borderRadius: '8px',
        border: '2px solid #dc2626'
      }}
    />
  );
};

const RecentAlerts: React.FC<RecentAlertsProps> = ({
  limit = 10,
  height = "max-h-[40vh]"
}) => {
  const navigate = useNavigate();
  const [alertsData, setAlertsData] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Drone deployment states
  const [droneAlerts, setDroneAlerts] = useState<DroneAlert[]>([]);
  const [showDroneModal, setShowDroneModal] = useState(false);
  const [selectedDroneAlert, setSelectedDroneAlert] = useState<DroneAlert | null>(null);

  // WebSocket integration
  const { subscribeToTopic, getTopicData, isConnected, data } = useWebSocket();

  const { requestDeployment } = useDroneDeployment();



  // Refs to prevent multiple subscriptions
  const hasSubscribed = useRef(false);
  const lastProcessedData = useRef<any>(null);

  // Debug WebSocket connection
  useEffect(() => {
    console.log('🔗 WebSocket Connection State:', {
      isConnected,
      availableTopics: Object.keys(data),
      theftDetectionData: data['theft_detection']
    });
  }, [isConnected, data]);

  // Subscribe to theft_detection channel ONCE
  useEffect(() => {
    if (!hasSubscribed.current && isConnected) {
      console.log('🔔 Subscribing to theft_detection channel...');
      subscribeToTopic('theft_detection');
      hasSubscribed.current = true;
    }
  }, [subscribeToTopic, isConnected]);

  // Debug: Log ALL WebSocket data changes
  useEffect(() => {
    console.log('📊 All WebSocket Data:', data);
    Object.keys(data).forEach(topic => {
      console.log(`📋 Topic "${topic}":`, data[topic]);
    });
  }, [data]);

  // Process theft detection data with better handling
  useEffect(() => {
    const theftData = getTopicData('theft_detection');

    console.log('🎯 Processing theft detection data:', {
      theftData,
      type: typeof theftData,
      keys: theftData ? Object.keys(theftData) : 'null',
      lastProcessedData: lastProcessedData.current
    });

    // Skip if no data or same as last processed
    if (!theftData || theftData === lastProcessedData.current) {
      console.log('⏭️ Skipping - no data or same as last processed');
      return;
    }

    lastProcessedData.current = theftData;

    try {
      console.log('🔄 Processing new theft detection data...');

      // Handle different data structures
      const processData = (data: any, key: string) => {
        console.log(`🔍 Processing data for key "${key}":`, data);

        let parsedData: TheftDetection;

        // Try to parse the data
        if (typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            console.error('❌ Failed to parse string data:', e);
            return;
          }
        } else if (typeof data === 'object' && data !== null) {
          parsedData = data as TheftDetection;
        } else {
          console.warn('⚠️ Invalid data format:', typeof data, data);
          return;
        }

        console.log('📦 Parsed theft detection data:', parsedData);

        // Validate structure
        if (!parsedData || !parsedData.body || !parsedData.body.cameraId) {
          console.warn('⚠️ Invalid theft detection structure:', parsedData);
          return;
        }

        // Create drone alert
        const newDroneAlert: DroneAlert = {
          id: `drone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data: parsedData,
          timestamp: new Date(),
          status: 'pending'
        };

        console.log('🚁 Creating new drone alert:', newDroneAlert);

        // Add to state
        setDroneAlerts(prev => {
          const exists = prev.some(alert =>
            alert.data.body.cameraId === newDroneAlert.data.body.cameraId &&
            Math.abs(alert.timestamp.getTime() - newDroneAlert.timestamp.getTime()) < 60000
          );

          if (!exists) {
            console.log('✅ Adding new drone alert');
            const updated = [newDroneAlert, ...prev].slice(0, 10);

            // Auto-show modal for new alerts
            setSelectedDroneAlert(newDroneAlert);
            setShowDroneModal(true);

            return updated;
          } else {
            console.log('🔄 Duplicate alert detected');
            return prev;
          }
        });
      };

      // Process the theft data
      if (typeof theftData === 'object' && theftData !== null) {
        Object.entries(theftData).forEach(([key, value]) => {
          processData(value, key);
        });
      }

    } catch (error) {
      console.error('❌ Error processing theft detection data:', error);
    }
  }, [getTopicData('theft_detection')]);

  // Test function to simulate theft detection with Islamabad location
  const simulateTheftDetection = () => {
    console.log('🧪 Simulating theft detection...');

    const mockTheftData: TheftDetection = {
      channel: 'theft_detection',
      body: {
        face_image: 'https://via.placeholder.com/150x100/ff0000/ffffff?text=Face',
        suspect_image: 'https://via.placeholder.com/150x100/ff4444/ffffff?text=Suspect',
        video: 'mock_video.mp4',
        type: 'theft_detection',
        cameraId: 'CAM_ISB_001',
        gender: 'Male',
        color_of_clothes: 'Dark clothing',
        vehicle: 'None',
        vehicle_type: 'None',
        mask: 'Yes',
        face_detect: 'Yes',
        weapon: 'Yes',
        weapon_type: 'Knife',
        time_detection: new Date().toISOString(),
        description: 'Suspicious activity detected - person with weapon near F-7 Markaz',
        location: {
          latitude: 33.7077, // F-7 Markaz, Islamabad
          longitude: 73.0563
        }
      }
    };

    const newDroneAlert: DroneAlert = {
      id: `drone_test_${Date.now()}`,
      data: mockTheftData,
      timestamp: new Date(),
      status: 'pending'
    };

    setDroneAlerts(prev => [newDroneAlert, ...prev]);
    setSelectedDroneAlert(newDroneAlert);
    setShowDroneModal(true);
  };

  // Fetch regular alerts from API
  const fetchAlerts = async () => {
    try {
      setRefreshing(true);
      const response = await getAlerts();
      const sortedAlerts = [...response.data]
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);

      setAlertsData(sortedAlerts);
      const unviewed = sortedAlerts.filter(alert => alert.view === 1).length;
      setUnviewedCount(unviewed);
      localStorage.setItem('notificationCount', unviewed.toString());

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const refreshInterval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle drone deployment actions
  const handleDroneDeployment = async (alertId: string) => {
    console.log('🚁 Processing drone deployment for alert:', alertId);

    const alertLocation = selectedDroneAlert?.data.body.location;

    if (alertLocation) {
      // Request deployment through context
      requestDeployment({
        latitude: alertLocation.latitude,
        longitude: alertLocation.longitude,
        altitude: 15, // Default altitude
        alertId: selectedDroneAlert.data.body.alert_id,
        cameraId: selectedDroneAlert.data.body.cameraId,
        description: selectedDroneAlert.data.body.description
      });

      // Update local state
      setDroneAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status: 'deployed' }
            : alert
        )
      );

      setShowDroneModal(false);

      navigate('/droneManagement');

      alert('🚁 Drone deployment request sent to drone management!');
    } else {
      alert('❌ Location not available for deployment');
    }
  };

  const handleAbortDeployment = (alertId: string) => {
    console.log('❌ Aborting drone deployment for alert:', alertId);

    setDroneAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'aborted' }
          : alert
      )
    );

    setShowDroneModal(false);
    alert('❌ Drone deployment aborted.');
  };

  const handleViewAll = () => {
    navigate("/smartAllNotification");
  };

  const handleOpenAlert = async (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);

    if (alert.view === 1) {
      try {
        await markAlertAsViewed(alert.id);
        setAlertsData(prev =>
          prev.map(a => a.id === alert.id ? { ...a, view: 0 } : a)
        );
        setUnviewedCount(prev => Math.max(0, prev - 1));
        localStorage.setItem('notificationCount', (unviewedCount - 1).toString());
      } catch (error) {
        console.error("Failed to mark alert as viewed:", error);
      }
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
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getAlertTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'motion_detection':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm';
      case 'camera_created':
        return 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm';
      case 'camera_updated':
        return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm';
      case 'theft_detection':
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-sm animate-pulse';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm';
    }
  };

  const getAlertTypeContent = (type: string) => {
    switch (type) {
      case 'motion_detection':
        return (
          <>
            <span className="inline-block w-2 h-2 mr-1 text-center bg-white rounded-full text-nowrap animate-pulse"></span>
            Motion Alert
          </>
        );
      case 'camera_created':
        return (
          <>
            <span className="inline-block mr-1">📷</span>
            Camera Added
          </>
        );
      case 'camera_updated':
        return (
          <>
            <span className="inline-block mr-1">🔄</span>
            Camera Updated
          </>
        );
      case 'theft_detection':
        return (
          <>
            <FaExclamationTriangle className="inline-block mr-1 animate-bounce" />
            THEFT DETECTED
          </>
        );
      default:
        return type.replace(/_/g, ' ');
    }
  };

  // Count total alerts including drone alerts
  const totalUnviewedCount = unviewedCount + droneAlerts.filter(alert => alert.status === 'pending').length;

  return (
    <div className="p-4 bg-white shadow-md rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">Recent Alerts</h2>
          {totalUnviewedCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
              {totalUnviewedCount} new
            </span>
          )}
          {refreshing && (
            <FaSyncAlt className="text-gray-400 animate-spin" size={14} />
          )}
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={handleViewAll}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            View All <FaChevronRight size={12} className="ml-1" />
          </button>
        </div>
      </div>


      {/* Alerts List */}
      <div className={`${height} overflow-y-auto custom-scrollbar2 pr-1`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Drone Alerts */}
            {droneAlerts.length > 0 && droneAlerts.map((droneAlert) => (
              <div
                key={droneAlert.id}
                className={`relative p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 ${droneAlert.status === 'pending' ? 'border-red-400 animate-pulse' :
                  droneAlert.status === 'deployed' ? 'border-green-400' : 'border-gray-400'
                  } shadow-lg hover:shadow-xl transition cursor-pointer`}
                onClick={() => {
                  setSelectedDroneAlert(droneAlert);
                  setShowDroneModal(true);
                }}
              >
                <div className="flex gap-3">
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PiDrone className="text-red-600 animate-bounce" />
                        <h5 className="text-sm font-bold text-red-800">THEFT DETECTED - DRONE REQUIRED</h5>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${droneAlert.status === 'pending' ? 'bg-red-100 text-red-800' :
                        droneAlert.status === 'deployed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {droneAlert.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="mb-2 text-xs text-gray-600">
                      Camera: {droneAlert.data.body.cameraId} | {formatDate(droneAlert.data.body.time_detection)}
                    </p>

                    <p className="mb-2 text-xs text-gray-700">
                      {droneAlert.data.body.description || 'Theft detected by security system'}
                    </p>

                    <div className="flex gap-2 mb-2 text-xs">
                      <span className="px-2 py-1 text-red-700 bg-red-100 rounded">
                        Weapon: {droneAlert.data.body.weapon_type || 'Unknown'}
                      </span>
                      <span className="px-2 py-1 text-yellow-700 bg-yellow-100 rounded">
                        Mask: {droneAlert.data.body.mask || 'Unknown'}
                      </span>
                    </div>

                    {/* Location Info */}
                    {droneAlert.data.body.location && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <FaMapMarkerAlt />
                        <span>
                          {droneAlert.data.body.location.latitude.toFixed(4)}, {droneAlert.data.body.location.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Suspect Image Thumbnail */}
                  {droneAlert.data.body.suspect_image && (
                    <div className="relative flex-shrink-0 group">
                      <div className="w-16 h-12 overflow-hidden bg-gray-100 border-2 border-red-300 rounded-md">
                        <img
                          src={droneAlert.data.body.suspect_image}
                          alt="Suspect"
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Regular Alerts */}
            {alertsData.length === 0 && droneAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500">No recent alerts</p>
              </div>
            ) : (
              alertsData.map((alert) => (
                <div
                  key={alert.id}
                  className={`relative p-4 bg-gray-50 rounded-lg border ${alert.view === 1 ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
                    } shadow-sm hover:shadow transition cursor-pointer`}
                  onClick={() => handleOpenAlert(alert)}
                >
                  <div className="flex gap-3">
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="text-sm font-semibold text-gray-800">{alert.title}</h5>
                        <span className={`text-xs px-2 py-1 absolute right-2 bottom-2 rounded-full flex items-center ${getAlertTypeBadgeStyle(alert.type)}`}>
                          {getAlertTypeContent(alert.type)}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-gray-500">
                        {formatDate(alert.timestamp)}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {alert.description}
                      </p>
                    </div>

                    {(alert.mediaUrl || alert.mediaPath || alert.s3_key) && (
                      <div className="relative flex-shrink-0 group">
                        <div className="w-16 h-12 overflow-hidden bg-gray-100 border border-gray-200 rounded-md">
                          {checkIsImage(alert) ? (
                            <img
                              src={getAlertMediaUrl(alert)}
                              alt=""
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="flex items-center justify-center w-full h-full">
                                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <FaVideo className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center transition bg-black bg-opacity-0 rounded-md group-hover:bg-opacity-30">
                          <FaEye className="text-white transition opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Drone Deployment Modal with Map */}
      {showDroneModal && selectedDroneAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <PiDrone className="text-xl text-red-600 animate-bounce" />
                <h3 className="text-lg font-bold text-red-800">THREAT DETECTED - DRONE DEPLOYMENT REQUIRED</h3>
              </div>
              <button
                onClick={() => setShowDroneModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              {/* Location Map */}
              {selectedDroneAlert.data.body.location && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FaMapMarkerAlt className="text-red-600" />
                    <h4 className="text-lg font-semibold text-gray-800">Threat Location</h4>
                  </div>
                  <ThreatLocationMap
                    latitude={selectedDroneAlert.data.body.location.latitude}
                    longitude={selectedDroneAlert.data.body.location.longitude}
                    cameraId={selectedDroneAlert.data.body.cameraId}
                  />
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Alert Information */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-800">Threat Analysis</h4>

                  <div className="space-y-4">
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h5 className="mb-2 text-sm font-medium text-red-800">Detection Summary</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Total Suspects: <span className="font-bold">{selectedDroneAlert.data.body.detection_summary.total_suspects}</span></div>
                        <div>Total Weapons: <span className="font-bold text-red-600">{selectedDroneAlert.data.body.detection_summary.total_weapons}</span></div>
                        <div>Faces Extracted: <span className="font-bold">{selectedDroneAlert.data.body.detection_summary.total_faces_extracted}</span></div>
                        <div>Clothing Detected: <span className="font-bold">{selectedDroneAlert.data.body.detection_summary.clothing_classifications}</span></div>
                      </div>
                    </div>

                    <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                      <h5 className="mb-2 text-sm font-medium text-yellow-800">Suspect Details</h5>
                      <div className="space-y-1 text-xs">
                        <p>Gender: <span className="font-medium">{selectedDroneAlert.data.body.gender}</span></p>
                        <p>Clothing: <span className="font-medium">{selectedDroneAlert.data.body.clothing_info.clothing_type}</span></p>
                        {selectedDroneAlert.data.body.suspects[0] && (
                          <p>Confidence: <span className="font-medium">{Math.round(selectedDroneAlert.data.body.suspects[0].confidence * 100)}%</span></p>
                        )}
                      </div>
                    </div>

                    {selectedDroneAlert.data.body.weapon && (
                      <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <h5 className="mb-2 text-sm font-medium text-orange-800">Weapon Information</h5>
                        <div className="space-y-1 text-xs">
                          <p>Type: <span className="font-medium">{selectedDroneAlert.data.body.weapon_type}</span></p>
                          {selectedDroneAlert.data.body.weapons[0] && (
                            <p>Confidence: <span className="font-medium">{Math.round(selectedDroneAlert.data.body.weapons[0].confidence * 100)}%</span></p>
                          )}
                          <p>Status: <span className="font-medium text-red-600">ACTIVE THREAT</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Evidence */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold text-gray-800">Visual Evidence</h4>

                  <div className="space-y-4">
                    {/* Original Frame */}
                    {selectedDroneAlert.data.body.images.original_frame && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Original Frame:</p>
                        <img
                          src={selectedDroneAlert.data.body.images.original_frame}
                          alt="Original Frame"
                          className="object-cover w-full h-40 border rounded-lg"
                        />
                      </div>
                    )}

                    {/* Annotated Frame */}
                    {selectedDroneAlert.data.body.images.annotated_frame && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Annotated Frame (with detections):</p>
                        <img
                          src={selectedDroneAlert.data.body.images.annotated_frame}
                          alt="Annotated Frame"
                          className="object-cover w-full h-40 border rounded-lg"
                        />
                      </div>
                    )}

                    {/* Evidence Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Suspect Image */}
                      {selectedDroneAlert.data.body.images.suspects[0] && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-700">Suspect:</p>
                          <img
                            src={selectedDroneAlert.data.body.images.suspects[0]}
                            alt="Suspect"
                            className="object-cover w-full h-20 border rounded"
                          />
                        </div>
                      )}

                      {/* Face Image */}
                      {selectedDroneAlert.data.body.images.faces[0] && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-700">Face:</p>
                          <img
                            src={selectedDroneAlert.data.body.images.faces[0]}
                            alt="Face"
                            className="object-cover w-full h-20 border rounded"
                          />
                        </div>
                      )}

                      {/* Weapon Image */}
                      {selectedDroneAlert.data.body.images.weapons[0] && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-700">Weapon:</p>
                          <img
                            src={selectedDroneAlert.data.body.images.weapons[0]}
                            alt="Weapon"
                            className="object-cover w-full h-20 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deployment Instructions */}
              <div className="p-4 mt-6 border border-orange-200 rounded-lg bg-orange-50">
                <h5 className="mb-2 text-sm font-medium text-orange-800">🚁 Drone Deployment Instructions</h5>
                <ul className="space-y-1 text-xs text-orange-700">
                  <li>• Drone will be dispatched to coordinates: {selectedDroneAlert.data.body.location?.latitude}, {selectedDroneAlert.data.body.location?.longitude}</li>
                  <li>• Expected arrival time: 3-5 minutes</li>
                  <li>• Live camera feed will be available</li>
                  <li>• Local authorities will be notified automatically</li>
                  {selectedDroneAlert.data.body.weapons[0] && (
                    <li>• Threat level: HIGH - Weapon detected with {Math.round(selectedDroneAlert.data.body.weapons[0].confidence * 100)}% confidence</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  if (selectedDroneAlert.data.body.location) {
                    const { latitude, longitude } = selectedDroneAlert.data.body.location;
                    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 transition border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100"
              >
                <FaMapMarkerAlt />
                Open in Maps
              </button>

              <button
                onClick={() => handleAbortDeployment(selectedDroneAlert.id)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 transition border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100"
              >
                <FaTimes />
                Abort
              </button>

              <button
                onClick={() => handleDroneDeployment(selectedDroneAlert.id)}
                className="flex items-center gap-2 px-4 py-2 ml-auto text-white transition bg-red-600 border border-red-600 rounded-md hover:bg-red-700"
              >
                <PiDrone />
                Deploy Drone Now
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Regular Alert Modal */}
      {isModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">{selectedAlert.title}</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-3 py-1.5 rounded-full flex items-center ${getAlertTypeBadgeStyle(selectedAlert.type)}`}>
                  {getAlertTypeContent(selectedAlert.type)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="mb-4 text-gray-700">{selectedAlert.description}</p>

              {(selectedAlert.mediaUrl || selectedAlert.mediaPath || selectedAlert.s3_key) && (
                <div className="p-2 mb-4 border border-gray-200 rounded-lg bg-gray-50">
                  {checkIsImage(selectedAlert) ? (
                    <img
                      src={getAlertMediaUrl(selectedAlert)}
                      alt="Alert media"
                      className="max-w-full mx-auto rounded max-h-[300px]"
                      onError={(e) => {
                        console.error("Failed to load image:", getAlertMediaUrl(selectedAlert));
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="flex flex-col items-center justify-center p-4">
                            <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-gray-500 text-sm">Unable to load image</p>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <FaVideo className="w-12 h-12 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Video preview not available</p>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Alert Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Alert ID</p>
                    <p className="font-medium">{selectedAlert.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Camera ID</p>
                    <p className="font-medium">{selectedAlert.cameraId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Node ID</p>
                    <p className="font-medium">{selectedAlert.nodeId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Motion Type</p>
                    <p className="font-medium">{selectedAlert.motionType || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
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

export default RecentAlerts;