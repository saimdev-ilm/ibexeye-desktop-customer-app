import React, { useEffect, useState, useRef } from "react";
import {
  FaPlus,
  FaSearch,
  FaCamera,
  FaCircle,
  FaEye,
} from "react-icons/fa";
import { getAllCameras } from "../../services/cameraService";  
import HlsPlayer from "react-hls-player";
import AddNewCameraModal from "../Modals/AddNewCameraModal";
import { useNavigate } from "react-router-dom";

interface CameraType {
  id: string;
  name: string;
  cloudHls: string | null;
  localHls: string | null;
  network_id?: string;
  status?: string;
  [key: string]: any;
}

interface AllCamerasProps {
  // Optional prop for custom camera selection handler
  onCameraSelect?: (camera: CameraType) => void;
}

const AllCameras: React.FC<AllCamerasProps> = ({ onCameraSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("Active");
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const playersRef = useRef<{ [key: string]: React.RefObject<HTMLVideoElement> }>({});
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const getCameras = async () => {
      try {
        const camerasData = await getAllCameras();
        console.log("📷 Cameras Retrieved:", camerasData);
        setCameras(camerasData);

        // Initialize refs for each camera
        camerasData.forEach((camera: CameraType) => {
          playersRef.current[camera.id] = React.createRef<HTMLVideoElement>();
        });
      } catch (error) {
        console.error("❌ Failed to load cameras:", error);
      }
    };

    getCameras();
  }, []);

  // 🔍 Filtering logic
  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = camera.name?.toLowerCase()?.includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || (filter === "Active" && camera.cloudHls);
    return matchesSearch && matchesFilter;
  });

  // Handle camera selection - either use the custom handler or navigate to details page
  const handleCameraClick = (camera: CameraType) => {
    if (onCameraSelect) {
      // If custom handler is provided, use it
      onCameraSelect(camera);
    } else {
      // Otherwise use default navigation
      navigate(`/camera/${camera.id}`, { state: { camera } });
    }
  };

  return (
    <div className="flex flex-col w-full p-2 2xl:p-6">
      {/* Search and Filter in same row */}
      <div className="flex items-center justify-between mb-6 space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search cameras..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm bg-white border rounded-full shadow 2xl:py-3 focus:outline-none focus:ring-1 focus:ring-customBlue"
          />
          <FaSearch
            size={16}
            className="absolute text-gray-400 -translate-y-1/2 cursor-pointer top-1/2 right-3 hover:text-gray-600"
          />
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 text-sm bg-white border rounded-full shadow focus:outline-none focus:ring-1 focus:ring-customBlue"
        >
          <option value="All">All Cameras</option>
          <option value="Active">Active Cameras</option>
        </select>
      </div>

      {/* Camera Grid */}
      <div className="pe-2 pb-3 overflow-hidden overflow-y-auto 2xl:pe-5 max-h-[40vh] custom-scrollbar2">
        <div
          className="grid gap-5 pb-3 overflow-y-auto pe-3 2xl:gap-6 2xl:pe-5 auto-rows-fr custom-scrollbar2"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {filteredCameras.map((camera) => (
            <div 
              key={camera.id} 
              className="relative overflow-hidden transition-all duration-300 bg-gray-100 shadow-lg cursor-pointer group rounded-xl hover:shadow-xl hover:scale-102" 
              onClick={() => handleCameraClick(camera)}
            >
              {/* Camera Feed Container */}
              <div className="relative overflow-hidden bg-gray-200 rounded-t-xl">
                {/* Status Overlay */}
                <div className="absolute z-10 flex items-center justify-between w-full px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{camera.name}</span>
                  </div>
                  
                  {/* Online Status */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white ${camera.cloudHls ? 'bg-green-600' : 'bg-gray-500'} rounded-full`}>
                    <FaCircle size={8} className={camera.cloudHls ? 'animate-pulse' : ''} />
                    <span>{camera.cloudHls ? 'Active' : 'Offline'}</span>
                  </div>
                </div>
                
                {/* Camera Feed/Placeholder - Using cloudHls instead of localHls */}
                {camera.cloudHls ? (
                  <HlsPlayer
                    key={camera.id}
                    playerRef={playersRef.current[camera.id]}
                    src={camera.cloudHls}
                    autoPlay
                    controls={false}
                    muted
                    className="object-cover w-full h-36"
                    onLoadedMetadata={() =>
                      console.log(`✅ HLS Stream Loaded: ${camera.name}`)
                    }
                    onError={(err) =>
                      console.error(`❌ HLS Error for ${camera.name}:`, err)
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-36 bg-gray-200">
                    <FaCamera size={32} className="mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-500">
                      No stream available
                    </p>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black bg-opacity-0 opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                  <span className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-full">
                   <FaEye/>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Camera */}
          <div 
            className="relative flex flex-col items-center justify-center h-36 transition-all duration-300 bg-white border-2 border-gray-300 border-dashed cursor-pointer rounded-xl hover:bg-gray-50 hover:border-blue-300 hover:shadow-md"
            onClick={() => setModalOpen(true)}
          >
            <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-blue-50">
              <FaPlus size={20} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              Add New Camera
            </span>
          </div>
        </div>
      </div>
      
      {/* Modal - Only Visible When isModalOpen is True */}
      {isModalOpen && (
        <AddNewCameraModal
          onClose={() => setModalOpen(false)}
          fetchAllCameras={getAllCameras}
        />
      )}
    </div>
  );
};

export default AllCameras;