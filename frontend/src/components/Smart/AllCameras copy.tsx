import React, { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaSearch,
  FaCamera,
  FaBatteryHalf,
  FaCircle,
  FaTrash,
} from "react-icons/fa";
import AddNewCameraModal from "../Modals/AddNewCameraModal";
// import { useNavigate } from "react-router-dom";
import {
  fetchAllCameras,
  fetchActiveStreams,
  deleteCamera,
} from "../../services/apiService"; // Import the fetch functions
import HlsPlayer from "react-hls-player"; // Import react-hls-player for HLS streaming

const AllCameras: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>("All"); // State to manage filter (All or Active)

  // const navigate = useNavigate();

  const [cameras, setCameras] = useState<any[]>([]); // State for storing camera data
  const [, setActiveStreams] = useState<any[]>([]); // State for storing active streams

  // Fetch cameras when component mounts
  useEffect(() => {
    const getCameras = async () => {
      try {
        const camerasData = await fetchAllCameras();
        setCameras(camerasData.data); // Set fetched cameras data
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };
    getCameras();
  }, []);

  // Fetch active streams when component mounts
  useEffect(() => {
    const getActiveStreams = async () => {
      try {
        const streams = await fetchActiveStreams();
        setActiveStreams(streams.activeStreams); // Set active streams data
      } catch (error) {
        console.error("Error fetching active streams:", error);
      }
    };
    getActiveStreams();
  }, []);

  // Fetch all cameras
  const fetchAllCamerasFromAPI = async () => {
    try {
      const camerasData = await fetchAllCameras();
      setCameras(camerasData.data); // Update the cameras state
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };

  // Call fetchAllCameras when the component mounts
  useEffect(() => {
    fetchAllCamerasFromAPI();
  }, []);

  // Delete camera and refresh camera list
  const DeleteCamera = async (id: number) => {
    try {
      await deleteCamera(id); // Call deleteCamera service with the camera id
      fetchAllCamerasFromAPI(); // Refresh the camera list after deletion
    } catch (error) {
      console.error("Error deleting camera:", error);
    }
  };

  // const GotoLiveCam = (camera: any) => {
  //   navigate("/CameraDetails", {
  //     state: {
  //       name: camera.name,
  //       streamLink: camera.stream_links ? camera.stream_links.hls : "",
  //       imgSrc: camera.imgSrc || "", // You can pass the imgSrc here too if available
  //     },
  //   });
  // };

  // Filter the cameras based on the filter state
  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch = camera.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "All" ||
      (filter === "Active" && camera.stream_links && camera.stream_links.hls);
    return matchesSearch && matchesFilter;
  });

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  return (
    <div className="flex flex-col h-full p-2 2xl:p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative flex-grow mr-4">
          <input
            type="text"
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-full shadow 2xl:py-3 focus:outline-none focus:ring-1 focus:ring-customBlue"
          />
          <FaSearch
            size={16}
            className="absolute text-gray-400 -translate-y-1/2 cursor-pointer top-1/2 right-3 hover:text-gray-600"
          />
        </div>

        <button
          onClick={toggleEditMode}
          className={`flex items-center px-5 py-2 text-sm font-semibold rounded-full shadow transition ${isEditMode
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-customBlue text-white hover:bg-customBlueHover"
            }`}
        >
          <FaEdit className="mr-2" />
          {isEditMode ? "Stop Editing" : "Edit Layout"}
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 text-sm border rounded-full shadow focus:outline-none focus:ring-1 focus:ring-customBlue"
        >
          <option value="All">All Cameras</option>
          <option value="Active">Active Cameras</option>
        </select>
      </div>

      <div className="  2xl:pe-5 pb-3   custom-scrollbar2 max-h-[23vh] 2xl:h-[56vh] pe-2 custom-scrollbar2 h-[40vh] overflow-hidden overflow-y-auto">
        {/* Cameras Grid */}
        <div
          className="grid gap-3 pb-3 overflow-y-auto 2xl:gap-6 auto-rows-fr pe-3 2xl:pe-5 custom-scrollbar2"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {filteredCameras.map((camera, index) => (
            <div key={index} className="relative group">
              <div
                className="overflow-hidden bg-gray-200 shadow-md cursor-pointer rounded-2xl"
              >
                {/* Camera Image, Video, or Webcam */}
                {camera.stream_links ? (
                  <div className="absolute p-2 text-xs text-white bg-green-600 rounded-full top-2 right-2">
                    <FaCircle size={10} className="text-green-500" />
                  </div>
                ) : null}

                {/* If HLS stream link is present, use HlsPlayer */}
                {camera.stream_links && camera.stream_links.hls ? (
                  <HlsPlayer
                    src={camera.stream_links.hls}
                    autoPlay
                    className="object-cover w-full h-48"
                  />
                ) : camera.videoSrc ? (
                  <VideoPlayer videoSrc={camera.videoSrc} />
                ) : camera.isWebcam ? (
                  <WebcamFeed />
                ) : camera.imgSrc ? (
                  <img
                    src={camera.imgSrc}
                    alt={camera.name}
                    className="object-cover w-full h-48 transition-opacity duration-300 group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-300">
                    <FaCamera size={30} className="text-gray-500" />
                  </div>
                )}

                {/* Settings Icon */}
                {isEditMode && (
                  <div
                    onClick={() => DeleteCamera(camera.id)} // Delete camera by id
                    className="absolute flex items-center justify-center w-8 h-8 text-white bg-black bg-opacity-50 rounded-full cursor-pointer top-2 right-2 hover:bg-opacity-70"
                  >
                    <FaTrash
                      size={14}
                      className="text-red-500 hover:text-red-700"
                    />
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-gray-800 rounded-md top-2 left-2 bg-opacity-70">
                  <FaBatteryHalf size={20} /> {camera.status || ""}
                </div>
              </div>

              {/* Camera Name */}
              <div className="mt-3 text-sm font-semibold text-center text-customBlue">
                {camera.name}
              </div>
            </div>
          ))}

          {/* Add New Camera Placeholder */}
          <div
            onClick={() => setShowModal(true)}
            className="flex flex-col items-center justify-center h-48 transition-colors duration-300 bg-gray-100 shadow-md cursor-pointer rounded-3xl hover:bg-gray-200"
          >
            <FaPlus size={28} className="text-gray-500" />
            <span className="mt-2 text-sm font-semibold text-gray-600">
              Add New Camera
            </span>
          </div>
        </div>
      </div>

      {/* Add New Camera Modal */}
      {showModal && (
        <AddNewCameraModal
          onClose={() => setShowModal(false)}
          fetchAllCameras={fetchAllCamerasFromAPI} // Pass the fetch function to the modal
        />
      )}
    </div>
  );
};

export default AllCameras;

// VideoPlayer Component for External Video URLs
const VideoPlayer: React.FC<{ videoSrc: string }> = ({ videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleError = () => {
      if (videoRef.current) {
        const parent = videoRef.current.parentElement;
        if (parent) {
          parent.innerHTML = `<iframe
            src="${videoSrc}"
            frameborder="0"
            allow="autoplay"
            class="object-cover w-full h-48"
          ></iframe>`;
        }
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener("error", handleError);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("error", handleError);
      }
    };
  }, [videoSrc]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      autoPlay
      muted
      className="object-cover w-full h-48"
    ></video>
  );
};

// WebcamFeed Component for Webcam Streams
const WebcamFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((error) => console.error("Error accessing webcam:", error));

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="object-cover w-full h-48"
      autoPlay
      muted
    ></video>
  );
};
