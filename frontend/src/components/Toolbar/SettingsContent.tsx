import {useState} from "react";
import {
  FaCogs,
  FaUserCog,
  FaShieldAlt,
  FaPalette,
  FaTools,
} from "react-icons/fa";
import { useContentVisibility } from "../../contexts/ContentVisibilityContext";
import ComingSoonModal from "../Modals/ComingSoonModal";

const SettingsContent: React.FC = () => {
  const { toggleContentVisibility } = useContentVisibility();
  const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>("");


  const settingsActions = [
    { 
      name: "General Settings", 
      shortName: "General", 
      icon: <FaCogs size={15} />, 
      onClick: () => showComingSoon("General Settings") 
    },
    { 
      name: "User Management", 
      shortName: "User", 
      icon: <FaUserCog size={15} />, 
      onClick: () => showComingSoon("User Management") 
    },
    { 
      name: "Privacy Settings", 
      shortName: "Privacy", 
      icon: <FaShieldAlt size={15} />, 
      onClick: () => showComingSoon("Privacy Settings") 
    },
    { 
      name: "Theme Customization", 
      shortName: "Theme", 
      icon: <FaPalette size={15} />, 
      onClick: () => showComingSoon("Theme Customization") 
    },
    { 
      name: "Advanced Settings", 
      shortName: "Advance", 
      icon: <FaTools size={15} />, 
      onClick: () => showComingSoon("Advanced Settings") 
    },
  ];
  

  const handleToolContent = async () => {
    toggleContentVisibility();
  };

  const showComingSoon = (featureName: string) => {
    setComingSoonFeature(featureName);
    setComingSoonModalOpen(true);
    
  };



  return (
    <div className="">
      <div className="flex justify-start items-center gap-4 flex-wrap">
        {settingsActions.map((action, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 text-white  rounded-lg cursor-pointer transition"
          >
            <button
              onClick={action.onClick}
              className="rounded-full border bg-white p-2 text-[#1B3C55] hover:bg-customBlue hover:border-white hover:text-white"
              title={action.name}
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

export default SettingsContent;
