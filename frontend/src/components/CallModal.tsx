import React from "react";
import { FaPhoneAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface CallModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ isVisible, onClose }) => {
  const navigate = useNavigate();

  const handleConfirmCall = () => {
    // Navigate to the call page
    navigate("/videoCall");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-w-sm p-6 bg-white rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        {/* Icon and Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 text-white bg-blue-600 rounded-full">
            <FaPhoneAlt size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Confirm Call</h2>
        </div>

        {/* Message */}
        <p className="mt-4 text-gray-600">
          Are you sure you want to make this call? Once confirmed, the call will
          be initiated immediately.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmCall}
            className="flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-full hover:bg-green-700"
          >
            <FaPhoneAlt className="mr-2" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
