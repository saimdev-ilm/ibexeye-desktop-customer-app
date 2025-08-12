// src/components/CustomPopup.tsx
import React from 'react';

import xMarkImage from "../assets/xmark.webp"

interface CustomPopupProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const CustomPopup: React.FC<CustomPopupProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000000] flex items-center justify-center bg-black bg-opacity-50 cust_index cust_indexs">
      <div className="w-1/5 p-6 mx-auto text-center cust_index bg-theme text-theme shadow-3d  card  rounded-lg shadow-lg">
      <div className="flex justify-center">
        <img src={xMarkImage} alt="" className='w-20 h-20' />
      </div>
        <p className="my-4 text-base text-gray-400">{message}</p>
       <div className="text-center">
       <button
          className="w-full material-button"
          onClick={onClose}
        >
          Close
        </button>
       </div>
      </div>
    </div>
  );
};

export default CustomPopup;
