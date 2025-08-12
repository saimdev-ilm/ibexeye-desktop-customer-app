import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChevronLeft, FaSolarPanel, FaHome, FaBuilding,
  FaWarehouse, FaCircle, FaThermometerHalf, FaTint, 
  FaWind, FaLeaf, FaEdit, FaTrash, FaCheck, 
  FaExclamationCircle, FaSync,  
  FaPlus, FaList, FaMapMarkerAlt, FaVideo, FaMicrochip
} from "react-icons/fa";
import {
  getAllZones, Zone, updateZone,
  deleteZone,  
} from '../services/zoneService';
import CreateZoneModal from '../components/Modals/CreateZoneModal';
import EditZoneModal from '../components/Modals/EditZoneModal';
import ZoneConfigurationModal from '../components/Modals/ZoneConfigurationModal.tsx';

const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [updatingZone, setUpdatingZone] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | string | null>(null);
  // State for configuration modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configuringZoneId, setConfiguringZoneId] = useState<number | string | null>(null);

  const navigate = useNavigate();

  // Fetch zones when component mounts
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError(null);

      const zonesData = await getAllZones();
      setZones(zonesData);

      // Select the first zone by default
      if (zonesData.length > 0) {
        setSelectedZone(zonesData[0]);
      }

    } catch (err) {
      console.error('Failed to fetch zones:', err);
      setError('Failed to load zones. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateZone = async (zoneId: number) => {
    // Find the zone we want to activate
    const zoneToActivate = zones.find(z => z.id === zoneId);
    if (!zoneToActivate) return;

    try {
      setUpdatingZone(zoneId);
      setSuccessMessage(null);
      setError(null);

      // Update the zone to be active - only pass allowed fields per API spec
      const result = await updateZone(zoneId, {
        name: zoneToActivate.name,
        description: zoneToActivate.description,
        type: zoneToActivate.type,
        isActive: true
      });

      if (result.success) {
        // Update zones list with the new active zone
        setZones(prevZones => prevZones.map(zone => ({
          ...zone,
          isActive: zone.id === zoneId ? true : zone.isActive
        })));

        // Update selected zone
        if (selectedZone && selectedZone.id === zoneId) {
          setSelectedZone({
            ...selectedZone,
            isActive: true
          });
        }

        // Set success message
        const zoneName = zones.find(z => z.id === zoneId)?.name || "Selected";
        setSuccessMessage(`Zone "${zoneName}" activated successfully`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        // Handle activation failure
        setError(`Failed to activate zone: ${result.message}`);
      }
    } catch (err) {
      console.error('Error activating zone:', err);
      setError('An error occurred while activating the zone.');
    } finally {
      setUpdatingZone(null);
    }
  };

  const handleSelectZone = (zone: Zone) => {
    setSelectedZone(zone);
    // Close delete confirmation if any
    setConfirmDelete(null);
  };

  // Get the appropriate icon based on zone type
  const getZoneIcon = (zone: Zone) => {
    const zoneType = zone.type.toLowerCase();

    if (zoneType.includes('factory')) {
      return <FaWarehouse size={24} className="text-orange-500" />;
    } else if (zoneType.includes('office')) {
      return <FaBuilding size={24} className="text-blue-500" />;
    } else if (zoneType.includes('living')) {
      return <FaHome size={24} className="text-green-500" />;
    } else if (zoneType.includes('meeting')) {
      return <FaList size={24} className="text-purple-500" />;
    } else {
      return <FaMapMarkerAlt size={24} className="text-gray-500" />;
    }
  };

  // Get zone status badge text
  const getZoneBadge = (zone: Zone) => {
    if (zone.isActive) {
      return "Active";
    }

    const zoneType = zone.type.toLowerCase();
    if (zoneType.includes('factory')) {
      return "Factory";
    } else if (zoneType.includes('office')) {
      return "Office";
    } else if (zoneType.includes('living')) {
      return "Living Area";
    } else if (zoneType.includes('meeting')) {
      return "Meeting Room";
    } else if (zoneType.includes('kitchen')) {
      return "Kitchen";
    } else {
      return "Zone";
    }
  };

  // Get badge class based on zone type
  const getBadgeClass = (zone: Zone) => {
    if (zone.isActive) {
      return "bg-green-100 text-green-700";
    }

    const zoneType = zone.type.toLowerCase();
    if (zoneType.includes('factory')) {
      return "bg-orange-100 text-orange-700";
    } else if (zoneType.includes('office')) {
      return "bg-blue-100 text-blue-700";
    } else if (zoneType.includes('living')) {
      return "bg-green-100 text-green-700";
    } else if (zoneType.includes('meeting')) {
      return "bg-purple-100 text-purple-700";
    } else {
      return "bg-gray-100 text-gray-700";
    }
  };

  // Get sensor icon based on sensor data type and name
  const getSensorIcon = (sensor: any) => {
    const name = sensor.name.toLowerCase();
    if (name.includes('temp')) return <FaThermometerHalf className="text-red-500" size={18} />;
    if (name.includes('humid')) return <FaTint className="text-blue-500" size={18} />;
    if (name.includes('air') || name.includes('quality')) return <FaWind className="text-green-500" size={18} />;
    if (name.includes('co2')) return <FaLeaf className="text-emerald-500" size={18} />;
    return <FaCircle className="text-gray-500" size={14} />;
  };

  const handleHomeDashboard = () => {
    navigate("/");
  };

  const handleAllSolarDashboard = () => {
    navigate("/allSolarDashboard");
  };

  const handleEditZone = (zoneId: number) => {
    // Set the editing zone ID and open the modal
    setEditingZoneId(zoneId);
    setIsEditModalOpen(true);
  };

  // Handle zone configuration
  const handleConfigureZone = (zoneId: number) => {
    // Set the configuring zone ID and open the config modal
    setConfiguringZoneId(zoneId);
    setIsConfigModalOpen(true);
  };

  const handleEditZoneResult = (success: boolean, message: string) => {
    if (success) {
      setSuccessMessage(message);
      // Refresh the zones data to show updated information
      fetchZones();
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
      // Refresh the zones data to show updated information
      fetchZones();
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

  const handleDeleteConfirm = (zoneId: number) => {
    setConfirmDelete(zoneId);
  };

  /**
   * Handle zone deletion
   * @param zoneId ID of the zone to delete
   */
  const handleDeleteZone = async (zoneId: number) => {
    try {
      // Set loading state if needed
      setError(null);
      setSuccessMessage(null);

      // Get the zone name before deletion for the success message
      const zoneName = zones.find(z => z.id === zoneId)?.name || "Selected";

      // Call the delete API
      const result = await deleteZone(zoneId);

      if (result.success) {
        // Remove the zone from state
        setZones(prevZones => prevZones.filter(zone => zone.id !== zoneId));

        // If the deleted zone was the selected one, select another zone
        if (selectedZone?.id === zoneId) {
          if (zones.length > 1) {
            // Select the first available zone that's not the one being deleted
            const newSelectedZone = zones.find(zone => zone.id !== zoneId);
            if (newSelectedZone) setSelectedZone(newSelectedZone);
          } else {
            setSelectedZone(null);
          }
        }

        // Show success message
        setSuccessMessage(`Zone "${zoneName}" deleted successfully`);
      } else {
        // Show error message
        setError(`Failed to delete zone: ${result.message}`);
      }
    } catch (err) {
      console.error('Error deleting zone:', err);
      setError('An error occurred while deleting the zone');
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

  const handleCreateZone = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateZoneResult = (success: boolean, message: string) => {
    if (success) {
      setSuccessMessage(message);
      // Add the refresh call here to make sure zones are up to date
      fetchZones();
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
              Zones Dashboard
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
          <span className="ml-3 text-sm font-medium text-gray-600">Loading zones...</span>
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
              Zones Dashboard
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
            onClick={fetchZones}
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
      {/* Create Zone Modal */}
      <CreateZoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onZoneCreated={handleCreateZoneResult}
        refreshZones={fetchZones}
      />

      {/* Edit Zone Modal */}
      {editingZoneId && (
        <EditZoneModal
          isOpen={isEditModalOpen}
          zoneId={editingZoneId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingZoneId(null);
          }}
          onSave={handleEditZoneResult}
        />
      )}

      {/* Zone Configuration Modal */}
      {configuringZoneId && (
        <ZoneConfigurationModal
          isOpen={isConfigModalOpen}
          zoneId={configuringZoneId}
          onClose={() => {
            setIsConfigModalOpen(false);
            setConfiguringZoneId(null);
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
            Zones Dashboard
          </h1>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={fetchZones}
            className="flex items-center justify-center mr-2 text-gray-600 transition-colors hover:text-blue-600"
            title="Refresh Zones"
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
        {/* Zones List */}
        <div className="w-full p-4 bg-white shadow-md lg:w-1/3 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Available Zones</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">{zones.length} {zones.length === 1 ? 'zone' : 'zones'}</div>
              <button
                onClick={handleCreateZone}
                className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                title="Create New Zone"
              >
                <FaPlus size={12} />
                <span>New Zone</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {zones.map(zone => (
              <div
                key={zone.id}
                onClick={() => handleSelectZone(zone)}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                  ${zone.id === selectedZone?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${zone.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                    {getZoneIcon(zone)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{zone.name}</span>
                      <span className={`px-2 py-0.5 ${getBadgeClass(zone)} rounded-full text-xs`}>
                        {getZoneBadge(zone)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {zone.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Configuration button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfigureZone(zone.id);
                    }}
                    className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-teal-500 hover:bg-gray-200"
                    title="Configure Zone Components"
                  >
                    <FaList size={16} />
                  </button>
                  
                  {/* Edit button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditZone(zone.id);
                    }}
                    className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-blue-500 hover:bg-gray-200"
                    title="Edit Zone"
                  >
                    <FaEdit size={16} />
                  </button>

                  {/* Delete button */}
                  <>
                    {confirmDelete === zone.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
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
                          handleDeleteConfirm(zone.id);
                        }}
                        className="p-1 text-gray-500 transition-colors bg-gray-100 rounded hover:text-red-500 hover:bg-gray-200"
                        title="Delete Zone"
                      >
                        <FaTrash size={16} />
                      </button>
                    )}
                  </>
                </div>
              </div>
            ))}

            {zones.length === 0 && (
              <div className="p-6 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                <p className="mb-2">No zones found</p>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={fetchZones} className="inline-flex items-center px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">
                    <FaSync size={12} className="mr-1" /> Refresh
                  </button>
                  <button onClick={handleCreateZone} className="inline-flex items-center px-3 py-1 text-sm text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200">
                    <FaPlus size={12} className="mr-1" /> Create Zone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone Details */}
        {selectedZone ? (
          <div className="w-full p-4 bg-white shadow-md lg:w-2/3 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full mr-3 ${selectedZone.isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                  {getZoneIcon(selectedZone)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">{selectedZone.name}</h2>
                    <span className={`px-2 py-0.5 ${getBadgeClass(selectedZone)} rounded-full text-xs`}>
                      {getZoneBadge(selectedZone)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedZone.description}</p>
                </div>
              </div>

              {!selectedZone.isActive && (
                <button
                  onClick={() => handleActivateZone(selectedZone.id)}
                  disabled={updatingZone === selectedZone.id}
                  className={`px-4 py-2 text-white transition bg-green-600 rounded-lg hover:bg-green-700 
                    ${updatingZone === selectedZone.id ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {updatingZone === selectedZone.id ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
                      Activating...
                    </>
                  ) : 'Activate Zone'}
                </button>
              )}
            </div>

            {/* Zone Details Sections */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cameras Section */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
                  <FaVideo className="mr-2 text-blue-500" />
                  Cameras
                </h3>

                {selectedZone.cameras.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <p>No cameras configured for this zone</p>
                    <button
                      onClick={() => handleConfigureZone(selectedZone.id)}
                      className="inline-flex items-center px-3 py-1 mt-2 text-sm text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200"
                    >
                      <FaList size={12} className="mr-1" /> Configure Components
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedZone.cameras.map(camera => (
                      <div
                        key={camera.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{camera.name}</div>
                          <div className="text-xs text-gray-500">{camera.host || 'No host information'}</div>
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
                  <FaMicrochip className="mr-2 text-green-500" size={14} />
                  Sensors
                </h3>

                {selectedZone.sensors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <p>No sensors configured for this zone</p>
                    <button
                      onClick={() => handleConfigureZone(selectedZone.id)}
                      className="inline-flex items-center px-3 py-1 mt-2 text-sm text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200"
                    >
                      <FaList size={12} className="mr-1" /> Configure Components
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedZone.sensors.map(sensor => (
                      <div
                        key={sensor.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="p-2 mr-3 bg-gray-100 rounded-full">
                            {getSensorIcon(sensor)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{sensor.name}</div>
                            <div className="text-xs text-gray-500">
                              {sensor.lastReading !== null ? 
                                `${sensor.lastReading} ${sensor.unit}` : 
                                'No reading available'}
                            </div>
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

           {/* Zone Details - Additional Info */}
           <div className="p-4 mt-6 border border-gray-200 rounded-lg">
              <h3 className="mb-3 text-lg font-medium text-gray-800">Additional Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Zone Type</p>
                  <p className="font-medium text-gray-800">
                    {selectedZone.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${selectedZone.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {selectedZone.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="font-medium text-gray-800">{selectedZone.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cameras</p>
                  <p className="font-medium text-gray-800">
                    {selectedZone.cameras.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sensors</p>
                  <p className="font-medium text-gray-800">
                    {selectedZone.sensors.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sensor Readings</p>
                  <p className="font-medium text-gray-800">
                    {selectedZone.sensors.filter(s => s.lastReading !== null).length} active sensors
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-4">
                {!selectedZone.isActive && (
                  <button
                    onClick={() => handleActivateZone(selectedZone.id)}
                    disabled={updatingZone === selectedZone.id}
                    className={`flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 
                      ${updatingZone === selectedZone.id ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <FaCheck className="mr-2" size={14} />
                    Activate Zone
                  </button>
                )}
                
                <button
                  onClick={() => handleConfigureZone(selectedZone.id)}
                  className="flex items-center px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  <FaList className="mr-2" size={14} />
                  Configure Components
                </button>

                <button
                  onClick={() => handleEditZone(selectedZone.id)}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <FaEdit className="mr-2" size={14} />
                  Edit Zone
                </button>

                <button
                  onClick={() => handleDeleteConfirm(selectedZone.id)}
                  className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <FaTrash className="mr-2" size={14} />
                  Delete Zone
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full p-6 text-center bg-white shadow-md lg:w-2/3 rounded-xl">
            <p className="text-gray-500">Select a zone to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneManagement;