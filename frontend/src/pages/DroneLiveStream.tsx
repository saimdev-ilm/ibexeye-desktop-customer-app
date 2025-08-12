import { useEffect, useRef, useState } from 'react';
import VideoWebSocketClient from '../services/VideoWebSocketClient';

interface DroneLiveStreamProps {
    serverAddress: string;
    autoConnect?: boolean;
    onStatusChange?: (status: StreamStatus) => void;
}

interface StreamStatus {
    connected: boolean;
    connecting: boolean;
    framesReceived: number;
    resolution: string;
    fps: number;
    dataRate: number;
    frameSize: number;
    latency: number;
}

const DroneLiveStream: React.FC<DroneLiveStreamProps> = ({
    serverAddress,
    autoConnect = false,
    onStatusChange,
}) => {
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoClientRef = useRef<VideoWebSocketClient | null>(null);
    const connectionAttemptRef = useRef<boolean>(false);

    // State
    const [connected, setConnected] = useState<boolean>(false);
    const [connecting, setConnecting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showError, setShowError] = useState<boolean>(false);
    const [, setStats] = useState<StreamStatus>({
        connected: false,
        connecting: false,
        framesReceived: 0,
        resolution: '-',
        fps: 0,
        dataRate: 0,
        frameSize: 0,
        latency: 0,
    });

    // Draw "No Signal" pattern
    const drawNoSignal = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw static noise
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2 + 1;
            ctx.fillRect(x, y, size, size);
        }

        // Draw "NO SIGNAL" text
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NO SIGNAL', canvas.width / 2, canvas.height / 2);
    };

    const isRenderingRef = useRef(false);

    const processFrame = async (data: ArrayBuffer) => {
        if (isRenderingRef.current) {
            return;
        }
        isRenderingRef.current = true;

        const canvas = canvasRef.current;
        if (!canvas) {
            isRenderingRef.current = false;
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            isRenderingRef.current = false;
            return;
        }

        try {
            const bitmap = await createImageBitmap(new Blob([data], { type: 'image/jpeg' }));

            if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;

                if (videoClientRef.current) {
                    videoClientRef.current.setResolution(bitmap.width, bitmap.height);
                }

                setStats(prev => ({
                    ...prev,
                    resolution: `${bitmap.width} × ${bitmap.height}`,
                }));
            }

            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
        } catch (error) {
            console.error('Error processing frame:', error);
        } finally {
            isRenderingRef.current = false;
        }
    };

    // Show error message
    const showErrorMessage = (message: string) => {
        setError(message);
        setShowError(true);
        setTimeout(() => {
            setShowError(false);
        }, 5000);
    };

    // Connect to WebSocket server
    const connect = async () => {
        // Prevent multiple connection attempts
        if (connected || connecting || connectionAttemptRef.current) {
            console.log("Video stream: Already connected, connecting, or connection in progress");
            return;
        }

        connectionAttemptRef.current = true;
        setConnecting(true);

        console.log(`Video stream: Attempting to connect to ${serverAddress}`);

        try {
            // Always create a new client to avoid state issues
            if (videoClientRef.current) {
                videoClientRef.current.disconnect();
                videoClientRef.current = null;
            }

            videoClientRef.current = new VideoWebSocketClient(serverAddress, {
                onConnect: () => {
                    console.log("Video stream: Connection established");
                    setConnected(true);
                    setConnecting(false);
                    connectionAttemptRef.current = false;
                    updateStats({ connected: true, connecting: false });
                },
                onDisconnect: () => {
                    console.log("Video stream: Connection disconnected");
                    setConnected(false);
                    setConnecting(false);
                    connectionAttemptRef.current = false;
                    updateStats({ connected: false, connecting: false });
                    drawNoSignal();
                },
                onError: (error) => {
                    console.error("Video stream: Connection error", error);
                    setConnecting(false);
                    connectionAttemptRef.current = false;
                    showErrorMessage(error.message || 'Connection error');
                },
                onFrame: (frameData) => {
                    processFrame(frameData);
                },
                onStats: (videoStats) => {
                    updateStats({
                        connected,
                        connecting,
                        framesReceived: videoStats.framesReceived,
                        resolution: videoStats.resolution,
                        fps: videoStats.fps,
                        dataRate: videoStats.dataRate,
                        frameSize: videoStats.frameSize,
                        latency: videoStats.latency
                    });
                }
            });

            await videoClientRef.current.connect();
        } catch (error: unknown) {
            console.error("Video stream: Failed to connect", error);
            setConnecting(false);
            connectionAttemptRef.current = false;
            if (error instanceof Error) {
                showErrorMessage(error.message || 'Failed to connect');
            } else {
                showErrorMessage('Failed to connect');
            }
        }
    };

    // Disconnect from WebSocket server
    const disconnect = () => {
        console.log("Video stream: Disconnecting");
        if (videoClientRef.current) {
            videoClientRef.current.disconnect();
            videoClientRef.current = null;
        }

        setConnected(false);
        setConnecting(false);
        connectionAttemptRef.current = false;
        updateStats({ connected: false, connecting: false });
        drawNoSignal();
    };

    // Update stats and notify parent component if callback provided
    const updateStats = (newStats: Partial<StreamStatus>) => {
        setStats(prev => {
            const updated = { ...prev, ...newStats };
            if (onStatusChange) {
                onStatusChange(updated);
            }
            return updated;
        });
    };

    // Set up canvas
    useEffect(() => {
        console.log("Video stream: Component mounted");
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = 640;
            canvas.height = 480;
            drawNoSignal();
        }

        return () => {
            console.log("Video stream: Component unmounting, cleaning up");
            if (videoClientRef.current) {
                videoClientRef.current.disconnect();
                videoClientRef.current = null;
            }
            connectionAttemptRef.current = false;
        };
    }, []);

    // Handle autoConnect changes
    useEffect(() => {
        console.log(`Video stream: autoConnect changed to ${autoConnect}, serverAddress: ${serverAddress}`);

        if (autoConnect && serverAddress && !connected && !connecting && !connectionAttemptRef.current) {
            console.log("Video stream: Auto-connecting...");
            const timer = setTimeout(() => {
                connect();
            }, 1000); // Delay to ensure parent component is ready

            return () => clearTimeout(timer);
        } else if (!autoConnect && (connected || connecting)) {
            console.log("Video stream: Auto-connect disabled, disconnecting...");
            disconnect();
        }
    }, [autoConnect, serverAddress]);

    // Handle server address changes when already connected
    useEffect(() => {
        if (connected && videoClientRef.current && serverAddress &&
            videoClientRef.current.getUrl() !== serverAddress) {
            console.log(`Video stream: Server address changed, reconnecting to ${serverAddress}`);
            disconnect();
            const reconnectTimer = setTimeout(() => {
                if (autoConnect) {
                    connect();
                }
            }, 1000);
            return () => clearTimeout(reconnectTimer);
        }
    }, [serverAddress]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black rounded-b-2xl">
            {/* Canvas for video rendering */}
            <canvas ref={canvasRef} className="w-full h-full bg-black" />

            {/* No Signal overlay */}
            {!connected && !connecting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-2xl font-bold text-white bg-black/80">
                    No Signal
                </div>
            )}

            {/* Connecting overlay */}
            {connecting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center text-2xl font-bold text-white bg-black/80">
                    Connecting <div className="w-5 h-5 ml-2 border-t-2 border-white rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error message popup */}
            {showError && (
                <div className="absolute z-20 px-4 py-2 text-white transform -translate-x-1/2 rounded top-4 left-1/2 bg-red-500/90">
                    {error}
                </div>
            )}
        </div>
    );
};

export default DroneLiveStream;