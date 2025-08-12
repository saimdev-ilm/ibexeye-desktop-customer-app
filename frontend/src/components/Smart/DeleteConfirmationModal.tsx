import React from 'react';
import { Alert } from '../../services/alertService';

interface DeleteConfirmationModalProps {
  alert: Alert;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  alert,
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
        
        {/* Modal Title */}
        <h3 className="mb-2 text-xl font-bold text-gray-800">Confirm Deletion</h3>
        
        {/* Modal Description */}
        <p className="mb-6 text-gray-700">
          Are you sure you want to delete notification #{alert.id}? This action cannot be undone.
        </p>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 transition border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
