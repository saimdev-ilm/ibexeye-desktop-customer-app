import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    FaChevronLeft,
    FaCamera,
    FaPlus,
    FaSearch,
    FaExclamationTriangle,
    FaEllipsisV,
    FaEdit,
    FaTrash,
    FaPowerOff,
    FaCheck,
    FaTimes,
    FaInfoCircle,
    FaSpinner,
    FaTachometerAlt,
    FaChartLine,
 } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
    getSensorsByDeviceId,
    updateSensor,
    deleteSensor,
    Sensor,
 } from "../services/sensorService";
import { useWebSocket } from '../contexts/WebSocketContext';
  
import ViewSensorModal from '../components/SensorManagement/Modals/ViewSensorModal';
import EditSensorModal from '../components/SensorManagement/Modals/EditSensorModal';
import DeleteSensorModal from '../components/SensorManagement/Modals/DeleteSensorModal';
import AddSensorModal from '../components/SensorManagement/Modals/AddSensorModal';

// Define toast type
type ToastType = 'success' | 'error' | 'info';

const AllSensorDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filter, setFilter] = useState<string>("All");
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // WebSocket integration
    const { data: webSocketData, isConnected, subscribeToTopic } = useWebSocket();

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [editModalSensor, setEditModalSensor] = useState<Sensor | null>(null);
    const [viewSensor, setViewSensor] = useState<Sensor | null>(null);
    const [deleteSensorId, setDeleteSensorId] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    // Menu states
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Loading states for operations
    const [notificationLoadingSensorId, setNotificationLoadingSensorId] = useState<number | null>(null);

    // Toast notification
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');
    const [toastType, setToastType] = useState<ToastType>('info');

    const isMounted = useRef<boolean>(false);
    const navigate = useNavigate();

    // Extract unique channels from sensors for WebSocket subscription
    const getUniqueChannels = useCallback((sensorList: Sensor[]) => {
        const channels = new Set<string>();
        sensorList.forEach(sensor => {
            if (sensor.mqttTopic) {
                // Extract channel from topic (e.g., "home/dht22/temperature" -> "home")
                const channel = sensor.mqttTopic.split('/')[0];
                if (channel) {
                    channels.add(channel);
                }
            }
        });
        return Array.from(channels);
    }, []);

    // Update sensor data with WebSocket values
    const updateSensorWithWebSocketData = useCallback((sensor: Sensor) => {
        const topic = sensor.mqttTopic;
        
        // Check all WebSocket data for matching topic
        for (const [channel, channelData] of Object.entries(webSocketData)) {
            if (channelData && typeof channelData === 'object') {
                const topicData = (channelData as any)[topic];
                if (topicData !== undefined) {
                    // Parse the value and unit from message like "28.6 C" or "77 AQI"
                    let value = topicData;
                    let unit = sensor.unit || '';
                    
                    if (typeof topicData === 'string') {
                        // Extract numeric value and unit from string like "28.6 C"
                        const match = topicData.match(/^([\d.-]+)\s*(.*)$/);
                        if (match) {
                            const numericValue = parseFloat(match[1]);
                            const extractedUnit = match[2].trim();
                            
                            if (!isNaN(numericValue)) {
                                value = numericValue;
                                if (extractedUnit && !sensor.unit) {
                                    unit = extractedUnit;
                                }
                            }
                        }
                    }
                    
                    return {
                        ...sensor,
                        lastReading: value,
                        lastReadingTimestamp: new Date().toISOString(),
                        unit: unit
                    };
                }
            }
        }
        
        return sensor;
    }, [webSocketData]);

    // Render sensor status indicator based on active state and recent data
    const renderSensorStatus = (sensor: Sensor) => {
        // Check if sensor has recent data (within last 5 minutes)
        const hasRecentData = sensor.lastReadingTimestamp && 
            (Date.now() - new Date(sensor.lastReadingTimestamp).getTime()) < 300000; // 5 minutes
        
        // Sensor is considered online if it's active AND has recent data
        const isOnline = sensor.active && hasRecentData;
        
        if (isOnline) {
            return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Online</span>;
        } else if (sensor.active && !hasRecentData) {
            return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">No Data</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Offline</span>;
        }
    };

    // Function to fetch sensors with WebSocket initialization
    const fetchSensors = useCallback(async () => {
        console.log("🔔 Starting sensor fetch...");

        setLoading(true);
        try {
            const sensorsData = await getSensorsByDeviceId();
            console.log("🔔 Sensors Retrieved:", sensorsData);

            // Set sensors
            if (isMounted.current) {
                setSensors(sensorsData);
                setError(null);
                
                // Subscribe to WebSocket channels based on sensor topics
                const channels = getUniqueChannels(sensorsData);
                console.log("🔔 Subscribing to WebSocket channels:", channels);
                channels.forEach(channel => {
                    subscribeToTopic(channel);
                });
            }
        } catch (error) {
            console.error("❌ Failed to load sensors:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            if (isMounted.current) {
                setError(errorMessage);
                showNotification(`Failed to load sensors: ${errorMessage}`, 'error');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [getUniqueChannels, subscribeToTopic]);

    // Update sensors with WebSocket data when it changes
    useEffect(() => {
        if (sensors.length > 0 && Object.keys(webSocketData).length > 0) {
            console.log("🔄 Updating sensors with WebSocket data");
            const updatedSensors = sensors.map(sensor => updateSensorWithWebSocketData(sensor));
            setSensors(updatedSensors);
        }
    }, [webSocketData, sensors.length]);

    // Auto-refresh every 30 seconds to get fresh data
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                getSensorsByDeviceId().then(data => {
                    if (isMounted.current) {
                        // Update sensors but preserve WebSocket data
                        setSensors(prevSensors => 
                            data.map(sensor => {
                                const existingSensor = prevSensors.find(s => s.id === sensor.id);
                                return existingSensor && existingSensor.lastReadingTimestamp &&
                                       new Date(existingSensor.lastReadingTimestamp) > new Date(sensor.lastReadingTimestamp || 0)
                                    ? existingSensor  // Keep WebSocket updated data
                                    : sensor;         // Use fresh API data
                            })
                        );
                    }
                }).catch(console.error);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [loading]);

    // Toggle sensor menu
    const toggleMenu = (sensorId: number) => {
        if (activeMenu === sensorId.toString()) {
            setActiveMenu(null);
        } else {
            setActiveMenu(sensorId.toString());
        }
    };

    // Handle menu actions
    const handleView = (sensor: Sensor) => {
        console.log("Opening view modal for sensor:", sensor);
        setViewSensor({ ...sensor });
        setActiveMenu(null);
    };

    const handleEdit = (sensor: Sensor) => {
        console.log("Opening edit modal for sensor:", sensor);
        setEditModalSensor({ ...sensor });
        setActiveMenu(null);
    };

    const handleDelete = (sensorId: number) => {
        setDeleteSensorId(sensorId);
        setActiveMenu(null);
    };

    const showNotification = (message: string, type: ToastType) => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);

        // Auto-hide toast after 5 seconds
        setTimeout(() => {
            if (isMounted.current) {
                setShowToast(false);
            }
        }, 5000);
    };

    const confirmDelete = async () => {
        if (deleteSensorId === null) return;

        try {
            setDeleteLoading(true);
            const success = await deleteSensor(deleteSensorId);

            if (success) {
                setSensors(prev => prev.filter(s => s.id !== deleteSensorId));
                showNotification('Sensor deleted successfully', 'success');
                await fetchSensors();
            } else {
                throw new Error("Failed to delete sensor");
            }
        } catch (err: any) {
            console.error("Failed to delete sensor:", err);
            showNotification(`Failed to delete sensor: ${err.message}`, 'error');
        } finally {
            setDeleteLoading(false);
            setDeleteSensorId(null);
        }
    };

    const handleEditSubmit = async (updatedSensor: Sensor) => {
        try {
            await updateSensor(updatedSensor.id, updatedSensor);
            setSensors(prev => prev.map(s => (s.id === updatedSensor.id ? { ...s, ...updatedSensor } : s)));
            showNotification('Sensor updated successfully', 'success');
            setEditModalSensor(null);
            await fetchSensors();
        } catch (err: any) {
            console.error("Error updating sensor:", err);
            showNotification(err.message || 'Failed to update sensor', 'error');
        }
    };

    const handleAddSensorSubmit = async (data: any) => {
        try {
            await fetchSensors();
            showNotification("Sensor added successfully", 'success');
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error("Add failed", error);
            showNotification(error.message || "Failed to add sensor", 'error');
        }
    };

    // Navigation handlers
    const handleHomeDashboard = () => {
        navigate("/");
    };

    const handleAllCameraDashboard = () => {
        navigate("/allCameraDashboard");
    };

    // Filter sensors based on search and filter settings
    const filteredSensors = sensors.filter((sensor) => {
        const matchesSearch = sensor.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false;
        const matchesFilter = filter === "All" || (filter === "Active" && sensor.active);
        return matchesSearch && matchesFilter;
    });

    // Toggle notification handler
    const handleToggleNotifications = async (sensor: Sensor) => {
        try {
            setNotificationLoadingSensorId(sensor.id);
            setActiveMenu(null);

            console.log(`${sensor.notificationsEnabled ? 'Disabling' : 'Enabling'} notifications for sensor ${sensor.id}...`);

            await updateSensor(sensor.id, { notificationsEnabled: !sensor.notificationsEnabled });
            await fetchSensors();

            showNotification(`Notifications ${!sensor.notificationsEnabled ? 'enabled' : 'disabled'} successfully for ${sensor.name}`, 'success');
        } catch (error: any) {
            console.error("Notification toggle error:", error);
            if (isMounted.current) {
                showNotification(`Failed to ${sensor.notificationsEnabled ? 'disable' : 'enable'} notifications: ${error.message}`, 'error');
            }
        } finally {
            if (isMounted.current) {
                setNotificationLoadingSensorId(null);
            }
        }
    };

    // Notification button renderer
    const renderNotificationButton = (sensor: Sensor) => {
        const isLoading = notificationLoadingSensorId === sensor.id;
        const icon = isLoading
            ? <FaSpinner className="mr-2 text-purple-500 animate-spin" />
            : sensor.notificationsEnabled
                ? <FaPowerOff className="mr-2 text-red-500" />
                : <FaPowerOff className="mr-2 text-green-500" />;
        const label = sensor.notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';

        return (
            <button
                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleToggleNotifications(sensor)}
                disabled={isLoading}
            >
                {icon} {label}
            </button>
        );
    };

    // Helper function to format sensor reading value with its unit
    const formatSensorValue = (sensor: Sensor): string => {
        if (sensor.lastReading === null || sensor.lastReading === undefined) return 'No data';
        
        let value = sensor.lastReading;
        
        // Round to 2 decimal places if it's a number
        if (typeof value === 'number') {
            value = Math.round(value * 100) / 100;
        }
        
        return `${value}${sensor.unit ? ' ' + sensor.unit : ''}`;
    };

    // Format timestamp to relative time or date
    const formatTimestamp = (timestamp: string | null): string => {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffSecs < 60) return `${diffSecs} seconds ago`;
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        
        return date.toLocaleDateString();
    };

    // Check if any sensor operation is in progress
    const isOperationInProgress = (sensorId: number): boolean => {
        return notificationLoadingSensorId === sensorId;
    };

    useEffect(() => {
        console.log("Component mounted - starting initial sensor fetch");
        isMounted.current = true;
        fetchSensors();

        return () => {
            console.log("Component unmounting - cleanup");
            isMounted.current = false;
        };
    }, [fetchSensors]);

    return (
        <div className="flex flex-col w-full h-full">
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

            {/* Header Section */}
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
                        Sensor Dashboard
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        title="Go to Camera Dashboard"
                        onClick={handleAllCameraDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <FaCamera />
                    </button>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center w-full gap-2">
                {/* Search and Filter Controls */}
                <div className="flex flex-col items-start justify-between w-full gap-4 mb-4 md:flex-row md:items-center">
                    <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search sensors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 transition-shadow border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-customBlue"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-customBlue"
                        >
                            <option value="All">All Sensors</option>
                            <option value="Active">Active Sensors</option>
                        </select>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 text-sm text-white transition-colors rounded-lg shadow-sm bg-customBlue hover:bg-blue-600"
                         >
                            <div className="flex items-center gap-2">
                                <FaPlus />
                                <span>Add Sensor</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sensors Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center w-full h-64">
                        <div className="w-12 h-12 mb-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        <p className="text-gray-600">Loading sensors...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center w-full h-64">
                        <FaExclamationTriangle size={32} className="mb-4 text-yellow-500" />
                        <p className="mb-4 text-lg text-red-500">{error}</p>
                        <button
                            onClick={fetchSensors}
                            className="px-4 py-2 text-white rounded-md bg-customBlue hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-[70vh] overflow-y-auto custom-scrollbar2">
                        <div
                            className="grid gap-6 pb-3"
                            style={{
                                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                            }}
                        >
                            {filteredSensors.length > 0 ? (
                                filteredSensors.map((sensor) => (
                                    <div key={sensor.id} className="relative group">
                                        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                                            {/* Sensor Card */}
                                            <div className="relative">
                                                {/* Status indicator */}
                                                <div className="absolute top-2 left-2">
                                                    {renderSensorStatus(sensor)}
                                                </div>

                                                {/* Real-time indicator */}
                                                {sensor.lastReadingTimestamp && 
                                                 (Date.now() - new Date(sensor.lastReadingTimestamp).getTime()) < 10000 && (
                                                    <div className="absolute flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full top-2 left-20">
                                                        <div className="w-2 h-2 mr-1 bg-blue-500 rounded-full animate-pulse"></div>
                                                        Live
                                                    </div>
                                                )}

                                                {/* Action buttons */}
                                                <div className="absolute z-30 flex gap-2 top-2 right-2">
                                                    {/* Menu button */}
                                                    <button
                                                        className={`p-2 text-white bg-gray-800 rounded-full bg-opacity-70 ${isOperationInProgress(sensor.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                                                            }`}
                                                        onClick={() => toggleMenu(sensor.id)}
                                                        disabled={isOperationInProgress(sensor.id)}
                                                    >
                                                        <FaEllipsisV />
                                                    </button>
                                                </div>

                                                {/* Operation indicators */}
                                                {notificationLoadingSensorId === sensor.id && (
                                                    <div className="absolute z-20 flex items-center px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded-full bottom-2 left-2">
                                                        <FaSpinner className="mr-1 animate-spin" />
                                                        <span>{sensor.notificationsEnabled ? "Disabling" : "Enabling"} notifications...</span>
                                                    </div>
                                                )}

                                                {/* Dropdown menu */}
                                                {activeMenu === sensor.id.toString() && (
                                                    <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg right-2 top-12">
                                                        <button
                                                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                                            onClick={() => handleView(sensor)}
                                                        >
                                                            <FaChartLine className="mr-2 text-green-500" />
                                                            View Details
                                                        </button>
                                                        <button 
                                                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" 
                                                            onClick={() => handleEdit(sensor)}
                                                         >
                                                            <FaEdit className="mr-2 text-blue-500" /> Edit
                                                        </button>
                                                        {renderNotificationButton(sensor)}
                                                        <button
                                                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                                            onClick={() => handleDelete(sensor.id)}
                                                         >
                                                            <FaTrash className="mr-2 text-red-500" /> Delete
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Sensor Reading Display */}
                                                <div className="flex flex-col items-center justify-center h-56 bg-gray-50">
                                                    <div className="flex flex-col items-center p-4">
                                                        <FaTachometerAlt size={48} className="mb-4 text-blue-500" />
                                                        
                                                        {/* Current reading */}
                                                        <div className="mb-2 text-3xl font-bold text-gray-800">
                                                            {formatSensorValue(sensor)}
                                                        </div>
                                                        
                                                        {/* Last updated time */}
                                                        <div className="text-sm text-gray-500">
                                                            Last updated: {formatTimestamp(sensor.lastReadingTimestamp)}
                                                        </div>
                                                        
                                                        {/* Data type */}
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            <span className="px-2 py-1 bg-gray-200 rounded-full">
                                                                {sensor.dataType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sensor Info */}
                                            <div className="p-4">
                                                <h3 className="mb-1 font-medium text-gray-800">{sensor.name || 'Unnamed Sensor'}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1">{sensor.description || 'No description'}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* Topic badge */}
                                                    <span className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full" title={sensor.mqttTopic}>
                                                        {sensor.mqttTopic.length > 20 ? sensor.mqttTopic.substring(0, 20) + '...' : sensor.mqttTopic}
                                                    </span>

                                                    {/* Zone badge if applicable */}
                                                    {sensor.zone !== null && (
                                                        <span className="px-2 py-1 text-xs font-medium text-teal-700 bg-teal-100 rounded-full">
                                                            Zone: {typeof sensor.zone === 'object' ? sensor.zone.name : sensor.zone}
                                                        </span>
                                                    )}

                                                    {/* Notification status badge */}
                                                    {sensor.notificationsEnabled ? (
                                                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                                                            Notifications On
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                            Notifications Off
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center w-full h-64 col-span-full">
                                    <div className="text-center">
                                        <FaTachometerAlt size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg text-gray-500">No sensors found</p>
                                        <p className="text-sm text-gray-400">Add a sensor to get started</p>
                                        <button
                                            className="px-4 py-2 mt-4 text-white rounded-md bg-customBlue hover:bg-blue-600"
                                            onClick={() => setIsAddModalOpen(true)}
                                         >
                                            <FaPlus className="inline mr-2" /> Add Sensor
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {editModalSensor && (
                <EditSensorModal
                    sensor={editModalSensor}
                    onClose={() => setEditModalSensor(null)}
                    onSave={handleEditSubmit}
                />
            )}

            {deleteSensorId !== null && (
                <DeleteSensorModal
                    sensorId={deleteSensorId}
                    onClose={() => setDeleteSensorId(null)}
                    onConfirm={confirmDelete}
                    isLoading={deleteLoading}
                />
            )}

            {isAddModalOpen && (
                <AddSensorModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddSensorSubmit}
                />
            )}

            {viewSensor && (
                <ViewSensorModal
                    sensor={viewSensor}
                    onClose={() => setViewSensor(null)}
                />
            )}
        </div>
    );
};

export default AllSensorDashboard;