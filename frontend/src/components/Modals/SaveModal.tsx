import React, { useState } from "react";

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  title: string;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave, defaultName = "", title }) => {
  const [projectName, setProjectName] = useState(defaultName);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectName.trim()) {
      alert("Project name cannot be empty.");
      return;
    }
    onSave(projectName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-1/3">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="border p-2 w-full rounded mb-4"
          placeholder="Enter project name"
        />
        <div className="flex justify-end gap-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;
