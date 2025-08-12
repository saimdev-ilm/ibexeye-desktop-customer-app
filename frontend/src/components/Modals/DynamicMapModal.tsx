import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaMapMarkerAlt, FaExclamationCircle, FaEye } from 'react-icons/fa';

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

interface DynamicMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    homeLocation: { latitude: number; longitude: number } | null;
    isHomeLocationSet: boolean;
    currentDroneLocation: { latitude: number; longitude: number };
    currentWaypoints: Waypoint[];
    automationStatus: {
        isActive: boolean;
        currentWaypointIndex: number;
        totalWaypoints: number;
        progress: number;
    };
    droneTelemetry: {
        position: { latitude: number; longitude: number };
        altitude: number;
        batteryLevel: number;
        temperature: number;
    };
    isConnected: boolean;
    appRegistered: boolean;
    onGoToLocation?: (latitude: number, longitude: number, altitude?: number) => void;
}

const DynamicMapModal: React.FC<DynamicMapModalProps> = ({
    isOpen,
    onClose,
    homeLocation,
    isHomeLocationSet,
    currentDroneLocation,
    currentWaypoints,
    automationStatus,
    droneTelemetry,
    isConnected,
    appRegistered,
    onGoToLocation
}) => {
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const markersRef = useRef<any[]>([]);
    const [, setSelectedLocation] = useState<string | null>(null);
    const [mapStats, setMapStats] = useState({
        totalLocations: 0,
        activeTargets: 0,
        completedTargets: 0,
        droneDistance: 0
    });

    // Initialize map
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

    // Update map markers when data changes
    useEffect(() => {
        if (mapRef.current && isOpen) {
            updateMapMarkers();
            updateMapStats();
        }
    }, [currentDroneLocation, homeLocation, currentWaypoints, automationStatus, droneTelemetry, isOpen]);

    const updateMapStats = () => {
        const totalLocations = currentWaypoints.length + (isHomeLocationSet ? 1 : 0);
        const activeTargets = currentWaypoints.filter(wp => wp.status === 'active' || wp.status === 'pending').length;
        const completedTargets = currentWaypoints.filter(wp => wp.status === 'completed').length;

        let droneDistance = 0;
        if (homeLocation && currentDroneLocation.latitude !== 0 && currentDroneLocation.longitude !== 0) {
            droneDistance = calculateDistance(
                homeLocation.latitude, homeLocation.longitude,
                currentDroneLocation.latitude, currentDroneLocation.longitude
            );
        }

        setMapStats({
            totalLocations,
            activeTargets,
            completedTargets,
            droneDistance: Math.round(droneDistance)
        });
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Convert to meters
    };

    const updateMapMarkers = async () => {
        if (!mapRef.current) return;

        const L = await import('leaflet');

        // Clear existing markers
        markersRef.current.forEach(marker => {
            mapRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        // 1. Add Live Drone Position (Priority: Highest)
        if (currentDroneLocation.latitude !== 0 && currentDroneLocation.longitude !== 0) {
            const droneIcon = L.divIcon({
                html: `<div style="
                    background: linear-gradient(45deg, #00ff00, #00aa00); 
                    border: 4px solid white; 
                    border-radius: 50%; 
                    width: 32px; 
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 8px rgba(0,255,0,0.5);
                    font-size: 16px;
                    animation: dronePulse 2s infinite;
                    z-index: 1000;
                ">🚁</div>
                <style>
                    @keyframes dronePulse {
                        0% { transform: scale(1); box-shadow: 0 4px 8px rgba(0,255,0,0.5); }
                        50% { transform: scale(1.2); box-shadow: 0 6px 12px rgba(0,255,0,0.8); }
                        100% { transform: scale(1); box-shadow: 0 4px 8px rgba(0,255,0,0.5); }
                    }
                </style>`,
                className: 'live-drone-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const droneMarker = L.marker([currentDroneLocation.latitude, currentDroneLocation.longitude], { icon: droneIcon })
                .addTo(mapRef.current!)
                .bindPopup(`
                    <div style="font-family: Arial, sans-serif; min-width: 200px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 18px; margin-right: 8px;">🚁</span>
                            <strong style="color: #00aa00;">LIVE DRONE POSITION</strong>
                        </div>
                        <div style="background: #f0f8f0; padding: 8px; border-radius: 6px; margin: 8px 0;">
                            <div><strong>📍 Coordinates:</strong></div>
                            <div>Lat: ${currentDroneLocation.latitude.toFixed(6)}</div>
                            <div>Lng: ${currentDroneLocation.longitude.toFixed(6)}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0;">
                            <div><strong>🔋 Battery:</strong> ${droneTelemetry.batteryLevel}%</div>
                            <div><strong>📏 Altitude:</strong> ${droneTelemetry.altitude}m</div>
                            <div><strong>🌡️ Temp:</strong> ${droneTelemetry.temperature}°C</div>
                            <div><strong>📊 Status:</strong> ${automationStatus.isActive ? '🎯 Mission Active' : '⏸️ Standby'}</div>
                        </div>
                        ${automationStatus.isActive ? `
                            <div style="background: #e6f3ff; padding: 8px; border-radius: 6px; margin-top: 8px;">
                                <strong>🚀 Mission Progress:</strong> ${Math.round(automationStatus.progress)}%<br>
                                <strong>📍 Target:</strong> ${automationStatus.currentWaypointIndex + 1} of ${automationStatus.totalWaypoints}
                            </div>
                        ` : ''}
                    </div>
                `)
                .on('click', () => setSelectedLocation('drone'));

            markersRef.current.push(droneMarker);
        }

        // 2. Add Home Location (if set)
        if (homeLocation && isHomeLocationSet) {
            const homeIcon = L.divIcon({
                html: `<div style="
                    background: #ff4444; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    width: 28px; 
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 6px rgba(255,68,68,0.6);
                    font-size: 14px;
                    z-index: 999;
                ">🏠</div>`,
                className: 'home-marker',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const homeMarker = L.marker([homeLocation.latitude, homeLocation.longitude], { icon: homeIcon })
                .addTo(mapRef.current!)
                .bindPopup(`
                    <div style="font-family: Arial, sans-serif; min-width: 180px;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 18px; margin-right: 8px;">🏠</span>
                            <strong style="color: #ff4444;">HOME BASE</strong>
                        </div>
                        <div style="background: #fff0f0; padding: 8px; border-radius: 6px; margin: 8px 0;">
                            <div><strong>📍 Takeoff Point:</strong></div>
                            <div>Lat: ${homeLocation.latitude.toFixed(6)}</div>
                            <div>Lng: ${homeLocation.longitude.toFixed(6)}</div>
                        </div>
                        <div style="color: #666; font-size: 12px;">
                            ✅ Safe return point established
                        </div>
                    </div>
                `)
                .on('click', () => setSelectedLocation('home'));

            markersRef.current.push(homeMarker);
        }

        // 3. Add Waypoints with detailed status
        currentWaypoints.forEach((waypoint, index) => {
            if (!waypoint.isHome) {
                const isCurrent = automationStatus.currentWaypointIndex === index - 1;
                const status = waypoint.status || 'pending';

                let backgroundColor = '#4444ff';
                let borderColor = 'white';
                let emoji = (index).toString();

                if (isCurrent) {
                    backgroundColor = '#ffa500';
                    borderColor = '#ffff00';
                    emoji = '🎯';
                } else if (status === 'completed') {
                    backgroundColor = '#00aa00';
                    emoji = '✓';
                } else if (status === 'failed') {
                    backgroundColor = '#aa0000';
                    emoji = '✗';
                } else if (status === 'active') {
                    backgroundColor = '#0066ff';
                    emoji = '⚡';
                }

                const waypointIcon = L.divIcon({
                    html: `<div style="
                        background: ${backgroundColor}; 
                        border: 3px solid ${borderColor}; 
                        border-radius: 50%; 
                        width: 26px; 
                        height: 26px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                        font-size: 12px;
                        color: white;
                        font-weight: bold;
                        z-index: 998;
                        ${isCurrent ? 'animation: targetPulse 1.5s infinite;' : ''}
                    ">
                        ${emoji}
                    </div>
                    <style>
                        @keyframes targetPulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.3); box-shadow: 0 5px 10px rgba(255,165,0,0.8); }
                        }
                    </style>`,
                    className: 'waypoint-marker',
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                });

                const waypointMarker = L.marker([waypoint.latitude, waypoint.longitude], { icon: waypointIcon })
                    .addTo(mapRef.current!)
                    .bindPopup(`
                        <div style="font-family: Arial, sans-serif; min-width: 200px;">
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 18px; margin-right: 8px;">${isCurrent ? '🎯' : '📍'}</span>
                                <strong style="color: ${backgroundColor};">${waypoint.name}</strong>
                                ${isCurrent ? '<span style="background: #ffa500; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 8px;">CURRENT TARGET</span>' : ''}
                            </div>
                            <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; margin: 8px 0;">
                                <div><strong>📍 Coordinates:</strong></div>
                                <div>Lat: ${waypoint.latitude.toFixed(6)}</div>
                                <div>Lng: ${waypoint.longitude.toFixed(6)}</div>
                                <div><strong>📏 Altitude:</strong> ${waypoint.altitude || 50}m</div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin: 8px 0;">
                                <div>
                                    <strong>Status:</strong> 
                                    <span style="color: ${status === 'completed' ? '#00aa00' :
                            status === 'active' ? '#0066ff' :
                                status === 'failed' ? '#aa0000' : '#ffa500'
                        }; font-weight: bold;">
                                        ${status === 'completed' ? '✅ COMPLETED' :
                            status === 'active' ? '⚡ ACTIVE' :
                                status === 'failed' ? '❌ FAILED' :
                                    isCurrent ? '🎯 TARGET' : '⏳ PENDING'}
                                    </span>
                                </div>
                            </div>
                            ${waypoint.arrivalTime ? `
                                <div style="background: #e8f5e8; padding: 6px; border-radius: 4px; font-size: 12px;">
                                    ⏰ Arrived: ${waypoint.arrivalTime}
                                </div>
                            ` : ''}
                            ${onGoToLocation && status !== 'completed' ? `
                                <div style="margin-top: 8px;">
                                    <button onclick="goToWaypoint('${waypoint.id}')" style="
                                        background: #007bff; 
                                        color: white; 
                                        border: none; 
                                        padding: 6px 12px; 
                                        border-radius: 4px; 
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">🚁 Navigate Here</button>
                                </div>
                            ` : ''}
                        </div>
                    `)
                    .on('click', () => setSelectedLocation(waypoint.id));

                markersRef.current.push(waypointMarker);
            }
        });

        // 4. Draw Mission Path
        if (currentWaypoints.length > 1) {
            const pathCoordinates: [number, number][] = [];

            // Add home to path start if available
            if (homeLocation && isHomeLocationSet) {
                pathCoordinates.push([homeLocation.latitude, homeLocation.longitude]);
            }

            // Add waypoints to path
            currentWaypoints.forEach(wp => {
                if (!wp.isHome) {
                    pathCoordinates.push([wp.latitude, wp.longitude]);
                }
            });

            if (pathCoordinates.length > 1) {
                const pathLine = L.polyline(pathCoordinates, {
                    color: automationStatus.isActive ? '#ff6600' : '#0066ff',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: automationStatus.isActive ? '10, 5' : undefined
                }).addTo(mapRef.current!);

                markersRef.current.push(pathLine);
            }
        }

        // Auto-fit map to show all markers
        if (markersRef.current.length > 0) {
            const group = L.featureGroup(markersRef.current.filter(m => m instanceof L.Marker));
            if (group.getLayers().length > 0) {
                mapRef.current!.fitBounds(group.getBounds().pad(0.1));
            }
        }
    };

    const handleGoToLocation = React.useCallback(async (waypointId: string) => {
        if (!onGoToLocation) return;

        const waypoint = currentWaypoints.find(wp => wp.id === waypointId);
        if (waypoint) {
            try {
                await onGoToLocation(waypoint.latitude, waypoint.longitude, waypoint.altitude);
                onClose(); // Close modal after navigation starts
            } catch (error) {
                console.error('Navigation failed:', error);
            }
        }
    }, [onGoToLocation, currentWaypoints, onClose]);

    // Add global function for popup buttons
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).goToWaypoint = handleGoToLocation;
        }
    }, [handleGoToLocation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="w-full max-w-7xl max-h-[95vh] bg-white rounded-xl shadow-2xl overflow-hidden m-4">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between px-6 py-4 text-white bg-gradient-to-r from-blue-600 to-indigo-700">
                    <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-3 text-xl" />
                        <div>
                            <h2 className="text-xl font-bold">Dynamic Mission Map</h2>
                            <p className="text-sm opacity-90">Real-time drone tracking & waypoint management</p>
                        </div>
                    </div>

                    {/* Live Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                            <div className="font-bold text-lg">{mapStats.totalLocations}</div>
                            <div className="opacity-80">Total Locations</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg text-green-300">{mapStats.completedTargets}</div>
                            <div className="opacity-80">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg text-yellow-300">{mapStats.activeTargets}</div>
                            <div className="opacity-80">Active</div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-lg text-blue-300">{mapStats.droneDistance}m</div>
                            <div className="opacity-80">From Home</div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Map Content */}
                <div className="relative h-[calc(95vh-120px)]">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {/* Map loading fallback */}
                    <div id="dynamic-map-loading" className="absolute inset-0 z-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600">Loading dynamic mission map...</p>
                        </div>
                    </div>

                    {/* Enhanced Map Legend */}
                    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                            <FaEye className="mr-2 text-blue-600" />
                            Live Map Legend
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-green-500 rounded-full animate-pulse flex items-center justify-center text-white text-xs">🚁</div>
                                <span><strong>Live Drone</strong> - Real-time position</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">🏠</div>
                                <span><strong>Home Base</strong> - Takeoff point</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">🎯</div>
                                <span><strong>Current Target</strong> - Active waypoint</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                                <span><strong>Completed</strong> - Visited waypoints</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">📍</div>
                                <span><strong>Pending</strong> - Upcoming waypoints</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-6 mr-3 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">✗</div>
                                <span><strong>Failed</strong> - Unreachable waypoints</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex items-center">
                                    <div className="w-4 h-1 mr-3 bg-blue-500"></div>
                                    <span><strong>Mission Route</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status Alert */}
                    {(!isConnected || !appRegistered) && (
                        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-10">
                            <div className="flex items-center">
                                <FaExclamationCircle className="mr-2" />
                                <div>
                                    <div className="font-medium">Limited Functionality</div>
                                    <div className="text-sm">Connect drone for full map features</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mission Status Panel */}
                    {automationStatus.isActive && (
                        <div className="absolute bottom-4 left-4 bg-green-600 text-white rounded-lg shadow-lg p-4 z-10">
                            <div className="flex items-center mb-2">
                                <div className="w-3 h-3 mr-2 bg-white rounded-full animate-pulse"></div>
                                <span className="font-bold">Mission Active</span>
                            </div>
                            <div className="text-sm space-y-1">
                                <div>Target: {automationStatus.currentWaypointIndex + 1} of {automationStatus.totalWaypoints}</div>
                                <div>Progress: {Math.round(automationStatus.progress)}%</div>
                                <div className="w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-300"
                                        style={{ width: `${automationStatus.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Data Panel */}
                    {currentDroneLocation.latitude !== 0 && currentDroneLocation.longitude !== 0 && (
                        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 min-w-[200px]">
                            <div className="text-sm">
                                <div className="flex items-center mb-2">
                                    <span className="w-3 h-3 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="font-bold text-green-700">Live Drone Data</span>
                                </div>
                                <div className="space-y-1 text-gray-700">
                                    <div>📍 {currentDroneLocation.latitude.toFixed(4)}, {currentDroneLocation.longitude.toFixed(4)}</div>
                                    <div>📏 Altitude: {droneTelemetry.altitude}m</div>
                                    <div>🔋 Battery: {droneTelemetry.batteryLevel}%</div>
                                    <div>🌡️ Temp: {droneTelemetry.temperature}°C</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DynamicMapModal;