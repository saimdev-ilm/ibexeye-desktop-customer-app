import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSearch, FaMapMarkerAlt, FaHome, FaTrash, FaPlay, FaPlane, FaPause, FaStop, FaRocket, FaRoute, FaCheckCircle, FaClock, FaExclamationCircle } from 'react-icons/fa';
import NotificationModal from './NotificationModal';

interface WaypointsModalProps {
    isOpen: boolean;
    onClose: () => void;
    homeLocation: { latitude: number; longitude: number } | null;
    isHomeLocationSet: boolean;
    currentDroneLocation: { latitude: number; longitude: number };
    onExecuteWaypoints: (waypoints: Waypoint[]) => void;
    onGoToLocation: (latitude: number, longitude: number, altitude?: number) => void;
}

interface Waypoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    isHome?: boolean;
    status?: 'pending' | 'active' | 'completed' | 'failed';
    arrivalTime?: string;
}

interface SearchResult {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
    type: string;
}

interface AutomationStatus {
    isActive: boolean;
    currentWaypointIndex: number;
    totalWaypoints: number;
    mode: 'sequential' | 'manual';
    startTime?: string;
    estimatedCompletion?: string;
    progress: number;
}

const WaypointsModal: React.FC<WaypointsModalProps> = ({
    isOpen,
    onClose,
    homeLocation,
    isHomeLocationSet,
    currentDroneLocation,
    onGoToLocation
}) => {
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentTargetWaypoint, setCurrentTargetWaypoint] = useState<string | null>(null);

    // Notification state
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showNotification = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info'
    ) => {
        setNotification({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const closeNotification = () => {
        setNotification((prev) => ({
            ...prev,
            isOpen: false
        }));
    };

    // New automation states
    const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
        isActive: false,
        currentWaypointIndex: -1,
        totalWaypoints: 0,
        mode: 'sequential',
        progress: 0
    });

    const [automationSettings, setAutomationSettings] = useState({
        waitTimeAtWaypoint: 10, // seconds
        autoReturnHome: true,
        pauseOnError: true,
        maxRetries: 3
    });

    const mapRef = useRef<import("leaflet").Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const markersRef = useRef<any[]>([]);
    const automationTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Enhanced waypoint initialization with status
    useEffect(() => {
        if (isOpen && isHomeLocationSet && homeLocation && waypoints.length === 0) {
            const homeWaypoint: Waypoint = {
                id: 'home',
                name: '🏠 Home Location',
                latitude: homeLocation.latitude,
                longitude: homeLocation.longitude,
                altitude: 0,
                isHome: true,
                status: 'completed'
            };
            setWaypoints([homeWaypoint]);
        }
    }, [isOpen, isHomeLocationSet, homeLocation]);

    // Initialize map with enhanced markers
    useEffect(() => {
        const initializeMap = async () => {
            if (isOpen && typeof window !== 'undefined' && !mapRef.current && mapContainerRef.current) {
                if (!document.querySelector('link[href*="leaflet.css"]')) {
                    const linkEl = document.createElement('link');
                    linkEl.rel = 'stylesheet';
                    linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.css';
                    document.head.appendChild(linkEl);
                }

                const L = await import('leaflet');

                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
                });

                const initialCenter = homeLocation || currentDroneLocation || { latitude: 33.645677, longitude: 72.995978 };
                const lat = initialCenter.latitude !== 0 ? initialCenter.latitude : 33.645677;
                const lng = initialCenter.longitude !== 0 ? initialCenter.longitude : 72.995978;

                mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapRef.current);

                mapRef.current.on('dblclick', (e: any) => {
                    const { lat, lng } = e.latlng;
                    addWaypointAtLocation(lat, lng, `Waypoint ${waypoints.length + 1}`);
                });

                updateMapMarkers();
            }
        };

        initializeMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = [];
            }
        };
    }, [isOpen]);

    // Update map markers with enhanced visualization
    useEffect(() => {
        if (mapRef.current) {
            updateMapMarkers();
        }
    }, [waypoints, currentDroneLocation, automationStatus]);

    const updateMapMarkers = async () => {
        if (!mapRef.current) return;

        const L = await import('leaflet');

        // Clear existing markers
        markersRef.current.forEach(marker => {
            mapRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        // Add drone location marker (live)
        if (currentDroneLocation.latitude !== 0 && currentDroneLocation.longitude !== 0) {
            const droneIcon = L.divIcon({
                html: `<div style="
                    background: linear-gradient(45deg, #00ff00, #00aa00); 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    width: 28px; 
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 6px rgba(0,255,0,0.4);
                    font-size: 14px;
                    animation: pulse 2s infinite;
                ">🚁</div>
                <style>
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                </style>`,
                className: 'custom-drone-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const droneMarker = L.marker([currentDroneLocation.latitude, currentDroneLocation.longitude], { icon: droneIcon })
                .addTo(mapRef.current!)
                .bindPopup(`
                    <div>
                        <strong>🚁 Drone Live Location</strong><br>
                        Lat: ${currentDroneLocation.latitude.toFixed(6)}<br>
                        Lng: ${currentDroneLocation.longitude.toFixed(6)}<br>
                        Status: ${automationStatus.isActive ? 'Mission Active' : 'Standby'}
                    </div>
                `);

            markersRef.current.push(droneMarker);
        }

        // Add waypoint markers with status-based styling
        waypoints.forEach((waypoint, index) => {
            const isHome = waypoint.isHome;
            const isSelected = selectedWaypoint === waypoint.id;
            const isCurrent = currentTargetWaypoint === waypoint.id; // ✅ Use currentTargetWaypoint
            const status = waypoint.status || 'pending';

            let backgroundColor = '#4444ff';
            let borderColor = 'white';
            let emoji = index.toString();

            if (isHome) {
                backgroundColor = '#ff4444';
                emoji = '🏠';
            } else if (isCurrent) {
                backgroundColor = '#ffa500';
                borderColor = '#ffff00';
                emoji = '🎯';
            } else if (status === 'completed') {
                backgroundColor = '#00aa00';
                emoji = '✓';
            } else if (status === 'failed') {
                backgroundColor = '#aa0000';
                emoji = '✗';
            } else if (isSelected) {
                backgroundColor = '#00ff00';
                emoji = index.toString();
            }

            const icon = L.divIcon({
                html: `<div style="
                    background: ${backgroundColor}; 
                    border: 3px solid ${borderColor}; 
                    border-radius: 50%; 
                    width: 28px; 
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                    font-size: 12px;
                    color: white;
                    font-weight: bold;
                    ${isCurrent ? 'animation: currentWaypoint 1.5s infinite;' : ''}
                ">
                    ${emoji}
                </div>
                <style>
                    @keyframes currentWaypoint {
                        0%, 100% { transform: scale(1); box-shadow: 0 3px 6px rgba(0,0,0,0.3); }
                        50% { transform: scale(1.2); box-shadow: 0 5px 10px rgba(255,165,0,0.6); }
                    }
                </style>`,
                className: 'custom-waypoint-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([waypoint.latitude, waypoint.longitude], { icon })
                .addTo(mapRef.current!)
                .bindPopup(`
                    <div>
                        <strong>${waypoint.name}</strong><br>
                        Lat: ${waypoint.latitude.toFixed(6)}<br>
                        Lng: ${waypoint.longitude.toFixed(6)}<br>
                        ${waypoint.altitude ? `Alt: ${waypoint.altitude}m<br>` : ''}
                        Status: <span style="color: ${status === 'completed' ? 'green' :
                        status === 'active' ? 'orange' :
                            status === 'failed' ? 'red' : 'blue'
                    }">${status}</span><br>
                        ${waypoint.arrivalTime ? `Arrived: ${waypoint.arrivalTime}` : ''}
                    </div>
                `);

            marker.on('click', () => {
                setSelectedWaypoint(waypoint.id);
            });

            markersRef.current.push(marker);
        });

        // Draw path between waypoints
        if (waypoints.length > 1) {
            const pathCoordinates = waypoints.map(wp => [wp.latitude, wp.longitude] as [number, number]);

            const pathLine = L.polyline(pathCoordinates, {
                color: automationStatus.isActive ? '#ff6600' : '#0066ff',
                weight: 3,
                opacity: 0.7,
                dashArray: automationStatus.isActive ? '10, 5' : undefined
            }).addTo(mapRef.current!);

            markersRef.current.push(pathLine);
        }
    };

    const addWaypointAtLocation = (lat: number, lng: number, name: string) => {
        const newWaypoint: Waypoint = {
            id: `waypoint_${Date.now()}`,
            name,
            latitude: lat,
            longitude: lng,
            altitude: 50,
            status: 'pending'
        };

        setWaypoints(prev => [...prev, newWaypoint]);
    };

    const searchLocation = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
            );
            const results: SearchResult[] = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        addWaypointAtLocation(lat, lng, result.display_name.split(',')[0]);

        if (mapRef.current) {
            mapRef.current.setView([lat, lng], 16);
        }

        setSearchQuery('');
        setSearchResults([]);
    };

    const removeWaypoint = (id: string) => {
        if (waypoints.find(wp => wp.id === id)?.isHome) {
            alert('Cannot remove home location');
            return;
        }

        if (automationStatus.isActive) {
            alert('Cannot remove waypoints during automation');
            return;
        }

        setWaypoints(prev => prev.filter(wp => wp.id !== id));
        if (selectedWaypoint === id) {
            setSelectedWaypoint(null);
        }
    };

    const updateWaypointAltitude = (id: string, altitude: number) => {
        setWaypoints(prev => prev.map(wp =>
            wp.id === id ? { ...wp, altitude } : wp
        ));
    };

    // Enhanced automation execution
    const startAutomation = async () => {
        if (waypoints.length < 2) {
            alert('Please add at least one waypoint besides home location');
            return;
        }

        const nonHomeWaypoints = waypoints.filter(wp => !wp.isHome);

        setAutomationStatus({
            isActive: true,
            currentWaypointIndex: 0,
            totalWaypoints: nonHomeWaypoints.length,
            mode: 'sequential',
            startTime: new Date().toLocaleTimeString(),
            progress: 0
        });

        // Reset all waypoint statuses
        setWaypoints(prev => prev.map(wp => ({
            ...wp,
            status: wp.isHome ? 'completed' : 'pending',
            arrivalTime: undefined
        })));

        // Start executing waypoints
        await executeNextWaypoint(0, nonHomeWaypoints);
    };

    const executeNextWaypoint = async (index: number, waypointList: Waypoint[]) => {
        if (index >= waypointList.length) {
            // All waypoints completed
            if (automationSettings.autoReturnHome && homeLocation) {
                await goToHomeLocation();
            }

            setAutomationStatus(prev => ({
                ...prev,
                isActive: false,
                progress: 100
            }));

            alert('Automation completed successfully!');
            return;
        }

        const currentWaypoint = waypointList[index];

        // Update status to active
        setWaypoints(prev => prev.map(wp =>
            wp.id === currentWaypoint.id
                ? { ...wp, status: 'active' }
                : wp
        ));

        setAutomationStatus(prev => ({
            ...prev,
            currentWaypointIndex: index,
            progress: (index / waypointList.length) * 100
        }));

        try {
            console.log(`Executing waypoint ${index + 1}: ${currentWaypoint.name}`);

            // Navigate to waypoint
            await onGoToLocation(
                currentWaypoint.latitude,
                currentWaypoint.longitude,
                currentWaypoint.altitude || 15
            );

            // Mark as completed
            setWaypoints(prev => prev.map(wp =>
                wp.id === currentWaypoint.id
                    ? {
                        ...wp,
                        status: 'completed',
                        arrivalTime: new Date().toLocaleTimeString()
                    }
                    : wp
            ));

            // Wait at waypoint
            automationTimerRef.current = setTimeout(() => {
                executeNextWaypoint(index + 1, waypointList);
            }, automationSettings.waitTimeAtWaypoint * 1000);

        } catch (error) {
            console.error('Waypoint execution failed:', error);

            // Mark as failed
            setWaypoints(prev => prev.map(wp =>
                wp.id === currentWaypoint.id
                    ? { ...wp, status: 'failed' }
                    : wp
            ));

            if (automationSettings.pauseOnError) {
                pauseAutomation();
                alert(`Failed to reach waypoint: ${currentWaypoint.name}`);
            } else {
                // Continue to next waypoint
                setTimeout(() => {
                    executeNextWaypoint(index + 1, waypointList);
                }, 1000);
            }
        }
    };

    const pauseAutomation = () => {
        if (automationTimerRef.current) {
            clearTimeout(automationTimerRef.current);
            automationTimerRef.current = null;
        }

        setAutomationStatus(prev => ({
            ...prev,
            isActive: false
        }));
    };

    const resumeAutomation = () => {
        const currentIndex = automationStatus.currentWaypointIndex;
        const nonHomeWaypoints = waypoints.filter(wp => !wp.isHome);

        setAutomationStatus(prev => ({
            ...prev,
            isActive: true
        }));

        executeNextWaypoint(currentIndex + 1, nonHomeWaypoints);
    };

    const stopAutomation = () => {
        if (automationTimerRef.current) {
            clearTimeout(automationTimerRef.current);
            automationTimerRef.current = null;
        }

        setAutomationStatus({
            isActive: false,
            currentWaypointIndex: -1,
            totalWaypoints: 0,
            mode: 'sequential',
            progress: 0
        });

        // Reset all pending waypoints
        setWaypoints(prev => prev.map(wp => ({
            ...wp,
            status: wp.status === 'completed' ? 'completed' : 'pending'
        })));
    };

    const goToHomeLocation = async () => {
        if (!homeLocation) return;

        try {
            await onGoToLocation(homeLocation.latitude, homeLocation.longitude, 0);
        } catch (error) {
            console.error('Failed to return home:', error);
        }
    };

    const goToWaypoint = async (waypoint: Waypoint) => {
        if (waypoint.isHome) {
            showNotification(
                'Home Navigation',
                'Use the "Go Home" button in the main interface for returning to home location.',
                'info'
            );
            return;
        }

        if (automationStatus.isActive) {
            showNotification(
                'Mission Active',
                'Cannot manually navigate during automation. Please stop the automation first.',
                'warning'
            );
            return;
        }

        if (!waypoint.latitude || !waypoint.longitude ||
            waypoint.latitude === 0 || waypoint.longitude === 0) {
            showNotification(
                'Invalid Coordinates',
                'This waypoint has invalid coordinates and cannot be used for navigation.',
                'error'
            );
            return;
        }

        const altitude = waypoint.altitude || 15;
        if (altitude < 0 || altitude > 500) {
            showNotification(
                'Invalid Altitude',
                'Altitude must be between 0 and 500 meters for safety reasons.',
                'error'
            );
            return;
        }

        setIsNavigating(true);
        setCurrentTargetWaypoint(waypoint.id); // ✅ Set current target

        try {
            console.log('Navigating to waypoint:', {
                name: waypoint.name,
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
                altitude: altitude
            });

            await onGoToLocation(waypoint.latitude, waypoint.longitude, altitude);

            showNotification(
                'Navigation Started! 🎯',
                `Drone is now heading to ${waypoint.name}\nCoordinates: ${waypoint.latitude.toFixed(6)}, ${waypoint.longitude.toFixed(6)}\nAltitude: ${altitude}m`,
                'success'
            );

            // Close modal after successful navigation command
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Navigation error:', error);
            setCurrentTargetWaypoint(null); // ✅ Clear target on error
            showNotification(
                'Navigation Failed',
                'Failed to start navigation to the waypoint. Please check the drone connection and try again.',
                'error'
            );
        } finally {
            setIsNavigating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-7xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between px-6 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg">
                    <div>
                        <h2 className="flex items-center text-xl font-semibold">
                            <FaRocket className="mr-2" />
                            Automated Waypoints Mission Control
                        </h2>
                        {automationStatus.isActive && (
                            <div className="flex items-center mt-1 text-sm">
                                <FaClock className="mr-1" />
                                Mission Active - Waypoint {automationStatus.currentWaypointIndex + 1} of {automationStatus.totalWaypoints}
                                <div className="ml-4 bg-white bg-opacity-20 rounded-full w-24 h-2">
                                    <div
                                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${automationStatus.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
                        disabled={automationStatus.isActive}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="flex h-[calc(95vh-80px)]">
                    {/* Enhanced Left Panel */}
                    <div className="w-1/3 p-4 overflow-y-auto border-r border-gray-200">
                        {/* Automation Control Panel */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <h3 className="flex items-center mb-3 text-lg font-semibold text-blue-800">
                                <FaRocket className="mr-2" />
                                Automation Control
                            </h3>

                            {!automationStatus.isActive ? (
                                <button
                                    onClick={startAutomation}
                                    disabled={waypoints.length < 2}
                                    className="w-full flex items-center justify-center px-4 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                                >
                                    <FaPlay className="mr-2" />
                                    Start Automated Mission
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={pauseAutomation}
                                        className="w-full flex items-center justify-center px-4 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
                                    >
                                        <FaPause className="mr-2" />
                                        Pause Mission
                                    </button>
                                    <button
                                        onClick={stopAutomation}
                                        className="w-full flex items-center justify-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                                    >
                                        <FaStop className="mr-2" />
                                        Stop Mission
                                    </button>
                                </div>
                            )}

                            {/* Automation Settings */}
                            <div className="mt-4 space-y-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Wait Time at Each Waypoint (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={automationSettings.waitTimeAtWaypoint}
                                        onChange={(e) => setAutomationSettings(prev => ({
                                            ...prev,
                                            waitTimeAtWaypoint: parseInt(e.target.value) || 10
                                        }))}
                                        className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="5"
                                        max="60"
                                        disabled={automationStatus.isActive}
                                    />
                                </div>

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={automationSettings.autoReturnHome}
                                            onChange={(e) => setAutomationSettings(prev => ({
                                                ...prev,
                                                autoReturnHome: e.target.checked
                                            }))}
                                            className="mr-2"
                                            disabled={automationStatus.isActive}
                                        />
                                        <span className="text-sm">Auto Return Home</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={automationSettings.pauseOnError}
                                            onChange={(e) => setAutomationSettings(prev => ({
                                                ...prev,
                                                pauseOnError: e.target.checked
                                            }))}
                                            className="mr-2"
                                            disabled={automationStatus.isActive}
                                        />
                                        <span className="text-sm">Pause on Error</span>
                                    </label>
                                </div>
                            </div>

                            {/* Mission Status */}
                            {automationStatus.startTime && (
                                <div className="mt-3 p-2 bg-white rounded border">
                                    <div className="text-sm">
                                        <div><strong>Started:</strong> {automationStatus.startTime}</div>
                                        <div><strong>Progress:</strong> {Math.round(automationStatus.progress)}%</div>
                                        <div><strong>Status:</strong>
                                            <span className={`ml-1 font-medium ${automationStatus.isActive ? 'text-green-600' : 'text-yellow-600'
                                                }`}>
                                                {automationStatus.isActive ? 'Running' : 'Paused'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Section */}
                        <div className="mb-6">
                            <h3 className="flex items-center mb-3 text-lg font-semibold">
                                <FaSearch className="mr-2 text-blue-600" />
                                Search Location
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                                    placeholder="Search for a location..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={automationStatus.isActive}
                                />
                                <button
                                    onClick={searchLocation}
                                    disabled={isSearching || automationStatus.isActive}
                                    className="px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSearching ? '...' : <FaSearch />}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-3 space-y-2 overflow-y-auto max-h-40">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.place_id}
                                            onClick={() => !automationStatus.isActive && selectSearchResult(result)}
                                            className={`p-3 transition-colors border border-gray-200 rounded-lg ${automationStatus.isActive
                                                    ? 'cursor-not-allowed opacity-50'
                                                    : 'cursor-pointer hover:bg-blue-50 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="text-sm font-medium">
                                                {result.display_name.split(',')[0]}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {result.display_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Enhanced Waypoints List */}
                        <div className="mb-6">
                            <h3 className="flex items-center mb-3 text-lg font-semibold">
                                <FaRoute className="mr-2 text-blue-600" />
                                Mission Waypoints ({waypoints.length})
                            </h3>

                            <div className="space-y-3 overflow-y-auto max-h-96">
                                {waypoints.map((waypoint, index) => {
                                    const isCurrent = automationStatus.currentWaypointIndex === index - 1; // -1 because home is index 0
                                    const status = waypoint.status || 'pending';

                                    return (
                                        <div
                                            key={waypoint.id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 ${selectedWaypoint === waypoint.id
                                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                                    : isCurrent
                                                        ? 'border-orange-500 bg-orange-50 shadow-md'
                                                        : status === 'completed'
                                                            ? 'border-green-500 bg-green-50'
                                                            : status === 'failed'
                                                                ? 'border-red-500 bg-red-50'
                                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setSelectedWaypoint(waypoint.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    {waypoint.isHome ? (
                                                        <div className="flex items-center justify-center w-8 h-8 mr-3 text-white bg-red-500 rounded-full">
                                                            <FaHome size={14} />
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center justify-center w-8 h-8 mr-3 text-white rounded-full ${isCurrent ? 'bg-orange-500 animate-pulse' :
                                                                status === 'completed' ? 'bg-green-500' :
                                                                    status === 'failed' ? 'bg-red-500' :
                                                                        status === 'active' ? 'bg-blue-500' : 'bg-gray-500'
                                                            }`}>
                                                            {status === 'completed' ? (
                                                                <FaCheckCircle size={14} />
                                                            ) : status === 'failed' ? (
                                                                <FaExclamationCircle size={14} />
                                                            ) : isCurrent ? (
                                                                <FaClock size={14} />
                                                            ) : (
                                                                <span className="text-xs font-bold">{index}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium">{waypoint.name}</div>
                                                            {isCurrent && (
                                                                <span className="ml-2 px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded-full">
                                                                    Current Target
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                                                        </div>
                                                        <div className="flex items-center mt-1 space-x-4">
                                                            {waypoint.altitude && (
                                                                <div className="text-xs text-blue-600">
                                                                    Alt: {waypoint.altitude}m
                                                                </div>
                                                            )}
                                                            <div className={`text-xs font-medium ${status === 'completed' ? 'text-green-600' :
                                                                    status === 'failed' ? 'text-red-600' :
                                                                        status === 'active' ? 'text-blue-600' :
                                                                            'text-gray-600'
                                                                }`}>
                                                                {status === 'completed' && waypoint.arrivalTime ? `✓ ${waypoint.arrivalTime}` :
                                                                    status === 'failed' ? '✗ Failed' :
                                                                        status === 'active' ? '🎯 En Route' :
                                                                            '⏳ Pending'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!waypoint.isHome && !automationStatus.isActive && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                goToWaypoint(waypoint);
                                                            }}
                                                            disabled={isNavigating}
                                                            className="p-1 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                                                            title="Go to this location"
                                                        >
                                                            <FaPlane size={12} />
                                                        </button>
                                                    )}
                                                    {!waypoint.isHome && !automationStatus.isActive && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeWaypoint(waypoint.id);
                                                            }}
                                                            className="p-1 text-red-500 rounded hover:bg-red-100"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Altitude input */}
                                            <div className="mt-2">
                                                <label className="text-xs text-gray-600">Altitude (m):</label>
                                                <input
                                                    type="number"
                                                    value={waypoint.altitude || 50}
                                                    onChange={(e) => {
                                                        const alt = Math.max(0, Math.min(500, parseInt(e.target.value) || 0));
                                                        updateWaypointAltitude(waypoint.id, alt);
                                                    }}
                                                    className="w-full px-2 py-1 mt-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    min="0"
                                                    max="500"
                                                    step="5"
                                                    disabled={automationStatus.isActive}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Enhanced Instructions */}
                        <div className="p-4 text-sm rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                            <strong className="text-blue-800">🚁 Automated Mission Control:</strong>
                            <ul className="mt-2 space-y-1 text-xs text-blue-700">
                                <li>• <strong>🎯 Smart Automation:</strong> Step-by-step execution</li>
                                <li>• <strong>📍 Live Tracking:</strong> Real-time drone position</li>
                                <li>• <strong>🛣️ Route Planning:</strong> Connected waypoint path</li>
                                <li>• <strong>⏱️ Wait Times:</strong> Configurable delays at each point</li>
                                <li>• <strong>🏠 Auto Return:</strong> Optional return to home</li>
                                <li>• <strong>⚠️ Error Handling:</strong> Pause on failures</li>
                                <li>• <strong>📊 Progress Tracking:</strong> Mission completion status</li>
                            </ul>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-col gap-2 mt-4">
                            {!automationStatus.isActive && (
                                <>
                                    {selectedWaypoint && !waypoints.find(wp => wp.id === selectedWaypoint)?.isHome && (
                                        <button
                                            onClick={() => {
                                                const selectedWP = waypoints.find(wp => wp.id === selectedWaypoint);
                                                if (selectedWP) {
                                                    goToWaypoint(selectedWP);
                                                }
                                            }}
                                            disabled={isNavigating}
                                            className="flex items-center justify-center w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <FaPlane className="mr-2" />
                                            {isNavigating ? 'Navigating...' : 'Go to Selected Location'}
                                        </button>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (!mapRef.current) return;
                                            const center = mapRef.current.getCenter();
                                            setCurrentTargetWaypoint(`map_center_${Date.now()}`); // ✅ Set temporary target
                                            try {
                                                await onGoToLocation(center.lat, center.lng, 15);
                                                showNotification(
                                                    'Navigation to Map Center! 🗺️',
                                                    `Drone is heading to map center\nLat: ${center.lat.toFixed(6)}\nLng: ${center.lng.toFixed(6)}\nAltitude: 15m`,
                                                    'success'
                                                );
                                                setTimeout(() => {
                                                    onClose();
                                                }, 2000);
                                            } catch (error) {
                                                console.error('Navigation error:', error);
                                                showNotification(
                                                    'Navigation Failed',
                                                    'Failed to start navigation to map center. Please try again.',
                                                    'error'
                                                );
                                                setCurrentTargetWaypoint(null);
                                            }
                                        }}
                                        disabled={isNavigating}
                                        className="flex items-center justify-center w-full px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        <FaMapMarkerAlt className="mr-2" />
                                        Go to Map Center
                                    </button>
                                </>
                            )}

                            {automationStatus.isActive && !automationStatus.isActive && (
                                <button
                                    onClick={resumeAutomation}
                                    className="flex items-center justify-center w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                                >
                                    <FaPlay className="mr-2" />
                                    Resume Mission
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Right Panel - Map */}
                    <div className="relative flex-1">
                        <div ref={mapContainerRef} className="w-full h-full" />

                        {/* Map loading fallback */}
                        <div id="waypoints-map-loading" className="absolute inset-0 z-0 flex items-center justify-center bg-gray-200">
                            <p className="text-gray-600">Loading mission control map...</p>
                        </div>

                        {/* Enhanced Map overlay info */}
                        <div className="absolute z-10 p-4 bg-white rounded-lg shadow-lg top-4 left-4 bg-opacity-95">
                            <div className="text-sm">
                                <div className="mb-3 font-semibold text-blue-800">🗺️ Mission Map Legend:</div>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>🚁 Live Drone Position</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-red-500 rounded-full"></div>
                                        <span>🏠 Home Base</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-orange-500 rounded-full"></div>
                                        <span>🎯 Current Target</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-green-600 rounded-full"></div>
                                        <span>✅ Completed</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-blue-500 rounded-full"></div>
                                        <span>⏳ Pending</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 mr-2 bg-red-600 rounded-full"></div>
                                        <span>❌ Failed</span>
                                    </div>
                                    <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                                        <div className="w-4 h-1 mr-2 bg-blue-500"></div>
                                        <span>Mission Route</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mission Status Display */}
                        {automationStatus.isActive && (
                            <div className="absolute z-10 p-4 text-white bg-green-600 rounded-lg shadow-lg bottom-4 left-4 bg-opacity-95">
                                <div className="flex items-center mb-2">
                                    <div className="w-4 h-4 mr-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="font-semibold">Mission In Progress</span>
                                </div>
                                <div className="text-sm space-y-1">
                                    <div>Waypoint: {automationStatus.currentWaypointIndex + 1} of {automationStatus.totalWaypoints}</div>
                                    <div>Progress: {Math.round(automationStatus.progress)}%</div>
                                    <div>Started: {automationStatus.startTime}</div>
                                </div>
                            </div>
                        )}

                        {/* Live Drone Info */}
                        {currentDroneLocation.latitude !== 0 && currentDroneLocation.longitude !== 0 && (
                            <div className="absolute z-10 p-3 bg-white rounded-lg shadow-lg top-4 right-4 bg-opacity-95">
                                <div className="text-sm">
                                    <div className="mb-2 font-semibold text-green-700">🚁 Live Drone Position:</div>
                                    <div>Lat: {currentDroneLocation.latitude.toFixed(6)}</div>
                                    <div>Lng: {currentDroneLocation.longitude.toFixed(6)}</div>
                                    <div className="mt-2 text-xs text-gray-600">
                                        Status: {automationStatus.isActive ? '🎯 Mission Active' : '⏸️ Standby'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation in progress indicator */}
                        {isNavigating && (
                            <div className="absolute z-10 p-3 text-white bg-blue-600 rounded-lg shadow-lg bottom-4 right-4 bg-opacity-95">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 mr-2 bg-white rounded-full animate-pulse"></div>
                                    <span>🎯 Navigating to waypoint...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
            />
        </div>
    );
};

export default WaypointsModal;