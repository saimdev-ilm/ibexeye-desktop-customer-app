import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaSpinner, FaCheck, FaTimes, FaTrash } from "react-icons/fa";

interface LocationState {
    userId?: string;
    cloudId?: string;
    name?: string;
}

const EditUser: React.FC = () => {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId: string }>();
    const location = useLocation();
    const state = location.state as LocationState;
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    
    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<number>(5);
    const [, setCloudId] = useState<string | undefined>(state?.cloudId);

    // Form validation
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setErrorMessage('User ID is missing');
                setIsLoading(false);
                return;
            }

            try {
                // Replace with your actual API call
                const response = await fetch(`/api/users/${userId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                
                const userData = await response.json();
                
                // Populate form fields
                setFirstName(userData.firstName || '');
                setLastName(userData.lastName || '');
                setEmail(userData.email || '');
                setRole(userData.role || 5);
                setCloudId(userData.cloud_id || state?.cloudId);
                
            } catch (error) {
                console.error('Error fetching user data:', error);
                setErrorMessage('Failed to load user data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [userId, state]);

    const validateForm = () => {
        const newErrors: any = {};
        
        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email address is invalid';
        }
        
        // Only validate password if it's provided (since it might not be changed)
        if (password) {
            if (password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
            
            if (password !== confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Reset messages
        setSuccessMessage(null);
        setErrorMessage(null);
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            // Prepare update data, only include password if it was changed
            const updateData: any = {
                firstName,
                lastName,
                email,
                role,
            };
            
            if (password) {
                updateData.password = password;
            }
            
            // Replace with your actual API call
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user');
            }
            
            setSuccessMessage('User updated successfully');
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate('/usersManagement');
            }, 2000);
            
        } catch (error) {
            console.error('Error updating user:', error);
            setErrorMessage('Failed to update user. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!userId) return;
        
        setIsDeleting(true);
        
        try {
            // Replace with your actual API call
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            
            setSuccessMessage('User deleted successfully');
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate('/usersManagement');
            }, 2000);
            
        } catch (error) {
            console.error('Error deleting user:', error);
            setErrorMessage('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-full">
            <header className="flex items-center justify-between gap-3 px-3 py-2 mb-6 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        title="Back to Users Management"
                        onClick={() => navigate('/usersManagement')}
                        className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
                        Edit User: {state?.name || `${firstName} ${lastName}`}
                    </h1>
                </div>
            </header>

            <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <FaSpinner className="text-4xl text-customBlue animate-spin" />
                    </div>
                ) : (
                    <>
                        {successMessage && (
                            <div className="p-4 mb-6 text-green-700 bg-green-100 rounded-md">
                                <div className="flex items-center gap-2">
                                    <FaCheck />
                                    <span>{successMessage}</span>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md">
                                <div className="flex items-center gap-2">
                                    <FaTimes />
                                    <span>{errorMessage}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            <div className="mt-4">
                                <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                >
                                    <option value={0}>Admin</option>
                                    <option value={1}>Sensor Viewer</option>
                                    <option value={2}>Sensor Manager</option>
                                    <option value={3}>Camera Viewer</option>
                                    <option value={4}>Camera Manager</option>
                                    <option value={5}>Basic User</option>
                                </select>
                            </div>

                            <div className="p-4 mt-6 border border-gray-200 rounded-md">
                                <h3 className="mb-4 text-lg font-medium">Change Password (Optional)</h3>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                                            New Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700">
                                            Confirm New Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-customBlue"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Leave blank if you don't want to change the password.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-between gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                                    disabled={isSubmitting || isDeleting}
                                >
                                    <FaTrash className="mr-2" />
                                    Delete User
                                </button>
                                
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/usersManagement')}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center px-4 py-2 text-white rounded-md bg-customBlue hover:bg-blue-600 disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FaSpinner className="mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update User'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Delete Confirmation Modal */}
                        {showDeleteConfirmation && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="w-full max-w-md p-6 bg-white rounded-lg">
                                    <h3 className="mb-4 text-xl font-medium text-gray-900">Confirm Delete</h3>
                                    <p className="mb-6 text-gray-700">
                                        Are you sure you want to delete this user? This action cannot be undone.
                                    </p>
                                    <div className="flex justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirmation(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <FaSpinner className="mr-2 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                'Delete'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EditUser;