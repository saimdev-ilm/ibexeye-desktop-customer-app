import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<
    { id: number; text: string; sender: string }[]
  >([
    { id: 1, text: "Hello, who's there?", sender: "User" },
    { id: 2, text: "I need some help with this.", sender: "User" },
    { id: 3, text: "Can you assist me?", sender: "User" },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim()) {
      const randomUserReplies = [
        "Sure, what do you need help with?",
        "Let me check that for you.",
        "Can you provide more details?",
        "I'm here to help!",
      ];

      setMessages((prevMessages) => [
        ...prevMessages,
        { id: prevMessages.length + 1, text: input, sender: "You" },
        {
          id: prevMessages.length + 2,
          text: randomUserReplies[
            Math.floor(Math.random() * randomUserReplies.length)
          ],
          sender: "User",
        },
      ]);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-3xl">
      {/* Header */}
      <div className="flex items-center p-4 text-white rounded-t-3xl bg-gradient-to-r from-customBlue to-blue-900">
        <h2 className="ml-3 text-xl font-semibold">Chat Room</h2>
        <p className="ml-auto text-sm opacity-80">Communicate effortlessly</p>
      </div>

      <div className="h-[60vh] overflow-y-auto overflow-hidden bg-gray-100 custom-scrollbar2">
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 ">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 ${
                message.sender === "You" ? "justify-end" : "justify-start"
              }`}
            >
              {/* User Icon */}
              {message.sender === "User" && (
                <FaUserCircle className="w-10 h-10 text-gray-500" />
              )}
              <div
                className={`relative px-4 py-2 rounded-2xl text-sm shadow-md ${
                  message.sender === "You"
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white self-end"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {message.text}
                <span
                  className={`absolute text-xs text-gray-500 ${
                    message.sender === "You"
                      ? "right-2 -bottom-4"
                      : "left-2 -bottom-4"
                  }`}
                ></span>
              </div>
              {/* Sender Icon */}
              {message.sender === "You" && (
                <FaUserCircle className="w-10 h-10 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Input */}
      <div className="flex items-center p-3 bg-gray-100 border-t border-gray-300 rounded-b-lg">
        <input
          type="text"
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-customBlue"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="flex items-center justify-center w-10 h-10 ml-2 text-white transition transform rounded-full bg-gradient-to-r from-customBlue to-blue-900bg-gradient-to-r to-blue-900 hover:scale-105"
          onClick={sendMessage}
        >
          <FiSend size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
