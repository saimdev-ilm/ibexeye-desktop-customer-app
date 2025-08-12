import React from 'react';

interface ErrorStateProps {
  error: string;
  retryFn: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, retryFn }) => {
  return (
    <div className="p-6 text-center border border-red-200 bg-red-50 rounded-xl">
      <p className="mb-4 text-red-600">{error}</p>
      <button
        onClick={retryFn}
        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
};

export default ErrorState;
