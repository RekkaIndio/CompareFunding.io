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
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className={showSidebar ? "lg:col-span-8" : "lg:col-span-12"}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl">
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

            {/* Sidebar */}
            {showSidebar && sidebarProps && (
              <div className="lg:col-span-4">
                <div className="sticky top-8">
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
