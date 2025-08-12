// SimplifiedVideoModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaExclamationCircle, FaSync } from "react-icons/fa";
import { Recording, formatDate } from '../../services/recordingService';
import { getToken } from '../../services/authService';

interface VideoModalProps {
    selectedVideo: Recording;
    onClose: () => void;
}

const SimplifiedVideoModal: React.FC<VideoModalProps> = ({
    selectedVideo,
    onClose,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [authMethod, setAuthMethod] = useState(0); // Track which auth method to try
    const videoRef = useRef<HTMLVideoElement>(null);

    // Log video information when component mounts
    useEffect(() => {
        console.log('Selected video ID:', selectedVideo.id);
        console.log('Selected video filename:', selectedVideo.filename);
        console.log('Playing video from camera:', selectedVideo.cameraName);
        console.log('Video created at:', formatDate(selectedVideo.createdAt));
    }, [selectedVideo]);

 
    // This function will create a blob URL from the video to play directly
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    
    // Try to fetch the video using Authorization header
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setIsLoading(true);
                setHasError(false);
                
                const recordingId = selectedVideo.id;
                const token = getToken();
                
                if (!token) {
                    console.error('Authentication token is missing');
                    setHasError(true);
                    setErrorMessage('Authentication token is missing');
                    return;
                }
                
                console.log('Fetching video with direct Authorization header');
                
                const response = await fetch(`https://stream-tst-sbx.ibexvision.ai/device-recordings/serve/1/${recordingId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                console.log('Created blob URL for video:', url);
                setBlobUrl(url);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching video:', error);
                setIsLoading(false);
                setHasError(true);
                setErrorMessage(`Failed to load video: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        
        fetchVideo();
        
        // Cleanup function to revoke blob URL
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [selectedVideo.id, authMethod]);

 

    // Function to retry loading the video
    const handleRetry = () => {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        setAuthMethod((prev) => (prev + 1) % 4);
        console.log('Retrying video playback with new auth method:', (authMethod + 1) % 4);
    };

    // Handle video load events
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) return;

        const handleLoadStart = () => {
            console.log('Video load started');
            setIsLoading(true);
            setHasError(false);
        };

        const handleLoadedData = () => {
            console.log('Video loaded successfully');
            setIsLoading(false);
            setHasError(false);
        };

        const handleError = (e: Event) => {
            console.error('Video playback error:', e);
            setIsLoading(false);
            setHasError(true);

            // Try to get more detailed error information
            const target = e.target as HTMLVideoElement;
            if (target && target.error) {
                console.error('Media error code:', target.error.code);
                console.error('Media error message:', target.error.message);

                switch (target.error.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        setErrorMessage('Playback aborted by the user');
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        setErrorMessage('Network error occurred while loading the video. Authentication may have failed.');
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        setErrorMessage('The video format is not supported or the file is corrupted');
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        setErrorMessage('The video source or format is not supported. Authentication may have failed.');
                        break;
                    default:
                        setErrorMessage('An unknown error occurred');
                }
            } else {
                setErrorMessage('Failed to load the video. Authentication may have failed.');
            }
        };

        // Add event listeners
        videoElement.addEventListener('loadstart', handleLoadStart);
        videoElement.addEventListener('loadeddata', handleLoadedData);
        videoElement.addEventListener('error', handleError);

        // Cleanup
        return () => {
            videoElement.removeEventListener('loadstart', handleLoadStart);
            videoElement.removeEventListener('loadeddata', handleLoadedData);
            videoElement.removeEventListener('error', handleError);
        };
    }, [videoRef.current]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-full max-w-4xl p-2 bg-black rounded-lg md:p-4">
                <button
                    onClick={onClose}
                    className="absolute p-2 text-white bg-red-600 rounded-full -top-4 -right-4 hover:bg-red-700"
                >
                    <FaTimes size={16} />
                </button>

                <h3 className="mb-2 text-sm font-semibold text-white md:text-base">
                    {selectedVideo.cameraName}
                </h3>

                <div className="relative overflow-hidden rounded-lg aspect-video">
                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-80">
                            <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                            <p className="mt-3 text-white">Loading video...</p>
                        </div>
                    )}

                    {/* Error Display */}
                    {hasError && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-80">
                            <FaExclamationCircle size={32} className="mb-2 text-red-500" />
                            <p className="mb-2 text-center text-white">{errorMessage}</p>
                            <p className="mb-4 text-sm text-center text-gray-400">
                                Trying authentication method {authMethod + 1}/4
                            </p>
                            <button
                                onClick={handleRetry}
                                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                <FaSync className="mr-2" size={14} /> Try Different Auth
                            </button>
                        </div>
                    )}

                    {/* Video Player - Direct video with no image */}
                    <video
                        ref={videoRef}
                        className="w-full h-full"
                        controls
                        autoPlay
                        preload="auto"
                        playsInline  // Important for mobile devices
                        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                        src={blobUrl || ''}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* Just the date info, no action buttons */}
                <div className="mt-3">
                    <div className="text-xs text-gray-300 md:text-sm">
                        {formatDate(selectedVideo.createdAt)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimplifiedVideoModal;