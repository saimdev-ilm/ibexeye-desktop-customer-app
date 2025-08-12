import React, { useState } from "react";
import { createProject } from "../services/apiService";
import { useProjectContext } from "../contexts/ProjectContext"; // Import the context
import "../styles/Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard: (projectName: string, projectId: number) => void; // Update to accept both project name and project ID
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onNavigateToDashboard }) => {
  const { setProjectId, setProjectName } = useProjectContext(); // Destructure the context setters
  const [projectName, setLocalProjectName] = useState<string>("");
  const [selectedDirectory, setSelectedDirectory] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProjectName(e.target.value);
  };

  const handleDirectoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      //@ts-ignore
      const path = (files[0] as any).webkitRelativePath || files[0].path;
      setSelectedDirectory(path.substring(0, path.lastIndexOf("/")));
    }
  };

  const validateProjectName = (name: string) => {
    // Check if the project name contains spaces
    if (name.includes(" ")) {
      return "Project name should not contain spaces.";
    }
    return "";
  };

  const handleCreate = async () => {
    const validationError = validateProjectName(projectName);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      const projectData = await createProject(projectName); // Call API to create the project

      if (projectData && projectData.data && projectData.data.id) {
        const projectId = projectData.data.id; // Extract the project ID from the response

        // Update the context with project ID and name
        setProjectId(projectId);
        setProjectName(projectData.data.name);

        onClose(); // Close the modal
        onNavigateToDashboard(projectData.data.name, projectId); // Pass project name and project ID to dashboard
      } else {
        setErrorMessage("Error: Project ID not found.");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setErrorMessage("Failed to create the project. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 cus_modal">
      <div className="relative w-1/3 p-6 text-theme bg-theme shaddow-3d rounded card">
        <div className="">
          <div className="mb-3">
            <h3 className="mb-3 text-xl">Project Wizard</h3>
            <p className="text-gray-400">Create a new workspace and initial content.</p>
          </div>
          <div className="mb-3">
            <h5 className="mb-3">Workspace Name</h5>
            <div className="">
              <input
                type="text"
                className="w-full material-input"
                placeholder="Enter here..."
                value={projectName}
                onChange={handleProjectNameChange}
              />
            </div>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          </div>
          <div className="mb-3">
            <h5 className="mb-3">Current Directory</h5>
            <div className="flex items-center">
              <input
                type="text"
                className="w-full material-input"
                placeholder="D:\\Application\\hsf-simulator"
                value={selectedDirectory}
                readOnly
              />
              <label className="absolute right-8 ml-2 cursor-pointer">
                <i className="text-[#1976d2]  fas fa-folder-open"></i>
                <input
                  type="file"
                  id="selectDirectory"
                  className="hidden"
                  onChange={handleDirectoryChange}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="material-button w-full bg-red-700 hover:bg-red-800"
          >
            Close
          </button>
          <button
            onClick={handleCreate}
            className="material-button w-full"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
