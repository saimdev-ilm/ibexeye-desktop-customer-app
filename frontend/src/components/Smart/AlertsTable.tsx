import React from 'react';
import { Alert } from '../../services/alertService';
import { FaEye, FaTrash } from 'react-icons/fa';

interface AlertsTableProps {
  alerts: Alert[];
  handleViewAlert: (alert: Alert) => void;
  setDeleteModal: (alert: Alert) => void;
  getAlertTypeDisplay: (type: string) => string;
  getAlertTypeBadgeColor: (type: string) => string;
  formatDate: (date: string) => string;
  getMediaIcon: (alert: Alert) => JSX.Element;
}

const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  handleViewAlert,
  setDeleteModal,
  getAlertTypeDisplay,
  getAlertTypeBadgeColor,
  formatDate,
  getMediaIcon
}) => {
  return (
    <div className="overflow-auto custom-scrollbar2 bg-white shadow-md rounded-xl max-h-[70vh] custom border">
      {alerts.length === 0 ? (
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
            {alerts.map((alert) => (
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

                <td className="p-4 text-sm">
                  <div className="flex items-center justify-center">
                    {getMediaIcon(alert)}
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
};

export default AlertsTable;
