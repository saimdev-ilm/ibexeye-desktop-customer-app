import React, { useRef } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhone,
  FaVolumeUp,
  FaExpand,
  FaRobot,
  FaVolumeMute,
  FaComment,
  FaCommentSlash,
  FaCompress,
} from "react-icons/fa";
import userImg from "../../assets/user1.png";
import { useNavigate } from "react-router-dom";


interface VideoChatProps {
    isChatBox: boolean;
    toggleChatBox: () => void;
    toggleAiAssistant: () => void;

  }

  

  
const VideoChat: React.FC <VideoChatProps> = ({ isChatBox, toggleChatBox, toggleAiAssistant }) => {
  const [isExpend, setIsExpend] = React.useState(false);
  const [isMicOn, setIsMicOn] = React.useState(false);
  const [isVideoOn, setIsVideoOn] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(false);
//   const [isChatBox, setIsChatBox] = React.useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Stop video feed
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      // Start video feed
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }
    setIsVideoOn((prev) => !prev);
  };


  const toggleSpeaker = () => {
    setIsSpeakerOn((prev) => !prev);
  };

  const endCall = () => {
    navigate("/SecuritySurveillance"); // Route to Home/Dashboard
    // Stop all media tracks when ending the call
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsVideoOn(false);
  };

  const goFullscreen = () => {
    setIsExpend((prev) => !prev);
  };


  return (
    <div className="flex items-center justify-center w-full gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Fullscreen Button */}
        <button
          className={`flex items-center justify-center w-12 h-12 border rounded-full bg-customBlue ${
            isExpend ? "bg-green-500 hover:bg-green-400" : "bg-customBlue"
          }`}
          onClick={goFullscreen}
        >
          {isExpend ? (
            <FaExpand size={20} className="text-white" />
          ) : (
            <FaCompress size={20} className="text-white" />
          )}
        </button>

        {/* Speaker Toggle */}
        <button
          className={`flex items-center justify-center w-12 h-12 border rounded-full ${
            isSpeakerOn ? "bg-green-500 hover:bg-green-400" : "bg-customBlue"
          }`}
          onClick={toggleSpeaker}
        >
          {isSpeakerOn ? (
            <FaVolumeUp size={20} className="text-white" />
          ) : (
            <FaVolumeMute size={20} className="text-white" />
          )}
        </button>

        {/* Video Toggle */}
        <button
          className={`flex items-center justify-center w-12 h-12 rounded-full ${
            isVideoOn ? "bg-green-500 hover:bg-green-400" : "bg-customBlue"
          }`}
          onClick={toggleVideo}
        >
          {isVideoOn ? (
            <FaVideo size={20} className="text-white" />
          ) : (
            <FaVideoSlash size={20} className="text-white" />
          )}
        </button>

        {/* Microphone Toggle */}
        <button
          className={`flex items-center justify-center w-12 h-12 rounded-full ${
            isMicOn ? "bg-green-500 hover:bg-green-400" : "bg-customBlue"
          }`}
          onClick={toggleMic}
        >
          {isMicOn ? (
            <FaMicrophone size={20} className="text-white" />
          ) : (
            <FaMicrophoneSlash size={20} className="text-white" />
          )}
        </button>

        {/* Chatbox*/}
        {/* Chatbox Toggle */}
        <button
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-customBlue ${
            isChatBox ? "bg-green-500 hover:bg-green-400" : "bg-customBlue"
          }`}
          onClick={toggleChatBox}
        >
          {isChatBox ? (
            <FaComment size={20} className="text-white" />
          ) : (
            <FaCommentSlash size={20} className="text-white" />
          )}
        </button>

        {/* AI Assistant */}
        <button
          className="flex items-center justify-center w-12 h-12 rounded-full bg-customBlue hover:bg-blue-400"
          onClick={toggleAiAssistant}
        >
          <FaRobot size={20} className="text-white" />
        </button>

        {/* End Call */}
        <button
          className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-full hover:bg-red-500"
          onClick={endCall}
        >
          <FaPhone size={20} className="text-white" />
        </button>
      </div>
      {/* Video Section */}
      <div className="relative w-full overflow-hidden h-[75vh] bg-gray-200 shadow-md rounded-2xl aspect-video">
        <video
          ref={videoRef}
          className="object-cover w-full h-full rounded-2xl"
          autoPlay
          muted
        />
        {!isVideoOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-70">
            <img
              src={userImg} // Replace with a placeholder or avatar
              alt="User Avatar"
              className="w-24 h-24 mb-4 border-4 border-white rounded-full"
            />
            <p className="text-lg font-semibold">Video Turned Off</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoChat;
