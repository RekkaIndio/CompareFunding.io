import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, expressInterestInApplication } from '@/firebase';
import { normalizeCreditScoreData } from '@/services';
import { getFirestore } from 'firebase/firestore';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Import components directly from their files
import { BusinessHeader } from './components/BusinessHeader';
import { BusinessOverview } from './components/BusinessOverview';
import { FinancialDataTabs } from './components/FinancialDataTabs';
import { FinancialDocumentsCard } from './components/FinancialDocumentsCard';
import { CreditScoreCard } from './components/CreditScoreCard';
import { FundingRequestCard } from './components/FundingRequestCard';
import { InterestConfirmDialog } from './components/InterestConfirmDialog';

// Import hooks directly from their files
import { useBusinessData } from './hooks/useBusinessData';
import { useFinancialData } from './hooks/useFinancialData';

// No migration interfaces needed

const BusinessDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  // Fetch lender profile data
  const { data: lenderProfile } = useQuery({
    queryKey: ['lenderProfile', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocument('lender_profiles', user?.uid);
      
      if (error) {
        toast.error('Error loading profile data');
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });

  // Use custom hooks to fetch business and financial data
  const {
    applicationData,
    isLoading,
    error,
    canSeeBusinessDetails,
    isLenderMatched,
    getDisplayName,
    hasExpressedInterest
  } = useBusinessData(id, user);

  const { financialData } = useFinancialData(id, applicationData);

  // Migration functionality removed

  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      const { data, error } = await expressInterestInApplication(
        id as string, 
        user?.uid as string,
        lenderProfile
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Interest expressed successfully! The business will be notified.');
      setIsConfirmDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['businessDetail', id] });
    },
    onError: (error: any) => {
      toast.error(`Failed to express interest: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleExpressInterest = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmExpressInterest = () => {
    expressInterestMutation.mutate();
  };

  // Update document title based on match status
  useEffect(() => {
    if (applicationData?.application) {
      document.title = `${getDisplayName()} | FundHub`;
    }
  }, [applicationData, getDisplayName]);

  // Debug logs for visibility checks and financial data
  useEffect(() => {
    if (applicationData) {



    }
    

    if (financialData) {

    }
  }, [applicationData, financialData, canSeeBusinessDetails]);

  // Debug output for application data
  useEffect(() => {
    if (applicationData) {

      
      // Log the business ID we're using
      const businessId = applicationData.application?.business_id || 
                       applicationData.business?.id || 
                       applicationData.application?.user_id;
                       

      
      // Log financial data state

      
      // Log lender match status explicitly
      const matchStatus = isLenderMatched();

    }
  }, [applicationData, financialData, isLenderMatched]);

  if (error) {
    console.error('BusinessDetail error:', error);
    return (
      <PageLayout>
        <div className="container py-8">
          <Button
            variant="ghost"
            className="mb-6 flex items-center hover:bg-[#212936]/10 text-[#212936]"
            onClick={() => navigate('/matched-applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="font-medium">Error</h3>
            <p>
              {error instanceof Error ? error.message : 'An unexpected error occurred while loading the business profile.'}
            </p>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 w-1/4 rounded"></div>
            <div className="h-[600px] bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!applicationData) {
    return (
      <PageLayout>
        <div className="container py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="font-medium">Not Found</h3>
            <p>
              The business profile you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="container py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6 flex items-center hover:bg-[#212936]/10 text-[#212936]"
            onClick={() => navigate('/matched-applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>

          <BusinessHeader 
            displayName={getDisplayName()}
            applicationData={applicationData}
            handleExpressInterest={handleExpressInterest}
            isLenderMatched={isLenderMatched()}
            hasExpressedInterest={hasExpressedInterest()}
          />

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <BusinessOverview 
                applicationData={applicationData} 
                canSeeBusinessDetails={canSeeBusinessDetails()}
                handleExpressInterest={handleExpressInterest}
                hasExpressedInterest={hasExpressedInterest()}
                isLenderMatched={isLenderMatched()}
              />

              <FinancialDataTabs 
                financialData={financialData}
                handleExpressInterest={handleExpressInterest}
                isLenderMatched={isLenderMatched()}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <CreditScoreCard creditScore={applicationData.creditScore} />
              <FundingRequestCard 
                application={applicationData.application}
                handleExpressInterest={handleExpressInterest}
                isLenderMatched={isLenderMatched()}
                hasExpressedInterest={hasExpressedInterest()}
              />
              {/* Always show the Financial Documents Card, but content changes based on match status */}
              <FinancialDocumentsCard 
                financialData={financialData}
                isLenderMatched={isLenderMatched()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <InterestConfirmDialog 
        isOpen={isConfirmDialogOpen}
        setIsOpen={setIsConfirmDialogOpen}
        applicationData={applicationData}
        id={id}
        confirmExpressInterest={confirmExpressInterest}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  );
};

export default BusinessDetailPage;
