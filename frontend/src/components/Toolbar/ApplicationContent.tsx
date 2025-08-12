import React, { useState } from "react";
import {
  FaCar,
  FaPlane,
  FaTractor,
  FaShieldAlt,
  FaIndustry,
  FaBolt,
  FaUserShield,
  FaLock,
  FaExclamationTriangle,
  FaParking,
} from "react-icons/fa";
import {  GiFactory} from "react-icons/gi";
import ComingSoonModal from "../Modals/ComingSoonModal"; // Adjust the path based on your project structure

const ApplicationContent: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<string>("");
  const toolActions = [
    {
      name: "Automotive",
      shortName: "Automotive  ",
      icon: <FaCar size={15} />,
      onClick: () => showComingSoon("Automotive"),
    },
    {
      name: "Aviation & Avionics",
      shortName: "Avionics  ",
      icon: <FaPlane size={15} />,
      onClick: () => showComingSoon("Aviation & Avionics"),
    },
    {
      name: "Oil and Gas",
      shortName: "Oil Gas  ",
      icon: <GiFactory size={15} />,
      onClick: () => showComingSoon("Oil and Gas"),
    },
    {
      name: "Agriculture",
      shortName: "Agriculture  ",
      icon: <FaTractor size={15} />,
      onClick: () => showComingSoon("Agriculture"),
    },
    {
      name: "Industry",
      shortName: "Industry  ",
      icon: <FaIndustry size={15} />,
      onClick: () => showComingSoon("Industry"),
    },
    {
      name: "Security & Surveillance",
      shortName: "Security  ",
      icon: <FaShieldAlt size={15} />,
      onClick: () => showComingSoon("Security & Surveillance"),
    },
    {
      name: "Cybersecurity",
      shortName: "Cybersecurity  ",
      icon: <FaLock size={15} />,
      onClick: () => showComingSoon("Cybersecurity"),
    },
    {
      name: "Functional Safety",
      shortName: "Functional",
      icon: <FaExclamationTriangle size={15} />,
      onClick: () => showComingSoon("Functional Safety"),
    },
    {
      name: "Defense & Border Security",
      shortName: "Defence  ",
      icon: <FaUserShield size={15} />,
      onClick: () => showComingSoon("Defense & Border Security"),
    },
    {
      name: "Advance Energy  ",
      shortName: "Energy  ",
      icon: <FaBolt size={15} />,
      onClick: () => showComingSoon("Advance Energy  "),
    },
    {
      name: "Smart Parking Management",
      shortName: "Parking  ",
      icon: <FaParking size={15} />,
      onClick: () => showComingSoon("Smart Parking Management"),
    },
  ];
  

  const showComingSoon = (featureName: string) => {
    setComingSoonFeature(featureName);
    setComingSoonModalOpen(true);
  };

  const handleClosePopup = () => setShowPopup(false);

  return (
    <div className="">
      <div className="flex justify-evenly items-center gap-4 flex-wrap">
        {toolActions.map((action, index) => (
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
            <p className="text-xs text-center text-wrap">{action.shortName}</p>
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <p>Please select a project first!</p>
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleClosePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onClose={() => setComingSoonModalOpen(false)}
        featureName={comingSoonFeature} // Pass the dynamic feature name
      />
    </div>
  );
};

export default ApplicationContent;
