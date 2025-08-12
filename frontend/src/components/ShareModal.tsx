// src/components/ShareModal.tsx
import React from "react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="p-4 bg-theme shadow-3d text-theme rounded w-96 text-theme "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div className="">
            <h2 className="text-xl font-semibold">Share File</h2>
          </div>
          <div className="">
            <button className="material-button bg-red-700 hover:bg-red-800"
            onClick={onClose}
            >
              <span>
                <i className="fas fa-xmark"></i>
              </span>
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center h-[20vh]">
        <p className="mb-4">Share functionality is currently pending...</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
