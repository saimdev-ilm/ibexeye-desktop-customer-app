import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    FaChevronLeft,
    FaSolarPanel,
    FaPlus,
    FaSearch,
    FaCamera,
    FaExclamationTriangle,
    FaEllipsisV,
    FaEdit,
    FaTrash,
    FaPowerOff,
    FaPlayCircle,
    FaSpinner,
    FaVideo,
    FaShieldVirus
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import HlsPlayer from "react-hls-player";
import {
    getAllCameras,
    startCameraStreamRelay,
    stopCameraStreamRelay,
    deleteCamera,
    Camera
} from "../../services/cameraService";
import {
    enableCameraDetection,
    disableCameraDetection,
    getCameraDetectionStatus,
} from '../../services/detectionService';
import { useMode } from "../../contexts/ModeContext";
import { ModeType } from "../../services/modeService";

import ViewCameraModal from '../../components/CameraManagement/Modals/ViewCameraModal';
import EditCameraModal from '../../components/CameraManagement/Modals/EditCameraModal';
import DeleteCameraModal from '../../components/CameraManagement/Modals/DeleteCameraModal';
import AddCameraModal from '../../components/CameraManagement/Modals/AddCameraModal';

interface StreamStatus {
    isRunning: boolean;
    isLoading: boolean;
    error: string | null;
}

const AllCameraDashboard: React.FC = () => {
    const { activeMode } = useMode();
    const isArmAwayModeActive = activeMode?.modeType === ModeType.ARM_AWAY;

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filter, setFilter] = useState<string>("All");
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const playersRef = useRef<Record<string, React.RefObject<HTMLVideoElement>>>({});

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [editModalCamera, setEditModalCamera] = useState<Camera | null>(null);
    const [viewCamera, setViewCamera] = useState<Camera | null>(null);
    const [deleteCameraId, setDeleteCameraId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    // Menu states
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Loading states for operations
    const [streamLoadingCameraId, setStreamLoadingCameraId] = useState<string | null>(null);
    const [detectionLoadingCameraId, setDetectionLoadingCameraId] = useState<string | null>(null);

    // Track stream status for each camera
    const [streamStatuses, setStreamStatuses] = useState<Record<string, StreamStatus>>({});

    const isMounted = useRef<boolean>(false);
    const navigate = useNavigate();

    const fetchCameras = useCallback(async () => {
        console.log("📷 Starting camera fetch...");
        setLoading(true);
        
        try {
            const camerasData = await getAllCameras();
            console.log("📷 Cameras Retrieved:", camerasData);

            const enrichedCameras = await Promise.all(
                camerasData.map(async (camera) => {
                    if (!camera.network_id) return camera;
                    try {
                        const status = await getCameraDetectionStatus(camera.network_id);
                        return { ...camera, detectionEnabled: status.enabled };
                    } catch (error) {
                        console.warn(`Error getting detection status for camera ${camera.id}:`, error);
                        return { ...camera, detectionEnabled: false };
                    }
                })
            );

            const initialStreamStatuses: Record<string, StreamStatus> = {};
            enrichedCameras.forEach(camera => {
                const isRunning = isStreamRunning(camera);
                initialStreamStatuses[camera.id] = {
                    isRunning,
                    isLoading: false,
                    error: null
                };
            });

            if (isMounted.current) {
                setCameras(enrichedCameras);
                setStreamStatuses(initialStreamStatuses);
                setError(null);

                const currentRefs = Object.keys(playersRef.current);
                enrichedCameras.forEach((camera) => {
                    if (!currentRefs.includes(camera.id)) {
                        playersRef.current[camera.id] = React.createRef<HTMLVideoElement>();
                    }
                });
            }
        } catch (error) {
            console.error("❌ Failed to load cameras:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            if (isMounted.current) {
                setError(errorMessage);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    const toggleMenu = (cameraId: string) => {
        setActiveMenu(activeMenu === cameraId ? null : cameraId);
    };

    const handleView = (camera: Camera) => {
        setViewCamera({ ...camera });
        setActiveMenu(null);
    };

    const handleEdit = (camera: Camera) => {
        setEditModalCamera({ ...camera });
        setActiveMenu(null);
    };

    const handleDelete = (networkId: string | undefined) => {
        if (!networkId) return;
        setDeleteCameraId(networkId);
        setActiveMenu(null);
    };

    const confirmDelete = async () => {
        if (!deleteCameraId) return;

        try {
            setDeleteLoading(true);
            await deleteCamera(deleteCameraId);
            setCameras(prev => prev.filter(c => c.network_id !== deleteCameraId));
            await fetchCameras();
        } catch (err: any) {
            console.error("Failed to delete camera:", err);
        } finally {
            setDeleteLoading(false);
            setDeleteCameraId(null);
        }
    };

    const handleEditSubmit = async (updatedCamera: Camera) => {
        try {
            setCameras(prev => prev.map(c => (c.id === updatedCamera.id ? { ...c, ...updatedCamera } : c)));
            setEditModalCamera(null);
        } catch (err: any) {
            console.error("Error updating camera:", err);
        }
    };

    const handleAddCameraSubmit = async (data: Partial<Camera>) => {
        try {
            const newCamera: Camera = {
                id: Date.now().toString(),
                ...data,
                network_id: data.network_id || '',
                status: 'Offline',
                localHls: null,
                cloudHls: null,
                name: data.name || 'New Camera',
                isActive: false
            };
            setCameras(prev => [...prev, newCamera]);
            setIsAddModalOpen(false);
            await fetchCameras();
        } catch (error: any) {
            console.error("Add failed", error);
        }
    };

    const handleHomeDashboard = () => navigate("/");
    const handleAllSolarDashboard = () => navigate("/allSolarDashboard");

    const filteredCameras = cameras.filter((camera) => {
        const matchesSearch = camera.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false;
        const matchesFilter = filter === "All" || (filter === "Active" && (camera.isActive ?? false));
        return matchesSearch && matchesFilter;
    });

    const handleToggleDetection = async (camera: Camera) => {
        if (isArmAwayModeActive) {
            setActiveMenu(null);
            return;
        }

        try {
            setDetectionLoadingCameraId(camera.id);
            setActiveMenu(null);

            const networkId = camera.network_id;
            if (!networkId) throw new Error('Camera network_id missing');

            const newState = !camera.detectionEnabled;
            const response = newState
                ? await enableCameraDetection(networkId)
                : await disableCameraDetection(networkId);

            if (!response.success) throw new Error(response.message);

            await fetchCameras();
        } catch (error: any) {
            console.error("Detection toggle error:", error);
        } finally {
            if (isMounted.current) {
                setDetectionLoadingCameraId(null);
            }
        }
    };

    const renderDetectionButton = (camera: Camera) => {
        if (isArmAwayModeActive) return null;

        const isLoading = detectionLoadingCameraId === camera.id;
        const icon = isLoading
            ? <FaSpinner className="mr-2 text-purple-500 animate-spin" />
            : camera.detectionEnabled
                ? <FaPowerOff className="mr-2 text-red-500" />
                : <FaPowerOff className="mr-2 text-green-500" />;
        const label = camera.detectionEnabled ? 'Disable Detection' : 'Enable Detection';

        return (
            <button
                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleToggleDetection(camera)}
                disabled={isLoading}
            >
                {icon} {label}
            </button>
        );
    };

    const waitForStreamReady = async (url: string, retries = 10, delay = 1000): Promise<boolean> => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, { method: "HEAD" });
                if (res.ok) return true;
            } catch {
                // ignore errors
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        return false;
    };

    const handleStartStreamRelay = async (camera: Camera) => {
        if (isArmAwayModeActive) {
            setActiveMenu(null);
            return;
        }

        if (!camera.network_id) return;

        setStreamLoadingCameraId(camera.id);
        setActiveMenu(null);

        setStreamStatuses(prev => ({
            ...prev,
            [camera.id]: {
                ...prev[camera.id],
                isLoading: true,
                error: null
            }
        }));

        try {
            await startCameraStreamRelay(camera.network_id);
            const streamUrl = getStreamUrl(camera);
            await waitForStreamReady(streamUrl);

            if (isMounted.current) {
                await fetchCameras();
            }
        } catch (error: any) {
            console.error("Stream start error:", error);
            if (isMounted.current) {
                setStreamStatuses(prev => ({
                    ...prev,
                    [camera.id]: {
                        isRunning: false,
                        isLoading: false,
                        error: error.message
                    }
                }));
            }
        } finally {
            if (isMounted.current) {
                setStreamLoadingCameraId(null);
            }
        }
    };

    const handleStopStreamRelay = async (camera: Camera) => {
        if (isArmAwayModeActive) {
            setActiveMenu(null);
            return;
        }

        if (!camera.network_id) return;

        setStreamLoadingCameraId(camera.id);
        setActiveMenu(null);

        setStreamStatuses(prev => ({
            ...prev,
            [camera.id]: {
                ...prev[camera.id],
                isLoading: true,
                error: null
            }
        }));

        try {
            await stopCameraStreamRelay(camera.network_id);

            if (isMounted.current) {
                setStreamStatuses(prev => ({
                    ...prev,
                    [camera.id]: {
                        isRunning: false,
                        isLoading: false,
                        error: null
                    }
                }));
                await fetchCameras();
            }
        } catch (error: any) {
            console.error("Stream stop error:", error);
            if (isMounted.current) {
                setStreamStatuses(prev => ({
                    ...prev,
                    [camera.id]: {
                        ...prev[camera.id],
                        isLoading: false,
                        error: error.message
                    }
                }));
                await fetchCameras();
            }
        } finally {
            if (isMounted.current) {
                setStreamLoadingCameraId(null);
            }
        }
    };

    const isStreamRunning = (camera: Camera): boolean => {
        return Boolean(
            camera.cloudHls ||
            (camera.stream_links && 'cloud' in camera.stream_links && camera.stream_links.cloud?.hls)
        );
    };

    const hasStream = (camera: Camera): boolean => {
        return Boolean(
            isStreamRunning(camera) ||
            camera.localHls ||
            (camera.stream_links && 'local' in camera.stream_links && camera.stream_links.local?.hls) ||
            (camera.stream_links && 'hls' in camera.stream_links)
        );
    };

    const getStreamUrl = (camera: Camera): string => {
        if (camera.cloudHls) return camera.cloudHls;
        if (camera.stream_links && 'cloud' in camera.stream_links && camera.stream_links.cloud?.hls)
            return camera.stream_links.cloud.hls;
        if (camera.localHls) return camera.localHls;
        if (camera.stream_links && 'local' in camera.stream_links && camera.stream_links.local?.hls)
            return camera.stream_links.local.hls;
        if (camera.stream_links && 'hls' in camera.stream_links)
            return camera.stream_links.hls;
        return '';
    };

    const renderStreamContent = (camera: Camera) => {
        const cameraStreamStatus = streamStatuses[camera.id] || { isLoading: false, error: null, isRunning: false };

        if (streamLoadingCameraId === camera.id || cameraStreamStatus.isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-56 bg-gray-100">
                    <FaSpinner className="mb-2 text-2xl text-gray-500 animate-spin" />
                    <span className="text-gray-500">
                        {isStreamRunning(camera) ? "Stopping stream..." : "Starting stream..."}
                    </span>
                </div>
            );
        }

        if (hasStream(camera) && (cameraStreamStatus.isRunning || isStreamRunning(camera))) {
            return (
                <div className="h-56 bg-black">
                    <HlsPlayer
                        key={`${camera.id}-${getStreamUrl(camera)}`}
                        playerRef={playersRef.current[camera.id]}
                        src={getStreamUrl(camera)}
                        autoPlay
                        controls
                        muted
                        className="object-contain w-full h-full"
                        onError={(e) => {
                            console.error(`Stream error for ${camera.name}:`, e);
                            setStreamStatuses(prev => ({
                                ...prev,
                                [camera.id]: {
                                    ...prev[camera.id],
                                    error: "Stream playback error"
                                }
                            }));
                        }}
                    />
                </div>
            );
        }

        if (cameraStreamStatus.error) {
            return (
                <div className="flex flex-col items-center justify-center h-56 bg-red-50">
                    <FaExclamationTriangle size={32} className="mb-2 text-yellow-500" />
                    <p className="mb-1 text-red-600">Stream error</p>
                    <p className="px-4 text-xs text-center text-gray-600">{cameraStreamStatus.error}</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-56 bg-gray-200">
                <FaVideo size={32} className="mb-2 text-gray-400" />
                <p className="text-gray-500">No stream available</p>
            </div>
        );
    };

    const renderStreamToggleButton = (camera: Camera) => {
        if (isArmAwayModeActive) return null;

        const isRunning = isStreamRunning(camera);
        const isLoading = streamLoadingCameraId === camera.id;

        if (isRunning) {
            return (
                <button
                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleStopStreamRelay(camera)}
                    disabled={isLoading}
                >
                    {isLoading ?
                        <FaSpinner className="mr-2 text-red-500 animate-spin" /> :
                        <FaPowerOff className="mr-2 text-red-500" />}
                    Stop Stream
                </button>
            );
        }

        return (
            <button
                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleStartStreamRelay(camera)}
                disabled={isLoading}
            >
                {isLoading ?
                    <FaSpinner className="mr-2 text-indigo-500 animate-spin" /> :
                    <FaPlayCircle className="mr-2 text-indigo-500" />}
                Start Stream
            </button>
        );
    };

    const isOperationInProgress = (cameraId: string): boolean => {
        return streamLoadingCameraId === cameraId || detectionLoadingCameraId === cameraId;
    };

    useEffect(() => {
        isMounted.current = true;
        fetchCameras();
        return () => {
            isMounted.current = false;
        };
    }, [fetchCameras]);

    const renderArmAwayBanner = () => {
        if (!isArmAwayModeActive) return null;

        return (
            <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                <div className="flex items-center">
                    <FaShieldVirus className="mr-2" size={18} />
                    <div>
                        <p className="font-medium">Guard Mode Active</p>
                        <p className="text-sm">Camera controls are limited while in Guard mode for security purposes.</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full">
            <header className="flex items-center justify-between gap-3 px-3 py-2 mb-6 bg-white border rounded-full shadow-md 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={handleHomeDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">Camera Dashboard</h1>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={handleAllSolarDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-full shadow-sm bg-customBlue hover:bg-blue-600"
                    >
                        <FaSolarPanel />
                    </button>
                </div>
            </header>

            <div className="flex flex-col items-center justify-center w-full gap-2">
                {renderArmAwayBanner()}

                <div className="flex flex-col items-start justify-between w-full gap-4 mb-4 md:flex-row md:items-center">
                    <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search cameras..."
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
                            <option value="All">All Cameras</option>
                            <option value="Active">Active Cameras</option>
                        </select>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 text-sm text-white transition-colors rounded-lg shadow-sm bg-customBlue hover:bg-blue-600"
                            disabled={isArmAwayModeActive}
                        >
                            <div className="flex items-center gap-2">
                                <FaPlus />
                                <span>Add Camera</span>
                            </div>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center w-full h-64">
                        <div className="w-12 h-12 mb-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                        <p className="text-gray-600">Loading cameras...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center w-full h-64">
                        <FaExclamationTriangle size={32} className="mb-4 text-yellow-500" />
                        <p className="mb-4 text-lg text-red-500">{error}</p>
                        <button
                            onClick={fetchCameras}
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
                            {filteredCameras.length > 0 ? (
                                filteredCameras.map((camera) => (
                                    <div key={camera.id} className="relative group">
                                        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <div className="relative">
                                                <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${camera.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {camera.status || 'Unknown'}
                                                </div>

                                                <div className="absolute z-30 flex gap-2 top-2 right-2">
                                                    <button
                                                        className={`p-2 text-white bg-gray-800 rounded-full bg-opacity-70 ${isOperationInProgress(camera.id) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                                                        onClick={() => toggleMenu(camera.id)}
                                                        disabled={isOperationInProgress(camera.id)}
                                                    >
                                                        <FaEllipsisV />
                                                    </button>
                                                </div>

                                                {detectionLoadingCameraId === camera.id && (
                                                    <div className="absolute z-20 flex items-center px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded-full bottom-2 left-2">
                                                        <FaSpinner className="mr-1 animate-spin" />
                                                        <span>{camera.detectionEnabled ? "Disabling" : "Enabling"} detection...</span>
                                                    </div>
                                                )}

                                                {activeMenu === camera.id && (
                                                    <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg right-2 top-12">
                                                        {hasStream(camera) && (
                                                            <button
                                                                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                                                onClick={() => handleView(camera)}
                                                            >
                                                                <FaPlayCircle className="mr-2 text-green-500" />
                                                                View Stream
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100" 
                                                            onClick={() => handleEdit(camera)}
                                                            disabled={isArmAwayModeActive}
                                                        >
                                                            <FaEdit className="mr-2 text-blue-500" /> Edit
                                                        </button>
                                                        {renderDetectionButton(camera)}
                                                        {renderStreamToggleButton(camera)}
                                                        <button
                                                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                                            onClick={() => handleDelete(camera.network_id)}
                                                            disabled={isArmAwayModeActive}
                                                        >
                                                            <FaTrash className="mr-2 text-red-500" /> Delete
                                                        </button>
                                                    </div>
                                                )}

                                                {renderStreamContent(camera)}
                                            </div>

                                            <div className="p-4">
                                                <h3 className="mb-1 font-medium text-gray-800">{camera.name || 'Unnamed Camera'}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {isStreamRunning(camera) ? (
                                                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                                            Stream Active
                                                        </span>
                                                    ) : hasStream(camera) ? (
                                                        <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                                                            Stream Ready
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                            No Stream
                                                        </span>
                                                    )}

                                                    {camera.detectionEnabled ? (
                                                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                                                            Detection Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                            Detection Off
                                                        </span>
                                                    )}
                                                    
                                                    {isArmAwayModeActive && (
                                                        <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                                            Guard Mode
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
                                        <FaCamera size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg text-gray-500">No cameras found</p>
                                        <p className="text-sm text-gray-400">Add a camera to get started</p>
                                        <button
                                            className="px-4 py-2 mt-4 text-white rounded-md bg-customBlue hover:bg-blue-600"
                                            onClick={() => setIsAddModalOpen(true)}
                                            disabled={isArmAwayModeActive}
                                        >
                                            <FaPlus className="inline mr-2" /> Add Camera
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {editModalCamera && (
                <EditCameraModal
                    camera={editModalCamera}
                    onClose={() => setEditModalCamera(null)}
                    onSave={handleEditSubmit}
                />
            )}

            {deleteCameraId && (
                <DeleteCameraModal
                    cameraId={deleteCameraId}
                    onClose={() => setDeleteCameraId(null)}
                    onConfirm={confirmDelete}
                    isLoading={deleteLoading}
                />
            )}

            {isAddModalOpen && (
                <AddCameraModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddCameraSubmit}
                />
            )}

            {viewCamera && (
                <ViewCameraModal
                    camera={viewCamera}
                    onClose={() => setViewCamera(null)}
                />
            )}
        </div>
    );
};

export default AllCameraDashboard;