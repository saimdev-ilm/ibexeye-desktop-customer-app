import React, { useState, useEffect } from 'react';
import { getZoneById, updateZone, Zone } from '../../services/zoneService';
import { IoMdClose } from 'react-icons/io';

interface EditZoneModalProps {
  isOpen: boolean;
  zoneId: number | string;
  onClose: () => void;
  onSave: (success: boolean, message: string) => void;
}

const EditZoneModal: React.FC<EditZoneModalProps> = ({
  isOpen,
  zoneId,
  onClose,
  onSave
}) => {
  const [zone, setZone] = useState<Zone | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List of zone types
  const zoneTypes = [
    { value: 'office-building', label: 'Office Building' },
    { value: 'factory', label: 'Factory' },
    { value: 'living-room', label: 'Living Room' },
    { value: 'meeting-room', label: 'Meeting Room' },
    { value: 'kitchen-second', label: 'Kitchen' },
    { value: 'dining-room', label: 'Dining Room' }
  ];

  // Fetch zone data when component mounts
  useEffect(() => {
    const fetchZoneData = async () => {
      if (isOpen && zoneId) {
        try {
          setIsLoading(true);
          setError(null);
          
          const zoneData = await getZoneById(zoneId);
          
          if (zoneData) {
            setZone(zoneData);
            setName(zoneData.name);
            setDescription(zoneData.description);
            setType(zoneData.type);
          } else {
            setError(`Zone with ID ${zoneId} not found`);
          }
        } catch (err) {
          console.error('Error fetching zone data:', err);
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          setError(`Failed to load zone data: ${errorMessage}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchZoneData();
  }, [isOpen, zoneId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!name.trim()) {
      setError('Zone name is required');
      return;
    }

    // Ensure we have the zone data
    if (!zone) {
      setError('Zone data not loaded');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare update data - only include fields allowed by the API
      const updateData = {
        name,
        description,
        type
      };
      
      // Call the service to update the zone
      const result = await updateZone(zoneId, updateData);
      
      if (result.success) {
        // Notify parent component
        onSave(true, result.message || 'Zone updated successfully');
        
        // Close modal
        onClose();
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onSave(false, result.message);
      }
    } catch (err) {
      console.error('Error updating zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to update zone: ${errorMessage}`);
      onSave(false, `Failed to update zone: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md px-6 py-5 mx-4 bg-white rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute p-1 text-gray-400 transition-colors rounded hover:text-gray-600 hover:bg-gray-100 top-3 right-3"
        >
          <IoMdClose size={20} />
        </button>
        
        <h2 className="mb-4 text-xl font-bold text-gray-800">Edit Zone</h2>
        
        {error && (
          <div className="px-3 py-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading zone data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Zone Name*
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter zone name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Enter zone description"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Zone Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {zoneTypes.map((zoneType) => (
                  <option key={zoneType.value} value={zoneType.value}>
                    {zoneType.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 text-white bg-blue-600 rounded ${
                  isSubmitting ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditZoneModal;