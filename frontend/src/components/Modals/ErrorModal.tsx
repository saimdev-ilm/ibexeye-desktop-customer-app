import React from "react";
import { MdErrorOutline } from "react-icons/md";
import { IoClose } from "react-icons/io5";

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative p-6 text-center bg-white rounded-lg shadow-lg w-80">
        {/* Close Button */}
        <button className="absolute text-gray-500 top-2 right-2 hover:text-gray-700" onClick={onClose}>
          <IoClose className="w-6 h-6" />
        </button>

        {/* Error Icon */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-12 h-12 mb-4 text-red-600 bg-red-100 rounded-full">
            <MdErrorOutline className="w-8 h-8" />
          </div>

          {/* Title & Message */}
          <h2 className="text-xl font-semibold text-gray-800">Error</h2>
          <p className="mt-2 text-gray-600">{message}</p>

          {/* OK Button */}
          <button
            onClick={onClose}
            className="px-6 py-2 mt-4 text-white bg-red-500 rounded-full hover:bg-red-600"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
