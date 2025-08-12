// src/components/modals/EditUserModal.tsx
import React, { useEffect } from 'react';
import { User } from '../../../services/userService';

interface EditUserModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  // Initialize state with null, will be updated in useEffect
  const [editedUser, setEditedUser] = React.useState<User | null>(null);

  // Update local state when the user prop changes
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      console.log("EditUserModal received user:", user);
    }
  }, [user]);

  // If there's no user or editedUser, don't render anything
  if (!user || !editedUser) return null;

  const handleChange = (field: keyof User, value: any) => {
    setEditedUser(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedUser) {
      console.log("Saving edited user:", editedUser);
      onSave(editedUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Edit User</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              placeholder="First Name"
              value={editedUser.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              placeholder="Last Name"
              value={editedUser.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={editedUser.email}
              className="w-full p-2 bg-gray-100 border rounded focus:outline-none"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
            <select
              value={editedUser.role}
              onChange={(e) => handleChange('role', parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Admin</option>
              <option value={1}>Sensor Viewer</option>
              <option value={2}>Sensor Manager</option>
              <option value={3}>Camera Viewer</option>
              <option value={4}>Camera Manager</option>
              <option value={5}>Basic User</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;