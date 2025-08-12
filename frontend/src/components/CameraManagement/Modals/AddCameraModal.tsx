import React, { useState, useEffect } from 'react';
import { addCamera, AddCameraRequest, bindCameraToSensor } from '../../../services/cameraService';

// React Icons
import { FaTimes, FaExclamationCircle, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cameraData: { id: string; network_id: string }) => void;
}

function AddCameraModal({ isOpen, onClose, onAdd }: AddCameraModalProps) {
  const initialState: AddCameraRequest = {
    name: '',
    is_virtual: false,
    mac: '',
    host: '',
    port: 554,
    username: '',
    password: '',
    streamInputPath: '',
    streamKey: '',
    authToken: '',
    location: {
      latitude: 0,
      longitude: 0,
    }
  };

  const [cameraData, setCameraData] = useState<AddCameraRequest>(initialState);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCameraData(initialState);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;

    if (name === 'port') {
      setCameraData({ ...cameraData, [name]: parseInt(value, 10) || 0 });
    } else {
      setCameraData({ ...cameraData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await addCamera(cameraData);

      // Bind the camera to the default sensor (e.g., sensorId = 1)
      const bindResponse = await bindCameraToSensor(result.network_id, 1);

      // Optionally, update the camera with the returned streamKey & authToken
      cameraData.streamKey = bindResponse.streamKey;
      cameraData.authToken = bindResponse.authToken;

      setSuccess(true);
      setTimeout(() => {
        onAdd(result);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add and bind camera");
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Add New Camera</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            disabled={isLoading}
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="flex items-start px-4 py-3 mb-4 text-red-700 border border-red-200 rounded bg-red-50">
              <FaExclamationCircle className="flex-shrink-0 mr-2" size={20} />
              <div className="flex-grow">{error}</div>
              <button onClick={() => setError(null)} className="flex-shrink-0">
                <FaTimes size={18} className="text-red-500" />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center px-4 py-3 mb-4 text-green-700 border border-green-200 rounded bg-green-50">
              <FaCheckCircle className="mr-2" size={20} />
              <div>Camera added successfully!</div>
            </div>
          )}

          <div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="name">
                Camera Name*
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={cameraData.name}
                onChange={handleChange}
                placeholder="Enter camera name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="mac">
                MAC Address
              </label>
              <input
                id="mac"
                type="text"
                name="mac"
                value={cameraData.mac}
                onChange={handleChange}
                placeholder="e.g., 34:60:F9:FD:73:7A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-3">
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="host">
                  Host*
                </label>
                <input
                  id="host"
                  type="text"
                  name="host"
                  value={cameraData.host}
                  onChange={handleChange}
                  placeholder="IP address or hostname (e.g., 192.168.1.100)"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="port">
                  Port*
                </label>
                <input
                  id="port"
                  type="number"
                  name="port"
                  value={cameraData.port}
                  onChange={handleChange}
                  placeholder="554"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={cameraData.username}
                  onChange={handleChange}
                  placeholder="Camera username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={cameraData.password}
                  onChange={handleChange}
                  placeholder="Camera password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="streamInputPath">
                Stream Input Path
              </label>
              <input
                id="streamInputPath"
                type="text"
                name="streamInputPath"
                value={cameraData.streamInputPath}
                onChange={handleChange}
                placeholder="e.g., stream1, ch01/main, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                This is often required for RTSP streams (e.g., /Streaming/Channels/101)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="streamKey">
                  Stream Key
                </label>
                <input
                  id="streamKey"
                  type="text"
                  name="streamKey"
                  value={cameraData.streamKey}
                  onChange={handleChange}
                  placeholder="Stream key (if required)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="authToken">
                  Auth Token
                </label>
                <input
                  id="authToken"
                  type="text"
                  name="authToken"
                  value={cameraData.authToken}
                  onChange={handleChange}
                  placeholder="Authentication token (if required)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="latitude">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  name="latitude"
                  value={cameraData.location?.latitude ?? ''}
                  onChange={(e) =>
                    setCameraData({
                      ...cameraData,
                      location: {
                        latitude: parseFloat(e.target.value),
                        longitude: cameraData.location?.longitude ?? 0
                      }
                    })
                  }
                  placeholder="e.g., 40.7128"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="longitude">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  name="longitude"
                  value={cameraData.location?.longitude ?? ''}
                  onChange={(e) =>
                    setCameraData({
                      ...cameraData,
                      location: {
                        latitude: cameraData.location?.latitude ?? 0,
                        longitude: parseFloat(e.target.value)
                      }
                    })
                  }
                  placeholder="e.g., -74.0060"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>


          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || success || !cameraData.name || !cameraData.host || !cameraData.port}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center ${isLoading || success || !cameraData.name || !cameraData.host || !cameraData.port
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isLoading ? (
              <>
                <FaSpinner size={18} className="mr-2 animate-spin" />
                <span>Adding...</span>
              </>
            ) : success ? 'Added!' : 'Add Camera'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCameraModal;