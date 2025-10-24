import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; alt: string; type: 'before' | 'after' }[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onPrevious,
  onNext,
}) => {
  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X size={32} />
      </button>
      
      <button
        onClick={onPrevious}
        className="absolute left-4 text-white hover:text-gray-300 z-10"
        disabled={images.length <= 1}
      >
        <ChevronLeft size={32} />
      </button>
      
      <button
        onClick={onNext}
        className="absolute right-4 text-white hover:text-gray-300 z-10"
        disabled={images.length <= 1}
      >
        <ChevronRight size={32} />
      </button>

      <div className="max-w-4xl max-h-[90vh] mx-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-w-full max-h-full object-contain"
        />
        <div className="text-center mt-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            currentImage.type === 'before' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {currentImage.type === 'before' ? 'Before' : 'After'}
          </span>
          <p className="text-white mt-2">{currentImage.alt}</p>
        </div>
      </div>
    </div>
  );
};