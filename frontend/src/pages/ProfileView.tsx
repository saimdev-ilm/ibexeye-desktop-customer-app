import { useEffect, useState } from "react";
import { FaLaptop, FaMapMarkedAlt, FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { fetchProfileData, fetchUserDevices, fetchUserAreas } from "../services/apiService";
import { ProfileData, Device, Area, Sensor, Zone } from "../types/customTypes"; // Import interfaces

const ProfileView = () => {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
   const [devices, setDevices] = useState<Device[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  useEffect(() => {
    const getProfileData = async () => {
      try {
        const data = await fetchProfileData();
        setProfileData(data);
        console.log("Profile:", data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
   

    const getUserDevices = async () => {
      try {
        const response = await fetchUserDevices();
        setDevices(response.data);
        console.log("Devices:", response.data);
      } catch (error) {
        console.error("Error fetching user devices:", error);
      }
    };

    const getUserAreas = async () => {
      try {
        const response = await fetchUserAreas();
        setAreas(response.data);
        console.log("Areas:", response.data);
      } catch (error) {
        console.error("Error fetching user areas:", error);
      }
    };

    getProfileData();
     getUserDevices();
    getUserAreas();
  }, []);

  const gotoDashboard = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col w-full h-full ">
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            title="Minimize View"
            onClick={gotoDashboard}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            User Profile
          </h1>
        </div>
      </header>

      <div className="flex flex-col gap-4 mt-6 ">
        <div className="p-6 bg-white border shadow rounded-3xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Profile Information</h2>
          {profileData && (
            <div className="pb-4 mb-4 border-b">
              <p className="text-lg font-semibold">{profileData.firstName} {profileData.lastName}</p>
              <p className="text-gray-600">{profileData.email}</p>
              <p className="text-gray-600">Organization: {profileData.currentOrg.name}</p>
            </div>
          )}
        </div>
       

        <div className="p-6 bg-white border shadow rounded-3xl">

          <h3 className="flex items-center gap-2 mb-2 text-xl font-bold text-gray-800">
            <FaLaptop /> Devices
          </h3>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.isArray(devices) && devices.map((device) => (
              <li key={device.id} className="p-2 mb-2 bg-gray-200 rounded">
                <p className="font-semibold">{device.name}</p>
                <p className="text-gray-600">IP: {device.ipAddress}</p>
                <p className="text-gray-600">MAC: {device.macAddress}</p>
                <p className="text-gray-600">Team: {device.team?.name || "No Team"}</p>
                <p className="text-gray-600">Sensors:</p>
                <ul className="ml-4">
                  {device.sensors.map((sensor: Sensor) => (
                    <li key={sensor.id} className="text-gray-600">{sensor.name}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

        </div>
        <div className="p-6 bg-white border shadow rounded-3xl">

          <h3 className="flex items-center gap-2 mb-2 text-xl font-bold text-gray-800">
            <FaMapMarkedAlt /> Areas
          </h3>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.isArray(areas) &&
              areas.map((area) => (
                <li
                  key={area.id}
                  className="p-4 bg-gray-200 rounded-lg shadow-md"
                >
                  <p className="text-lg font-semibold">{area.name}</p>
                  <p className="font-medium text-gray-600">Zones:</p>
                  <ul className="ml-4 list-disc">
                    {area.zones.map((zone: Zone) => (
                      <li key={zone.id} className="text-gray-600">{zone.name}</li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>


        </div>
      </div>
    </div>
  );
};

export default ProfileView;