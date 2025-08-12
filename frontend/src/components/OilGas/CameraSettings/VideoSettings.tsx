import React from "react";
import { FaRegLightbulb, FaSlidersH, FaExpand } from "react-icons/fa";

const VideoSettings: React.FC = () => {
  return (
    <div className="py-4 space-y-6 ">
      {/* Resolution */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaExpand className="text-gray-500" /> Resolution
        </label>
        <select className="p-2 text-sm border rounded">
          <option>1MP : 1280x720</option>
          <option>2MP (HD) : 1920x1080</option>
          <option>3MP : 2048x1536</option>
          <option>4MP (2K) : 2560x1440</option>
          <option>5MP : 2592x1944</option>
          <option>6MP : 3072x2048</option>
          <option>8MP (4K) : 3840x2160</option>
        </select>
      </div>

      {/* Frame Rate */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaSlidersH className="text-gray-500" /> Frame Rate
        </label>
        <select className="p-2 text-sm border rounded">
          <option>30 FPS</option>
          <option>60 FPS</option>
        </select>
      </div>

      {/* Brightness */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaRegLightbulb className="text-gray-500" /> Brightness
        </label>
        <input type="range" min="0" max="100" className="w-24 accent-customBlue" />
      </div>
    </div>
  );
};

export default VideoSettings;
