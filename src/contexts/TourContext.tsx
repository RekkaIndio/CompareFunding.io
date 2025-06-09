import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createDraftApplication } from '../lib/signupDataUtils';
import { toast } from 'sonner';

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
    content: 'Upload your business documents here. The more complete your documentation, the better offers you will receive from lenders.',
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
  },
  {
    id: 'draft-application-highlight',
    title: 'Your Draft Application',
    content: 'Perfect! We\'ve created a draft application for you using the information from your signup. Click here to review and complete your application.',
    target: '[data-tour="draft-applications-section"]',
    sidebarTarget: '[data-tour="sidebar-dashboard"]',
    placement: 'top',
    page: '/dashboard',
    customSpotlight: 'full-section'
  }
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps] = useState<TourStep[]>(TOUR_STEPS);
  const { user } = useAuth();

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(async () => {
    console.log('🎯 Tour ending...');
    setIsActive(false);
    setCurrentStep(0);
    
    // Since we now create the draft before the highlight step, 
    // we just need to show a completion message
    toast.success('Tour completed! Your draft application is ready to review.');
  }, []);

  const nextStep = useCallback(async () => {
    if (currentStep < steps.length - 1) {
      // Check if we're about to show the draft application highlight step
      const nextStepIndex = currentStep + 1;
      const nextStepData = steps[nextStepIndex];
      
      if (nextStepData?.id === 'draft-application-highlight') {
        // Create draft application before showing the highlight step
        if (user?.uid) {
          try {
            console.log('🎯 Creating draft application before showing highlight step...');
            const success = await createDraftApplication(user.uid);
            if (success) {
              console.log('✅ Draft application created successfully before highlight step');
              
              // Trigger dashboard refresh to show the new draft
              if (typeof (window as any).refreshDashboard === 'function') {
                console.log('🔄 Triggering dashboard refresh before highlight step...');
                (window as any).refreshDashboard();
                
                // Add a longer delay to ensure the refresh completes and DOM updates
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Check if the draft section is now visible
                const draftSection = document.querySelector('[data-tour="draft-applications-section"]');
                if (!draftSection) {
                  console.warn('⚠️ Draft section not found after refresh, creating backup target');
                  // Create a temporary target element if the draft section doesn't exist
                  const backupElement = document.createElement('div');
                  backupElement.setAttribute('data-tour', 'draft-applications-section');
                  backupElement.style.position = 'absolute';
                  backupElement.style.top = '200px';
                  backupElement.style.left = '50%';
                  backupElement.style.transform = 'translateX(-50%)';
                  backupElement.style.width = '1px';
                  backupElement.style.height = '1px';
                  backupElement.style.opacity = '0';
                  document.body.appendChild(backupElement);
                  
                  // Clean up after tour step
                  setTimeout(() => {
                    if (backupElement.parentNode) {
                      backupElement.parentNode.removeChild(backupElement);
                    }
                  }, 5000);
                }
              } else {
                console.warn('⚠️ Dashboard refresh function not available');
              }
            } else {
              console.warn('⚠️ Draft application creation failed');
            }
          } catch (error) {
            console.error('❌ Error creating draft application before highlight step:', error);
          }
        }
      }
      
      // Reduced delay for faster, smoother transitions
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 100);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour, user]);

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
