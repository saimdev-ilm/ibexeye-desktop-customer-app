import React, { useState, useEffect } from "react";

interface DroneConfigurationModalProps {
  isOpen: boolean;
  initialVideoServerUrl: string;
  initialDroneServerUrl: string;
  onClose: () => void;
  onSetVideoServerUrl: (url: string) => void;
  onConnectDroneServer: (url: string) => void;
  onRegisterAndroidApp: () => void;
  onEnableVirtualStick: () => void;
  isConnectingDrone?: boolean;
  isRegisteredAndroidApp?: boolean;
  isSettingVideoServer?: boolean;
  isDroneConnected?: boolean;
  onDisconnectDroneServer?: () => void
  keyboardControlsEnabled?: boolean;
  onToggleKeyboardControls?: () => void;
}

const DroneConfigurationModal: React.FC<DroneConfigurationModalProps> = ({
  isOpen,
  onClose,
  initialVideoServerUrl,
  initialDroneServerUrl,
  onSetVideoServerUrl,
  onConnectDroneServer,
  onRegisterAndroidApp,
  onEnableVirtualStick,
  isConnectingDrone = false,
  isRegisteredAndroidApp = false,
  isSettingVideoServer = false,
  isDroneConnected = false,
  onDisconnectDroneServer,
  keyboardControlsEnabled = false,             // ✅ add this
  onToggleKeyboardControls = () => { },
}) => {
  const [videoServerUrl, setVideoServerUrl] = useState(initialVideoServerUrl);
  const [droneServerUrl, setDroneServerUrl] = useState(initialDroneServerUrl);

  useEffect(() => {
    if (isOpen) {
      setVideoServerUrl(initialVideoServerUrl);
      setDroneServerUrl(initialDroneServerUrl);
    }
  }, [isOpen, initialVideoServerUrl, initialDroneServerUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog" aria-labelledby="drone-config-title">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 id="drone-config-title" className="text-xl font-semibold text-gray-800">
            Drone Configuration
          </h2>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-600 hover:text-gray-900 focus:outline-none">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="video-server-url" className="block mb-1 text-sm font-medium text-gray-700">
            Video Server URL
          </label>
          <div className="flex gap-2">
            <input
              id="video-server-url"
              type="text"
              value={videoServerUrl}
              onChange={(e) => setVideoServerUrl(e.target.value)}
              className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-customBlue"
            />
            <button
              onClick={() => onSetVideoServerUrl(videoServerUrl)}
              disabled={isSettingVideoServer}
              className="px-4 py-2 text-white rounded bg-customBlue hover:bg-blue-700 disabled:opacity-50"
            >
              {isSettingVideoServer ? "Setting..." : "Set"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="drone-server-url" className="block mb-1 text-sm font-medium text-gray-700">
            Drone Server URL
          </label>
          <div className="flex gap-2">
            <input
              id="drone-server-url"
              type="text"
              value={droneServerUrl}
              onChange={(e) => setDroneServerUrl(e.target.value)}
              className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-customBlue"
            />
            {isDroneConnected ? (
              <button
                onClick={onDisconnectDroneServer}
                disabled={isConnectingDrone}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => onConnectDroneServer(droneServerUrl)}
                disabled={isConnectingDrone}
                className="px-4 py-2 text-white rounded bg-customBlue hover:bg-blue-700 disabled:opacity-50"
              >
                {isConnectingDrone ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={onRegisterAndroidApp}
            disabled={isRegisteredAndroidApp}
            className={`w-full px-4 py-2 font-semibold text-white rounded ${isRegisteredAndroidApp ? "bg-green-500 cursor-default" : "bg-customBlue hover:bg-blue-700"} disabled:opacity-50`}
          >
            {isRegisteredAndroidApp ? "Registered" : "Register Android App"}
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={onEnableVirtualStick}
            disabled={!isDroneConnected || !isRegisteredAndroidApp}
            className={`w-full px-4 py-2 font-semibold text-white rounded transition-colors duration-200 ${!isDroneConnected || !isRegisteredAndroidApp
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-customBlue hover:bg-blue-700"
              }`}
          >
            Enable Virtual Stick
          </button>
          {(!isDroneConnected || !isRegisteredAndroidApp) && (
            <p className="mt-1 text-xs text-gray-500">
              {!isDroneConnected
                ? "Connect the drone to enable this feature."
                : "Register Android app to enable virtual stick."}
            </p>
          )}
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Keyboard Controls</h3>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${keyboardControlsEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {keyboardControlsEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <button
            onClick={onToggleKeyboardControls}
            disabled={!isDroneConnected || !isRegisteredAndroidApp}
            className={`w-full px-4 py-2 font-semibold text-white rounded transition-colors duration-200 ${!isDroneConnected || !isRegisteredAndroidApp
                ? "bg-gray-400 cursor-not-allowed"
                : keyboardControlsEnabled
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-customBlue hover:bg-blue-700"
              }`}
          >
            {keyboardControlsEnabled ? "Disable Keyboard Controls" : "Enable Keyboard Controls"}
          </button>

          {(!isDroneConnected || !isRegisteredAndroidApp) && (
            <p className="mt-1 text-xs text-gray-500">
              {!isDroneConnected
                ? "Connect the drone to enable this feature."
                : "Register Android app to enable keyboard controls."}
            </p>
          )}
        </div>



        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DroneConfigurationModal;