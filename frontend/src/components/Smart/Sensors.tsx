import React, { useState } from "react";
import {
  FaDoorOpen,
  FaThermometerHalf,
  FaShieldAlt,
  FaHome,
  FaCogs,
  FaBed,
  FaWater, // Water Leakage Icon
  FaTachometerAlt, // Humidity Icon
  FaFire, // Smoke & Fire Icon
} from "react-icons/fa"; // Example icons

const Sensors: React.FC = () => {
  const [activeMode, setActiveMode] = useState<
    "Arm Away" | "Arm Stay" | "Standby"
  >("Arm Away");

  const [isToggled, setIsToggled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [, setSelectedSensor] = useState<string | null>(null);

  const toggleHandler = () => {
    setIsToggled(!isToggled);
  };

  // Predefined sensors with their icons
  const predefinedSensors = [
    { name: "Water Leakage", icon: <FaWater size={20} /> },
    { name: "Humidity", icon: <FaTachometerAlt size={20} /> },
    { name: "Smoke & Fire", icon: <FaFire size={20} /> },
    { name: "Temperature", icon: <FaThermometerHalf size={20} /> },
  ];

  const sensorData = {
    "Arm Away": [
      {
        name: "Water Leakage",
        temp: "10c",
        status: "Normal",
        icon: <FaWater size={20} />,
      },
      {
        name: "Humidity",
        temp: "26°C",
        status: "Normal",
        icon: <FaTachometerAlt size={20} />,
      },
      {
        name: "Smoke & Fire",
        temp: "N/A",
        status: "Normal",
        icon: <FaFire size={20} />,
      },
      {
        name: "Temperature",
        temp: "23°C",
        status: "Normal",
        icon: <FaThermometerHalf size={20} />,
      },
      {
        name: "Main Door",
        temp: "23°C",
        status: "Normal",
        icon: <FaDoorOpen size={20} />,
      },
      {
        name: "Kitchen",
        temp: "26°C",
        status: "Normal",
        icon: <FaThermometerHalf size={20} />,
      },
    ],
    "Arm Stay": [
      {
        name: "Water Leakage",
        temp: "N/A",
        status: "Normal",
        icon: <FaWater size={20} />,
      },
      {
        name: "Humidity",
        temp: "24°C",
        status: "Normal",
        icon: <FaTachometerAlt size={20} />,
      },
      {
        name: "Smoke & Fire",
        temp: "N/A",
        status: "Normal",
        icon: <FaFire size={20} />,
      },
      {
        name: "Temperature",
        temp: "23°C",
        status: "Normal",
        icon: <FaThermometerHalf size={20} />,
      },
      {
        name: "Kitchen",
        temp: "24°C",
        status: "Normal",
        icon: <FaThermometerHalf size={20} />,
      },
      {
        name: "Bedroom",
        temp: "23°C",
        status: "Closed",
        icon: <FaDoorOpen size={20} />,
      },
    ],
    Standby: [
      {
        name: "Water Leakage",
        temp: "N/A",
        status: "Normal",
        icon: <FaWater size={20} />,
      },
      {
        name: "Humidity",
        temp: "21°C",
        status: "Normal",
        icon: <FaTachometerAlt size={20} />,
      },
      {
        name: "Smoke & Fire",
        temp: "N/A",
        status: "Normal",
        icon: <FaFire size={20} />,
      },
      {
        name: "Temperature",
        temp: "21°C",
        status: "Normal",
        icon: <FaThermometerHalf size={20} />,
      },
      {
        name: "Garage Door",
        temp: "21°C",
        status: "Closed",
        icon: <FaDoorOpen size={20} />,
      },
      {
        name: "Bedroom",
        temp: "20°C",
        status: "Standby",
        icon: <FaThermometerHalf size={20} />,
      },
    ],
  };

  const modes = [
    {
      name: "Arm Away",
      icon: <FaShieldAlt size={24} />,
      settingsIcon: <FaCogs size={14} />,
    },
    {
      name: "Arm Stay",
      icon: <FaHome size={24} />,
      settingsIcon: <FaCogs size={14} />,
    },
    {
      name: "Standby",
      icon: <FaBed size={24} />,
      settingsIcon: <FaCogs size={14} />,
    },
  ];

  const currentSensors = sensorData[activeMode];

  // Function to toggle the modal visibility
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSensorSelect = (sensorName: string) => {
    setSelectedSensor(sensorName);
    closeModal();
  };

  return (
    <div className="px-4 py-3 bg-white shadow 2xl:p-6 rounded-3xl ">
      {/* Mode Tabs */}
      <div className="flex justify-center gap-3 pb-3 mb-6 border-b-2 border-opacity-50 2xl:gap-4 border-customBlue ">
        {modes.map((mode) => (
          <div
            key={mode.name}
            onClick={() =>
              setActiveMode(mode.name as "Arm Away" | "Arm Stay" | "Standby")
            }
            className={`relative flex flex-col items-center justify-center w-32 h-20 rounded-3xl border cursor-pointer shadow ${
              activeMode === mode.name
                ? "bg-customBlue text-white"
                : "bg-white text-customBlue"
            }`}
          >
            {/* Main Icon */}
            <div className="mb-1">{mode.icon}</div>

            {/* Mode Name */}
            <div className="text-sm font-semibold">{mode.name}</div>

            {/* Settings Icon */}
          </div>
        ))}
      </div>

      <div className="custom-scrollbar2 max-h-[25vh] 2xl:h-[56vh] pe-2 custom-scrollbar2 h-[40vh] overflow-hidden overflow-y-auto">
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
                  {/* Status Dot */}
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full"></div>

                  {/* Sensor Icon */}
                  <div className="mb-1 2xl:text-2xl text-customBlue-500">
                    {sensor.icon}
                  </div>

                  {/* Temperature */}
                  <div className="font-bold text-gray-700 2xl:text-lg">
                    {sensor.temp}
                  </div>

                  {/* Sensor Name */}
                  <div className="mt-1 text-xs font-semibold text-gray-500 text-nowrap">
                    {sensor.name}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`mt-1 text-xs text-nowrap px-2 py-0.5 font-semibold border rounded-full ${
                      sensor.status === "Normal"
                        ? "bg-blue-100 text-customBlue"
                        : sensor.status === "Recording"
                        ? "bg-red-100 text-red-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {sensor.status}
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white transition-opacity duration-500 opacity-0 bg-customBlue rounded-2xl group-hover:opacity-100">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isToggled}
                      onChange={toggleHandler}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>

                  {/* Settings Button */}
                  <button
                    onClick={() => alert(`Settings for ${sensor.name}`)}
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
          <div
            className="flex flex-col items-center justify-center p-3 bg-gray-100 border shadow cursor-pointer rounded-2xl hover:border-customBlue"
            style={{ height: "130px", width: "100%" }}
            onClick={openModal}
          >
            <div className="text-3xl font-bold text-gray-400">+</div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              Add Sensor
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Adding Sensor */}
      {/* Modal for Adding Sensor */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="p-6 bg-white rounded-xl w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">Select Sensor</h2>
            {/* List of Predefined Sensors */}
            <div className="space-y-2">
              {predefinedSensors.map((sensor) => (
                <div
                  key={sensor.name}
                  className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSensorSelect(sensor.name)}
                >
                  {sensor.icon}
                  <span className="ml-2">{sensor.name}</span>
                </div>
              ))}
            </div>
            <button
              className="absolute text-xl text-gray-600 top-2 right-2"
              onClick={closeModal}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sensors;
