import React, { useState } from "react";
import {
    FaChevronLeft,
    FaPlay,
    FaPause,
    FaExpand,
    FaCompass,
    FaMapMarkerAlt,
    FaInfo,
    FaTerminal
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DummyImage from "../assets/Picture1.png";
import DraggableLogsModal from "../components/Modals/DraggableLogsModal";
import DroneInfoModal from "../components/Modals/DroneInfoModal";

interface DroneData {
    id: string;
    name: string;
    bearing: string;
    distance: string;
    speed: string;
    flightTime: string;
    isActive: boolean;
    videoQuality: string;
    sensorType: string;
    batteryLevel: number;
    temperature: number;
    altitude: number;
    latitude: number;
    longitude: number;
}

// Mock data for 9 drones
const mockDroneData: DroneData[] = [
    {
        id: "5534",
        name: "Drone 5534",
        bearing: "40° NE",
        distance: "2532 m",
        speed: "20 km/h",
        flightTime: "2:30:25",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 85,
        temperature: 24,
        altitude: 120,
        latitude: 33.645677,
        longitude: 72.995978
    },
    {
        id: "5535",
        name: "Drone 5535",
        bearing: "85° E",
        distance: "1824 m",
        speed: "15 km/h",
        flightTime: "1:45:12",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 67,
        temperature: 26,
        altitude: 95,
        latitude: 33.655677,
        longitude: 73.005978
    },
    {
        id: "5536",
        name: "Drone 5536",
        bearing: "120° SE",
        distance: "3156 m",
        speed: "25 km/h",
        flightTime: "3:12:45",
        isActive: false,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 12,
        temperature: 22,
        altitude: 0,
        latitude: 33.635677,
        longitude: 72.985978
    },
    {
        id: "5537",
        name: "Drone 5537",
        bearing: "200° SW",
        distance: "892 m",
        speed: "12 km/h",
        flightTime: "0:58:33",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 92,
        temperature: 25,
        altitude: 150,
        latitude: 33.625677,
        longitude: 72.975978
    },
    {
        id: "5538",
        name: "Drone 5538",
        bearing: "315° NW",
        distance: "4521 m",
        speed: "30 km/h",
        flightTime: "4:22:18",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 78,
        temperature: 23,
        altitude: 200,
        latitude: 33.665677,
        longitude: 72.965978
    },
    {
        id: "5539",
        name: "Drone 5539",
        bearing: "45° NE",
        distance: "1673 m",
        speed: "18 km/h",
        flightTime: "2:05:41",
        isActive: false,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 8,
        temperature: 21,
        altitude: 0,
        latitude: 33.675677,
        longitude: 73.015978
    },
    {
        id: "5540",
        name: "Drone 5540",
        bearing: "270° W",
        distance: "2984 m",
        speed: "22 km/h",
        flightTime: "3:45:29",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 56,
        temperature: 27,
        altitude: 180,
        latitude: 33.685677,
        longitude: 72.955978
    },
    {
        id: "5541",
        name: "Drone 5541",
        bearing: "135° SE",
        distance: "1245 m",
        speed: "16 km/h",
        flightTime: "1:33:52",
        isActive: true,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 89,
        temperature: 28,
        altitude: 110,
        latitude: 33.615677,
        longitude: 73.025978
    },
    {
        id: "5542",
        name: "Drone 5542",
        bearing: "90° E",
        distance: "3742 m",
        speed: "28 km/h",
        flightTime: "4:18:07",
        isActive: false,
        videoQuality: "4K",
        sensorType: "Lidar",
        batteryLevel: 15,
        temperature: 20,
        altitude: 0,
        latitude: 33.595677,
        longitude: 73.035978
    }
];

interface DroneCardProps {
    drone: DroneData;
    onPlayPause: (droneId: string) => void;
    onExpand: (droneId: string) => void;
    onShowInfo: (droneId: string) => void;
}

const DroneCard: React.FC<DroneCardProps> = ({ drone, onPlayPause, onExpand, onShowInfo }) => {
    return (
        <div className="relative overflow-hidden bg-white border shadow-lg rounded-2xl">
            {/* Header Section - Compact */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-customBlue">{drone.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${drone.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <button
                    title="Drone Info"
                    onClick={() => onShowInfo(drone.id)}
                    className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-customBlue hover:bg-blue-700"
                >
                    <FaInfo size={12} />
                </button>
            </div>

            {/* Video Feed Area */}
            <div className="relative h-64 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
                {/* Background Image */}
                <img
                    src={DummyImage}
                    alt={`${drone.name} feed`}
                    className="object-cover w-full h-full opacity-80"
                />

                {/* Top Controls Overlay */}
                <div className="absolute top-0 left-0 right-0 z-10 p-3">
                    <div className="flex items-center justify-between">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2">
                            <select className="px-2 py-1 text-xs text-white border border-white rounded bg-black/30 backdrop-blur-sm">
                                <option>{drone.videoQuality}</option>
                                <option>1080p</option>
                                <option>720p</option>
                            </select>
                            <select className="px-2 py-1 text-xs text-white border border-white rounded bg-black/30 backdrop-blur-sm">
                                <option>{drone.sensorType}</option>
                                <option>Camera</option>
                                <option>Thermal</option>
                            </select>
                        </div>

                        {/* Center - Flight Time */}
                        <div className="px-3 py-1 text-sm font-medium text-white rounded bg-black/40 backdrop-blur-sm">
                            {drone.flightTime}
                        </div>

                        {/* Right - Battery Level */}
                        <div className={`px-3 py-1 text-sm font-medium text-white rounded backdrop-blur-sm ${drone.batteryLevel > 50 ? 'bg-green-500/40' :
                                drone.batteryLevel > 20 ? 'bg-yellow-500/40' : 'bg-red-500/40'
                            }`}>
                            {drone.batteryLevel}%
                        </div>
                    </div>
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                    <div className="flex items-end justify-between">
                        {/* Left - Navigation Info */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-white rounded bg-black/40 backdrop-blur-sm">
                                <FaCompass className="text-xs" />
                                {drone.bearing}
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-white rounded bg-black/40 backdrop-blur-sm">
                                <FaMapMarkerAlt className="text-xs" />
                                {drone.distance}
                            </div>
                        </div>

                        {/* Center - Speed */}
                        <div className="px-3 py-1 text-sm font-medium text-white rounded bg-black/40 backdrop-blur-sm">
                            {drone.speed}
                        </div>

                        {/* Right - Control Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPlayPause(drone.id)}
                                className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                                title={drone.isActive ? "Pause" : "Play"}
                            >
                                {drone.isActive ? <FaPause size={12} /> : <FaPlay size={12} />}
                            </button>
                            <button
                                onClick={() => onExpand(drone.id)}
                                className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                                title="Expand"
                            >
                                <FaExpand size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Offline Overlay */}
                {!drone.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="px-4 py-2 text-white bg-red-600 rounded-lg">
                            <span className="text-sm font-medium">OFFLINE</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function AllDroneView(): React.ReactElement {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<"all" | "map">("all");
    const [droneData, setDroneData] = useState<DroneData[]>(mockDroneData);
    const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
    const [droneInfoModalOpen, setDroneInfoModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        "[12:30:25] System initialized",
        "[12:30:26] Connecting to drones...",
        "[12:30:27] Drone 5534 connected",
        "[12:30:28] Drone 5535 connected",
        "[12:30:29] Video feed started for Drone 5534",
        "[12:30:30] All systems operational"
    ]);

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
        console.log(`Expanding drone ${droneId}`);
        navigate(`/drone-management`);
    };

    const handleShowInfo = (droneId: string) => {
        setSelectedDroneId(droneId);
        setDroneInfoModalOpen(true);
    };

    const activeDroneCount = droneData.filter(drone => drone.isActive).length;
    const totalDroneCount = droneData.length;
    const selectedDrone = selectedDroneId ? droneData.find(d => d.id === selectedDroneId) : null;

    return (
        <div className="flex flex-col w-full h-full min-h-screen text-black bg-gray-50">
            {/* Header Section */}
            <header className="mb-6">
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
                            <h1 className="text-2xl font-bold text-customBlue">All Drones</h1>
                            <p className="text-sm text-gray-600">
                                {activeDroneCount} of {totalDroneCount} drones active
                            </p>
                        </div>
                    </div>

                    {/* Center - View Toggle */}
                    <div className="flex p-1 bg-gray-200 rounded-lg">
                        <button
                            onClick={() => setActiveView("all")}
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

                    {/* Right side - Stats and Controls */}
                    <div className="flex items-center gap-4">
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

            {/* Main Content */}
            <div className="flex-1 px-4">
                {activeView === "all" ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {droneData.map((drone) => (
                            <DroneCard
                                key={drone.id}
                                drone={drone}
                                onPlayPause={handlePlayPause}
                                onExpand={handleExpand}
                                onShowInfo={handleShowInfo}
                            />
                        ))}
                    </div>
                ) : (
                    /* Map View Placeholder */
                    <div className="flex items-center justify-center bg-white shadow-lg h-96 rounded-2xl">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full">
                                <FaMapMarkerAlt className="text-2xl text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-gray-800">Map View</h3>
                            <p className="text-gray-600">Map view showing all drone locations will be implemented here</p>
                        </div>
                    </div>
                )}
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
                    appendix="Multi-drone management system"
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
        </div>
    );
}

export default AllDroneView;