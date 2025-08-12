import { useState } from "react";
import {
  FaCogs,
  FaShieldAlt,
  FaFileCode,
  FaMedal,
  FaUsers,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useContentVisibility } from "../../contexts/ContentVisibilityContext";
import ComingSoonModal from "../Modals/ComingSoonModal"; // Adjust the path based on your project structure

const AddonsContent: React.FC = () => {
  const { toggleContentVisibility } = useContentVisibility();
  const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>("");

  const addonsActions = [
    { 
      name: "MATLAB & SIMULINK", 
      shortName: "MATLAB", 
      icon: <FaFileCode size={15} />, 
      onClick: () => handleSimulinkClick()
    },
    { 
      name: "Itemis SECURE", 
      shortName: "Itemis", 
      icon: <FaShieldAlt size={15} />, 
      onClick: () => handleSECUREClick()
    },
    { 
      name: "Ansys Medini", 
      shortName: "Medini", 
      icon: <FaMedal size={15} />, 
      onClick: () => handleMediniClick()
    },
    { 
      name: "Functional Safety", 
      shortName: "Func Safe", 
      icon: <FaExclamationTriangle size={15} />, 
      onClick: () => showComingSoon("Functional Safety")
    },
    { 
      name: "Virtual Lab", 
      shortName: "Virt Lab", 
      icon: <FaUsers size={15} />, 
      onClick: () => showComingSoon("Virtual Lab")
    },
    { 
      name: "SOTIF Scenario", 
      shortName: "SOTIF", 
      icon: <FaShieldAlt size={15} />, 
      onClick: () => showComingSoon("SOTIF Scenario")
    },
    { 
      name: "Cybersecurity", 
      shortName: "Cyber Sim", 
      icon: <FaShieldAlt size={15} />, 
      onClick: () => showComingSoon("Cybersecurity")
    },
    { 
      name: "Fault Injection", 
      shortName: "Fault Sim", 
      icon: <FaCogs size={15} />, 
      onClick: () => showComingSoon("Fault Injection")
    },
  ];
  
  const showComingSoon = (featureName: string) => {
    setComingSoonFeature(featureName);
    setComingSoonModalOpen(true);
    
  };

  const handleToolContent = async () => {
    toggleContentVisibility();
  };

  const handleSimulinkClick = () => {
    const electronApi = (window as any).electron;
    if (electronApi && electronApi.launchMobaXterm) {
      electronApi.launchMobaXterm({
        host: "10.3.0.6",
        username: "ilmsim",
        password: "abc123",
      });
    } else {
      console.error("Electron API is not available");
    }
    toggleContentVisibility();
  };

  const handleMediniClick = () => {
    const electronApi = (window as any).electron;
    if (electronApi && electronApi.launchMedini) {
      console.log('Launching Medini');
      electronApi.launchMedini();
    } else {
      console.error("Electron API is not available for FI Server");
    }
    toggleContentVisibility();
  };

  const handleSECUREClick = () => {
    const electronApi = (window as any).electron;
    if (electronApi && electronApi.launchSecure) {
      electronApi.launchSecure();
    } else {
      console.error("Electron API is not available for Secure Server");
    }
    toggleContentVisibility();
  };

  return (
    <div>
      <div className="flex justify-start items-center gap-4 flex-wrap">
        {addonsActions.map((action, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 text-white rounded-lg cursor-pointer transition"
          >
            <button
              className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
              title={action.name}
              onClick={action.onClick}
            >
              {action.icon}
            </button>
            <p className="text-xs text-center">{action.shortName}</p>
          </div>
        ))}
      </div>
      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
        featureName={comingSoonFeature} // Pass the dynamic feature name
      />
    </div>
  );
};

export default AddonsContent;
