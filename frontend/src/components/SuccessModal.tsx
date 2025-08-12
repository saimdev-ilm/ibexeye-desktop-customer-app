import React from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const SuccessModal: React.FC<{ isVisible: boolean; onClose: () => void }> = ({
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-w-sm p-6 bg-white rounded-lg shadow-lg">
            <button
                  onClick={onClose}
                  className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
                  aria-label="Close"
                >
                  <FaTimes size={18} />
                </button>
        {/* Icon and Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 text-white bg-green-600 rounded-full">
            <FaCheckCircle size={24} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Success</h2>
        </div>

        {/* Message */}
        <p className="mt-4 text-gray-600">
          Your changes have been successfully saved!
        </p>

        {/* Action Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-white rounded-full bg-customBlue hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
