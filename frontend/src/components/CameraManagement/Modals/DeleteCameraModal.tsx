import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface DeleteCameraModalProps {
    cameraId: string | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isLoading?: boolean; // Added isLoading prop

}

const DeleteCameraModal: React.FC<DeleteCameraModalProps> = ({ cameraId, onClose, onConfirm }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!cameraId) {
        return null;
    }

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting the camera');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl md:mx-auto">
                <button
                    onClick={onClose}
                    className="absolute text-gray-600 top-4 right-4 hover:text-gray-800"
                    aria-label="Close"
                >
                    <FaTimes size={20} />
                </button>
                
                <div className="flex flex-col items-center justify-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 mb-4 text-red-600 bg-red-100 rounded-full">
                        <FaExclamationTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Camera</h3>
                </div>
                
                <p className="mb-6 text-center text-gray-700">
                    Are you sure you want to delete this camera? This action cannot be undone,
                    and all camera data will be permanently removed.
                </p>
                
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}
                
                <div className="flex justify-center space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Camera'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCameraModal;