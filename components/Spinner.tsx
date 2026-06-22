import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-ping opacity-25"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 border-r-transparent border-b-indigo-600 border-l-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-indigo-600 font-semibold animate-pulse">Creating your masterpiece...</p>
    </div>
  );
};