import React from 'react';

const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="healthcare-loading"></div>
      <div className="flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '600ms' }}></div>
      </div>
      <span className="text-sm text-gray-500 font-medium">Analyzing...</span>
    </div>
  );
};

export default LoadingDots;