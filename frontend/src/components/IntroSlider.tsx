import React, { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "../styles/IntroSlider.css";
import {
  FaThermometerHalf,
  FaBroadcastTower,
  FaUserSecret,
  FaUsersCog,
  FaCrosshairs,
  FaRegEye,
  FaBell,
  FaSatelliteDish,
  FaUserShield,
  FaWalking,
  FaChild,
  FaLock,
  FaNetworkWired,
  FaTint,
  FaShieldAlt,
  FaTools,
  FaTemperatureHigh,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaRobot,
  FaDoorClosed,
} from "react-icons/fa";
import { PiDroneDuotone, PiDroneLight } from "react-icons/pi";
const IntroSlider: React.FC = () => {
  const swiperRef = useRef<any>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<any>(null);

  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.autoplay) {
      swiperRef.current.autoplay.stop();
    }
  };

  const handleMouseLeave = () => {
    if (swiperRef.current && swiperRef.current.autoplay) {
      swiperRef.current.autoplay.start(); // Restart autoplay on leave
    }
  };

  const handleFeatureClick = (feature) => {
    setCurrentFeature(feature);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setCurrentFeature(null); // Clear current feature when closing
  };

  return (
    <div className="">
      <div className="w-full">
        <div className="cursor-pointer custom_relative_into">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper; // Assign the swiper instance to the ref
            }}
            modules={[Navigation, Autoplay]}
            spaceBetween={0} // No space between slides
            slidesPerView={1} // Show one slide at a time
            navigation={{
              nextEl: ".custom-swiper-prev-2",
              prevEl: ".custom-swiper-next-2",
            }}
            loop={true}
            autoplay={{
              delay: 29000,
              disableOnInteraction: false,
            }}
            speed={500}
          >
            <SwiperSlide
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="relative overflow-hidden transition-transform transform rounded-3xl"
                style={{
                  height: "370px", // or match your previous image container height
                }}
              >
                {/* Video Background */}
                <video
                  className="absolute inset-0 object-cover w-full h-full"
                  src="SmartSurveillance.mp4" // Path relative to the public folder
                  autoPlay
                  loop
                  muted
                ></video>

                {/* Overlay for Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70"></div>

                {/* Title Section */}
                <div className="relative flex items-end w-full h-full p-6">
                  <div className="text-2xl font-bold text-white 2xl:text-3xl drop-shadow-lg">
                    Security & Surveillance
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="px-4 pt-4 pb-5 mt-3 bg-white 2xl:pt-5 2xl:px-6 2xl:pb-7 rounded-3xl">
                <h3 className="px-1 mb-6 font-bold text-customBlue 2xl:text-xl">
                  Features Lists
                </h3>
                <div className="grid grid-cols-2 text-sm gap-y-6 gap-x-8 sm:grid-cols-5">
                  {[
                    {
                      icon: <FaBroadcastTower />,
                      label: "Live Stream",
                      description:
                        "Provides real-time video feeds from surveillance cameras. This feature allows for immediate monitoring of events as they unfold, enabling quick responses to incidents.",
                    },
                    {
                      icon: <FaUserSecret />,
                      label: "Facial Recognition",
                      description:
                        "Utilizes advanced algorithms to identify and verify individuals based on their facial features. This technology enhances security by allowing for automated access control and monitoring of known individuals.",
                    },
                    {
                      icon: <FaRobot />,
                      label: "Emergency Call/Intelligent Doorbell",
                      description:
                        "Equipped with an AI Assistant, this feature provides real-time video feeds and enables immediate communication for emergency calls. It ensures quick responses to incidents and enhances security with intelligent doorbell functionalities.",
                    },
                    {
                      icon: <PiDroneDuotone />,
                      label: "Drone Deployment",
                      description:
                        "Leverages advanced AI-driven algorithms for automated drone deployment. This feature enables the monitoring of critical areas, ensuring rapid responses to potential threats and enhancing overall security.",
                    },
                    {
                      icon: <FaUsersCog />,
                      label: "Friend or Foe Detection",
                      description:
                        "Employs intelligent analysis to differentiate between friendly and potentially hostile entities. This feature is crucial for security applications, ensuring that only authorized personnel are granted access.",
                    },
                    {
                      icon: <FaCrosshairs />,
                      label: "Object Tracking",
                      description:
                        "Tracks the movement of specific objects in real-time using advanced algorithms. This capability is essential for monitoring valuable assets and ensuring they remain within designated areas.",
                    },
                    {
                      icon: <FaWalking />,
                      label: "Motion Sensing",
                      description:
                        "Detects movement within monitored areas using sensitive sensors. This feature can trigger alerts or initiate recordings, ensuring that any suspicious activity is captured and addressed promptly.",
                    },
                    {
                      icon: <FaShieldAlt />,
                      label: "Secure Data Encryption",
                      description:
                        "Protects sensitive information by converting it into unreadable code, ensuring that only authorized users can access the data. This process safeguards data during transmission and storage, preventing unauthorized access and data breaches.",
                    },
                    {
                      icon: <FaRegEye />,
                      label: "Night Vision",
                      description:
                        "Enables monitoring in low-light conditions using infrared technology. This feature is vital for security operations at night, ensuring continuous surveillance regardless of lighting conditions.",
                    },
                    {
                      icon: <FaBell />,
                      label: "Real-Time Alerts",
                      description:
                        "Provides immediate notifications for suspicious activities detected by surveillance systems. This feature allows security personnel to respond quickly to potential threats, enhancing overall safety.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      onClick={() => handleFeatureClick(feature)} // Pass the feature object here
                      className="flex flex-col items-center gap-2 transition-all group"
                    >
                      {/* Icon Section */}
                      <div className="flex items-center justify-center w-16 h-16 transition-transform rounded-full shadow-lg bg-customBlue group-hover:scale-105">
                        <div className="text-3xl text-white group-hover:text-green-400">
                          {feature.icon}
                        </div>
                      </div>
                      {/* Label Section */}
                      <p className="text-[10px] font-semibold text-center text-customBlue group-hover:text-green-400">
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="relative overflow-hidden transition-transform transform rounded-3xl"
                style={{
                  height: "370px", // or match your previous image container height
                }}
              >
                {/* Video Background */}
                <video
                  className="absolute inset-0 object-cover w-full h-full"
                  src="OilandGasField.mp4" // Path relative to the public folder
                  autoPlay
                  loop
                  muted
                ></video>

                {/* Overlay for Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70"></div>

                {/* Title Section */}
                <div className="relative flex items-end w-full h-full p-6">
                  <div className="text-2xl font-bold text-white 2xl:text-3xl drop-shadow-lg">
                    Oil & Gas Surveillance
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="px-4 pt-4 pb-5 mt-4 bg-white 2xl:pt-5 2xl:px-6 2xl:pb-7 rounded-3xl">
                <h3 className="px-1 mb-6 font-bold text-customBlue 2xl:text-xl">
                  Features Lists
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 sm:grid-cols-4">
                  {[
                    {
                      icon: <FaTint />,
                      label: "Leakage Detection",
                      description:
                        "Detects fluid leaks in pipelines or systems. Utilizes advanced sensors and algorithms to alert users in real-time, minimizing potential damages.",
                    },
                    {
                      icon: <FaShieldAlt />,
                      label: "Perimeter Surveillance",
                      description:
                        "Monitors the borders of protected areas using cameras and sensors. Ensures comprehensive security by detecting any unauthorized entry or movement along the perimeter.",
                    },
                    {
                      icon: <FaThermometerHalf />,
                      label: "Thermal Imaging",
                      description:
                        "Utilizes infrared technology to visualize heat patterns. Ideal for security and maintenance applications, identifying heat loss or detecting unauthorized personnel.",
                    },
                    {
                      icon: <FaTools />,
                      label: "Pipeline Surveillance",
                      description:
                        "Employs various monitoring techniques to ensure the integrity of pipelines. Identifies potential issues before they escalate, ensuring smooth operations.",
                    },
                    {
                      icon: <FaSatelliteDish />,
                      label: "Remote Monitoring",
                      description:
                        "Allows for the oversight of operations from anywhere in the world. Gathers data and provides notifications, enhancing responsiveness to any incidents.",
                    },
                    {
                      icon: <FaTemperatureHigh />,
                      label: "Temp & Pressure",
                      description:
                        "Continuously measures temperature and pressure levels. Critical for maintaining safety standards and ensuring machinery operates within safe parameters.",
                    },
                    {
                      icon: <FaExclamationTriangle />,
                      label: "Safety Violations",
                      description:
                        "Identifies and alerts personnel to safety breaches. Helps organizations maintain compliance with regulatory standards and promotes a safer work environment.",
                    },
                    {
                      icon: <FaLock />,
                      label: "Secure Data Encryption",
                      description:
                        "Protects sensitive information by converting it into unreadable code, ensuring that only authorized users can access the data. This process safeguards data during transmission and storage, preventing unauthorized access and data breaches.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 transition-all group"
                      onClick={() => handleFeatureClick(feature)} // Add click handler if needed
                    >
                      {/* Icon Section */}
                      <div className="flex items-center justify-center w-16 h-16 transition-transform rounded-full shadow-lg bg-customBlue group-hover:scale-105">
                        <div className="text-3xl text-white group-hover:text-green-400">
                          {feature.icon}
                        </div>
                      </div>
                      {/* Label Section */}
                      <p className="text-xs font-semibold text-center text-customBlue group-hover:text-green-400">
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="relative overflow-hidden transition-transform transform rounded-3xl"
                style={{
                  height: "370px", // or match your previous image container height
                }}
              >
                {/* Video Background */}
                <video
                  className="absolute inset-0 object-cover w-full h-full"
                  src="BorderSecurity.mp4" // Path relative to the public folder
                  autoPlay
                  loop
                  muted
                ></video>

                {/* Overlay for Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70"></div>

                {/* Title Section */}
                <div className="relative flex items-end w-full h-full p-6">
                  <div className="text-2xl font-bold text-white 2xl:text-3xl drop-shadow-lg">
                    Border Security & Surveillance
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="px-4 pt-4 pb-5 mt-3 bg-white 2xl:pt-5 2xl:px-6 2xl:pb-7 rounded-3xl">
                <h3 className="px-1 mb-6 font-bold text-customBlue 2xl:text-xl">
                  Features Lists
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 sm:grid-cols-4">
                  {[
                    {
                      icon: <FaThermometerHalf />,
                      label: "Thermal Vision",
                      description:
                        "Detects and visualizes heat signatures to monitor activities. This technology is essential for identifying intruders in low visibility conditions and assessing temperature variations in equipment and structures.",
                    },
                    {
                      icon: <FaUserShield />,
                      label: "Intrusion Detection",
                      description:
                        "Identifies unauthorized access and alerts security personnel. This feature employs motion sensors and alarms to enhance facility security, ensuring a rapid response to any breach.",
                    },
                    {
                      icon: <FaSatelliteDish />,
                      label: "Sensor Fusion",
                      description:
                        "Combines data from multiple sensors for accurate insights. This approach improves decision-making by integrating information from various sources, enhancing overall situational awareness.",
                    },
                    {
                      icon: <FaUsersCog />,
                      label: "Friend or Foe Detection",
                      description:
                        "Distinguishes between friendly and hostile entities using advanced algorithms. This capability is crucial for safeguarding areas by allowing access only to recognized and authorized individuals.",
                    },
                    {
                      icon: <FaWalking />,
                      label: "Motion Detection",
                      description:
                        "Monitors and analyzes movement in designated areas. This feature can trigger alerts or record video, ensuring that any unexpected activity is captured for review and action.",
                    },
                    {
                      icon: <FaChild />,
                      label: "Pattern Recognition",
                      description:
                        "Identifies and predicts patterns in behavior for proactive measures. This technology leverages machine learning to detect anomalies, helping to prevent potential security threats.",
                    },
                    {
                      icon: <FaLock />,
                      label: "Secure Communication",
                      description:
                        "Protects data transfers to ensure secure exchanges. Utilizing encryption and secure protocols, this feature safeguards sensitive information from interception and unauthorized access.",
                    },
                    {
                      icon: <FaNetworkWired />,
                      label: "Central Command",
                      description:
                        "Coordinates and manages security systems from a central point. This feature enables operators to monitor multiple security feeds and systems simultaneously, ensuring a cohesive and effective response strategy.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2 transition-all group"
                      onClick={() => handleFeatureClick(feature)} // Add click handler if needed
                    >
                      {/* Icon Section */}
                      <div className="flex items-center justify-center w-16 h-16 transition-transform duration-300 rounded-full shadow-lg bg-gradient-to-br from-customBlue to-customBlue group-hover:scale-105">
                        <div className="text-3xl text-white">
                          {feature.icon}
                        </div>
                      </div>
                      {/* Label Section */}
                      <p className="text-xs font-semibold text-center text-gray-800 text-nowrap group-hover:text-green-500">
                        {feature.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
          <div className="custom_relative_into2">
            {/* Custom Navigation Buttons */}
            <div className="border custom-swiper-next-2">
              <span>
                {" "}
                <FaChevronLeft size={16} className="text-white" />
                {/* Corrected direction */}
              </span>
            </div>
            <div className="border custom-swiper-prev-2">
              <span>
                {" "}
                <FaChevronRight size={16} className="text-white" />
                {/* Corrected direction */}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-0 bg-black/50 z-50 ${
          isPopupOpen ? "flex" : "hidden"
        } justify-center items-center transition-opacity duration-300 ease-in-out`}
        onClick={closePopup}
      >
        <div
          className="w-full max-w-lg p-6 transition-all duration-300 ease-in-out transform bg-white rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
        >
          <div className="flex justify-end">
            <button
              className="text-gray-600 transition duration-150 hover:text-gray-800"
              onClick={closePopup}
              aria-label="Close"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>
          <div className="flex items-center mb-4">
            <div className="mr-3 text-5xl text-customBlue">
              {currentFeature?.icon} {/* Display the icon */}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentFeature?.label}
            </h2>
          </div>
          <p className="mb-4 text-gray-700">{currentFeature?.description}</p>
        </div>
      </div>
    </div>
  );
};

export default IntroSlider;
