// AnimatedDrone.tsx - Fixed version with proper telemetry handling
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import DroneImage from '../assets/3.png';
import DroneWeb from '../assets/Videos/SE2.webm';

interface AnimatedDroneProps {
    isConnected?: boolean;
    batteryLevel?: number;
    temperature?: number;
    flightTime?: number;
    payload?: number;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    maxDistance?: string;
    droneModel?: string;
    serialNumber?: string;
    firmwareVersion?: string;
    onToggleConnection?: () => void;
    homeLocation?: { latitude: number; longitude: number };
    isHomeLocationSet?: boolean;
}

const AnimatedDrone: React.FC<AnimatedDroneProps> = ({
    isConnected = false,
    latitude = 0,
    longitude = 0,
    altitude = 0,
    droneModel = "ibeXhover",
    serialNumber = "163DFAKJS872",
    firmwareVersion = "v01.00.0500",
    homeLocation,
    isHomeLocationSet = false,
}) => {
    const [selectedMode, setSelectedMode] = useState('Normal');

    // ✅ FIXED: Better coordinate validation and display
    const getSimpleLatitude = (lat: number | undefined): string => {
        if (lat === undefined || isNaN(lat) || lat === 0) {
            return isConnected ? "Acquiring GPS..." : "N/A";
        }
        return `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? 'N' : 'S'}`;
    };

    const getSimpleLongitude = (lng: number | undefined): string => {
        if (lng === undefined || isNaN(lng) || lng === 0) {
            return isConnected ? "Acquiring GPS..." : "N/A";
        }
        return `${Math.abs(lng).toFixed(6)}° ${lng >= 0 ? 'E' : 'W'}`;
    };

    // ✅ Check if we have valid GPS coordinates
    const hasValidGPS = isConnected && latitude !== 0 && longitude !== 0;

    const disabledCardStyle = !isConnected ? 'opacity-60' : '';

    return (
        <div className="w-full mx-auto">
            {/* Header Bar */}
            <div className={`flex items-center justify-between p-3 text-white rounded-t-lg bg-customBlue`}>
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-6 h-6 mr-2 bg-gray-400 rounded-full">
                        <span className="text-xs">i</span>
                    </div>
                    <span className="font-bold">{droneModel}</span>
                </div>
                <div className="text-xs">
                    <span className="mr-4">Serial: {serialNumber}</span>
                    <span>Firmware: {firmwareVersion}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 bg-gray-200 rounded-b-lg shadow-lg">
                {/* Drone Image/Video and Connection Status */}
                <div className="flex gap-4 mb-4">
                    <div className={`relative p-4 bg-white rounded-lg flex justify-center items-center w-1/2 ${disabledCardStyle}`}>
                        {isConnected ? (
                            <video
                                src={DroneWeb}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="object-cover w-full h-56 mx-auto rounded"
                            />
                        ) : (
                            <img
                                src={DroneImage}
                                alt={droneModel}
                                className="object-cover h-full mx-auto"
                            />
                        )}

                        <div className="absolute top-3 right-3">
                            <div className={`flex items-center gap-1 text-white text-xs font-medium py-1 px-2 rounded-full shadow-lg ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-200' : 'bg-red-200'}`}></div>
                                {isConnected ? 'ONLINE' : 'OFFLINE'}
                            </div>
                        </div>

                        {/* ✅ NEW: GPS Status Indicator */}
                        {isConnected && (
                            <div className="absolute bottom-3 right-3">
                                <div className={`flex items-center gap-1 text-white text-xs font-medium py-1 px-2 rounded-full shadow-lg ${hasValidGPS ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                    <div className={`w-2 h-2 rounded-full ${hasValidGPS ? 'bg-blue-200 animate-pulse' : 'bg-orange-200'}`}></div>
                                    {hasValidGPS ? 'GPS LOCK' : 'NO GPS'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid w-1/2 grid-cols-1 gap-3">
                        {/* Latitude Card */}
                        <div className={`flex flex-col h-20 p-4 bg-white rounded-lg shadow-sm ${disabledCardStyle}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <MapPin className={`w-6 h-6 ${hasValidGPS ? 'text-blue-500' : isConnected ? 'text-orange-400' : 'text-gray-300'}`} />
                                </div>
                                <div className={`text-xs ${isConnected ? 'text-gray-500' : 'text-gray-300'}`}>Latitude</div>
                            </div>
                            <div className="mt-auto">
                                <span className={`text-sm font-bold ${hasValidGPS ? 'text-blue-500' : isConnected ? 'text-orange-400' : 'text-gray-300'}`}>
                                    {getSimpleLatitude(latitude)}
                                </span>
                            </div>
                        </div>

                        {/* Longitude Card */}
                        <div className={`flex flex-col h-20 p-4 bg-white rounded-lg shadow-sm ${disabledCardStyle}`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <MapPin className={`w-6 h-6 ${hasValidGPS ? 'text-yellow-500' : isConnected ? 'text-orange-400' : 'text-gray-300'}`} />
                                </div>
                                <div className={`text-xs ${isConnected ? 'text-gray-500' : 'text-gray-300'}`}>Longitude</div>
                            </div>
                            <div className="mt-auto">
                                <span className={`text-sm font-bold ${hasValidGPS ? 'text-yellow-500' : isConnected ? 'text-orange-400' : 'text-gray-300'}`}>
                                    {getSimpleLongitude(longitude)}
                                </span>
                            </div>
                        </div>

                        {/* Altitude Card */}
                        <div className={`flex flex-col h-20 p-4 bg-white rounded-lg shadow-sm ${disabledCardStyle}`}>
                            <div className="flex items-center justify-between gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 mr-2 ${isConnected ? 'text-purple-500' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 20l-5.5-5.5 1.4-1.4L9 17.2l10.1-10.1 1.4 1.4L9 20z" />
                                </svg>
                                <div className={`text-xs ${isConnected ? 'text-gray-500' : 'text-gray-300'}`}>Altitude</div>
                            </div>
                            <div className="mt-auto">
                                <span className={`text-sm font-bold ${isConnected ? 'text-purple-500' : 'text-gray-300'}`}>
                                    {isConnected ? `${altitude}m` : '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ ENHANCED: Better status messages */}
                {!isConnected && (
                    <div className="px-3 py-2 mb-2 text-sm bg-gray-100 border border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-600">🔌 Drone Offline</span>
                        </div>
                        <div className="text-gray-500">
                            Connect to server and register drone to view telemetry
                        </div>
                    </div>
                )}

                {isConnected && !hasValidGPS && (
                    <div className="px-3 py-2 mb-2 text-sm bg-orange-100 border border-orange-300 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-orange-800">📡 Acquiring GPS Signal...</span>
                        </div>
                        <div className="text-orange-700">
                            Drone connected but GPS coordinates not available yet
                        </div>
                    </div>
                )}

                {homeLocation && isHomeLocationSet && (
                    <div className="px-3 py-2 mb-2 text-sm bg-green-100 border border-green-300 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-green-800">🏠 Home Location Set:</span>
                        </div>
                        <div className="text-green-700">
                            Lat: {homeLocation.latitude.toFixed(6)}, Lng: {homeLocation.longitude.toFixed(6)}
                        </div>
                    </div>
                )}

                {hasValidGPS && (
                    <div className="px-3 py-2 mb-2 text-sm bg-blue-100 border border-blue-300 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-800">✅ GPS Lock Acquired</span>
                        </div>
                        <div className="text-blue-700">
                            Current Position: {getSimpleLatitude(latitude)}, {getSimpleLongitude(longitude)}
                        </div>
                    </div>
                )}

                {/* Flight Modes */}
                <div className={`p-3 bg-white rounded-lg shadow-sm ${disabledCardStyle}`}>
                    <div className={`mb-2 text-center ${isConnected ? 'text-gray-500' : 'text-gray-300'}`}>Flight Modes</div>
                    <div className="grid h-10 grid-cols-3 gap-2">
                        <button
                            onClick={() => setSelectedMode('Slow')}
                            disabled={!isConnected}
                            className={`py-2 rounded-lg transition-colors ${isConnected
                                ? (selectedMode === 'Slow'
                                    ? 'bg-slate-800 text-white font-semibold'
                                    : 'bg-gray-100 hover:bg-gray-200')
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Slow
                        </button>
                        <button
                            onClick={() => setSelectedMode('Normal')}
                            disabled={!isConnected}
                            className={`py-2 rounded-lg transition-colors ${isConnected
                                ? (selectedMode === 'Normal'
                                    ? 'bg-slate-800 text-white font-semibold'
                                    : 'bg-gray-100 hover:bg-gray-200')
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Normal
                        </button>
                        <button
                            onClick={() => setSelectedMode('Fast')}
                            disabled={!isConnected}
                            className={`py-2 rounded-lg transition-colors ${isConnected
                                ? (selectedMode === 'Fast'
                                    ? 'bg-slate-800 text-white font-semibold'
                                    : 'bg-gray-100 hover:bg-gray-200')
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Fast
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedDrone;