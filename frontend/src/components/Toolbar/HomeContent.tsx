import { useState, useEffect } from "react";
import { checkAdminStatus } from "../../services/apiService";
import RoleSelectionModal from "../RoleSelectionModal";
import { Broadcast, ShareNetwork, UserPlus, BookOpen } from "phosphor-react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";

import s3Bucket from "../../assets/s3bucket.png";
import { useTabManager } from "../../contexts/TabManagerContext";
import Fleet from "../../pages/Fleet";
import CustomPopup from "../../components/CustomPopup";
import ShareModal from "../../components/ShareModal";
import { useProjectContext } from "../../contexts/ProjectContext";
import "../../styles/ToolBar.css";
import S3UploaderModal from "../S3UploaderModal";
import { useTheme } from "../../contexts/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";


const HomeContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] =
    useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { addTab } = useTabManager();
  const { projectName } = useProjectContext();
  const { theme, toggleTheme } = useTheme();
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkIfAdmin();
  }, []);

  const openTab = (name: string, component: JSX.Element) => {
    if (!projectName) {
      setShowPopup(true);
      return;
    }
    addTab({ name, component });
  };

  const toggleContentVisibility = () => {
    setIsContentVisible(!isContentVisible);
  };
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleRoleSelectionModal = () => {
    setIsRoleSelectionModalOpen(!isRoleSelectionModalOpen);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const toggleShareModal = () => {
    setIsShareModalOpen(!isShareModalOpen);
  };

  return (
    <div>
      <div className="flex justify-end items-center ml-auto space-x-2">
        <button
          className="transition rounded material-button p-1 px-2"
          title="AWS S3 Bucket"
          onClick={toggleModal}
        >
          <img src={s3Bucket} className="w-5 h-6" alt="S3 Bucket" />
        </button>
        {isAdmin && (
          <button
            type="button"
            className="transition rounded material-button p-1"
            title="Add User"
            onClick={toggleRoleSelectionModal}
          >
            <UserPlus size={25} weight="light" />
          </button>
        )}

        <button
          type="button"
          className="transition rounded material-button p-1"
          title="Share"
          onClick={toggleShareModal}
        >
          <ShareNetwork size={25} weight="light" />
        </button>
        <button
          type="button"
          className="flex items-center px-2 text-white transition material-button rounded"
          title="Fleet"
          onClick={() => openTab("Safety & Cybersecurity Operations Dashboard", <Fleet />)}
        >
          <Broadcast size={25} className="mr-2" />
          Live Stream
        </button>
        <button
          type="button"
          className="flex items-center px-2 text-white transition material-button rounded"
          title="Learning Hub"
          onClick={() =>
            // @ts-expect-error: The 'unparse' method does not exist in the current version of papaparse type definitions.
            window.electron.ipcRenderer.send("open-external-url", {
              url: "https://ilmach.litmos.com/account/login/?",
            })
          }
        >
          <BookOpen size={23} weight="light" className="mr-2" />
          Learning Hub
        </button>
        <button
          onClick={toggleTheme}
          className="transition rounded material-button p-2"
          title="Toggle Theme"
        >
          {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
        </button>
        <div className="ml-auto">
          <button
            onClick={toggleContentVisibility}
            className="transition rounded material-button p-2"
            title="Toggle Content Visibility"
          >
            {isContentVisible ? (
              <FaChevronUp size={18} />
            ) : (
              <FaChevronDown size={18} />
            )}
          </button>
        </div>

        <S3UploaderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        <RoleSelectionModal
          isOpen={isRoleSelectionModalOpen}
          onClose={toggleRoleSelectionModal}
        />

        <ShareModal isOpen={isShareModalOpen} onClose={toggleShareModal} />

        <CustomPopup
          isOpen={showPopup}
          message="Please select a project first!"
          onClose={handleClosePopup}
        />
      </div>
    </div>
  );
};

export default HomeContent;
