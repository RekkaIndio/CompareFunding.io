import React from "react";

interface LogoModalProps {
  open: boolean;
  onClose: () => void;
  imgSrc: string;
  alt: string;
}

const LogoModal: React.FC<LogoModalProps> = ({ open, onClose, imgSrc, alt }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-xs w-full flex flex-col items-center">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <img src={imgSrc} alt={alt} className="h-24 w-auto object-contain mb-2" />
        <div className="text-center font-semibold text-lg">{alt}</div>
      </div>
    </div>
  );
};

export default LogoModal;
