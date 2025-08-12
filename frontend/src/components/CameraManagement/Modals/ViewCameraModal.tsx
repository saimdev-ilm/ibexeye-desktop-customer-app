import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaVideo, FaCloudDownloadAlt, FaNetworkWired, FaExclamationTriangle } from 'react-icons/fa';
import { Camera, getCameraByNetworkId } from '../../../services/cameraService';

interface ViewCameraModalProps {
    camera: Camera | null;
    onClose: () => void;
}

const ViewCameraModal: React.FC<ViewCameraModalProps> = ({ camera, onClose }) => {
    const [detailedCamera, setDetailedCamera] = useState<Camera | null>(null);
    const [streamType, setStreamType] = useState<'cloud' | 'local'>('cloud');
    const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Fetch detailed camera info by network_id
    useEffect(() => {
        const fetchCameraDetails = async () => {
            if (!camera || !camera.network_id) {
                setDetailedCamera(camera);
                setIsDetailLoading(false);
                return;
            }
            
            setIsDetailLoading(true);
            
            try {
                const detailedData = await getCameraByNetworkId(camera.network_id);
                console.log('Fetched detailed camera data:', detailedData);
                setDetailedCamera(detailedData);
            } catch (error) {
                console.error('Error fetching camera details:', error);
                // Fall back to the basic camera data if we can't get details
                setDetailedCamera(camera);
            } finally {
                setIsDetailLoading(false);
            }
        };
        
        fetchCameraDetails();
    }, [camera]);
    
    // Set up stream once detailed camera data is available
    useEffect(() => {
        if (isDetailLoading) return;
        
        // Reset states
        setIsLoading(true);
        setError(null);
        
        // Get the active camera data to use
        const activeCamera = detailedCamera || camera;
        if (!activeCamera) {
            setIsLoading(false);
            setError('No camera data available');
            return;
        }
        
        // Determine if streams are available
        const hasCloudStream = Boolean(
            activeCamera.cloudHls || 
            (activeCamera.stream_links && 'cloud' in activeCamera.stream_links && activeCamera.stream_links.cloud?.hls) ||
            (activeCamera.stream_links && 'hls' in activeCamera.stream_links && 
                !String(activeCamera.stream_links.hls).includes('192.168.') && 
                !String(activeCamera.stream_links.hls).includes('localhost') && 
                !String(activeCamera.stream_links.hls).includes('127.0.0.1'))
        );
        
        const hasLocalStream = Boolean(
            activeCamera.localHls || 
            (activeCamera.stream_links && 'local' in activeCamera.stream_links && activeCamera.stream_links.local?.hls) ||
            (activeCamera.stream_links && 'hls' in activeCamera.stream_links && 
                (String(activeCamera.stream_links.hls).includes('192.168.') || 
                 String(activeCamera.stream_links.hls).includes('localhost') || 
                 String(activeCamera.stream_links.hls).includes('127.0.0.1')))
        );
        
        // Determine best stream to use as default
        if (hasCloudStream) {
            setStreamType('cloud');
            if (activeCamera.cloudHls) {
                setStreamUrl(activeCamera.cloudHls);
            } else if (activeCamera.stream_links) {
                if ('cloud' in activeCamera.stream_links && activeCamera.stream_links.cloud?.hls) {
                    setStreamUrl(activeCamera.stream_links.cloud.hls);
                } else if ('hls' in activeCamera.stream_links && 
                    !String(activeCamera.stream_links.hls).includes('192.168.') && 
                    !String(activeCamera.stream_links.hls).includes('localhost') && 
                    !String(activeCamera.stream_links.hls).includes('127.0.0.1')) {
                    setStreamUrl(activeCamera.stream_links.hls);
                }
            }
        } else if (hasLocalStream) {
            setStreamType('local');
            if (activeCamera.localHls) {
                setStreamUrl(activeCamera.localHls);
            } else if (activeCamera.stream_links) {
                if ('local' in activeCamera.stream_links && activeCamera.stream_links.local?.hls) {
                    setStreamUrl(activeCamera.stream_links.local.hls);
                } else if ('hls' in activeCamera.stream_links && 
                    (String(activeCamera.stream_links.hls).includes('192.168.') || 
                     String(activeCamera.stream_links.hls).includes('localhost') || 
                     String(activeCamera.stream_links.hls).includes('127.0.0.1'))) {
                    setStreamUrl(activeCamera.stream_links.hls);
                }
            }
        } else {
            setStreamUrl(undefined);
            setError('No stream available for this camera');
        }
        
        // Log the chosen stream URL for debugging
        console.log('Selected stream URL:', streamUrl);
        
        // Set a timeout to simulate initial loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        
        return () => clearTimeout(timer);
    }, [detailedCamera, isDetailLoading]);
    
    // Handle stream type toggle
    const handleStreamToggle = (type: 'cloud' | 'local') => {
        const activeCamera = detailedCamera || camera;
        if (!activeCamera) return;
        
        setStreamType(type);
        setIsLoading(true);
        setError(null);
        
        if (type === 'cloud') {
            // Try to get cloud stream URL from various possible locations
            let cloudStreamUrl: string | undefined = undefined;
            
            if (activeCamera.cloudHls) {
                cloudStreamUrl = activeCamera.cloudHls;
            } else if (activeCamera.stream_links) {
                if ('cloud' in activeCamera.stream_links && activeCamera.stream_links.cloud?.hls) {
                    cloudStreamUrl = activeCamera.stream_links.cloud.hls;
                } else if ('hls' in activeCamera.stream_links && 
                    !String(activeCamera.stream_links.hls).includes('192.168.') && 
                    !String(activeCamera.stream_links.hls).includes('localhost') &&
                    !String(activeCamera.stream_links.hls).includes('127.0.0.1')) {
                    cloudStreamUrl = activeCamera.stream_links.hls;
                }
            }
            
            if (cloudStreamUrl) {
                setStreamUrl(cloudStreamUrl);
            } else {
                setStreamUrl(undefined);
                setError('No cloud stream available for this camera');
            }
        } else if (type === 'local') {
            // Try to get local stream URL from various possible locations
            let localStreamUrl: string | undefined = undefined;
            
            if (activeCamera.localHls) {
                localStreamUrl = activeCamera.localHls;
            } else if (activeCamera.stream_links) {
                if ('local' in activeCamera.stream_links && activeCamera.stream_links.local?.hls) {
                    localStreamUrl = activeCamera.stream_links.local.hls;
                } else if ('hls' in activeCamera.stream_links && 
                    (String(activeCamera.stream_links.hls).includes('192.168.') || 
                     String(activeCamera.stream_links.hls).includes('localhost') ||
                     String(activeCamera.stream_links.hls).includes('127.0.0.1'))) {
                    localStreamUrl = activeCamera.stream_links.hls;
                }
            }
            
            if (localStreamUrl) {
                setStreamUrl(localStreamUrl);
            } else {
                setStreamUrl(undefined);
                setError('No local stream available for this camera');
            }
        }
        
        // Simulate loading
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };
    
    // Helper functions to check stream availability
    const hasCloudStream = () => {
        const activeCamera = detailedCamera || camera;
        if (!activeCamera) return false;
        
        return Boolean(
            activeCamera.cloudHls || 
            (activeCamera.stream_links && 'cloud' in activeCamera.stream_links && activeCamera.stream_links.cloud?.hls) ||
            (activeCamera.stream_links && 'hls' in activeCamera.stream_links && 
                !String(activeCamera.stream_links.hls).includes('192.168.') && 
                !String(activeCamera.stream_links.hls).includes('localhost') &&
                !String(activeCamera.stream_links.hls).includes('127.0.0.1'))
        );
    };
    
    const hasLocalStream = () => {
        const activeCamera = detailedCamera || camera;
        if (!activeCamera) return false;
        
        return Boolean(
            activeCamera.localHls || 
            (activeCamera.stream_links && 'local' in activeCamera.stream_links && activeCamera.stream_links.local?.hls) ||
            (activeCamera.stream_links && 'hls' in activeCamera.stream_links && 
                (String(activeCamera.stream_links.hls).includes('192.168.') || 
                 String(activeCamera.stream_links.hls).includes('localhost') ||
                 String(activeCamera.stream_links.hls).includes('127.0.0.1')))
        );
    };
    
    // If no camera data available, don't render anything
    if (!camera && !detailedCamera) {
        return null;
    }
    
    // Get the active camera data to display
    const activeCamera = detailedCamera || camera;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-75">
            <div className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-xl md:mx-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">
                        <FaVideo className="inline mr-2 text-blue-500" />
                        {activeCamera?.name}
                        {isDetailLoading && <FaSpinner className="inline ml-2 animate-spin" />}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Close"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>
                
                <div className="p-4">
                    {/* Stream type toggle buttons */}
                    <div className="flex mb-4 space-x-2">
                        <button
                            onClick={() => handleStreamToggle('cloud')}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                streamType === 'cloud'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            } ${!hasCloudStream() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!hasCloudStream()}
                        >
                            <FaCloudDownloadAlt className="mr-2" />
                            Cloud Stream
                        </button>
                        <button
                            onClick={() => handleStreamToggle('local')}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                streamType === 'local'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            } ${!hasLocalStream() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!hasLocalStream()}
                        >
                            <FaNetworkWired className="mr-2" />
                            Local Stream
                        </button>
                    </div>
                    
                    {/* Video player area */}
                    <div className="relative flex items-center justify-center h-[60vh] border border-gray-300 rounded-lg bg-black">
                        {isDetailLoading ? (
                            <div className="flex flex-col items-center justify-center">
                                <FaSpinner className="mb-2 text-4xl text-white animate-spin" />
                                <p className="text-white">Loading camera details...</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center">
                                <FaSpinner className="mb-2 text-4xl text-white animate-spin" />
                                <p className="text-white">Loading stream...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center">
                                <FaExclamationTriangle className="mb-2 text-4xl text-yellow-400" />
                                <p className="text-white">{error}</p>
                            </div>
                        ) : streamUrl ? (
                            <video
                                key={streamUrl}
                                controls
                                autoPlay
                                playsInline
                                muted
                                className="object-contain w-full h-full"
                            >
                                <source src={streamUrl} type="application/x-mpegURL" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <FaExclamationTriangle className="mb-2 text-4xl text-yellow-400" />
                                <p className="text-white">No stream available</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Camera info section */}
                    <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                        <div className="p-3 bg-gray-100 rounded-md">
                            <h3 className="mb-2 text-sm font-medium text-gray-700">Camera Details</h3>
                            <dl className="space-y-1">
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">ID:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.id}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Network ID:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.network_id || 'N/A'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Status:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.status}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Host:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.host || 'N/A'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Port:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.port || 'N/A'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">MAC:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.mac || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                        
                        <div className="p-3 bg-gray-100 rounded-md">
                            <h3 className="mb-2 text-sm font-medium text-gray-700">Stream Info</h3>
                            <dl className="space-y-1">
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Cloud Stream:</dt>
                                    <dd className="text-xs text-gray-900">{hasCloudStream() ? 'Available' : 'Not available'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Local Stream:</dt>
                                    <dd className="text-xs text-gray-900">{hasLocalStream() ? 'Available' : 'Not available'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Type:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.is_virtual ? 'Virtual' : 'Physical'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Detection:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.detectionEnabled ? 'Enabled' : 'Disabled'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">Stream Path:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.streamInputPath || 'N/A'}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-1/3 text-xs font-medium text-gray-500">ONVIF Port:</dt>
                                    <dd className="text-xs text-gray-900">{activeCamera?.onvifPort || 'N/A'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewCameraModal;