// src/components/modals/DeleteUserModal.tsx
import React from 'react';

interface DeleteUserModalProps {
  userId: number | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ userId, onClose, onConfirm }) => {
  if (userId === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-red-600">Delete User</h2>
        <p className="text-gray-700">Are you sure you want to delete this user? This action cannot be undone.</p>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
