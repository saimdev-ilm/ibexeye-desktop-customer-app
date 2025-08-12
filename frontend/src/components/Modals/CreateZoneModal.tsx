import React, { useState } from 'react';
import { createZone } from '../../services/zoneService';
import { IoMdClose } from 'react-icons/io';

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZoneCreated: (success: boolean, message: string) => void;
  refreshZones: () => void;
}

const CreateZoneModal: React.FC<CreateZoneModalProps> = ({
  isOpen,
  onClose,
  onZoneCreated,
  refreshZones
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('office-building');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!name.trim()) {
      setError('Zone name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call the service to create the zone
      const result = await createZone(name, description, type);
      
      if (result.success) {
        // Reset form fields
        setName('');
        setDescription('');
        setType('office-building');
        
        // Notify parent component
        onZoneCreated(true, result.message);
        
        // Close modal
        onClose();
        
        // Refresh zones in the parent component
        refreshZones();
      } else {
        // Show error message
        setError(result.message);
        // Notify parent component
        onZoneCreated(false, result.message);
      }
    } catch (err) {
      console.error('Error creating zone:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to create zone: ${errorMessage}`);
      onZoneCreated(false, `Failed to create zone: ${errorMessage}`);
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
        
        <h2 className="mb-4 text-xl font-bold text-gray-800">Create New Zone</h2>
        
        {error && (
          <div className="px-3 py-2 mb-4 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}
        
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
                  Creating...
                </>
              ) : (
                'Create Zone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateZoneModal;