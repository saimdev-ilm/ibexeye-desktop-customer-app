// src/components/modals/ToggleStatusModal.tsx
import React from 'react';
import { User } from '../../../services/userService';

interface ToggleStatusModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ToggleStatusModal: React.FC<ToggleStatusModalProps> = ({ user, onClose, onConfirm }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-yellow-600">
          {user.account_disabled ? 'Enable' : 'Disable'} User
        </h2>
        <p className="text-gray-700">
          Are you sure you want to {user.account_disabled ? 'enable' : 'disable'} this user?
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded ${user.account_disabled ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
          >
            {user.account_disabled ? 'Enable' : 'Disable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleStatusModal;
