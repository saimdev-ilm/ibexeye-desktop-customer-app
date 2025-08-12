import React, { useState } from "react";
import {
  FaVolumeUp,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeMute,
} from "react-icons/fa";

const AudioSettings: React.FC = () => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const toggleMicrophone = () => {
    setMicEnabled((prevState) => !prevState);
  };
  const toggleSpeaker = () => {
    setSpeakerEnabled((prevState) => !prevState);
  };

  return (
    <div className="py-4 space-y-6">
      {/* Microphone Toggle */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          {micEnabled ? (
            <FaMicrophone className="text-gray-500" />
          ) : (
            <FaMicrophoneSlash className="text-red-500" />
          )}
          Microphone
        </label>

        <button
          onClick={toggleMicrophone}
          className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
            micEnabled ? "bg-customBlue" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
              micEnabled ? "translate-x-7" : ""
            }`}
          />
        </button>
      </div>

      {/* Conditional Display */}
      {micEnabled && (
        <>
          {/* Microphone Sensitivity */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <FaMicrophone className="text-gray-500" /> Microphone Sensitivity
            </label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-24 accent-customBlue"
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          {speakerEnabled ? (
            <FaVolumeUp className="text-gray-500" />
          ) : (
            <FaVolumeMute className="text-red-500" />
          )}
          Speaker
        </label>
        <button
          onClick={toggleSpeaker}
          className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
            speakerEnabled ? "bg-customBlue" : "bg-gray-300"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
              speakerEnabled ? "translate-x-7" : ""
            }`}
          />
        </button>
      </div>

      {speakerEnabled && (
        <>
          {/* Volume Level */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <FaVolumeUp className="text-gray-500" /> Volume Level
            </label>
            <input
              type="range"
              min="0"
              max="100"
              className="w-24 accent-customBlue"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AudioSettings;
