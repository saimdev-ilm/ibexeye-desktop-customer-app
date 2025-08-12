import React, { useState } from "react";
import { FaTimes, FaCamera } from "react-icons/fa";
import { addCameraService } from "../../services/apiService";

interface AddNewCameraModalProps {
  onClose: () => void;
  onCameraAdded: () => void;
}

const AddNewCameraModal: React.FC<AddNewCameraModalProps> = ({ onClose, onCameraAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: 554,
    username: "",
    password: "",
    streamInputPath: "",
    is_virtual: false,
    detectionEnabled: false,
    zoneId: 5, // Default zone ID
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkboxes separately
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } 
    // Handle numeric inputs
    else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    }
    // Handle all other inputs
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await addCameraService(formData);
      onCameraAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add camera");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Camera</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 transition-colors rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Camera Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="e.g., Front Door Camera"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Host/IP Address *
              </label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="e.g., 192.168.168.100"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Port
              </label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="e.g., 554"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="e.g., admin"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="Camera password"
              />
            </div>

            <div className="col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Stream Path
              </label>
              <input
                type="text"
                name="streamInputPath"
                value={formData.streamInputPath}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                placeholder="e.g., stream2, cam/realmonitor?channel=1&subtype=1"
              />
            </div>

            <div className="flex items-center col-span-2 space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_virtual"
                  id="is_virtual"
                  checked={formData.is_virtual}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 text-customBlue focus:ring-customBlue"
                />
                <label htmlFor="is_virtual" className="block ml-2 text-sm text-gray-700">
                  Virtual Camera
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="detectionEnabled"
                  id="detectionEnabled"
                  checked={formData.detectionEnabled}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 text-customBlue focus:ring-customBlue"
                />
                <label htmlFor="detectionEnabled" className="block ml-2 text-sm text-gray-700">
                  Enable Detection
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-md bg-customBlue hover:bg-blue-600"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Camera"}
              <FaCamera />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewCameraModal;