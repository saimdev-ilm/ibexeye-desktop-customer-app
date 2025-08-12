import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";

const AddUser: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<number>(5); // Default to Basic User

    // Form validation
    const [errors, setErrors] = useState<{
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const newErrors: any = {};
        
        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email address is invalid';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            // Replace with your actual API call
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    role,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create user');
            }
            
            setSuccessMessage('User created successfully');
            
            // Clear form
            setFirstName('');
            setLastName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole(5);
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate('/usersManagement');
            }, 2000);
            
        } catch (error) {
            console.error('Error creating user:', error);
            setErrorMessage('Failed to create user. Please try again.');
        } finally {
            setIsSubmitting(false);
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
                        Add New User
                    </h1>
                </div>
            </header>

            <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow">
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
                                placeholder="John"
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
                                placeholder="Doe"
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
                            placeholder="john.doe@example.com"
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

                    <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                                Password
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
                                Confirm Password
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

                    <div className="flex justify-end mt-6 space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/usersManagement')}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
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
                                    Creating...
                                </>
                            ) : (
                                'Create User'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUser;