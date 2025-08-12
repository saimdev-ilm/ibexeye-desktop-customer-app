import React, { useEffect, useState } from 'react';
import { 
  FaVideo, FaCircle, FaThermometerHalf, FaTint, FaWind, 
  FaLeaf, FaCheck, FaTimes, FaPlus, FaTrash, FaSpinner
} from "react-icons/fa";
import { getModeById, Mode } from '../../services/modeService';
import { Camera, getAllCameras } from '../../services/cameraService';
import { Sensor, getSensorsByDeviceId } from '../../services/sensorService';
import { baseURL, deviceId } from '../../api/config';
import { getToken } from '../../services/authService';

interface ModeConfigurationModalProps {
  isOpen: boolean;
  modeId: number;
  onClose: () => void;
  onSave: (success: boolean, message: string) => void;
}

const ModeConfigurationModal: React.FC<ModeConfigurationModalProps> = ({ 
  isOpen, 
  modeId, 
  onClose, 
  onSave 
}) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For cameras and sensors
  const [availableCameras, setAvailableCameras] = useState<Camera[]>([]);
  const [availableSensors, setAvailableSensors] = useState<Sensor[]>([]);
  const [selectedCameras, setSelectedCameras] = useState<Camera[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  // Load mode data
  useEffect(() => {
    if (isOpen && modeId) {
      loadModeData();
      loadAvailableComponents();
    }
  }, [isOpen, modeId]);

  const loadModeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const modeData = await getModeById(modeId);
      if (modeData) {
        setMode(modeData);
        
        // Set initially selected cameras and sensors from the mode data
        if (modeData.cameras && Array.isArray(modeData.cameras)) {
          setSelectedCameras(modeData.cameras);
        }
        
        if (modeData.sensors && Array.isArray(modeData.sensors)) {
          setSelectedSensors(modeData.sensors);
        }
        
        // Also load mode components to ensure we have the latest data
        await loadModeComponents(modeId);
      } else {
        setError('Mode not found');
      }
    } catch (err) {
      console.error('Failed to load mode data:', err);
      setError('Failed to load mode data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableComponents = async () => {
    try {
      setLoadingComponents(true);
      
      // Load all available cameras and sensors
      const [camerasData, sensorsData] = await Promise.all([
        getAllCameras(),
        getSensorsByDeviceId()
      ]);
      
      setAvailableCameras(camerasData);
      setAvailableSensors(sensorsData);
    } catch (err) {
      console.error('Failed to load available components:', err);
    } finally {
      setLoadingComponents(false);
    }
  };

  const loadModeComponents = async (modeId: number) => {
    try {
      setLoadingComponents(true);
      
      // Get token from auth service
      const token = getToken();
      if (!token) {
        throw new Error('Unauthorized: No token found');
      }
      
      // Make the API request to fetch mode components
      const url = `${baseURL}/device-mode/modes/${deviceId}/${modeId}/components`;
      console.log(`Fetching mode components from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API request failed:', response.status, errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const componentData = await response.json();
      
      if (componentData?.data) {
        // Set selected cameras and sensors from the response
        const { cameras = [], sensors = [] } = componentData.data;
        
        // Only update if we have data, preserving initial selections from mode data
        if (cameras.length > 0) {
          setSelectedCameras(cameras);
        }
        
        if (sensors.length > 0) {
          setSelectedSensors(sensors);
        }
      }
    } catch (err) {
      console.error('Failed to load mode components:', err);
    } finally {
      setLoadingComponents(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!mode) {
        setError('Mode data is missing');
        setSaving(false);
        return;
      }

      // Get token from auth service
      const token = getToken();
      if (!token) {
        throw new Error('Unauthorized: No token found');
      }

      // Process each camera - add components that are selected but not already in the mode
      const addComponentPromises = [];
      
      // Add cameras
      for (const camera of selectedCameras) {
        // Check if the camera is already in the mode's cameras
        const isCameraAlreadyAdded = mode.cameras.some(c => c.id.toString() === camera.id.toString());
        
        if (!isCameraAlreadyAdded) {
          // Add camera to the mode using the new API
          const cameraAddUrl = `${baseURL}/device-mode/modes/components/add`;
          const addCameraPromise = fetch(cameraAddUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId,
              modeId: modeId.toString(),
              componentType: 'camera',
              componentId: camera.network_id || camera.id.toString()
            }),
          });
          
          addComponentPromises.push(addCameraPromise);
        }
      }
      
      // Add sensors
      for (const sensor of selectedSensors) {
        // Check if the sensor is already in the mode's sensors
        const isSensorAlreadyAdded = mode.sensors.some(s => s.id === sensor.id);
        
        if (!isSensorAlreadyAdded) {
          // Add sensor to the mode using the new API
          const sensorAddUrl = `${baseURL}/device-mode/modes/components/add`;
          const addSensorPromise = fetch(sensorAddUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId,
              modeId: modeId.toString(),
              componentType: 'sensor',
              componentId: sensor.id.toString()
            }),
          });
          
          addComponentPromises.push(addSensorPromise);
        }
      }
      
      // Remove cameras that are no longer selected
      for (const existingCamera of mode.cameras) {
        const isCameraStillSelected = selectedCameras.some(c => c.id.toString() === existingCamera.id.toString());
        
        if (!isCameraStillSelected) {
          // Remove camera component using the new remove API
          const cameraRemoveUrl = `${baseURL}/device-mode/modes/components/remove`;
          const removeCameraPromise = fetch(cameraRemoveUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId,
              modeId: modeId.toString(),
              componentType: 'camera',
              componentId: existingCamera.networkId || existingCamera.id.toString()
            }),
          });
          
          addComponentPromises.push(removeCameraPromise);
        }
      }
      
      // Remove sensors that are no longer selected
      for (const existingSensor of mode.sensors) {
        const isSensorStillSelected = selectedSensors.some(s => s.id === existingSensor.id);
        
        if (!isSensorStillSelected) {
          // Remove sensor component using the new remove API
          const sensorRemoveUrl = `${baseURL}/device-mode/modes/components/remove`;
          const removeSensorPromise = fetch(sensorRemoveUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId,
              modeId: modeId.toString(),
              componentType: 'sensor',
              componentId: existingSensor.id.toString()
            }),
          });
          
          addComponentPromises.push(removeSensorPromise);
        }
      }
      
      // Execute all the add/remove component requests
      if (addComponentPromises.length > 0) {
        await Promise.all(addComponentPromises);
      }
      
      // On success
      onSave(true, `Mode configuration updated successfully`);
      onClose();
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      onSave(false, `Failed to update configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle camera selection
  const toggleCamera = (camera: Camera) => {
    if (selectedCameras.some(c => c.id === camera.id)) {
      setSelectedCameras(selectedCameras.filter(c => c.id !== camera.id));
    } else {
      setSelectedCameras([...selectedCameras, camera]);
    }
  };

  // Toggle sensor selection
  const toggleSensor = (sensor: Sensor) => {
    if (selectedSensors.some(s => s.id === sensor.id)) {
      setSelectedSensors(selectedSensors.filter(s => s.id !== sensor.id));
    } else {
      setSelectedSensors([...selectedSensors, sensor]);
    }
  };

  // Get sensor icon based on type
  const getSensorIcon = (sensorType: string) => {
    const type = sensorType.toLowerCase();
    if (type.includes('temp')) return <FaThermometerHalf className="text-red-500" size={18} />;
    if (type.includes('humid')) return <FaTint className="text-blue-500" size={18} />;
    if (type.includes('air') || type.includes('quality')) return <FaWind className="text-green-500" size={18} />;
    if (type.includes('co2')) return <FaLeaf className="text-emerald-500" size={18} />;
    return <FaCircle className="text-gray-500" size={14} />;
  };

  // Check if a camera is selected
  const isCameraSelected = (camera: Camera) => {
    return selectedCameras.some(c => c.id === camera.id);
  };

  // Check if a sensor is selected
  const isSensorSelected = (sensor: Sensor) => {
    return selectedSensors.some(s => s.id === sensor.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute p-1 text-gray-500 transition-colors rounded-full top-4 right-4 hover:bg-gray-100 hover:text-gray-700"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Configure Mode: {mode?.name || ''}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <span className="ml-3 text-sm font-medium text-gray-600">Loading mode data...</span>
          </div>
        ) : error ? (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            <p>{error}</p>
            <button
              onClick={loadModeData}
              className="px-3 py-1 mt-2 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cameras Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
                <FaVideo className="mr-2 text-blue-500" />
                Cameras
              </h3>
              
              {loadingComponents ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading cameras...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {availableCameras.map(camera => (
                      <div 
                        key={camera.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                          ${isCameraSelected(camera) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                        onClick={() => toggleCamera(camera)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 mr-3 bg-gray-100 rounded-full">
                            <FaVideo className="text-blue-500" size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{camera.name}</div>
                            <div className="text-xs text-gray-500">
                              {camera.host || 'Virtual Camera'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isCameraSelected(camera) ? (
                            <div className="p-1 text-white bg-blue-500 rounded-full">
                              <FaCheck size={10} />
                            </div>
                          ) : (
                            <div className="p-1 text-gray-300 bg-gray-100 rounded-full">
                              <FaPlus size={10} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {availableCameras.length === 0 && (
                    <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                      <p>No cameras available</p>
                    </div>
                  )}
                  
                  {/* Selected Cameras Summary */}
                  <div className="p-3 mt-4 border border-gray-200 rounded-lg">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Selected Cameras ({selectedCameras.length})</h4>
                    {selectedCameras.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCameras.map(camera => (
                          <div 
                            key={camera.id}
                            className="flex items-center px-2 py-1 text-xs bg-blue-100 rounded-full"
                          >
                            <span className="text-blue-700">{camera.name}</span>
                            <button 
                              className="ml-1 text-blue-500 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCamera(camera);
                              }}
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No cameras selected</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sensors Section */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
                <FaCircle className="mr-2 text-green-500" size={14} />
                Sensors
              </h3>
              
              {loadingComponents ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 border-t-2 border-green-500 border-solid rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading sensors...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {availableSensors.map(sensor => (
                      <div 
                        key={sensor.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                          ${isSensorSelected(sensor) 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-green-300 bg-white'}`}
                        onClick={() => toggleSensor(sensor)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 mr-3 bg-gray-100 rounded-full">
                            {getSensorIcon(sensor.dataType || 'default')}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{sensor.name}</div>
                            <div className="text-xs text-gray-500">
                              Type: {sensor.dataType || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isSensorSelected(sensor) ? (
                            <div className="p-1 text-white bg-green-500 rounded-full">
                              <FaCheck size={10} />
                            </div>
                          ) : (
                            <div className="p-1 text-gray-300 bg-gray-100 rounded-full">
                              <FaPlus size={10} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {availableSensors.length === 0 && (
                    <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                      <p>No sensors available</p>
                    </div>
                  )}
                  
                  {/* Selected Sensors Summary */}
                  <div className="p-3 mt-4 border border-gray-200 rounded-lg">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Selected Sensors ({selectedSensors.length})</h4>
                    {selectedSensors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSensors.map(sensor => (
                          <div 
                            key={sensor.id}
                            className="flex items-center px-2 py-1 text-xs bg-green-100 rounded-full"
                          >
                            <span className="text-green-700">{sensor.name}</span>
                            <button 
                              className="ml-1 text-green-500 hover:text-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSensor(sensor);
                              }}
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No sensors selected</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfiguration}
                className={`px-4 py-2 text-white transition-colors rounded-lg ${
                  saving ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="inline mr-2 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeConfigurationModal;