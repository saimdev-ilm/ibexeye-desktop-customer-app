import React, { useState } from "react";
import {
  FaThermometerHalf,
  FaCamera,
  FaShieldAlt,
  FaBroadcastTower,
  FaExclamationCircle,
  FaChartArea,
} from "react-icons/fa";
import StaticSensorChart from "./StaticSensorChart";
import { useNavigate } from "react-router-dom";



const OilGasSensors: React.FC = () => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<
    "High Alert" | "Default" | "Standby" | "Analytics"
  >("High Alert");

  const sensorData = {
    "High Alert": [
      {
        name: "Gas Detector",
        range: "500 m",
        status: "High",
        icon: <FaExclamationCircle size={16} />,
      },
      {
        name: "Temperature",
        range: "48°C",
        status: "Monitoring",
        icon: <FaThermometerHalf size={16} />,
      },
      {
        name: "Pressure",
        range: "48 PSI",
        status: "Normal",
        icon: <FaBroadcastTower size={16} />,
      },
      {
        name: "Vibration",
        range: "2.5 mm/s",
        status: "Monitoring",
        icon: <FaExclamationCircle size={16} />,
      },
      {
        name: "Infrared",
        range: "58°C",
        status: "Alert",
        icon: <FaCamera size={16} />,
      },
      {
        name: "Flow Sensor",
        range: "1150 L/m",
        status: "Active",
        icon: <FaBroadcastTower size={16} />,
      },
      {
        name: "Leakage",
        range: "2 L/m",
        status: "Active",
        icon: <FaBroadcastTower size={16} />,
      },
      {
        name: "Flame",
        range: "No flame",
        status: "Recording",
        icon: <FaCamera size={16} />,
      },
      {
        name: "Smoke",
        range: "0.3 mg/m³",
        status: "Normal",
        icon: <FaThermometerHalf size={16} />,
      },
      {
        name: "Corrosion",
        range: "2.8 mm",
        status: "Critical",
        icon: <FaExclamationCircle size={16} />,
      },
    ],
    Default: [
      {
        name: "Gas Detector",
        range: "500 m",
        status: "Normal",
        icon: <FaExclamationCircle size={16} />,
      },
      {
        name: "Temperature",
        range: "48°C",
        status: "Normal",
        icon: <FaThermometerHalf size={16} />,
      },
      {
        name: "Flow Sensor",
        range: "1150 L/m",
        status: "Active",
        icon: <FaBroadcastTower size={16} />,
      },
      {
        name: "Smoke",
        range: "0.3 mg/m³",
        status: "Normal",
        icon: <FaThermometerHalf size={16} />,
      },
    ],
    Standby: [
      {
        name: "Flame",
        range: "No flame",
        status: "Standby",
        icon: <FaCamera size={16} />,
      },
      {
        name: "Corrosion",
        range: "2.8 mm",
        status: "Standby",
        icon: <FaExclamationCircle size={16} />,
      },
    ],
  };

  const modes = [
    { name: "High Alert", icon: <FaShieldAlt size={24} /> },
    { name: "Default", icon: <FaShieldAlt size={24} /> },
    { name: "Standby", icon: <FaShieldAlt size={24} /> },
  ];

  const currentSensors = sensorData[activeMode];
  const GoToAnalytics = () => {
    navigate("/oilGasAnalytics");
  };

  return (
    <div className="relative">
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
              <div className="text-xs font-semibold">{mode.name}</div>
            </div>
          ))}
        </div>

        {/* Content based on activeMode */}
        <div className="h-[61vh] overflow-hidden overflow-y-auto pe-2 custom-scrollbar2">
          {activeMode === "Analytics" ? (
            <div className="grid grid-cols-2 gap-4">
              <StaticSensorChart sensorName="Gas Detect" />
              <StaticSensorChart sensorName="Temperature" />
              <StaticSensorChart sensorName="Pressure" />
              <StaticSensorChart sensorName="Vibration" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 2xl:gap-4 sm:grid-cols-3 lg:grid-cols-3">
              {currentSensors.map((sensor, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  style={{ height: "130px", width: "100%" }}
                >
                  <div className="relative w-full h-full transition-transform duration-500 border shadow rounded-2xl">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white rounded-3xl">
                      <div className="mb-2 text-2xl text-customBlue">
                        {sensor.icon}
                      </div>
                      <div className="text-xs font-bold text-gray-700">
                        {sensor.range}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-gray-500 text-nowrap">
                        {sensor.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* WhatsApp-like Floating Button */}
          <div className="absolute bottom-4 right-4">
            <button
              className="p-3 rounded-full shadow-lg bg-customBlue hover:bg-blue-800 focus:outline-none"
              onClick={GoToAnalytics}
              title="View Analytics"
            >
              <FaChartArea size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OilGasSensors;
