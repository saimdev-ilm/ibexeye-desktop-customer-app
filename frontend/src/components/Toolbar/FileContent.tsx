import React, { useState } from "react";
import {
  FaPlus,
  FaFolderOpen,
  FaSave,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import { useProjectContext } from "../../contexts/ProjectContext";
import Modal from "../../components/Modal";
import CustomOpenProjectModal from "../CustomOpenProjectModal";
import Dashboard from "../../pages/Dashboard";
import { useTabManager } from "../../contexts/TabManagerContext";
import { useContentVisibility } from "../../contexts/ContentVisibilityContext";
import SaveModal from "../Modals/SaveModal";

interface WelcomeProps {
  onNavigateToDashboard: (projectName: string) => void;
}

const FileContent: React.FC<WelcomeProps> = ({ onNavigateToDashboard }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { setProjectId, setProjectName, projectId, projectName } =
    useProjectContext();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { addTab } = useTabManager();
  const { toggleContentVisibility } = useContentVisibility();
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaveAsModalOpen, setSaveAsModalOpen] = useState(false);
  const [isOpenProjectModalOpen, setOpenProjectModalOpen] =
    useState<boolean>(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleLogout = () => {
    window.localStorage.clear();
    window.location.reload(); // Reload the app and reset to the initial page
  };

  
  const handleSave = (name: string) => {
    console.log(`Saving project: ${name}`);
    localStorage.setItem(
      `project-${projectId || Date.now()}`,
      JSON.stringify({
        id: projectId || Date.now(),
        name,
        content: "Your project data here",
      })
    );
    alert("Project saved successfully!");
    setProjectName(name);
  };

  const handleSaveAs = (name: string) => {
    console.log(`Saving project as: ${name}`);
    const newProjectId = Date.now();
    localStorage.setItem(
      `project-${newProjectId}`,
      JSON.stringify({
        id: newProjectId,
        name,
        content: "Your project data here",
      })
    );
    alert(`Project saved as ${name}`);
    setProjectId(newProjectId);
    setProjectName(name);
  };

  const handleWorkspaceClick = async (
    projectId: number,
    projectName: string
  ) => {
    try {
      setProjectId(projectId);
      setProjectName(projectName);
      onNavigateToDashboard(projectName);
    } catch (error) {
      console.error("Error fetching project files:", error);
    }
  };

  const openTab = (name: string, component: JSX.Element) => {
    addTab({ name, component });
  };

  const navigateToDashboard = (projectName: string) => {
    console.log(`Navigating to dashboard for project: ${projectName}`);
    openTab("Dashboard", <Dashboard />);
  };

  return (
    <div className="flex justify-between items-center">
      {/* File Actions */}
      <div className="flex gap-8 items-center">
        {/* New Project */}
        <div className="flex flex-col items-center text-white">
          <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            title="New"
            onClick={handleOpenModal}
          >
            <FaPlus size={18} />
          </button>
          <p className="text-xs mt-1">New</p>
        </div>

        {/* Open Project */}
        <div className="flex flex-col items-center text-white">
          <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            title="Open"
            onClick={() => setOpenProjectModalOpen(true)}
          >
            <FaFolderOpen size={18} />
          </button>
          <p className="text-xs mt-1">Open</p>
        </div>

        {/* Save Project */}
        <div className="flex flex-col items-center text-white">
          <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            title="Save"
            onClick={() => setSaveModalOpen(true)}
          >
            <FaSave size={18} />
          </button>
          <p className="text-xs mt-1">Save</p>
        </div>

        {/* Save As Button */}
        <div className="flex flex-col items-center text-white">
          <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            title="Save As"
            onClick={() => setSaveAsModalOpen(true)}
          >
            <FaDownload size={18} />
          </button>
          <p className="text-xs mt-1">Save As</p>
        </div>

        {/* Exit */}
        <div className="flex flex-col items-center text-white">
          <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            title="Exit"
            onClick={handleLogout}
          >
            <FaTimes size={18} />
          </button>
          <p className="text-xs mt-1">Exit</p>
        </div>
      </div>
      <CustomOpenProjectModal
        isOpen={isOpenProjectModalOpen}
        onClose={() => setOpenProjectModalOpen(false)}
        onSelectProject={(projectName) =>
          console.log(`Selected: ${projectName}`)
        }
        onNavigateToDashboard={(projectId, projectName) =>
          navigateToDashboard(projectName)
        }
      />
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNavigateToDashboard={onNavigateToDashboard}
      ></Modal>
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={(name: string) => {
          if (!name.trim()) {
            alert("Project name is required.");
            return;
          }
          handleSave(name);
        }}
        defaultName={projectName}
        title="Save Project"
      />
      <SaveModal
        isOpen={isSaveAsModalOpen}
        onClose={() => setSaveAsModalOpen(false)}
        onSave={(name: string) => {
          if (!name.trim()) {
            alert("Project name is required.");
            return;
          }
          handleSaveAs(name);
        }}
        title="Save As"
      />
      ;
    </div>
  );
};

export default FileContent;
