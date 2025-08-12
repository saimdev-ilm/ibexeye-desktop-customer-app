import React, { useRef, useEffect, useState } from 'react';
import { FaVideo, FaCircle, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import HlsPlayer from 'react-hls-player';

// ✅ Fixed interface to match data from ZonesPanel
interface Camera {
    id: number | string; // Allow both types
    networkId?: string; // Make optional
    network_id?: string; // Also support this format
    name: string;
    host?: string; // Make optional
    cloudHls: string | null;
    localHls?: string | null; // Add this for fallback
    isActive?: boolean; // Add this
    status?: string; // Add this
}

interface CameraCardProps {
    camera: Camera;
    onClick: (camera: Camera) => void;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, onClick }) => {
    const playerRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    // ✅ Improved video feed URL selection
    const getVideoFeedUrl = () => {
        // Try cloudHls first
        if (camera?.cloudHls && camera.cloudHls.trim() !== '') {
            return camera.cloudHls;
        }

        // Fallback to localHls if available
        if (camera?.localHls && camera.localHls.trim() !== '') {
            return camera.localHls;
        }

        return null;
    };

    const videoFeedUrl = getVideoFeedUrl();
    const isActive = !!(videoFeedUrl && isLoaded && !isError);

    // ✅ Get network ID from either field
    const getNetworkId = () => {
        return camera?.networkId || camera?.network_id || camera?.id?.toString() || 'Unknown';
    };

    // ✅ Get camera status
    const getCameraStatus = () => {
        if (camera?.status) return camera.status;
        if (camera?.isActive !== undefined) return camera.isActive ? 'Online' : 'Offline';
        return isActive ? 'Live' : 'Offline';
    };

    useEffect(() => {
        // Reset states when camera changes
        setIsLoaded(false);
        setIsError(false);
        setIsRetrying(false);

        // ✅ Debug logging
        console.log('🎥 CameraCard mounted with:', {
            id: camera?.id,
            name: camera?.name,
            networkId: getNetworkId(),
            cloudHls: camera?.cloudHls,
            localHls: camera?.localHls,
            videoFeedUrl: getVideoFeedUrl()
        });
    }, [camera]);

    // Auto-retry loading the stream once if it fails
    useEffect(() => {
        if (isError && !isRetrying && videoFeedUrl) {
            setIsRetrying(true);
            const retryTimer = setTimeout(() => {
                if (playerRef.current) {
                    playerRef.current.load();
                    setIsError(false);
                }
            }, 3000);

            return () => clearTimeout(retryTimer);
        }
    }, [isError, isRetrying, videoFeedUrl]);

    const handleLoadedMetadata = () => {
        console.log('📺 Stream loaded for camera:', camera?.name);
        setIsLoaded(true);
        setIsError(false);
    };

    const handleError = (e: any) => {
        console.error('❌ Stream error for camera:', camera?.name, e);
        setIsError(true);
        setIsLoaded(false);
    };

    // Handle click with proper null checking
    const handleClick = () => {
        if (camera) {
            console.log('🖱️ Camera clicked:', camera);
            onClick(camera);
        }
    };

    // In case camera is null or undefined, show a placeholder
    if (!camera) {
        return (
            <div className="relative overflow-hidden transition-all duration-200 bg-gray-900 border border-gray-200 rounded-lg shadow-md">
                <div className="relative pt-[56.25%]">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                        <FaExclamationTriangle size={16} className="mb-1 text-yellow-500" />
                        <span className="text-xs text-gray-400">Invalid camera</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className="relative overflow-hidden transition-all duration-200 bg-gray-900 border border-gray-200 rounded-lg shadow-md cursor-pointer hover:shadow-lg group"
        >
            {/* Stream Container with compact 16:9 Aspect Ratio */}
            <div className="relative pt-[56.25%]">
                {videoFeedUrl ? (
                    <div className="absolute inset-0 bg-black">
                        <HlsPlayer
                            playerRef={playerRef}
                            src={videoFeedUrl}
                            autoPlay
                            controls={false}
                            muted
                            className="object-cover w-full h-full"
                            onLoadedMetadata={handleLoadedMetadata}
                            onError={handleError}
                        />

                        {/* Show loading overlay while the stream is loading */}
                        {!isLoaded && !isError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
                                <div className="w-4 h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                                <span className="ml-1 text-xs text-gray-300">Loading...</span>
                            </div>
                        )}

                        {/* Show error overlay if stream fails to load */}
                        {isError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70">
                                <FaExclamationTriangle size={16} className="mb-1 text-yellow-500" />
                                <span className="text-xs text-gray-300">
                                    {isRetrying ? 'Retrying...' : 'Unavailable'}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                        <FaVideo size={20} className="mb-1 text-gray-500" />
                        <span className="text-xs text-gray-400">No stream</span>
                    </div>
                )}

                {/* Camera Name Overlay at the top - Compact */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-xs font-medium text-white truncate">
                        {camera.name || 'Unnamed'}
                    </span>

                    {/* Online Status Badge - Compact */}
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-white 
                        ${isActive ? 'bg-green-600' : 'bg-gray-700'} rounded-full`}>
                        <FaCircle size={4} className={isActive ? 'animate-pulse' : ''} />
                        <span className="text-xs">{isActive ? 'Live' : 'Off'}</span>
                    </div>
                </div>

                {/* View Camera Hover Overlay - Compact */}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black opacity-0 bg-opacity-40 group-hover:opacity-100">
                    <div className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md">
                        <FaEye className="mr-1" size={12} /> View
                    </div>
                </div>
            </div>

            {/* Camera Info - Network ID display at bottom - Compact */}
            <div className="px-2 py-1 text-xs text-gray-400 truncate bg-gray-800">
                ID: {getNetworkId()}
                {/* ✅ Show debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                    <span className="ml-1 text-gray-500">
                        | {videoFeedUrl ? '✓' : '✗'}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CameraCard;