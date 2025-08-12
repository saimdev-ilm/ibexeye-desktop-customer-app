import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaTrash,
  FaPhoneAlt,
  FaChevronLeft,
  FaSave,
} from "react-icons/fa";
import Notification from "../components/Smart/RecentAlerts";
import SuccessModal from "../components/SuccessModal";
import CallModal from "../components/CallModal";

const EmergencyAI: React.FC = () => {
  const navigate = useNavigate();
  const [droneEnabled, setDroneEnabled] = useState(true);
  const [selectedZone, setSelectedZone] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([
    "Zone A", // Default location
  ]);
  const [emergencyMessage, setEmergencyMessage] = useState("");
  const [emergencyNumbers, setEmergencyNumbers] = useState<string[]>([
    "1234567890", // Default number
  ]);
  const [newNumber, setNewNumber] = useState("");

  const predefinedZones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"];
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);

  const handleExit = () => {
    navigate("/SecuritySurveillance");
  };

  const toggleDrone = () => {
    setDroneEnabled(!droneEnabled);
  };

  const addLocation = () => {
    if (selectedZone && !savedLocations.includes(selectedZone)) {
      setSavedLocations([...savedLocations, selectedZone]);
      setSelectedZone("");
    }
  };

  const removeLocation = (location: string) => {
    setSavedLocations(savedLocations.filter((loc) => loc !== location));
  };

  const addNumber = () => {
    if (newNumber.trim() !== "") {
      setEmergencyNumbers([...emergencyNumbers, newNumber.trim()]);
      setNewNumber("");
    }
  };

  const removeNumber = (number: string) => {
    setEmergencyNumbers(emergencyNumbers.filter((num) => num !== number));
  };

  const handleSaveClick = () => {
    // Add your save logic here
    setIsSuccessModalVisible(true); // Show the success modal
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleExit}
            title="Back to Home"
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            AI Assistant
          </h1>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-grow gap-4 py-3 2xl:py-4 ">
        {/* Left Panel */}
        <div className="w-3/4">
          <div className="flex flex-col gap-3 ">
            {/* AI Assistant Emergency Call Section */}
            <div className="p-4 bg-white shadow 2xl:p-6 rounded-3xl">
              <h2 className="mb-2 text-base font-bold text-gray-800">
                AI Assistant Emergency Call
              </h2>
              <textarea
                placeholder="Enter your emergency message here"
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-customBlue"
              />
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter a number"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-customBlue"
                />
                <button
                  onClick={addNumber}
                  className="flex items-center justify-center w-8 h-8 font-semibold text-white rounded-full bg-customBlue hover:bg-blue-700"
                >
                  <FaPlus />
                </button>
              </div>
              <ul className="max-h-[11vh] overflow-y-auto custom-scrollbar2 pe-2">
                {emergencyNumbers.map((number) => (
                  <li
                    key={number}
                    className="flex items-center justify-between p-2 mb-2 bg-gray-100 rounded-lg"
                  >
                    <span className="text-gray-700">{number}</span>
                    <button
                      onClick={() => removeNumber(number)}
                      className="flex items-center justify-center w-8 h-8 text-sm text-white bg-red-600 rounded-full hover:bg-red-700"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsCallModalVisible(true)}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-2 font-semibold text-white rounded-full bg-customBlue hover:bg-blue-700"
              >
                <FaPhoneAlt /> Call Now
              </button>
            </div>

            {/* Drone Deployment Section */}
            <div className="p-4 bg-white shadow 2xl:p-6 rounded-3xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-gray-800">
                  Drone Deployment
                </h2>
                <button
                  onClick={toggleDrone}
                  className="flex items-center gap-2 px-4 py-2 font-semibold text-white rounded-full bg-customBlue hover:bg-blue-700"
                >
                  {droneEnabled ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>
              {droneEnabled && (
                <div className="mt-4">
                  <div className="flex gap-3 mb-3">
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-customBlue"
                    >
                      <option value="">Select a Zone</option>
                      {predefinedZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addLocation}
                      className="flex items-center justify-center gap-3 px-4 py-2 font-semibold text-white rounded-full bg-customBlue hover:bg-blue-700"
                    >
                      <FaPlus /> Add Location
                    </button>
                  </div>
                  {savedLocations.length > 0 && (
                    <ul className="max-h-[11vh] overflow-y-auto custom-scrollbar2 pe-2">
                      {savedLocations.map((location, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between p-2 mb-2 text-gray-700 bg-gray-100 rounded-lg"
                        >
                          {location}
                          <button
                            onClick={() => removeLocation(location)}
                            className="flex items-center justify-center w-8 h-8 text-sm text-white bg-red-600 rounded-full hover:bg-red-700"
                          >
                            <FaTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="">
                    <button
                      onClick={handleSaveClick}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-2 font-semibold text-white rounded-full bg-customBlue hover:bg-blue-700"
                    >
                      <FaSave /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel (Notifications) */}
        <div className="w-1/4">
          {/* Replace with your Notification component */}
          <Notification />
        </div>
      </div>
      <SuccessModal
        isVisible={isSuccessModalVisible}
        onClose={() => setIsSuccessModalVisible(false)}
      />
      <CallModal
        isVisible={isCallModalVisible}
        onClose={() => setIsCallModalVisible(false)}
        onConfirm={() => {
          // Handle the call confirmation logic
          setIsCallModalVisible(false);
        }}
      />
    </div>
  );
};

export default EmergencyAI;
