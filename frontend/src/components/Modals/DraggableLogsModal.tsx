import React, { useState, useEffect, useRef } from "react";
import { FaInfoCircle, FaTimes, FaPause, FaPlay, FaTrash } from "react-icons/fa";

interface DraggableLogsModalProps {
  logs: string[];
  isOpen: boolean;
  onClose: () => void;
}

const DraggableLogsModal: React.FC<DraggableLogsModalProps> = ({ logs, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const modalStartPos = useRef<{ left: number; top: number } | null>(null);

  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: window.innerWidth / 2 - 350,
    top: window.innerHeight / 2 - 250,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [filteredLogs, setFilteredLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("");

  // Auto-scroll to bottom when new logs come in (unless paused)
  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused]);

  // Filter logs based on search term
  useEffect(() => {
    if (filter.trim() === "") {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log =>
        log.toLowerCase().includes(filter.toLowerCase())
      ));
    }
  }, [logs, filter]);

  useEffect(() => {
    if (isOpen) {
      setPosition({
        left: window.innerWidth / 2 - 350,
        top: window.innerHeight / 2 - 250,
      });
    }
  }, [isOpen]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const rect = modalRef.current.getBoundingClientRect();
    modalStartPos.current = { left: rect.left, top: rect.top };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragStartPos.current || !modalStartPos.current) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    setPosition({
      left: modalStartPos.current.left + deltaX,
      top: modalStartPos.current.top + deltaY,
    });
  };

  const onMouseUp = () => {
    dragStartPos.current = null;
    modalStartPos.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const formatLogMessage = (log: string) => {
    // Enhanced formatting for telemetry logs
    if (log.includes("📡 Telemetry")) {
      return (
        <div className="p-2 mb-1 bg-blue-900 rounded">
          <div className="text-blue-300">{log}</div>
        </div>
      );
    }

    // Success messages
    if (log.includes("✅")) {
      return (
        <div className="text-green-400">{log}</div>
      );
    }

    // Error messages
    if (log.includes("❌") || log.includes("Error")) {
      return (
        <div className="text-red-400">{log}</div>
      );
    }

    // Warning messages
    if (log.includes("⚠️") || log.includes("Warning")) {
      return (
        <div className="text-yellow-400">{log}</div>
      );
    }

    // Default
    return <div className="text-gray-300">{log}</div>;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        width: 700,
        height: 500,
        backgroundColor: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        borderRadius: 8,
        zIndex: 9999,
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - draggable handle */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center justify-between px-4 py-2 rounded-t-lg cursor-move select-none bg-customBlue"
      >
        <h2 className="flex items-center text-lg font-semibold text-white">
          <FaInfoCircle className="mr-2" /> Command Logs
          <span className="ml-2 text-sm text-blue-200">({filteredLogs.length})</span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-white hover:text-gray-300 focus:outline-none"
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? <FaPlay size={14} /> : <FaPause size={14} />}
          </button>

          {/* Clear logs */}
          <button
            onClick={() => {
              // You'll need to pass a clearLogs function as a prop
              if (window.confirm("Clear all logs?")) {
                // Implement clear functionality
                console.log("Clear logs requested");
              }
            }}
            className="p-1 text-white hover:text-gray-300 focus:outline-none"
            title="Clear logs"
          >
            <FaTrash size={14} />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 focus:outline-none"
            aria-label="Close logs modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Filter input */}
      <div className="px-4 py-2 bg-gray-100 border-b">
        <input
          type="text"
          placeholder="Filter logs... (e.g., 'telemetry', 'error', 'battery')"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Logs content */}
      <div className="flex-grow overflow-y-auto font-mono text-sm text-gray-200 bg-gray-900 rounded-b-lg custom-scrollbar2">
        <div className="p-3">
          {filteredLogs.length === 0 && filter ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No logs match filter "{filter}"
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No logs available
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="mb-1 whitespace-pre-wrap">
                {formatLogMessage(log)}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 text-xs text-gray-600 bg-gray-100 rounded-b-lg">
        {isPaused && (
          <span className="text-orange-600">⏸️ Auto-scroll paused</span>
        )}
        {filter && (
          <span className="ml-2">
            🔍 Showing {filteredLogs.length} of {logs.length} logs
          </span>
        )}
      </div>
    </div>
  );
};

export default DraggableLogsModal;