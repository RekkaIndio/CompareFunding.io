import React, { createContext, useContext, useState, useCallback } from 'react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the target element
  sidebarTarget?: string; // CSS selector for the sidebar element to highlight
  placement?: 'top' | 'bottom' | 'left' | 'right';
  page?: string; // Page route where this step should be shown
  action?: () => void; // Optional action to perform when reaching this step
  customSpotlight?: 'from-top' | 'full-section'; // Special spotlight behaviors
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  currentTourStep: TourStep | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Define the tour steps
const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard-welcome',
    title: 'Welcome to Your Dashboard!',
    content: 'This is your central hub where you can monitor your applications, view offers, and track your funding journey.',
    target: '[data-tour="dashboard-overview"]',
    sidebarTarget: '[data-tour="sidebar-dashboard"]',
    placement: 'bottom',
    page: '/dashboard',
    customSpotlight: 'from-top'
  },
  {
    id: 'business-profile',
    title: 'Your Business Profile',
    content: 'We\'ve already filled out your business profile with the information you provided. This includes your company details and logo.',
    target: '[data-tour="business-profile-main"]',
    sidebarTarget: '[data-tour="sidebar-business-profile"]',
    placement: 'right',
    page: '/business/profile',
    customSpotlight: 'from-top'
  },
  {
    id: 'credit-score-navigation',
    title: 'Business Credit Score',
    content: 'Check your business credit score to understand how lenders view your creditworthiness. This header shows your company details and credit information.',
    target: '[data-tour="credit-score-header"]',
    sidebarTarget: '[data-tour="sidebar-credit-score"]',
    placement: 'bottom',
    page: '/credit-score',
    customSpotlight: 'from-top'
  },
  {
    id: 'documents-upload',
    title: 'Upload Documents',
    content: 'Upload your business documents here. The more complete your documentation, the better offers you\'ll receive from lenders.',
    target: '[data-tour="document-upload"]',
    sidebarTarget: '[data-tour="sidebar-documents"]',
    placement: 'bottom',
    page: '/business/documents'
  },
  {
    id: 'applications-tracking',
    title: 'Your Applications',
    content: 'Track all your funding applications here. You can see their status and manage them easily.',
    target: '[data-tour="applications-overview"]',
    sidebarTarget: '[data-tour="sidebar-applications"]',
    placement: 'top',
    page: '/applications'
  },
  {
    id: 'applications-section',
    title: 'Create New Application',
    content: 'Ready to apply for funding? Click here to start a new application and find the best funding options for your business.',
    target: '[data-tour="new-application-button"]',
    sidebarTarget: '[data-tour="sidebar-dashboard"]',
    placement: 'left',
    page: '/dashboard',
    customSpotlight: 'from-top'
  }
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps] = useState<TourStep[]>(TOUR_STEPS);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      // Reduced delay for faster, smoother transitions
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 100);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      // Reduced delay for faster, smoother transitions
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, 100);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const currentTourStep = isActive ? steps[currentStep] : null;

  const value: TourContextType = {
    isActive,
    currentStep,
    steps,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
    currentTourStep
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
