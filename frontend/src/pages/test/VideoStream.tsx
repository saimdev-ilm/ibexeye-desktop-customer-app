import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

// Type definitions
interface FrameData {
    image: string;
}

const VideoStream: React.FC = () => {
    // State to hold the current image source
    const [imageSrc, setImageSrc] = useState<string>('');
    // State to hold the FPS
    const [fps, setFps] = useState<string | number>('--');
    // State for connection status
    const [connected, setConnected] = useState<boolean>(false);
    const [connecting, setConnecting] = useState<boolean>(false);
    // Ref for the Socket.IO instance
    const socketRef = useRef<Socket | null>(null);

    // FPS calculation variables
    const frameCountRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(Date.now());
    const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fpsCounterInterval = useRef<NodeJS.Timeout | null>(null);

    // Image rendering optimization
    const isRenderingRef = useRef<boolean>(false);
    const lastFrameTimeRef = useRef<number>(0);
    const frameSkipThreshold = 33; // Skip frames if coming faster than 30fps

    // Replace with your Flask server's address
    const FLASK_SERVER_URL = 'http://192.168.1.138:5002';

    useEffect(() => {
        // Initialize Socket.IO connection
        socketRef.current = io(FLASK_SERVER_URL, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        setConnecting(true);

        // Event listener for connection
        socketRef.current.on('connect', () => {
            console.log('Connected to Flask Socket.IO server from React');
            setConnected(true);
            setConnecting(false);

            // Request frames every 33ms (30 FPS max) - reduced from 50ms for better performance
            fpsIntervalRef.current = setInterval(() => {
                if (socketRef.current?.connected) {
                    socketRef.current.emit('request_frame');
                }
            }, 33);

            // Start local FPS counter
            startFPSCounter();
        });

        // Event listener for disconnection
        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from Flask Socket.IO server from React');
            setConnected(false);
            setConnecting(false);

            if (fpsIntervalRef.current) {
                clearInterval(fpsIntervalRef.current);
            }
            if (fpsCounterInterval.current) {
                clearInterval(fpsCounterInterval.current);
            }
            setFps('--');
            setImageSrc(''); // Clear image on disconnect
        });

        // Event listener for connection errors
        socketRef.current.on('connect_error', (error: Error) => {
            console.error('Socket.IO connection error:', error);
            setConnected(false);
            setConnecting(false);
        });

        // Event listener for 'frame_update' with optimization
        socketRef.current.on('frame_update', (data: FrameData) => {
            if (data && data.image) {
                const currentTime = Date.now();

                // Skip frame if we're still processing the previous one or if frames are coming too fast
                if (isRenderingRef.current || (currentTime - lastFrameTimeRef.current) < frameSkipThreshold) {
                    return;
                }

                isRenderingRef.current = true;
                lastFrameTimeRef.current = currentTime;

                // Use requestAnimationFrame for smoother rendering
                requestAnimationFrame(() => {
                    setImageSrc(`data:image/jpeg;base64,${data.image}`);
                    frameCountRef.current++;
                    isRenderingRef.current = false;
                });
            }
        });

        // Cleanup function for when the component unmounts
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (fpsIntervalRef.current) {
                clearInterval(fpsIntervalRef.current);
            }
            if (fpsCounterInterval.current) {
                clearInterval(fpsCounterInterval.current);
            }
        };
    }, []);

    // Local FPS calculation function
    const startFPSCounter = (): void => {
        fpsCounterInterval.current = setInterval(() => {
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTimeRef.current) / 1000;
            const calculatedFps = Math.round(frameCountRef.current / timeDiff);

            setFps(calculatedFps);

            frameCountRef.current = 0;
            lastTimeRef.current = currentTime;
        }, 1000);
    };

    // Manual connect/disconnect functions
    const handleConnect = () => {
        if (!connected && !connecting) {
            setConnecting(true);
            socketRef.current?.connect();
        }
    };

    const handleDisconnect = () => {
        if (connected) {
            socketRef.current?.disconnect();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            {/* Header with controls */}
            <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-green-400">YOLOv8 Person Detection Stream</h2>

                <div className="flex items-center gap-4">
                    {/* Connection controls */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleConnect}
                            disabled={connected || connecting}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {connecting ? 'Connecting...' : 'Connect'}
                        </button>
                        <button
                            onClick={handleDisconnect}
                            disabled={!connected}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Disconnect
                        </button>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : connecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className="text-white">
                                {connecting ? 'Connecting' : connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className="text-white">
                            <span className="text-gray-400">FPS:</span> <span className="font-bold text-green-400">{fps}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video content area */}
            <div className="flex items-center justify-center flex-1 p-6">
                <div className="relative w-full max-w-6xl h-full max-h-[80vh] bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Person Detection Stream"
                            className="object-contain w-full h-full"
                            style={{ imageRendering: 'auto' }}
                            onError={() => console.log("Error loading image frame")}
                            onLoad={() => {
                                // Reset rendering flag when image loads
                                isRenderingRef.current = false;
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            {connecting ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-green-400 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="text-lg text-green-400">Connecting to stream...</div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="mb-4 text-6xl text-gray-600">📹</div>
                                    <div className="text-lg text-gray-400">No Signal</div>
                                    <div className="mt-2 text-sm text-gray-500">Click Connect to start streaming</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Overlay info */}
                    {imageSrc && (
                        <div className="absolute px-3 py-2 text-white rounded-lg top-4 left-4 bg-black/70">
                            <div className="text-sm">
                                <div>FPS: <span className="font-bold text-green-400">{fps}</span></div>
                                <div>Status: <span className={`font-bold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                                    {connected ? 'Live' : 'Offline'}
                                </span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer info */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
                <div className="text-sm text-center text-gray-400">
                    Server: <span className="font-mono text-white">{FLASK_SERVER_URL}</span>
                </div>
            </div>
        </div>
    );
};

export default VideoStream;