import React, { useState } from "react";
import {
  FaTrash,
  FaEye,
  FaSearch,
  FaFileExport,
  FaHome,
  FaInfoCircle,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBell,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: number;
  date: string;
  message: string;
  location: string;
  status: string;
  type: string;
}

const OilGasAllNotification: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  const [notifications, setNotifications] = useState<Notification[]>([
    ...Array.from({ length: 20 }, (_, index) => ({
      id: 1000 + index,
      date: `2024-11-14 09:${10 + index}:00`,
      message: `Motion detected at location ${index + 1}`,
      location: index % 2 === 0 ? "Main Entrance" : "Back Gate",
      status: index % 2 === 0 ? "Read" : "Unread",
      type:
        index % 3 === 0 ? "Activate" : index % 3 === 1 ? "Alert" : "Warning",
    })),
  ]);

  const [viewModal, setViewModal] = useState<Notification | null>(null);
  const [deleteModal, setDeleteModal] = useState<Notification | null>(null);

  const filteredNotifications = notifications.filter((item) =>
    item.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteModal) {
      setNotifications(
        notifications.filter((item) => item.id !== deleteModal.id)
      );
      setDeleteModal(null);
    }
  };

  const handleExit = () => navigate("/OilGasSurveillance");

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotifications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getIconAndStyle = (message: string) => {
    if (message.includes("Gas Leak") || message.includes("Methane")) {
      return {
        icon: <FaExclamationTriangle className="text-3xl text-green-500" />,
        bg: "bg-green-100",
        titleColor: "text-green-600",
        title: "Sensor Activation",
      };
    } else if (message.includes("Operator") || message.includes("Logged")) {
      return {
        icon: <FaCheckCircle className="text-3xl text-green-500" />,
        bg: "bg-green-100",
        titleColor: "text-green-600",
        title: "Known Person Detection",
      };
    } else if (
      message.includes("Fire Risk") ||
      message.includes("Temperature")
    ) {
      return {
        icon: <FaBell className="text-3xl text-red-500" />,
        bg: "bg-red-100",
        titleColor: "text-red-600",
        title: "Critical Alert",
      };
    } else if (
      message.includes("Unidentified Worker") ||
      message.includes("Gear")
    ) {
      return {
        icon: <FaExclamationTriangle className="text-3xl text-yellow-500" />,
        bg: "bg-yellow-100",
        titleColor: "text-yellow-600",
        title: "Unknown Person",
      };
    } else {
      return {
        icon: <FaInfoCircle className="text-3xl text-blue-500" />,
        bg: "bg-blue-100",
        titleColor: "text-blue-600",
        title: "Notification",
      };
    }
  };

  return (
    <div className="">
      {/* Header */}
      <header className="flex items-center justify-start gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6 2xl:py-3">
        <button
          onClick={handleExit}
          className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue hover:bg-customBlueHover"
        >
          <FaHome />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Oil & Gas Surveillance
        </h1>
      </header>

      {/* Search and Export */}
      <div className="flex items-center justify-between my-4">
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Search anything...."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-full shadow focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <FaSearch
            size={16}
            className="absolute text-gray-400 -translate-y-1/2 top-1/2 right-4"
          />
        </div>
        <button className="flex items-center px-4 py-2 text-sm font-semibold text-white rounded-full shadow bg-customBlue hover:bg-blue-600">
          <FaFileExport className="mr-2" /> Export Report
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white shadow-md rounded-3xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-white bg-gray-800">
              <th className="p-4 text-sm">ID</th>
              <th className="p-4 text-sm">Date</th>
              <th className="p-4 text-sm">Message</th>
              <th className="p-4 text-sm">Location</th>
              <th className="p-4 text-sm">Status</th>
              <th className="p-4 text-sm">Types</th>
              <th className="p-4 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-100">
                <td className="p-4 text-sm">{item.id}</td>
                <td className="p-4 text-sm">{item.date}</td>
                <td className="p-4 text-sm">{item.message}</td>
                <td className="p-4 text-sm">{item.location}</td>
                <td className="p-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === "Read"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.type === "Activate"
                        ? "bg-green-200 text-green-700"
                        : item.type === "Alert"
                        ? "bg-red-200 text-red-700"
                        : "bg-yellow-200 text-yellow-700"
                    }`}
                  >
                    {item.type}
                  </span>
                </td>
                <td className="flex p-4 space-x-4">
                  <button
                    onClick={() => setViewModal(item)}
                    className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue hover:bg-customBlueHover"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => setDeleteModal(item)}
                    className="flex items-center justify-center w-8 h-8 text-white bg-red-700 rounded-full hover:bg-red-600"
                  >
                    <FaTrash size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <p className="text-sm text-gray-600">
          Showing {indexOfFirstItem + 1} to{" "}
          {Math.min(indexOfLastItem, filteredNotifications.length)} of{" "}
          {filteredNotifications.length} entries
        </p>
        <div className="space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          {[
            ...Array(Math.ceil(filteredNotifications.length / itemsPerPage)),
          ].map((_, i) => (
            <button
              key={i}
              onClick={() => paginate(i + 1)}
              className={`px-2 py-1 ${
                currentPage === i + 1
                  ? "bg-customBlue rounded-full w-8 h-8  text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={
              currentPage ===
              Math.ceil(filteredNotifications.length / itemsPerPage)
            }
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* View Modal */}
      {viewModal &&
        (() => {
          const { icon, bg, titleColor, title } = getIconAndStyle(
            viewModal.message
          );
          return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              {/* Modal Container */}
              <div className="relative flex flex-col items-start p-6 bg-white rounded-2xl shadow-lg w-[600px]">
                {/* Close Button */}
                <button
                  onClick={() => setViewModal(null)}
                  className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
                >
                  <FaTimes size={20} />
                </button>

                {/* Icon and Title */}
                <div className="flex items-center mb-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 ${bg} rounded-full mr-4`}
                  >
                    {icon}
                  </div>
                  <h2 className={`text-xl font-bold ${titleColor}`}>{title}</h2>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm leading-relaxed text-gray-700">
                    {viewModal.message || "Details unavailable."}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-500">
                    {viewModal.date || "Today 10:30PM"}
                  </p>
                </div>

                {/* Surveillance Image */}
                <div className="w-full mt-2">
                  <img
                    src={"https://via.placeholder.com/300x150"}
                    alt="Snapshot"
                    className="object-cover w-full rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          );
        })()}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="flex flex-col items-center p-6 bg-white shadow-lg rounded-2xl w-80">
            {/* Trash Icon */}
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
              <FaTrash className="text-4xl text-red-500" />
            </div>

            {/* Confirmation Text */}
            <p className="mb-4 font-semibold text-center text-gray-700">
              Are you sure you want to delete this notification?
            </p>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600"
              >
                Delete
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg shadow hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OilGasAllNotification;
