import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Toast notification for user actions (e.g. Added item to cart).
 * @param {Object} props
 * @param {string | null} props.message
 * @param {() => void} props.onClose
 * @param {number} [props.duration]
 */
export const Toast = ({ message, onClose, duration = 2500 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-xl font-medium text-sm z-50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
      <CheckCircle2 className="w-4 h-4 text-emerald-200 stroke-[2.5]" />
      <span>{message}</span>
    </div>
  );
};
