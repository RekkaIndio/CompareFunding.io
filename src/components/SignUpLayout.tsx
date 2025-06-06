import React from 'react';
import PageLayout from '@/components/PageLayout';
import SignUpSidebar from '@/components/SignUpSidebar';
import SignUpProgressBar from '@/components/SignUpProgressBar';

interface SignUpLayoutProps {
  children: React.ReactNode;
  steps: Array<{ label: string; path: string }>;
  currentStep: number;
  onStepNavigation: (stepIndex: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  showSidebar?: boolean;
  sidebarProps?: {
    title: string;
    description: string;
    highlight?: string;
    tips?: string[];
  };
  className?: string;
}

const SignUpLayout: React.FC<SignUpLayoutProps> = ({
  children,
  steps,
  currentStep,
  onStepNavigation,
  onPrevious,
  onNext,
  canGoBack = true,
  canGoNext = true,
  showSidebar = true,
  sidebarProps,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-br from-gray-50 to-white min-h-screen ${className}`}>
      <PageLayout>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className={showSidebar ? "lg:col-span-8 order-2 lg:order-1" : "lg:col-span-12"}>
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-xl">
                <SignUpProgressBar
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={onStepNavigation}
                  onPrevious={onPrevious}
                  onNext={onNext}
                  canGoBack={canGoBack}
                  canGoNext={canGoNext}
                />
                
                <div className="animate-fadeIn">
                  {children}
                </div>
              </div>
            </div>

            {/* Sidebar - Order changed for mobile to show it on top if needed */}
            {showSidebar && sidebarProps && (
              <div className="lg:col-span-4 order-1 lg:order-2 mb-4 lg:mb-0">
                <div className="lg:sticky lg:top-8">
                  <SignUpSidebar
                    title={sidebarProps.title}
                    description={sidebarProps.description}
                    highlight={sidebarProps.highlight}
                    tips={sidebarProps.tips}
                    step={currentStep}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default SignUpLayout;
