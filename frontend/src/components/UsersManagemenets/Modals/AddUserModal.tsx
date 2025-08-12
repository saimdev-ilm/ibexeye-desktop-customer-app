import React, { useState } from 'react';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: number;
    }) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 0,
    });

    if (!isOpen) return null;

    const handleChange = (key: string, val: string | number) => {
        setForm({ ...form, [key]: val });
    };

    const handleSubmit = () => {
        if (!form.firstName || !form.lastName || !form.email || !form.password) {
          alert("Please fill all fields");
          return;
        }
        console.log("Submitting user form", form); // ✅ DEBUG
        onAdd(form);
      };
      

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
                <h2 className="mb-4 text-lg font-semibold">Add New User</h2>
                <div className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="First Name" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                    <input className="w-full p-2 border rounded" placeholder="Last Name" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                    <input className="w-full p-2 border rounded" placeholder="Email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                    <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} />
                    <select className="w-full p-2 border rounded" value={form.role} onChange={e => handleChange('role', parseInt(e.target.value))}>
                        <option value={0}>Admin</option>
                        <option value={1}>Sensor Viewer</option>
                        <option value={2}>Sensor Manager</option>
                        <option value={3}>Camera Viewer</option>
                        <option value={4}>Camera Manager</option>
                        <option value={5}>Basic User</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Add User</button>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;
