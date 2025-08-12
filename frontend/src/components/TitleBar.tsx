import React, { useEffect, useState } from "react";
import {
  FaLock, FaUser, FaSignOutAlt,

} from "react-icons/fa";
import { X, Square, Minus, SquareLogo } from "phosphor-react";
import { fetchProfileData } from "../services/authService";
import "../styles/Titlebar.css";
import titleIcon from "../assets/logo/ibexEye.png";
import EditPasswordModal from "./EditPasswordModal";
import AddNewUser from '../components/Modals/AddNewUser';
import { useNavigate } from "react-router-dom";

const TitleBar: React.FC = () => {
  interface ProfileData {
    firstName: string;
    lastName: string;
    profileImage?: string;
  }

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  useState(false);
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState<boolean>(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();


  const handleCloseModal = () => {
    setIsModalOpen(false);
  };


  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const data = await fetchProfileData();
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile data:", error);

        // Set default profile data if fetch fails
        setProfileData({
          firstName: "Guest",
          lastName: "User"
        });

        // You might want to redirect to login if this is a authentication issue
        // Uncomment if you want to redirect to login page
        // if (window.location.pathname !== "/login") {
        //   navigate("/login");
        // }
      }
    };

    getUserProfile();
  }, []);


  const handleChangePasswordClick = () => {
    setIsEditPasswordOpen(true);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = () => {
    window.localStorage.clear();
    window.location.reload();
  };



  useEffect(() => {
    window.electron.ipcRenderer.on("window-state-changed", () => { });

    return () => {
      window.electron.ipcRenderer.removeListener(
        "window-state-changed",
        () => { }
      );
    };
  }, []);

  const handleMinimize = () => {
    window.electron.ipcRenderer.send("minimize-main-window");
  };

  const handleMaximize = () => {
    window.electron.ipcRenderer.send("maximize-main-window");
    setIsMaximized((prevState) => !prevState);
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send("close-main-window");
  };


  const goToProfile = () => {
    navigate("/profileView");
  }
  return (
    <div className="p-0 m-0 custom-title-bar">
      <div className="relative z-40 w-full ">
        {/* TitleBar */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-300 shadow-md"
          style={{
            borderBottomLeftRadius: "30px",
            borderBottomRightRadius: "30px",
          }}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <img
                src={titleIcon}
                className="w-full h-6 2xl:h-6 2k-scaled:h-8"
                alt="Logo"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 main-menu">
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={toggleDropdown}
              >
                <span className="text-xs font-semibold text-gray-600 2k-scaled:text-base">
                  Hello, {profileData?.firstName || "User"}
                </span>
                {profileData?.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt={`${profileData.firstName}'s Profile`}
                    className="w-8 h-8 rounded-full 2k-scaled:h-9 2k-scaled:w-9"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 2k-scaled:h-9 2k-scaled:w-9 rounded-full bg-[#1B3C55] text-white text-xs 2k-scaled:text-sm">
                    {profileData?.firstName?.[0]}
                    {profileData?.lastName?.[0]}
                  </div>
                )}
              </div>
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 z-50 w-48 mt-2 overflow-hidden text-xs bg-white border border-gray-300 rounded-lg shadow-lg 2xl:text-sm 2k-scaled:text-base"
                  onMouseLeave={toggleDropdown}
                >
                  <button
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={goToProfile}
                  >
                    <FaUser className="mr-2" />
                    Profile
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={handleChangePasswordClick}
                  >
                    <FaLock className="mr-2" />
                    Change Password
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
            {/* <button onClick={handleOpenModal}  className="p-2 transition rounded-full material-button"
            >
              <FaUserPlus className="w-4 h-4 2xl:h-4 2xl:w-4 2k-scaled:h-6 2k-scaled:w-6" />
            </button> */}
            {/* <button
              onClick={toggleTheme}
              className="p-2 transition rounded-full material-button"
            >
              {theme === "light" ? (
                <FaCog title="Dark theme" className="w-4 h-4 2xl:h-4 2xl:w-4 2k-scaled:h-6 2k-scaled:w-6" />
              ) : (
                <FaCogs title="Light theme" className="w-4 h-4 2xl:h-4 2xl:w-4 2k-scaled:h-6 2k-scaled:w-6" />
              )}
            </button> */}

            {/* Window Controls */}
            <button
              className="flex items-center justify-center w-8 h-8 p-1 text-black bg-gray-200 rounded-full 2k-scaled:h-9 2k-scaled:w-9 minimize-btn hover:bg-gray-300"
              onClick={handleMinimize}
              title="Minimize"
            >
              <Minus
                className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                weight="bold"
              />
            </button>
            <button
              className="flex items-center justify-center w-8 h-8 p-1 text-black bg-gray-200 rounded-full 2k-scaled:h-9 2k-scaled:w-9 maximize-btn hover:bg-gray-300"
              onClick={handleMaximize}
              title="Maximize"
            >
              {isMaximized ? (
                <Square
                  className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                  weight="bold"
                />
              ) : (
                <SquareLogo
                  className="w-3 h-3 2k-scaled:h-4 2k-scaled:w-4"
                  weight="bold"
                />
              )}
            </button>

            <button
              className="flex items-center justify-center p-1 text-white bg-red-500 rounded-full w-7 h-7 2k-scaled:h-9 2k-scaled:w-9 close-btn hover:bg-red-600"
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


      <EditPasswordModal
        isOpen={isEditPasswordOpen}
        onClose={() => setIsEditPasswordOpen(false)} // Close the modal when done
      />
      {isModalOpen && <AddNewUser isOpen={isModalOpen} onClose={handleCloseModal} />}

    </div>
  );
};

export default TitleBar;
