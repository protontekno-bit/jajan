import React from 'react';
import { Heart } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants.js';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Footer component with branding, copyright, and discreet admin portal link.
 * @param {Object} props
 * @param {Function} [props.onOpenAdmin]
 */
export const Footer = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-16 border-t border-orange-100 bg-white/70 backdrop-blur-sm py-8 px-4 text-center">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#FF7A00] text-sm">{APP_CONFIG.name}</span>
          <span>&copy; {CURRENT_YEAR} {APP_CONFIG.name}. Hak Cipta Dilindungi.</span>
        </div>

        {/* Footer info & discreet staff link */}
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 fill-[#FF4B4B] text-[#FF4B4B]" />
            <span>untuk kuliner Sangatta</span>
          </div>

          <span className="text-gray-300">•</span>

          <a
            href="/admin"
            onClick={(e) => {
              if (onOpenAdmin) {
                e.preventDefault();
                onOpenAdmin();
              }
            }}
            className="text-[11px] text-gray-400 hover:text-[#FF7A00] transition-colors cursor-pointer"
            title="Khusus Staf & Pemilik Toko"
          >
            Staff Login
          </a>
        </div>
      </div>
    </footer>
  );
};

