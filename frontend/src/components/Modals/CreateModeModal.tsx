import React, { useState } from 'react';
import { FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import { createMode } from '../../services/modeService';

interface CreateModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeCreated: (success: boolean, message: string) => void;
  refreshModes: () => void;
}

const CreateModeModal: React.FC<CreateModeModalProps> = ({ 
  isOpen, 
  onClose,
  onModeCreated, 
  refreshModes 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activateImmediately, setActivateImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

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
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const result = await createMode(name.trim(), description.trim(), activateImmediately);
      
      if (result.success) {
        // Reset form
        setName('');
        setDescription('');
        setActivateImmediately(false);
        setErrors({});
        
        // Refresh modes list
        refreshModes();
        
        // Close modal and show success message
        onClose();
        onModeCreated(true, `Mode "${name}" created successfully`);
      } else {
        onModeCreated(false, result.message);
      }
    } catch (error) {
      console.error('Error creating mode:', error);
      onModeCreated(false, 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Create Custom Mode</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-200 hover:text-gray-800"
          >
            <FaTimes size={18} />
          </button>
        </div>
        
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
          
          <div className="mb-4">
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
                  Creating...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Create Mode
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModeModal;