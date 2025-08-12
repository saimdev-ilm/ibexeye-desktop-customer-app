import {useState} from "react";
import {
  FaQuestionCircle,
  FaBook,
  FaSearch,
  FaChalkboardTeacher,
  FaLifeRing,
} from "react-icons/fa";
import ComingSoonModal from "../Modals/ComingSoonModal"
import {useContentVisibility} from "../../contexts/ContentVisibilityContext";


const HelpContent: React.FC = () => {
  const { toggleContentVisibility } = useContentVisibility();
  const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>("");



  const helpActions = [
    { 
      name: "Frequently Asked Questions", 
      shortName: "FAQ's", 
      icon: <FaQuestionCircle size={15} />, 
      onClick: () => showComingSoon("Frequently Asked Questions") 
    },
    { 
      name: "Documentation", 
      shortName: "Docs", 
      icon: <FaBook size={15} />, 
      onClick: () => showComingSoon("Documentation") 
    },
    { 
      name: "Search Feature", 
      shortName: "Search", 
      icon: <FaSearch size={15} />, 
      onClick: () => showComingSoon("Search Feature") 
    },
    { 
      name: "Tutorial Guide", 
      shortName: "Tutorial", 
      icon: <FaChalkboardTeacher size={15} />, 
      onClick: () => showComingSoon("Tutorial Guide") 
    },
    { 
      name: "Customer Support", 
      shortName: "Support", 
      icon: <FaLifeRing size={15} />, 
      onClick: () => showComingSoon("Customer Support") 
    },
  ];
  

  const showComingSoon = (featureName: string) => {
    setComingSoonFeature(featureName);
    setComingSoonModalOpen(true);
    
  };

  return (
    <div className="">
      <div className="flex justify-start items-center gap-4 flex-wrap">
        {helpActions.map((action, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 text-white  rounded-lg cursor-pointer transition"
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

export default HelpContent;
