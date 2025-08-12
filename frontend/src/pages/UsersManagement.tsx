import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaChevronLeft,
    FaSolarPanel,
    FaEdit,
    FaUserPlus,
    FaSpinner,
    FaTrash,
    FaCheck,
    FaSearch,
    FaFilter,
    FaSort,
    FaTimes,
    FaUsers,
    FaInfoCircle
} from "react-icons/fa";

// Import the service functions
import {
    getDeviceUsers,
    deleteUser,
    getRoleName,
    User,
     addUserToDevice
} from '../services/userService';

import { getToken } from '../services/authService';
import EditUserModal from '../components/UsersManagemenets/Modals/EditUserModal';
import DeleteUserModal from '../components/UsersManagemenets/Modals/DeleteUserModal';
import AddUserModal from '../components/UsersManagemenets/Modals/AddUserModal';
import { updateDeviceUser, updateUserRole } from '../services/updateUserService';

const UsersManagement: React.FC = () => {
    const navigate = useNavigate();
    const { deviceId } = useParams<{ deviceId: string }>();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortField, setSortField] = useState<'name' | 'email' | 'role'>('name');
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    const [editModalUser, setEditModalUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const handleAddUser = () => setAddModalOpen(true);



    // Fetch users using the service function
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Check if token exists
            const token = getToken();
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            // Use the deviceId from URL params or default to 1
            const currentDeviceId = deviceId || '1';

            // Use the service function to fetch users
            const usersData = await getDeviceUsers(currentDeviceId);

            // Set users from the service response
            setUsers(usersData);
            setFilteredUsers(usersData);
            setError(null);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            setError(`Failed to load users: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters and sorting whenever filter states change
    useEffect(() => {
        if (users.length === 0) return;

        let result = [...users];

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(user =>
                user.firstName.toLowerCase().includes(term) ||
                user.lastName.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term)
            );
        }

        // Apply role filter
        if (roleFilter !== null) {
            result = result.filter(user => user.role === roleFilter);
        }



        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === 'name') {
                comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            } else if (sortField === 'email') {
                comparison = a.email.localeCompare(b.email);
            } else if (sortField === 'role') {
                comparison = a.role - b.role;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredUsers(result);
    }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [deviceId]);

    // Show toast notification
    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter(null);
        setStatusFilter(null);
        setIsFiltersOpen(false);
        showNotification('Filters cleared', 'info');
    };

    const handleHomeDashboard = () => {
        navigate("/");
    };

    const handleAllSolarDashboard = () => {
        navigate("/allSolarDashboard");
    };

    const handleAddUserSubmit = async (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string; // ✅ Add this!
        role: number;
    }) => {
        console.log("Form Submitted:", data);

        const resolvedDeviceId = deviceId || "1";
        console.log("Resolved Device ID:", resolvedDeviceId);

        try {
            console.log("Sending deviceId to /sync-user:", resolvedDeviceId);

            // ✅ Send real password from form
            const newUser = await addUserToDevice(data, resolvedDeviceId);

            console.log("New user added", newUser);
            setUsers(prev => [...prev, newUser]);
            showNotification("User added successfully", 'success');
            setAddModalOpen(false);
        } catch (error: any) {
            console.error("Add failed", error);
            showNotification(error.message || "Failed to add user", 'error');
        }
    };




    // Update the handleEdit function
    const handleEdit = (user: User) => {
        console.log("Opening edit modal for user:", user);
        // Make a deep copy of the user object to avoid reference issues
        setEditModalUser({ ...user });
    };

// Then replace your handleEditSubmit function with this:
const handleEditSubmit = async (updatedUser: User) => {
    try {
      console.log("Submitting updated user:", updatedUser);
      
      // Get the device ID from URL params or default to 1
      const currentDeviceId = deviceId || '1';
  
      // Step 1: Update user profile (first name, last name)
      await updateDeviceUser(
        currentDeviceId,
        updatedUser.id,
        {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        }
      );
  
      // Step 2: Update user role if it has changed
      // We don't have the original role here, so we'll always update it
      await updateUserRole(
        currentDeviceId,
        updatedUser.email,
        updatedUser.role
      );
  
      // Update the local state
      setUsers(prev => prev.map(u => (u.id === updatedUser.id ? {...u, ...updatedUser} : u)));
      
      showNotification('User updated successfully', 'success');
      setEditModalUser(null); // Close the modal
    } catch (err: any) {
      console.error("Error updating user:", err);
      showNotification(err.message || 'Failed to update user', 'error');
    }
  };



    const handleDeleteUser = (userId: number) => {
        setDeleteUserId(userId);
    };

    const confirmDeleteUser = async () => {
        if (!deleteUserId) return;

        try {
            await deleteUser(deleteUserId);
            setUsers(prev => prev.filter(u => u.id !== deleteUserId));
            showNotification('User deleted successfully', 'success');
        } catch (err: any) {
            console.error(err);
            showNotification('Failed to delete user', 'error');
        } finally {
            setDeleteUserId(null);
        }
    };


    const handleSort = (field: 'name' | 'email' | 'role') => {
        if (sortField === field) {
            // Toggle sort order if the same field is clicked
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field and default to ascending
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Get sort icon based on current sort state
    const getSortIcon = (field: 'name' | 'email' | 'role') => {
        if (sortField !== field) return null;

        return (
            <span className="ml-1 text-xs">
                {sortOrder === 'asc' ? '▲' : '▼'}
            </span>
        );
    };

    // Generate role badge with appropriate color
    const getRoleBadge = (roleNumber: number) => {
        const roleName = getRoleName(roleNumber);
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-700";

        switch (roleNumber) {
            case 0: // Admin
                bgColor = "bg-purple-100";
                textColor = "text-purple-700";
                break;
            case 1: // Sensor Viewer
                bgColor = "bg-blue-100";
                textColor = "text-blue-700";
                break;
            case 2: // Sensor Manager
                bgColor = "bg-green-100";
                textColor = "text-green-700";
                break;
            case 3: // Camera Viewer
                bgColor = "bg-yellow-100";
                textColor = "text-yellow-700";
                break;
            case 4: // Camera Manager
                bgColor = "bg-orange-100";
                textColor = "text-orange-700";
                break;
            case 5: // Basic User
                bgColor = "bg-red-100";
                textColor = "text-red-700";
                break;
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {roleName}
            </span>
        );
    };

    return (
        <div className="flex flex-col w-full ">
            {/* Toast Notification */}
            {showToast && (
                <div
                    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md animate-fade-in-down ${toastType === 'success' ? 'bg-green-100 border-l-4 border-green-500' :
                        toastType === 'error' ? 'bg-red-100 border-l-4 border-red-500' :
                            'bg-blue-100 border-l-4 border-blue-500'
                        }`}
                >
                    <div className={`flex-shrink-0 ${toastType === 'success' ? 'text-green-500' :
                        toastType === 'error' ? 'text-red-500' :
                            'text-blue-500'
                        }`}>
                        {toastType === 'success' ? <FaCheck /> :
                            toastType === 'error' ? <FaTimes /> :
                                <FaInfoCircle />}
                    </div>
                    <div className="text-sm font-medium">
                        {toastMessage}
                    </div>
                    <button
                        onClick={() => setShowToast(false)}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            <header className="flex items-center justify-between gap-3 px-3 py-2 mb-6 bg-white border rounded-full shadow-md 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        title="Go to Home Dashboard"
                        onClick={handleHomeDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
                        Users Management
                    </h1>
                    {!loading && filteredUsers.length > 0 && (
                        <p className="text-sm text-gray-500 ">
                            (Showing {filteredUsers.length} of {users.length} users)
                        </p>
                    )}
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        title="Go to Solar Dashboard"
                        onClick={handleAllSolarDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <FaSolarPanel />
                    </button>
                    <button
                        onClick={handleAddUser}
                        className="px-4 py-2 text-sm text-white transition-colors rounded-lg shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <div className="flex items-center gap-2">
                            <FaUserPlus />
                            <span>Add User</span>
                        </div>
                    </button>
                </div>
            </header>

            <div className="">


                {/* Search Bar */}
                <div className="p-4 mb-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div className="relative w-full md:w-1/2">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full py-2 pl-10 pr-4 transition-shadow border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-customBlue"
                            />
                            {searchTerm && (
                                <button
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex w-full gap-2 md:w-auto">
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className={`px-3 py-2 flex items-center gap-2 border rounded-md text-sm transition-colors ${isFiltersOpen || roleFilter !== null || statusFilter !== null
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <FaFilter />
                                <span>Filters</span>
                                {(roleFilter !== null || statusFilter !== null) && (
                                    <span className="flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-blue-500 rounded-full">
                                        {(roleFilter !== null ? 1 : 0) + (statusFilter !== null ? 1 : 0)}
                                    </span>
                                )}
                            </button>

                            <div className="relative dropdown">
                                <button
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <FaSort />
                                    <span>Sort</span>
                                </button>
                                <div className="absolute right-0 z-10 hidden w-48 mt-2 bg-white border border-gray-200 rounded-md shadow-lg dropdown-menu group-hover:block">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                    >
                                        Name {getSortIcon('name')}
                                    </button>
                                    <button
                                        onClick={() => handleSort('email')}
                                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                    >
                                        Email {getSortIcon('email')}
                                    </button>
                                    <button
                                        onClick={() => handleSort('role')}
                                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                    >
                                        Role {getSortIcon('role')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Filters */}
                    {isFiltersOpen && (
                        <div className="pt-4 mt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-4">
                                <div className="w-full md:w-auto">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={roleFilter === null ? "" : roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value === "" ? null : Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md md:w-auto focus:outline-none focus:ring-2 focus:ring-customBlue"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="0">Admin</option>
                                        <option value="1">Sensor Viewer</option>
                                        <option value="2">Sensor Manager</option>
                                        <option value="3">Camera Viewer</option>
                                        <option value="4">Camera Manager</option>
                                        <option value="5">Basic User</option>
                                    </select>
                                </div>

                                {(roleFilter !== null || statusFilter !== null) && (
                                    <div className="flex items-end">
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-2 text-sm text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-lg">
                        <FaSpinner className="mb-4 text-4xl text-customBlue animate-spin" />
                        <p className="text-gray-600">Loading users...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center border border-red-200 rounded-lg bg-red-50">
                        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-red-500 bg-red-100 rounded-full">
                            <FaTimes size={24} />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-red-800">Error Loading Users</h3>
                        <p className="mb-4 text-red-600">{error}</p>
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 text-white transition-colors rounded-lg shadow-sm bg-customBlue hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                        {/* Table Header */}
                        <div className="hidden p-4 border-b border-gray-200 md:flex bg-gray-50">
                            <div className="flex items-center w-6/12 font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('name')}>
                                User {getSortIcon('name')}
                            </div>
                            <div className="flex items-center w-3/12 font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('email')}>
                                Email {getSortIcon('email')}
                            </div>
                            <div className="flex items-center w-2/12 font-medium text-gray-700 cursor-pointer" onClick={() => handleSort('role')}>
                                Role {getSortIcon('role')}
                            </div>
                            <div className="w-1/12 font-medium text-right text-gray-700">
                                Actions
                            </div>
                        </div>

                        {filteredUsers.length > 0 ? (
                            <div className="h-[70vh] custom-scrollbar2 overflow-y-auto divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`relative hover:bg-gray-50 transition-colors ${user.account_disabled ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        <div className="flex flex-col p-4 md:flex-row md:items-center">
                                            {/* User Info */}
                                            <div className="flex items-center w-full mb-3 md:w-6/12 md:mb-0">
                                                <div className={`w-10 h-10 overflow-hidden ${user.account_disabled ? 'bg-gray-400' : 'bg-blue-100'
                                                    } rounded-full flex-shrink-0`}>
                                                    <div className="flex items-center justify-center w-full h-full text-lg font-semibold text-gray-600">
                                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 ml-3">
                                                    <div className="flex items-center">
                                                        <h3 className={`font-medium truncate ${user.account_disabled ? 'text-gray-500' : 'text-gray-800'
                                                            }`}>
                                                            {user.firstName} {user.lastName}
                                                        </h3>
                                                        {user.account_disabled && (
                                                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full whitespace-nowrap">
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate md:hidden">{user.email}</p>
                                                    <div className="mt-1 md:hidden">
                                                        {getRoleBadge(user.role)}
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500 md:hidden">
                                                        Cloud ID: {user.cloud_id}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Email - Hidden on Mobile */}
                                            <div className="hidden w-3/12 text-sm text-gray-500 truncate md:block">
                                                {user.email}
                                            </div>

                                            {/* Role - Hidden on Mobile */}
                                            <div className="items-center hidden w-2/12 md:flex">
                                                {getRoleBadge(user.role)}
                                            </div>

                                            {/* Actions */}
                                            {/* Actions */}
                                            <div className="flex justify-end w-full gap-2 md:w-1/12">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                                >
                                                    <FaEdit className="mr-1" />
                                                    Edit
                                                </button>



                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                                                >
                                                    <FaTrash className="mr-1" />
                                                    Delete
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                {searchTerm || roleFilter !== null || statusFilter !== null ? (
                                    <div>
                                        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-blue-500 bg-blue-100 rounded-full">
                                            <FaSearch />
                                        </div>
                                        <h3 className="mb-2 text-lg font-medium text-gray-800">No matching users found</h3>
                                        <p className="mb-4 text-gray-600">Try adjusting your search or filter criteria</p>
                                        <button
                                            onClick={clearFilters}
                                            className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-gray-500 bg-gray-100 rounded-full">
                                            <FaUsers />
                                        </div>
                                        <h3 className="mb-2 text-lg font-medium text-gray-800">No users found</h3>
                                        <p className="mb-4 text-gray-600">There are no users assigned to this device yet.</p>
                                        <button
                                            onClick={handleAddUser}
                                            className="px-4 py-2 text-white transition-colors rounded-lg bg-customBlue hover:bg-blue-600"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaUserPlus />
                                                <span>Add New User</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <EditUserModal
                user={editModalUser}
                onClose={() => setEditModalUser(null)}
                onSave={handleEditSubmit}
            />

            <DeleteUserModal
                userId={deleteUserId}
                onClose={() => setDeleteUserId(null)}
                onConfirm={confirmDeleteUser}
            />
            <AddUserModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={handleAddUserSubmit}
            />
        </div>
    );
};

export default UsersManagement;