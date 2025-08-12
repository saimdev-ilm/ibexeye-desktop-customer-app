import React, { useState } from "react";
import SliderSwiper from "../components/SliderSwiper";
import IntroSlider from "../components/IntroSlider";
import SecurityImg from "../assets/Icons/camera.png";
import OilGasImg from "../assets/icons/oilandgas.png";
import BorderSecurityImg from "../assets/icons/border.png";
import "../styles/welcome.css";
import { FaChevronRight } from "react-icons/fa";
import IndustriesModal from "../components/Modals/IndustriesModal";
import { useNavigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate(); // React Router navigation hook

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSecuritySurveillance = () => {
    navigate("/SecuritySurveillance"); // Route to Dashboard
  };

  const handleOilGasSurveillance = () => {
    navigate("/OilGasSurveillance"); // Route to Dashboard
  };

  const handleBorderSurveillance = () => {
    navigate("/borderSurveillance"); // Route to Dashboard
  };

  return (
    <main className="h-full 2xl:mx-2 2xl:py-7">
      <div className="flex flex-wrap justify-between h-full gap-1">
        {/* Left Section */}
        <div className="w-full lg:w-[45%] flex flex-col gap-3">
          <div className="bg-[#F8F8FB] rounded-3xl px-4 2xl:px-6 py-3 2xl:py-5 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-gray-300 2xl:pb-3">
              <h2 className="text-base font-semibold text-customBlue 2xl:text-lg">
                Get Started
              </h2>
              <button
                onClick={openModal}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaChevronRight />
              </button>
            </div>

            {/* Cards */}
            <div className="flex justify-between gap-4 pt-3 2xl:pt-5">
              {/* Card 1 */}
              <div
                className="flex flex-col items-center px-4 2xl:p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[235px] 2xl:min-h-[250px] justify-around rounded-3xl tester cursor-pointer"
                onClick={handleSecuritySurveillance}
              >
                <div className="flex items-center justify-center w-20 h-20 2xl:w-24 2xl:h-24 mb-3 bg-[#EAF3FF] rounded-full">
                <img
                    src={SecurityImg}
                    alt="Security Icon"
                    className="object-center w-full overflow-hidden rounded-full h-fit"
                  />
                </div>
                <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
                  Security & Surveillance
                </h5>
              </div>

              {/* Card 2 */}
              <div
                className="flex flex-col items-center px-4 2xl:p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[230px] 2xl:min-h-[250px] justify-around rounded-3xl tester cursor-pointer"
                onClick={handleBorderSurveillance}
              >
                <div className="flex items-center justify-center w-20 h-20 2xl:w-24 2xl:h-24 mb-3 bg-[#EAF3FF] rounded-full">
                <img
                    src={BorderSecurityImg}
                    alt="Border Security Icon"
                    className="object-center w-full overflow-hidden rounded-full h-fit"
                  />
                </div>
                <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
                  Border Security & Surveillance
                </h5>
              </div>

              {/* Card 3 */}
              <div
                className="flex flex-col items-center px-4 2xl:p-4 bg-white border border-gray-300 shadow-sm w-[30%] min-h-[230px] 2xl:min-h-[250px] justify-around rounded-3xl tester cursor-pointer"
                onClick={handleOilGasSurveillance}
              >
                <div className="flex items-center justify-center w-20 h-20 2xl:w-24 2xl:h-24 mb-3 bg-[#EAF3FF] rounded-full">
                <img
                    src={OilGasImg}
                    alt="Oil & Gas Icon"
                    className="object-center w-full overflow-hidden rounded-full h-fit"
                  />
                </div>
                <h5 className="text-sm font-semibold text-center text-customBlue 2xl:text-base">
                  Oil & Gas Surveillance
                </h5>
              </div>
            </div>
          </div>

          {/* Add Ons Section */}
          <div className="">
            <h2 className="px-4 font-semibold 2xl:px-5 2xl:text-lg text-customBlue">
              Add-Ons
            </h2>

            <SliderSwiper />
          </div>
        </div>
        {/* Right Section */}
        <div className="w-full lg:w-[54%]">
          <div className="">
            <IntroSlider />
          </div>
        </div>
      </div>
      <IndustriesModal isOpen={isModalOpen} onClose={closeModal} />
    </main>
  );
};

export default Welcome;
