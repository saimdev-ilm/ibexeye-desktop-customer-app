import React from "react";
import { FaRocket, FaTimes } from "react-icons/fa";
import "../../styles/comingsoonmodal.css";
interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string; // Optional, to specify which feature is coming soon
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  featureName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999999999999999999999999999999999999]">
      <div className="bg-white w-11/12 md:w-1/2 lg:w-1/3 p-6 rounded-lg shadow-lg ">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="w-full flex-col text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <FaRocket className="text-customBlue mb-3 pulse-animation" size={48} />
            Coming Soon
          </h2>
        </div>

        {/* Body */}
        <div className="text-center">
          <p className="text-gray-700 text-lg">
            {featureName
              ? `The "${featureName}" feature is coming soon!`
              : "This feature is coming soon!"}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="material-button rounded-full px-4 bg-red-700 hover:bg-red-800 transition"
          >
            <FaTimes size={20} className="me-2" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal;
