import React, { useState } from "react";
import {  FaCriticalRole, } from "react-icons/fa";
import { Graph, GitDiff, Buildings, CarSimple } from "phosphor-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useTabManager } from "../../contexts/TabManagerContext";
import {useContentVisibility} from "../../contexts/ContentVisibilityContext";

const ToolContent: React.FC = () => {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const { addTab, setActiveTab } = useTabManager();
  const { projectName } = useProjectContext();
  const { toggleContentVisibility } = useContentVisibility();



  const openTab = (name: string, component: JSX.Element) => {
    if (!projectName) {
      setShowPopup(true);
      return;
    }
    addTab({ name, component });
    setActiveTab(name);
    toggleContentVisibility();

  };

  const toolActions = [
    {
      name: "Critical Event Sieve",
      icon: <Graph size={24} />,
      component: <div>Ces</div>,
      label: "Sieve",
    },
    {
      name: "Scene Generation",
      icon: <GitDiff size={24} />,
      component: <div>Ces</div>,
      label: "Scene",
    },
    {
      name: "Scenario Generation",
      icon: <Buildings size={24} />,
      component: <div>Ces</div>,
      label: "Scenario",
    },
    {
      name: "Drive Lab",
      icon: <CarSimple size={24} />,
      component: <div>Ces</div>,
      label: "Drive Lab",
    },
    {
      name: "Safety & Cybersecurity Operations Dashboard",
      icon: <FaCriticalRole size={24} />,
      component: <div>Ces</div>,
      label: "Safety Dash",
    },
  ];

  const handleClosePopup = () => setShowPopup(false);

  return (
    <div className="flex items-center justify-start ">
      <div className="flex items-center gap-8">
        {toolActions.map((action, index) => (
          <div key={index} className="flex flex-col items-center text-white">
            <button
            className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
            onClick={() => openTab(action.name, action.component)} 
            title={action.name}
            >
              {action.icon}
            </button>
            <p className="mt-1 text-xs">{action.label}</p>
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-4 text-center bg-white rounded-lg shadow-lg">
            <p>Please select a project first!</p>
            <button
              className="px-4 py-2 mt-4 text-white bg-red-600 rounded"
              onClick={handleClosePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolContent;
