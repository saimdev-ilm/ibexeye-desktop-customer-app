import React, { useEffect, useState } from 'react';
import { FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import { getModeById, Mode } from '../../services/modeService';
import { baseURL, deviceId } from '../../api/config';
import { getToken } from '../../services/authService';

interface EditModeModalProps {
  isOpen: boolean;
  modeId: number;
  onClose: () => void;
  onSave: (success: boolean, message: string) => void;
}

const EditModeModal: React.FC<EditModeModalProps> = ({ 
  isOpen, 
  modeId,
  onClose,
  onSave 
}) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // Load mode data when the modal opens
  useEffect(() => {
    if (isOpen && modeId) {
      loadModeData();
    }
  }, [isOpen, modeId]);

  const loadModeData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      const modeData = await getModeById(modeId);
      if (modeData) {
        setMode(modeData);
        setName(modeData.name);
        setDescription(modeData.description || '');
      } else {
        setLoadError('Mode not found');
      }
    } catch (err) {
      console.error('Failed to load mode data:', err);
      setLoadError('Failed to load mode data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {name?: string; description?: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Mode name is required';
    } else if (name.length > 30) {
      newErrors.name = 'Mode name must be 30 characters or less';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > 100) {
      newErrors.description = 'Description must be 100 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !mode) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get token from auth service
      const token = getToken();
      if (!token) {
        throw new Error('Unauthorized: No token found');
      }
      
      // Make the API request to update the mode
      const url = `${baseURL}/device-mode/modes/${deviceId}/${modeId}`;
      
      // Important: Removed modeType from the request body as it's not allowed
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim()
          // modeType was removed from here!
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API request failed:', response.status, errorData);
        throw new Error(`Failed to update mode: ${response.status} ${errorData.message || errorData.error || ''}`);
      }
      
      // On success
      onClose();
      onSave(true, `Mode "${name}" updated successfully`);
    } catch (error) {
      console.error('Error updating mode:', error);
      onSave(false, `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Mode</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-200 hover:text-gray-800"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <FaSpinner className="mb-3 text-blue-600 animate-spin" size={32} />
            <p className="text-gray-600">Loading mode data...</p>
          </div>
        ) : loadError ? (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            <p>{loadError}</p>
            <button
              onClick={loadModeData}
              className="px-3 py-1 mt-3 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="mode-name" className="block mb-1 text-sm font-medium text-gray-700">
                Mode Name *
              </label>
              <input
                id="mode-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter mode name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                  ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="mode-description" className="block mb-1 text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="mode-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter mode description"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                  ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditModeModal;