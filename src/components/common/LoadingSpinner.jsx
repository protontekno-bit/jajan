import React from 'react';

/**
 * Modern Loading Spinner with Beliyuk Jajan Branding
 * Used for lazy-loaded modules and asynchronous route transitions.
 */
export const LoadingSpinner = ({ label = 'Memuat sistem...' }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative w-16 h-16 mb-4">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-orange-100 animate-ping opacity-75" />
        {/* Spinning gradient ring */}
        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-[#FF7A00] border-r-amber-500 animate-spin" />
        {/* Center Toast Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-xl select-none">
          🍞
        </div>
      </div>
      <p className="text-sm font-bold text-gray-700 tracking-wide">{label}</p>
      <p className="text-xs text-gray-400 mt-1">Beliyuk Jajan • Roti Bakar Sangatta</p>
    </div>
  );
};
