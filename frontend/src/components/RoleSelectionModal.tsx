import React, { useState, useEffect } from "react";
// import { FaPlus } from "react-icons/fa";
// import AddRoleModal from "./AddRoleModal";
import CreateUserModal from "./CreateUserModal";
import { fetchRoles } from "../services/apiService";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Role {
  id: string;
  name: string;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  //@ts-ignore
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Placeholder for orgId; replace with actual method of obtaining orgId
  const orgId = '1'; // Update this with the actual orgId

  // Fetch roles on mount
  useEffect(() => {
    const fetchAllRoles = async () => {
      try {
        const data = await fetchRoles();
        setRoles(data.map((role: any) => ({ id: role.id.toString(), name: role.name }))); // Ensure role id is a string
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    if (isOpen) {
      fetchAllRoles(); // Only fetch when the modal is open
    }
  }, [isOpen]);


  const handleNext = () => {
    if (selectedRole) {
      setErrorMessage("");
      setShowCreateUserModal(true);
    } else {
      setErrorMessage("Please select a role.");
    }
  };

  const handleClose = () => {
    setShowCreateUserModal(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative w-full max-w-lg p-6 bg-theme text-theme shadow-3d rounded">
          <h1 className="mb-3 text-lg">Select User Role</h1>
          <div className="space-y-3">
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <h6 className="block text-base font-medium mb-1">Role</h6>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedRole?.id || ""}
                  onChange={(e) => {
                    const selected = roles.find((role) => role.id === e.target.value);
                    setSelectedRole(selected || null);
                  }}
                  className="w-full material-input"
                >
                  <option className="bg-transparent text-dark" value="">
                    Select a role
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {errorMessage && <p className="mt-2 text-red-500">{errorMessage}</p>}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="material-button w-full bg-red-800 rounded hover:bg-red-700">
                Close
              </button>
              <button onClick={handleNext} className="material-button w-full">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* {showAddRoleModal && <AddRoleModal onClose={() => setShowAddRoleModal(false)} onAddRole={handleAddRole} />} */}

      {showCreateUserModal && selectedRole && (
        //@ts-ignore
        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={handleClose}
          selectedRole={selectedRole.name}
          roleId={selectedRole.id}
          orgId={orgId} // Pass the orgId here
        />
      )}
    </>
  );
};

export default RoleSelectionModal;
