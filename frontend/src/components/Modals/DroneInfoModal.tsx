import React from "react";
import { FaTimes } from "react-icons/fa";

interface DroneInfoModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Data props
  softwareVersion: string;
  appendix: string;
  flightTime: string;  // e.g. "2:30:25"
  speed: number;       // in km/h
  distance: number;    // in meters
  batteryPercent: number; 
  temperature: number; // °C
  remainingTime: string; // e.g. "30min"
  payloadMax: string;  // e.g. "20Kg"
  latitude: number;
  longitude: number;
  altitude: number;    // meters
  maxDistance: string; // e.g. "2-4Km"
  flightModes: string[]; // e.g. ["Slow", "Normal", "Fast"]
  serialNumber: string;
  firmwareVersion: string;
  isConnected: boolean;
}

const DroneInfoModal: React.FC<DroneInfoModalProps> = ({
  isOpen,
  onClose,
  softwareVersion,
  appendix,
  flightTime,
  speed,
  distance,
  batteryPercent,
  temperature,
  remainingTime,
  payloadMax,
  latitude,
  longitude,
  altitude,
  maxDistance,
  flightModes,
  serialNumber,
  firmwareVersion,
  isConnected,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="drone-info-title"
    >
      <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="drone-info-title" className="text-2xl font-bold text-gray-800">
            Drone Information
          </h2>
          <button
            onClick={onClose}
            aria-label="Close drone information modal"
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Left Column - Software & Appendix */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-customBlue">Software Information</h3>
            <p className="mb-4 text-gray-700">{softwareVersion || "Unknown"}</p>

            <h3 className="mb-2 text-lg font-semibold text-customBlue">Appendix</h3>
            <p className="mb-4 text-gray-700 whitespace-pre-line">{appendix || "N/A"}</p>

            <h3 className="mb-2 text-lg font-semibold text-customBlue">Flight Time (FT)</h3>
            <p className="mb-4 font-mono text-xl text-gray-700">{flightTime || "00:00:00"}</p>
          </div>

          {/* Middle Column - Key Metrics */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-customBlue">Drone Metrics</h3>
            <ul className="space-y-2 text-gray-800">
              <li><strong>Speed (S):</strong> {speed ?? 0} km/h</li>
              <li><strong>Distance (D):</strong> {distance ?? 0} m</li>
              <li><strong>Battery:</strong> {batteryPercent ?? 0}%</li>
              <li><strong>Temperature:</strong> {temperature ?? 0}°C</li>
              <li><strong>Remaining Time:</strong> {remainingTime || "N/A"}</li>
              <li><strong>Payload Max:</strong> {payloadMax || "N/A"}</li>
              <li><strong>Latitude:</strong> {latitude?.toFixed(5)}°</li>
              <li><strong>Longitude:</strong> {longitude?.toFixed(5)}°</li>
              <li><strong>Altitude:</strong> {altitude ?? 0} m</li>
              <li><strong>Max Distance:</strong> {maxDistance || "N/A"}</li>
            </ul>
          </div>

          {/* Right Column - Status & Flight Modes */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-customBlue">Status</h3>
            <p className={`mb-4 text-lg font-bold ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isConnected ? "CONNECTED" : "DISCONNECTED"}
            </p>

            <h3 className="mb-2 text-lg font-semibold text-customBlue">Serial Number</h3>
            <p className="mb-4 text-gray-700">{serialNumber || "Unknown"}</p>

            <h3 className="mb-2 text-lg font-semibold text-customBlue">Firmware Version</h3>
            <p className="mb-4 text-gray-700">{firmwareVersion || "Unknown"}</p>

            <h3 className="mb-2 text-lg font-semibold text-customBlue">Flight Modes</h3>
            <div className="flex flex-wrap gap-3">
              {flightModes.map((mode) => (
                <span
                  key={mode}
                  className="px-3 py-1 text-sm font-semibold text-white rounded-full bg-customBlue"
                >
                  {mode}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Shortcuts section */}
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold text-customBlue">Shortcuts</h3>
          <div className="grid grid-cols-4 gap-4 font-mono text-center text-gray-800">
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">T - Takeoff</div>
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">L - Land</div>
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">X - Emergency</div>
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">H - Go Home</div>

            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">I - Gimbal Up</div>
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">K - Gimbal Down</div>
            <div className="p-2 bg-gray-100 rounded shadow-sm cursor-default select-none">O - Gimbal Reset</div>
            {/* Add more shortcuts as needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneInfoModal;
