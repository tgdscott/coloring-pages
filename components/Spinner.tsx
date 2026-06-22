import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
    </div>
  );
};
