import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface ClassificationStreamProps {
    isActive: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
    onError: (error: string) => void;
    serverUrl: string;
}

const ClassificationStream: React.FC<ClassificationStreamProps> = ({
    isActive,
    onConnect,
    onDisconnect,
    onError,
    serverUrl
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const socketRef = useRef<any>(null);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef<boolean>(true);
    const connectionAttemptRef = useRef<boolean>(false);

    // ✅ PERFORMANCE: Canvas for better rendering
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // ✅ PERFORMANCE: Frame buffer management
    const frameBufferRef = useRef<string[]>([]);
    const currentFrameIndexRef = useRef<number>(0);
    const renderingRef = useRef<boolean>(false);

    // ✅ STABLE STATE - Minimal re-renders
    const [connected, setConnected] = useState<boolean>(false);
    const [fps, setFps] = useState<number>(0);
    const [frameCount, setFrameCount] = useState<number>(0);

    // ✅ FPS tracking with refs
    const frameCountRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(Date.now());
    const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // ✅ PERFORMANCE: Memoized socket options
    const socketOptions = useMemo(() => ({
        transports: ['websocket'],
        timeout: 15000,
        forceNew: true,
        reconnection: false,
        autoConnect: true,
        upgrade: false,
        rememberUpgrade: false
    }), []);

    // ✅ PERFORMANCE: Optimized canvas setup
    const setupCanvas = useCallback(() => {
        if (canvasRef.current && !contextRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', {
                alpha: false,
                desynchronized: true,
                willReadFrequently: false
            });

            if (context) {
                contextRef.current = context;
                // Set canvas size
                canvas.width = 640;
                canvas.height = 480;

                // Optimize rendering
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
            }
        }
    }, []);

    // ✅ PERFORMANCE: Optimized frame rendering with RAF
    const renderFrame = useCallback(() => {
        if (!contextRef.current || !canvasRef.current || frameBufferRef.current.length === 0) {
            return;
        }

        const currentFrame = frameBufferRef.current[currentFrameIndexRef.current];
        if (!currentFrame || renderingRef.current) return;

        renderingRef.current = true;

        const img = new Image();
        img.onload = () => {
            if (contextRef.current && canvasRef.current && mountedRef.current) {
                const canvas = canvasRef.current;
                const context = contextRef.current;

                // Clear and draw
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);

                frameCountRef.current++;

                // Move to next frame
                currentFrameIndexRef.current = (currentFrameIndexRef.current + 1) % frameBufferRef.current.length;
            }
            renderingRef.current = false;
        };

        img.onerror = () => {
            renderingRef.current = false;
        };

        img.src = `data:image/jpeg;base64,${currentFrame}`;
    }, []);

    // ✅ PERFORMANCE: Animation loop for smooth rendering
    const startAnimationLoop = useCallback(() => {
        const animate = () => {
            if (mountedRef.current && connected && frameBufferRef.current.length > 0) {
                renderFrame();
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [connected, renderFrame]);

    // ✅ PERFORMANCE: Optimized disconnect function
    const disconnectFromClassificationStream = useCallback(() => {
        console.log('🔌 Disconnecting classification stream...');

        // Clear animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Clear intervals
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (fpsIntervalRef.current) {
            clearInterval(fpsIntervalRef.current);
            fpsIntervalRef.current = null;
        }

        // Clear frame buffer
        frameBufferRef.current = [];
        currentFrameIndexRef.current = 0;
        renderingRef.current = false;

        // Close socket
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        connectionAttemptRef.current = false;

        if (mountedRef.current) {
            setConnected(false);
            setFps(0);
            setFrameCount(0);
        }
    }, []);

    // ✅ PERFORMANCE: Throttled frame requests
    const startFrameRequests = useCallback(() => {
        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
        }

        frameIntervalRef.current = setInterval(() => {
            if (socketRef.current?.connected && mountedRef.current) {
                socketRef.current.emit('request_frame');
            }
        }, 33); // ✅ 30 FPS - smooth but not overwhelming
    }, []);

    // ✅ PERFORMANCE: Optimized FPS counter
    const startFPSCounter = useCallback(() => {
        if (fpsIntervalRef.current) {
            clearInterval(fpsIntervalRef.current);
        }

        fpsIntervalRef.current = setInterval(() => {
            if (!mountedRef.current) return;

            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTimeRef.current) / 1000;

            if (timeDiff > 0) {
                const calculatedFps = Math.round(frameCountRef.current / timeDiff);
                setFps(calculatedFps);

                // Update frame count less frequently
                setFrameCount(prev => prev + frameCountRef.current);
            }

            frameCountRef.current = 0;
            lastTimeRef.current = currentTime;
        }, 1000); // ✅ Update every second
    }, []);

    // ✅ PERFORMANCE: Optimized connection with debouncing
    const connectToClassificationStream = useCallback(async () => {
        if (connectionAttemptRef.current) {
            console.log('⚠️ Connection already in progress, skipping...');
            return;
        }

        console.log('🔄 Starting classification stream connection...');
        connectionAttemptRef.current = true;

        // Setup canvas first
        setupCanvas();

        // Cleanup existing connection
        disconnectFromClassificationStream();

        // Wait before connecting
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!mountedRef.current) {
            connectionAttemptRef.current = false;
            return;
        }

        try {
            const { io } = await import('socket.io-client');

            socketRef.current = io(serverUrl, socketOptions);

            socketRef.current.on('connect', () => {
                if (!mountedRef.current) return;

                console.log('✅ Classification stream connected');
                setConnected(true);
                onConnect();
                startFrameRequests();
                startFPSCounter();
                startAnimationLoop();
                connectionAttemptRef.current = false;
            });

            socketRef.current.on('disconnect', (reason: string) => {
                if (!mountedRef.current) return;

                console.log('🔌 Classification stream disconnected:', reason);
                setConnected(false);
                onDisconnect();
                connectionAttemptRef.current = false;
            });

            socketRef.current.on('connect_error', (error: any) => {
                if (!mountedRef.current) return;

                console.error('❌ Classification connection error:', error);
                onError(error.message || 'Connection failed');
                setConnected(false);
                connectionAttemptRef.current = false;
            });

            // ✅ PERFORMANCE: Optimized frame handling with buffering
            socketRef.current.on('frame_update', (data: any) => {
                if (!mountedRef.current || !data?.image) return;

                try {
                    if (typeof data.image === 'string' && data.image.length > 100) {
                        // Add to frame buffer (keep only last 3 frames)
                        frameBufferRef.current.push(data.image);
                        if (frameBufferRef.current.length > 3) {
                            frameBufferRef.current.shift();
                        }

                        // Reset index if needed
                        if (currentFrameIndexRef.current >= frameBufferRef.current.length) {
                            currentFrameIndexRef.current = 0;
                        }
                    }
                } catch (error) {
                    console.error('Frame processing error:', error);
                }
            });

        } catch (error: any) {
            console.error('❌ Failed to connect to classification stream:', error);
            connectionAttemptRef.current = false;
            if (mountedRef.current) {
                onError(error.message || 'Failed to connect');
            }
        }
    }, [serverUrl, onConnect, onDisconnect, onError, socketOptions, setupCanvas, disconnectFromClassificationStream, startFrameRequests, startFPSCounter, startAnimationLoop]);

    // ✅ PERFORMANCE: Main effect with debouncing
    useEffect(() => {
        if (isActive && !connected && !connectionAttemptRef.current) {
            const timeoutId = setTimeout(() => {
                if (mountedRef.current && isActive) {
                    connectToClassificationStream();
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        } else if (!isActive && connected) {
            disconnectFromClassificationStream();
        }
    }, [isActive, connected, connectToClassificationStream, disconnectFromClassificationStream]);

    // ✅ Setup canvas on mount
    useEffect(() => {
        setupCanvas();
    }, [setupCanvas]);

    // ✅ Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            console.log('🧹 Classification stream component unmounting...');
            mountedRef.current = false;
            disconnectFromClassificationStream();
        };
    }, [disconnectFromClassificationStream]);

    // ✅ PERFORMANCE: Memoized status indicators
    const statusIndicator = useMemo(() => (
        <div className={`absolute px-3 py-1 rounded-lg top-4 left-4 transition-colors duration-300 ${connected ? 'bg-green-500/90' : 'bg-red-500/90'
            }`}>
            <div className="flex items-center gap-2 text-sm font-medium text-white">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-white animate-pulse' : 'bg-gray-300'
                    }`}></div>
                <span>
                    {connected ? 'Classification Active' :
                        connectionAttemptRef.current ? 'Connecting...' : 'Disconnected'}
                </span>
            </div>
        </div>
    ), [connected]);

    const statsDisplay = useMemo(() => (
        <div className="absolute px-2 py-1 text-xs text-white rounded top-4 right-4 bg-black/70">
            <div>FPS: {fps}</div>
            <div>Frames: {frameCount}</div>
            <div className={`${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? '● LIVE' : '● OFFLINE'}
            </div>
        </div>
    ), [fps, frameCount, connected]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* ✅ PERFORMANCE: Use Canvas instead of IMG for better control */}
            <canvas
                ref={canvasRef}
                className="object-fill w-full h-full"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    imageRendering: 'auto'
                }}
            />

            {/* ✅ Fallback IMG (hidden) for compatibility */}
            <img
                ref={imgRef}
                alt="Object Classification Feed"
                className="hidden"
            />

            {statusIndicator}
            {statsDisplay}

            {/* ✅ Stream Type */}
            <div className="absolute px-2 py-1 text-xs text-white rounded bottom-4 right-4 bg-black/70">
                Socket.IO • YOLO Detection • Canvas Rendering
            </div>

            {/* ✅ Loading overlay */}
            {!connected && connectionAttemptRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                        <div className="w-8 h-8 mx-auto mb-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                        <div>Connecting to Classification Stream...</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ClassificationStream);