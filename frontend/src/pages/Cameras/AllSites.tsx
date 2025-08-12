import { FaChevronLeft, FaEdit, FaEllipsisV, FaEye, FaRedo, FaSolarPanel, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import {
    FaPlus,
    FaSearch,
    FaCamera,
    FaBatteryHalf,
    FaCircle,
} from "react-icons/fa";
import { fetchCamerasService } from "../../services/apiService";
import HlsPlayer from "react-hls-player";
import AddNewCameraModal from "../../components/Modals/AddNewCameraModal";
import Skeleton from "react-loading-skeleton"; // Install with `npm install react-loading-skeleton`
import "react-loading-skeleton/dist/skeleton.css";


const AllSites: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<string>("Active");
    const [cameras, setCameras] = useState<any[]>([]);
    const playersRef = useRef<{ [key: number]: React.RefObject<HTMLVideoElement> }>({});
    const [viewColumns, setViewColumns] = useState<number>(4); // Default to 4 columns

    const [isModalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open

    const toggleMenu = (id) => {
        setMenuOpen(menuOpen === id ? null : id);
    };


    useEffect(() => {
        const getCameras = async () => {
            try {
                const camerasData = await fetchCamerasService();
                console.log("📷 Cameras Retrieved:", camerasData);
                setCameras(camerasData);

                // Initialize refs for each camera
                camerasData.forEach((camera) => {
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
        const matchesFilter = filter === "All" || (filter === "Active" && camera.localHls);
        return matchesSearch && matchesFilter;
    });

    const handleHomeDasboard = () => {
        navigate("/")
    }
    const handleAllSolarDashboard = () => {
        navigate("/allSolarDashboard")
    }

    const goToCameraDetails = (camera: any) => {
        navigate(`/smartCameraDetails/${camera.id}`); // ✅ Pass only ID in URL
    };



    return (
        <div className="flex flex-col w-full h-full">
            {/* Header Section */}
            <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-2">
                    <button
                        title="Minimize View"
                        onClick={handleHomeDasboard}
                        className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
                        All Sites Dashboard
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <button
                        title="Minimize View"
                        onClick={handleAllSolarDashboard}
                        className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
                    >
                        <FaSolarPanel />
                    </button>

                </div>
            </header>

            <div className="flex flex-col items-center justify-center w-full gap-2">
                {/* Cameras Section */}
                <div className="flex flex-grow w-full gap-4">
                    <div className="w-full transition-all duration-300">
                        <div className="">
                            <div className="flex flex-col w-full h-full p-2 w- 2xl:p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center justify-between w-1/2 mb-3">
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
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <label className="text-sm font-semibold text-gray-700">View Mode:</label>
                                            <select
                                                value={viewColumns}
                                                onChange={(e) => setViewColumns(Number(e.target.value))}
                                                className="p-2 text-sm border rounded-full shadow focus:outline-none focus:ring-1 focus:ring-customBlue"
                                            >
                                                <option value="1">1 per Row</option>
                                                <option value="2">2 per Row</option>
                                                <option value="3">3 per Row</option>
                                                <option value="4">4 per Row</option>
                                            </select>
                                        </div>
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
                                        <div className="mb-4"
                                            onClick={() => setModalOpen(true)}

                                        >
                                            <button className="w-full py-2 gap-3 flex text-sm material-button text-white bg-[#1B3C55] border rounded-full hover:bg-[#0c1c29] transition ">
                                                <FaPlus /> Add New Camera
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="2xl:pe-5 pb-3 custom-scrollbar2 max-h-[69vh] pe-2 overflow-hidden overflow-y-auto">
                                    <div
                                        className="grid gap-4 pb-3 overflow-y-auto 2xl:gap-6 auto-rows-fr pe-1 2xl:pe-1 custom-scrollbar2"
                                        style={{
                                            gridTemplateColumns: `repeat(${viewColumns}, minmax(250px, 1fr))`,
                                        }}
                                    >
                                        {filteredCameras.length === 0
                                            ? [...Array(4)].map((_, index) => (
                                                <div key={index} className="relative p-4 bg-white shadow-md rounded-2xl">
                                                    <Skeleton height={200} />
                                                    <Skeleton height={20} className="mt-2" />
                                                    <Skeleton height={15} className="mt-1" />
                                                </div>
                                            ))
                                            : filteredCameras.map((camera) => (
                                                <div key={camera.id} className="relative group">
                                                    <div className="overflow-hidden bg-gray-200 shadow-md cursor-pointer rounded-2xl">
                                                        {/* Indicator for active stream */}
                                                        {camera.localHls && (
                                                            <div className="absolute p-2 text-xs text-white bg-green-600 rounded-full top-2 right-2">
                                                                <FaCircle size={10} className="text-green-500" />
                                                            </div>
                                                        )}

                                                        {/* More Options Dropdown */}
                                                        <div className="absolute z-20 top-2 right-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleMenu(camera.id);
                                                                }}
                                                                className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                                                            >
                                                                <FaEllipsisV className="text-gray-600" />
                                                            </button>
                                                            {menuOpen === camera.id && (
                                                                <div className="absolute right-0 z-10 w-32 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-md">
                                                                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                                        <FaEdit className="mr-2" /> Edit
                                                                    </button>
                                                                    <button onClick={() => goToCameraDetails(camera)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                                        <FaEye className="mr-2" /> View
                                                                    </button>
                                                                    <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-100">
                                                                        <FaTrash className="mr-2" /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Camera Stream */}
                                                        {camera.localHls ? (
                                                            <HlsPlayer
                                                                key={camera.id}
                                                                playerRef={playersRef.current[camera.id]}
                                                                src={camera.localHls}
                                                                autoPlay
                                                                controls
                                                                muted
                                                                className="object-cover w-full h-64"
                                                                onLoadedMetadata={() =>
                                                                    console.log(`✅ HLS Stream Loaded: ${camera.name}`)
                                                                }
                                                                onError={(err) =>
                                                                    console.error(`❌ HLS Error for ${camera.name}:`, err)
                                                                }
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-2xl">
                                                                <div className="p-3 bg-gray-300 rounded-full">
                                                                    <FaCamera size={40} className="text-gray-600" />
                                                                </div>
                                                                <p className="mt-2 text-sm font-semibold text-gray-500">
                                                                    No stream available
                                                                </p>
                                                               
                                                            </div>
                                                        )}

                                                        {/* Camera Status */}
                                                        <div className="absolute flex items-center justify-center gap-2 px-2 py-1 text-xs font-semibold text-white bg-gray-800 rounded-md top-2 left-2 bg-opacity-70">
                                                            <FaCamera size={20} /> {camera.name}
                                                        </div>
                                                    </div> 
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Modal - Only Visible When isModalOpen is True */}
                                {isModalOpen && (
                                    <AddNewCameraModal
                                        onClose={() => setModalOpen(false)} // Close Modal Function
                                        fetchAllCameras={fetchCamerasService} // Refresh Camera List
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllSites;
