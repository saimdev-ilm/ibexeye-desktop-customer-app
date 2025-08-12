// components/Smart/HierarchicalPanel.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaVideo, FaCircle, FaThermometerHalf, FaTint, FaWind, FaLeaf,
   FaBuilding, FaIndustry, FaWarehouse, FaHouseUser,
  FaMapMarkerAlt, FaCheck, FaExclamationTriangle, FaShieldAlt,
  FaHome, FaBed, FaCog, FaEye, FaSyncAlt
} from 'react-icons/fa';
import { useMode } from '../../contexts/ModeContext';
import { useNavigate } from 'react-router-dom';
import { useWebSocket, useWebSocketData } from '../../contexts/WebSocketContext';
import { getAllZones, Zone } from '../../services/zoneService';
import { getCameraById, Camera } from '../../services/cameraService';
import { getSensorsByDeviceId, Sensor } from '../../services/sensorService';
import CameraCard from './CameraCard';

interface EnhancedCamera extends Camera {
  cloudHls?: string | null;
  networkId: string;
  host: string;
}

interface EnhancedSensor extends Sensor {
  type?: string;
  dataType: string;
  lastReading: number | null;
  notificationThreshold: number;
}

interface EnhancedZone extends Zone {
  enhancedCameras: EnhancedCamera[];
  cameras: Camera[];
  sensors: EnhancedSensor[];
}

const HierarchicalPanel: React.FC = () => {
  const { modes, activeMode } = useMode();
  const [zones, setZones] = useState<EnhancedZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<EnhancedZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [sensorValues, setSensorValues] = useState<any[]>([]);
  const { isConnected: socketConnected } = useWebSocket();
  const homeData = useWebSocketData('home');
  const navigate = useNavigate();

  // Process sensor data from WebSocket
  useEffect(() => {
    if (homeData) {
      try {
        if (homeData.messages && Array.isArray(homeData.messages)) {
          setSensorValues(homeData.messages);
        } else {
          setSensorValues(Array.isArray(homeData) ? homeData : []);
        }
      } catch (error) {
        console.error('❌ Error processing sensor data:', error);
      }
    }
  }, [homeData]);

  // Get icon for different zone types
  const getZoneIcon = useCallback((zone: Zone) => {
    const zoneType = (zone.type || '').toLowerCase();
    switch (zoneType) {
      case 'factory': return <FaIndustry size={20} className="text-red-500" />;
      case 'warehouse': return <FaWarehouse size={20} className="text-blue-500" />;
      case 'office': return <FaBuilding size={20} className="text-indigo-500" />;
      case 'residential': return <FaHouseUser size={20} className="text-purple-500" />;
      default: return <FaMapMarkerAlt size={20} className="text-blue-500" />;
    }
  }, []);

  // Get icon for different sensor types
  const getSensorIcon = useCallback((sensorType?: string) => {
    const type = sensorType?.toLowerCase?.() ?? '';
    if (type.includes('temp')) return <FaThermometerHalf className="text-red-500" size={16} />;
    if (type.includes('humid')) return <FaTint className="text-blue-500" size={16} />;
    if (type.includes('air') || type.includes('quality')) return <FaWind className="text-green-500" size={16} />;
    if (type.includes('co2')) return <FaLeaf className="text-emerald-500" size={16} />;
    return <FaCircle className="text-gray-500" size={12} />;
  }, []);

  // Format sensor values
  const getFormattedSensorValue = useCallback((value: string | number | null | undefined, sensorType?: string) => {
    if (value === null || value === undefined) return 'No Data';
    const type = sensorType?.toLowerCase?.() ?? '';
    const formatted = typeof value === 'number' ? value.toFixed(1) : value;
    if (type.includes('temp')) return `${formatted}°C`;
    if (type.includes('humid')) return `${formatted}%`;
    if (type.includes('air') || type.includes('quality')) return `${formatted} AQI`;
    if (type.includes('co2')) return `${formatted} ppm`;
    return String(formatted);
  }, []);

  // Get mode icon
  const getModeIcon = useCallback((mode: any) => {
    switch (mode.modeType) {
      case 'ARM_AWAY': return <FaShieldAlt className="text-cyan-500" size={24} />;
      case 'ARM_HOME': return <FaHome className="text-yellow-500" size={24} />;
      case 'STANDBY': return <FaBed className="text-blue-500" size={24} />;
      default: return <FaCog className="text-purple-500" size={24} />;
    }
  }, []);

  // Load camera details for a zone
  const loadCameraDetails = useCallback(async (zone: EnhancedZone) => {
    const cameras = Array.isArray(zone.cameras) ? zone.cameras : [];
    if (cameras.length === 0) return;

    setLoadingCameras(true);
    try {
      const enhancedCameras: EnhancedCamera[] = [];

      for (const camera of cameras) {
        try {
          const cameraId = typeof camera.id === 'string' ? camera.id : camera.id.toString();
          const cameraDetails = await getCameraById(cameraId);

          const enhancedCamera: EnhancedCamera = {
            ...camera,
            id: typeof camera.id === 'number' ? camera.id : parseInt(camera.id.toString()),
            networkId: camera.network_id || cameraDetails?.network_id || '',
            cloudHls: cameraDetails?.cloudHls || null,
            host: cameraDetails?.host || camera.host || '',
          };

          enhancedCameras.push(enhancedCamera);
        } catch (error) {
          console.error(`❌ Failed to load camera ${camera.id}:`, error);
          enhancedCameras.push({
            ...camera,
            id: typeof camera.id === 'number' ? camera.id : parseInt(camera.id.toString()),
            networkId: camera.network_id || '',
            host: camera.host || '',
            cloudHls: null,
          } as EnhancedCamera);
        }
      }

      const enhancedZone = { ...zone, enhancedCameras };
      setSelectedZone(enhancedZone);
      setZones(prevZones => prevZones.map(z => z.id === zone.id ? enhancedZone : z));
    } catch (error) {
      console.error('❌ Failed to load camera details:', error);
    } finally {
      setLoadingCameras(false);
    }
  }, []);

  // Fetch zones and sensors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [zonesData, sensorsData] = await Promise.all([
          getAllZones(),
          getSensorsByDeviceId()
        ]);

        const enhancedZones = zonesData.map(zone => {
          const zoneSensors = sensorsData.filter(sensor =>
            zone.sensors?.find(s => s.mqttTopic === sensor.mqttTopic)
          ).map(sensor => ({
            ...sensor,
            type: sensor.dataType || '',
            notificationThreshold: sensor.notificationThreshold || 0,
            dataType: sensor.dataType || '',
            lastReading: sensor.lastReading ?? null,
          }) as EnhancedSensor);

          return {
            ...zone,
            enhancedCameras: [],
            cameras: Array.isArray(zone.cameras) ? zone.cameras : [],
            sensors: zoneSensors
          };
        });

        setZones(enhancedZones);
        if (enhancedZones.length > 0) {
          const firstZone = enhancedZones[0];
          setSelectedZone(firstZone);
          if (firstZone.cameras?.length > 0) {
            loadCameraDetails(firstZone);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadCameraDetails]);

  // Handle zone selection
  const handleZoneSelect = useCallback((zone: EnhancedZone) => {
    setSelectedZone(zone);
    if (!zone.enhancedCameras || zone.enhancedCameras.length === 0) {
      if (zone.cameras && zone.cameras.length > 0) {
        loadCameraDetails(zone);
      }
    }
  }, [loadCameraDetails]);

  // Handle camera click
  const handleCameraClick = useCallback((camera: Camera) => {
    const cameraId = typeof camera.id === 'string' ? camera.id : camera.id.toString();
    navigate(`/camera/${cameraId}`, { state: { camera } });
  }, [navigate]);

  // Filter zones by active mode
  const filteredZones = useMemo(() => {
    if (!activeMode || !activeMode.zones) {
      console.log('No active mode or zones, showing all zones');
      return zones;
    }

    const filtered = zones.filter(zone =>
      activeMode.zones?.some(modeZone => modeZone.id === zone.id)
    );

    console.log(`Active mode: ${activeMode.name}, Total zones: ${zones.length}, Filtered zones: ${filtered.length}`);
    return filtered;
  }, [zones, activeMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-2xl">
        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <span className="ml-3 text-sm font-medium text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Active Mode Header */}
      {activeMode && (
        <div className="p-4 mb-4 bg-white shadow-md rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 mr-3 bg-blue-100 rounded-full">
                {getModeIcon(activeMode)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Active Mode: {activeMode.name}</h2>
                <p className="text-sm text-gray-600">{activeMode.description}</p>
              </div>
            </div>
            <div className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg">
              Active
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Zones List */}
        <div className="w-1/4 p-4 bg-white shadow-md rounded-xl">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            {activeMode ? `Zones in ${activeMode.name}` : 'All Zones'}
          </h3>

          {filteredZones.length === 0 ? (
            <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
              <FaExclamationTriangle className="mx-auto mb-2 text-gray-400" size={24} />
              <p>No zones configured for this mode</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone)}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${zone.id === selectedZone?.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 bg-white'
                    }`}
                >
                  <div className={`p-2 rounded-full ${zone.id === selectedZone?.id ? 'text-blue-600 bg-blue-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                    {getZoneIcon(zone)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{zone.name}</span>
                      {zone.id === selectedZone?.id && <FaCheck className="text-blue-500" size={12} />}
                    </div>
                    <div className="text-xs text-gray-500">
                      {zone.cameras?.length || 0} cameras, {zone.sensors?.length || 0} sensors
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Zone Content */}
        <div className="flex-1">
          {selectedZone ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Cameras Section */}
              <div className="p-4 bg-white shadow-md rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center text-lg font-medium text-gray-800">
                    <FaVideo className="mr-2 text-blue-500" />
                    Cameras
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-lg">
                      {selectedZone.cameras?.length || 0}
                    </span>
                    <button
                      onClick={() => loadCameraDetails(selectedZone)}
                      className="p-1.5 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200"
                      title="Refresh cameras"
                    >
                      <FaSyncAlt size={12} />
                    </button>
                  </div>
                </div>

                {selectedZone.cameras?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <FaVideo className="mx-auto mb-2 text-gray-400" size={24} />
                    <p>No cameras in this zone</p>
                  </div>
                ) : loadingCameras ? (
                  <div className="flex items-center justify-center h-32 rounded-lg bg-gray-50">
                    <div className="w-6 h-6 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading cameras...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {(selectedZone.enhancedCameras || selectedZone.cameras || []).map(camera => (
                      <CameraCard
                        key={camera.id}
                        camera={camera}
                        onClick={handleCameraClick}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sensors Section */}
              <div className="p-4 bg-white shadow-md rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center text-lg font-medium text-gray-800">
                    <FaCircle className="mr-2 text-green-500" size={14} />
                    Sensors
                  </h4>
                  <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-lg">
                    {selectedZone.sensors?.length || 0}
                  </span>
                </div>

                {selectedZone.sensors?.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <FaCircle className="mx-auto mb-2 text-gray-400" size={14} />
                    <p>No sensors in this zone</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedZone.sensors?.map(sensor => {
                      const matchedEntry = sensorValues?.find((entry: any) => entry.topic === sensor.mqttTopic);
                      const matchedValue = matchedEntry?.message || sensor.lastReading;

                      return (
                        <div key={sensor.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md">
                          <div className="flex items-center">
                            <div className="p-2 mr-3 bg-gray-100 rounded-full">
                              {getSensorIcon(sensor.dataType)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{sensor.name}</div>
                              <div className="text-xs text-gray-500">{sensor.mqttTopic.split('/').pop()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-700">
                              {getFormattedSensorValue(matchedValue, sensor.dataType)}
                            </div>
                            {!socketConnected && (
                              <div className="text-xs text-gray-400">(cached)</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-white shadow-md rounded-xl">
              <FaEye className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="mb-2 text-lg font-medium">Select a Zone</h3>
              <p>Choose a zone from the list to view its cameras and sensors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HierarchicalPanel;