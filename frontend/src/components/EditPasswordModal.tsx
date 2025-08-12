import React, { useState } from "react";
import SuccessModal from "./SuccessModal";
import { changePassword } from "../services/apiService";

interface EditPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditPasswordModal: React.FC<EditPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevent pasting
    setError("Pasting is not allowed.");
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChars
    );
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (oldPassword === newPassword) {
      setError("Old password and new password cannot be the same.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "New password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);

      setIsSuccessModalOpen(true);
      resetFields(); // Clear fields after successful change
    } catch (error) {
      setError("Failed to change password.");
      console.error("Error changing password:", error);
    }
  };

  const resetFields = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleClose = () => {
    resetFields(); // Clear fields when closing the modal
    onClose(); // Call the parent close function
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-[30%] p-6 bg-theme text-theme rounded shadow-3d">
        <h2 className="mb-4 text-lg font-bold">Change Password</h2>
        {error && <p className="text-red-500">{error}</p>}

        <div className="flex flex-col mb-4">
          <label className="mb-1">Old Password:</label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              onPaste={handlePaste}
              placeholder="Enter here..."
              className="material-input w-full"
            />
            <span
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute cursor-pointer right-2 top-2 text-[#1976d2]"
            >
              <i
                className={`fas ${showOldPassword ? "fa-eye-slash" : "fa-eye"}`}
              ></i>
            </span>
          </div>
        </div>

        <div className="flex flex-col mb-4">
          <label className="mb-1">New Password:</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onPaste={handlePaste}
              placeholder="Enter here..."
              className="material-input w-full"
            />
            <span
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute cursor-pointer right-2 top-2 text-[#1976d2]"
            >
              <i
                className={`fas ${showNewPassword ? "fa-eye-slash" : "fa-eye"}`}
              ></i>
            </span>
          </div>
        </div>

        <div className="flex flex-col mb-4">
          <label className="mb-1">Confirm New Password:</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              placeholder="Enter here..."
              onChange={(e) => setConfirmPassword(e.target.value)}
              onPaste={handlePaste}
              className="material-input w-full"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute cursor-pointer right-2 top-2 text-[#1976d2]"
            >
              <i
                className={`fas ${
                  showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                }`}
              ></i>
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="material-button w-full bg-red-700 hover:bg-red-800"
          >
            Close
          </button>
          <button
            onClick={handleChangePassword}
            className="material-button w-full"
          >
            Change Password
          </button>
        </div>
      </div>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          handleClose();
        }}
        message="Password changed successfully!"
      />
    </div>
  );
};

export default EditPasswordModal;
