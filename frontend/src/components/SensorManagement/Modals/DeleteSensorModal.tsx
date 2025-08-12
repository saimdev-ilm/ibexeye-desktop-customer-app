import React from 'react';
import { FaTimes, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface DeleteSensorModalProps {
    sensorId: number;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

const DeleteSensorModal: React.FC<DeleteSensorModalProps> = ({ sensorId, onClose, onConfirm, isLoading }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50 outline-none focus:outline-none">
            <div className="relative w-full max-w-md mx-auto my-6">
                <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t">
                        <h3 className="text-xl font-semibold text-red-600">
                            Delete Sensor
                        </h3>
                        <button
                            className="float-right p-1 ml-auto text-3xl font-semibold leading-none text-gray-500 bg-transparent border-0 outline-none focus:outline-none"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="relative flex-auto p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 mr-4">
                                <FaExclamationTriangle size={24} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="mb-2 text-lg font-medium text-gray-900">
                                    Confirm Deletion
                                </h4>
                                <p className="text-gray-600">
                                    Are you sure you want to delete this sensor? This action cannot be undone.
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                    Sensor ID: {sensorId}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
                        <button
                            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="inline mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Sensor'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteSensorModal;