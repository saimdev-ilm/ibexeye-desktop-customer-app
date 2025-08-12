import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: number;
  text: string;
  sender: "User" | "AI"; // Explicit union type
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm ibexEye, your AI assistant. How can I help you today?", sender: "AI" },
  ]);
  const [input, setInput] = useState<string>(""); // User input
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  // Initialize GoogleGenerativeAI with your API key
  const genAI = new GoogleGenerativeAI("AIzaSyDsF8i__OxiJTEjMM6QUzMGH1l9_wtgqmU");

  // Handle sending a message
  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: input,
        sender: "User", // Explicit type
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput(""); // Clear input
      setLoading(true); // Start loading

      try {
        // Get response from Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(input);
        const responseText = result.response.text();

        const aiMessage: Message = {
          id: messages.length + 2,
          text: responseText,
          sender: "AI", // Explicit type
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } catch (error) {
        console.error("Error fetching AI response:", error);
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "Oops! Something went wrong. Please try again later.",
          sender: "AI", // Explicit type
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setLoading(false); // Stop loading
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-3xl">
      {/* Header */}
      <div className="flex items-center p-4 text-white rounded-t-3xl bg-gradient-to-r from-customBlue to-blue-900">
        <h2 className="ml-3 text-xl font-semibold">ibexEye Assistant</h2>
        <p className="ml-auto text-sm opacity-80">Communicate effortlessly</p>
      </div>

      {/* Messages Section */}
      <div className="h-[60vh] overflow-y-auto bg-gray-100 custom-scrollbar2">
        <div className="flex flex-col p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.sender === "User" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "AI" && (
                <FaUserCircle className="w-10 h-10 text-gray-500" />
              )}
              <div
                className={`relative px-4 py-2 rounded-2xl text-sm shadow-md ${
                  message.sender === "User"
                    ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {message.text}
              </div>
              {message.sender === "User" && (
                <FaUserCircle className="w-10 h-10 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="flex items-center p-3 bg-gray-100 border-t border-gray-300 rounded-b-3xl">
        <input
          type="text"
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-customBlue"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          className={`flex items-center justify-center w-10 h-10 ml-2 text-white rounded-full bg-gradient-to-r from-customBlue to-blue-900 hover:scale-105 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin">⏳</div>
          ) : (
            <FiSend size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
