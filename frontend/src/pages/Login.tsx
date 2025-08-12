import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash, FaCog, FaCogs } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import titleIcon from "../assets/logo/ibexEye.png";
import "../styles/Titlebar.css";
import { useTheme } from "../contexts/ThemeContext";
import EditPasswordModal from "../components/EditPasswordModal";
import { X, Square, Minus, SquareLogo } from "phosphor-react";
import LiDARTechnology from "../assets/GIF/New folder/LiDARTechnology.gif";
import SensorFusion from "../assets/GIF/New folder/SensorFusion.gif";
import SmarterSurveillance from "../assets/smart.jpg";
import RadarPrecision from "../assets/GIF/New folder/RadarPrecision.gif";
import "../styles/login.css";
import ForgotPasswordModal from "../components/Modals/ForgotPasswordModal";
import SwiperCore from "swiper";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth hook

// Define props interface
interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>("base_user@mail.com");
  const [password, setPassword] = useState<string>("123456");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const swiperRef = useRef<SwiperCore | null>(null);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState<boolean>(false);

  // Get auth context
  const { login: authLogin } = useAuth();

  const openForgotPasswordModal = () => setIsForgotPasswordModalOpen(true);
  const closeForgotPasswordModal = () => setIsForgotPasswordModalOpen(false);

  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email, password });

      // Use the authService login function from context
      await authLogin(email, password);

      // Get the user data from localStorage (authService has already stored it)
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) {
        throw new Error("User data not found after login");
      }

      const userData = JSON.parse(userDataStr);

      // If password reset is required, open the reset modal
      if (userData.password_reset_required) {
        console.log("Password reset required");
        setIsResetModalOpen(true);
      } else {
        // Create profile data for backward compatibility
        const profileData = {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          team: userData.team,
          org: userData.currentOrg,
          org_id: userData.org_id,
          profileImage: userData.profileImage
        };

        // Store complete profile data for easy access
        localStorage.setItem("profileData", JSON.stringify(profileData));

        // Store individual fields for backward compatibility
        localStorage.setItem("firstName", userData.firstName);
        localStorage.setItem("lastName", userData.lastName);
        localStorage.setItem("userEmail", userData.email);
        localStorage.setItem("userName", `${userData.firstName} ${userData.lastName}`);

        // Call the onLogin callback from props
        onLogin();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || "Invalid email or password");
      } else {
        setError("Invalid email or password");
      }
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordVisibilityToggle = () => {
    setPasswordVisible((prev) => !prev);
  };

  const [isMaximized, setIsMaximized] = useState<boolean>(false); // Default to unmaximized state

  // Listen for window state changes from the main process
  useEffect(() => {
    // Add listener for window state change (maximized/unmaximized)
    window.electron?.ipcRenderer?.on("window-state-changed", () => {
      // Toggle the maximized state every time the event is fired
    });

    // Cleanup listener on component unmount
    return () => {
      window.electron?.ipcRenderer?.removeListener(
        "window-state-changed",
        () => { }
      );
    };
  }, []);

  const handleMinimize = () => {
    window.electron?.ipcRenderer?.send("minimize-main-window");
  };

  const handleMaximize = () => {
    // Send message to maximize or unmaximize window
    window.electron?.ipcRenderer?.send("maximize-main-window");
    setIsMaximized((prevState) => !prevState);
  };

  const handleClose = () => {
    window.electron?.ipcRenderer?.send("close-main-window");
  };

  const closeModal = () => {
    setIsResetModalOpen(false); // Close the reset modal
  };

  const handleMouseEnter = () => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop(); // Stops autoplay on hover
    }
  };

  const handleMouseLeave = () => {
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.start(); // Resumes autoplay when mouse leaves
    }
  };

  return (
    <div className="relative h-screen bg-theme">
      <div className="absolute z-40 w-full custom-title-bar2">
        <div
          className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-300 shadow-2xl"
          style={{
            borderBottomLeftRadius: "30px",
            borderBottomRightRadius: "30px",
          }}
        >
          {/* Left Section: Logo and App Title */}
          <div className="flex items-center space-x-2">
            <img
              src={titleIcon}
              className="w-full h-6 2xl:h-6 2k-scaled:h-8"
              alt="Logo"
            />
          </div>
          {/* Right Section: Window Controls */}
          <div className="flex space-x-2">
            <button
              className="flex items-center justify-center w-8 h-8 p-1 bg-gray-200 rounded-full 2k-scaled:h-9 2k-scaled:w-9 minimize-btn hover:bg-gray-300"
              onClick={handleMinimize}
              title="Minimize"
            >
              <Minus
                className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                weight="bold"
              />
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 p-1 bg-gray-200 rounded-full 2k-scaled:h-9 2k-scaled:w-9 maximize-btn hover:bg-gray-300"
              onClick={handleMaximize}
              title="Maximize"
            >
              {isMaximized ? (
                <Square className="2k-scaled:h-4 2k-scaled:w-4" weight="bold" />
              ) : (
                <SquareLogo
                  className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                  weight="bold"
                />
              )}
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 p-1 text-white bg-red-500 rounded-full 2k-scaled:h-9 2k-scaled:w-9 close-btn hover:bg-red-600"
              onClick={handleClose}
              title="Close"
            >
              <X
                className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                weight="bold"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl 2k-scaled:max-w-[85rem] p-10 space-y-10 md:space-y-0 mt-20">
          {/* Login Form */}

          <div className="flex flex-col items-center justify-center w-full max-w-md p-5 2k-scaled:max-w-lg ">
            <h1 className="mb-6 text-xl font-bold text-center 2xl:text-2xl 2k-scaled:text-3xl text-theme">
              Let's Start!
            </h1>
            {error && <p className="mb-4 text-red-500">{error}</p>}
            <form className="w-full space-y-4" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or User ID"
                  className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-500 bg-white border-2 rounded-full 2xl:text-base 2k-scaled:text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-500 bg-white border-2 rounded-full 2xl:text-base 2k-scaled:text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
                <button
                  type="button"
                  onClick={handlePasswordVisibilityToggle}
                  className="absolute inset-y-0 flex items-center text-gray-500 right-4"
                >
                  {passwordVisible ? (
                    <FaEyeSlash className="2k-scaled:h-5 2k-scaled:w-5" />
                  ) : (
                    <FaEye className="2k-scaled:h-5 2k-scaled:w-5" />
                  )}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-sm text-gray-500 2xl:text-base 2k-scaled:text-xl hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-3 text-sm 2k-scaled:text-xl material-button text-white bg-[#1B3C55] border rounded-full hover:bg-[#0c1c29] transition disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Swiper Slider */}
          <div className="flex-1 w-full max-w-xl p-5 loginSlider 2k-scaled:max-w-2xl">
            <style>
              {`
                .swiper-pagination {
                  top: 65% !important;
                  bottom: auto !important;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 0.5rem;
              }
              `}
            </style>
            {/* Swiper Slides */}

            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)} // Attach swiper instance
              pagination={{
                clickable: true,
              }}
              autoplay={{
                delay: 5000, // 5 seconds
                disableOnInteraction: false, // Continue autoplay after user interaction
              }}
              loop={true} // Enable looping
              modules={[Pagination, Autoplay]}
              className="mySwiper"
            >
              {/* Slide 1: Automotive */}
              <SwiperSlide>
                <div
                  className="flex flex-col items-center text-center"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Circular Image */}
                  <div className="w-64 h-64 mb-3 overflow-hidden border rounded-full 2xl:w-64 2xl:h-64 2k-scaled:w-80 2k-scaled:h-80">
                    <img
                      src={SmarterSurveillance}
                      alt="Smarter Surveillance"
                      className="object-fill w-full h-full"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="pt-4 text-lg font-semibold leading-tight text-theme 2xl:text-xl 2k-scaled:text-2xl">
                    Advanced Solutions for Security and Surveillance
                  </h3>

                  {/* Description */}
                  <p className="px-3 mt-2 text-sm text-center text-gray-500 2xl:text-base 2k-scaled:text-lg">
                    Empower your security and surveillance systems with
                    cutting-edge technology for real-time monitoring, enhanced
                    accuracy, and reliable performance in any environment.
                    Ensure peace of mind with solutions designed to meet the
                    challenges of modern security needs.
                  </p>
                </div>
              </SwiperSlide>

              {/* Slide 2: Airport/Aviation/Avionics */}
              <SwiperSlide>
                <div
                  className="flex flex-col items-center"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={RadarPrecision}
                    alt="Radar Precision"
                    className="w-64 h-64 mb-3 border rounded-full 2xl:w-64 2xl:h-64 2k-scaled:w-80 2k-scaled:h-80"
                  />

                  <h3 className="pt-5 text-lg font-bold text-center 2xl:text-xl 2k-scaled:text-2xl text-theme">
                    Radar Precision for Complete Awareness
                  </h3>

                  <p className="px-3 mt-2 text-sm text-center text-gray-500 2xl:text-base 2k-scaled:text-lg">
                    Our radar technology enables real-time detection and
                    tracking, providing seamless monitoring and enhanced
                    situational awareness in any environment. It ensures optimal
                    performance even in challenging conditions, delivering
                    unmatched reliability and precision.
                  </p>
                </div>
              </SwiperSlide>

              {/* Slide 3: Manufacturing Industry */}
              <SwiperSlide>
                <div
                  className="flex flex-col items-center"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={LiDARTechnology}
                    alt="LiDAR Technology"
                    className="w-64 h-64 mb-3 border rounded-full 2xl:w-64 2xl:h-64 2k-scaled:w-80 2k-scaled:h-80"
                  />

                  <h3 className="pt-5 text-lg font-bold text-center 2xl:text-xl 2k-scaled:text-2xl text-theme">
                    LiDAR Technology for Smarter Surveillance
                  </h3>

                  <p className="px-3 mt-2 text-sm text-center text-gray-500 2xl:text-base 2k-scaled:text-lg">
                    Our LiDAR-powered solution delivers precise 3D mapping and
                    real-time object detection for advanced security and
                    surveillance. Experience unparalleled accuracy and
                    reliability in any environment. Its adaptability ensures
                    optimal performance across diverse scenarios, from urban
                    landscapes to remote locations.
                  </p>
                </div>
              </SwiperSlide>

              {/* Slide 4: Cybersecurity */}
              <SwiperSlide>
                <div
                  className="flex flex-col items-center"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={SensorFusion}
                    alt="Sensor Fusion"
                    className="w-64 h-64 mb-3 border rounded-full 2xl:w-64 2xl:h-64 2k-scaled:w-80 2k-scaled:h-80"
                  />

                  <h3 className="pt-5 text-lg font-bold text-center 2xl:text-xl 2k-scaled:text-2xl text-theme">
                    Sensor Fusion: Smarter Insights & Decisions{" "}
                  </h3>

                  <p className="px-3 mt-2 text-sm text-center text-gray-500 2xl:text-base 2k-scaled:text-lg">
                    Combine the power of multiple sensors—LiDAR, radar, and
                    cameras—for enhanced environmental awareness and precise
                    data integration. Sensor fusion delivers comprehensive
                    insights, enabling advanced monitoring, tracking, and
                    decision-making across diverse applications.
                  </p>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="fixed p-3 text-gray-200 bg-[#1B3C55] rounded-full shadow-lg dark:text-[#1B3C55] dark:bg-gray-200 bottom-4 right-4"
      >
        {theme === "light" ? <FaCog /> : <FaCogs />}
      </button>

      {/* Password Reset Modal */}
      <EditPasswordModal isOpen={isResetModalOpen} onClose={closeModal} />

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeForgotPasswordModal}
      />
    </div>
  );
};

export default Login;