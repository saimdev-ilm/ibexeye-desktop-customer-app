import React, { useEffect, useState } from "react";
import { fetchProfileData, checkAdminStatus } from "../services/apiService";
import EditPasswordModal from "./EditPasswordModal"; // Import the new EditPasswordModal

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState<boolean>(false); // State for managing Edit Password modal
  const [teams, setTeams] = useState<any[]>([]); // State to store team information

  useEffect(() => {
    const getProfileData = async () => {
      try {
        const data = await fetchProfileData();
        setProfileData(data);

        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus); // Set admin status

        // Fetch the user's teams
 

      } catch (error) {
        console.error(
          "Error fetching profile data or checking admin status:",
          error
        );
        setProfileData(null);
        setTeams([]); // Reset teams on error

      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      getProfileData();
    }
  }, [isOpen]);


  if (!isOpen) return null; // If not open, return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-[40%] p-6 bg-theme shadow-3d rounded text-theme">
        <div className="flex items-center space-x-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex-shrink-0">
            <div className="relative mt-5">
              {/* Display user initials */}
              <div className="w-24 h-24 text-2xl bg-blue-500 rounded-full">
                <span className="absolute top-8 right-8">
                  {profileData?.firstName?.[0] || ""}{profileData?.lastName?.[0] || ""}
                </span>

                {/* Verified Badge */}
                {profileData?.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 p-2 h-10 w-10 rounded-full border-2 border-[#0d0d16] flex justify-center items-center">
                    <i className="text-white fas fa-check"></i>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-grow">
            <div className="mb-2 text-2xl font-bold">
              {profileData?.firstName || "N/A"} {profileData?.lastName || "N/A"}
            </div>
            <div className="text-lg font-medium">
              {isAdmin ? "Admin User" : "Regular User"}
            </div>
          </div>
          <div className="">
            {/* <button
              onClick={handleChangePasswordClick} // Open Edit Password modal on click
              className="material-button"
            >
              <span>
                <i className="fas fa-edit me-2"></i>
              </span>
              Change Password
            </button> */}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 mt-6">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid border-radius-full animate-spin"></div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <label className="w-48 font-semibold">Email:</label>
                <input
                  type="text"
                  value={profileData?.email || "N/A"}
                  readOnly
                  className="w-full material-input"
                />
              </div>
              <div className="flex items-center">
                <label className="w-48 font-semibold">Team:</label>
                <input
                  type="text"
                  value={teams.length > 0 ? teams[0].name : "N/A"} // Display the first team's name
                  readOnly
                  className="w-full material-input"
                />
              </div>
              <div className="flex items-center">
                <label className="w-48 font-semibold">Organization:</label>
                <input
                  type="text"
                  value={profileData?.currentOrg?.name || "N/A"}
                  readOnly
                  className="w-full material-input"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute bg-red-800 rounded material-button top-4 right-4 hover:bg-red-500"
        >
          <span>
            <i className="fas fa-xmark"></i>
          </span>
        </button>
      </div>

      {/* Include the Edit Password Modal here */}
      <EditPasswordModal
        isOpen={isEditPasswordOpen}
        onClose={() => setIsEditPasswordOpen(false)} // Close the modal when done
      />
    </div>
  );
};

export default ProfileModal;
