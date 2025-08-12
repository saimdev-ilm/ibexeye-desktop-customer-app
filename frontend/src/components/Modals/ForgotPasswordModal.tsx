import React, { useState } from "react";
import { FaEnvelope, FaTimes } from "react-icons/fa";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle forgot password logic here (e.g., send API request)
    console.log("Forgot Password for email:", email);

    // Close modal after action
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute text-gray-400 top-3 right-3 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        {/* Modal Header */}
        <h2 className="mb-6 text-2xl font-semibold text-center text-gray-800">
          Forgot Password
        </h2>

        {/* Form */}
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-600"
            >
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute z-10 w-5 h-4 text-customBlue top-3 left-4" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-10 py-2 text-gray-800 placeholder-gray-400 border rounded-full material-input focus:outline-none focus:ring focus:ring-blue-400"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-full material-button hover:bg-red-700 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white rounded-full material-button bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
