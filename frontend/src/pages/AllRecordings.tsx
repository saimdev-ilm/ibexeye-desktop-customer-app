// Enhanced AllRecordings.tsx with Improved Day-wise Directory Structure
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronLeft,
    FaSolarPanel,
    FaVideo,
    FaCalendarAlt,
    FaClock,
    FaFileVideo,
    FaDownload,
    FaSync,
    FaFilter,
    FaSearch,
    FaExclamationCircle,
    FaExternalLinkAlt,
    FaPlay,
    FaTimes,
    FaFolder,
    FaFolderOpen,
    FaListUl,
    FaTh,
    FaChevronDown,
    FaChevronRight,
    FaEye
} from "react-icons/fa";
import {
    getRecordings,
    getRecordingStreamUrl,
    formatFileSize,
    formatDate,
    Recording,
    Filters,
    RecordingsQueryParams
} from '../services/recordingService';

// Import the VideoModal component
import { baseURL, deviceId } from '../api/config';
import { getToken } from '../services/authService';

// Interface for grouped recordings
interface GroupedRecordings {
    [key: string]: {
        date: string; // Human-readable date
        count: number;
        recordings: Recording[];
        subfolders?: {
            [key: string]: {
                count: number;
                recordings: Recording[];
            }
        }
    };
}

const AllRecordings: React.FC = () => {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [allRecordings, setAllRecordings] = useState<Recording[]>([]);
    const [, setFilters] = useState<Filters | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Recording | null>(null);
    const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [videoUrl, setVideoUrl] = useState<string>('');
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Directory view states
    const [viewMode, setViewMode] = useState<'directory' | 'grid'>('directory');
    const [groupedRecordings, setGroupedRecordings] = useState<GroupedRecordings>({});
    const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});
    const [loadingMore, setLoadingMore] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Infinite scroll states
    const [allLoaded, setAllLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    const navigate = useNavigate();

    // Initial fetch of recordings
    useEffect(() => {
        fetchRecordings(1);
    }, [startDate, endDate]);

    // Group recordings by date and camera when recordings change
    useEffect(() => {
        if (recordings.length > 0) {
            organizeRecordingsIntoFolders();
        }
    }, [recordings]);

    // Handle search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                setIsSearching(true);
                filterRecordings();
            } else if (searchTerm === '') {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, allRecordings]);

    // Filter recordings based on search term
    const filterRecordings = () => {
        if (allRecordings.length > 0) {
            const filtered = allRecordings.filter(rec =>
                rec.cameraName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rec.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (rec.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
            );
            setRecordings(filtered);
        }
    };

    // Organize recordings into a directory structure
    const organizeRecordingsIntoFolders = () => {
        const grouped: GroupedRecordings = {};

        // Group by date first
        recordings.forEach(recording => {
            const date = new Date(recording.createdAt);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            // Format the date in a human-readable format
            const options: Intl.DateTimeFormatOptions = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            const formattedDate = date.toLocaleDateString('en-US', options);
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    date: formattedDate,
                    count: 0,
                    recordings: [],
                    subfolders: {}
                };
            }

            // Group by camera name within each date
            const cameraName = recording.cameraName || 'Unknown Camera';
            
            if (!grouped[dateKey].subfolders![cameraName]) {
                grouped[dateKey].subfolders![cameraName] = {
                    count: 0,
                    recordings: []
                };
            }

            // Add recording to its camera folder
            grouped[dateKey].subfolders![cameraName].recordings.push(recording);
            grouped[dateKey].subfolders![cameraName].count += 1;
            
            // Also add to date folder for flat view option
            grouped[dateKey].recordings.push(recording);
            grouped[dateKey].count += 1;
        });

        setGroupedRecordings(grouped);
        
        // Auto-expand the most recent folder
        if (Object.keys(grouped).length > 0) {
            const sortedDates = Object.keys(grouped).sort().reverse();
            if (sortedDates.length > 0) {
                setExpandedFolders(prev => ({
                    ...prev,
                    [sortedDates[0]]: true
                }));
            }
        }
    };

    // Fetch recordings with infinite scroll support
    const fetchRecordings = async (page: number, append: boolean = false) => {
        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError(null);

            const queryParams: RecordingsQueryParams = {
                page,
                limit: pageSize
            };

            if (startDate) queryParams.startDate = new Date(startDate).toISOString();
            if (endDate) queryParams.endDate = new Date(endDate).toISOString();

            const data = await getRecordings(queryParams);
            
            if (append) {
                setRecordings(prev => [...prev, ...data.recordings]);
                setAllRecordings(prev => [...prev, ...data.recordings]);
            } else {
                setRecordings(data.recordings);
                setAllRecordings(data.recordings);
            }
            
            setFilters(data.filters);
            
            // Check if we've loaded all recordings
            if (data.recordings.length < pageSize) {
                setAllLoaded(true);
            } else {
                setAllLoaded(false);
            }
            
            setCurrentPage(page);
        } catch (err) {
            console.error('Failed to fetch recordings:', err);
            setError('Failed to load recordings. Please try again later.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Load more recordings when needed
    const loadMoreRecordings = () => {
        if (!allLoaded && !loadingMore && !isSearching) {
            fetchRecordings(currentPage + 1, true);
        }
    };

    // Toggle folder expansion
    const toggleFolder = (folderKey: string) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderKey]: !prev[folderKey]
        }));
    };

    // Request video for streaming
    const requestVideo = async (recording: Recording) => {
        setVideoStatus('loading');
        setVideoUrl('');

        try {
            const token = getToken();
            const encodedId = encodeURIComponent(recording.id);
            const url = `${baseURL}/device-recordings/serve/${deviceId}/${encodedId}?access_token=${token}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {},
            });

            if (!response.ok) {
                throw new Error(`Failed to request video: ${response.status}`);
            }

            const result = await response.json();

            if (result.data?.status === 'ready' && result.data?.url) {
                // Video is immediately ready
                setVideoStatus('ready');
                setVideoUrl(result.data.url);
            } else if (result.data?.statusUrl) {
                // Need to poll for status
                setVideoStatus('loading');
                startPolling(result.data.statusUrl);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error("Error requesting video:", err);
            setVideoStatus('error');
            setError("Failed to load video. Please try again.");
        }
    };

    // Poll for video status
    const startPolling = (statusUrl: string) => {
        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Set up polling
        pollingIntervalRef.current = setInterval(async () => {
            try {
                const token = getToken();
                const url = `${baseURL}${statusUrl}?access_token=${token}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {},
                });

                if (!response.ok) {
                    throw new Error(`Polling failed: ${response.status}`);
                }

                const result = await response.json();

                if (result.data?.status === 'ready' && result.data?.url) {
                    // Video is ready
                    clearInterval(pollingIntervalRef.current!);
                    setVideoStatus('ready');
                    setVideoUrl(result.data.url);
                } else if (result.data?.status === 'error') {
                    // Error occurred
                    clearInterval(pollingIntervalRef.current!);
                    setVideoStatus('error');
                    setError("Failed to process video. Please try again.");
                }
                // If status is still 'pending', continue polling
            } catch (err) {
                console.error("Error polling video status:", err);
                clearInterval(pollingIntervalRef.current!);
                setVideoStatus('error');
                setError("Failed to check video status. Please try again.");
            }
        }, 3000); // Poll every 3 seconds
    };

    const handleDateFilter = (e: React.FormEvent) => {
        e.preventDefault();
        // Reset everything when applying new filters
        setRecordings([]);
        setAllRecordings([]);
        setCurrentPage(1);
        setAllLoaded(false);
        setSearchTerm('');
        setIsSearching(false);
        setShowFilters(false);
        // fetchRecordings will be called by the useEffect
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setAllRecordings([]);
        setRecordings([]);
        setIsSearching(false);
        setCurrentPage(1);
        setAllLoaded(false);
        setShowFilters(false);
        // fetchRecordings will be called by the useEffect
    };

    const handlePlayRecording = (recording: Recording) => {
        setSelectedVideo(recording);
        requestVideo(recording);
    };

    const handleCloseVideoModal = () => {
        setSelectedVideo(null);
        setVideoUrl('');
        setVideoStatus('idle');
        // Clear any polling when closing
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    };

    const handleDownloadRecording = (recording: Recording) => {
        const streamUrl = getRecordingStreamUrl(recording);
        const a = document.createElement('a');
        a.href = streamUrl;
        a.download = recording.filename || 'recording.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleOpenInNewTab = (recording: Recording) => {
        const streamUrl = getRecordingStreamUrl(recording);
        window.open(streamUrl, '_blank');
    };

    const handleHomeDashboard = () => {
        navigate("/");
    };

    const handleAllSolarDashboard = () => {
        navigate("/allSolarDashboard");
    };

    if (loading && recordings.length === 0) {
        return (
            <div className="flex flex-col w-full h-full gap-4">
                {/* Header */}
                <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            title="Go to Home Dashboard"
                            onClick={handleHomeDashboard}
                            className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                        >
                            <FaChevronLeft />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 2xl:text-2xl">
                            Recordings Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            title="Go to Solar Dashboard"
                            onClick={handleAllSolarDashboard}
                            className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                        >
                            <FaSolarPanel />
                        </button>
                    </div>
                </header>

                {/* Loading state */}
                <div className="flex flex-col items-center justify-center h-64 bg-white shadow-md rounded-xl">
                    <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <span className="mt-4 text-base font-medium text-gray-600">Loading recordings...</span>
                </div>
            </div>
        );
    }

    if (error && recordings.length === 0) {
        return (
            <div className="flex flex-col w-full h-full gap-4">
                {/* Header */}
                <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            title="Go to Home Dashboard"
                            onClick={handleHomeDashboard}
                            className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                        >
                            <FaChevronLeft />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 2xl:text-2xl">
                            Recordings Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            title="Go to Solar Dashboard"
                            onClick={handleAllSolarDashboard}
                            className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                        >
                            <FaSolarPanel />
                        </button>
                    </div>
                </header>

                {/* Error state */}
                <div className="p-6 text-red-700 bg-white shadow-md rounded-xl">
                    <div className="flex items-center mb-3">
                        <FaExclamationCircle className="mr-2" size={20} />
                        <p className="text-lg font-semibold">Error</p>
                    </div>
                    <p className="mb-4 text-base">{error}</p>
                    <button
                        onClick={() => fetchRecordings(1)}
                        className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const renderDirectoryView = () => {
        const sortedDates = Object.keys(groupedRecordings).sort().reverse();
        
        if (sortedDates.length === 0) {
            return (
                <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <FaFolder className="mx-auto mb-3" size={36} />
                    <p className="mb-3 text-lg">No recordings found</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStartDate('');
                            setEndDate('');
                            setAllRecordings([]);
                            setCurrentPage(1);
                            setIsSearching(false);
                            fetchRecordings(1);
                        }}
                        className="px-6 py-2 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Clear Filters & Refresh
                    </button>
                </div>
            );
        }

        return (
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow">
                <table className="min-w-full table-fixed">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="w-1/2 p-4 text-left text-gray-700">Name</th>
                            <th className="w-1/4 p-4 text-left text-gray-700">Date</th>
                            <th className="p-4 text-left text-gray-700 w-1/8">Size</th>
                            <th className="p-4 text-right text-gray-700 w-1/8">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedDates.map(dateKey => {
                            const dateFolder = groupedRecordings[dateKey];
                            return (
                                <React.Fragment key={dateKey}>
                                    {/* Date Folder */}
                                    <tr 
                                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${expandedFolders[dateKey] ? 'bg-blue-50' : ''}`}
                                        onClick={() => toggleFolder(dateKey)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                {expandedFolders[dateKey] ? 
                                                    <FaFolderOpen className="mr-3 text-blue-600" size={20} /> : 
                                                    <FaFolder className="mr-3 text-blue-600" size={20} />
                                                }
                                                <div className="flex items-center">
                                                    <span className="font-medium text-gray-800">
                                                        {dateFolder.date}
                                                    </span>
                                                    <span className="ml-2 text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                        {dateFolder.count}
                                                    </span>
                                                    {expandedFolders[dateKey] ? 
                                                        <FaChevronDown size={12} className="ml-2 text-gray-500" /> : 
                                                        <FaChevronRight size={12} className="ml-2 text-gray-500" />
                                                    }
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{dateKey}</td>
                                        <td className="p-4 text-gray-600">
                                            {formatFileSize(
                                                dateFolder.recordings.reduce(
                                                    (sum, rec) => sum + (rec.size || 0), 0
                                                )
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                className="p-1 text-gray-600 hover:text-blue-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFolder(dateKey);
                                                }}
                                            >
                                                {expandedFolders[dateKey] ? 
                                                    <FaChevronDown size={14} /> : 
                                                    <FaChevronRight size={14} />
                                                }
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Camera Subfolders */}
                                    {expandedFolders[dateKey] && Object.keys(dateFolder.subfolders || {}).map(cameraKey => {
                                        const cameraFolder = dateFolder.subfolders![cameraKey];
                                        const folderKey = `${dateKey}-${cameraKey}`;
                                        
                                        return (
                                            <React.Fragment key={folderKey}>
                                                {/* Camera Folder */}
                                                <tr 
                                                    className={`hover:bg-green-50 transition-colors cursor-pointer ${expandedFolders[folderKey] ? 'bg-green-50' : 'bg-gray-50'}`}
                                                    onClick={() => toggleFolder(folderKey)}
                                                >
                                                    <td className="p-4 pl-10">
                                                        <div className="flex items-center">
                                                            {expandedFolders[folderKey] ? 
                                                                <FaFolderOpen className="mr-3 text-green-600" size={18} /> : 
                                                                <FaFolder className="mr-3 text-green-600" size={18} />
                                                            }
                                                            <div className="flex items-center">
                                                                <span className="max-w-md font-medium text-gray-800 truncate">
                                                                    {cameraKey}
                                                                </span>
                                                                <span className="ml-2 text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                                    {cameraFolder.count}
                                                                </span>
                                                                {expandedFolders[folderKey] ? 
                                                                    <FaChevronDown size={10} className="ml-2 text-gray-500" /> : 
                                                                    <FaChevronRight size={10} className="ml-2 text-gray-500" />
                                                                }
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-gray-600">{dateKey}</td>
                                                    <td className="p-4 text-gray-600">
                                                        {formatFileSize(
                                                            cameraFolder.recordings.reduce(
                                                                (sum, rec) => sum + (rec.size || 0), 0
                                                            )
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            className="p-1 text-gray-600 hover:text-green-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFolder(folderKey);
                                                            }}
                                                        >
                                                            {expandedFolders[folderKey] ? 
                                                                <FaChevronDown size={14} /> : 
                                                                <FaChevronRight size={14} />
                                                            }
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Individual Recordings */}
                                                {expandedFolders[folderKey] && cameraFolder.recordings.map(recording => (
                                                    <tr 
                                                        key={recording.id} 
                                                        className="transition-colors bg-white hover:bg-gray-50"
                                                    >
                                                        <td className="p-4 pl-16">
                                                            <div className="flex items-center">
                                                                <FaFileVideo className="mr-3 text-blue-500" size={16} />
                                                                <span className="text-gray-700 truncate" title={recording.filename}>
                                                                    {recording.filename || `Recording ${recording.id.substring(0, 8)}`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600">
                                                            {formatDate(recording.createdAt)}
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600">
                                                            {formatFileSize(recording.size)}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => handlePlayRecording(recording)}
                                                                    className="p-1.5 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                                                                    title="Play"
                                                                >
                                                                    <FaPlay size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenInNewTab(recording)}
                                                                    className="p-1.5 text-white bg-green-600 rounded-full hover:bg-green-700"
                                                                    title="Open in New Tab"
                                                                >
                                                                    <FaExternalLinkAlt size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadRecording(recording)}
                                                                    className="p-1.5 text-white bg-blue-500 rounded-full hover:bg-blue-600"
                                                                    title="Download"
                                                                >
                                                                    <FaDownload size={10} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Loading more indicator */}
                {loadingMore && (
                    <div className="flex items-center justify-center p-4 border-t border-gray-200">
                        <div className="w-5 h-5 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading more recordings...</span>
                    </div>
                )}
                
                {/* Load more button */}
                {!allLoaded && !isSearching && !loadingMore && (
                    <div className="flex justify-center p-4 border-t border-gray-200">
                        <button
                            onClick={loadMoreRecordings}
                            className="px-4 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                        >
                            Load More Recordings
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderGridView = () => {
        if (recordings.length === 0) {
            return (
                <div className="p-8 text-center text-gray-500 border border-gray-300 border-dashed rounded-lg">
                    <FaVideo className="mx-auto mb-3" size={36} />
                    <p className="mb-3 text-lg">No recordings found</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStartDate('');
                            setEndDate('');
                            setAllRecordings([]);
                            setIsSearching(false);
                            fetchRecordings(1);
                        }}
                        className="px-6 py-2 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Clear Filters & Refresh
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {recordings.map(recording => (
                        <div
                            key={recording.id}
                            className="relative overflow-hidden transition-all duration-300 border border-gray-200 rounded-lg hover:shadow-lg group hover:border-blue-400"
                        >
                            {/* Thumbnail */}
                            <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                                {/* Video thumbnail with placeholder background */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-5">
                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black opacity-0 bg-opacity-30 group-hover:opacity-100">
                                        <button
                                            onClick={() => handlePlayRecording(recording)}
                                            className="p-3 text-white transition-transform transform bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-110"
                                            title="Play Video"
                                        >
                                            <FaPlay size={16} />
                                        </button>
                                    </div>
                                </div>

                                {recording.zone && (
                                    <div className="absolute top-0 left-0 px-2 py-1 mt-2 ml-2 text-xs font-medium text-white bg-blue-600 rounded-lg">
                                        {recording.zone.name}
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-white bg-gradient-to-t from-black to-transparent">
                                    <span className="block font-medium truncate">{recording.cameraName}</span>
                                </div>
                            </div>

                            {/* Recording Info */}
                            <div className="p-3">
                                <p className="text-xs text-gray-500 truncate">
                                    {recording.filename}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                    <div className="flex items-center mr-3">
                                        <FaCalendarAlt className="mr-1" size={12} />
                                        <span>{formatDate(recording.createdAt).split(',')[0]}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaClock className="mr-1" size={12} />
                                        <span>{formatDate(recording.createdAt).split(',')[1]}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <FaFileVideo className="mr-1" size={12} />
                                        <span>{formatFileSize(recording.size)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePlayRecording(recording)}
                                            className="p-1.5 text-xs text-white bg-blue-600 rounded-full hover:bg-blue-700"
                                            title="Play"
                                        >
                                            <FaPlay size={10} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenInNewTab(recording)}
                                            className="p-1.5 text-xs text-white bg-green-600 rounded-full hover:bg-green-700"
                                            title="Open in New Tab"
                                        >
                                            <FaExternalLinkAlt size={10} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadRecording(recording)}
                                            className="p-1.5 text-xs text-white bg-blue-500 rounded-full hover:bg-blue-600"
                                            title="Download"
                                        >
                                            <FaDownload size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading more indicator */}
                {loadingMore && (
                    <div className="flex items-center justify-center p-4 mt-6">
                        <div className="w-5 h-5 mr-2 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading more recordings...</span>
                    </div>
                )}
                
                {/* Load more button */}
                {!allLoaded && !isSearching && !loadingMore && (
                    <div className="flex justify-center p-4 mt-6">
                        <button
                            onClick={loadMoreRecordings}
                            className="px-6 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                        >
                            Load More Recordings
                        </button>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="flex flex-col w-full h-full gap-4">
            {/* Header Section */}
            <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-white border rounded-full shadow-md 2xl:px-6 2xl:py-3">
                <div className="flex items-center justify-center gap-3">
                    <button
                        title="Go to Home Dashboard"
                        onClick={handleHomeDashboard}
                        className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                    >
                        <FaChevronLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 2xl:text-2xl">
                        Recordings Dashboard
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setViewMode('directory')}
                            className={`p-2 rounded-lg flex items-center ${viewMode === 'directory' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-200'}`}
                            title="Directory View"
                        >
                            <FaListUl size={16} />
                            <span className="hidden ml-1 text-sm md:inline">Folders</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg flex items-center ${viewMode === 'grid' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-200'}`}
                            title="Grid View"
                        >
                            <FaTh size={16} />
                            <span className="hidden ml-1 text-sm md:inline">Grid</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center justify-center p-2 text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                        title="Toggle Filters"
                    >
                        <FaFilter size={16} />
                        {(startDate || endDate) && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setAllRecordings([]);
                            setIsSearching(false);
                            fetchRecordings(1);
                        }}
                        className="flex items-center justify-center p-2 text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                        title="Refresh Recordings"
                    >
                        <FaSync size={16} />
                    </button>
                    <button
                        title="Go to Solar Dashboard"
                        onClick={handleAllSolarDashboard}
                        className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full hover:bg-blue-700"
                    >
                        <FaSolarPanel />
                    </button>
                </div>
            </header>

            {/* Search and Filters */}
            <div className="bg-white shadow-lg rounded-xl">
                {/* Search Bar */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaSearch className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="w-full p-3 pl-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search by camera name, zone or filename..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={16} />
                            </button>
                        )}
                    </div>
                    {isSearching && (
                        <div className="mt-2 text-sm text-gray-500">
                            Showing {recordings.length} results {allRecordings.length > 0 ? `from ${allRecordings.length} recordings` : ''}
                            {searchTerm && (
                                <span> for "{searchTerm}"</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="p-5 border-b">
                        <h3 className="mb-4 text-lg font-medium">Filter Recordings</h3>
                        <form onSubmit={handleDateFilter}>
                            <div className="grid gap-6 mb-5 md:grid-cols-2">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Start Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        End Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-5 py-2.5 text-base text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Recordings Content */}
                <div className="p-4">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 mr-3 border-blue-500 border-solid rounded-full border-t-3 animate-spin"></div>
                            <span className="text-base text-gray-600">Loading recordings...</span>
                        </div>
                    )}

                    {/* Directory or Grid View based on viewMode */}
                    {!loading && viewMode === 'directory' ? renderDirectoryView() : renderGridView()}
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
                    <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-xl font-semibold">
                                {selectedVideo.cameraName || 'Video Recording'}
                            </h3>
                            <button
                                onClick={handleCloseVideoModal}
                                className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700"
                            >
                                <FaTimes size={22} />
                            </button>
                        </div>

                        {/* Video Player */}
                        <div className="p-4">
                            {videoStatus === 'loading' ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="mb-4 border-t-4 border-blue-500 border-solid rounded-full w-14 h-14 animate-spin"></div>
                                    <p className="text-lg text-gray-600">Preparing video for playback...</p>
                                </div>
                            ) : videoStatus === 'error' ? (
                                <div className="flex flex-col items-center justify-center h-64 text-red-500">
                                    <FaExclamationCircle className="mb-3" size={40} />
                                    <p className="text-lg">{error || "An error occurred while loading the video"}</p>
                                    <button
                                        className="px-5 py-2.5 mt-5 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                        onClick={() => requestVideo(selectedVideo)}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : videoStatus === 'ready' && videoUrl ? (
                                <>
                                    <div className="overflow-hidden bg-black rounded-lg">
                                        <video
                                            className="w-full rounded"
                                            controls
                                            autoPlay
                                            src={videoUrl}
                                            onError={() => {
                                                setVideoStatus('error');
                                                setError("Failed to play video. The URL might have expired.");
                                            }}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mt-5 md:grid-cols-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Camera</p>
                                            <p className="text-base font-medium">{selectedVideo.cameraName || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Date</p>
                                            <p className="text-base font-medium">{formatDate(selectedVideo.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Size</p>
                                            <p className="text-base font-medium">{formatFileSize(selectedVideo.size)}</p>
                                        </div>
                                        {selectedVideo.zone && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Zone</p>
                                                <p className="text-base font-medium">{selectedVideo.zone.name}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Duration</p>
                                            <p className="text-base font-medium">{selectedVideo.duration ? `${selectedVideo.duration} seconds` : 'Unknown'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end p-4 border-t">
                            <button
                                onClick={() => handleOpenInNewTab(selectedVideo)}
                                className="flex items-center px-5 py-2.5 mr-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                <FaExternalLinkAlt className="mr-2" size={16} />
                                Open in New Tab
                            </button>
                            <button
                                onClick={() => handleDownloadRecording(selectedVideo)}
                                className="flex items-center px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                <FaDownload className="mr-2" size={16} />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllRecordings;