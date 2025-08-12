import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import ChatRoom from "../components/VideoCall/ChatRoom";
import VideoChat from "../components/VideoCall/VideoChat";
import AIAssistant from "../components/VideoCall/AIAssistant";

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const [activeComponent, setActiveComponent] = useState<"chatRoom" | "aiAssistant" | null>(null);

  const handleExit = () => {
    navigate("/"); // Route to Home/Dashboard
  };

  // Toggle between ChatRoom and AIAssistant
  const toggleComponent = (component: "chatRoom" | "aiAssistant") => {
    setActiveComponent((prev) => (prev === component ? null : component));
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <header className="flex items-center justify-between gap-3 px-3 py-2 bg-white border rounded-full shadow 2xl:px-6">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleExit}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-customBlue"
          >
            <FaHome />
          </button>
          <h1 className="text-lg font-bold text-gray-800 2xl:text-xl">
            Border Security & Surveillance
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-grow gap-4 py-2 mt-4">
        <div className={activeComponent ? "w-[70%]" : "w-full"}>
          <VideoChat
            isChatBox={activeComponent === "chatRoom"}
            toggleChatBox={() => toggleComponent("chatRoom")}
            toggleAiAssistant={() => toggleComponent("aiAssistant")}
          />
        </div>
        {activeComponent === "chatRoom" && (
          <div className="w-[30%]">
            <ChatRoom />
          </div>
        )}
        {activeComponent === "aiAssistant" && (
          <div className="w-[30%]">
            <AIAssistant />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
