import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaSolarPanel, FaCamera, FaCircle, FaExclamationTriangle, FaBell, FaBellSlash } from "react-icons/fa";
import { getAllCameras, Camera } from '../services/cameraService';
import { getAllCamerasWithDetection, enableDetection, disableDetection } from '../services/roiService';
import HlsPlayer from "react-hls-player";

// Extended Camera interface to include detection status
interface CameraWithDetection extends Camera {
  detectionEnabled?: boolean;
  hasRoi?: boolean;
}

const ROIManager: React.FC = () => {
    const [cameras, setCameras] = useState<CameraWithDetection[]>([]);
    // Create a ref object to store multiple player refs
    const playersRef = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
    const [updatingDetection, setUpdatingDetection] = useState<string | null>(null);

    const navigate = useNavigate();

    // Fetch all cameras when component loads
    useEffect(() => {
        const fetchCameras = async () => {
            setLoading(true);
            try {
                // Get basic camera data
                const camerasData = await getAllCameras();
                console.log("📷 Cameras Retrieved:", camerasData);
                
                // Get detection status for all cameras
                const detectionData = await getAllCamerasWithDetection();
                console.log("🔍 Detection Status Retrieved:", detectionData);
                
                // Merge the data
                const mergedCameras = camerasData.map(camera => {
                    const detectionInfo = detectionData.cameras?.find(
                        (c: any) => c.camera_id === camera.network_id || c.network_id === camera.network_id
                    );
                    
                    return {
                        ...camera,
                        detectionEnabled: detectionInfo?.enabled || false,
                        hasRoi: detectionInfo?.has_roi || false
                    };
                });
                
                setCameras(mergedCameras);

                // Initialize refs for each camera
                mergedCameras.forEach((camera) => {
                    playersRef.current[camera.id] = React.createRef<HTMLVideoElement>();
                });

                setError(null);
            } catch (error) {
                console.error("❌ Failed to load cameras:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                setError(errorMessage);

                // Check if the error is an authentication error
                if (errorMessage.includes('Unauthorized') || errorMessage.includes('auth')) {
                    setIsAuthenticated(false);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCameras();
    }, []);

    const handleHomeDashboard = () => {
        navigate("/");
    };

    const handleAllSolarDashboard = () => {
        navigate("/allSolarDashboard");
    };

    // Modified to handle the case where network_id might be missing
    const handleCameraClick = (camera: CameraWithDetection) => {
        if (camera.network_id) {
            console.log(`Navigating to ROI Editor with cameraId=${camera.id}, network_id=${camera.network_id}`);
            navigate(`/roi-editor/${camera.id}`);
        } else {
            console.error("Cannot configure ROI: Camera does not have a network_id");
            alert("Cannot configure ROI: This camera doesn't have a valid network ID");
        }
    };

    // Toggle detection status for a camera
    const toggleDetection = async (e: React.MouseEvent, camera: CameraWithDetection) => {
        // Stop event propagation to prevent navigation
        e.stopPropagation();
        
        if (!camera.network_id) {
            alert("Cannot toggle detection: Camera doesn't have a valid network ID");
            return;
        }
        
        setUpdatingDetection(camera.id);
        
        try {
            if (camera.detectionEnabled) {
                await disableDetection(camera.network_id);
                console.log(`Detection disabled for camera ${camera.name}`);
            } else {
                await enableDetection(camera.network_id);
                console.log(`Detection enabled for camera ${camera.name}`);
            }
            
            // Update the camera in state
            setCameras(cameras.map(c => {
                if (c.id === camera.id) {
                    return {
                        ...c,
                        detectionEnabled: !c.detectionEnabled
                    };
                }
                return c;
            }));
            
        } catch (error) {
            console.error(`Failed to toggle detection for camera ${camera.name}:`, error);
            alert(`Failed to ${camera.detectionEnabled ? 'disable' : 'enable'} detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUpdatingDetection(null);
        }
    };

    // If not authenticated, show login prompt
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full p-8">
                <FaExclamationTriangle size={48} className="mb-4 text-yellow-500" />
                <h2 className="mb-4 text-xl font-bold text-gray-800">Authentication Required</h2>
                <p className="mb-6 text-gray-600">
                    Please log in to access the ROI management dashboard.
                </p>
                <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-2 text-white rounded-full bg-customBlue hover:bg-blue-600"
                >
                    Log In
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full">
            <header className="flex items-center justify-between gap-3 px-3 py-2 mb-6 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        title="Go to Home Dashboard"
                        onClick={handleHomeDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
                        ROI Management Dashboard
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        title="Go to Solar Dashboard"
                        onClick={handleAllSolarDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
                    >
                        <FaSolarPanel />
                    </button>
                </div>
            </header>

            <div className="p-4">
                <h2 className="mb-6 text-xl font-semibold text-gray-800">Select a Camera to Configure ROI</h2>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-lg text-gray-600">Loading cameras...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <FaExclamationTriangle size={32} className="mb-4 text-yellow-500" />
                        <p className="mb-4 text-lg text-red-500">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 text-white rounded-full bg-customBlue hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {cameras.length > 0 ? (
                            cameras.map((camera) => (
                                <div
                                    key={camera.id}
                                    className="overflow-hidden transition-transform duration-200 bg-white border rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:scale-102"
                                    onClick={() => handleCameraClick(camera)}
                                >
                                    <div className="relative h-48 overflow-hidden bg-gray-200">
                                        {/* Indicator for active stream */}
                                        {camera.isActive && (
                                            <div className="absolute top-0 right-0 z-10 flex items-center gap-1 p-2 text-xs text-white bg-green-600 rounded-bl-lg">
                                                <FaCircle size={8} />
                                                <span>Active</span>
                                            </div>
                                        )}

                                        {/* Indicator for detection status */}
                                        {camera.network_id && (
                                            <div 
                                                className={`absolute top-0 left-0 z-10 flex items-center gap-1 p-2 text-xs text-white rounded-br-lg ${
                                                    camera.detectionEnabled ? 'bg-purple-600' : 'bg-gray-600'
                                                }`}
                                                onClick={(e) => toggleDetection(e, camera)}
                                                title={camera.detectionEnabled ? 'Detection enabled (click to disable)' : 'Detection disabled (click to enable)'}
                                            >
                                                {updatingDetection === camera.id ? (
                                                    <span>Updating...</span>
                                                ) : (
                                                    <>
                                                        {camera.detectionEnabled ? (
                                                            <><FaBell size={10} /><span>Detection On</span></>
                                                        ) : (
                                                            <><FaBellSlash size={10} /><span>Detection Off</span></>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {camera.cloudHls ? (
                                            <HlsPlayer
                                                key={camera.id}
                                                src={camera.cloudHls}
                                                autoPlay
                                                controls={false}
                                                muted
                                                playerRef={playersRef.current[camera.id]}
                                                className="object-cover w-full h-full"
                                                onLoadedMetadata={() =>
                                                    console.log(`✅ HLS Stream Loaded: ${camera.name}`)
                                                }
                                                onError={(err) =>
                                                    console.error(`❌ HLS Error for ${camera.name}:`, err)
                                                }
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <FaCamera size={36} className="text-gray-400" />
                                                <p className="mt-2 text-sm text-gray-500">No stream available</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="mb-2 text-lg font-medium text-gray-800">{camera.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                camera.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {camera.status}
                                            </span>
                                            <span className={`text-sm ${
                                                camera.network_id 
                                                    ? camera.hasRoi 
                                                        ? 'text-green-600' 
                                                        : 'text-blue-600' 
                                                    : 'text-gray-500'
                                            }`}>
                                                {camera.network_id 
                                                    ? camera.hasRoi 
                                                        ? 'ROI Configured' 
                                                        : 'Configure ROI' 
                                                    : 'No ROI Support'
                                                }
                                            </span>
                                        </div>
                                        {/* Debug information - you can remove this in production */}
                                        <div className="mt-2 text-xs text-gray-500">
                                            <div>Stream: {camera.cloudHls ? 'Available' : 'None'}</div>
                                            <div>Network ID: {camera.network_id || 'None'}</div>
                                            <div>Detection: {camera.detectionEnabled ? 'Enabled' : 'Disabled'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-64 col-span-full">
                                <p className="text-lg text-gray-500">No cameras available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ROIManager;