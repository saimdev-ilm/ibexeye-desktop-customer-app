import React from 'react';
import { FaRegMoon, FaAdjust, FaLightbulb, FaToggleOn } from 'react-icons/fa';

const NightVision: React.FC = () => {
  return (
    <div className="py-4 space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
        <FaRegMoon className="text-blue-600" /> Night Vision
      </h2>

      {/* Enable Night Vision */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaToggleOn className="text-gray-500" /> Enable Night Vision
        </label>
        <input type="checkbox" className="w-5 h-5" />
      </div>

      {/* Infrared Intensity */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaAdjust className="text-gray-500" /> Infrared Intensity
        </label>
        <select className="p-2 text-sm border rounded">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      {/* Automatic Night Mode */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaLightbulb className="text-gray-500" /> Automatic Night Mode
        </label>
        <input type="checkbox" className="w-5 h-5" />
      </div>

      {/* Schedule Night Vision */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-600">Schedule Night Vision</p>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-600">Start Time</label>
          <input
            type="time"
            className="p-2 text-sm text-gray-700 border rounded"
            defaultValue="18:00"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-600">End Time</label>
          <input
            type="time"
            className="p-2 text-sm text-gray-700 border rounded"
            defaultValue="06:00"
          />
        </div>
      </div>
    </div>
  );
};

export default NightVision;
