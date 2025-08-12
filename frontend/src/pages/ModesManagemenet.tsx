import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChevronLeft, FaSolarPanel, FaHome, FaBed,
  FaVideo, FaCircle, FaThermometerHalf, FaTint, FaWind,
  FaLeaf, FaEdit, FaTrash, FaCheck, FaExclamationCircle,
  FaSync, FaShieldAlt, FaCog, FaPlus, FaList,
  FaShieldVirus
} from "react-icons/fa";
import {
  getAllModes, Mode,
  ModeType, isModeEditable, isModeDeletable,
  deleteMode
} from '../services/modeService';
import { useMode } from '../contexts/ModeContext'; // Import the ModeContext hook
import CreateModeModal from '../components/Modals/CreateModeModal';
import EditModeModal from '../components/Modals/EditModeModal';
import ModeConfigurationModal from '../components/Modals/ModeConfigurationModal';

const ModesManagement: React.FC = () => {
  // Use the ModeContext for global state management
  const { refreshModes: refreshGlobalModes, activateMode: activateModeGlobal } = useMode();
  
  const [modes, setModes] = useState<Mode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [activatingMode, setActivatingMode] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModeId, setEditingModeId] = useState<number | null>(null);
  // State for configuration modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configuringModeId, setConfiguringModeId] = useState<number | null>(null);

  const navigate = useNavigate();

  // Fetch modes when component mounts
  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      setLoading(true);
      setError(null);

      const modesData = await getAllModes();
      setModes(modesData);

      // Select the active mode by default
      const activeMode = modesData.find(mode => mode.isActive);
      if (activeMode) {
        setSelectedMode(activeMode);
      } else if (modesData.length > 0) {
        // If no active mode is found, select the first one
        setSelectedMode(modesData[0]);
      }

      // Also refresh the global mode context state
      refreshGlobalModes();

    } catch (err) {
      console.error('Failed to fetch modes:', err);
      setError('Failed to load modes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMode = async (modeId: number) => {
    // Don't activate if it's already the active mode
    if (modes.find(m => m.id === modeId)?.isActive) {
      return;
    }

    try {
      setActivatingMode(modeId);
      setSuccessMessage(null);
      setError(null);

      // Use the global context activateMode function
      const result = await activateModeGlobal(modeId);

      if (result.success) {
        // Update local state
        const updatedModes = modes.map(mode => ({
          ...mode,
          isActive: mode.id === modeId
        }));
        setModes(updatedModes);

        // Update selected mode
        const newActiveMode = modes.find(mode => mode.id === modeId);
        if (newActiveMode) {
          setSelectedMode({ ...newActiveMode, isActive: true });
        }

        // Set success message
        const modeName = modes.find(m => m.id === modeId)?.name || "Selected";
        setSuccessMessage(`Mode "${modeName}" activated successfully`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        // Handle activation failure
        setError(`Failed to activate mode: ${result.message}`);
      }
    } catch (err) {
      console.error('Error activating mode:', err);
      setError('An error occurred while activating the mode.');
    } finally {
      setActivatingMode(null);
    }
  };

  const handleSelectMode = (mode: Mode) => {
    setSelectedMode(mode);
    // Close delete confirmation if any
    setConfirmDelete(null);
  };

  // Get the appropriate icon and label based on mode type
  const getModeIcon = (mode: Mode) => {
    const modeType = mode.modeType;

    switch (modeType) {
      case ModeType.ARM_AWAY:
        return <FaShieldVirus size={24} className="text-red-500" />;
      case ModeType.ARM_HOME:
        return <FaShieldAlt size={24} className="text-blue-500" />;
      case ModeType.STANDBY:
        return <FaBed size={24} className="text-indigo-500" />;
      case ModeType.CUSTOM:
        return <FaCog size={24} className="text-purple-500" />;
      default:
        return <FaHome size={24} className="text-blue-500" />;
    }
  };

  // Get mode status badge text
  const getModeBadge = (mode: Mode) => {
    if (mode.isActive) {
      return "Active";
    }

    const modeType = mode.modeType;
    switch (modeType) {
      case ModeType.ARM_AWAY:
        return "Guard";
      case ModeType.ARM_HOME:
        return "Lax Security";
      case ModeType.STANDBY:
        return "Standby";
      case ModeType.CUSTOM:
        return "Custom";
      default:
        return "";
    }
  };

  // Get badge class based on mode type
  const getBadgeClass = (mode: Mode) => {
    if (mode.isActive) {
      return "bg-green-100 text-green-700";
    }

    const modeType = mode.modeType;
    switch (modeType) {
      case ModeType.ARM_AWAY:
        return "bg-red-100 text-red-700";
      case ModeType.ARM_HOME:
        return "bg-blue-100 text-blue-700";
      case ModeType.STANDBY:
        return "bg-indigo-100 text-indigo-700";
      case ModeType.CUSTOM:
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get sensor icon based on type
  const getSensorIcon = (sensorType: string) => {
    const type = sensorType.toLowerCase();
    if (type.includes('temp')) return <FaThermometerHalf className="text-red-500" size={18} />;
    if (type.includes('humid')) return <FaTint className="text-blue-500" size={18} />;
    if (type.includes('air') || type.includes('quality')) return <FaWind className="text-green-500" size={18} />;
    if (type.includes('co2')) return <FaLeaf className="text-emerald-500" size={18} />;
    return <FaCircle className="text-gray-500" size={14} />;
  };

  // Check if mode can be configured (all except ARM_AWAY)
  const isModeConfigurable = (mode: Mode): boolean => {
    return mode.modeType !== ModeType.ARM_AWAY;
  };

  const handleHomeDashboard = () => {
    navigate("/");
  };

  const handleAllSolarDashboard = () => {
    navigate("/allSolarDashboard");
  };

  // Updated to use the modal instead of navigation
  const handleEditMode = (modeId: number) => {
    // Check if the mode is editable before opening the modal
    const mode = modes.find(m => m.id === modeId);
    if (mode && !isModeEditable(mode)) {
      setError(`The "${mode.name}" mode cannot be edited.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Set the editing mode ID and open the modal
    setEditingModeId(modeId);
    setIsEditModalOpen(true);
  };

  // Handle mode configuration
  const handleConfigureMode = (modeId: number) => {
    // Check if the mode is configurable
    const mode = modes.find(m => m.id === modeId);
    if (mode && !isModeConfigurable(mode)) {
      setError(`The "${mode.name}" mode cannot be configured.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Set the configuring mode ID and open the config modal
    setConfiguringModeId(modeId);
    setIsConfigModalOpen(true);
  };

  const handleEditModeResult = (success: boolean, message: string) => {
    if (success) {
      setSuccessMessage(message);
      // Refresh the modes data to show updated information
      fetchModes();
    } else {
      setError(message);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      if (success) {
        setSuccessMessage(null);
      } else {
        setError(null);
      }
    }, 3000);
  };

  const handleConfigResult = (success: boolean, message: string) => {
    if (success) {
      setSuccessMessage(message);
      // Refresh the modes data to show updated information
      fetchModes();
    } else {
      setError(message);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      if (success) {
        setSuccessMessage(null);
      } else {
        setError(null);
      }
    }, 3000);
  };

  const handleDeleteConfirm = (modeId: number) => {
    // Check if the mode is deletable
    const mode = modes.find(m => m.id === modeId);
    if (mode && !isModeDeletable(mode)) {
      setError(`The "${mode.name}" mode cannot be deleted.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setConfirmDelete(modeId);
  };

  /**
   * Handle mode deletion
   * @param modeId ID of the mode to delete
   */
  const handleDeleteMode = async (modeId: number) => {
    try {
      // Set loading state if needed
      setError(null);
      setSuccessMessage(null);

      // Get the mode name before deletion for the success message
      const modeName = modes.find(m => m.id === modeId)?.name || "Selected";

      // Call the delete API
      const result = await deleteMode(modeId);

      if (result.success) {
        // Remove the mode from state
        setModes(prevModes => prevModes.filter(mode => mode.id !== modeId));

        // If the deleted mode was the selected one, select another mode
        if (selectedMode?.id === modeId) {
          const activeMode = modes.find(mode => mode.isActive && mode.id !== modeId);
          if (activeMode) {
            setSelectedMode(activeMode);
          } else if (modes.length > 1) {
            // Select the first available mode that's not the one being deleted
            const newSelectedMode = modes.find(mode => mode.id !== modeId);
            if (newSelectedMode) setSelectedMode(newSelectedMode);
          } else {
            setSelectedMode(null);
          }
        }

        // Show success message
        setSuccessMessage(`Mode "${modeName}" deleted successfully`);
        
        // Refresh the global modes context
        refreshGlobalModes();
      } else {
        // Show error message
        setError(`Failed to delete mode: ${result.message}`);
      }
    } catch (err) {
      console.error('Error deleting mode:', err);
      setError('An error occurred while deleting the mode');
    } finally {
      // Clear the confirmation state
      setConfirmDelete(null);

      // Clear messages after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleCreateMode = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateModeResult = (success: boolean, message: string) => {
    if (success) {
      setSuccessMessage(message);
      // Add the refresh call here to make sure modes are up to date
      fetchModes();
    } else {
      setError(message);
    }

    // Clear message after 3 seconds
    setTimeout(() => {
      if (success) {
        setSuccessMessage(null);
      } else {
        setError(null);
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full gap-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              title="Go to Home Dashboard"
              onClick={handleHomeDashboard}
              className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
            >
              <FaChevronLeft />
            </button>
            <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
              Modes Dashboard
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              title="Go to Solar Dashboard"
              onClick={handleAllSolarDashboard}
              className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
            >
              <FaSolarPanel />
            </button>
          </div>
        </header>

        {/* Loading state */}
        <div className="flex items-center justify-center h-64 bg-white shadow-md rounded-xl">
          <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <span className="ml-3 text-sm font-medium text-gray-600">Loading modes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full gap-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
          <div className="flex items-center justify-center gap-2">
            <button
              title="Go to Home Dashboard"
              onClick={handleHomeDashboard}
              className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
            >
              <FaChevronLeft />
            </button>
            <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
              Modes Dashboard
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              title="Go to Solar Dashboard"
              onClick={handleAllSolarDashboard}
              className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
            >
              <FaSolarPanel />
            </button>
          </div>
        </header>

        {/* Error state */}
        <div className="p-4 text-red-700 bg-white shadow-md rounded-xl">
          <div className="flex items-center mb-2">
            <FaExclamationCircle className="mr-2" size={16} />
            <p className="font-semibold">Error</p>
          </div>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchModes}
            className="px-3 py-1 mt-2 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Create Mode Modal */}
      <CreateModeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onModeCreated={handleCreateModeResult}
        refreshModes={fetchModes}
      />

      {/* Edit Mode Modal */}
      {editingModeId && (
        <EditModeModal
          isOpen={isEditModalOpen}
          modeId={editingModeId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingModeId(null);
          }}
          onSave={handleEditModeResult}
        />
      )}

      {/* Mode Configuration Modal */}
      {configuringModeId && (
        <ModeConfigurationModal
          isOpen={isConfigModalOpen}
          modeId={configuringModeId}
          onClose={() => {
            setIsConfigModalOpen(false);
            setConfiguringModeId(null);
          }}
          onSave={handleConfigResult}
        />
      )}

      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            title="Go to Home Dashboard"
            onClick={handleHomeDashboard}
            className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            Modes Dashboard
          </h1>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={fetchModes}
            className="flex items-center justify-center mr-2 text-gray-600 transition-colors hover:text-blue-600"
            title="Refresh Modes"
          >
            <FaSync size={16} />
          </button>
          <button
            title="Go to Solar Dashboard"
            onClick={handleAllSolarDashboard}
            className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full"
          >
            <FaSolarPanel />
          </button>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="px-4 py-3 mb-4 text-green-700 bg-green-100 rounded-lg">
          <div className="flex items-center">
            <FaCheck className="mr-2" />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Modes List */}
        <div className="w-full p-4 bg-white shadow-md lg:w-1/3 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Available Modes</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{modes.length} {modes.length === 1 ? 'mode' : 'modes'}</div>
              <button
                onClick={handleCreateMode}
                className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                title="Create Custom Mode"
              >
                <FaPlus size={12} />
                <span>New Mode</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {modes.map(mode => (
              <div
                key={mode.id}
                onClick={() => handleSelectMode(mode)}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                  ${mode.id === selectedMode?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${mode.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                    {getModeIcon(mode)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{mode.name}</span>
                      <span className={`px-2 py-0.5 ${getBadgeClass(mode)} rounded-full text-xs`}>
                        {getModeBadge(mode)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {mode.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Configuration button - for all modes except ARM_AWAY */}
                  {isModeConfigurable(mode) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfigureMode(mode.id);
                      }}
                      className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-teal-500 hover:bg-gray-200"
                      title="Configure Mode Components"
                    >
                      <FaList size={16} />
                    </button>
                  )}
                  
                  {/* Edit button - only for CUSTOM modes */}
                  {isModeEditable(mode) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMode(mode.id);
                      }}
                      className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-blue-500 hover:bg-gray-200"
                      title="Edit Mode"
                    >
                      <FaEdit size={16} />
                    </button>
                  )}

                  {/* Delete button - only for CUSTOM modes */}
                  {isModeDeletable(mode) && (
                    <>
                      {confirmDelete === mode.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMode(mode.id);
                            }}
                            className="p-1 text-white bg-red-500 rounded hover:bg-red-600"
                            title="Confirm Delete"
                          >
                            <FaCheck size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelDelete();
                            }}
                            className="p-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            title="Cancel"
                          >
                            <FaChevronLeft size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirm(mode.id);
                          }}
                          className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-red-500 hover:bg-gray-200"
                          title="Delete Mode"
                        >
                          <FaTrash size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {modes.length === 0 && (
              <div className="p-6 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                <p className="mb-2">No modes found</p>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={fetchModes} className="inline-flex items-center px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">
                    <FaSync size={12} className="mr-1" /> Refresh
                  </button>
                  <button onClick={handleCreateMode} className="inline-flex items-center px-3 py-1 text-sm text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200">
                    <FaPlus size={12} className="mr-1" /> Create Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mode Details */}
        {selectedMode ? (
          <div className="w-full p-4 bg-white shadow-md lg:w-2/3 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-3 ${selectedMode.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                  {getModeIcon(selectedMode)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">{selectedMode.name}</h2>
                    <span className={`px-2 py-0.5 ${getBadgeClass(selectedMode)} rounded-full text-xs`}>
                      {getModeBadge(selectedMode)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedMode.description}</p>
                </div>
              </div>

              {!selectedMode.isActive && (
                <button
                  onClick={() => handleActivateMode(selectedMode.id)}
                  disabled={activatingMode === selectedMode.id}
                  className={`px-4 py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700 
                    ${activatingMode === selectedMode.id ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {activatingMode === selectedMode.id ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
                      Activating...
                    </>
                  ) : 'Activate Mode'}
                </button>
              )}
            </div>

            {/* Mode Details Sections */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cameras Section */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
                  <FaVideo className="mr-2 text-blue-500" />
                  Cameras
                </h3>

                {selectedMode.cameras.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <p>No cameras configured for this mode</p>
                    {isModeConfigurable(selectedMode) && (
                      <button
                        onClick={() => handleConfigureMode(selectedMode.id)}
                        className="inline-flex items-center px-3 py-1 mt-2 text-sm text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200"
                      >
                        <FaList size={12} className="mr-1" /> Configure Components
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedMode.cameras.map(camera => (
                      <div
                        key={camera.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{camera.name}</div>
                          <div className="text-xs text-gray-500">{camera.host}</div>
                        </div>
                        <div className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                          ID: {camera.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sensors Section */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
                  <FaCircle className="mr-2 text-green-500" size={14} />
                  Sensors
                </h3>

                {selectedMode.sensors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <p>No sensors configured for this mode</p>
                    {isModeConfigurable(selectedMode) && (
                      <button
                        onClick={() => handleConfigureMode(selectedMode.id)}
                        className="inline-flex items-center px-3 py-1 mt-2 text-sm text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200"
                      >
                        <FaList size={12} className="mr-1" /> Configure Components
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedMode.sensors.map(sensor => (
                      <div
                        key={sensor.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="p-2 mr-3 bg-gray-100 rounded-full">
                            {getSensorIcon(sensor.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{sensor.name}</div>
                            <div className="text-xs text-gray-500">Type: {sensor.type}</div>
                          </div>
                        </div>
                        <div className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded truncate max-w-[200px]" title={sensor.mqttTopic}>
                          {sensor.mqttTopic}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mode Details - Additional Info */}
            <div className="p-4 mt-6 border border-gray-200 rounded-lg">
              <h3 className="mb-3 text-lg font-medium text-gray-800">Additional Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedMode.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Updated At</p>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedMode.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{selectedMode.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${selectedMode.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedMode.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mode Type</p>
                  <p className="font-medium text-gray-800">
                    {selectedMode.modeType === ModeType.ARM_AWAY && "Arm Away (Guard)"}
                    {selectedMode.modeType === ModeType.ARM_HOME && "Arm Home (Lax Security)"}
                    {selectedMode.modeType === ModeType.STANDBY && "Standby"}
                    {selectedMode.modeType === ModeType.CUSTOM && "Custom"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Configurable</p>
                  <p className={`font-medium ${isModeConfigurable(selectedMode) ? 'text-green-600' : 'text-red-600'}`}>
                    {isModeConfigurable(selectedMode) ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-4">
                {!selectedMode.isActive && (
                  <button
                    onClick={() => handleActivateMode(selectedMode.id)}
                    disabled={activatingMode === selectedMode.id}
                    className={`flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 
                      ${activatingMode === selectedMode.id ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <FaCheck className="mr-2" size={14} />
                    Activate Mode
                  </button>
                )}
                
                {isModeConfigurable(selectedMode) && (
                  <button
                    onClick={() => handleConfigureMode(selectedMode.id)}
                    className="flex items-center px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                  >
                    <FaList className="mr-2" size={14} />
                    Configure Components
                  </button>
                )}

                {isModeEditable(selectedMode) && (
                  <button
                    onClick={() => handleEditMode(selectedMode.id)}
                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <FaEdit className="mr-2" size={14} />
                    Edit Mode
                  </button>
                )}

                {isModeDeletable(selectedMode) && (
                  <button
                    onClick={() => handleDeleteConfirm(selectedMode.id)}
                    className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    <FaTrash className="mr-2" size={14} />
                    Delete Mode
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full p-6 text-center bg-white shadow-md lg:w-2/3 rounded-xl">
            <p className="text-gray-500">Select a mode to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModesManagement;