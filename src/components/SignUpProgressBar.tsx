import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ProgressStep {
  label: string;
  path: string;
}

interface SignUpProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  showNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
}

const SignUpProgressBar: React.FC<SignUpProgressBarProps> = ({
  steps,
  currentStep,
  onStepClick,
  showNavigation = true,
  onPrevious,
  onNext,
  canGoBack = true,
  canGoNext = true,
}) => {
  // Function to render responsive step labels
  const renderLabel = (label: string, idx: number) => {
    // For mobile, show shortened labels or just step numbers
    const mobileLabel = idx + 1;
    const isComplete = idx < currentStep;
    const isCurrent = idx === currentStep;

    return (
      <>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{mobileLabel}</span>
        {isComplete && (
          <span className="block text-xs text-green-500 mt-1 hidden sm:block">✓ Complete</span>
        )}
      </>
    );
  };

  return (
    <div className="mb-6 sm:mb-8 md:mb-10 animate-fadeIn">
      {/* Progress Bar */}
      <div className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4">
        {steps.map((step, idx) => (
          <div
            key={step.label}
            className={`flex-1 h-2 sm:h-3 rounded-full transition-all duration-500 ease-in-out transform ${
              idx <= currentStep 
                ? 'bg-gradient-to-r from-[#ff8000] to-[#ff6000] shadow-sm' 
                : 'bg-gray-200'
            } ${
              idx === currentStep ? 'scale-105' : ''
            }`}
          />
        ))}
      </div>

      {/* Step Labels */}
      <div className="grid text-center text-xs sm:text-sm font-medium text-[#2a3441] mb-6 sm:mb-8" 
           style={{gridTemplateColumns: `repeat(${steps.length}, 1fr)`}}>
        {steps.map((step, idx) => (
          <span 
            key={step.label} 
            className={`transition-all duration-300 cursor-pointer hover:text-[#ff8000] ${
              idx === currentStep 
                ? 'font-bold text-[#ff8000] transform scale-105' 
                : idx < currentStep 
                  ? 'text-green-600 font-semibold' 
                  : 'text-gray-500'
            }`}
            onClick={() => onStepClick && onStepClick(idx)}
          >
            {renderLabel(step.label, idx)}
          </span>
        ))}
      </div>

      {/* Navigation Arrows - Responsive design for mobile */}
      {showNavigation && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoBack || currentStep === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
              !canGoBack || currentStep === 0
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                : 'border-[#ff8000] bg-white text-[#ff8000] hover:bg-[#fff8f0] hover:shadow-md'
            }`}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Back</span>
          </button>
          
          <div className="flex-1 text-center mx-2">
            <span className="text-xs sm:text-sm text-gray-500">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || currentStep === steps.length - 1}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full border-2 transition-all duration-300 transform hover:scale-105 ${
              !canGoNext || currentStep === steps.length - 1
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                : 'border-[#ff8000] bg-[#ff8000] text-white hover:bg-[#e67300] hover:shadow-md'
            }`}
          >
            <span className="font-medium text-sm sm:text-base">Next</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SignUpProgressBar;
