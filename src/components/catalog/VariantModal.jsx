import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { formatRupiah } from '../../utils/currency.js';

/**
 * Inner content component where hooks are always called unconditionally.
 */
const VariantModalContent = ({ product, onClose, onConfirm }) => {
  const variants = product.variants || [];

  // Initialize selected variants with first option of each radio variant
  const [selectedVariants, setSelectedVariants] = useState(() => {
    const initial = {};
    variants.forEach((v) => {
      if (v.type === 'radio' && v.options && v.options.length > 0) {
        initial[v.name] = v.options[0];
      }
    });
    return initial;
  });

  // Selected toppings (checkboxes)
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Toggle topping selection
  const handleToggleTopping = (toppingOption) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === toppingOption.id);
      if (exists) {
        return prev.filter((t) => t.id !== toppingOption.id);
      }
      return [...prev, toppingOption];
    });
  };

  // Select radio variant
  const handleSelectRadio = (variantName, option) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: option,
    }));
  };

  // Calculate unit price with variants & toppings
  const unitPrice = useMemo(() => {
    let price = product.price;

    // Add radio variant extra
    Object.values(selectedVariants).forEach((opt) => {
      if (opt && opt.priceExtra) {
        price += opt.priceExtra;
      }
    });

    // Add toppings extra
    selectedToppings.forEach((t) => {
      if (t && t.priceExtra) {
        price += t.priceExtra;
      }
    });

    return price;
  }, [product.price, selectedVariants, selectedToppings]);

  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    onConfirm({
      ...product,
      price: unitPrice,
      quantity,
      selectedVariants,
      selectedToppings,
      // Create a unique cart key so same product with different variants can be distinct
      cartKey: `${product.id}-${JSON.stringify(selectedVariants)}-${selectedToppings.map((t) => t.id).sort().join(',')}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Modal Container */}
      <div className="relative w-full sm:max-w-lg bg-white max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={product.img}
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover border border-gray-100"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500';
              }}
            />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-800 leading-tight">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Mulai {formatRupiah(product.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Radio Variants (e.g. Ukuran / Porsi) */}
          {variants
            .filter((v) => v.type === 'radio')
            .map((variant) => (
              <div key={variant.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-800">
                    {variant.name}
                  </h4>
                  {variant.required && (
                    <span className="text-[10px] font-bold text-[#FF7A00] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Wajib
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {variant.options.map((opt) => {
                    const isSelected = selectedVariants[variant.name]?.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectRadio(variant.name, opt)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FF7A00] bg-orange-50/60 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#FF7A00]' : 'text-gray-700'
                            }`}
                          >
                            {opt.name}
                          </p>
                          {opt.priceExtra > 0 && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              +{formatRupiah(opt.priceExtra)}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Checkbox Toppings */}
          {variants
            .filter((v) => v.type === 'checkbox')
            .map((variant) => (
              <div key={variant.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-800">
                    {variant.name}
                  </h4>
                  <span className="text-[10px] text-gray-400">Bisa pilih lebih dari satu</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {variant.options.map((opt) => {
                    const isSelected = selectedToppings.some((t) => t.id === opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleTopping(opt)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FF7A00] bg-orange-50/60 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#FF7A00]' : 'text-gray-700'
                            }`}
                          >
                            {opt.name}
                          </p>
                          {opt.priceExtra > 0 && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              +{formatRupiah(opt.priceExtra)}
                            </p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#FF7A00] bg-[#FF7A00] text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer: Quantity Stepper & Add Button */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0 safe-area-pb">
          {/* Stepper */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-extrabold text-sm text-gray-800 min-w-[16px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-full bg-[#FF7A00] hover:bg-[#e06c00] text-white font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-orange-500/20 btn-bounce cursor-pointer transition-all"
          >
            <span>Tambah ke Keranjang</span>
            <span>{formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal / Bottom sheet for selecting product variants & toppings before adding to cart.
 * Complies with React Rules of Hooks by delegating to VariantModalContent.
 *
 * @param {Object} props
 * @param {import('../../types/index.js').Product | null} props.product
 * @param {() => void} props.onClose
 * @param {(cartItem: Object) => void} props.onConfirm
 */
export const VariantModal = ({ product, onClose, onConfirm }) => {
  if (!product) return null;
  return <VariantModalContent product={product} onClose={onClose} onConfirm={onConfirm} />;
};
