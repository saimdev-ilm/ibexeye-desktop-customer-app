import React, { useState, useEffect, useRef } from "react";
import {
    FaChevronLeft,
    FaTerminal,
    FaInfo,
    FaCog,
    FaTimes,
    FaPlay,
    FaPause,
    FaExpand
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DummyImage from "../assets/Picture1.png";
import DraggableLogsModal from "../components/Modals/DraggableLogsModal";
import DroneInfoModal from "../components/Modals/DroneInfoModal";

interface DroneMapData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
    batteryLevel: number;
    flightTime: string;
    speed: string;
    altitude: number;
    temperature: number;
    bearing: string;
    distance: string;
}

// Mock drone data positioned around Mexico City area (matching the map image)
const mockDroneMapData: DroneMapData[] = [
    {
        id: "5534",
        name: "Drone 5534",
        latitude: 19.4326,
        longitude: -99.1332,
        isActive: true,
        batteryLevel: 85,
        flightTime: "2:30:25",
        speed: "20 km/h",
        altitude: 120,
        temperature: 24,
        bearing: "40° NE",
        distance: "2532 m"
    },
    {
        id: "5544",
        name: "Drone 5544",
        latitude: 19.4026,
        longitude: -99.1632,
        isActive: true,
        batteryLevel: 67,
        flightTime: "1:45:12",
        speed: "15 km/h",
        altitude: 95,
        temperature: 26,
        bearing: "85° E",
        distance: "1824 m"
    },
    {
        id: "6534",
        name: "Drone 6534",
        latitude: 19.4626,
        longitude: -99.1032,
        isActive: true,
        batteryLevel: 92,
        flightTime: "3:12:45",
        speed: "25 km/h",
        altitude: 150,
        temperature: 22,
        bearing: "120° SE",
        distance: "3156 m"
    }
];

interface DronePopupProps {
    drone: DroneMapData;
    onClose: () => void;
    onPlayPause: () => void;
    onExpand: () => void;
    onShowInfo: () => void;
}

const DronePopup: React.FC<DronePopupProps> = ({
    drone,
    onClose,
    onPlayPause,
    onExpand,
    onShowInfo
}) => {
    return (
        <div className="absolute z-50 overflow-hidden bg-white border shadow-2xl w-80 rounded-2xl"
            style={{
                left: '50%',
                top: '-320px',
                transform: 'translateX(-50%)',
                animation: 'fadeIn 0.3s ease-out'
            }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 text-white bg-customBlue">
                <h3 className="font-semibold">{drone.name}</h3>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center w-6 h-6 transition-colors rounded-full hover:bg-white/20"
                >
                    <FaTimes size={12} />
                </button>
            </div>

            {/* Video Feed */}
            <div className="relative h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
                <img
                    src={DummyImage}
                    alt={`${drone.name} feed`}
                    className="object-cover w-full h-full opacity-80"
                />

                {/* Video Overlay Info */}
                <div className="absolute flex justify-between top-2 left-2 right-2">
                    <div className="px-2 py-1 text-xs text-white rounded bg-black/40 backdrop-blur-sm">
                        {drone.flightTime}
                    </div>
                    <div className={`px-2 py-1 backdrop-blur-sm rounded text-white text-xs ${drone.batteryLevel > 50 ? 'bg-green-500/40' :
                            drone.batteryLevel > 20 ? 'bg-yellow-500/40' : 'bg-red-500/40'
                        }`}>
                        {drone.batteryLevel}%
                    </div>
                </div>

                <div className="absolute flex items-end justify-between bottom-2 left-2 right-2">
                    <div className="flex flex-col gap-1">
                        <div className="px-2 py-1 text-xs text-white rounded bg-black/40 backdrop-blur-sm">
                            Alt: {drone.altitude}m
                        </div>
                        <div className="px-2 py-1 text-xs text-white rounded bg-black/40 backdrop-blur-sm">
                            {drone.speed}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onPlayPause}
                            className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                        >
                            {drone.isActive ? <FaPause size={10} /> : <FaPlay size={10} />}
                        </button>
                        <button
                            onClick={onExpand}
                            className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                        >
                            <FaExpand size={10} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Bearing:</span>
                        <div className="font-medium">{drone.bearing}</div>
                    </div>
                    <div>
                        <span className="text-gray-500">Distance:</span>
                        <div className="font-medium">{drone.distance}</div>
                    </div>
                    <div>
                        <span className="text-gray-500">Temperature:</span>
                        <div className="font-medium">{drone.temperature}°C</div>
                    </div>
                    <div>
                        <span className="text-gray-500">Status:</span>
                        <div className={`font-medium ${drone.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {drone.isActive ? 'Active' : 'Offline'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onShowInfo}
                    className="w-full py-2 font-medium text-white transition-colors rounded-lg bg-customBlue hover:bg-blue-700"
                >
                    View Detailed Info
                </button>
            </div>
        </div>
    );
};

function DroneMapView(): React.ReactElement {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<"all" | "map">("map");
    const [droneData, setDroneData] = useState<DroneMapData[]>(mockDroneMapData);
    const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
    const [droneInfoModalOpen, setDroneInfoModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        "[12:30:25] Map view initialized",
        "[12:30:26] Loading drone locations...",
        "[12:30:27] Drone 5534 located at Mexico City",
        "[12:30:28] Drone 5544 located at Granada",
        "[12:30:29] All drones positioned on map",
        "[12:30:30] Map view ready"
    ]);

    // Map and Leaflet refs
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const leafletContainerRef = useRef<HTMLDivElement | null>(null);
    const markersRef = useRef<{ [key: string]: any }>({});

    const handleHomeDashboard = () => {
        navigate("/");
    };

    const handlePlayPause = (droneId: string) => {
        setDroneData(prev => prev.map(drone =>
            drone.id === droneId
                ? { ...drone, isActive: !drone.isActive }
                : drone
        ));

        const drone = droneData.find(d => d.id === droneId);
        const action = drone?.isActive ? "paused" : "started";
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] Drone ${droneId} ${action}`, ...prev].slice(0, 50));
    };

    const handleExpand = (droneId: string) => {
        navigate(`/drone-management`);
    };

    const handleShowInfo = (droneId: string) => {
        setSelectedDroneId(droneId);
        setDroneInfoModalOpen(true);
    };

    const activeDroneCount = droneData.filter(drone => drone.isActive).length;
    const totalDroneCount = droneData.length;
    const selectedDrone = selectedDroneId ? droneData.find(d => d.id === selectedDroneId) : null;

    // Initialize map
    useEffect(() => {
        const initializeMap = async () => {
            if (typeof window !== 'undefined' && !mapRef.current) {
                // Add Leaflet CSS
                const linkEl = document.createElement('link');
                linkEl.rel = 'stylesheet';
                linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.css';
                document.head.appendChild(linkEl);

                const L = await import('leaflet');

                if (leafletContainerRef.current && !mapRef.current) {
                    // Initialize map centered on Mexico City
                    mapRef.current = L.map(leafletContainerRef.current).setView([19.4326, -99.1332], 12);

                    // Add tile layer
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19,
                    }).addTo(mapRef.current);

                    // Add drone markers
                    droneData.forEach(drone => {
                        const markerIcon = L.divIcon({
                            html: `
                                <div class="relative">
                                    <div class="w-12 h-12 bg-${drone.isActive ? 'green' : 'red'}-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                        <div class="w-3 h-3 bg-white rounded-full"></div>
                                    </div>
                                    <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                                        ${drone.id}
                                    </div>
                                    <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-${drone.isActive ? 'green' : 'red'}-500"></div>
                                    ${drone.isActive ? `
                                        <div class="absolute inset-0 w-12 h-12 bg-green-400 rounded-full animate-ping opacity-20"></div>
                                        <div class="absolute inset-2 w-8 h-8 bg-green-400 rounded-full animate-ping opacity-40" style="animation-delay: 0.5s"></div>
                                    ` : ''}
                                </div>
                            `,
                            className: 'drone-marker',
                            iconSize: [48, 48],
                            iconAnchor: [24, 24]
                        });

                        const marker = L.marker([drone.latitude, drone.longitude], {
                            icon: markerIcon
                        }).addTo(mapRef.current!);

                        // Store marker reference
                        markersRef.current[drone.id] = marker;

                        // Add click event
                        marker.on('click', () => {
                            setSelectedDroneId(prev => prev === drone.id ? null : drone.id);
                        });
                    });
                }
            }
        };

        initializeMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers when drone data changes
    useEffect(() => {
        if (mapRef.current) {
            const L = require('leaflet');

            droneData.forEach(drone => {
                if (markersRef.current[drone.id]) {
                    const markerIcon = L.divIcon({
                        html: `
                            <div class="relative">
                                <div class="w-12 h-12 bg-${drone.isActive ? 'green' : 'red'}-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    <div class="w-3 h-3 bg-white rounded-full"></div>
                                </div>
                                <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                                    ${drone.id}
                                </div>
                                <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-${drone.isActive ? 'green' : 'red'}-500"></div>
                                ${drone.isActive ? `
                                    <div class="absolute inset-0 w-12 h-12 bg-green-400 rounded-full animate-ping opacity-20"></div>
                                    <div class="absolute inset-2 w-8 h-8 bg-green-400 rounded-full animate-ping opacity-40" style="animation-delay: 0.5s"></div>
                                ` : ''}
                            </div>
                        `,
                        className: 'drone-marker',
                        iconSize: [48, 48],
                        iconAnchor: [24, 24]
                    });

                    markersRef.current[drone.id].setIcon(markerIcon);
                }
            });
        }
    }, [droneData]);

    return (
        <div className="flex flex-col w-full h-full min-h-screen text-black bg-gray-50">
            {/* Header Section */}
            <header className="relative z-50 mb-6">
                <div className="flex flex-col items-center justify-between gap-2 px-4 py-3 bg-white shadow-md sm:flex-row rounded-xl">
                    {/* Left side - Title and Back Button */}
                    <div className="flex items-center gap-3">
                        <button
                            title="Go to Home Dashboard"
                            onClick={handleHomeDashboard}
                            className="flex items-center justify-center w-10 h-10 text-white transition-colors rounded-full bg-customBlue hover:bg-blue-700"
                        >
                            <FaChevronLeft />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-customBlue">Drone Map View</h1>
                            <p className="text-sm text-gray-600">
                                {activeDroneCount} of {totalDroneCount} drones active
                            </p>
                        </div>
                    </div>

                    {/* Center - View Toggle */}
                    <div className="flex p-1 bg-gray-200 rounded-lg">
                        <button
                            onClick={() => {
                                setActiveView("all");
                                navigate("/all-drones");
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === "all"
                                ? "bg-white text-customBlue shadow-sm"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            All Drones
                        </button>
                        <button
                            onClick={() => setActiveView("map")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === "map"
                                ? "bg-white text-customBlue shadow-sm"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            Map View
                        </button>
                    </div>

                    {/* Right side - Controls and Stats */}
                    <div className="flex items-center gap-4">
                        {/* Config button */}
                        <button
                            title="Config"
                            className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <FaCog size={18} />
                        </button>

                        {/* Logs Terminal button */}
                        <button
                            title="Logs Terminal"
                            onClick={() => setLogsModalOpen(true)}
                            className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <FaTerminal size={16} />
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">{activeDroneCount} Active</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-red-700">{totalDroneCount - activeDroneCount} Offline</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Map Container */}
            <div className="relative flex-1 px-4">
                <div className="w-full h-[80vh] bg-white rounded-2xl shadow-lg overflow-hidden relative">
                    <div
                        ref={leafletContainerRef}
                        className="relative w-full h-full"
                        id="map-container"
                    />

                    {/* Selected Drone Popup */}
                    {selectedDroneId && (
                        <div className="absolute inset-0 pointer-events-none">
                            {droneData.map(drone => {
                                if (drone.id === selectedDroneId && mapRef.current) {
                                    const marker = markersRef.current[drone.id];
                                    if (marker) {
                                        const point = mapRef.current.latLngToContainerPoint(marker.getLatLng());
                                        return (
                                            <div
                                                key={drone.id}
                                                className="absolute pointer-events-auto"
                                                style={{
                                                    left: point.x,
                                                    top: point.y,
                                                }}
                                            >
                                                <DronePopup
                                                    drone={drone}
                                                    onClose={() => setSelectedDroneId(null)}
                                                    onPlayPause={() => handlePlayPause(drone.id)}
                                                    onExpand={() => handleExpand(drone.id)}
                                                    onShowInfo={() => handleShowInfo(drone.id)}
                                                />
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <DraggableLogsModal
                logs={logs}
                isOpen={logsModalOpen}
                onClose={() => setLogsModalOpen(false)}
            />

            {selectedDrone && (
                <DroneInfoModal
                    isOpen={droneInfoModalOpen}
                    onClose={() => {
                        setDroneInfoModalOpen(false);
                        setSelectedDroneId(null);
                    }}
                    softwareVersion="DroneSoft v1.2.3"
                    appendix="Map view drone management"
                    flightTime={selectedDrone.flightTime}
                    speed={parseInt(selectedDrone.speed)}
                    distance={parseInt(selectedDrone.distance)}
                    batteryPercent={selectedDrone.batteryLevel}
                    temperature={selectedDrone.temperature}
                    remainingTime="30min"
                    payloadMax="20Kg"
                    latitude={selectedDrone.latitude}
                    longitude={selectedDrone.longitude}
                    altitude={selectedDrone.altitude}
                    maxDistance="2-4Km"
                    flightModes={["Slow", "Normal", "Fast"]}
                    serialNumber={`SN${selectedDrone.id}`}
                    firmwareVersion="v2.1.4"
                    isConnected={selectedDrone.isActive}
                />
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .drone-marker {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
}

export default DroneMapView;