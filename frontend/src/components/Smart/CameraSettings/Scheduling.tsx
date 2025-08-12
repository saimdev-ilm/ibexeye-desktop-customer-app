import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";

const Scheduling: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentSchedule, setCurrentSchedule] = useState({
    startTime: "08:00",
    endTime: "20:00",
    days: [] as string[],
    title: "",
    cameraStatus: "off", // New field for camera status
  });

  const resetPopup = () => {
    setCurrentSchedule({
      startTime: "08:00",
      endTime: "20:00",
      days: [],
      title: "",
      cameraStatus: "off", // New field for camera status
    });
    setEditingIndex(null);
  };
  // Add or update schedule
  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedSchedules = [...schedules];
      updatedSchedules[editingIndex] = currentSchedule;
      setSchedules(updatedSchedules);
    } else {
      setSchedules([...schedules, currentSchedule]);
    }
    setShowPopup(false);
    resetPopup();
  };

  // Delete schedule
  const handleDelete = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  // Edit schedule
  const handleEdit = (index: number) => {
    setCurrentSchedule(schedules[index]);
    setEditingIndex(index);
    setShowPopup(true);
  };

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-gray-600 2xl:text-lg">Schedules List</h2>
      {/* Schedule List */}
      {schedules.length > 0 ? (
        <ul className="space-y-3">
          {schedules.map((schedule, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 border rounded-3xl"
            >
              <div>
                <p className="text-sm font-semibold">
                  {schedule.startTime} - {schedule.endTime}
                </p>
                <p className="text-xs text-gray-500">
                  {schedule.days.length > 0
                    ? schedule.days.join(", ")
                    : "No days selected"}
                </p>
                <p className="text-xs text-gray-500">
                  Camera: {schedule.cameraStatus === "on" ? "On" : "Off"}
                </p>
              </div>
              <div className="flex gap-4">
                <FaEdit
                  onClick={() => handleEdit(index)}
                  className="cursor-pointer text-customBlue"
                />
                <FaTrash
                  onClick={() => handleDelete(index)}
                  className="text-red-500 cursor-pointer"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 2xl:text-base">No schedules added yet.</p>
      )}

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="absolute w-1/3 p-6 space-y-4 bg-white rounded shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700">
              {editingIndex !== null ? "Edit Schedule" : "Add Schedule"}
            </h3>

            {/* Title */}
            <div className="mt-4">
              <label className="text-sm font-semibold text-gray-600">
                Title
              </label>
              <input
                type="text"
                value={currentSchedule.title}
                onChange={(e) =>
                  setCurrentSchedule({
                    ...currentSchedule,
                    title: e.target.value,
                  })
                }
                placeholder="Enter schedule title"
                className="w-full p-2 mt-1 text-sm border rounded"
              />
            </div>

            {/* Camera On/Off */}
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Camera Status
              </label>
              <select
                value={currentSchedule.cameraStatus}
                onChange={(e) =>
                  setCurrentSchedule({
                    ...currentSchedule,
                    cameraStatus: e.target.value,
                  })
                }
                className="w-full p-2 mt-1 text-sm border rounded"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="text-sm font-semibold">Start Time</label>
              <input
                type="time"
                value={currentSchedule.startTime}
                onChange={(e) =>
                  setCurrentSchedule({
                    ...currentSchedule,
                    startTime: e.target.value,
                  })
                }
                className="w-full p-2 mt-1 text-sm border rounded"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="text-sm font-semibold">End Time</label>
              <input
                type="time"
                value={currentSchedule.endTime}
                onChange={(e) =>
                  setCurrentSchedule({
                    ...currentSchedule,
                    endTime: e.target.value,
                  })
                }
                className="w-full p-2 mt-1 text-sm border rounded"
              />
            </div>

            {/* Days of the Week */}
            <div>
              <p className="mb-2 text-sm font-semibold">Days of the Week</p>
              <div className="flex flex-wrap gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <label
                      key={day}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        type="checkbox" className="accent-customBlue"
                        checked={currentSchedule.days.includes(day)}
                        onChange={(e) => {
                          const updatedDays = e.target.checked
                            ? [...currentSchedule.days, day]
                            : currentSchedule.days.filter((d) => d !== day);
                          setCurrentSchedule({
                            ...currentSchedule,
                            days: updatedDays,
                          });
                        }}
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPopup(false);
                  resetPopup();
                }}
                className="w-full px-3 py-1 text-sm text-gray-600 border rounded-3xl hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="w-full px-3 py-1 text-sm text-white bg-customBlue rounded-3xl hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setShowPopup(true);
            resetPopup();
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm 2xl:text-base text-customBlue hover:text-blue-600"
        >
          <FaPlusCircle size={20} /> Add Schedule
        </button>
      </div>
    </div>
  );
};

export default Scheduling;
