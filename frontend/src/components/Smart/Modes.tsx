import React, { useEffect, useState } from 'react';
import {
  FaHome,
  FaBed,
  FaVideo,
  FaCircle,
  FaCog,
  FaInfoCircle,
  FaThermometerHalf,
  FaTint,
  FaWind,
  FaLeaf,
  FaTimes,
  FaFilter,
  FaCheck,
  FaChevronRight,
  FaShieldVirus,
  FaShieldAlt
} from 'react-icons/fa';
import { getAllModes, Mode, ModeType } from '../../services/modeService';
import { useMode } from '../../contexts/ModeContext'; // Import the ModeContext hook
import { getCameraById } from '../../services/cameraService';
import { useNavigate } from 'react-router-dom';
import CameraCard from './CameraCard';
import webSocketService from '../../services/socketConnection';
import { getSensorsByDeviceId } from '../../services/sensorService';

interface Camera {
  id: number;
  networkId: string;
  name: string;
  host: string;
  cloudHls?: string | null;
  localHls?: string | null;
}

export interface Sensor {
  id: number;
  name: string;
  mqttTopic: string;
  type?: string; // Define the type property
  notificationThreshold?: number;
}

interface EnhancedMode extends Mode {
  enhancedCameras: Camera[];
}

const ModesPanel: React.FC = () => {
  // Use ModeContext
  const { activeMode: contextActiveMode, activateMode: activateModeGlobal } = useMode();

  const [modes, setModes] = useState<EnhancedMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingMode, setActivatingMode] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<EnhancedMode | null>(null);
  const [activeMode, setActiveMode] = useState<EnhancedMode | null>(null);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cameraFilter, setCameraFilter] = useState<'all' | 'active'>('all');
  const navigate = useNavigate();
  const [sensorValues, setSensorValues] = useState<any[]>([]);

  // Fetch modes when the component mounts
  useEffect(() => {
    const fetchModes = async () => {
      try {
        setLoading(true);
        const modesData = await getAllModes();

        // Find the active mode
        const activeModeData = modesData.find(mode => mode.isActive);

        // Set enhanced modes with empty camera arrays initially
        const enhancedModes = modesData.map(mode => ({
          ...mode,
          enhancedCameras: [],
          // Ensure cameras and sensors are arrays
          cameras: Array.isArray(mode.cameras) ? mode.cameras : [],
          sensors: Array.isArray(mode.sensors) ? mode.sensors : []
        }));

        setModes(enhancedModes);

        // Set active mode and selected mode
        if (activeModeData) {
          const enhancedActiveMode = {
            ...activeModeData,
            enhancedCameras: [],
            // Ensure cameras and sensors are arrays
            cameras: Array.isArray(activeModeData.cameras) ? activeModeData.cameras : [],
            sensors: Array.isArray(activeModeData.sensors) ? activeModeData.sensors : []
          };
          setActiveMode(enhancedActiveMode);
          setSelectedMode(enhancedActiveMode);

          // Load camera details for the active mode
          loadCameraDetails(enhancedActiveMode);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch modes:', err);
        setError('Failed to load modes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchModes();
  }, []);

  // Listen for changes in the active mode from context
  useEffect(() => {
    if (contextActiveMode) {
      const internalActiveMode = modes.find(m => m.id === contextActiveMode.id);
      if (internalActiveMode) {
        const enhancedActiveMode = {
          ...internalActiveMode,
          enhancedCameras: internalActiveMode.enhancedCameras || []
        };
        setActiveMode(enhancedActiveMode);
        setSelectedMode(enhancedActiveMode);

        // Load camera details if needed
        if (!internalActiveMode.enhancedCameras || internalActiveMode.enhancedCameras.length === 0) {
          loadCameraDetails(enhancedActiveMode);
        }
      }
    }
  }, [contextActiveMode, modes]);

  useEffect(() => {
    const setupSocketListeners = () => {
      webSocketService.on('home', (data: any) => {
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          console.log("📡 Home Sensor Data Received:", parsedData);
          setSensorValues(parsedData?.messages || []);
        } catch (error) {
          console.error('❌ Error parsing "home" topic data:', error);
        }
      });
    };

    webSocketService.connect().then(() => {
      setupSocketListeners();
    }).catch((err: unknown) => {
      console.error('❌ Failed to connect to WebSocket:', err);
    });

    // Optional cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const fullSensors = await getSensorsByDeviceId();
        if (activeMode) {
          setActiveMode(prev => {
            if (!prev) return null;

            // Map the sensor data to ensure it matches the expected type
            const matchedSensors = fullSensors
              .filter(sensor => prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic))
              .map(sensor => {
                // Find the original sensor to get any existing properties
                const originalSensor = prev.sensors.find(s => s.mqttTopic === sensor.mqttTopic);

                // Return a merged sensor object that satisfies the EnhancedMode's Sensor type
                return {
                  ...sensor,
                  // Preserve properties that might be missing in the fetched sensor
                  type: sensor.type || originalSensor?.type || '',
                  // Add other required properties if needed
                };
              });

            return {
              ...prev,
              sensors: matchedSensors
            };
          });
        }
      } catch (error) {
        console.error('Error fetching full sensors:', error);
      }
    };

    if (activeMode) {
      fetchSensors();
    }
  }, [activeMode]);

  // Load detailed camera information including stream URLs
  const loadCameraDetails = async (mode: Mode) => {
    // Ensure cameras is an array before proceeding
    const cameras = Array.isArray(mode.cameras) ? mode.cameras : [];

    if (cameras.length === 0) return;

    setLoadingCameras(true);

    try {
      // Create a copy of the mode to enhance with camera details
      const enhancedMode = {
        ...mode,
        enhancedCameras: [],
        cameras: cameras,
        sensors: Array.isArray(mode.sensors) ? mode.sensors : []
      } as EnhancedMode;

      // Load camera details
      const cameraPromises = cameras.map(async (camera) => {
        try {
          // Attempt to get full camera details from the service
          const cameraDetails = await getCameraById(camera.id.toString());

          if (cameraDetails) {
            return {
              ...camera,
              cloudHls: cameraDetails.cloudHls,
              localHls: cameraDetails.localHls
            };
          }

          return camera;
        } catch (error) {
          console.error(`Failed to load details for camera ${camera.id}:`, error);
          return camera;
        }
      });

      const enhancedCameras = await Promise.all(cameraPromises);
      enhancedMode.enhancedCameras = enhancedCameras as Camera[];

      // Update the selected mode with enhanced cameras
      if (selectedMode && mode.id === selectedMode.id) {
        setSelectedMode(enhancedMode);
      }

      // Update the active mode if this is the active mode
      if (mode.isActive) {
        setActiveMode(enhancedMode);
      }

      // Update the mode in the modes array
      setModes(prevModes =>
        prevModes.map(m => m.id === mode.id ? enhancedMode : m)
      );

    } catch (error) {
      console.error('Failed to load camera details:', error);
    } finally {
      setLoadingCameras(false);
    }
  };

  // Handle setting a mode as active
  const handleSetActiveMode = async (modeId: number) => {
    try {
      setActivatingMode(modeId);

      // Call the global context function to activate the mode
      const result = await activateModeGlobal(modeId);

      if (result.success) {
        // Update local state to reflect the activation
        setModes(prevModes => prevModes.map(mode => ({
          ...mode,
          isActive: mode.id === modeId
        })));

        // Set the new active mode and selected mode
        const newActiveMode = modes.find(mode => mode.id === modeId) as EnhancedMode;
        if (newActiveMode) {
          setActiveMode(newActiveMode);
          setSelectedMode(newActiveMode);

          // Load camera details if needed
          if (!newActiveMode.enhancedCameras || newActiveMode.enhancedCameras.length === 0) {
            loadCameraDetails(newActiveMode);
          }
        }

        // Close the modal if it was open
        setShowModal(false);
      } else {
        // Handle the case where activation failed
        const errorMessage = result.message || 'Unknown error activating mode';
        console.error('Failed to activate mode:', errorMessage);
        setError(`Failed to activate mode: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error activating mode:', err);
      setError('An error occurred while activating the mode.');
    } finally {
      setActivatingMode(null);
    }
  };

  // Handle mode selection (without activating it)
  const handleSelectMode = (mode: EnhancedMode) => {
    setSelectedMode(mode);

    // If this is the active mode, show its details in the main view
    if (mode.isActive) {
      setShowModal(false);
    } else {
      // For non-active modes, show details in a modal
      setShowModal(true);
    }

    // If we don't have enhanced cameras yet, load them
    if (!mode.enhancedCameras || mode.enhancedCameras.length === 0) {
      loadCameraDetails(mode);
    }
  };

  // Get the appropriate icon based on mode type
  const getModeIcon = (mode: Mode) => {
    const modeType = mode.modeType;

    switch (modeType) {
      case ModeType.ARM_AWAY:
        return <FaShieldVirus size={24} className="text-red-500" />;
      case ModeType.ARM_HOME:
        return <FaShieldAlt size={24} className="text-blue-500" />;
      case ModeType.STANDBY:
        return <FaBed size={24} className="text-indigo-500" />;
      case ModeType.CUSTOM:
        return <FaCog size={24} className="text-purple-500" />;
      default:
        return <FaHome size={24} className="text-blue-500" />;
    }
  };

  // Get sensor icon based on type
  const getSensorIcon = (sensorType?: string) => {
    const type = sensorType?.toLowerCase?.() ?? '';
    if (type.includes('temp')) return <FaThermometerHalf className="text-red-500" size={18} />;
    if (type.includes('humid')) return <FaTint className="text-blue-500" size={18} />;
    if (type.includes('air') || type.includes('quality')) return <FaWind className="text-green-500" size={18} />;
    if (type.includes('co2')) return <FaLeaf className="text-emerald-500" size={18} />;
    return <FaCircle className="text-gray-500" size={14} />;
  };

  // Get formatted value with units based on sensor type
  const getFormattedSensorValue = (value: string | number | null | undefined, sensorType?: string) => {
    if (value === null || value === undefined) return 'No Data';

    const type = sensorType?.toLowerCase?.() ?? '';
    const formatted = typeof value === 'number' ? value.toFixed(1) : value;

    if (type.includes('temp')) return `${formatted}°C`;
    if (type.includes('humid')) return `${formatted}%`;
    if (type.includes('air') || type.includes('quality')) return `${formatted} AQI`;
    if (type.includes('co2')) return `${formatted} ppm`;

    return String(formatted);
  };

  // Handle clicking on a camera to navigate to its details
  const handleCameraClick = (camera: Camera) => {
    navigate(`/camera/${camera.id}`, {
      state: { camera }
    });
  };

  // Get filtered cameras based on the current filter setting
  const getFilteredCameras = () => {
    if (!activeMode || !Array.isArray(activeMode.enhancedCameras)) return [];

    try {
      if (cameraFilter === 'active') {
        return activeMode.enhancedCameras.filter(
          camera => camera.cloudHls && camera.cloudHls.trim() !== ''
        );
      }

      return activeMode.enhancedCameras;
    } catch (error) {
      console.error('Error filtering cameras:', error);
      return [];
    }
  };

  // Render the modal with selected mode details
  const renderModeDetailsModal = () => {
    if (!selectedMode || !showModal) return null;

    // Ensure cameras and sensors are arrays
    const cameras = Array.isArray(selectedMode.cameras) ? selectedMode.cameras : [];
    const sensors = Array.isArray(selectedMode.sensors) ? selectedMode.sensors : [];
    const enhancedCameras = Array.isArray(selectedMode.enhancedCameras) ? selectedMode.enhancedCameras : [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedMode.name} Mode Details
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 text-gray-500 rounded-full hover:text-gray-700 hover:bg-gray-100"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4">
            {/* Mode Status and Action */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${selectedMode.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                  {getModeIcon(selectedMode)}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">{selectedMode.name}</span>
                    {selectedMode.isActive && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {cameras.length} cameras, {sensors.length} sensors
                  </p>
                </div>
              </div>

              {!selectedMode.isActive && (
                <button
                  onClick={() => handleSetActiveMode(selectedMode.id)}
                  disabled={activatingMode === selectedMode.id}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition
                    ${activatingMode === selectedMode.id ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {activatingMode === selectedMode.id ? 'Activating...' : 'Activate Mode'}
                </button>
              )}
            </div>

            {/* Modal Camera Section */}
            <div className="mb-4">
              <h4 className="flex items-center mb-3 font-medium text-gray-800">
                <FaVideo className="mr-2 text-blue-500" />
                Cameras
              </h4>

              {cameras.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <p>No cameras configured for this mode.</p>
                </div>
              ) : loadingCameras ? (
                <div className="flex items-center justify-center h-20 rounded-lg bg-gray-50">
                  <div className="w-5 h-5 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">Loading camera feeds...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {enhancedCameras.map(camera => (
                    <CameraCard
                      key={camera.id}
                      camera={camera}
                      onClick={handleCameraClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Modal Sensor Section */}
            <div>
              <h4 className="flex items-center mb-3 font-medium text-gray-800">
                <FaCircle className="mr-2 text-green-500" size={14} />
                Sensors
              </h4>

              {sensors.length === 0 ? (
                <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <p>No sensors configured for this mode.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sensors.map((sensor: Sensor) => (
                    <div
                      key={sensor.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="p-2 mr-3 bg-gray-100 rounded-full">
                          {getSensorIcon(sensor.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{sensor.name}</div>
                          <div className="text-xs text-gray-500">Type: {sensor.type}</div>
                        </div>
                      </div>
                      <div className="px-2 py-1 text-xs bg-gray-100 rounded-lg truncate max-w-[120px]" title={sensor.mqttTopic}>
                        {sensor.mqttTopic}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end p-4 border-t bg-gray-50">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>

            {!selectedMode.isActive && (
              <button
                onClick={() => handleSetActiveMode(selectedMode.id)}
                disabled={activatingMode === selectedMode.id}
                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition
                  ${activatingMode === selectedMode.id ? 'opacity-70 cursor-wait' : ''}`}
              >
                {activatingMode === selectedMode.id ? 'Activating...' : 'Activate Mode'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-2xl">
        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <span className="ml-3 text-sm font-medium text-gray-600">Loading modes...</span>
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

  // Calculate active cameras count with safety checks
  const activeCamerasCount = activeMode && Array.isArray(activeMode.enhancedCameras)
    ? activeMode.enhancedCameras.filter(camera => camera.cloudHls && camera.cloudHls.trim() !== '').length
    : 0;

  // Get filtered cameras based on current filter with safety check
  const filteredCameras = getFilteredCameras();

  // Make sure we have the activeMode before rendering the main content
  if (!activeMode) {
    return (
      <div className="p-4 text-yellow-700 bg-white shadow-md rounded-2xl">
        <div className="flex items-center mb-2">
          <FaInfoCircle className="mr-2" size={16} />
          <p className="font-semibold">No Active Mode</p>
        </div>
        <p className="text-sm">No active mode found. Please select a mode to activate.</p>
      </div>
    );
  }

  // Ensure cameras and sensors arrays exist in activeMode
  const activeCameras = Array.isArray(activeMode.cameras) ? activeMode.cameras : [];
  const activeSensors = Array.isArray(activeMode.sensors) ? activeMode.sensors : [];

  return (
    <div className="w-full">
      {/* Header and Mode Selector */}
      <div className="">
        <div className="">
          {/* Mode Tabs - Horizontal Scrollable Bar */}
          <div className="flex gap-4">
            <div className="w-1/5 p-3 bg-white shadow-md rounded-2xl">
              <h2 className="mb-3 text-lg font-bold text-gray-800">All Modes</h2>
              {modes.map(mode => (
                <div
                  key={mode.id}
                  onClick={() => handleSelectMode(mode)}
                  className={`flex items-center space-x-2 px-4 py-3 border rounded-lg my-3 cursor-pointer transition-all flex-shrink-0 min-w-[150px] 
                  ${mode.id === selectedMode?.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300 bg-white'}
                  ${activatingMode === mode.id ? 'opacity-70' : ''}
                `}
                >
                  {/* Mode Icon */}
                  <div className={`p-2 rounded-full ${mode.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                    {getModeIcon(mode)}
                  </div>

                  {/* Mode Info */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{mode.name}</span>
                      {mode.isActive && <FaCircle className="text-green-500" size={8} />}
                    </div>

                    <div className="text-xs text-gray-500">
                      {Array.isArray(mode.cameras) ? mode.cameras.length : 0} {Array.isArray(mode.cameras) && mode.cameras.length === 1 ? 'camera' : 'cameras'},
                      {' '}{Array.isArray(mode.sensors) ? mode.sensors.length : 0} {Array.isArray(mode.sensors) && mode.sensors.length === 1 ? 'sensor' : 'sensors'}
                    </div>

                    <div className={`mt-1 px-2 py-0.5 text-xs rounded-full text-center w-fit
                    ${mode.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {mode.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Active Mode Content Section */}
            {activeMode && (
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Right Side - Sensors Section */}
                  <div className="lg:col-span-1">
                    <div className="p-4 bg-white shadow-md rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center text-lg font-medium text-gray-800">
                          <FaCircle className="mr-2 text-green-500" size={14} />
                          Sensors in {activeMode.name} Mode
                        </h3>
                        <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-lg">
                          {activeSensors.length} {activeSensors.length === 1 ? 'sensor' : 'sensors'}
                        </span>
                      </div>

                      {activeSensors.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <FaCircle className="mx-auto mb-2 text-gray-400" size={14} />
                          <p>No sensors configured for this mode.</p>
                          <button className="px-4 py-2 mt-2 text-sm text-green-700 transition-colors rounded-lg bg-green-50 hover:bg-green-100">
                            Add Sensor
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Group sensors by type for better organization */}
                          {(() => {
                            // Group sensors by type
                            const groupedSensors = activeSensors.reduce<Record<string, Sensor[]>>((groups, sensor) => {
                              const type = (sensor.type || 'other').toLowerCase();
                              if (!groups[type]) groups[type] = [];
                              groups[type].push(sensor);
                              return groups;
                            }, {});

                            // Define order of sensor types for display
                            const typeOrder = ['temp', 'humid', 'air', 'co2', 'other'];

                            // Sort group keys based on priority
                            const sortedTypes = Object.keys(groupedSensors).sort((a, b) => {
                              const indexA = typeOrder.findIndex(t => a.includes(t));
                              const indexB = typeOrder.findIndex(t => b.includes(t));
                              return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                            });

                            return sortedTypes.map(type => (
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
                                    ({groupedSensors[type].length})
                                  </span>
                                </h4>

                                <div className="grid grid-cols-1 gap-3">
                                  {groupedSensors[type].map((sensor: Sensor) => {
                                    const matchedEntry = sensorValues?.find((entry: any) => entry.topic === sensor.mqttTopic);
                                    const matchedValue = matchedEntry?.message;
                                    const numericValue = matchedValue ? parseFloat(matchedValue.toString()) : null;

                                    const status = numericValue !== null && sensor.notificationThreshold
                                      ? numericValue >= sensor.notificationThreshold
                                        ? 'Danger'
                                        : 'Idle'
                                      : 'No Data';

                                    const statusColor =
                                      status === 'Danger' ? 'text-red-600' :
                                        status === 'Idle' ? 'text-green-600' : 'text-gray-400';

                                    // Get card style based on status
                                    const cardStyle =
                                      status === 'Danger'
                                        ? 'bg-gradient-to-r from-red-50 to-white border-l-4 border-red-500'
                                        : status === 'Idle'
                                          ? 'bg-gradient-to-r from-green-50 to-white border-l-4 border-green-500'
                                          : 'bg-white';

                                    // Get status icon based on status
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
                                        className={`flex items-center justify-between p-4 transition-colors 
                            border rounded-lg hover:shadow-md cursor-pointer group ${cardStyle}`}
                                      >
                                        <div className="flex items-center flex-1">
                                          <div className={`p-3 mr-3 rounded-full ${status === 'Danger' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                            {getSensorIcon(sensor.type)}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-800">{sensor.name}</div>
                                            <div className="flex items-center mt-1">
                                              {getStatusIcon()}
                                              <span className={`text-xs ml-1 font-medium ${statusColor}`}>
                                                {status}
                                              </span>
                                            </div>

                                            {/* Visual indicator for threshold */}
                                            {numericValue !== null && sensor.notificationThreshold && (
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
                                            {getFormattedSensorValue(matchedValue, sensor.type)}
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
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Left Side - Cameras Section */}
                  <div className="lg:col-span-2">
                    <div className="p-4 mb-6 bg-white shadow-md rounded-xl">
                      {/* Camera Header with Filter Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <FaVideo className="mr-2 text-blue-500" />
                          <h3 className="text-lg font-medium text-gray-800">Cameras in {activeMode.name} Mode</h3>
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
                              All Cameras ({activeCameras.length})
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
                            onClick={() => loadCameraDetails(activeMode)}
                            title="Refresh camera feeds"
                          >
                            <FaCog size={16} />
                          </button>
                        </div>
                      </div>

                      {activeCameras.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <FaVideo className="mx-auto mb-2 text-gray-400" size={24} />
                          <p>No cameras configured for this mode.</p>
                          <button className="px-4 py-2 mt-2 text-sm text-blue-700 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100">
                            Add Camera
                          </button>
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
            )}
          </div>
        </div>
      </div>
      {/* Mode Details Modal */}
      {renderModeDetailsModal()}
    </div>
  );
};

export default ModesPanel;