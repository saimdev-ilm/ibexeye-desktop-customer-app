import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaChevronLeft, FaSave, FaTrash, FaUndo, FaCheck, FaTimes, FaInfoCircle,
  FaBell, FaBellSlash, FaCamera, FaSync, FaImage, FaExclamationTriangle
} from "react-icons/fa";
import { getCameraById, Camera } from '../services/cameraService';
import { saveROI, getDetectionStatus, enableDetection, disableDetection, getCameraFrame } from '../services/roiService';
import HlsPlayer from "react-hls-player";
import ToastNotification from '../components/ToastNotification';

// Define ROI Zone interface
interface Zone {
  width: number;
  height: number;
  startX?: number;
  startY?: number;
  centerX: number;
  centerY: number;
  color: string;
}

// Define ROI Configuration interface


const ROIEditor: React.FC = () => {
  const { cameraId } = useParams<{ cameraId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement>(null);

  // State variables
  const [camera, setCamera] = useState<Camera | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [frameWidth, setFrameWidth] = useState<number>(0);
  const [frameHeight, setFrameHeight] = useState<number>(0);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [networkId, setNetworkId] = useState<string | undefined>(undefined);
  const [detectionEnabled, setDetectionEnabled] = useState<boolean>(false);
  const [isTogglingDetection, setIsTogglingDetection] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(1000);
  const [blur, setBlur] = useState<number>(20);
  const [morphology, setMorphology] = useState<number>(20);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'detection-enabled' | 'detection-disabled';
  }>({
    show: false,
    message: '',
    type: 'info'
  });



  // Zone colors
  const zoneColors = [
    '#FF0000',   // Red
    '#00FF00',   // Green
    '#0000FF',   // Blue
    '#FFFF00',   // Yellow
    '#FF00FF',   // Magenta
    '#00FFFF',   // Cyan
  ];

  // Load camera data and initialize canvas
  useEffect(() => {
    const loadCameraData = async () => {
      if (!cameraId) {
        setError("No camera ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Loading camera with ID:", cameraId);
        const cameraData = await getCameraById(cameraId);
        if (!cameraData) {
          throw new Error("Camera not found");
        }

        console.log("Camera data loaded:", cameraData);
        setCamera(cameraData);

        // Set the network_id from camera data - this is what we need for ROI operations
        if (cameraData.network_id) {
          const networkIdToUse = cameraData.network_id;
          setNetworkId(networkIdToUse);
          console.log("Set network_id:", networkIdToUse);

          // Fetch existing ROI configuration using network_id
          try {
            const roiStatus = await getDetectionStatus(networkIdToUse);
            console.log("ROI status loaded:", roiStatus);

            // Set detection status
            if (roiStatus && roiStatus.enabled !== undefined) {
              setDetectionEnabled(roiStatus.enabled);
            }

            // Set configuration parameters if they exist
            if (roiStatus && roiStatus.config) {
              if (roiStatus.config.sensitivity !== undefined) {
                setSensitivity(roiStatus.config.sensitivity);
              }
              if (roiStatus.config.blur !== undefined) {
                setBlur(roiStatus.config.blur);
              }
              if (roiStatus.config.morphology !== undefined) {
                setMorphology(roiStatus.config.morphology);
              }
            }

            // If ROIs exist, convert them to our Zone format
            if (roiStatus && roiStatus.config && roiStatus.config.rois && roiStatus.config.rois.length > 0 &&
              roiStatus.config.rois[0][0] !== 0) { // Ignore default empty ROI
              const existingZones = roiStatus.config.rois.map((roi: any, index: number) => {
                const [width, height, [centerX, centerY]] = roi;

                return {
                  width: width,
                  height: height,
                  centerX: centerX,
                  centerY: centerY,
                  color: zoneColors[index % zoneColors.length],
                };
              });

              setZones(existingZones);
              console.log("Converted existing ROIs to zones:", existingZones);
            }
          } catch (roiErr) {
            console.warn("Couldn't load existing ROIs:", roiErr);
          }
        } else {
          console.warn("Camera has no network_id, ROI operations may fail");
        }
      } catch (err) {
        console.error("Failed to load camera:", err);
        setError(`Failed to load camera data: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    loadCameraData();
  }, [cameraId]);

  // Initialize canvas on video loaded and set up canvas overlay
  const handleVideoLoad = () => {
    if (!playerRef.current || !canvasRef.current || !containerRef.current) return;

    const video = playerRef.current;
    const canvas = canvasRef.current;

    // Wait until video has metadata
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      const checkDimensions = setInterval(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          clearInterval(checkDimensions);
          setupCanvas();
        }
      }, 200);
      return;
    }

    function setupCanvas() {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Update state
      setFrameWidth(canvas.width);
      setFrameHeight(canvas.height);
      setVideoLoaded(true);

      // Position canvas overlay on top of video
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'auto';

      console.log("Canvas initialized with dimensions:", canvas.width, canvas.height);
    }

    setupCanvas();
  };

  // Handle video size change (e.g., on window resize)
  useEffect(() => {
    const handleResize = () => {
      if (videoLoaded && playerRef.current && canvasRef.current) {
        // Update canvas size to match video container
        const video = playerRef.current;
        const canvas = canvasRef.current;

        // Keep the canvas exactly aligned with the video
        const videoRect = video.getBoundingClientRect();
        canvas.style.width = `${videoRect.width}px`;
        canvas.style.height = `${videoRect.height}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [videoLoaded]);

  // Redraw the canvas when zones change
  useEffect(() => {
    if (!canvasRef.current || !videoLoaded) return;

    const drawCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all zones
      zones.forEach((zone, index) => {
        drawZone(ctx, zone, index);
      });

      // Draw the current zone being created
      if (isDrawing && currentZone) {
        drawZone(ctx, currentZone, -1, true);
      }
    };

    drawCanvas();

    // Set up animation frame for continuous drawing
    const animationId = requestAnimationFrame(drawCanvas);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [zones, currentZone, isDrawing, videoLoaded]);

  // Hide instructions after 10 seconds
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [showInstructions]);

  // Handle status messages auto-hide
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Draw a zone on the canvas
  const drawZone = (
    ctx: CanvasRenderingContext2D,
    zone: Zone,
    index: number,
    isDrawing = false
  ) => {
    const left = zone.centerX - zone.width / 2;
    const top = zone.centerY - zone.height / 2;

    // Set styles based on whether this is a current or saved zone
    ctx.strokeStyle = isDrawing ? '#FFFFFF' : zone.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = isDrawing
      ? 'rgba(255, 255, 255, 0.2)'
      : `${zone.color}20`; // 20 is hex for 12% opacity

    // Draw rectangle
    ctx.beginPath();
    ctx.rect(left, top, zone.width, zone.height);
    ctx.stroke();
    ctx.fill();

    // Label for saved zones
    if (!isDrawing && index >= 0) {
      ctx.fillStyle = zone.color;
      ctx.font = '12px Arial';
      ctx.fillRect(left, top - 20, 70, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Region ${index + 1}`, left + 5, top - 5);
    }
  };

  // Handle mouse down to start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to canvas
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      console.log("Mouse down at:", { x, y });

      setIsDrawing(true);
      setCurrentZone({
        startX: x,
        startY: y,
        centerX: x,
        centerY: y,
        width: 0,
        height: 0,
        color: zoneColors[zones.length % zoneColors.length]
      });
    }
  };

  // Handle mouse move to update drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && currentZone && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Calculate position relative to canvas
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      // Calculate dimensions
      const width = Math.abs(x - (currentZone.startX || 0));
      const height = Math.abs(y - (currentZone.startY || 0));

      // Calculate center
      const minX = Math.min(x, currentZone.startX || 0);
      const minY = Math.min(y, currentZone.startY || 0);
      const centerX = minX + width / 2;
      const centerY = minY + height / 2;

      // Update current zone
      setCurrentZone({
        ...currentZone,
        width,
        height,
        centerX,
        centerY
      });
    }
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = () => {
    if (isDrawing && currentZone) {
      // Only add zone if it has a minimum size
      if (currentZone.width > 10 && currentZone.height > 10) {
        console.log("Zone drawing completed:", currentZone);
        setShowConfirmation(true);
      } else {
        // Zone too small, cancel drawing
        console.log("Zone too small, canceling");
        cancelDrawing();
      }
    }
  };

  // Capture a single frame from the camera's stream
  const captureFrame = async () => {
    if (!networkId) {
      alert('Cannot capture frame: Network ID is missing for this camera');
      return;
    }

    setLoadingSnapshot(true);
    setSnapshot(null);

    try {
      // Attempt to get a frame from the API
      const frameData = await getCameraFrame(networkId);

      if (frameData && frameData.image_data) {
        // Convert base64 to image and display
        const imageUrl = `data:image/jpeg;base64,${frameData.image_data}`;
        setSnapshot(imageUrl);

        // If we have a snapshot canvas, draw the image on it
        if (snapshotCanvasRef.current) {
          const canvas = snapshotCanvasRef.current;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const img = new Image();
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);

              // Now draw the zones on top
              zones.forEach((zone, index) => {
                drawZone(ctx, zone, index);
              });
            };
            img.src = imageUrl;
          }
        }

        setStatusMessage("Frame captured successfully");
      } else {
        throw new Error("Failed to get frame data");
      }
    } catch (error) {
      console.error("Error capturing frame:", error);
      setStatusMessage("Failed to capture frame");

      // Fallback: If API fails, try to capture from video element
      if (playerRef.current && videoLoaded) {
        try {
          const video = playerRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setSnapshot(dataUrl);
            setStatusMessage("Frame captured from stream");
          }
        } catch (captureError) {
          console.error("Error in fallback capture:", captureError);
        }
      }
    } finally {
      setLoadingSnapshot(false);
    }
  };

  // Confirm the drawn zone
  const confirmZone = () => {
    if (currentZone && currentZone.width > 10 && currentZone.height > 10) {
      console.log("Zone confirmed:", currentZone);
      setZones([...zones, currentZone]);
      setIsDrawing(false);
      setCurrentZone(null);
      setShowConfirmation(false);
    }
  };

  // Cancel drawing
  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentZone(null);
    setShowConfirmation(false);
  };

  // Delete a zone
  const deleteZone = (index: number) => {
    const updatedZones = [...zones];
    updatedZones.splice(index, 1);
    console.log(`Deleted zone ${index}. Remaining zones:`, updatedZones);
    setZones(updatedZones);
  };

 

  // Save all zones to the backend
  const saveZones = async () => {
    if (!networkId) {
      alert('Cannot save: Network ID is missing for this camera');
      return;
    }

    if (zones.length === 0) {
      if (confirm('No regions defined. Do you want to clear existing ROI configuration?')) {
        // Continue with empty zones to clear configuration
      } else {
        return;
      }
    }

    setIsSaving(true);

    try {
      // Convert zones to the format expected by the API
      const rois: [number, number, [number, number], number, number][] = zones.map(zone => {
        const width = Math.round(zone.width);
        const height = Math.round(zone.height);
        const centerX = Math.round(zone.centerX);
        const centerY = Math.round(zone.centerY);

        return [width, height, [centerX, centerY], frameWidth, frameHeight];
      });

      console.log(`Saving normalized zones for network_id ${networkId}:`, rois);

      // Call the API to save ROIs using network_id instead of cameraId
      await saveROI(
        networkId,
        rois,
        sensitivity,
        blur,
        morphology
      );

      // Show success message or redirect
      setStatusMessage('Regions of Interest saved successfully!');

      // Enable detection if zones were defined and saved
      if (!detectionEnabled && zones.length > 0) {
        try {
          await enableDetection(networkId);
          setDetectionEnabled(true);
          console.log(`Detection enabled for network_id ${networkId}`);
          setStatusMessage('ROIs saved and detection enabled!');
        } catch (error) {
          console.warn(`Warning: Could not automatically enable detection: ${error}`);
        }
      }

      // Delay redirect to show success message
      setTimeout(() => {
        navigate('/rOIManager');
      }, 1500);

    } catch (error) {
      console.error('Error saving zones:', error);
      alert('Failed to save zones: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  };


  const toggleDetection = async () => {
    if (!networkId) {
      // Show error toast instead of alert
      setToast({
        show: true,
        message: 'Cannot toggle detection: Network ID is missing for this camera',
        type: 'error'
      });
      return;
    }

    setIsTogglingDetection(true);

    try {
      if (detectionEnabled) {
        await disableDetection(networkId);
        setDetectionEnabled(false);
        // Use toast instead of status message
        setToast({
          show: true,
          message: "Detection disabled",
          type: 'detection-disabled'
        });
      } else {
        await enableDetection(networkId);
        setDetectionEnabled(true);
        // Use toast instead of status message
        setToast({
          show: true,
          message: "Detection enabled",
          type: 'detection-enabled'
        });
      }

      console.log(`Detection ${detectionEnabled ? 'disabled' : 'enabled'} for network_id ${networkId}`);
    } catch (error) {
      console.error(`Error toggling detection for network_id ${networkId}:`, error);
      // Show error toast instead of alert
      setToast({
        show: true,
        message: `Failed to ${detectionEnabled ? 'disable' : 'enable'} detection: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    } finally {
      setIsTogglingDetection(false);
    }
  };

  // Helper function to close the toast
  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };




  return (
    <div className="flex flex-col w-full h-full bg-gray-100">
      <ToastNotification
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
        duration={3000}
      />
      <header className="flex items-center justify-between px-4 py-3 mb-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <button
            title="Back to ROI Manager"
            onClick={() => navigate('/rOIManager')}
            className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800">
            ROI Editor: {camera?.name || 'Loading...'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <div className="px-3 py-1 text-sm text-white bg-green-600 rounded-md">{statusMessage}</div>
          )}
          {networkId && (
            <button
              onClick={toggleDetection}
              disabled={isTogglingDetection}
              className={`px-3 py-1 text-sm text-white rounded-md ${isTogglingDetection
                ? 'bg-gray-400 cursor-wait'
                : detectionEnabled
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                }`}
            >
              {isTogglingDetection
                ? 'Updating...'
                : detectionEnabled
                  ? 'Disable Detection'
                  : 'Enable Detection'
              }
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-600">Loading camera data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <FaExclamationTriangle size={32} className="mb-4 text-yellow-500" />
          <p className="mb-4 text-lg text-red-500">{error}</p>
          <button
            onClick={() => navigate('/rOIManager')}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to ROI Manager
          </button>
        </div>
      ) : (
        <div className="container p-4 mx-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Panel - Video and Drawing Surface */}
            <div className="col-span-2">
              {/* Instructions */}
              {showInstructions && (
                <div className="p-4 mb-4 text-white bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">How to use the ROI Editor</h3>
                    <button
                      className="text-gray-300 hover:text-white"
                      onClick={() => setShowInstructions(false)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <ul className="ml-5 space-y-1 list-disc">
                    <li>Click and drag on the video to draw a region of interest</li>
                    <li>Confirm or cancel the region after drawing</li>
                    <li>Add multiple regions as needed</li>
                    <li>Delete any unwanted regions</li>
                    <li>Adjust detection parameters if needed</li>
                    <li>Click Save when finished</li>
                  </ul>
                </div>
              )}

              {/* Video and Canvas Container */}
              <div ref={containerRef} className="relative overflow-hidden bg-black rounded-lg shadow-lg aspect-video">
                {/* Video Stream */}
                {camera?.cloudHls ? (
                  <>
                    <HlsPlayer
                      src={camera.cloudHls}
                      autoPlay
                      controls={false}
                      muted
                      playerRef={playerRef}
                      className="object-contain w-full h-full"
                      onLoadedData={handleVideoLoad}
                      onError={(err) => console.error(`HLS Error:`, err)}
                    />
                    <div className="absolute top-0 right-0 z-20 p-2">
                      <button
                        onClick={captureFrame}
                        disabled={loadingSnapshot}
                        className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full bg-opacity-70 hover:bg-opacity-100"
                        title="Capture current frame"
                      >
                        {loadingSnapshot ? (
                          <FaSync className="text-white animate-spin" />
                        ) : (
                          <FaCamera className="text-white" />
                        )}
                      </button>
                    </div>
                  </>
                ) : snapshot ? (
                  <div className="relative w-full h-full">
                    <img
                      src={snapshot}
                      alt="Captured frame"
                      className="object-contain w-full h-full"
                    />
                    <canvas
                      ref={snapshotCanvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <FaCamera size={36} className="mb-2 text-gray-400" />
                    <p className="text-xl">No video stream available</p>
                    <button
                      onClick={captureFrame}
                      disabled={loadingSnapshot || !networkId}
                      className="flex items-center px-3 py-1 mt-4 text-sm bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {loadingSnapshot ? (
                        <>
                          <FaSync className="mr-2 animate-spin" />
                          Capturing...
                        </>
                      ) : (
                        <>
                          <FaImage className="mr-2" />
                          Try to capture frame
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Canvas Overlay for Drawing */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                {/* Confirmation dialog for new zone */}
                {showConfirmation && (
                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-black bg-opacity-70">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="mb-3 font-medium text-center">Confirm this region?</p>
                      <div className="flex justify-center space-x-4">
                        <button
                          className="flex items-center px-3 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                          onClick={confirmZone}
                        >
                          <FaCheck className="mr-2" /> Confirm
                        </button>
                        <button
                          className="flex items-center px-3 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                          onClick={cancelDrawing}
                        >
                          <FaTimes className="mr-2" /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Settings Panel */}
              <div className="mt-4 overflow-hidden bg-white rounded-lg shadow">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer bg-gray-50"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <h3 className="text-base font-medium text-gray-700">Advanced Detection Settings</h3>
                  <span className="text-blue-600">{showAdvancedSettings ? 'Hide' : 'Show'}</span>
                </div>

                {showAdvancedSettings && (
                  <div className="p-4 border-t">
                    <div className="mb-4">
                      <label className="flex items-center justify-between mb-1 text-sm font-medium text-gray-700">
                        Sensitivity: {sensitivity}
                        <span className="text-xs text-gray-500">(higher = more sensitive)</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center justify-between mb-1 text-sm font-medium text-gray-700">
                        Blur: {blur}
                        <span className="text-xs text-gray-500">(noise reduction)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={blur}
                        onChange={(e) => setBlur(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="mb-2">
                      <label className="flex items-center justify-between mb-1 text-sm font-medium text-gray-700">
                        Morphology: {morphology}
                        <span className="text-xs text-gray-500">(shape processing)</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={morphology}
                        onChange={(e) => setMorphology(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 mt-4 border-t border-gray-200">
                      <div className="mb-3 text-xs text-gray-600">
                        <p>• Higher sensitivity detects smaller changes</p>
                        <p>• Higher blur reduces false triggers from noise</p>
                        <p>• Higher morphology merges nearby motion into one detection</p>
                      </div>
                      <button
                        className="flex items-center justify-center w-full px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        onClick={() => {
                          setSensitivity(1000);
                          setBlur(20);
                          setMorphology(20);
                        }}
                      >
                        <FaUndo className="mr-2" /> Reset to Default Values
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawing Controls */}
              <div className="flex justify-between mt-4">
                <button
                  className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  onClick={() => navigate('/rOIManager')}
                >
                  <FaTimes className="mr-2" /> Cancel
                </button>
                <button
                  className={`flex items-center px-4 py-2 text-white rounded-md ${networkId
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  onClick={saveZones}
                  disabled={!networkId || isSaving}
                  title={!networkId ? "Network ID missing" : "Save regions of interest"}
                >
                  {isSaving ? (
                    <><FaSync className="mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save Regions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel - Region List */}
            <div className="flex flex-col">
              <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium">Drawing Instructions</h3>
                </div>
                <p className="mt-2 text-gray-600">
                  {isDrawing
                    ? 'Release to finish drawing, then confirm or cancel the region.'
                    : 'Click and drag on the video to draw a new region of interest.'}
                </p>
              </div>

              {/* Connection Status */}
              <div className={`p-3 mb-4 rounded-md text-white flex items-center ${detectionEnabled ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                <div className="flex-1">
                  <div className="font-medium">Detection Status</div>
                  <div className="text-sm">
                    {detectionEnabled
                      ? 'Detection is currently enabled'
                      : 'Detection is currently disabled'
                    }
                  </div>
                </div>
                <div>
                  {detectionEnabled
                    ? <FaBell size={18} />
                    : <FaBellSlash size={18} />
                  }
                </div>
              </div>

              <div className="flex-1 p-4 mb-4 bg-white rounded-lg shadow">
                <h3 className="pb-2 mb-4 text-lg font-medium border-b">Defined Regions ({zones.length})</h3>

                {zones.length === 0 ? (
                  <p className="p-4 text-center text-gray-500">No regions defined yet. Draw regions on the video.</p>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-80">
                    {zones.map((zone, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 border rounded-md"
                        style={{ borderLeftColor: zone.color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">Region {index + 1}</p>
                          <p className="text-sm text-gray-600">
                            Size: {Math.round(zone.width)}×{Math.round(zone.height)} px
                          </p>
                          <p className="text-xs text-gray-500">
                            Position: ({Math.round(zone.centerX)}, {Math.round(zone.centerY)})
                          </p>
                        </div>
                        <button
                          className="flex items-center justify-center w-8 h-8 text-white bg-red-500 rounded-full hover:bg-red-600"
                          onClick={() => deleteZone(index)}
                          title="Delete region"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {zones.length > 0 && (
                  <div className="pt-2 mt-4 border-t">
                    <button
                      className="flex items-center justify-center w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                      onClick={() => setZones([])}
                    >
                      <FaUndo className="mr-2" /> Clear All Regions
                    </button>
                  </div>
                )}
              </div>

              {/* Debug Information */}
              <div className="p-3 text-xs text-gray-500 bg-gray-100 rounded-md">
                <div className="grid grid-cols-2 gap-1">
                  <div>Camera ID:</div>
                  <div className="font-mono">{cameraId}</div>
                  <div>Network ID:</div>
                  <div className="overflow-hidden font-mono overflow-ellipsis">{networkId || 'None'}</div>
                  <div>Frame Size:</div>
                  <div>{frameWidth}×{frameHeight} px</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROIEditor;