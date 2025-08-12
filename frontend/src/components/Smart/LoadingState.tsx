import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="py-8 text-center">
      <div className="inline-block w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-customBlue"></div>
      <p className="mt-4 text-gray-600">Loading notifications...</p>
    </div>
  );
};

export default LoadingState;
