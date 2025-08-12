import React from "react";
import { FaTimes } from "react-icons/fa";
import SecurityImg from "../../assets/Icons/camera.png";
import OilGasImg from "../../assets/icons/oilandgas.png";
import BorderSecurityImg from "../../assets/icons/border.png";
interface IndustriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IndustriesModal: React.FC<IndustriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-3xl p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold text-customBlue">Get Started</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>
        <div className="flex justify-between gap-4 pt-5">
          {/* Card 1 */}
          <div className="flex flex-col items-center p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[250px] justify-around rounded-3xl tester cursor-pointer">
            <div className="flex items-center justify-center w-24 h-24 mb-3 bg-[#EAF3FF] rounded-full">
              <img
                src={SecurityImg}
                alt="Security Icon"
                className="object-center w-20 h-20 overflow-hidden rounded-full"
              />
            </div>
            <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
              Security & Surveillance
            </h5>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[250px] justify-around rounded-3xl tester cursor-pointer">
            <div className="flex items-center justify-center w-24 h-24 mb-3 bg-[#EAF3FF] rounded-full">
              <img
                src={BorderSecurityImg}
                alt="Border Security Icon"
                className="object-center w-20 h-20 overflow-hidden rounded-full"
              />
            </div>
            <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
              Border Security & Surveillance
            </h5>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[250px] justify-around rounded-3xl tester cursor-pointer">
            <div className="flex items-center justify-center w-24 h-24 mb-3 bg-[#EAF3FF] rounded-full">
              <img
                src={OilGasImg}
                alt="Oil & Gas Icon"
                className="object-center w-20 h-20 overflow-hidden rounded-full"
              />
            </div>
            <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
              Oil & Gas Surveillance
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustriesModal;
