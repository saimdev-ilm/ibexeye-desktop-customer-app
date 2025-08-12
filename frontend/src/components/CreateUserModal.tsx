import React, { useState } from "react";
import { createUser } from "../services/apiService"; // Import the API service
import SuccessModal from "./SuccessModal";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
  roleId: string;
  team: string;
  orgId: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  selectedRole,
  roleId,
  orgId,
}) => {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [team, setTeam] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (email && password && fname && lname) {
      try {
        await createUser(email, password, fname, lname, team, orgId, roleId);
        setShowSuccessModal(true);
      } catch (error) {
        setErrorMessage("Failed to create user. Please try again.");
        console.error("Error creating user:", error);
      }
    } else {
      setErrorMessage("Please fill in all required fields.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative w-full max-w-lg p-6 bg-theme text-theme rounded">
          <h1 className="mb-3 text-lg">Create New User</h1>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1/2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-theme">
                      Role
                    </label>
                    <input
                      type="text"
                      value={selectedRole}
                      disabled
                      className="w-full material-input"
                    />
                  </div>
                </div>
                <div className="w-1/2">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-theme">
                      Team
                    </label>
                    <input
                      type="text"
                      value={team}
                      placeholder="Enter Team"
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full material-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1/2">
                  <div>
                  <label className="block text-sm font-medium mb-1 text-theme">
                  First Name
                </label>
                <input
                  type="text"
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  placeholder="Enter First Name"
                  className="w-full material-input"
                />
                  </div>
                </div>
                <div className="w-1/2">
                  <div>
                  <label className="block text-sm font-medium mb-1 text-theme">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                  placeholder="Enter Last Name"
                  className="w-full material-input"
                />
                  </div>
                </div>
              </div>
              <div>
                
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-theme">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full material-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-theme">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full material-input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="material-button w-full bg-red-800 rounded hover:bg-red-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="material-button w-full"
                >
                  Create User
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
          message="User created successfully!"
        />
      )}
    </>
  );
};

export default CreateUserModal;
