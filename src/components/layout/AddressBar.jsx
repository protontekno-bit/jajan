import React, { useState } from 'react';
import { MapPin, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../config/constants.js';

const SAVED_ADDRESSES = [
  {
    id: '1',
    label: 'G house no.151 (Utama)',
    address: 'G house no.151 Swarga Bara, Kec. Sangatta Utara, Kutai Timur 75683',
    coordinates: APP_CONFIG.storeCoordinatesStr,
    mapsUrl: APP_CONFIG.storeMapsUrl,
    isDefault: true,
  },
  {
    id: '2',
    label: 'Townhall Swarga Bara',
    address: 'Kawasan Swarga Bara, Kec. Sangatta Utara, Kutai Timur',
    coordinates: '0.5292, 117.5255',
    mapsUrl: 'https://maps.google.com/?q=Townhall+Swarga+Bara+Sangatta',
  },
  {
    id: '3',
    label: 'Area Sangatta Utara',
    address: 'Kec. Sangatta Utara, Kabupaten Kutai Timur, Kalimantan Timur',
    coordinates: '0.5015, 117.5385',
    mapsUrl: 'https://maps.google.com/?q=Sangatta+Utara+Kutai+Timur',
  },
];

/**
 * Mobile-friendly Delivery Address Bar & quick selector modal with Google Maps GPS link.
 */
export const AddressBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(SAVED_ADDRESSES[0]);

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xs border-b border-orange-100/60 py-2 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 text-gray-700 hover:text-[#FF7A00] transition-colors group text-left cursor-pointer"
            aria-label="Pilih alamat pengiriman"
          >
            <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-gray-400 font-medium">Lokasi:</span>
            <span className="font-bold text-gray-900 group-hover:text-[#FF7A00] truncate max-w-[200px] sm:max-w-md">
              {selectedAddress.label} • {selectedAddress.address}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF7A00] flex-shrink-0" />
          </button>

          <div className="flex items-center gap-3">
            <a
              href={selectedAddress.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#FF7A00] transition-colors"
              title="Lihat koordinat lokasi di Google Maps"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Titik GPS Maps ({selectedAddress.coordinates})</span>
            </a>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-100/80 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Buka: {APP_CONFIG.storeHours}
            </span>
          </div>
        </div>
      </div>

      {/* Address Switcher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-extrabold text-base text-gray-800 mb-1">Lokasi & Alamat Antar</h4>
            <p className="text-xs text-gray-400 mb-4">
              Titik pengantaran / pengambilan di area Sangatta Utara
            </p>

            <div className="space-y-2.5 mb-5">
              {SAVED_ADDRESSES.map((addr) => {
                const isSelected = selectedAddress.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setIsOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF7A00] bg-orange-50/60 shadow-xs'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                          {addr.label}
                          {addr.isDefault && (
                            <span className="text-[10px] bg-orange-100 text-[#FF7A00] px-1.5 py-0.2 rounded font-bold">
                              Utama
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{addr.address}</p>
                        <p className="text-[11px] text-[#FF7A00] font-semibold mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS: {addr.coordinates}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#FF7A00] mt-0.5 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <a
                href={selectedAddress.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-full bg-orange-50 text-[#FF7A00] hover:bg-orange-100 border border-orange-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Titik di Google Maps</span>
              </a>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
