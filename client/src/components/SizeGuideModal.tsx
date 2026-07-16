import { useState, useEffect } from 'react';
import { classNames } from '@/lib/format';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: 't-shirt' | 'hoodie' | 'sweatshirt';
}

export default function SizeGuideModal({ isOpen, onClose, category = 't-shirt' }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'cm' | 'in'>('cm');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Placeholder data for size guide
  const guideData = {
    't-shirt': {
      S: { chest: 53, length: 71 },
      M: { chest: 56, length: 73 },
      L: { chest: 59, length: 75 },
      XL: { chest: 62, length: 77 },
      '2XL': { chest: 65, length: 79 },
    },
    'hoodie': {
      S: { chest: 58, length: 68 },
      M: { chest: 61, length: 70 },
      L: { chest: 64, length: 72 },
      XL: { chest: 67, length: 74 },
      '2XL': { chest: 70, length: 76 },
    },
    'sweatshirt': {
      S: { chest: 56, length: 69 },
      M: { chest: 59, length: 71 },
      L: { chest: 62, length: 73 },
      XL: { chest: 65, length: 75 },
      '2XL': { chest: 68, length: 77 },
    }
  };

  const data = guideData[category];

  const convert = (cm: number) => {
    return activeTab === 'in' ? (cm * 0.393701).toFixed(1) : cm;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-2xl bg-ink-800 p-6 shadow-2xl ring-1 ring-bone/10 sm:p-8 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-bone/50 hover:text-bone transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="heading-serif text-2xl text-bone mb-2">Size Guide</h2>
        <p className="text-sm text-bone/60 mb-6 capitalize">{category} Measurements</p>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('cm')}
            className={classNames(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === 'cm' ? "bg-bone text-ink" : "bg-bone/10 text-bone hover:bg-bone/20"
            )}
          >
            CM
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={classNames(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === 'in' ? "bg-bone text-ink" : "bg-bone/10 text-bone hover:bg-bone/20"
            )}
          >
            IN
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-bone/80">
            <thead>
              <tr className="border-b border-bone/10 text-bone">
                <th className="pb-3 font-medium">Size</th>
                <th className="pb-3 font-medium">Chest</th>
                <th className="pb-3 font-medium">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone/10">
              {Object.entries(data).map(([size, measurements]) => (
                <tr key={size}>
                  <td className="py-4 font-medium text-bone">{size}</td>
                  <td className="py-4">{convert(measurements.chest)}</td>
                  <td className="py-4">{convert(measurements.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-bone/40 leading-relaxed">
          Measurements are taken with the garment laid flat. Chest is measured 1" below the armhole. Length is measured from the highest point of the shoulder to the bottom hem. Please allow a 1-2cm variance.
        </p>
      </div>
    </div>
  );
}
