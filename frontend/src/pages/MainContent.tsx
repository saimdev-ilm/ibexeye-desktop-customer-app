import React, { useState, useRef, createContext, useContext } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAlertNotifications } from "../hooks/useAlertNotifications";
import { AlertNotificationsList } from "../components/AlertNotificationsList";
import TitleBar from "../components/TitleBar";
import ProfileModal from "../components/ProfileModal";
import SecuritySurveillance from "./SecuritySurveillance";
import CameraDetails from "../components/Smart/CameraDetails";
import AllNotification from "../components/Smart/AllNotification";
import OilGasSurveillance from "./OilGasSurveillance";
import BorderSurveillance from "./BorderSurveillance";
import BorderCameraDetails from "../components/Border/BorderCameraDetails";
import OilGasCameraDetails from "../components/OilGas/OilGasCameraDetails";
import OilGasAllNotification from "../components/OilGas/OilGasAllNotification";
import BorderAllNotification from "../components/Border/BorderAllNotification";
import VideoCall from "./VideoCall";
import LiveCam from "./LiveCam";
import EmergencyAI from "./EmergencyAI";
import "../styles/MainContent.css";
import DroneFeature from "./DroneFeature";
import OilGasAnalytics from "./OilGasAnalytics";
import GridDashboard from "./Solar/GridDashboard";
import SolarDashboard from "./Solar/SolarDashboard";
import BatteryDashboard from "./Solar/BatteryDashboard";
import LoadDashboard from "./Solar/LoadDashboard";
import CostsDashboard from "./Solar/CostsDashboard";
import AllCameraDashboard from "./Cameras/AllCameraDashboard";
import AllSolarDashboard from "./Solar/AllSolarDashboard";
import KnoxData from "./Solar/KnoxData";
import SolisDashboard from "../components/Smart/Solar/SolisDashboard";
import AllSites from "./Cameras/AllSites";
import ProfileView from "./ProfileView";
import ModesManagemenet from "./ModesManagemenet";
import DroneManagement from "./DroneManagement";
import AllRecordings from "./AllRecordings";
import ROIManager from "./ROIManager";
import ROIEditor from "./ROIEditor";
import UsersManagement from "./UsersManagement";
import AddUser from "./AddUser";
import EditUser from "./EditUser";
import ZoneManagement from "./ZoneManagement";
import AllSensorDashboard from "./AllSensorDashboard";
import AllDroneView from "./AllDroneView";
import DroneMapView from "./DroneMapView";
import VideoStream from "./test/VideoStream";
import DroneWebSocketClient from "../services/DroneWebSocketClient";

interface MainContentProps {
  onLogout: () => void;
}

// ✅ GLOBAL DRONE STATE INTERFACE
interface GlobalDroneState {
  // Connection States
  droneClient: DroneWebSocketClient | null;
  connected: boolean;
  connecting: boolean;
  androidConnected: boolean;
  appRegistered: boolean;
  virtualStickEnabled: boolean;
  keyboardControlsEnabled: boolean;

  // Server URLs
  serverUrl: string;
  videoServerUrl: string;

  // Status and Stats
  streamingStats: {
    status: "inactive" | "starting" | "active" | "stopping" | "error";
    message: string;
  };
  registrationStatus: string;

  // Drone Information
  droneInfo: {
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    isConnected: boolean;
    batteryPercentage?: number;
    isFlying?: boolean;
    payloadCapacity?: number;
    maxDistance?: string;
  };

  // Telemetry Data
  droneTelemetry: {
    position: {
      latitude: number;
      longitude: number;
    };
    altitude: number;
    batteryLevel: number;
    temperature: number;
  };

  // Navigation and Location
  homeLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isHomeLocationSet: boolean;
  navigationStatus: {
    isNavigating: boolean;
    command: string | null;
    message: string;
  };

  // Waypoints and Automation
  currentWaypoints: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    isHome?: boolean;
    status?: 'pending' | 'active' | 'completed' | 'failed';
    arrivalTime?: string;
  }>;
  automationStatus: {
    isActive: boolean;
    currentWaypointIndex: number;
    totalWaypoints: number;
    progress: number;
  };

  // Features
  objectClassificationActive: boolean;
  classificationError: string | null;

  // Logs
  logs: string[];
}

// ✅ CONTEXT TYPE DEFINITION
interface GlobalDroneContextType {
  state: GlobalDroneState;
  updateState: (updates: Partial<GlobalDroneState>) => void;
  resetState: () => void;
  addLog: (message: string) => void;

  // Helper functions for common operations
  setDroneClient: (client: DroneWebSocketClient | null) => void;
  setConnected: (connected: boolean) => void;
  setAndroidConnected: (connected: boolean) => void;
  setAppRegistered: (registered: boolean) => void;
  setVirtualStickEnabled: (enabled: boolean) => void;
  setKeyboardControlsEnabled: (enabled: boolean) => void;
  setStreamingStats: (stats: GlobalDroneState['streamingStats']) => void;
  setRegistrationStatus: (status: string) => void;
  setDroneInfo: (info: Partial<GlobalDroneState['droneInfo']>) => void;
  setDroneTelemetry: (telemetry: Partial<GlobalDroneState['droneTelemetry']>) => void;
  setHomeLocation: (location: GlobalDroneState['homeLocation']) => void;
  setIsHomeLocationSet: (set: boolean) => void;
  setNavigationStatus: (status: GlobalDroneState['navigationStatus']) => void;
  setCurrentWaypoints: (waypoints: GlobalDroneState['currentWaypoints']) => void;
  setAutomationStatus: (status: GlobalDroneState['automationStatus']) => void;
  setObjectClassificationActive: (active: boolean) => void;
  setClassificationError: (error: string | null) => void;
}

// ✅ INITIAL STATE
const initialDroneState: GlobalDroneState = {
  // Connection States
  droneClient: null,
  connected: false,
  connecting: false,
  androidConnected: false,
  appRegistered: false,
  virtualStickEnabled: false,
  keyboardControlsEnabled: false,

  // Server URLs
  serverUrl: "ws://192.168.18.70:5001",
  videoServerUrl: "ws://192.168.18.70:8765",

  // Status and Stats
  streamingStats: {
    status: "inactive",
    message: "Streaming inactive"
  },
  registrationStatus: "Not registered",

  // Drone Information
  droneInfo: {
    model: "Unknown",
    serialNumber: "Unknown",
    firmwareVersion: "Unknown",
    isConnected: false,
    batteryPercentage: 0,
    isFlying: false,
    payloadCapacity: 20,
    maxDistance: "2-4Km"
  },

  // Telemetry Data
  droneTelemetry: {
    position: {
      latitude: 0,
      longitude: 0
    },
    altitude: 0,
    batteryLevel: 0,
    temperature: 24
  },

  // Navigation and Location
  homeLocation: null,
  isHomeLocationSet: false,
  navigationStatus: {
    isNavigating: false,
    command: null,
    message: ""
  },

  // Waypoints and Automation
  currentWaypoints: [],
  automationStatus: {
    isActive: false,
    currentWaypointIndex: -1,
    totalWaypoints: 0,
    progress: 0
  },

  // Features
  objectClassificationActive: false,
  classificationError: null,

  // Logs
  logs: []
};

// ✅ CREATE CONTEXT
const GlobalDroneContext = createContext<GlobalDroneContextType | null>(null);

// ✅ CUSTOM HOOK TO USE DRONE CONTEXT
export const useDroneContext = () => {
  const context = useContext(GlobalDroneContext);
  if (!context) {
    throw new Error("useDroneContext must be used within GlobalDroneProvider");
  }
  return context;
};

// ✅ GLOBAL DRONE STATE PROVIDER COMPONENT
const GlobalDroneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalDroneState>(initialDroneState);
  const stateRef = useRef<GlobalDroneState>(state);

  // Keep ref in sync with state for real-time access
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ✅ UPDATE STATE FUNCTION
  const updateState = (updates: Partial<GlobalDroneState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      console.log('🔄 Drone state updated:', Object.keys(updates));
      return newState;
    });
  };

  // ✅ RESET STATE FUNCTION
  const resetState = () => {
    console.log('🔄 Resetting drone state to initial values');
    setState(initialDroneState);
  };

  // ✅ ADD LOG FUNCTION
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`[DroneContext] ${logEntry}`);

    setState(prev => ({
      ...prev,
      logs: [logEntry, ...prev.logs].slice(0, 100) // Keep last 100 logs
    }));
  };

  // ✅ HELPER FUNCTIONS FOR COMMON OPERATIONS
  const setDroneClient = (client: DroneWebSocketClient | null) => {
    updateState({ droneClient: client });
    addLog(`🔗 Drone client ${client ? 'set' : 'cleared'}`);
  };

  const setConnected = (connected: boolean) => {
    updateState({ connected });
    addLog(`🔌 Connection status: ${connected ? 'Connected' : 'Disconnected'}`);
  };

  const setAndroidConnected = (androidConnected: boolean) => {
    updateState({ androidConnected });
    addLog(`📱 Android: ${androidConnected ? 'Connected' : 'Disconnected'}`);
  };

  const setAppRegistered = (appRegistered: boolean) => {
    updateState({
      appRegistered,
      registrationStatus: appRegistered ? "Registered" : "Not registered"
    });
    addLog(`📋 App registration: ${appRegistered ? 'Success' : 'Failed'}`);
  };

  const setVirtualStickEnabled = (virtualStickEnabled: boolean) => {
    updateState({ virtualStickEnabled });
    addLog(`🕹️ Virtual stick: ${virtualStickEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const setKeyboardControlsEnabled = (keyboardControlsEnabled: boolean) => {
    updateState({ keyboardControlsEnabled });
    addLog(`⌨️ Keyboard controls: ${keyboardControlsEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const setStreamingStats = (streamingStats: GlobalDroneState['streamingStats']) => {
    updateState({ streamingStats });
    addLog(`📹 Streaming: ${streamingStats.status}`);
  };

  const setRegistrationStatus = (registrationStatus: string) => {
    updateState({ registrationStatus });
    addLog(`📋 Registration status: ${registrationStatus}`);
  };

  const setDroneInfo = (info: Partial<GlobalDroneState['droneInfo']>) => {
    updateState({
      droneInfo: { ...state.droneInfo, ...info }
    });
    addLog(`🚁 Drone info updated: ${Object.keys(info).join(', ')}`);
  };

  const setDroneTelemetry = (telemetry: Partial<GlobalDroneState['droneTelemetry']>) => {
    updateState({
      droneTelemetry: { ...state.droneTelemetry, ...telemetry }
    });
    // Don't log telemetry updates as they're too frequent
  };

  const setHomeLocation = (homeLocation: GlobalDroneState['homeLocation']) => {
    updateState({ homeLocation });
    if (homeLocation) {
      addLog(`🏠 Home location set: ${homeLocation.latitude.toFixed(6)}, ${homeLocation.longitude.toFixed(6)}`);
    } else {
      addLog(`🏠 Home location cleared`);
    }
  };

  const setIsHomeLocationSet = (isHomeLocationSet: boolean) => {
    updateState({ isHomeLocationSet });
    addLog(`🏠 Home location ${isHomeLocationSet ? 'set' : 'unset'}`);
  };

  const setNavigationStatus = (navigationStatus: GlobalDroneState['navigationStatus']) => {
    updateState({ navigationStatus });
    addLog(`🧭 Navigation: ${navigationStatus.isNavigating ? 'Active' : 'Inactive'} - ${navigationStatus.message}`);
  };

  const setCurrentWaypoints = (currentWaypoints: GlobalDroneState['currentWaypoints']) => {
    updateState({ currentWaypoints });
    addLog(`📍 Waypoints updated: ${currentWaypoints.length} points`);
  };

  const setAutomationStatus = (automationStatus: GlobalDroneState['automationStatus']) => {
    updateState({ automationStatus });
    addLog(`🤖 Automation: ${automationStatus.isActive ? 'Active' : 'Inactive'} - ${automationStatus.progress}%`);
  };

  const setObjectClassificationActive = (objectClassificationActive: boolean) => {
    updateState({ objectClassificationActive });
    addLog(`🧠 Object classification: ${objectClassificationActive ? 'Active' : 'Inactive'}`);
  };

  const setClassificationError = (classificationError: string | null) => {
    updateState({ classificationError });
    if (classificationError) {
      addLog(`❌ Classification error: ${classificationError}`);
    }
  };

  const contextValue: GlobalDroneContextType = {
    state,
    updateState,
    resetState,
    addLog,

    // Helper functions
    setDroneClient,
    setConnected,
    setAndroidConnected,
    setAppRegistered,
    setVirtualStickEnabled,
    setKeyboardControlsEnabled,
    setStreamingStats,
    setRegistrationStatus,
    setDroneInfo,
    setDroneTelemetry,
    setHomeLocation,
    setIsHomeLocationSet,
    setNavigationStatus,
    setCurrentWaypoints,
    setAutomationStatus,
    setObjectClassificationActive,
    setClassificationError
  };

  return (
    <GlobalDroneContext.Provider value={contextValue}>
      {children}
    </GlobalDroneContext.Provider>
  );
};

// ✅ ENHANCED TITLEBAR COMPONENT
const ConditionalTitleBar: React.FC = () => {
  const location = useLocation();
  const { state } = useDroneContext();

  const isDroneManagementPage = location.pathname === "/droneManagement";

  return (
    <TitleBar
      droneClient={state.droneClient}
      connected={state.connected}
      connecting={state.connecting}
      androidConnected={state.androidConnected}
      appRegistered={state.appRegistered}
      virtualStickEnabled={state.virtualStickEnabled}
      keyboardControlsEnabled={state.keyboardControlsEnabled}
      streamingStats={state.streamingStats}
      registrationStatus={state.registrationStatus}
      // Pass config modal handler only if not on drone management page
      onConfigModalOpen={isDroneManagementPage ? undefined : undefined}
    />
  );
};

// ✅ ENHANCED DRONE MANAGEMENT WRAPPER WITH COMPLETE STATE SYNC
const DroneManagementWrapper: React.FC = () => {
  const droneContext = useDroneContext();

  // ✅ Convert global state to props for DroneManagement component - COMPLETE INTEGRATION
  const droneManagementProps = {
    // Primary connection states
    initialDroneClient: droneContext.state.droneClient,
    onDroneClientChange: droneContext.setDroneClient,
    initialConnected: droneContext.state.connected,
    onConnectedChange: droneContext.setConnected,
    initialConnecting: droneContext.state.connecting,
    onConnectingChange: (connecting: boolean) => droneContext.updateState({ connecting }),
    initialAndroidConnected: droneContext.state.androidConnected,
    onAndroidConnectedChange: droneContext.setAndroidConnected,
    initialAppRegistered: droneContext.state.appRegistered,
    onAppRegisteredChange: droneContext.setAppRegistered,
    initialVirtualStickEnabled: droneContext.state.virtualStickEnabled,
    onVirtualStickEnabledChange: droneContext.setVirtualStickEnabled,
    initialKeyboardControlsEnabled: droneContext.state.keyboardControlsEnabled,
    onKeyboardControlsEnabledChange: droneContext.setKeyboardControlsEnabled,
    initialStreamingStats: droneContext.state.streamingStats,
    onStreamingStatsChange: droneContext.setStreamingStats,
    initialRegistrationStatus: droneContext.state.registrationStatus,
    onRegistrationStatusChange: droneContext.setRegistrationStatus,

    // ✅ CRITICAL: Pass initial state values for ALL additional states
    initialDroneInfo: droneContext.state.droneInfo,
    initialDroneTelemetry: droneContext.state.droneTelemetry,
    initialHomeLocation: droneContext.state.homeLocation,
    initialIsHomeLocationSet: droneContext.state.isHomeLocationSet,
    initialNavigationStatus: droneContext.state.navigationStatus,
    initialCurrentWaypoints: droneContext.state.currentWaypoints,
    initialAutomationStatus: droneContext.state.automationStatus,
    initialObjectClassificationActive: droneContext.state.objectClassificationActive,
    initialClassificationError: droneContext.state.classificationError,
    initialLogs: droneContext.state.logs,

    // ✅ Additional state sync handlers
    onDroneInfoChange: droneContext.setDroneInfo,
    onDroneTelemetryChange: droneContext.setDroneTelemetry,
    onHomeLocationChange: droneContext.setHomeLocation,
    onIsHomeLocationSetChange: droneContext.setIsHomeLocationSet,
    onNavigationStatusChange: droneContext.setNavigationStatus,
    onCurrentWaypointsChange: droneContext.setCurrentWaypoints,
    onAutomationStatusChange: droneContext.setAutomationStatus,
    onObjectClassificationActiveChange: droneContext.setObjectClassificationActive,
    onClassificationErrorChange: droneContext.setClassificationError,
    onLogsChange: (logs: string[]) => droneContext.updateState({ logs })
  };

  return <DroneManagement {...droneManagementProps} />;
};

// ✅ DRONE FEATURE WRAPPER (if DroneFeature needs global state)
const DroneFeatureWrapper: React.FC = () => {
  const { state } = useDroneContext();

  // Pass global drone state to DroneFeature if it needs it
  return <DroneFeature droneState={state} />;
};

// ✅ ALL DRONE VIEW WRAPPER (if it needs global state)
const AllDroneViewWrapper: React.FC = () => {
  const { state } = useDroneContext();

  // Pass global drone state to AllDroneView if it needs it
  return <AllDroneView droneState={state} />;
};

// ✅ DRONE MAP VIEW WRAPPER (if it needs global state)
const DroneMapViewWrapper: React.FC = () => {
  const { state } = useDroneContext();

  // Pass global drone state to DroneMapView if it needs it
  return <DroneMapView droneState={state} />;
};

// ✅ MAIN CONTENT COMPONENT
const MainContent: React.FC<MainContentProps> = ({ onLogout }) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Initialize alert notifications
  useAlertNotifications();

  const handleCloseProfileModal = () => setIsProfileModalOpen(false);

  return (
    <Router>
      <GlobalDroneProvider>
        <div className="relative flex flex-col h-screen bg-theme text-theme">
          {/* ✅ ENHANCED CONDITIONAL TITLEBAR WITH GLOBAL STATE */}
          <ConditionalTitleBar />

          {/* Main Content */}
          <div className="flex-grow p-4 overflow-y-auto">
            <Routes>
              <Route path="/" element={<SecuritySurveillance />} />
              <Route path="/sensorsManagement" element={<AllSensorDashboard />} />
              <Route path="/zoneManagement" element={<ZoneManagement />} />

              {/* ✅ ENHANCED DRONE ROUTES WITH GLOBAL STATE */}
              <Route path="/allDroneViews" element={<AllDroneViewWrapper />} />
              <Route path="/droneMapView" element={<DroneMapViewWrapper />} />
              <Route path="/droneManagement" element={<DroneManagementWrapper />} />
              <Route path="/droneFeature" element={<DroneFeatureWrapper />} />

              <Route path="/rOIManager" element={<ROIManager />} />
              <Route path="/videoStream" element={<VideoStream />} />
              <Route path="/usersManagement" element={<UsersManagement />} />
              <Route path="/addUser" element={<AddUser />} />
              <Route path="/editUser/:userId" element={<EditUser />} />
              <Route path="/roi-editor/:cameraId" element={<ROIEditor />} />
              <Route path="/allRecordings" element={<AllRecordings />} />
              <Route path="/modesManagemenet" element={<ModesManagemenet />} />

              <Route path="/knoxData" element={<KnoxData />} />
              <Route path="/profileView" element={<ProfileView />} />
              <Route path="/allSites" element={<AllSites />} />
              <Route path="/goToSolisDashboard" element={<SolisDashboard />} />
              <Route path="/allCameraDashboard" element={<AllCameraDashboard />} />
              <Route path="/allSolarDashboard" element={<AllSolarDashboard />} />
              <Route path="/gridDashboard" element={<GridDashboard />} />
              <Route path="/solarDashboard" element={<SolarDashboard />} />
              <Route path="/batteryDashboard" element={<BatteryDashboard />} />
              <Route path="/loadDashboard" element={<LoadDashboard />} />
              <Route path="/costsDashboard" element={<CostsDashboard />} />
              <Route path="camera/:id" element={<CameraDetails />} />
              <Route path="/LiveCam" element={<LiveCam />} />
              <Route path="/smartAllNotification" element={<AllNotification />} />
              <Route path="/alertNotifications" element={<AlertNotificationsList />} />
              <Route path="/SecuritySurveillance" element={<SecuritySurveillance />} />
              <Route path="/borderCameraDetails" element={<BorderCameraDetails />} />
              <Route path="/borderSurveillance" element={<BorderSurveillance />} />
              <Route path="/borderAllNotification" element={<BorderAllNotification />} />
              <Route path="/OilGasSurveillance" element={<OilGasSurveillance />} />
              <Route path="/OilGasCameraDetails" element={<OilGasCameraDetails />} />
              <Route path="/oilGasAllNotification" element={<OilGasAllNotification />} />
              <Route path="/videoCall" element={<VideoCall />} />
              <Route path="/emergencyAI" element={<EmergencyAI />} />
              <Route path="/profile" element={<div>Profile Content</div>} />
              <Route path="/help" element={<div>Help-Support Content</div>} />
              <Route path="/oilGasAnalytics" element={<OilGasAnalytics />} />

              <Route
                path="/logout"
                element={
                  <div>
                    Logout Content
                    <button
                      className="px-4 py-2 mt-2 text-white bg-red-500 rounded"
                      onClick={onLogout}
                    >
                      Logout
                    </button>
                  </div>
                }
              />
            </Routes>
          </div>

          {/* Modals */}
          <ProfileModal isOpen={isProfileModalOpen} onClose={handleCloseProfileModal} />

          {/* Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </GlobalDroneProvider>
    </Router>
  );
};

export default MainContent;