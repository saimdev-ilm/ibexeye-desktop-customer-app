import React from 'react';
import { FaHdd, FaTrashAlt, FaDatabase, FaClock, FaToolbox } from 'react-icons/fa';

const StorageManagement: React.FC = () => {
  return (
    <div className="py-4 space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
        <FaHdd className="text-blue-600" /> Storage Management
      </h2>

      {/* Storage Usage */}
      <div className="pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaDatabase className="text-gray-500" /> Storage Usage
        </label>
        <div className="h-4 mt-2 overflow-hidden bg-gray-200 rounded-full">
          <div className="w-2/3 h-full bg-blue-600" />
        </div>
        <p className="mt-1 text-xs text-gray-500">Used: 66% | Free: 34%</p>
      </div>

      {/* Retention Period */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaClock className="text-gray-500" /> Retention Period
        </label>
        <select className="p-2 text-sm border rounded">
          <option>7 Days</option>
          <option>14 Days</option>
          <option>30 Days</option>
          <option>Custom</option>
        </select>
      </div>

      {/* Clear Storage */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaTrashAlt className="text-gray-500" /> Clear Storage
        </label>
        <button className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded hover:bg-red-600">
          Clear Now
        </button>
      </div>

      {/* Automatic Cleanup */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <FaToolbox className="text-gray-500" /> Automatic Cleanup
        </label>
        <input type="checkbox" className="w-5 h-5" />
      </div>

      {/* Backup Settings */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-600">Backup Options</p>
        <button className="flex items-center gap-2 px-3 py-1 text-blue-500 border rounded hover:text-blue-600 hover:bg-blue-50">
          <FaHdd /> Configure Backup
        </button>
      </div>
    </div>
  );
};

export default StorageManagement;
