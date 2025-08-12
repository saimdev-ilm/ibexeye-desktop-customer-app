import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { Camera } from '../../../services/cameraService';

interface EditCameraModalProps {
    camera: Camera | null;
    onClose: () => void;
    onSave: (camera: Camera) => void;
}

const EditCameraModal: React.FC<EditCameraModalProps> = ({ camera, onClose, onSave }) => {
    const [formData, setFormData] = useState<Camera | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (camera) {
            setFormData({ ...camera });
        }
    }, [camera]);

    if (!camera || !formData) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        // Handle checkbox for detection enabled
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => prev ? { ...prev, [name]: checked } : null);
            return;
        }
        
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Camera name is required';
        }
        
        if (!formData.host || formData.host.trim() === '') {
            newErrors.host = 'Host is required';
        }
        
        if (!formData.port) {
            newErrors.port = 'Port is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate() || !formData) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving camera:', error);
            // You could set an error message here to display to the user
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
            <div className="relative w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl md:mx-auto">
                <button
                    onClick={onClose}
                    className="absolute text-gray-600 top-4 right-4 hover:text-gray-800"
                    aria-label="Close"
                >
                    <FaTimes size={20} />
                </button>
                
                <h2 className="mb-6 text-2xl font-bold text-gray-800">Edit Camera</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Camera Name */}
                        <div className="col-span-2">
                            <label className="block mb-1 text-sm font-medium text-gray-700">Camera Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>
                        
                        {/* Camera ID (read-only) */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Camera ID</label>
                            <input
                                type="text"
                                value={formData.id || ''}
                                readOnly
                                className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
                            />
                        </div>
                        
                        {/* Network ID (read-only) */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Network ID</label>
                            <input
                                type="text"
                                value={formData.network_id || ''}
                                readOnly
                                className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
                            />
                        </div>
                        
                        {/* Host */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Host</label>
                            <input
                                type="text"
                                name="host"
                                value={formData.host || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md ${errors.host ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.host && (
                                <p className="mt-1 text-xs text-red-500">{errors.host}</p>
                            )}
                        </div>
                        
                        {/* Port */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Port</label>
                            <input
                                type="number"
                                name="port"
                                value={formData.port || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md ${errors.port ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.port && (
                                <p className="mt-1 text-xs text-red-500">{errors.port}</p>
                            )}
                        </div>
                        
                        {/* Username */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Password */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        {/* ONVIF Port */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">ONVIF Port</label>
                            <input
                                type="number"
                                name="onvifPort"
                                value={formData.onvifPort || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Is Virtual */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_virtual"
                                name="is_virtual"
                                checked={formData.is_virtual || false}
                                onChange={handleChange}
                                className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_virtual" className="text-sm font-medium text-gray-700">
                                Virtual Camera
                            </label>
                        </div>
                        
                        {/* Detection Enabled */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="detectionEnabled"
                                name="detectionEnabled"
                                checked={formData.detectionEnabled || false}
                                onChange={handleChange}
                                className="w-4 h-4 mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="detectionEnabled" className="text-sm font-medium text-gray-700">
                                Enable Object Detection
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-end mt-6 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCameraModal;