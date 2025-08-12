import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaChevronLeft, FaCamera,
  FaArrowUp, FaArrowDown,
  FaExclamationTriangle, FaSyncAlt,
  FaCaretUp,
  FaCaretDown,
  FaUndo,
  FaCaretLeft,
  FaCaretRight,
  FaCog,
  FaTerminal,
  FaInfo,
  FaMapMarkerAlt,
  FaExpandArrowsAlt,
  FaRoute,
  FaStreetView,
  FaUserAstronaut
} from "react-icons/fa";
import DummyImage from "../assets/Picture1.png";
import { useNavigate } from "react-router-dom";
import DroneWebSocketClient from "../services/DroneWebSocketClient";
import AnimatedDrone from "./AnimatedDrone";
import DroneConfigurationModal from "../components/Modals/DroneConfigurationModal";
import DraggableLogsModal from "../components/Modals/DraggableLogsModal";
import DroneInfoModal from "../components/Modals/DroneInfoModal";
import AltimeterWheel from "./AltimeterWheel";
import Compass from "./Compass";
import { PiDroneDuotone } from "react-icons/pi";
import WaypointsModal from "../components/Modals/WaypointsModal";
import DynamicMapModal from "../components/Modals/DynamicMapModal";
import ClassificationStream from "./ClassificationStream";
import { useDroneDeployment } from '../contexts/DroneDeploymentContext';

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  isHome?: boolean;
  status?: 'pending' | 'active' | 'completed' | 'failed';
  arrivalTime?: string;
}

// Export the interface
export interface DeploymentLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  alertId?: string;
  cameraId?: string;
  description?: string;
}

interface DroneStats {
  batteryLevel: number;
  altitude: number;
  speed: number;
  temperature?: number;
  remainingFlightTime?: number;
  horizontalSpeed?: number;
  verticalSpeed?: number;
  gps?: number;
  signalStrength?: number;
  flying?: boolean;
  flightMode?: string;
  heading?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  position?: {
    latitude: number;
    longitude: number;
  };
}

interface DroneInfo {
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  isConnected: boolean;
  batteryPercentage?: number;
  isFlying?: boolean;
  payloadCapacity?: number;
  maxDistance?: string;
}


interface DroneManagementProps {
  // ✅ SHARED STATE PROPS - Updated with global state integration
  initialDroneClient?: DroneWebSocketClient | null;
  onDroneClientChange?: (client: DroneWebSocketClient | null) => void;
  initialConnected?: boolean;
  onConnectedChange?: (connected: boolean) => void;
  initialConnecting?: boolean;
  onConnectingChange?: (connecting: boolean) => void;
  initialAndroidConnected?: boolean;
  onAndroidConnectedChange?: (androidConnected: boolean) => void;
  initialAppRegistered?: boolean;
  onAppRegisteredChange?: (appRegistered: boolean) => void;
  initialVirtualStickEnabled?: boolean;
  onVirtualStickEnabledChange?: (virtualStickEnabled: boolean) => void;
  initialKeyboardControlsEnabled?: boolean;
  onKeyboardControlsEnabledChange?: (keyboardControlsEnabled: boolean) => void;
  initialStreamingStats?: {
    status: "inactive" | "starting" | "active" | "stopping" | "error";
    message: string;
  };
  onStreamingStatsChange?: (streamingStats: {
    status: "inactive" | "starting" | "active" | "stopping" | "error";
    message: string;
  }) => void;
  initialRegistrationStatus?: string;
  onRegistrationStatusChange?: (registrationStatus: string) => void;

  // ✅ CRITICAL: Add initial value props for all additional states
  initialDroneInfo?: DroneInfo;
  initialDroneTelemetry?: {
    position: { latitude: number; longitude: number };
    altitude: number;
    batteryLevel: number;
    temperature: number;
  };
  initialHomeLocation?: { latitude: number; longitude: number } | null;
  initialIsHomeLocationSet?: boolean;
  initialNavigationStatus?: {
    isNavigating: boolean;
    command: string | null;
    message: string;
  };
  initialCurrentWaypoints?: Waypoint[];
  initialAutomationStatus?: {
    isActive: boolean;
    currentWaypointIndex: number;
    totalWaypoints: number;
    progress: number;
  };
  initialObjectClassificationActive?: boolean;
  initialClassificationError?: string | null;
  initialLogs?: string[];

  // ✅ Additional global state sync props
  onDroneInfoChange?: (info: Partial<DroneInfo>) => void;
  onDroneTelemetryChange?: (telemetry: Partial<{
    position: { latitude: number; longitude: number };
    altitude: number;
    batteryLevel: number;
    temperature: number;
  }>) => void;
  onHomeLocationChange?: (location: { latitude: number; longitude: number } | null) => void;
  onIsHomeLocationSetChange?: (set: boolean) => void;
  onNavigationStatusChange?: (status: {
    isNavigating: boolean;
    command: string | null;
    message: string;
  }) => void;
  onCurrentWaypointsChange?: (waypoints: Waypoint[]) => void;
  onAutomationStatusChange?: (status: {
    isActive: boolean;
    currentWaypointIndex: number;
    totalWaypoints: number;
    progress: number;
  }) => void;
  onObjectClassificationActiveChange?: (active: boolean) => void;
  onClassificationErrorChange?: (error: string | null) => void;
  onLogsChange?: (logs: string[]) => void;
}
const keyboardControls = {
  w: "forward",
  s: "backward",
  a: "left",
  d: "right",
  r: "up",
  f: "down",
  q: "rotate_left",
  e: "rotate_right",
  t: "takeoff",
  l: "land",
  x: "emergency",
  i: "gimbal_up",
  k: "gimbal_down",
  o: "gimbal_reset",
};


// WebSocket Stream Component
const WebSocketStream = ({ serverUrl, isActive }) => {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isActive) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    const drawNoSignal = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NO SIGNAL', canvas.width / 2, canvas.height / 2);
    };

    drawNoSignal();

    try {
      wsRef.current = new WebSocket(serverUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => {
        setConnected(true);
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const bitmap = await createImageBitmap(new Blob([event.data], { type: 'image/jpeg' }));
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
        } catch (error) {
          console.error('Frame error:', error);
        }
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        drawNoSignal();
      };

    } catch (error) {
      console.error('WebSocket failed:', error);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [serverUrl, isActive]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black rounded-lg">
      <canvas ref={canvasRef} className="object-cover w-full h-full" />
      <div className="absolute px-2 py-1 text-xs text-white rounded top-2 right-2 bg-black/60">
        WebSocket • {connected ? 'Live' : 'Disconnected'}
      </div>
    </div>
  );
};

// HLS Stream Component
const HLSStream = ({ streamUrl, isActive }) => {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) {
      if (video) {
        video.pause();
        video.src = '';
      }
      setLoaded(false);
      setError(false);
      return;
    }

    const loadHLS = async () => {
      try {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            setLoaded(true);
            video.play().catch(console.error);
          });
        } else {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.10/hls.min.js';
          script.onload = () => loadHLS();
          document.head.appendChild(script);
        }
      } catch (err) {
        setError(true);
      }
    };

    loadHLS();
    video.onloadeddata = () => setLoaded(true);
    video.onerror = () => setError(true);

  }, [streamUrl, isActive]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black rounded-lg">
      <video ref={videoRef} className="object-cover w-full h-full" autoPlay muted playsInline />
      {!loaded && !error && isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-red-900/50">
          HLS Stream Error
        </div>
      )}
      <div className="absolute px-2 py-1 text-xs text-white rounded top-2 right-2 bg-black/60">
        HLS • {loaded ? 'Live' : error ? 'Error' : 'Loading'}
      </div>
    </div>
  );
};





function DroneManagement({
  initialDroneClient = null,
  onDroneClientChange,
  initialConnected = false,
  onConnectedChange,
  initialConnecting = false,
  onConnectingChange,
  initialAndroidConnected = false,
  onAndroidConnectedChange,
  initialAppRegistered = false,
  onAppRegisteredChange,
  initialVirtualStickEnabled = false,
  onVirtualStickEnabledChange,
  initialKeyboardControlsEnabled = false,
  onKeyboardControlsEnabledChange,
  initialStreamingStats = { status: "inactive", message: "Streaming inactive" },
  onStreamingStatsChange,
  initialRegistrationStatus = "Not registered",
  onRegistrationStatusChange,

  // ✅ CRITICAL: Add initial values for all additional states
  initialDroneInfo = {
    model: "Unknown",
    serialNumber: "Unknown",
    firmwareVersion: "Unknown",
    isConnected: false,
  },
  initialDroneTelemetry = {
    position: { latitude: 0, longitude: 0 },
    altitude: 0,
    batteryLevel: 0,
    temperature: 24,
  },
  initialHomeLocation = null,
  initialIsHomeLocationSet = false,
  initialNavigationStatus = {
    isNavigating: false,
    command: null,
    message: ""
  },
  initialCurrentWaypoints = [],
  initialAutomationStatus = {
    isActive: false,
    currentWaypointIndex: -1,
    totalWaypoints: 0,
    progress: 0
  },
  initialObjectClassificationActive = false,
  initialClassificationError = null,
  initialLogs = [],

  // ✅ Global state sync handlers
  onDroneInfoChange,
  onDroneTelemetryChange,
  onHomeLocationChange,
  onIsHomeLocationSetChange,
  onNavigationStatusChange,
  onCurrentWaypointsChange,
  onAutomationStatusChange,
  onObjectClassificationActiveChange,
  onClassificationErrorChange,
  onLogsChange
}: DroneManagementProps): React.ReactElement {

  const [activeVideoView, setActiveVideoView] = useState('surveillance'); // 'surveillance', 'backup', 'both'

  // ✅ PRIMARY STATE - Synced with global state
  const [droneClient, setDroneClient] = useState<DroneWebSocketClient | null>(initialDroneClient);
  const [connected, setConnected] = useState<boolean>(initialConnected);
  const [connecting, setConnecting] = useState<boolean>(initialConnecting);
  const [androidConnected, setAndroidConnected] = useState<boolean>(initialAndroidConnected);
  const [appRegistered, setAppRegistered] = useState<boolean>(initialAppRegistered);
  const [virtualStickEnabled, setVirtualStickEnabled] = useState<boolean>(initialVirtualStickEnabled);
  const [keyboardControlsEnabled, setKeyboardControlsEnabled] = useState<boolean>(initialKeyboardControlsEnabled);
  const [streamingStats, setStreamingStats] = useState(initialStreamingStats);
  const [registrationStatus, setRegistrationStatus] = useState<string>(initialRegistrationStatus);

  // ✅ CRITICAL: Initialize with values from global state
  const [automationStatus, setAutomationStatus] = useState(initialAutomationStatus);
  const [currentWaypoints, setCurrentWaypoints] = useState<Waypoint[]>(initialCurrentWaypoints);
  const [droneInfo, setDroneInfo] = useState<DroneInfo>(initialDroneInfo);
  const [droneTelemetry, setDroneTelemetry] = useState(initialDroneTelemetry);
  const [homeLocation, setHomeLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialHomeLocation);
  const [isHomeLocationSet, setIsHomeLocationSet] = useState<boolean>(initialIsHomeLocationSet);
  const [navigationStatus, setNavigationStatus] = useState<{
    isNavigating: boolean;
    command: string | null;
    message: string;
  }>(initialNavigationStatus);
  const [objectClassificationActive, setObjectClassificationActive] = useState(initialObjectClassificationActive);
  const [classificationError, setClassificationError] = useState<string | null>(initialClassificationError);
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const { deploymentRequest, clearDeployment } = useDroneDeployment();

  // ✅ LOCAL ONLY STATE (not synced globally)
  const [, setVideoActive] = useState<boolean>(false);
  const [waypointsModalOpen, setWaypointsModalOpen] = useState(false);
  const [droneStats,] = useState<DroneStats>({
    batteryLevel: 0,
    altitude: 0,
    speed: 0,
    temperature: 24,
    remainingFlightTime: 30,
    horizontalSpeed: 0,
    verticalSpeed: 0,
    gps: 0,
    signalStrength: 0,
    flying: false,
    flightMode: "Normal",
    heading: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    position: {
      latitude: 0,
      longitude: 0,
    },
  });

  const [videoServerUrl, setVideoServerUrl] = useState("ws://10.230.46.58:8765");
  const [loadingStream, setLoadingStream] = useState<boolean>(false);
  const [loadingCountdown, setLoadingCountdown] = useState<number>(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const clientRef = useRef<DroneWebSocketClient | null>(null);
  const navigate = useNavigate();

  const [, setVideoConnected] = useState(false);
  const [, setVideoConnecting] = useState(false);
  const [, setVideoStats] = useState({
    framesReceived: 0,
    resolution: '-',
    fps: 0,
    dataRate: 0,
    frameSize: 0,
    latency: 0
  });
  const [dynamicMapModalOpen, setDynamicMapModalOpen] = useState(false);

  const [serverUrl, setServerUrl] = useState<string>("ws://10.230.46.58:5001");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideoServerUrl, setEditingVideoServerUrl] = useState(videoServerUrl);
  const [editingDroneServerUrl, setEditingDroneServerUrl] = useState(serverUrl);
  const [connectingDrone, setConnectingDrone] = useState(false);
  const [registeredAndroidApp, setRegisteredAndroidApp] = useState(appRegistered);
  const [settingVideoServer, setSettingVideoServer] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [droneInfoModalOpen, setDroneInfoModalOpen] = useState(false);
  const [, setCurrentAltitude] = useState<number>(0);
  const classificationToggleRef = useRef<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (deploymentRequest && deploymentRequest.requestId && deploymentRequest.requestId !== lastProcessedRequestId.current) {
      console.log('🚨 Processing new deployment request:', deploymentRequest);

      // Mark this request as processed
      lastProcessedRequestId.current = deploymentRequest.requestId;

      addLog(`🚨 THREAT ALERT: Deployment requested from ${deploymentRequest.cameraId}`);
      addLog(`📍 Target: ${deploymentRequest.latitude.toFixed(6)}, ${deploymentRequest.longitude.toFixed(6)}`);

      // Execute deployment with timeout protection
      const deploymentPromise = handleAutoTakeoffAndNavigateToThreat(deploymentRequest);

      // Clear request after processing with delay
      setTimeout(() => {
        clearDeployment();
      }, 2000); // Increased delay to ensure command execution

      // Handle any deployment errors
      deploymentPromise.catch((error) => {
        console.error('Deployment failed:', error);
        addLog(`❌ Deployment failed: ${error.message}`);
      });
    }
  }, [deploymentRequest, clearDeployment]);

  // Add this ref at the top of the component with other refs:
  const lastProcessedRequestId = useRef<string | null>(null);


  const handleAutoTakeoffAndNavigateToThreat = async (threatLocation: DeploymentLocation) => {
    if (!droneClient || !connected || !appRegistered) {
      throw new Error("Cannot execute threat response - drone not ready");
    }

    if (navigationStatus.isNavigating) {
      throw new Error("Another navigation is already in progress");
    }

    try {
      addLog("🚨 THREAT RESPONSE: Starting emergency deployment...");
      addLog(`🎯 Alert ID: ${threatLocation.alertId}`);
      addLog(`📷 Camera: ${threatLocation.cameraId}`);
      addLog(`📝 Description: ${threatLocation.description}`);

      setNavigationStatus({
        isNavigating: true,
        command: "emergency_deployment",
        message: "Emergency takeoff for threat response..."
      });

      // Step 1: Emergency Takeoff
      addLog("🚁 Step 1: Emergency takeoff initiated...");
      await droneClient.sendCommand("takeoff");

      // ✅ DELAY 1: Wait 4 seconds after takeoff command
      addLog("⏱️ Waiting 4 seconds for takeoff to complete...");
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Set home location if not set
      if (!isHomeLocationSet && droneTelemetry.position.latitude !== 0 && droneTelemetry.position.longitude !== 0) {
        const homePos = {
          latitude: droneTelemetry.position.latitude,
          longitude: droneTelemetry.position.longitude
        };
        setHomeLocation(homePos);
        setIsHomeLocationSet(true);
        addLog(`🏠 Emergency home location set: ${homePos.latitude.toFixed(6)}, ${homePos.longitude.toFixed(6)}`);
      }

      setNavigationStatus(prev => ({
        ...prev,
        message: "Takeoff complete, preparing navigation..."
      }));

      // ✅ DELAY 2: Additional 5 seconds before navigation
      addLog("⏱️ Waiting 5 seconds before navigation to threat location...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 2: Navigate to threat location
      addLog(`🎯 Step 2: Navigating to threat location...`);

      setNavigationStatus(prev => ({
        ...prev,
        message: "Navigating to threat location..."
      }));

      await droneClient.sendGoToLocation(
        threatLocation.latitude,
        threatLocation.longitude,
        threatLocation.altitude || 15
      );

      addLog("✅ Emergency deployment command sent!");
      addLog(`🚨 Drone responding to threat at: ${threatLocation.latitude.toFixed(6)}, ${threatLocation.longitude.toFixed(6)}`);

      return true;

    } catch (error) {
      console.error('Emergency deployment failed:', error);
      setNavigationStatus({
        isNavigating: false,
        command: null,
        message: ""
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addLog(`❌ Emergency deployment failed: ${errorMessage}`);
      throw error;
    }
  };


  const handleAutoTakeoffAndNavigate = async () => {
    // Target coordinates
    const targetLocation = {
      latitude: 33.646892,
      longitude: 72.996533,
      altitude: 15 // meters
    };

    if (!droneClient || !connected || !appRegistered) {
      addLog("❌ Cannot execute auto mission - drone not ready");
      return;
    }

    if (navigationStatus.isNavigating) {
      addLog("❌ Another navigation is already in progress");
      return;
    }

    try {
      addLog("🚀 Starting Auto Takeoff and Navigate Mission...");

      // Update navigation status
      setNavigationStatus({
        isNavigating: true,
        command: "auto_takeoff_navigate",
        message: "Starting takeoff..."
      });

      // Step 1: Execute Takeoff
      addLog("🛫 Step 1: Executing takeoff command...");
      await droneClient.sendCommand("takeoff");

      // Set home location if not already set
      if (!isHomeLocationSet && droneTelemetry.position.latitude !== 0 && droneTelemetry.position.longitude !== 0) {
        const homePos = {
          latitude: droneTelemetry.position.latitude,
          longitude: droneTelemetry.position.longitude
        };
        setHomeLocation(homePos);
        setIsHomeLocationSet(true);
        addLog(`🏠 Home location set at: ${homePos.latitude.toFixed(6)}, ${homePos.longitude.toFixed(6)}`);
      }

      // Update status
      setNavigationStatus(prev => ({
        ...prev,
        message: "Takeoff complete, waiting 5 seconds..."
      }));

      addLog("✅ Takeoff command sent successfully");
      addLog("⏱️ Waiting 5 seconds before navigation...");

      // Step 2: Wait for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 3: Navigate to target location
      addLog(`🎯 Step 2: Navigating to target location...`);
      addLog(`📍 Target: ${targetLocation.latitude.toFixed(6)}, ${targetLocation.longitude.toFixed(6)}, ${targetLocation.altitude}m`);

      setNavigationStatus(prev => ({
        ...prev,
        message: "Navigating to target location..."
      }));

      await droneClient.sendGoToLocation(
        targetLocation.latitude,
        targetLocation.longitude,
        targetLocation.altitude
      );

      addLog("✅ Navigation command sent successfully!");
      addLog(`🎯 Drone is now heading to: ${targetLocation.latitude.toFixed(6)}, ${targetLocation.longitude.toFixed(6)}`);

    } catch (error) {
      console.error('Auto mission failed:', error);

      // Reset navigation status on error
      setNavigationStatus({
        isNavigating: false,
        command: null,
        message: ""
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addLog(`❌ Auto mission failed: ${errorMessage}`);
    }
  };


  // ✅ SYNC PRIMARY STATE WITH GLOBAL STATE
  useEffect(() => {
    if (onDroneClientChange) {
      onDroneClientChange(droneClient);
    }
  }, [droneClient, onDroneClientChange]);

  useEffect(() => {
    if (onConnectedChange) {
      onConnectedChange(connected);
    }
  }, [connected, onConnectedChange]);

  useEffect(() => {
    if (onConnectingChange) {
      onConnectingChange(connecting);
    }
  }, [connecting, onConnectingChange]);

  useEffect(() => {
    if (onAndroidConnectedChange) {
      onAndroidConnectedChange(androidConnected);
    }
  }, [androidConnected, onAndroidConnectedChange]);

  useEffect(() => {
    if (onAppRegisteredChange) {
      onAppRegisteredChange(appRegistered);
    }
  }, [appRegistered, onAppRegisteredChange]);

  useEffect(() => {
    if (onVirtualStickEnabledChange) {
      onVirtualStickEnabledChange(virtualStickEnabled);
    }
  }, [virtualStickEnabled, onVirtualStickEnabledChange]);

  useEffect(() => {
    if (onKeyboardControlsEnabledChange) {
      onKeyboardControlsEnabledChange(keyboardControlsEnabled);
    }
  }, [keyboardControlsEnabled, onKeyboardControlsEnabledChange]);

  useEffect(() => {
    if (onStreamingStatsChange) {
      onStreamingStatsChange(streamingStats);
    }
  }, [streamingStats, onStreamingStatsChange]);

  useEffect(() => {
    if (onRegistrationStatusChange) {
      onRegistrationStatusChange(registrationStatus);
    }
  }, [registrationStatus, onRegistrationStatusChange]);

  // ✅ SYNC ADDITIONAL STATE WITH GLOBAL STATE
  useEffect(() => {
    if (onDroneInfoChange) {
      onDroneInfoChange(droneInfo);
    }
  }, [droneInfo, onDroneInfoChange]);

  useEffect(() => {
    if (onDroneTelemetryChange) {
      onDroneTelemetryChange(droneTelemetry);
    }
  }, [droneTelemetry, onDroneTelemetryChange]);

  useEffect(() => {
    if (onHomeLocationChange) {
      onHomeLocationChange(homeLocation);
    }
  }, [homeLocation, onHomeLocationChange]);

  useEffect(() => {
    if (onIsHomeLocationSetChange) {
      onIsHomeLocationSetChange(isHomeLocationSet);
    }
  }, [isHomeLocationSet, onIsHomeLocationSetChange]);

  useEffect(() => {
    if (onNavigationStatusChange) {
      onNavigationStatusChange(navigationStatus);
    }
  }, [navigationStatus, onNavigationStatusChange]);

  useEffect(() => {
    if (onCurrentWaypointsChange) {
      onCurrentWaypointsChange(currentWaypoints);
    }
  }, [currentWaypoints, onCurrentWaypointsChange]);

  useEffect(() => {
    if (onAutomationStatusChange) {
      onAutomationStatusChange(automationStatus);
    }
  }, [automationStatus, onAutomationStatusChange]);

  useEffect(() => {
    if (onObjectClassificationActiveChange) {
      onObjectClassificationActiveChange(objectClassificationActive);
    }
  }, [objectClassificationActive, onObjectClassificationActiveChange]);

  useEffect(() => {
    if (onClassificationErrorChange) {
      onClassificationErrorChange(classificationError);
    }
  }, [classificationError, onClassificationErrorChange]);

  useEffect(() => {
    if (onLogsChange) {
      onLogsChange(logs);
    }
  }, [logs, onLogsChange]);

  // ✅ SYNC INITIAL VALUES ON MOUNT
  useEffect(() => {
    setDroneClient(initialDroneClient);
  }, [initialDroneClient]);

  useEffect(() => {
    setConnected(initialConnected);
  }, [initialConnected]);

  useEffect(() => {
    setConnecting(initialConnecting);
  }, [initialConnecting]);

  useEffect(() => {
    setAndroidConnected(initialAndroidConnected);
  }, [initialAndroidConnected]);

  useEffect(() => {
    setAppRegistered(initialAppRegistered);
  }, [initialAppRegistered]);

  useEffect(() => {
    setVirtualStickEnabled(initialVirtualStickEnabled);
  }, [initialVirtualStickEnabled]);

  useEffect(() => {
    setKeyboardControlsEnabled(initialKeyboardControlsEnabled);
  }, [initialKeyboardControlsEnabled]);

  useEffect(() => {
    setStreamingStats(initialStreamingStats);
  }, [initialStreamingStats]);

  useEffect(() => {
    setRegistrationStatus(initialRegistrationStatus);
  }, [initialRegistrationStatus]);

  const toggleKeyboardControls = () => {
    setKeyboardControlsEnabled(prev => !prev);
    addLog(`Keyboard controls ${!keyboardControlsEnabled ? "enabled" : "disabled"}`);
  };

  // Enhanced navigation command handler
  const handleNavigationCommand = async (command: string, coordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  }): Promise<void> => {
    if (!droneClient || !connected || !appRegistered) {
      addLog("❌ Cannot execute navigation - drone not ready");
      return;
    }

    try {
      setNavigationStatus({
        isNavigating: true,
        command,
        message: `Starting ${command}...`
      });

      switch (command) {
        case "go_to_home":
          await droneClient.sendCommand("stop_everything");
          addLog("🏠 Stopping Everything...");
          break;

        case "return_to_home":
          await droneClient.sendCommand("return_to_home");
          addLog("🏠 Activating Return to Home...");
          break;

        case "go_to_location":
          if (!coordinates) {
            throw new Error("Coordinates required for go_to_location command");
          }

          await droneClient.sendGoToLocation(
            coordinates.latitude,
            coordinates.longitude,
            coordinates.altitude || 15
          );

          addLog(`📍 Navigating to: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}, ${coordinates.altitude || 15}m`);
          break;

        default:
          throw new Error(`Unknown navigation command: ${command}`);
      }

      addLog(`✅ Navigation command sent successfully`);

    } catch (error: unknown) {
      setNavigationStatus({
        isNavigating: false,
        command: null,
        message: ""
      });

      if (error instanceof Error) {
        addLog(`❌ Navigation failed: ${error.message}`);
      } else {
        addLog("❌ Navigation failed: Unknown error");
      }
      throw error;
    }
  };



const renderVideoContent = useCallback(() => {
    // Multiple working stream options
    const streamOptions = {
      // Your original stream (might work with iframe)
      original: "http://192.168.18.47:8888/eade406f6395-16/index.m3u8?token=fgt4lzvguooyh6s2bm99k"
    };

    // Use demo1 as default, but you can change this
    const hlsUrl = streamOptions.original;

    // Show loading screen
    if (loadingStream) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full text-white">
          <div className="w-12 h-12 mb-4 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg">Starting live stream...</p>
          <p className="text-xl">Stream available in {loadingCountdown} seconds</p>
        </div>
      );
    }

    // Main video content based on selected view
    switch (activeVideoView) {
      case 'surveillance':
        if (objectClassificationActive && connected && appRegistered) {
          return (
            <ClassificationStream
              key="classification-stream"
              isActive={true}
              serverUrl="http://192.168.1.138:5002"
              onConnect={() => addLog("✅ Classification connected")}
              onDisconnect={() => addLog("🔌 Classification disconnected")}
              onError={(error) => {
                addLog(`❌ Classification error: ${error}`);
                setClassificationError(error);
              }}
            />
          );
        }

        if (connected && appRegistered) {
          return <WebSocketStream serverUrl={videoServerUrl} isActive={true} />;
        }

        return (
          <div className="relative w-full h-full">
            <img src={DummyImage} alt="Drone not connected" className="object-cover w-full h-full opacity-70" />
          </div>
        );

      case 'backup':
        return <HLSStream streamUrl={hlsUrl} isActive={true} />;

      case 'both':
        return (
          <div className="grid h-full grid-cols-2 gap-2">
            <div className="overflow-hidden bg-gray-900 rounded-lg">
              <div className="p-2 text-xs text-white bg-blue-600">Surveillance</div>
              <div className="h-full">
                {objectClassificationActive && connected && appRegistered ? (
                  <ClassificationStream
                    key="classification-stream-split"
                    isActive={true}
                    serverUrl="http://192.168.1.138:5002"
                    onConnect={() => addLog("✅ Classification connected")}
                    onDisconnect={() => addLog("🔌 Classification disconnected")}
                    onError={(error) => setClassificationError(error)}
                  />
                ) : connected && appRegistered ? (
                  <WebSocketStream serverUrl={videoServerUrl} isActive={true} />
                ) : (
                  <div className="flex items-center justify-center h-full text-white bg-black">
                    <img src={DummyImage} alt="No connection" className="object-cover w-full h-full opacity-50" />
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-hidden bg-gray-900 rounded-lg">
              <div className="p-2 text-xs text-white bg-green-600">Backup (Iframe Mode)</div>
              <div className="h-full">
                <HLSStream streamUrl={hlsUrl} isActive={true} />
              </div>
            </div>
          </div>
        );

      default:
        return <WebSocketStream serverUrl={videoServerUrl} isActive={true} />;
    }
  }, [
    loadingStream,
    loadingCountdown,
    activeVideoView,
    objectClassificationActive,
    connected,
    appRegistered,
    videoServerUrl
  ]);


  const handleObjectClassification = useCallback(async () => {
    if (!droneClient || !connected || !appRegistered) {
      addLog("❌ Cannot start object classification - Drone not ready");
      return;
    }

    if (classificationToggleRef.current) {
      addLog("⚠️ Classification toggle in progress, please wait...");
      return;
    }

    classificationToggleRef.current = true;

    try {
      if (!objectClassificationActive) {
        addLog("🧠 Starting object classification...");
        setClassificationError(null);

        await droneClient.sendCommand(JSON.stringify({
          type: "object_classification",
          command: "start"
        }));

        setObjectClassificationActive(true);
        addLog("✅ Object classification command sent");
        classificationToggleRef.current = false;

      } else {
        addLog("🔄 Stopping object classification...");

        await droneClient.sendCommand(JSON.stringify({
          type: "object_classification",
          command: "stop"
        }));

        setObjectClassificationActive(false);
        setClassificationError(null);
        addLog("✅ Object classification stopped");
        classificationToggleRef.current = false;
      }

    } catch (error: unknown) {
      setObjectClassificationActive(false);
      setClassificationError(error instanceof Error ? error.message : 'Unknown error');
      classificationToggleRef.current = false;

      if (error instanceof Error) {
        addLog(`❌ Failed to toggle classification: ${error.message}`);
      } else {
        addLog("❌ Failed to toggle classification: Unknown error");
      }
    }
  }, [droneClient, connected, appRegistered, objectClassificationActive]);

  // Enhanced message handler to process navigation responses
  const handleNavigationResponse = (message: any) => {
    if (message.type === "command_response") {
      const command = message.command;
      const success = message.status === "success";

      if (command?.includes("go_to_") || command?.includes("return_to_home") || command?.includes("stop_mission")) {
        if (success) {
          if (command.includes("_started") || command === "go_to_location") {
            setNavigationStatus(prev => ({
              ...prev,
              message: "Navigation in progress..."
            }));
            addLog("🚁 Navigation started successfully");
          } else if (command.includes("_completed")) {
            setNavigationStatus({
              isNavigating: false,
              command: null,
              message: ""
            });
            addLog("✅ Navigation completed successfully");
          } else if (command.includes("_stopped") || command === "stop_mission") {
            setNavigationStatus({
              isNavigating: false,
              command: null,
              message: ""
            });
            addLog("⏹️ Navigation stopped successfully");
          } else {
            addLog(`✅ ${command} command accepted`);
          }
        } else {
          setNavigationStatus({
            isNavigating: false,
            command: null,
            message: ""
          });
          addLog(`❌ Navigation failed: ${message.message}`);
        }
      }
    }
  };

  const handleStopNavigation = async () => {
    if (!droneClient || !connected || !appRegistered) return;

    try {
      await droneClient.sendCommand("stop_mission");

      setNavigationStatus({
        isNavigating: false,
        command: null,
        message: ""
      });

      addLog("⏹️ Mission stop command sent");
    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Failed to stop mission: ${error.message}`);
      } else {
        addLog("❌ Failed to stop mission: Unknown error");
      }
    }
  };

  const handleGoToHome = async () => {
    if (!homeLocation || !isHomeLocationSet) {
      addLog("❌ Home location not set. Please takeoff first to set home location.");
      return;
    }

    await handleNavigationCommand("stop_everything");
  };

  const handleReturnToHome = async () => {
    await handleNavigationCommand("return_to_home");
  };

  const handleAltitudeChange = (altitude: number): void => {
    setCurrentAltitude(altitude);
    console.log('Altitude changed to:', altitude);
  };

  const openConfigModal = () => {
    setEditingVideoServerUrl(videoServerUrl);
    setEditingDroneServerUrl(serverUrl);
    setModalOpen(true);
  };

  const handleSetVideoServerUrl = (url: string) => {
    setSettingVideoServer(true);

    try {
      const parsed = new URL(url);

      if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        throw new Error("URL must start with ws:// or wss://");
      }

      setVideoServerUrl(url);
      setEditingVideoServerUrl(url);
      addLog(`✅ Video Server URL set to: ${url}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Invalid URL: ${error.message}`);
      } else {
        addLog(`❌ Invalid URL: Unknown error`);
      }
    } finally {
      setSettingVideoServer(false);
    }
  };

  const handleConnectDroneServer = async (url: string) => {
    if (connected && droneClient) {
      handleDisconnect();
      await new Promise((res) => setTimeout(res, 500));
    }

    setConnectingDrone(true);
    setConnecting(true); // ✅ Set connecting state
    setServerUrl(url);

    const newClient = new DroneWebSocketClient(url, {
      onConnect: () => {
        setConnected(true);
        setConnecting(false);
        addLog("✅ Connected to drone server");

        setTimeout(() => {
          if (newClient.isConnected()) {
            newClient.sendCommand(JSON.stringify({
              type: "CLIENT_IDENTITY",
              clientType: "electron"
            }));
          }
        }, 500);
      },
      onDisconnect: () => {
        setConnected(false);
        setConnecting(false);
        setVideoActive(false);
        setAndroidConnected(false);
        setAppRegistered(false);
        setRegistrationStatus("Not registered");
        setStreamingStats({ status: "inactive", message: "Streaming inactive" });

        // ✅ IMPORTANT: Reset droneInfo.isConnected
        setDroneInfo({
          model: "Unknown",
          serialNumber: "Unknown",
          firmwareVersion: "Unknown",
          isConnected: false
        });

        addLog("🔌 Disconnected from drone server");
      },
      onError: (error: any) => {
        setConnecting(false);
        setConnectingDrone(false);
        addLog(`❌ Connection error: ${error.message}`);
      },

      onMessage: (message: any) => {
        if (message.type === "android_connection_status") {
          setAndroidConnected(message.connected);
          addLog(`📱 Android device ${message.connected ? "connected" : "disconnected"}`);
        }
        else if (message.type === "drone_connection_status") {
          const droneConnected = message.connected;
          addLog(`🚁 Drone ${droneConnected ? "connected" : "disconnected"}`);

          // ✅ CRITICAL: Update droneInfo.isConnected immediately
          if (message.droneInfo) {
            setDroneInfo((prevInfo) => ({
              ...prevInfo,
              model: message.droneInfo.model || prevInfo.model,
              serialNumber: message.droneInfo.serialNumber || prevInfo.serialNumber,
              firmwareVersion: message.droneInfo.firmwareVersion || prevInfo.firmwareVersion,
              isConnected: droneConnected, // ✅ This is the key update
              batteryPercentage: message.droneInfo.batteryPercentage ?? prevInfo.batteryPercentage,
              isFlying: message.droneInfo.isFlying ?? prevInfo.isFlying,
            }));
          } else {
            // ✅ Even if no droneInfo, update the connection status
            setDroneInfo((prevInfo) => ({
              ...prevInfo,
              isConnected: droneConnected,
            }));
          }
        }
        else if (message.type === "telemetry") {
          const { position, altitude, battery } = message.data;

          setDroneTelemetry((prev) => ({
            ...prev,
            position,
            altitude,
            batteryLevel: battery,
            temperature: prev.temperature
          }));

          // Only log occasionally to avoid spam
          if (Math.random() < 0.1) { // 10% chance to log telemetry
            addLog(`📡 Telemetry: Lat=${position.latitude.toFixed(5)}, Lng=${position.longitude.toFixed(5)}, Alt=${altitude}m, Batt=${battery}%`);
          }
        }
        else if (message.type === "command_response") {
          const command = message.command;
          const success = message.status === "success";

          if (command === "register_app") {
            setAppRegistered(success);
            setRegisteredAndroidApp(success);
            setRegistrationStatus(success ? "Registered" : "Registration failed");
            addLog(`📋 App registration ${success ? "successful" : "failed"}`);
          }
          else if (command?.includes("go_to_") || command?.includes("return_to_home") || command?.includes("stop_mission")) {
            handleNavigationResponse(message);
          }
          else {
            addLog(`📝 Command ${command}: ${success ? "✅ Success" : "❌ Failed"} - ${message.message || ""}`);
          }
        }
        else if (message.type === "waypoint_status_update") {
          const { waypointId, status, arrivalTime } = message;

          setCurrentWaypoints(prev => prev.map(wp =>
            wp.id === waypointId
              ? { ...wp, status, arrivalTime }
              : wp
          ));

          addLog(`📍 Waypoint ${waypointId}: ${status}`);
        }
        else if (message.type === "automation_status") {
          const { isActive, currentWaypointIndex, totalWaypoints, progress } = message;

          setAutomationStatus({
            isActive,
            currentWaypointIndex,
            totalWaypoints,
            progress
          });

          addLog(`🤖 Automation: ${isActive ? 'Active' : 'Inactive'} - Progress: ${progress}%`);
        }
        else if (message.type === "navigation_status") {
          const { command, status, message: navMessage, currentPosition, missionActive } = message;

          addLog(`🧭 Navigation Update: ${command} - ${status} - ${navMessage || ""}`);

          if (currentPosition) {
            setDroneTelemetry(prev => ({
              ...prev,
              position: {
                latitude: currentPosition.latitude,
                longitude: currentPosition.longitude
              },
              altitude: currentPosition.altitude
            }));
          }

          if (status === "completed" || status === "stopped" || status === "failed" || !missionActive) {
            setNavigationStatus({
              isNavigating: false,
              command: null,
              message: ""
            });

            if (status === "stopped") {
              addLog("⏹️ Mission stopped successfully");
            }
          } else {
            setNavigationStatus(prev => ({
              ...prev,
              isNavigating: missionActive !== false,
              message: navMessage || `${command} ${status}`
            }));
          }
        }
        // Optional: Log other messages (except video_frame)
        else if (message.type !== "video_frame") {
          addLog(`Received: ${JSON.stringify(message)}`);
        }
      }
    });


    // ✅ Assign new client
    setDroneClient(newClient);
    clientRef.current = newClient;

    try {
      await newClient.connect();
      setConnectingDrone(false);
    } catch {
      setConnectingDrone(false);
    }
  };


  const handleRegisterAndroidApp = async () => {
    if (!droneClient || !connected) return;

    try {
      setRegistrationStatus("Registering...");
      await droneClient.sendCommand("register_app");

      addLog("App registration command sent");
    } catch (error: unknown) {
      setRegisteredAndroidApp(false);
      setRegistrationStatus("Registration failed");
      setAppRegistered(false);
      if (error instanceof Error) {
        addLog(`Failed to register app: ${error.message}`);
      } else {
        addLog("Failed to register app: Unknown error");
      }
    }
  };





  const handleHomeDashboard = () => {
    navigate("/");
  };

  const handleAllDrones = () => {
    navigate("/allDroneViews");
  };

  const handleVideoStream = () => {
    navigate("/videoStream");
  };






  // Add log with timestamp
  const addLog = (message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Handle keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!keyboardControlsEnabled || !droneInfo.isConnected || !appRegistered) return;

      const key = e.key.toLowerCase();
      setActiveKey(key);

      // Define different types of commands
      const movementKeys = ['w', 's', 'a', 'd', 'r', 'f', 'q', 'e'];
      const flightControlKeys = ['t', 'l', 'x']; // takeoff, land, emergency
      const gimbalKeys = ['i', 'k', 'o']; // gimbal up, down, reset

      const isMovementKey = movementKeys.includes(key);
      const isFlightControlKey = flightControlKeys.includes(key);
      const isGimbalKey = gimbalKeys.includes(key);

      // Block movement keys only if virtual stick not enabled
      if (isMovementKey && !virtualStickEnabled) {
        addLog(`Cannot send ${key} command - Virtual Stick not enabled`);
        return;
      }

      // Allow flight control keys (takeoff, land, emergency) regardless of virtual stick status
      if (isFlightControlKey || isGimbalKey || (isMovementKey && virtualStickEnabled)) {
        if (key in keyboardControls) {
          const command = keyboardControls[key as keyof typeof keyboardControls];

          // Special handling for takeoff to set home location
          if (command === "takeoff") {
            handleDroneCommand(command);
            addLog(`🎹 Keyboard command: ${command.toUpperCase()}`);
          } else {
            handleDroneCommand(command);
            addLog(`🎹 Keyboard command: ${command}`);
          }

          e.preventDefault();
        }
      }
    },
    [keyboardControlsEnabled, droneInfo.isConnected, appRegistered, virtualStickEnabled]
  );


  const handleKeyUp = useCallback(() => {
    setActiveKey(null);
  }, []);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Add this function to handle waypoints execution
  const handleExecuteWaypoints = async (waypoints: Waypoint[]) => {
    if (!droneClient || !connected || !appRegistered) {
      addLog("❌ Cannot execute waypoints - drone not ready");
      return;
    }

    try {
      // Validate all waypoints have valid coordinates
      const invalidWaypoints = waypoints.filter(wp =>
        !wp.latitude || !wp.longitude || wp.latitude === 0 || wp.longitude === 0
      );

      if (invalidWaypoints.length > 0) {
        throw new Error("Some waypoints have invalid coordinates");
      }

      // Store waypoints for reference
      setCurrentWaypoints(waypoints);

      // Log the waypoints being sent
      addLog(`🗺️ Starting waypoints mission with ${waypoints.length} points:`);
      waypoints.forEach((wp, index) => {
        addLog(`📍 WP${index}: ${wp.name} (${wp.latitude.toFixed(6)}, ${wp.longitude.toFixed(6)}, ${wp.altitude}m)`);
      });

      await droneClient.sendExecuteWaypoints(waypoints);

      addLog(`✅ Waypoints mission sent successfully`);

    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Failed to execute waypoints: ${error.message}`);
      } else {
        addLog("❌ Failed to execute waypoints: Unknown error");
      }
      throw error; // Re-throw so the modal can handle it
    }
  };



  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (loadingStream && loadingCountdown > 0) {
      timer = setTimeout(() => {
        setLoadingCountdown((prev) => prev - 1);
      }, 1000);
    } else if (loadingStream && loadingCountdown === 0) {
      setLoadingStream(false);
      setVideoActive(true);
      setStreamingStats({
        status: "active",
        message: "Live stream active",
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loadingStream, loadingCountdown]);


  const handleEnableVirtualStick = async () => {
    if (!droneClient || !connected || !appRegistered) return;

    try {
      await droneClient.sendCommand("enable_virtual_stick");
      setVirtualStickEnabled(true); // ✅ Update status
      addLog("✅ Virtual Stick Enabled");
    } catch (error: unknown) {
      setVirtualStickEnabled(false);
      if (error instanceof Error) {
        addLog(`❌ Failed to enable virtual stick: ${error.message}`);
      } else {
        addLog("❌ Failed to enable virtual stick: Unknown error");
      }
    }
  };



  const handleDisconnect = async (): Promise<void> => {
    if (droneClient) {
      addLog("Disconnecting from server...");

      try {
        // Stop object classification first
        if (objectClassificationActive) {
          await droneClient.sendCommand(JSON.stringify({
            type: "object_classification",
            command: "stop"
          }));
          addLog("✅ Object classification stopped on disconnect");
        }

        await droneClient.sendCommand("disable_virtual_stick");
        addLog("✅ Virtual Stick Disabled on disconnect");
      } catch {
        addLog("⚠️ Failed to send cleanup commands on disconnect");
      }

      // Reset all states
      resetObjectClassification();
      droneClient.disconnect();

      // Update React state
      setConnected(false);
      setConnecting(false);
      setVideoActive(false);
      setAndroidConnected(false);
      setAppRegistered(false);
      setRegisteredAndroidApp(false);
      setVirtualStickEnabled(false);
      setRegistrationStatus("Not registered");
      setStreamingStats({
        status: "inactive",
        message: "Streaming inactive",
      });
    }
  };


  interface VideoStatus {
    connected: boolean;
    connecting: boolean;
    framesReceived: number;
    resolution: string;
    fps: number;
    dataRate: number;
    frameSize: number;
    latency: number;
  }

  const handleVideoStatusChange = (status: VideoStatus): void => {
    setVideoConnected(status.connected);
    setVideoConnecting(status.connecting);
    setVideoStats({
      framesReceived: status.framesReceived,
      resolution: status.resolution,
      fps: status.fps,
      dataRate: status.dataRate,
      frameSize: status.frameSize,
      latency: status.latency
    });
  };


  const handleDroneCommand = async (command: string): Promise<void> => {
    if (!droneClient || !connected || !appRegistered) return;

    try {
      await droneClient.sendCommand(command);
      addLog(`Command sent: ${command}`);
      if (command === "takeoff" && !isHomeLocationSet) {
        // Check if we have valid coordinates
        if (droneTelemetry.position.latitude !== 0 && droneTelemetry.position.longitude !== 0) {
          const homePos = {
            latitude: droneTelemetry.position.latitude,
            longitude: droneTelemetry.position.longitude
          };

          setHomeLocation(homePos);
          setIsHomeLocationSet(true);
          addLog(`🏠 Home location set at: ${homePos.latitude.toFixed(6)}, ${homePos.longitude.toFixed(6)}`);
        } else {
          addLog("⚠️ Cannot set home location - GPS coordinates not available");
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`Command failed: ${error.message}`);
      } else {
        addLog("Command failed: Unknown error");
      }
    }
  };


  // Use a more specific type for Leaflet map reference
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletContainerRef = useRef<HTMLDivElement | null>(null);

  // Drone location coordinates
  const [droneLocation, setDroneLocation] = useState<[number, number]>([33.645677, 72.995978]);


  useEffect(() => {
    if (
      droneTelemetry.position.latitude !== 0 &&
      droneTelemetry.position.longitude !== 0 &&
      mapRef.current
    ) {
      import('leaflet').then((L) => {
        const currentLatLng = L.latLng(droneTelemetry.position.latitude, droneTelemetry.position.longitude);
        mapRef.current!.setView(currentLatLng, 18); // Increased zoom for better visibility

        // Remove existing markers before adding new ones
        mapRef.current!.eachLayer((layer: any) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current?.removeLayer(layer);
          }
        });

        // 1. Add Live Drone Position (Animated Green Marker)
        const droneIcon = L.divIcon({
          html: `<div style="
          background: linear-gradient(45deg, #00ff00, #00aa00); 
          border: 3px solid white; 
          border-radius: 50%; 
          width: 24px; 
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 6px rgba(0,255,0,0.6);
          font-size: 12px;
          animation: dronePulse 2s infinite;
          position: relative;
          z-index: 1000;
        ">🚁</div>
        <style>
          @keyframes dronePulse {
            0% { transform: scale(1); box-shadow: 0 3px 6px rgba(0,255,0,0.6); }
            50% { transform: scale(1.2); box-shadow: 0 5px 10px rgba(0,255,0,0.8); }
            100% { transform: scale(1); box-shadow: 0 3px 6px rgba(0,255,0,0.6); }
          }
        </style>`,
          className: 'live-drone-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker(currentLatLng, { icon: droneIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
          <div style="font-family: Arial, sans-serif;">
            <strong>🚁 Live Drone Position</strong><br>
            <span style="color: #00aa00;">● LIVE</span><br>
            <strong>Lat:</strong> ${droneTelemetry.position.latitude.toFixed(6)}<br>
            <strong>Lng:</strong> ${droneTelemetry.position.longitude.toFixed(6)}<br>
            <strong>Alt:</strong> ${droneTelemetry.altitude}m<br>
            <strong>Battery:</strong> ${droneTelemetry.batteryLevel}%<br>
            <strong>Status:</strong> ${automationStatus.isActive ? '🎯 Mission Active' : '⏸️ Standby'}
          </div>
        `)
          .openPopup();

        // 2. Add Home Location (if set)
        if (homeLocation && isHomeLocationSet) {
          const homeLatLng = L.latLng(homeLocation.latitude, homeLocation.longitude);

          const homeIcon = L.divIcon({
            html: `<div style="
            background: #ff4444; 
            border: 3px solid white; 
            border-radius: 50%; 
            width: 22px; 
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(255,68,68,0.5);
            font-size: 12px;
            z-index: 999;
          ">🏠</div>`,
            className: 'home-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          L.marker(homeLatLng, { icon: homeIcon })
            .addTo(mapRef.current!)
            .bindPopup(`
            <div style="font-family: Arial, sans-serif;">
              <strong>🏠 Home Base</strong><br>
              <span style="color: #ff4444;">● Takeoff Point</span><br>
              <strong>Lat:</strong> ${homeLocation.latitude.toFixed(6)}<br>
              <strong>Lng:</strong> ${homeLocation.longitude.toFixed(6)}<br>
              <strong>Status:</strong> Safe Return Point
            </div>
          `);
        }

        // 3. Add Current Waypoints (if any)
        if (currentWaypoints && currentWaypoints.length > 0) {
          const pathCoordinates: [number, number][] = [];

          currentWaypoints.forEach((waypoint, index) => {
            if (!waypoint.isHome) {
              const isCurrent = automationStatus.currentWaypointIndex === index - 1;
              const status = waypoint.status || 'pending';

              let backgroundColor = '#4444ff';
              let borderColor = 'white';
              let emoji = index.toString();

              if (isCurrent) {
                backgroundColor = '#ffa500';
                borderColor = '#ffff00';
                emoji = '🎯';
              } else if (status === 'completed') {
                backgroundColor = '#00aa00';
                emoji = '✓';
              } else if (status === 'failed') {
                backgroundColor = '#aa0000';
                emoji = '✗';
              }

              const waypointIcon = L.divIcon({
                html: `<div style="
                background: ${backgroundColor}; 
                border: 3px solid ${borderColor}; 
                border-radius: 50%; 
                width: 20px; 
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                font-size: 10px;
                color: white;
                font-weight: bold;
                z-index: 998;
                ${isCurrent ? 'animation: waypointPulse 1.5s infinite;' : ''}
              ">
                ${emoji}
              </div>
              <style>
                @keyframes waypointPulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.3); }
                }
              </style>`,
                className: 'waypoint-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              L.marker([waypoint.latitude, waypoint.longitude], { icon: waypointIcon })
                .addTo(mapRef.current!)
                .bindPopup(`
                <div style="font-family: Arial, sans-serif;">
                  <strong>${waypoint.name}</strong><br>
                  <span style="color: ${status === 'completed' ? '#00aa00' :
                    status === 'active' ? '#ffa500' :
                      status === 'failed' ? '#aa0000' : '#4444ff'
                  };">● ${status.toUpperCase()}</span><br>
                  <strong>Lat:</strong> ${waypoint.latitude.toFixed(6)}<br>
                  <strong>Lng:</strong> ${waypoint.longitude.toFixed(6)}<br>
                  <strong>Alt:</strong> ${waypoint.altitude || 50}m<br>
                  ${waypoint.arrivalTime ? `<strong>Arrived:</strong> ${waypoint.arrivalTime}` : ''}
                </div>
              `);

              pathCoordinates.push([waypoint.latitude, waypoint.longitude]);
            }
          });

          // Draw path between waypoints
          if (pathCoordinates.length > 1) {
            // Add home location to start of path if available
            if (homeLocation && isHomeLocationSet) {
              pathCoordinates.unshift([homeLocation.latitude, homeLocation.longitude]);
            }

            const pathLine = L.polyline(pathCoordinates, {
              color: automationStatus.isActive ? '#ff6600' : '#0066ff',
              weight: 3,
              opacity: 0.8,
              dashArray: automationStatus.isActive ? '10, 5' : undefined
            }).addTo(mapRef.current!);

            // Add arrow markers along the path
            const decorator = L.polylineDecorator(pathLine, {
              patterns: [
                {
                  offset: '10%',
                  repeat: '20%',
                  symbol: L.Symbol.arrowHead({
                    pixelSize: 8,
                    polygon: false,
                    pathOptions: {
                      stroke: true,
                      weight: 2,
                      color: automationStatus.isActive ? '#ff6600' : '#0066ff'
                    }
                  })
                }
              ]
            });

            if (typeof decorator.addTo === 'function') {
              decorator.addTo(mapRef.current!);
            }
          }
        }

        // Update drone location state
        setDroneLocation([droneTelemetry.position.latitude, droneTelemetry.position.longitude]);
      });
    }
  }, [
    droneTelemetry.position.latitude,
    droneTelemetry.position.longitude,
    homeLocation,
    isHomeLocationSet,
    currentWaypoints,
    automationStatus,
    droneTelemetry.altitude,
    droneTelemetry.batteryLevel
  ]); // Enhanced dependencies



  // NEW: Function to handle individual waypoint navigation
  const handleGoToLocation = async (latitude: number, longitude: number, altitude?: number): Promise<void> => {
    if (!droneClient || !connected || !appRegistered) {
      addLog("❌ Cannot navigate - drone not ready");
      return;
    }

    try {
      addLog(`🎯 Sending dynamic navigation to: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, ${altitude || 15}m`);

      // Use the enhanced sendGoToLocation method
      await droneClient.sendGoToLocation(latitude, longitude, altitude || 15);

      addLog(`✅ Navigation command sent successfully`);

    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Failed to navigate to location: ${error.message}`);
      } else {
        addLog("❌ Failed to navigate to location: Unknown error");
      }
      throw error; // Re-throw so the modal can handle it
    }
  };


  useEffect(() => {
    const initializeMap = async () => {
      if (typeof window !== 'undefined' && !mapRef.current) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/leaflet.css';
        document.head.appendChild(linkEl);

        const L = await import('leaflet');

        if (leafletContainerRef.current && !mapRef.current) {
          // Initialize the map
          mapRef.current = L.map(leafletContainerRef.current).setView(droneLocation, 30);

          // Add OSM tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapRef.current);

          // Add marker at drone location
          L.marker(droneLocation)
            .addTo(mapRef.current)
            .bindPopup("NSTP - National Science & Technology Park")
            .openPopup(); // Auto open on load
        }
      }
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);


  const handleStartStreaming = async () => {
    if (!droneClient || !connected || !appRegistered) return;
    try {
      await droneClient.sendCommand("start_video_streaming");
      setLoadingStream(true);
      setLoadingCountdown(5); // or whatever countdown you want before stream active
      setStreamingStats({ status: "starting", message: "Starting stream..." });
      addLog("✅ Start streaming command sent");
    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Failed to start streaming: ${error.message}`);
      } else {
        addLog("❌ Failed to start streaming: Unknown error");
      }
    }
  };

  const handleStopStreaming = async () => {
    if (!droneClient || !connected || !appRegistered) return;
    try {
      await droneClient.sendCommand("stop_video_streaming");
      setLoadingStream(false);
      setStreamingStats({ status: "stopping", message: "Stopping stream..." });
      addLog("✅ Stop streaming command sent");
    } catch (error: unknown) {
      if (error instanceof Error) {
        addLog(`❌ Failed to stop streaming: ${error.message}`);
      } else {
        addLog("❌ Failed to stop streaming: Unknown error");
      }
    }
  };


  const movementDisabled = !droneInfo.isConnected || !appRegistered;


  // State for status dropdown visibility



  const resetObjectClassification = useCallback(() => {
    console.log('🔄 Resetting object classification...');
    setObjectClassificationActive(false);
    setClassificationError(null);
    classificationToggleRef.current = false;
  }, []);




  return (
    <div className="flex flex-col w-full h-full text-black">
      {/* Header Section */}
      {/* Header Section - Fixed and Minimized */}
      <header className="mb-4">
        <div className="flex flex-col items-center justify-between gap-2 px-3 py-2 bg-white shadow-md sm:flex-row rounded-xl">
          {/* Left side - Title */}
          <div className="flex items-center gap-2">
            <button
              title="Go to Home Dashboard"
              onClick={handleHomeDashboard}
              className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
            >
              <FaChevronLeft />
            </button>
            <h1 className="text-lg font-bold text-customBlue">Drone Dashboard</h1>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-4">
            {/* Config button */}

            <button
              title="testing Streams"
              onClick={handleVideoStream}
              className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaTerminal size={18} />
            </button>
            <button
              title="All Drone Views"
              onClick={handleAllDrones}
              className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <PiDroneDuotone size={18} />
            </button>
            <button
              title="Config"
              onClick={openConfigModal}
              className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaCog size={18} />
            </button>

            {/* Logs Terminal button */}
            <button
              title="Logs Terminal"
              onClick={() => setLogsModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaTerminal size={18} />
            </button>

            {/* Info button */}
            <button
              title="Drone Info"
              onClick={() => setDroneInfoModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 px-2 text-white rounded-full bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaInfo size={18} />
            </button>



            {/* Status Indicators - Combined in dropdown */}
            <div className="relative">
              <button
                className="flex items-center px-2 py-1 text-xs border rounded-lg hover:bg-gray-100"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <span className="mr-1">Status</span>
                <div className="flex">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 mr-1' : 'bg-red-500'} mr-1`}></div>
                  <div className={`w-2 h-2 rounded-full ${androidConnected ? 'bg-green-500 mr-1' : 'bg-red-500'} mr-1`}></div>
                  <div className={`w-2 h-2 rounded-full ${appRegistered ? 'bg-green-500 mr-1' : 'bg-red-500 mr-1'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${virtualStickEnabled ? 'bg-green-500 mr-1' : 'bg-red-500 mr-1'}`}></div>
                  {/* New keyboard controls status circle */}
                  <div className={`w-2 h-2 rounded-full ${keyboardControlsEnabled ? 'bg-green-500 mr-1' : 'bg-red-500 mr-1'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${(streamingStats.status === 'active' || streamingStats.status === 'starting') ? 'bg-green-500' : 'bg-red-500'}`}></div>

                </div>
              </button>

              {/* Status dropdown - only visible when showStatusDropdown is true */}
              {showStatusDropdown && (
                <div className="absolute right-0 z-10 p-2 mt-1 text-xs bg-white border rounded-lg shadow-md w-52">
                  <div className="flex items-center justify-between mb-1">
                    <span>Server:</span>
                    <span className={`${connected ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {connecting ? 'Connecting' : connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span>Android:</span>
                    <span className={`${androidConnected ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {androidConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span>Registration:</span>
                    <span className={`${appRegistered ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {registrationStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span>Virtual Stick:</span>
                    <span className={`${virtualStickEnabled ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {virtualStickEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {/* New keyboard controls status row */}
                  <div className="flex items-center justify-between mb-1">
                    <span>Keyboard Controls:</span>
                    <span className={`${keyboardControlsEnabled ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {keyboardControlsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {/* New streaming status row */}
                  <div className="flex items-center justify-between mb-1">
                    <span>Streaming:</span>
                    <span className={`${(streamingStats.status === 'active' || streamingStats.status === 'starting') ? 'text-green-500' : 'text-red-500'} font-medium`}>
                      {streamingStats.status.charAt(0).toUpperCase() + streamingStats.status.slice(1)}
                    </span>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </header>
      <div className="w-full mx-auto">

        <div className="w-full mb-6">
          {/* Middle Column - Video Feed */}
          <div className="flex flex-col gap-6">
            <div className="grid w-full grid-cols-3 gap-4">
              {/* Drone Feed Card */}
              <div className="col-span-2 overflow-hidden bg-gray-100 border shadow-md rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 text-white bg-customBlue rounded-t-2xl">
                  <h2 className="flex items-center text-lg font-semibold">
                    <FaCamera className="mr-2" /> Live Video Feed
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* View Selection Buttons */}
                    <div className="flex p-1 mr-4 rounded-lg bg-white/20">
                      <button
                        onClick={() => setActiveVideoView('surveillance')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${activeVideoView === 'surveillance'
                          ? 'bg-white text-customBlue'
                          : 'text-white hover:bg-white/20'
                          }`}
                      >
                        Surveillance
                      </button>
                      <button
                        onClick={() => setActiveVideoView('backup')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${activeVideoView === 'backup'
                          ? 'bg-white text-customBlue'
                          : 'text-white hover:bg-white/20'
                          }`}
                      >
                        Backup
                      </button>
                      <button
                        onClick={() => setActiveVideoView('both')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-all ${activeVideoView === 'both'
                          ? 'bg-white text-customBlue'
                          : 'text-white hover:bg-white/20'
                          }`}
                      >
                        Both
                      </button>
                    </div>
                    {connected && (
                      <>
                        <button
                          onClick={handleStartStreaming}
                          disabled={streamingStats.status === "starting" || streamingStats.status === "active"}
                          className="px-2 py-1 text-xs font-medium text-white bg-green-600 border border-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Start Stream
                        </button>
                        <button
                          onClick={handleStopStreaming}
                          disabled={streamingStats.status === "stopping" || streamingStats.status === "inactive"}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-600 border border-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Stop Stream
                        </button>
                      </>
                    )}
                  </div>


                </div>

                {/* Video Area */}
                <div className="relative h-[47vh] bg-black rounded-b-2xl overflow-hidden">
                  {renderVideoContent()}

                  {/* Classification Error Display */}
                  {classificationError && (
                    <div className="absolute z-30 px-3 py-2 text-sm text-white bg-red-600 rounded-lg top-20 left-4">
                      <div className="font-medium">Classification Error:</div>
                      <div className="text-xs">{classificationError}</div>
                    </div>
                  )}
                  <div className="">
                    {/* Top overlays */}
                    <div className="">
                      <button
                        className={`absolute z-10 flex items-center gap-2 px-3 py-3 text-sm text-white rounded top-3 right-5 transition-all duration-300 ${(!droneInfo.isConnected || !appRegistered)
                          ? 'bg-gray-500/40 cursor-not-allowed'
                          : objectClassificationActive
                            ? 'bg-red-500 hover:bg-red-600 shadow-lg'
                            : 'bg-customBlue hover:bg-blue-700'
                          }`}
                        onClick={handleObjectClassification}
                        disabled={!droneInfo.isConnected || !appRegistered}
                        title={objectClassificationActive ? "Stop Object Classification" : "Start Object Classification"}
                      >
                        <FaStreetView
                          size={24}
                          className={objectClassificationActive ? 'animate-pulse' : ''}
                        />
                        <span className="hidden text-xs font-medium sm:inline">
                          {objectClassificationActive ? 'STOP' : 'CLASSIFY'}
                        </span>
                      </button>

                      {objectClassificationActive && (
                        <div className="absolute z-20 px-3 py-1 rounded-lg top-16 left-4 bg-red-500/90">
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <span>Classification Mode Active</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="">

                      <button className={`  absolute z-10 flex items-center gap-2 px-3 py-3 text-sm text-white  rounded top-16 right-5   ${(!droneInfo.isConnected || !appRegistered)
                        ? 'bg-customBlue/40'
                        : 'bg-customBlue'
                        }`}
                        title="Object Tracking"

                      >
                        <FaUserAstronaut size={24} />

                      </button>
                    </div>
                    <div className="">
                      <div className={`  absolute z-10 flex items-center gap-2 px-3 py-1 text-sm text-white -translate-x-1/2 rounded top-2 left-1/2   ${(!droneInfo.isConnected || !appRegistered)
                        ? 'bg-gray-500/40'
                        : 'bg-black/40'
                        }`}>
                        <span className={(!droneInfo.isConnected || !appRegistered) ? 'text-gray-400' : 'text-white'}>
                          FT:  {(!droneInfo.isConnected || !appRegistered) ? '0 m' : '2:30:25'}
                        </span>
                      </div>
                    </div>
                    <div className={`${(!droneInfo.isConnected || !appRegistered) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <AltimeterWheel
                        disabled={(!droneInfo.isConnected || !appRegistered)}
                        onAltitudeChange={handleAltitudeChange}
                        minAltitude={-200}
                        maxAltitude={500}
                        step={10}
                      />
                    </div>

                    {/* Bottom overlays */}
                    <div className="absolute flex flex-col items-start gap-1 text-xs text-white bottom-4 left-4">
                      <div className={`absolute z-[99999] bottom-16 -left-2 ${(!droneInfo.isConnected || !appRegistered) ? 'opacity-60' : ''}`}>
                        <div className="">
                          <Compass
                            bearing={(!droneInfo.isConnected || !appRegistered) ? 0 : 200}
                            size={100}
                          />
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-sm text-white rounded ${(!droneInfo.isConnected || !appRegistered)
                        ? 'bg-gray-500/40'
                        : 'bg-black/40'
                        }`}>
                        <span className={(!droneInfo.isConnected || !appRegistered) ? 'text-gray-400' : 'text-white'}>
                          D: {(!droneInfo.isConnected || !appRegistered) ? '0 m' : '2532 m'}
                        </span>
                      </div>
                    </div>
                    <div className={`absolute px-3 py-1 text-sm text-white -translate-x-1/2 rounded bottom-4 left-1/2 ${(!droneInfo.isConnected || !appRegistered)
                      ? 'bg-gray-500/40'
                      : 'bg-black/40'
                      }`}>
                      <span className={(!droneInfo.isConnected || !appRegistered) ? 'text-gray-400' : 'text-white'}>
                        S: {(!droneInfo.isConnected || !appRegistered) ? '0 km/h' : '20 km/h'}
                      </span>
                    </div>
                  </div>
                  {/* Gimbal Controls Floating Overlay */}
                  <div className={`absolute z-20 bottom-8 right-4 ${(!droneInfo.isConnected || !appRegistered) ? 'opacity-100' : ''}`}>
                    <h1 className={`mb-6 text-sm text-center ${(!droneInfo.isConnected || !appRegistered) ? 'text-gray-400' : 'text-gray-200'
                      }`}>
                      Gimble Controller
                    </h1>
                    <div className={`relative w-32 h-32 border rounded-full shadow-xl backdrop-blur-md ${(!droneInfo.isConnected || !appRegistered)
                      ? 'border-gray-600 bg-gray-600/40'
                      : 'border-gray-500 bg-black/40'
                      }`}>
                      <button
                        onClick={() => handleDroneCommand("gimbal_up")}
                        disabled={!droneInfo.isConnected || !appRegistered}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-white text-xs font-bold rounded-full shadow ${(!droneInfo.isConnected || !appRegistered)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                          } ${activeKey === 'i' && droneInfo.isConnected && appRegistered ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        I
                      </button>
                      <button
                        onClick={() => handleDroneCommand("gimbal_down")}
                        disabled={!droneInfo.isConnected || !appRegistered}
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-7 h-7 text-white text-xs font-bold rounded-full shadow ${(!droneInfo.isConnected || !appRegistered)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600'
                          } ${activeKey === 'k' && droneInfo.isConnected && appRegistered ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        K
                      </button>
                      <div className={`absolute top-[12%] left-1/2 -translate-x-1/2 text-white ${(!droneInfo.isConnected || !appRegistered) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}>
                        <FaCaretUp
                          className="text-lg"
                          onClick={() => droneInfo.isConnected && appRegistered && handleDroneCommand("gimbal_up")}
                        />
                      </div>
                      <div className={`absolute bottom-[12%] left-1/2 -translate-x-1/2 text-white ${(!droneInfo.isConnected || !appRegistered) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}>
                        <FaCaretDown
                          className="text-lg"
                          onClick={() => droneInfo.isConnected && appRegistered && handleDroneCommand("gimbal_down")}
                        />
                      </div>
                      <div className={`absolute left-[12%] top-1/2 -translate-y-1/2 text-white ${(!droneInfo.isConnected || !appRegistered) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}>
                        <FaCaretLeft
                          className="text-lg"
                          onClick={() => droneInfo.isConnected && appRegistered && handleDroneCommand("gimbal_left")}
                        />
                      </div>
                      <div className={`absolute right-[12%] top-1/2 -translate-y-1/2 text-white ${(!droneInfo.isConnected || !appRegistered) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}>
                        <FaCaretRight
                          className="text-lg"
                          onClick={() => droneInfo.isConnected && appRegistered && handleDroneCommand("gimbal_right")}
                        />
                      </div>
                      <button
                        onClick={() => handleDroneCommand("gimbal_reset")}
                        disabled={!droneInfo.isConnected || !appRegistered}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white shadow ${(!droneInfo.isConnected || !appRegistered)
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-gray-400 hover:bg-gray-500'
                          } ${activeKey === 'o' && droneInfo.isConnected && appRegistered ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        <FaSyncAlt />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Drone Info Card */}
              <div className="">
                <AnimatedDrone
                  isConnected={droneInfo.isConnected}
                  batteryLevel={droneTelemetry.batteryLevel}
                  temperature={droneTelemetry.temperature}
                  flightTime={droneStats.remainingFlightTime || 30}
                  payload={droneInfo.payloadCapacity || 20}
                  latitude={droneTelemetry.position.latitude}
                  longitude={droneTelemetry.position.longitude}
                  altitude={droneTelemetry.altitude}
                  maxDistance={droneInfo.maxDistance || "2-4Km"}
                  droneModel={droneInfo.model || "DJI Drone"}
                  serialNumber={droneInfo.serialNumber || "Unknown"}
                  firmwareVersion={droneInfo.firmwareVersion || "Unknown"}
                  isHomeLocationSet={isHomeLocationSet}
                />

              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-4">
              <div className={`col-span-2 relative ${!droneInfo.isConnected || !appRegistered ? 'opacity-100 grayscale' : ''}`}>
                {/* Full View Button Overlay */}
                <button
                  onClick={() => setDynamicMapModalOpen(true)}
                  className="absolute z-20 flex items-center justify-center px-3 py-3 text-white transition-colors bg-blue-600 rounded-lg shadow-lg top-2 right-2 hover:bg-blue-700"
                  title="Open Full Map View"
                >
                  <FaExpandArrowsAlt size={24} />
                </button>
                <button
                  onClick={() => setWaypointsModalOpen(true)}
                  className="absolute z-20 flex items-center justify-center px-3 py-3 text-white transition-colors bg-blue-600 rounded-lg shadow-lg top-16 right-2 hover:bg-blue-700"
                  title="Way Points"
                >
                  <FaRoute size={24} />

                </button>
                <div ref={leafletContainerRef} className="w-full h-full" />

                {/* Fallback display if map doesn't load */}
                <div id="map-loading" className="absolute inset-0 z-0 flex items-center justify-center bg-gray-200">
                  <div className="text-center">
                    <FaMapMarkerAlt className="mx-auto mb-2 text-2xl text-gray-400" />
                    <p className={`${(!droneInfo.isConnected || !appRegistered) ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(!droneInfo.isConnected || !appRegistered) ? 'Map unavailable - Connect drone first' : 'Loading map...'}
                    </p>
                    <button
                      onClick={() => setDynamicMapModalOpen(true)}
                      className="px-4 py-2 mt-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Open Full Map
                    </button>
                  </div>
                </div>

                {/* Disabled overlay when disconnected */}
                {(!droneInfo.isConnected || !appRegistered) && (
                  <div className="absolute inset-0 z-10 bg-black rounded-lg pointer-events-none bg-opacity-20" />
                )}

                {/* Mini Map Info Overlay */}
                {(droneInfo.isConnected && appRegistered) && (
                  <div className="absolute z-20 p-2 text-xs bg-white rounded-lg bottom-2 left-2 bg-opacity-90">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Tracking Active</span>
                    </div>
                    <div className="mt-1 text-gray-600">
                      {currentWaypoints.length} waypoints • {automationStatus.isActive ? 'Mission Active' : 'Standby'}
                    </div>
                  </div>
                )}
              </div>


              <div className="">
                {/* Directional Controls Card */}
                <div className="flex items-center justify-between gap-4">
                  {/* Flight Control Actions */}
                  <div className="w-full h-full">
                    {/* Replace your entire Flight Controls section with this enhanced version */}

                    <div className={`bg-white border border-gray-200 shadow-lg rounded-2xl ${!droneInfo.isConnected || !appRegistered ? 'opacity-100 ' : ''}`}>
                      <div className="px-5 py-3 text-base font-semibold text-gray-700 border-b bg-gray-50 rounded-t-2xl">
                        Flight Controls
                        {/* Navigation Status Indicator */}
                        {navigationStatus.isNavigating && (
                          <div className="flex items-center mt-2 text-sm">
                            <svg className="w-4 h-4 mr-1 text-blue-600 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-blue-600">{navigationStatus.message}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-5">
                        {/* Takeoff */}
                        <button
                          onClick={() => handleDroneCommand("takeoff")}
                          disabled={movementDisabled || navigationStatus.isNavigating}
                          className={`relative flex flex-col items-center justify-center h-28 px-4 py-2 font-semibold text-white shadow rounded-xl ${movementDisabled || navigationStatus.isNavigating
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${movementDisabled || navigationStatus.isNavigating ? 'bg-gray-400' : 'bg-blue-400'
                            }`}>T</span>
                          <FaArrowUp className="mb-1 text-xl" />
                          Takeoff
                        </button>

                        {/* Land */}
                        <button
                          onClick={() => handleDroneCommand("land")}
                          disabled={movementDisabled}
                          className={`relative flex flex-col items-center justify-center h-28 px-4 py-2 font-semibold text-white shadow rounded-xl ${movementDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${movementDisabled ? 'bg-gray-400' : 'bg-blue-400'
                            }`}>L</span>
                          <FaArrowDown className="mb-1 text-xl" />
                          Land
                        </button>


                        {/* NEW AUTO TAKEOFF + NAVIGATE BUTTON */}
                        <button
                          onClick={handleAutoTakeoffAndNavigate}
                          disabled={!connected || !appRegistered || navigationStatus.isNavigating}
                          className={`relative flex flex-col items-center justify-center h-28 px-4 py-2 font-semibold text-white shadow rounded-xl transition-all duration-300 ${(!connected || !appRegistered || navigationStatus.isNavigating)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105'
                            }`}
                          title={
                            navigationStatus.isNavigating && navigationStatus.command === "auto_takeoff_navigate"
                              ? "Auto mission in progress..."
                              : "Auto Takeoff + Navigate to Target Location"
                          }
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${(!connected || !appRegistered || navigationStatus.isNavigating)
                            ? 'bg-gray-400'
                            : 'bg-yellow-400'
                            }`}>
                            AUTO
                          </span>

                          {navigationStatus.isNavigating && navigationStatus.command === "auto_takeoff_navigate" ? (
                            <div className="flex flex-col items-center">
                              <svg className="w-6 h-6 mb-1 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm">Auto Mission</span>
                              <span className="text-xs opacity-75">In Progress...</span>
                            </div>
                          ) : (
                            <>
                              <div className="mb-1 text-2xl">🚀</div>
                              <span className="text-sm text-center">Auto Takeoff</span>
                              <span className="text-xs opacity-75">+ Navigate</span>
                            </>
                          )}
                        </button>



                        {/* Go Home - Enhanced */}
                        <button
                          onClick={handleGoToHome}
                          disabled={!connected || !appRegistered} // Only disabled if not connected to server
                          className={`relative flex flex-col items-center justify-center h-24 px-4 py-2 font-semibold text-white shadow rounded-xl ${(!connected || !appRegistered)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600' // Changed to red to indicate emergency stop
                            }`}
                          title="Emergency stop all operations"
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${(!connected || !appRegistered) ? 'bg-gray-400' : 'bg-yellow-400'
                            }`}>
                            X
                          </span>

                          <FaUndo className="mb-1 text-xl" />
                          STOP EVERYTHING
                        </button>

                        {/* Return to Home (RTH) - New button */}
                        <button
                          onClick={handleReturnToHome}
                          disabled={movementDisabled || navigationStatus.isNavigating}
                          className={`relative flex flex-col items-center justify-center h-24 px-4 py-2 font-semibold text-white shadow rounded-xl ${movementDisabled || navigationStatus.isNavigating
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                          title={
                            navigationStatus.isNavigating
                              ? "Navigation in progress..."
                              : "Use DJI's built-in Return to Home"
                          }
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${movementDisabled || navigationStatus.isNavigating ? 'bg-gray-400' : 'bg-blue-400'
                            }`}>
                            RTH
                          </span>

                          {navigationStatus.isNavigating && navigationStatus.command === "return_to_home" ? (
                            <div className="flex flex-col items-center">
                              <svg className="w-6 h-6 mb-1 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-xs">Returning...</span>
                            </div>
                          ) : (
                            <>
                              <FaUndo className="mb-1 text-xl" />
                              RTH
                            </>
                          )}
                        </button>

                        {/* Emergency Stop */}
                        <button
                          onClick={() => handleDroneCommand("emergency")}
                          disabled={movementDisabled}
                          className={`col-span-2 relative flex flex-col items-center justify-center h-20 px-4 py-2 font-semibold text-white shadow rounded-xl ${movementDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'
                            }`}
                        >
                          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${movementDisabled ? 'bg-gray-400' : 'bg-orange-400'
                            }`}>X</span>
                          <FaExclamationTriangle className="mb-1 text-xl" />
                          Emergency
                        </button>

                        {/* Stop Navigation - Only show when navigating */}
                        {navigationStatus.isNavigating && (
                          <button
                            onClick={handleStopNavigation}
                            className="relative flex flex-col items-center justify-center h-20 px-4 py-2 font-semibold text-white bg-yellow-500 shadow rounded-xl hover:bg-yellow-600"
                          >
                            <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white bg-red-400">
                              STOP
                            </span>
                            <FaExclamationTriangle className="mb-1 text-xl" />
                            Stop Nav
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Circular Directional Controller */}
                  <div className={`flex items-center  justify-center w-full p-6 bg-white border border-gray-200 shadow-lg rounded-2xl ${!droneInfo.isConnected || !appRegistered ? 'opacity-100 ' : ''}`}>
                    <div className="relative w-full max-w-xs aspect-square">
                      {/* Outer Circle */}
                      <div className="absolute inset-0 bg-gray-100 rounded-full shadow-inner">
                        {/* Inner Controller Area */}
                        <div className={`absolute inset-0 m-10 rounded-full ${movementDisabled ? 'bg-gray-400' : 'bg-gray-700'
                          }`}>
                          <div className={`absolute w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 ${movementDisabled ? 'bg-gray-300' : 'bg-gray-500'
                            }`} />
                          <div className={`absolute top-0 bottom-0 w-1 transform -translate-x-1/2 left-1/2 ${movementDisabled ? 'bg-gray-300' : 'bg-gray-500'
                            }`} />
                          <div className={`absolute left-0 right-0 h-1 transform -translate-y-1/2 top-1/2 ${movementDisabled ? 'bg-gray-300' : 'bg-gray-500'
                            }`} />
                        </div>

                        {/* Direction Buttons */}
                        {[
                          { cmd: "forward", label: "W", pos: "top-4 left-1/2 -translate-x-1/2" },
                          { cmd: "left", label: "A", pos: "top-1/2 left-4 -translate-y-1/2" },
                          { cmd: "backward", label: "S", pos: "bottom-4 left-1/2 -translate-x-1/2" },
                          { cmd: "right", label: "D", pos: "top-1/2 right-4 -translate-y-1/2" },
                          { cmd: "up", label: "R", pos: "top-4 left-4" },
                          { cmd: "down", label: "F", pos: "bottom-4 left-4" },
                          { cmd: "rotate_left", label: "Q", pos: "top-4 right-4" },
                          { cmd: "rotate_right", label: "E", pos: "bottom-4 right-4" },
                        ].map(({ cmd, label, pos }) => (
                          <div key={cmd} className={`absolute ${pos}`}>
                            {["up", "down", "rotate_left", "rotate_right"].includes(cmd) && (
                              <div className={`mb-1 text-xs font-semibold text-center ${movementDisabled ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                {cmd === "up" && "Up"}
                                {cmd === "down" && "Down"}
                                {cmd === "rotate_left" && "RL"}
                                {cmd === "rotate_right" && "RR"}
                              </div>
                            )}
                            <button
                              onClick={() => handleDroneCommand(cmd)}
                              disabled={movementDisabled}
                              className={`flex items-center justify-center w-10 h-10 font-bold text-white rounded-full shadow-md ${movementDisabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                              {label}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <DroneConfigurationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialVideoServerUrl={editingVideoServerUrl}
        initialDroneServerUrl={editingDroneServerUrl}
        onSetVideoServerUrl={handleSetVideoServerUrl}
        onConnectDroneServer={handleConnectDroneServer}
        onRegisterAndroidApp={handleRegisterAndroidApp}
        isConnectingDrone={connectingDrone}
        isRegisteredAndroidApp={registeredAndroidApp} // ye true/false hona chahiye as per disconnect
        isSettingVideoServer={settingVideoServer}
        isDroneConnected={connected}
        onEnableVirtualStick={handleEnableVirtualStick}
        keyboardControlsEnabled={keyboardControlsEnabled}
        onToggleKeyboardControls={toggleKeyboardControls}
        onDisconnectDroneServer={handleDisconnect}

      />

      <DraggableLogsModal
        logs={logs}
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
      />

      <DroneInfoModal
        isOpen={droneInfoModalOpen}
        onClose={() => setDroneInfoModalOpen(false)}
        softwareVersion="DroneSoft v1.2.3"
        appendix="Appendix info goes here..."
        flightTime="2:30:25"
        speed={20}
        distance={2532}
        batteryPercent={0}
        temperature={24}
        remainingTime="30min"
        payloadMax="20Kg"
        latitude={0.0}
        longitude={0.0}
        altitude={0}
        maxDistance="2-4Km"
        flightModes={["Slow", "Normal", "Fast"]}
        serialNumber="Unknown"
        firmwareVersion="Unknown"
        isConnected={false}
      />
      <WaypointsModal
        isOpen={waypointsModalOpen}
        onClose={() => setWaypointsModalOpen(false)}
        homeLocation={homeLocation}
        isHomeLocationSet={isHomeLocationSet}
        currentDroneLocation={droneTelemetry.position}
        onExecuteWaypoints={handleExecuteWaypoints}
        onGoToLocation={handleGoToLocation} // ✅ ADD THIS LINE
        automationStatus={automationStatus}
        currentWaypoints={currentWaypoints}
        onUpdateWaypoints={setCurrentWaypoints}
      />
      <DynamicMapModal
        isOpen={dynamicMapModalOpen}
        onClose={() => setDynamicMapModalOpen(false)}
        homeLocation={homeLocation}
        isHomeLocationSet={isHomeLocationSet}
        currentDroneLocation={droneTelemetry.position}
        currentWaypoints={currentWaypoints}
        automationStatus={automationStatus}
        droneTelemetry={droneTelemetry}
        isConnected={connected}
        appRegistered={appRegistered}
        onGoToLocation={handleGoToLocation}
      />
    </div>
  );
}

export default DroneManagement;