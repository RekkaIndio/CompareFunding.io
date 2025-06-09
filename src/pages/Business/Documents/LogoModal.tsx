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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-8 relative max-w-sm w-full mx-4 flex flex-col items-center border border-white/20">
        {/* Enhanced gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm"></div>
        
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-200 hover:scale-110 transform"
          onClick={onClose}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 mb-4 shadow-inner">
            <img 
              src={imgSrc} 
              alt={alt} 
              className="h-20 w-auto object-contain transition-transform duration-200 hover:scale-105" 
            />
          </div>
          <div className="text-center font-semibold text-xl text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {alt}
          </div>
          <div className="text-sm text-gray-500 mt-2 text-center">
            Accounting Software Integration
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoModal;
