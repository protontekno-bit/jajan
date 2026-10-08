import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants.js';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Footer component with branding, copyright, developer attribution to AuraCore Labs Indonesia,
 * and discreet admin portal link.
 * @param {Object} props
 * @param {Function} [props.onOpenAdmin]
 */
export const Footer = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-16 border-t border-orange-100 bg-white/70 backdrop-blur-sm py-8 px-4 text-center">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
        {/* Brand Copyright */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="font-extrabold text-[#FF7A00] text-sm">{APP_CONFIG.name}</span>
          <span>&copy; {CURRENT_YEAR} {APP_CONFIG.name}. Hak Cipta Dilindungi.</span>
        </div>

        {/* Developer Attribution to AuraCore Labs Indonesia */}
        <div className="flex items-center gap-1.5 text-gray-500 text-xs flex-wrap justify-center">
          <span>Dikembangkan oleh</span>
          <a
            href="https://www.auracore.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-gray-800 hover:text-[#2563EB] transition-colors group"
            title="AuraCore Labs Indonesia - Boutique Software & AI Engineering Studio"
          >
            <span className="group-hover:underline">AuraCore Labs Indonesia</span>
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#2563EB]" />
          </a>
        </div>

        {/* Secondary Info & Discreet Staff Login Link */}
        <div className="flex items-center gap-3 text-gray-400">
          <div className="hidden sm:flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 fill-[#FF4B4B] text-[#FF4B4B]" />
            <span>untuk kuliner Sangatta</span>
          </div>

          <span className="hidden sm:inline text-gray-300">•</span>

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

