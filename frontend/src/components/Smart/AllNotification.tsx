// File: src/components/notifications/AllNotification.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaEye,
  FaSearch,
  FaFileExport,
  FaHome,
  FaFilter,
  FaSyncAlt,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaVideo
} from "react-icons/fa";

// Import from our alertService
import {
  getAlerts,
  markAlertAsViewed,
  isImage as checkIsImage,
  getMediaUrl as getAlertMediaUrl,
  Alert,
} from '../../services/alertService';

// Import authentication context
import { useAuth } from '../../contexts/AuthContext';

// Constants
const POLLING_INTERVAL = 30000; // 30 seconds
const DEFAULT_PAGE_SIZE = 20; // Default number of items per page

// Alert type mapping
const ALERT_TYPES = {
  motion_detection: { name: 'Motion Detection', color: 'bg-red-500' },
  camera_created: { name: 'Camera Created', color: 'bg-green-500' },
  camera_updated: { name: 'Camera Updated', color: 'bg-blue-500' },
  cloud_stream_started: { name: 'Stream Started', color: 'bg-purple-500' },
};

const AllNotification: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Get authentication status

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<Alert | null>(null);
  const [deleteModal, setDeleteModal] = useState<Alert | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [filterType, setFilterType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getAlertTypeDisplay = (type: string) => {
    return ALERT_TYPES[type as keyof typeof ALERT_TYPES]?.name || type.replace(/_/g, ' ');
  };

  const getAlertTypeBadgeColor = (type: string) => {
    return ALERT_TYPES[type as keyof typeof ALERT_TYPES]?.color || 'bg-gray-500';
  };

  // Data fetching function - fetch all alerts at once
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAlerts();
      console.log("API Response:", response);
      
      // Set all alerts from the response
      if (response.data && Array.isArray(response.data)) {
        // Sort by ID in descending order (newest first)
        const sortedAlerts = [...response.data].sort((a, b) => b.id - a.id);
        setAllAlerts(sortedAlerts);
      } else {
        setAllAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setError("Failed to load notifications. Please try again.");
      setAllAlerts([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Apply filtering whenever filterType or searchQuery changes
  useEffect(() => {
    if (!allAlerts.length) return;

    let filtered = [...allAlerts];

    // Apply type filter if not "all"
    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert =>
        (alert.title || '').toLowerCase().includes(query) ||
        (alert.description || '').toLowerCase().includes(query) ||
        (alert.cameraId || '').toLowerCase().includes(query)
      );
    }

    setFilteredAlerts(filtered);
    // Reset to first page when filters change
    setPage(1);
  }, [allAlerts, filterType, searchQuery]);

  // Apply pagination to filtered alerts
  useEffect(() => {
    // Calculate start and end indices for current page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get alerts for current page
    const currentPageAlerts = filteredAlerts.slice(startIndex, endIndex);
    setDisplayedAlerts(currentPageAlerts);
    
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [filteredAlerts, page, limit]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAlerts();
  }, [fetchAlerts]);

  const handleViewAlert = async (alert: Alert) => {
    setViewModal(alert);

    // Mark as viewed if not already
    if (alert.view === 1) {
      try {
        await markAlertAsViewed(alert.id);

        // Update the local state to reflect the change
        setAllAlerts(prevAlerts => 
          prevAlerts.map(a => a.id === alert.id ? { ...a, view: 0 } : a)
        );
          
        // Update localStorage notificationCount
        const unviewedCount = allAlerts.filter(a => a.view === 1 && a.id !== alert.id).length;
        localStorage.setItem('notificationCount', unviewedCount.toString());
      } catch (error) {
        console.error("Failed to mark alert as viewed", error);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    // Update all alerts by removing the deleted one
    setAllAlerts(prevAlerts => 
      prevAlerts.filter(a => a.id !== deleteModal.id)
    );

    setDeleteModal(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(event.target.value));
    setPage(1); // Reset to first page when changing limit
  };

  const handleTypeFilterChange = (newType: string) => {
    setFilterType(newType);
  };

  const exportToCsv = () => {
    if (!filteredAlerts.length) return;

    const headers = ['ID', 'Type', 'Title', 'Description', 'Timestamp', 'Camera ID'];

    const rows = filteredAlerts.map(alert => [
      alert.id,
      alert.type,
      alert.title,
      alert.description,
      alert.timestamp,
      alert.cameraId
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `camera-alerts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial data fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Setup polling for real-time updates
  useEffect(() => {
    const pollingInterval = setInterval(handleRefresh, POLLING_INTERVAL);
    return () => clearInterval(pollingInterval);
  }, [handleRefresh]);

  // Calculate total pages based on filtered alerts and limit
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAlerts.length / limit));
  }, [filteredAlerts.length, limit]);

  // Component rendering
  return (
    <div className="">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 mb-6 bg-white border-2 shadow-sm rounded-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 text-white transition rounded-full bg-customBlue hover:bg-blue-600"
        >
          <FaHome />
        </button>
        <div className="flex-grow">
          <h1 className="text-xl font-bold text-gray-800">
            Camera Notifications
          </h1>
          <p className="text-sm text-gray-500">
            {allAlerts.length} total notifications
          </p>
        </div>
        {isRefreshing && (
          <span className="flex items-center px-3 py-1 text-xs bg-gray-200 rounded-full">
            <FaSyncAlt className="mr-1 animate-spin" /> Refreshing...
          </span>
        )}
      </header>

      {/* Filters and Actions */}
      <FilterAndActionsBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={handleTypeFilterChange}
        handleRefresh={handleRefresh}
        exportToCsv={exportToCsv}
        isRefreshing={isRefreshing}
        loading={loading}
        hasAlerts={allAlerts.length > 0}
      />

      {/* Loading State */}
      {loading && !isRefreshing && <LoadingState />}

      {/* Error State */}
      {!loading && error && <ErrorState error={error} retryFn={fetchAlerts} />}

      {/* Alert Table */}
      {!loading && !error && (
        <>
          <AlertsTable
            filteredAlerts={displayedAlerts}
            handleViewAlert={handleViewAlert}
            setDeleteModal={setDeleteModal}
            getAlertTypeDisplay={getAlertTypeDisplay}
            getAlertTypeBadgeColor={getAlertTypeBadgeColor}
            formatDate={formatDate}
          />

          {/* Show pagination if we have any alerts */}
          {filteredAlerts.length > 0 && (
            <PaginationControls
              page={page}
              limit={limit}
              totalPages={totalPages}
              total={filteredAlerts.length}
              displayedCount={displayedAlerts.length}
              handlePageChange={handlePageChange}
              handleLimitChange={handleLimitChange}
            />
          )}
        </>
      )}

      {/* Modals */}
      {viewModal && (
        <ViewAlertModal
          alert={viewModal}
          onClose={() => setViewModal(null)}
          getAlertTypeDisplay={getAlertTypeDisplay}
          getAlertTypeBadgeColor={getAlertTypeBadgeColor}
          formatDate={formatDate}
          getMediaUrl={getAlertMediaUrl}
          isImage={checkIsImage}
        />
      )}

      {deleteModal && (
        <DeleteConfirmationModal
          alert={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

// Sub-components for better organization
interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  handleRefresh: () => void;
  exportToCsv: () => void;
  isRefreshing: boolean;
  loading: boolean;
  hasAlerts: boolean;
}

const FilterAndActionsBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  handleRefresh,
  exportToCsv,
  isRefreshing,
  loading,
  hasAlerts
}) => (
  <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
    <div className="relative">
      <input
        type="text"
        placeholder="Search notifications..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <FaSearch className="absolute text-gray-400 -translate-y-1/2 top-1/2 right-4" />
    </div>

    <div className="relative">
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="w-full px-4 py-2 text-sm border rounded-lg shadow-sm appearance-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
      >
        <option value="all">All Alert Types</option>
        <option value="motion_detection">Motion Detection</option>
        <option value="camera_created">Camera Created</option>
        <option value="camera_updated">Camera Updated</option>
        <option value="cloud_stream_started">Stream Started</option>
      </select>
      <FaFilter className="absolute text-gray-400 -translate-y-1/2 top-1/2 right-4" />
    </div>

    <div className="flex justify-end gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || loading}
        className="px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
      >
        <FaSyncAlt className={`inline mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
      <button
        onClick={exportToCsv}
        disabled={!hasAlerts}
        className="px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm bg-customBlue hover:bg-blue-600 disabled:opacity-50"
      >
        <FaFileExport className="inline mr-2" />
        Export
      </button>
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="py-8 text-center">
    <div className="inline-block w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-customBlue"></div>
    <p className="mt-4 text-gray-600">Loading notifications...</p>
  </div>
);

interface ErrorStateProps {
  error: string;
  retryFn: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, retryFn }) => (
  <div className="p-6 text-center border border-red-200 bg-red-50 rounded-xl">
    <p className="mb-4 text-red-600">{error}</p>
    <button
      onClick={retryFn}
      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
    >
      <FaSyncAlt className="inline mr-2" /> Try Again
    </button>
  </div>
);

interface AlertsTableProps {
  filteredAlerts: Alert[];
  handleViewAlert: (alert: Alert) => void;
  setDeleteModal: (alert: Alert) => void;
  getAlertTypeDisplay: (type: string) => string;
  getAlertTypeBadgeColor: (type: string) => string;
  formatDate: (date: string) => string;
}

// Modified AlertsTable component with removed hover effect
const AlertsTable: React.FC<AlertsTableProps> = ({
  filteredAlerts,
  handleViewAlert,
  setDeleteModal,
  getAlertTypeDisplay,
  getAlertTypeBadgeColor,
  formatDate
}) => (
  <div className="overflow-auto custom-scrollbar2 bg-white shadow-md rounded-xl max-h-[70vh] custom border">
    {filteredAlerts.length === 0 ? (
      <div className="p-8 text-center">
        <p className="text-gray-500">No notifications found</p>
      </div>
    ) : (
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="text-white bg-customBlue">
            <th className="p-4 text-sm font-semibold">ID</th>
            <th className="p-4 text-sm font-semibold">Type</th>
            <th className="p-4 text-sm font-semibold">Title</th>
            <th className="p-4 text-sm font-semibold">Time</th>
            <th className="p-4 text-sm font-semibold">Camera</th>
            <th className="p-4 text-sm font-semibold">Media</th>
            <th className="p-4 text-sm font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlerts.map((alert) => (
            <tr
              key={alert.id}
              className={`border-b hover:bg-gray-50 transition ${alert.view === 1 ? 'border-l-4 border-l-blue-500' : ''
                }`}
            >
              <td className="p-4 text-sm">{alert.id}</td>
              <td className="p-4 text-sm">
                <span className={`px-2 py-1 text-xs text-white rounded-full ${getAlertTypeBadgeColor(alert.type)}`}>
                  {getAlertTypeDisplay(alert.type)}
                </span>
              </td>
              <td className="p-4 text-sm">{alert.title}</td>
              <td className="p-4 text-sm whitespace-nowrap">{formatDate(alert.timestamp)}</td>
              <td className="p-4 text-sm">{alert.cameraId}</td>

              {/* Modified Media Cell without hover effect */}
              <td className="p-4 text-sm">
                <div className="flex items-center">
                  {/* Thumbnail container */}
                  <div className="flex items-center justify-center w-24 h-16 overflow-hidden bg-gray-100 border rounded-lg">
                    {alert.mediaUrl || alert.mediaPath ? (
                      checkIsImage(alert) ? (
                        <img
                          src={getAlertMediaUrl(alert)}
                          alt="Alert"
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            const icon = document.createElement('div');
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                            e.currentTarget.parentElement?.appendChild(icon);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <FaVideo className="w-6 h-6 text-gray-400" />
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <FaImage className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </td>

              <td className="p-4 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleViewAlert(alert)}
                    className="flex items-center justify-center w-8 h-8 text-white transition rounded-lg bg-customBlue hover:bg-blue-600"
                    title="View details"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteModal(alert)}
                    className="flex items-center justify-center w-8 h-8 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                    title="Delete notification"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

interface PaginationProps {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  displayedCount: number;
  handlePageChange: (page: number) => void;
  handleLimitChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const PaginationControls: React.FC<PaginationProps> = ({
  page,
  limit,
  totalPages,
  total,
  displayedCount,
  handlePageChange,
  handleLimitChange
}) => (
  <div className="flex items-center justify-between p-4 mt-6 bg-white shadow-sm rounded-xl">
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Show</span>
      <select
        value={limit}
        onChange={handleLimitChange}
        className="px-2 py-1 text-sm border rounded"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <span className="text-sm text-gray-600">per page</span>
    </div>

    <div className="flex items-center space-x-1">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
      >
        <FaChevronLeft size={14} />
      </button>

      <div className="flex space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;

          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <button
              key={i}
              onClick={() => handlePageChange(pageNum)}
              className={`w-8 h-8 text-sm rounded ${pageNum === page
                ? 'bg-customBlue text-white'
                : 'border hover:bg-gray-50'
                }`}
            >
              {pageNum}
            </button>
          );
        })}

        {totalPages > 5 && page < totalPages - 2 && (
          <>
            <span className="self-end pb-1">...</span>
            <button
              onClick={() => handlePageChange(totalPages)}
              className="w-8 h-8 text-sm border rounded hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
      >
        <FaChevronRight size={14} />
      </button>
    </div>

    <div className="text-sm text-gray-600">
      Showing {displayedCount} of {total} notifications
    </div>
  </div>
);

interface ViewModalProps {
  alert: Alert;
  onClose: () => void;
  getAlertTypeDisplay: (type: string) => string;
  getAlertTypeBadgeColor: (type: string) => string;
  formatDate: (date: string) => string;
  getMediaUrl: (alert: Alert) => string | undefined;
  isImage: (alert: Alert) => boolean;
}

const ViewAlertModal: React.FC<ViewModalProps> = ({
  alert,
  onClose,
  getAlertTypeDisplay,
  getAlertTypeBadgeColor,
  formatDate,
  getMediaUrl,
  isImage
}) => {
  // Specifically handle S3 URLs which might not have a clear file extension
  const displayImage = () => {
    const mediaUrl = getMediaUrl(alert);

    if (!mediaUrl) {
      return (
        <div className="p-4 text-center">
          <FaImage className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No media available</p>
        </div>
      );
    }

    // Always treat S3 URLs from amazonaws.com as images regardless of extension
    const isS3Image = mediaUrl.includes('amazonaws.com') &&
      (mediaUrl.includes('detected_') || mediaUrl.toLowerCase().includes('.jpg') ||
        mediaUrl.toLowerCase().includes('.jpeg') || mediaUrl.toLowerCase().includes('.png'));

    if (isImage(alert) || isS3Image) {
      return (
        <img
          src={mediaUrl}
          alt="Alert Media"
          className="max-w-full max-h-[400px] rounded-lg object-contain"
          onError={(e) => {
            console.error("Image load error:", mediaUrl);
            e.currentTarget.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'p-4 text-center text-gray-500';
            errorMsg.textContent = 'Image could not be loaded. Path: ' + mediaUrl;
            e.currentTarget.parentElement?.appendChild(errorMsg);
          }}
        />
      );
    } else {
      return (
        <div className="p-4 text-center">
          <FaVideo className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Video preview not available</p>
          <p className="mt-1 text-xs text-gray-400 break-all">{mediaUrl}</p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="relative flex flex-col bg-white rounded-xl shadow-lg w-[90%] max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
          <h3 className="text-xl font-bold text-gray-800">{alert.title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition rounded-full hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-auto">
          {/* Alert Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className={`px-3 py-1 text-xs text-white rounded-full ${getAlertTypeBadgeColor(alert.type)}`}>
              {getAlertTypeDisplay(alert.type)}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(alert.timestamp)}
            </span>
          </div>

          {/* Alert Description */}
          <div className="p-4 mb-6 rounded-lg bg-gray-50">
            <p className="text-gray-700">
              {alert.description}
            </p>
          </div>

          {/* Media Display */}
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-medium text-gray-500">Media</h4>
            <div className="flex justify-center p-2 bg-gray-100 border rounded-lg">
              {displayImage()}
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="mb-3 font-medium">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Alert ID</p>
                <p className="text-sm font-medium">{alert.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Camera ID</p>
                <p className="text-sm font-medium">{alert.cameraId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Node ID</p>
                <p className="text-sm font-medium">{alert.nodeId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motion Type</p>
                <p className="text-sm font-medium">{alert.motionType || 'N/A'}</p>
              </div>
            </div>

            {/* Media Path (debugging help) */}
            {(alert.mediaPath || alert.mediaUrl) && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Media Path</p>
                <p className="font-mono text-xs text-gray-400 break-all">
                  {alert.mediaUrl || alert.mediaPath}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 flex justify-end p-4 bg-white border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white transition rounded-lg bg-customBlue hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  alert: Alert;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  alert,
  onClose,
  onConfirm
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
      <h3 className="mb-2 text-xl font-bold text-gray-800">Confirm Deletion</h3>
      <p className="mb-6 text-gray-700">
        Are you sure you want to delete notification #{alert.id}? This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 transition border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default AllNotification;