import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaEye } from "react-icons/fa";

const SolarNotification: React.FC = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      title: "AI Assistant - Emergency Call",
      time: "Today 11:00PM",
      description:
        "The AI Assistant has triggered an emergency call. Authorities have been notified and are en route.",
      iconColor: "bg-purple-500",
      type: "",
      code: "",
    },
    // New Notification 2: AI Assistant - Drone Deployment
    {
      title: "AI Assistant - Drone Deployment",
      time: "Today 11:05PM",
      description:
        "AI Assistant has deployed a drone for surveillance in the area of the back door breach. Monitoring in progress.",
      iconColor: "bg-indigo-500",
      type: "",
      code: "",
    },
    {
      title: "Sensor Activation",
      time: "Today 8:14PM",
      description:
        "Motion detected by the living room sensor. Check the area to confirm activity.",
      iconColor: "bg-green-500",
      type: "Sensor",
      code: "SN-10245",
    },
    {
      title: "Known Person Detection",
      time: "Today 7:52PM",
      description:
        "Sam, the house owner, was detected at the main door. No action needed.",
      iconColor: "bg-blue-500",
      type: "Camera",
      code: "CM-00489",
    },
    {
      title: "Alert",
      time: "Today 9:27PM",
      description:
        "Back door breach detected! Immediate response is required to secure the premises.",
      iconColor: "bg-red-500",
      type: "Camera",
      code: "CM-20376",
    },
    {
      title: "Unknown Person",
      time: "Today 10:43PM",
      description:
        "Unrecognized individual spotted at the front door. Review the surveillance feed and ensure safety.",
      iconColor: "bg-orange-500",
      type: "Camera",
      code: "CM-30982",
    },
  ];

  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (notification: any) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNotification(null);
    setIsModalOpen(false);
  };

  const GotoNotification = () => {
    navigate("/smartAllNotification");
  };

  return (
    <div className="p-4 bg-white shadow 2xl:p-6 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-opacity-50 2xl:mb-4 2xl:pb-4 border-customBlue ">
        <h2 className="text-lg font-bold text-gray-700">Solar Notifications</h2>
        <button
          onClick={GotoNotification}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <FaChevronRight />
        </button>
      </div>

      <div className="max-h-[21vh] 2xl:h-[56vh] pe-2 custom-scrollbar2 h-[40vh] overflow-hidden overflow-y-auto">
        {/* Notification Cards */}
        <div className="space-y-3 2xl:space-y-4 ">
          {notifications.map((note, index) => (
            <div
              key={index}
              onClick={() => openModal(note)} // Open modal on click
              className="relative p-4 border shadow cursor-pointer group rounded-3xl bg-gray-50"
            >
              {/* Notification Content */}
              <div className="flex items-start">
                {/* Icon */}
                <div
                  className={`w-4 h-4 border mt-1 rounded-full ${note.iconColor}`}
                ></div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1 ml-4">
                    <div className="flex flex-col">
                      <h5 className="text-sm font-semibold text-gray-800">
                        {note.title}
                      </h5>
                      <p className="text-xs text-gray-500">{note.time}</p>
                    </div>

                    <p className="text-xs font-medium text-gray-500">
                      {note.type} <br />
                      <span className="text-gray-600">{note.code}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <p className="mt-1 text-xs text-gray-600">{note.description}</p>
              </div>

              {/* Eye Icon */}
              <div className="absolute transition-opacity duration-300 opacity-0 bottom-2 right-4 group-hover:opacity-100">
                <FaEye />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white shadow-lg rounded-3xl w-96">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedNotification?.title}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedNotification?.time}
            </p>
            <p className="mt-4 text-gray-600">
              {selectedNotification?.description}
            </p>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarNotification;
