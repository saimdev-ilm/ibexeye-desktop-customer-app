import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import { FaPlus, FaTrash, FaVideo, FaMicrochip, FaSync, FaSpinner, FaThermometerHalf, FaTint, FaWind, FaLeaf } from 'react-icons/fa';
import {
  getZoneById,
  addCameraToZone,
  removeCameraFromZone,
  Zone,
} from '../../services/zoneService';
import { Camera, getAllCameras } from '../../services/cameraService';
import { Sensor, getSensorsByDeviceId, addSensorToZone, removeSensorFromZone } from '../../services/sensorService';

interface ZoneConfigurationModalProps {
  isOpen: boolean;
  zoneId: number | string;
  onClose: () => void;
  onSave: (success: boolean, message: string) => void;
}

const ZoneConfigurationModal: React.FC<ZoneConfigurationModalProps> = ({
  isOpen,
  zoneId,
  onClose,
  onSave
}) => {
  const [zone, setZone] = useState<Zone | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Camera[]>([]);
  const [availableSensors, setAvailableSensors] = useState<Sensor[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingItemId, setProcessingItemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cameras' | 'sensors'>('cameras');

  // Fetch all data when component mounts
  useEffect(() => {
    if (isOpen && zoneId) {
      fetchData();
    }
  }, [isOpen, zoneId]);

  // Centralized fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch zone data
      const zoneData = await getZoneById(zoneId);

      // Fetch all cameras and sensors in parallel
      const [camerasData, sensorsData] = await Promise.all([
        getAllCameras(),
        getSensorsByDeviceId()
      ]);

      if (zoneData) {
        setZone(zoneData);

        // Set cameras data
        if (Array.isArray(camerasData)) {
          // Filter out cameras that are already in the zone
          const zoneAssignedCameraIds = Array.isArray(zoneData.cameras)
            ? zoneData.cameras.map(c => Number(c.id))
            : [];

          const unassignedCameras = camerasData.filter(camera =>
            !zoneAssignedCameraIds.includes(Number(camera.id))
          );

          setAvailableCameras(unassignedCameras);
        }

        // Set sensors data
        if (Array.isArray(sensorsData)) {
          // Initialize selected sensors from zone data
          const zoneSensors = Array.isArray(zoneData.sensors) ? zoneData.sensors : [];
          setSelectedSensors(zoneSensors);

          // Set available sensors (all sensors not already in the zone)
          const zoneSensorIds = zoneSensors.map(s => s.id);
          const unassignedSensors = sensorsData.filter(sensor =>
            !zoneSensorIds.includes(sensor.id)
          );

          setAvailableSensors(unassignedSensors);
        }
      } else {
        setError(`Zone with ID ${zoneId} not found`);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to load data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showTemporarySuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleAddCamera = async (cameraId: number) => {
    if (!zone) return;

    try {
      setProcessingItemId(cameraId);
      setError(null);

      // Add camera to zone
      const result = await addCameraToZone(zone.id, cameraId);

      if (result.success) {
        // Get camera details from available cameras
        const camera = availableCameras.find(c => c.id === cameraId);

        if (camera) {
          // Update local state
          setZone(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              cameras: Array.isArray(prev.cameras) ? [...prev.cameras, camera] : [camera]
            };
          });

          // Remove from available cameras
          setAvailableCameras(prev => prev.filter(c => c.id !== cameraId));

          // Show success message
          showTemporarySuccess(`Camera "${camera.name}" added to zone successfully`);
        }

        // Notify parent component
        onSave(true, result.message || 'Camera added to zone successfully');
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onSave(false, result.message);
      }
    } catch (err) {
      console.error('Error adding camera to zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to add camera: ${errorMessage}`);
      onSave(false, `Failed to add camera: ${errorMessage}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleRemoveCamera = async (cameraId: number) => {
    if (!zone) return;

    try {
      setProcessingItemId(cameraId);
      setError(null);

      // Remove camera from zone
      const result = await removeCameraFromZone(cameraId);

      if (result.success) {
        // Get camera details before removing
        const camera = zone.cameras.find(c => c.id === cameraId);

        if (camera) {
          // Update local state
          setZone(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              cameras: Array.isArray(prev.cameras)
                ? prev.cameras.filter(c => c.id !== cameraId)
                : []
            };
          });

          // Add to available cameras
          setAvailableCameras(prev => [...prev, camera]);

          // Show success message
          showTemporarySuccess(`Camera "${camera.name}" removed from zone successfully`);
        }

        // Notify parent component
        onSave(true, result.message || 'Camera removed from zone successfully');
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onSave(false, result.message);
      }
    } catch (err) {
      console.error('Error removing camera from zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to remove camera: ${errorMessage}`);
      onSave(false, `Failed to remove camera: ${errorMessage}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Handle adding a sensor to the zone
  const handleAddSensor = async (sensorId: number) => {
    if (!zone) return;

    try {
      setProcessingItemId(sensorId);
      setError(null);

      // Add sensor to zone
      const result = await addSensorToZone(zone.id, sensorId);

      if (result.success) {
        // Get sensor details from available sensors
        const sensor = availableSensors.find(s => s.id === sensorId);

        if (sensor) {
          // Update local state
          setSelectedSensors(prev => [...prev, sensor]);

          // Remove from available sensors
          setAvailableSensors(prev => prev.filter(s => s.id !== sensorId));

          // Show success message
          showTemporarySuccess(`Sensor "${sensor.name}" added to zone successfully`);
        }

        // Notify parent component
        onSave(true, result.message || 'Sensor added to zone successfully');
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onSave(false, result.message);
      }
    } catch (err) {
      console.error('Error adding sensor to zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to add sensor: ${errorMessage}`);
      onSave(false, `Failed to add sensor: ${errorMessage}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Handle removing a sensor from the zone
  const handleRemoveSensor = async (sensorId: number) => {
    if (!zone) return;

    try {
      setProcessingItemId(sensorId);
      setError(null);

      // Remove sensor from zone
      const result = await removeSensorFromZone(sensorId);

      if (result.success) {
        // Get sensor details before removing
        const sensor = selectedSensors.find(s => s.id === sensorId);

        if (sensor) {
          // Update local state
          setSelectedSensors(prev => prev.filter(s => s.id !== sensorId));

          // Add to available sensors
          setAvailableSensors(prev => [...prev, sensor]);

          // Show success message
          showTemporarySuccess(`Sensor "${sensor.name}" removed from zone successfully`);
        }

        // Notify parent component
        onSave(true, result.message || 'Sensor removed from zone successfully');
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onSave(false, result.message);
      }
    } catch (err) {
      console.error('Error removing sensor from zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to remove sensor: ${errorMessage}`);
      onSave(false, `Failed to remove sensor: ${errorMessage}`);
    } finally {
      setProcessingItemId(null);
    }
  };

  // Helper function to get sensor icon
  const getSensorIcon = (sensor: any) => {
    const dataType = (sensor.dataType || "").toLowerCase();
    const name = (sensor.name || "").toLowerCase();

    if (dataType.includes('temp') || name.includes('temp'))
      return <FaThermometerHalf className="text-red-500" size={18} />;
    if (dataType.includes('humid') || name.includes('humid'))
      return <FaTint className="text-blue-500" size={18} />;
    if (dataType.includes('air') || dataType.includes('quality') || name.includes('air') || name.includes('quality'))
      return <FaWind className="text-green-500" size={18} />;
    if (dataType.includes('co2') || name.includes('co2'))
      return <FaLeaf className="text-emerald-500" size={18} />;

    return <FaMicrochip className="text-gray-500" size={14} />;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl px-6 py-5 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute p-1 text-gray-400 transition-colors rounded hover:text-gray-600 hover:bg-gray-100 top-3 right-3"
        >
          <IoMdClose size={20} />
        </button>

        <h2 className="mb-4 text-xl font-bold text-gray-800">Configure Zone Components</h2>

        {error && (
          <div className="px-3 py-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="px-3 py-2 mb-4 text-sm text-green-700 bg-green-100 rounded">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading data...</span>
          </div>
        ) : (
          <>
            {zone && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description}</p>
                  </div>
                  <div>
                    <button
                      onClick={fetchData}
                      className="flex items-center px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      disabled={!!processingItemId}
                    >
                      <FaSync size={12} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex mb-4 border-b border-gray-200">
                  <button
                    className={`px-4 py-2 font-medium ${activeTab === 'cameras'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    onClick={() => setActiveTab('cameras')}
                  >
                    <FaVideo className="inline mr-1" size={14} />
                    Cameras
                  </button>
                  <button
                    className={`px-4 py-2 font-medium ${activeTab === 'sensors'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                    onClick={() => setActiveTab('sensors')}
                  >
                    <FaMicrochip className="inline mr-1" size={14} />
                    Sensors
                  </button>
                </div>

                {/* Cameras Tab Content */}
                {activeTab === 'cameras' && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Assigned Cameras */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">Assigned Cameras</h4>
                      <div className="p-4 overflow-y-auto border border-gray-200 rounded-lg h-80">
                        {!Array.isArray(zone.cameras) || zone.cameras.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p className="mb-2">No cameras assigned to this zone</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {zone.cameras.map(camera => (
                              <div
                                key={camera.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div>
                                  <div className="font-medium text-gray-800">{camera.name}</div>
                                  <div className="text-xs text-gray-500">{camera.host || 'No host info'}</div>
                                </div>
                                <button
                                  onClick={() => handleRemoveCamera(camera.id)}
                                  disabled={processingItemId === camera.id}
                                  className="p-1 text-red-500 rounded hover:bg-red-100"
                                  title="Remove from zone"
                                >
                                  {processingItemId === camera.id ? 
                                    <FaSpinner className="animate-spin" size={14} /> : 
                                    <FaTrash size={14} />
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Available Cameras */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">Available Cameras</h4>
                      <div className="p-4 overflow-y-auto border border-gray-200 rounded-lg h-80">
                        {!Array.isArray(availableCameras) || availableCameras.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p className="mb-2">No available cameras</p>
                            <p className="text-xs">All cameras are already assigned to zones</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableCameras.map(camera => (
                              <div
                                key={camera.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div>
                                  <div className="font-medium text-gray-800">{camera.name}</div>
                                  <div className="text-xs text-gray-500">{camera.host || 'No host info'}</div>
                                </div>
                                <button
                                  onClick={() => handleAddCamera(camera.id)}
                                  disabled={processingItemId === camera.id}
                                  className="p-1 text-green-500 rounded hover:bg-green-100"
                                  title="Add to zone"
                                >
                                  {processingItemId === camera.id ? 
                                    <FaSpinner className="animate-spin" size={14} /> : 
                                    <FaPlus size={14} />
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensors Tab Content */}
                {activeTab === 'sensors' && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Assigned Sensors */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">Assigned Sensors</h4>
                      <div className="p-4 overflow-y-auto border border-gray-200 rounded-lg h-80">
                        {!Array.isArray(selectedSensors) || selectedSensors.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p className="mb-2">No sensors assigned to this zone</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedSensors.map(sensor => (
                              <div
                                key={sensor.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center">
                                  <div className="p-2 mr-3 bg-gray-100 rounded-full">
                                    {getSensorIcon(sensor)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{sensor.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {sensor.lastReading !== null ?
                                        `${sensor.lastReading} ${sensor.unit}` :
                                        'No reading available'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">{sensor.mqttTopic}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveSensor(sensor.id)}
                                  disabled={processingItemId === sensor.id}
                                  className="p-1 text-red-500 rounded hover:bg-red-100"
                                  title="Remove from zone"
                                >
                                  {processingItemId === sensor.id ? 
                                    <FaSpinner className="animate-spin" size={14} /> : 
                                    <FaTrash size={14} />
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Available Sensors */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-700">Available Sensors</h4>
                      <div className="p-4 overflow-y-auto border border-gray-200 rounded-lg h-80">
                        {!Array.isArray(availableSensors) || availableSensors.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p className="mb-2">No available sensors</p>
                            <p className="text-xs">All sensors are already assigned or no sensors detected</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableSensors.map(sensor => (
                              <div
                                key={sensor.id}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center">
                                  <div className="p-2 mr-3 bg-gray-100 rounded-full">
                                    {getSensorIcon(sensor)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{sensor.name}</div>
                                    <div className="text-xs text-gray-500">
                                      Type: {sensor.dataType || 'Unknown'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">{sensor.mqttTopic}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAddSensor(sensor.id)}
                                  disabled={processingItemId === sensor.id}
                                  className="p-1 text-green-500 rounded hover:bg-green-100"
                                  title="Add to zone"
                                >
                                  {processingItemId === sensor.id ? 
                                    <FaSpinner className="animate-spin" size={14} /> : 
                                    <FaPlus size={14} />
                                  }
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ZoneConfigurationModal;