import React, { useState } from 'react';
import { signupUser } from '../../services/apiService';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';

interface AddNewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddNewUserModal: React.FC<AddNewUserModalProps> = ({ isOpen, onClose }) => {
    interface FormData {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        org_id: string;
        role_id: string;
    }

    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        org_id: '',
        role_id: ''
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await signupUser(formData);
            setSuccessMessage("User successfully signed up! Check your email.");
        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrorMessage(err.message);
            } else {
                setErrorMessage("Signup failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="relative w-full max-w-lg p-6 bg-white shadow-lg rounded-xl dark:bg-gray-800">
                    <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-white">Add New User</h2>
                    <button onClick={onClose} className="absolute p-2 text-gray-600 top-3 right-3 dark:text-gray-400 hover:text-gray-900">✖</button>
                    
                    {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password:</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name:</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name:</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization ID:</label>
                                <input type="text" name="org_id" value={formData.org_id} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role ID:</label>
                                <input type="text" name="role_id" value={formData.role_id} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                        </div>
                        <button type="submit" className="w-full px-4 py-2 mt-4 text-white rounded-full bg-customBlue hover:bg-blue-600" disabled={loading}>
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Show Success Modal if Signup is Successful */}
            <SuccessModal isOpen={!!successMessage} message={successMessage || ""} onClose={() => setSuccessMessage(null)} />
            <ErrorModal isOpen={!!errorMessage} message={errorMessage || ""} onClose={() => setErrorMessage(null)} />

        </>
    );
};

const AddNewUser: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return <AddNewUserModal isOpen={isOpen} onClose={onClose} />;
};

export default AddNewUser;
