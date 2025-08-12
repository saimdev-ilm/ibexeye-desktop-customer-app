import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  FaVideo,
  FaCircle,
  FaCog,
  FaInfoCircle,
  FaThermometerHalf,
  FaTint,
  FaWind,
  FaLeaf,
  FaFilter,
  FaCheck,
  FaChevronRight,
  FaBuilding,
  FaIndustry,
  FaWarehouse,
  FaHouseUser,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { getAllZones, Zone, Camera, Sensor } from '../../services/zoneService';
import { getCameraById } from '../../services/cameraService';
import { useNavigate } from 'react-router-dom';
import CameraCard from './CameraCard';
import { useWebSocket, useWebSocketData } from '../../contexts/WebSocketContext';
import { getSensorsByDeviceId } from '../../services/sensorService';

// ✅ Fixed interfaces
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

// ✅ Extract components remain same
const SensorCard: React.FC<{
  sensor: EnhancedSensor;
  sensorValues: any[];
  socketConnected: boolean;
  getSensorIcon: (type?: string) => React.ReactNode;
  getFormattedSensorValue: (value: string | number | null | undefined, type?: string) => string;
}> = ({ sensor, sensorValues, socketConnected, getSensorIcon, getFormattedSensorValue }) => {
  const matchedEntry = sensorValues?.find((entry: any) => entry.topic === sensor.mqttTopic);
  const matchedValue = matchedEntry?.message || sensor.lastReading;
  const numericValue = matchedValue ? parseFloat(matchedValue.toString()) : null;

  const status = numericValue !== null && sensor.notificationThreshold > 0
    ? numericValue >= sensor.notificationThreshold
      ? 'Danger'
      : 'Idle'
    : 'No Data';

  const statusColor =
    status === 'Danger' ? 'text-red-600' :
      status === 'Idle' ? 'text-green-600' : 'text-gray-400';

  const cardStyle =
    status === 'Danger'
      ? 'bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500'
      : status === 'Idle'
        ? 'bg-gradient-to-r from-green-50 to-white border-l-4 border-green-500'
        : 'bg-white';

  const getStatusIcon = () => {
    switch (status) {
      case 'Danger':
        return <FaInfoCircle className="text-red-600" size={14} />;
      case 'Idle':
        return <FaCheck className="text-green-600" size={14} />;
      default:
        return <FaCircle className="text-gray-400" size={14} />;
    }
  };

  return (
    <div
      key={sensor.id}
      className={`flex items-center justify-between p-4 transition-colors border rounded-lg hover:shadow-md cursor-pointer group ${cardStyle}`}
    >
      <div className="flex items-center flex-1">
        <div className={`p-3 mr-3 rounded-full ${status === 'Danger' ? 'bg-red-100' : 'bg-gray-100'}`}>
          {getSensorIcon(sensor.dataType)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-800">{sensor.name}</div>
          <div className="flex items-center mt-1">
            {getStatusIcon()}
            <span className={`text-xs ml-1 font-medium ${statusColor}`}>
              {status}
            </span>
            {!socketConnected && status !== 'No Data' && (
              <span className="ml-2 text-xs text-gray-500">(from cache)</span>
            )}
          </div>
          {numericValue !== null && sensor.notificationThreshold > 0 && (
            <div className="w-full h-1 mt-1 overflow-hidden bg-gray-200 rounded-full">
              <div
                className={`h-full ${numericValue >= sensor.notificationThreshold ? 'bg-red-500' :
                  numericValue >= sensor.notificationThreshold * 0.75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                style={{ width: `${Math.min(100, Math.max(0, (numericValue / sensor.notificationThreshold) * 100))}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="pl-3 text-right">
        <div className={`text-lg font-bold ${statusColor}`}>
          {getFormattedSensorValue(matchedValue, sensor.dataType)}
        </div>
        <div
          className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500"
          title={sensor.mqttTopic}
        >
          <span className="truncate max-w-[100px]">
            {sensor.mqttTopic.split('/').pop()}
          </span>
          <FaChevronRight size={10} className="transition-opacity opacity-0 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
};

const SensorGroup: React.FC<{
  type: string;
  sensors: EnhancedSensor[];
  sensorValues: any[];
  socketConnected: boolean;
  getSensorIcon: (type?: string) => React.ReactNode;
  getFormattedSensorValue: (value: string | number | null | undefined, type?: string) => string;
}> = ({ type, sensors, sensorValues, socketConnected, getSensorIcon, getFormattedSensorValue }) => {
  return (
    <div key={type} className="space-y-3">
      <h4 className="flex items-center text-sm font-medium tracking-wider text-gray-500 uppercase">
        {getSensorIcon(type)}
        <span className="ml-2 capitalize">
          {type === 'temp' ? 'Temperature' :
            type === 'humid' ? 'Humidity' :
              type === 'air' ? 'Air Quality' :
                type === 'co2' ? 'CO2 Levels' :
                  type}
        </span>
        <span className="ml-2 text-xs font-normal text-gray-400">
          ({sensors.length})
        </span>
      </h4>
      <div className="grid grid-cols-1 gap-3">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            sensorValues={sensorValues}
            socketConnected={socketConnected}
            getSensorIcon={getSensorIcon}
            getFormattedSensorValue={getFormattedSensorValue}
          />
        ))}
      </div>
    </div>
  );
};

const ZoneCard: React.FC<{
  zone: EnhancedZone;
  selectedZoneId: number | null;
  onSelect: (zone: EnhancedZone) => void;
  getZoneIcon: (zone: Zone) => React.ReactElement;
}> = ({ zone, selectedZoneId, onSelect, getZoneIcon }) => {
  const cameras = zone.cameras || [];
  const sensors = zone.sensors || [];

  return (
    <div
      onClick={() => onSelect(zone)}
      className={`flex items-center space-x-2 px-4 py-3 border rounded-xl my-2 cursor-pointer transition-all 
        ${zone.id === selectedZoneId
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 bg-white'
        }`}
    >
      <div className={`p-2 rounded-full ${zone.id === selectedZoneId ? 'text-blue-600 bg-blue-100' : 'text-gray-600 bg-gray-100'}`}>
        {getZoneIcon(zone)}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{zone.name}</span>
          {zone.id === selectedZoneId && <FaCheck className="text-blue-500" size={12} />}
        </div>
        <div className="text-xs text-gray-500">
          {cameras.length} {cameras.length === 1 ? 'camera' : 'cameras'},
          {' '}{sensors.length} {sensors.length === 1 ? 'sensor' : 'sensors'}
        </div>
        <div className={`mt-1 px-2 py-0.5 text-xs rounded-full text-center w-fit
          ${zone.id === selectedZoneId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
          {zone.type}
        </div>
      </div>
    </div>
  );
};

const ZonesPanel: React.FC = () => {
  const [zones, setZones] = useState<EnhancedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<EnhancedZone | null>(null);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [cameraFilter, setCameraFilter] = useState<'all' | 'active'>('all');
  const navigate = useNavigate();
  const [sensorValues, setSensorValues] = useState<any[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Use refs to prevent dependency issues
  const selectedZoneRef = useRef<EnhancedZone | null>(null);
  const zonesRef = useRef<EnhancedZone[]>([]);
  
  // ✅ Keep refs in sync
  useEffect(() => {
    selectedZoneRef.current = selectedZone;
  }, [selectedZone]);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  const { isConnected: socketConnected, connectionState } = useWebSocket();
  const homeData = useWebSocketData('home');

  // ✅ Process home data from Context
  useEffect(() => {
    if (homeData) {
      try {
        if (homeData.messages && Array.isArray(homeData.messages)) {
          setSensorValues(homeData.messages);
        } else {
          setSensorValues(Array.isArray(homeData) ? homeData : []);
        }
        setSocketError(null);
      } catch (error) {
        console.error('❌ Error processing home data:', error);
      }
    }
  }, [homeData, socketConnected, connectionState]);

  // ✅ Memoized static functions
  const getZoneIcon = useCallback((zone: Zone) => {
    const zoneType = (zone.type || '').toLowerCase();
    switch (zoneType) {
      case 'factory':
        return <FaIndustry size={24} className="text-red-500" />;
      case 'warehouse':
        return <FaWarehouse size={24} className="text-blue-500" />;
      case 'office':
        return <FaBuilding size={24} className="text-indigo-500" />;
      case 'residential':
        return <FaHouseUser size={24} className="text-purple-500" />;
      default:
        return <FaMapMarkerAlt size={24} className="text-blue-500" />;
    }
  }, []);

  const getSensorIcon = useCallback((sensorType?: string) => {
    const type = sensorType?.toLowerCase?.() ?? '';
    if (type.includes('temp')) return <FaThermometerHalf className="text-red-500" size={18} />;
    if (type.includes('humid')) return <FaTint className="text-blue-500" size={18} />;
    if (type.includes('air') || type.includes('quality')) return <FaWind className="text-green-500" size={18} />;
    if (type.includes('co2')) return <FaLeaf className="text-emerald-500" size={18} />;
    return <FaCircle className="text-gray-500" size={14} />;
  }, []);

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

  // ✅ FIXED: Remove dependency on loadCameraDetails to prevent infinite loop
  const loadCameraDetails = useCallback(async (zone: EnhancedZone) => {
    const cameras = Array.isArray(zone.cameras) ? zone.cameras : [];
    if (cameras.length === 0) {
      console.log('📷 No cameras to load for zone:', zone.name);
      return;
    }

    console.log('🔄 Loading camera details for zone:', zone.name, 'cameras:', cameras.length);
    setLoadingCameras(true);
    
    try {
      const enhancedCameras: EnhancedCamera[] = [];

      // Process cameras in batches
      for (let i = 0; i < cameras.length; i += 3) { // Reduced batch size
        const batch = cameras.slice(i, i + 3);

        const batchPromises = batch.map(async (camera) => {
          try {
            console.log('📷 Loading details for camera:', camera.id);
            const cameraId = typeof camera.id === 'string' ? camera.id : camera.id.toString();
            const cameraDetails = await getCameraById(cameraId);

            const enhancedCamera: EnhancedCamera = {
              ...camera,
              id: typeof camera.id === 'number' ? camera.id : parseInt(camera.id.toString()),
              networkId: camera.network_id || cameraDetails?.network_id || '',
              cloudHls: cameraDetails?.cloudHls || null,
              host: cameraDetails?.host || camera.host || '',
            };

            console.log('✅ Enhanced camera:', enhancedCamera.id, 'cloudHls:', enhancedCamera.cloudHls);
            return enhancedCamera;
          } catch (error) {
            console.error(`❌ Failed to load details for camera ${camera.id}:`, error);
            return {
              ...camera,
              id: typeof camera.id === 'number' ? camera.id : parseInt(camera.id.toString()),
              networkId: camera.network_id || '',
              host: camera.host || '',
              cloudHls: null,
            } as EnhancedCamera;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        enhancedCameras.push(...batchResults);
      }

      console.log('✅ All camera details loaded:', enhancedCameras.length);

      // ✅ Update both selectedZone and zones using current values
      const enhancedZone = {
        ...zone,
        enhancedCameras: enhancedCameras,
      };

      // Update selected zone if it matches
      if (selectedZoneRef.current && zone.id === selectedZoneRef.current.id) {
        setSelectedZone(enhancedZone);
      }

      // Update zones array
      setZones(prevZones =>
        prevZones.map(z => z.id === zone.id ? enhancedZone : z)
      );

    } catch (error) {
      console.error('❌ Failed to load camera details:', error);
    } finally {
      setLoadingCameras(false);
    }
  }, []); // ✅ Empty dependency array

  // ✅ FIXED: Fetch zones only once on mount
  useEffect(() => {
    let mounted = true;

    const fetchZones = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching zones...');
        const zonesData = await getAllZones();

        if (!mounted) return;

        const enhancedZones = zonesData.map(zone => ({
          ...zone,
          enhancedCameras: [],
          cameras: Array.isArray(zone.cameras) ? zone.cameras : [],
          sensors: Array.isArray(zone.sensors) ? zone.sensors : []
        }));
        
        console.log('✅ Zones loaded:', enhancedZones.length);
        setZones(enhancedZones);

        if (enhancedZones.length > 0) {
          const firstZone = enhancedZones[0];
          setSelectedZone(firstZone);
          console.log('🎯 Selected first zone:', firstZone.name);
          
          // ✅ Load camera details after a short delay to prevent race conditions
          setTimeout(() => {
            if (mounted && firstZone.cameras && firstZone.cameras.length > 0) {
              loadCameraDetails(firstZone);
            }
          }, 100);
        }
        setError(null);
      } catch (err) {
        console.error('❌ Failed to fetch zones:', err);
        if (mounted) {
          setError('Failed to load zones. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchZones();

    return () => {
      mounted = false;
    };
  }, []); // ✅ Empty dependency array

  // ✅ FIXED: Fetch sensors only when selectedZone ID changes
  useEffect(() => {
    if (!selectedZone?.id) return;

    let mounted = true;
    const fetchSensors = async () => {
      try {
        console.log('🔄 Fetching sensors for zone:', selectedZone.name);
        const fullSensors = await getSensorsByDeviceId();

        if (!mounted) return;

        setSelectedZone(prev => {
          if (!prev || prev.id !== selectedZone.id) return prev;
          
          const matchedSensors: EnhancedSensor[] = fullSensors
            .filter(sensor => prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic))
            .map(sensor => {
              const originalSensor = prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic);
              return {
                ...sensor,
                type: sensor.dataType || originalSensor?.dataType || '',
                notificationThreshold: sensor.notificationThreshold || originalSensor?.notificationThreshold || 0,
                dataType: sensor.dataType || originalSensor?.dataType || '',
                lastReading: sensor.lastReading ?? originalSensor?.lastReading ?? null,
              } as EnhancedSensor;
            });
          
          return {
            ...prev,
            sensors: matchedSensors
          } as EnhancedZone;
        });
      } catch (error) {
        console.error('❌ Error fetching full sensors:', error);
      }
    };

    fetchSensors();

    return () => {
      mounted = false;
    };
  }, [selectedZone?.id]); // ✅ Only depend on selectedZone.id

  // ✅ Handle zone selection
  const handleSelectZone = useCallback((zone: EnhancedZone) => {
    console.log('🎯 Zone selected:', zone.name);
    setSelectedZone(zone);

    // Load camera details if not already loaded
    if (!zone.enhancedCameras || zone.enhancedCameras.length === 0) {
      if (zone.cameras && zone.cameras.length > 0) {
        console.log('🔄 Loading cameras for newly selected zone');
        loadCameraDetails(zone);
      }
    }
  }, [loadCameraDetails]);

  // ✅ Other callbacks remain same
  const handleRefreshSensors = useCallback(async () => {
    if (isRefreshing || !selectedZone) return;

    setIsRefreshing(true);
    try {
      const fullSensors = await getSensorsByDeviceId();
      setSelectedZone(prev => {
        if (!prev) return null;
        const matchedSensors = fullSensors
          .filter(sensor => prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic))
          .map(sensor => {
            const originalSensor = prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic);
            return {
              ...sensor,
              type: sensor.dataType || originalSensor?.dataType || '',
              notificationThreshold: sensor.notificationThreshold || originalSensor?.notificationThreshold || 0,
            };
          });
        return {
          ...prev,
          sensors: matchedSensors
        };
      });
    } catch (error) {
      console.error('Error refreshing sensor data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, selectedZone]);

  const handleReconnectWebSocket = useCallback(async () => {
    setSocketError(null);
    console.log('🔄 ZonesPanel: Reconnect requested, Context will handle it');
  }, []);

  const handleCameraClick = useCallback((camera: Camera) => {
    const cameraId = typeof camera.id === 'string' ? camera.id : camera.id.toString();
    navigate(`/camera/${cameraId}`, {
      state: { camera }
    });
  }, [navigate]);

  // ✅ Memoized calculations
  const getFilteredCameras = useCallback(() => {
    if (!selectedZone || !Array.isArray(selectedZone.enhancedCameras)) {
      return [];
    }
    
    if (cameraFilter === 'active') {
      return selectedZone.enhancedCameras.filter(
        camera => camera.cloudHls && camera.cloudHls.trim() !== ''
      );
    }
    return selectedZone.enhancedCameras;
  }, [selectedZone?.enhancedCameras, cameraFilter]); // ✅ More specific dependency

  const filteredCameras = useMemo(() => getFilteredCameras(), [getFilteredCameras]);

  const activeCamerasCount = useMemo(() =>
    selectedZone && Array.isArray(selectedZone.enhancedCameras)
      ? selectedZone.enhancedCameras.filter(camera => camera.cloudHls && camera.cloudHls.trim() !== '').length
      : 0
    , [selectedZone?.enhancedCameras]);

  const groupedSensors = useMemo(() => {
    if (!selectedZone || !Array.isArray(selectedZone.sensors)) return {};
    return selectedZone.sensors.reduce<Record<string, EnhancedSensor[]>>((groups, sensor) => {
      const type = (sensor.dataType || 'other').toLowerCase();
      if (!groups[type]) groups[type] = [];
      groups[type].push(sensor);
      return groups;
    }, {});
  }, [selectedZone?.sensors]);

  const sortedSensorTypes = useMemo(() => {
    const typeOrder = ['temp', 'humid', 'air', 'co2', 'other'];
    return Object.keys(groupedSensors).sort((a, b) => {
      const indexA = typeOrder.findIndex(t => a.includes(t));
      const indexB = typeOrder.findIndex(t => b.includes(t));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [groupedSensors]);

  const zoneCameras = useMemo(() =>
    selectedZone && Array.isArray(selectedZone.cameras) ? selectedZone.cameras : []
    , [selectedZone?.cameras]);

  const zoneSensors = useMemo(() =>
    selectedZone && Array.isArray(selectedZone.sensors) ? selectedZone.sensors : []
    , [selectedZone?.sensors]);

  // ✅ Simple debug logging (only when needed)
  useEffect(() => {
    if (selectedZone) {
      console.log('🎯 Zone Debug:', {
        name: selectedZone.name,
        regularCameras: selectedZone.cameras?.length || 0,
        enhancedCameras: selectedZone.enhancedCameras?.length || 0,
        loading: loadingCameras
      });
    }
  }, [selectedZone?.name, selectedZone?.cameras?.length, selectedZone?.enhancedCameras?.length, loadingCameras]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-2xl">
        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <span className="ml-3 text-sm font-medium text-gray-600">Loading zones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-700 bg-white shadow-md rounded-2xl">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="mr-2" size={16} />
          <p className="font-semibold">Error</p>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 mt-2 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="p-4 text-yellow-700 bg-white shadow-md rounded-2xl">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="mr-2" size={16} />
          <p className="font-semibold">No Zones Found</p>
        </div>
        <p className="text-sm">No zones have been created yet. Create a zone to start monitoring.</p>
      </div>
    );
  }

  if (!selectedZone) {
    return (
      <div className="p-4 text-yellow-700 bg-white shadow-md rounded-2xl">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="mr-2" size={16} />
          <p className="font-semibold">No Selected Zone</p>
        </div>
        <p className="text-sm">No zone selected. Please select a zone to view its details.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* WebSocket Status Banner */}
      {(socketError || !socketConnected) && (
        <div className="flex items-center justify-between p-3 mb-4 border border-yellow-300 rounded-lg bg-yellow-50">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2 text-yellow-500" size={16} />
            <span className="text-sm text-yellow-700">
              {socketError || 'Live data connection unavailable. Sensor data may not be current.'}
            </span>
          </div>
          <button
            onClick={handleReconnectWebSocket}
            className="flex items-center px-3 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-lg hover:bg-yellow-200"
          >
            <FaSyncAlt className="mr-1" size={12} />
            Reconnect
          </button>
        </div>
      )}

      {/* Main content layout */}
      <div className="flex gap-4">
        {/* Zone selection sidebar */}
        <div className="w-1/5 p-3 bg-white shadow-md rounded-2xl">
          <h2 className="mb-3 text-lg font-bold text-gray-800">All Zones</h2>
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-2">
            {zones.map(zone => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                selectedZoneId={selectedZone?.id || null}
                onSelect={handleSelectZone}
                getZoneIcon={getZoneIcon}
              />
            ))}
          </div>
        </div>

        {/* Selected Zone Content Section */}
        <div className="flex-1">
          {/* Zone header */}
          <div className="p-4 mb-3 bg-white shadow-md rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 mr-3 bg-blue-100 rounded-full">
                  {getZoneIcon(selectedZone as Zone)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedZone.name}</h2>
                  <p className="mt-1 text-sm text-gray-600">{selectedZone.description}</p>
                </div>
              </div>
              <div className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">
                {selectedZone.type}
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Sensors Section */}
            <div className="lg:col-span-1">
              <div className="p-4 bg-white shadow-md rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center text-lg font-medium text-gray-800">
                    <FaCircle className="mr-2 text-blue-500" size={14} />
                    Sensors in {selectedZone.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-lg">
                      {zoneSensors.length} {zoneSensors.length === 1 ? 'sensor' : 'sensors'}
                    </span>
                    <button
                      onClick={handleRefreshSensors}
                      disabled={isRefreshing}
                      className={`p-1.5 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 
                        ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'}`}
                      title="Refresh sensor data"
                    >
                      <FaSyncAlt className={`${isRefreshing ? 'animate-spin' : ''}`} size={12} />
                    </button>
                  </div>
                </div>
                {zoneSensors.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <FaCircle className="mx-auto mb-2 text-gray-400" size={14} />
                    <p>No sensors configured for this zone.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedSensorTypes.map(type => (
                      <SensorGroup
                        key={type}
                        type={type}
                        sensors={groupedSensors[type]}
                        sensorValues={sensorValues}
                        socketConnected={socketConnected}
                        getSensorIcon={getSensorIcon}
                        getFormattedSensorValue={getFormattedSensorValue}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cameras Section */}
            <div className="lg:col-span-2">
              <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
                {/* Camera Header with Filter Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaVideo className="mr-2 text-blue-500" />
                    <h3 className="text-lg font-medium text-gray-800">Cameras in {selectedZone.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Camera Filter Buttons */}
                    <div className="flex overflow-hidden bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setCameraFilter('all')}
                        className={`px-3 py-1.5 text-xs flex items-center gap-1 font-medium transition-colors
                          ${cameraFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'}`}
                      >
                        {cameraFilter === 'all' && <FaCheck size={10} />}
                        All Cameras ({zoneCameras.length})
                      </button>
                      <button
                        onClick={() => setCameraFilter('active')}
                        className={`px-3 py-1.5 text-xs flex items-center gap-1 font-medium transition-colors
                          ${cameraFilter === 'active'
                            ? 'bg-green-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'}`}
                      >
                        {cameraFilter === 'active' && <FaCheck size={10} />}
                        Live Only ({activeCamerasCount})
                      </button>
                    </div>
                    <button
                      className="p-2 text-gray-500 transition-colors bg-gray-100 rounded-full hover:text-blue-700 hover:bg-gray-200"
                      onClick={() => selectedZone && loadCameraDetails(selectedZone)}
                      title="Refresh camera feeds"
                    >
                      <FaCog size={16} />
                    </button>
                  </div>
                </div>
                {zoneCameras.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <FaVideo className="mx-auto mb-2 text-gray-400" size={24} />
                    <p>No cameras configured for this zone.</p>
                  </div>
                ) : loadingCameras ? (
                  <div className="flex items-center justify-center h-32 rounded-lg bg-gray-50">
                    <div className="w-6 h-6 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading camera feeds...</span>
                  </div>
                ) : filteredCameras.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <FaFilter className="mx-auto mb-2 text-gray-400" size={24} />
                    <p>No {cameraFilter === 'active' ? 'active' : ''} cameras found with current filter.</p>
                    <button
                      onClick={() => setCameraFilter('all')}
                      className="px-4 py-2 mt-2 text-sm text-blue-700 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                    >
                      Show All Cameras
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredCameras.map(camera => (
                      <CameraCard
                        key={camera.id}
                        camera={camera}
                        onClick={handleCameraClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZonesPanel;