import React from 'react';
import { Alert } from '../../services/alertService';
import { FaImage } from 'react-icons/fa';

interface ViewAlertModalProps {
  alert: Alert;
  onClose: () => void;
  getAlertTypeDisplay: (type: string) => string;
  getAlertTypeBadgeColor: (type: string) => string;
  formatDate: (date: string) => string;
  getMediaUrl: (alert: Alert) => string | undefined;
  isImage: (alert: Alert) => boolean;
}

const ViewAlertModal: React.FC<ViewAlertModalProps> = ({
  alert,
  onClose,
  getAlertTypeDisplay,
  getAlertTypeBadgeColor,
  formatDate,
  getMediaUrl,
  isImage,
}) => {
  const mediaUrl = getMediaUrl(alert);

  const renderMedia = () => {
    if (!mediaUrl) {
      return (
        <div className="p-4 text-center">
          <FaImage className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No media available</p>
        </div>
      );
    }

    if (isImage(alert)) {
      return (
        <img
          src={mediaUrl}
          alt="Alert Media"
          className="max-w-full max-h-[400px] rounded-lg object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div className="p-4 text-center">
        <FaImage className="w-10 h-10 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">Image preview not available</p>
        <p className="mt-1 text-xs text-gray-400 break-all">{mediaUrl}</p>
      </div>
    );
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
          {/* Alert Type and Timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className={`px-3 py-1 text-xs text-white rounded-full ${getAlertTypeBadgeColor(alert.type)}`}>
              {getAlertTypeDisplay(alert.type)}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(alert.timestamp)}
            </span>
          </div>

          {/* Description */}
          <div className="p-4 mb-6 rounded-lg bg-gray-50">
            <p className="text-gray-700">{alert.description}</p>
          </div>

          {/* Media */}
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-medium text-gray-500">Media</h4>
            <div className="flex justify-center p-2 bg-gray-100 border rounded-lg">
              {renderMedia()}
            </div>
          </div>

          {/* Other Info */}
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

            {alert.mediaPath && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Media Path</p>
                <p className="font-mono text-xs text-gray-400 break-all">
                  {alert.mediaPath}
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

export default ViewAlertModal;
