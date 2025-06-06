import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import LowCreditsDialog from '@/components/LowCreditsDialog';

// Import directly using absolute paths
import ApplicationHeader from '@/pages/Applications/ApplicationDetail/components/ApplicationHeader';
import ApplicationOverview from '@/pages/Applications/ApplicationDetail/components/ApplicationOverview';
import ApplicationStrengthCard from '@/pages/Applications/ApplicationDetail/components/ApplicationStrengthCard';
import ApplicationViewDetails from '@/pages/Applications/ApplicationDetail/components/ApplicationViewDetails';
import BusinessProfileCard from '@/pages/Applications/ApplicationDetail/components/BusinessProfileCard';
import CreditScoreCard from '@/pages/Applications/ApplicationDetail/components/CreditScoreCard';
import FinancialDocumentsSection from '@/pages/Applications/ApplicationDetail/components/FinancialDocumentsSection';
import OffersSection from '@/pages/Applications/ApplicationDetail/components/OffersSection';
import { useApplicationData, useLenderCredits } from '@/pages/Applications/ApplicationDetail/hooks';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasViewedDetails, setHasViewedDetails] = useState<boolean>(false);
  const [isDeductingCredits, setIsDeductingCredits] = useState<boolean>(false);
  const [showLowCreditsDialog, setShowLowCreditsDialog] = useState<boolean>(false);
  
  // Use our custom hooks
  const { 
    application, 
    isLoading, 
    errorMessage,
    refetchApplication, 
    calculateCompleteness,
    handleRespondToInterest,
  } = useApplicationData(id, user);
  
  const { 
    lenderData, 
    availableCredits, 
    getCreditCost,
    handleViewFullDetails 
  } = useLenderCredits(id, user, application, lenderData => {
    setIsDeductingCredits(true);
    const creditCost = getCreditCost(application?.loan_amount);
    
    if (availableCredits < creditCost) {
      setShowLowCreditsDialog(true);
      setIsDeductingCredits(false);
      return;
    }
    
    // Success callback
    return () => {
      setHasViewedDetails(true);
      setIsDeductingCredits(false);
    };
  });
  
  // Check if user is a matched lender for this application
  const isMatchedLender = application?.matched_lenders?.includes(user?.uid) || false;

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="w-full max-w-7xl mx-auto py-8 px-6">
          <Button
            variant="ghost"
            className="mb-6 hover:bg-white/60 text-slate-700 hover:text-slate-900 border border-slate-200/50 backdrop-blur-sm"
            onClick={() => {
              if (application?.isLender) {
                navigate('/matched-applications');
              } else {
                navigate('/applications');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {application?.isLender ? 'Back to Matched Applications' : 'Back to Applications'}
          </Button>
          
          <div className="w-full max-w-none">
            {/* Application Header */}
            <ApplicationHeader application={application} />
            
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg"></div>
            ) : application ? (
              <>
                {/* Draft Application Alert */}
                {application.status === 'draft' && (
                  <Alert className="mb-6 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-medium">Draft Application</AlertTitle>
                    <AlertDescription className="flex items-center justify-between text-amber-700">
                      <span>This application hasn't been submitted yet. Submit it to start receiving offers from lenders.</span>
                      <Button 
                        className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000]"
                        onClick={() => navigate(`/applications/${id}/review`)}
                      >
                        Continue to Review
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Credit Cost Section - Only show for lenders who haven't viewed yet */}
                {application?.isLender && 
                 !hasViewedDetails && 
                 !isMatchedLender && 
                 !application.viewed_by_lenders?.includes(user?.uid) && (
                  <ApplicationViewDetails 
                    application={application}
                    isDeductingCredits={isDeductingCredits}
                    getCreditCost={getCreditCost}
                    handleViewFullDetails={handleViewFullDetails}
                  />
                )}

                {/* Application Overview Section */}
                <ApplicationOverview application={application} refetchApplication={refetchApplication} />

                {/* Grid for strength cards and business info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <ApplicationStrengthCard application={application} />
                  <BusinessProfileCard application={application} />
                  <CreditScoreCard application={application} />
                </div>

                {/* Financial Documents Section */}
                <FinancialDocumentsSection application={application} />

                {/* Offers Section */}
                {application.offers && application.offers.length > 0 && (
                  <OffersSection 
                    application={application} 
                    handleRespondToInterest={handleRespondToInterest}
                  />
                )}

                {/* Continue to Review Button - for non-lenders */}
                {!application?.isLender && application.status !== 'draft' && (
                  <div className="mt-8 text-center">
                    <Button 
                      className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] px-8 py-3 text-lg"
                      onClick={() => navigate(`/applications/${id}/review`)}
                    >
                      Continue to Review
                    </Button>
                  </div>
                )}

                {/* Additional Continue to Review Button at Bottom - for all users */}
                <div className="mt-12 pt-8 border-t border-slate-200/50 text-center">
                  <Button 
                    className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] px-8 py-3 text-lg"
                    onClick={() => navigate(`/applications/${id}/review`)}
                  >
                    Continue to Review
                  </Button>
                </div>

                {/* Low Credits Dialog */}
                {showLowCreditsDialog && (
                  <LowCreditsDialog 
                    isOpen={showLowCreditsDialog}
                    onClose={() => setShowLowCreditsDialog(false)}
                    availableCredits={availableCredits}
                    requiredCredits={getCreditCost(application.loan_amount)}
                  />
                )}
              </>
            ) : (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Not Found</AlertTitle>
                <AlertDescription>
                  {errorMessage || "This application doesn't exist or you don't have permission to view it."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApplicationDetail;
