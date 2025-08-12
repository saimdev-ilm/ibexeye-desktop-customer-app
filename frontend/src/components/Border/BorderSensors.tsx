import React, { useState } from "react";
import {
  FaWaveSquare,
  FaThermometerHalf,
  FaCamera,
  FaShieldAlt,
  FaCogs,
  FaBroadcastTower,
  FaExclamationCircle,
  FaTimes,
} from "react-icons/fa";

// Sensor Fusion Modal Component
const SensorFusionModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-w-md p-6 bg-white rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>

        <h2 className="text-lg font-bold text-gray-800">
          Sensor Fusion Settings
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure your sensor fusion options below.
        </p>

        {/* Settings Options */}
        <div className="mt-4 space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-gray-800">Camera</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-gray-800">LiDAR</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-gray-800">Radar</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const BorderSensors: React.FC = () => {
  const [activeMode, setActiveMode] = useState<
    "High Alert" | "Default" | "Standby"
  >("High Alert");

  const [isToggled, setIsToggled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleHandler = () => {
    setIsToggled(!isToggled);
  };

  const sensorData = {
    "High Alert": [
      { name: "Sensor Fusion", status: "Active", icon: <FaBroadcastTower /> },
      {
        name: "Motion",
        range: "500 m",
        status: "High",
        icon: <FaWaveSquare />,
      },
      {
        name: "Thermal",
        range: "2 km",
        status: "High",
        icon: <FaThermometerHalf />,
      },
      {
        name: "LIDAR",
        range: "300 m",
        status: "Normal",
        icon: <FaWaveSquare />,
      },
      {
        name: "Radar",
        range: "5 km",
        status: "Monitoring",
        icon: <FaBroadcastTower />,
      },
      {
        name: "Vibration",
        range: "50 m",
        status: "Alert",
        icon: <FaExclamationCircle />,
      },
      {
        name: "Acoustic ",
        range: "300 m",
        status: "Active",
        icon: <FaWaveSquare />,
      },
      {
        name: "Multi-Spec",
        range: "2 km",
        status: "Active",
        icon: <FaCamera />,
      },
      {
        name: "Num Plate",
        range: "50 m",
        status: "Recording",
        icon: <FaCamera />,
      },
      {
        name: "Environmental",
        range: "25°C",
        status: "Normal",
        icon: <FaThermometerHalf />,
      },
      {
        name: "Water",
        range: "Riverbank",
        status: "Critical",
        icon: <FaExclamationCircle />,
      },
    ],
    Default: [
      {
        name: "Motion",
        range: "500 m",
        status: "Normal",
        icon: <FaWaveSquare />,
      },
      {
        name: "Thermal",
        range: "2 km",
        status: "Normal",
        icon: <FaThermometerHalf />,
      },
      {
        name: "LIDAR",
        range: "300 m",
        status: "Normal",
        icon: <FaWaveSquare />,
      },
      {
        name: "Radar",
        range: "5 km",
        status: "Monitoring",
        icon: <FaBroadcastTower />,
      },
    ],
    Standby: [
      {
        name: "Environmental",
        range: "25°C",
        status: "Standby",
        icon: <FaThermometerHalf />,
      },
      {
        name: "Water",
        range: "Riverbank",
        status: "Standby",
        icon: <FaExclamationCircle />,
      },
    ],
  };

  const modes = [
    { name: "High Alert", icon: <FaShieldAlt size={24} /> },
    { name: "Default", icon: <FaShieldAlt size={24} /> },
    { name: "Standby", icon: <FaShieldAlt size={24} /> },
  ];

  const currentSensors = sensorData[activeMode];

  return (
    <div className="px-4 py-3 bg-white shadow 2xl:p-6 rounded-3xl">
      {/* Mode Tabs */}
      <div className="flex justify-center gap-3 pb-3 mb-6 border-b-2 border-opacity-50 2xl:gap-4 border-customBlue">
        {modes.map((mode) => (
          <div
            key={mode.name}
            onClick={() =>
              setActiveMode(mode.name as "High Alert" | "Default" | "Standby")
            }
            className={`relative flex flex-col items-center justify-center w-32 h-20 rounded-3xl border cursor-pointer shadow-md ${
              activeMode === mode.name
                ? "bg-customBlue text-white"
                : "bg-white text-customBlue"
            }`}
          >
            <div className="mb-1">{mode.icon}</div>
            <div className="text-sm font-semibold">{mode.name}</div>
          </div>
        ))}
      </div>
      <div className="h-[61vh] overflow-hidden overflow-y-auto pe-2 custom-scrollbar2">
        <div className="grid grid-cols-2 gap-3 2xl:gap-4 sm:grid-cols-3 lg:grid-cols-3 ">
          {currentSensors.map((sensor, index) => (
            <div
              key={index}
              className="relative cursor-pointer group"
              style={{ height: "130px", width: "100%" }}
            >
              {/* Card Container */}
              <div className="relative w-full h-full transition-transform duration-500 border shadow rounded-2xl">
                {/* Front Side */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transition-opacity duration-500 bg-white rounded-3xl group-hover:opacity-0">
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <div className="mb-2 text-2xl text-customBlue">
                    {sensor.icon}
                  </div>
                  <div className="text-xs font-bold text-gray-700">
                    {sensor.range}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-gray-500 text-nowrap">
                    {sensor.name}
                  </div>
                  <div
                    className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${
                      sensor.status === "High"
                        ? "bg-red-100 text-red-600"
                        : sensor.status === "Critical"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-blue-100 text-customBlue"
                    }`}
                  >
                    {sensor.status}
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white transition-opacity duration-500 opacity-0 bg-customBlue rounded-2xl group-hover:opacity-100">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isToggled}
                      onChange={toggleHandler}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                  <button
                    onClick={() =>
                      sensor.name === "Sensor Fusion" && setIsModalVisible(true)
                    }
                    title="Settings"
                    className="flex items-center justify-center w-8 h-8 mt-3 space-x-1 bg-white rounded-full text-customBlue hover:bg-gray-200"
                  >
                    <FaCogs />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Sensor */}
          <div className="flex flex-col items-center justify-center p-3 bg-gray-100 shadow cursor-pointer rounded-3xl hover:scale-105">
            <div className="text-3xl font-bold text-gray-400">+</div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              Add Sensor
            </div>
          </div>
        </div>
      </div>
      <SensorFusionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </div>
  );
};

export default BorderSensors;
