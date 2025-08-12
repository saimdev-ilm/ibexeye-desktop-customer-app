import React, { useState } from "react";
import {
  FaShieldAlt,
  FaUserShield,
  FaRegMoon,
  FaLightbulb,
  FaAdjust,
} from "react-icons/fa";

const FeaturesSettings: React.FC = () => {
  const [motion, setMotion] = useState(false);
  const [person, setPerson] = useState(false);
  const [detectionEnabled, setDetectionEnabled] = useState(false);
  const [nightEnabled, setNightEnabled] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const toggleNightMode = () => {
    setNightEnabled(!nightEnabled);
  };

  const toggleDetection = () => {
    setDetectionEnabled(!detectionEnabled);
  };

  const toggleSchedule = () => {
    setScheduleEnabled(!scheduleEnabled);
  };

  const togglemotion = () => {
    setMotion(!motion);
  };
  const toggleperson = () => {
    setPerson(!person);
  };

  return (
    <div className="py-2 space-y-2">
      {/* Main Detection Toggle */}
      <div className="p-4 border shadow rounded-3xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-extrabold text-customBlue ">
        <FaShieldAlt className="text-gray-500" /> Detection
          </label>

          <button
            onClick={toggleDetection}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
              detectionEnabled ? "bg-customBlue" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                detectionEnabled ? "translate-x-7" : ""
              }`}
            />
          </button>
        </div>

        {/* Subcategories (Shown only when Detection is ON) */}
        {detectionEnabled && (
          <>
            {/* Motion Detection */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <FaShieldAlt className="text-gray-500" /> Motion
              </label>

              <button
                onClick={togglemotion}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
                  motion ? "bg-customBlue" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                    motion ? "translate-x-7" : ""
                  }`}
                />
              </button>
            </div>

            {/* Person Detection */}
            <div className="flex items-center justify-between pb-2 border-b-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <FaUserShield className="text-gray-500" /> Person
              </label>
              <button
                onClick={toggleperson}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
                  person ? "bg-customBlue" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                    person ? "translate-x-7" : ""
                  }`}
                />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="p-4 border shadow rounded-3xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
          <label className="flex items-center gap-2 text-sm font-extrabold text-customBlue ">
            <FaRegMoon className="text-gray-500" /> Night Vision
          </label>
          <button
            onClick={toggleNightMode}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
              nightEnabled ? "bg-customBlue" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                nightEnabled ? "translate-x-7" : ""
              }`}
            />
          </button>
        </div>
        {nightEnabled && (
          <>
            <div className="py-4 space-y-6">
              {/* Enable Night Vision */}

              {/* Infrared Intensity */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <FaAdjust className="text-gray-500" /> Infrared Intensity
                </label>
                <select className="p-2 text-sm border rounded-full">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              {/* Schedule Night Vision */}
              <div className="p-4 space-y-2 border shadow rounded-3xl">
                {/* Automatic Night Mode */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <FaLightbulb className="text-gray-500" /> Automatic Night
                    Vision
                  </label>
                  <button
                    onClick={toggleSchedule}
                    className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
                      scheduleEnabled ? "bg-customBlue" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                        scheduleEnabled ? "translate-x-7" : ""
                      }`}
                    />
                  </button>{" "}
                </div>
                {scheduleEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-600">
                        Start Time
                      </label>
                      <input
                        type="time"
                        className="p-2 text-sm text-gray-700 border rounded-full"
                        defaultValue="18:00"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-600">
                        End Time
                      </label>
                      <input
                        type="time"
                        className="p-2 text-sm text-gray-700 border rounded-full"
                        defaultValue="06:00"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturesSettings;
