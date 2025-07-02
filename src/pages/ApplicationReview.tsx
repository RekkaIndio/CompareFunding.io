import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocument, updateDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle, AlertTriangle, Download, Shield, Building2, TrendingUp, FileText, Upload, Zap, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditScoreAvailability, useFinancialDocumentsAvailability } from '@/pages/Applications/ApplicationDetail/hooks';

// Add Firestore imports for fetching financial documents (still needed for the existing query)
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Interface for financial document structure
interface FinancialDocument {
  id: string;
  documentType?: string;
  documentName?: string;
  data?: any;
  summary?: string;
  [key: string]: any; // Allow for additional properties
}

// Document types that can be uploaded
const DOCUMENT_TYPES = [
  { key: "pl", label: "Profit and Loss", description: "Revenue and expense summary" },
  { key: "bs", label: "Balance Sheet", description: "Assets and liabilities snapshot" },
  { key: "tb", label: "Trial Balance", description: "Account balances verification" },
  { key: "ap", label: "Aged Payables", description: "Outstanding supplier payments" },
  { key: "ar", label: "Aged Receivables", description: "Outstanding customer payments" },
];

const ApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const queryClient = useQueryClient();
  const [financialDocs, setFinancialDocs] = useState<FinancialDocument[]>([]);
  
  // Log the ID parameter to help with debugging
  useEffect(() => {

  }, [id]);
  
  // Fetch application data using Firebase
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {

      
      if (!id) {
        const error = new Error("Application ID is missing");
        setErrorMessage(error.message);
        throw error;
      }
      
      try {
        const { data, error } = await getDocument('applications', id);
        
        if (error) {
          console.error("Firebase error:", error);
          setErrorMessage(`Failed to load application: ${error.message || 'Unknown error'}`);
          throw error;
        }
        
        if (!data) {
          const notFoundError = new Error("Application not found in database");
          setErrorMessage(notFoundError.message);
          throw notFoundError;
        }
        

        
        // If business data is part of the application, we'll use it directly
        if (!data.business && data.business_id) {
          try {

            const businessResponse = await getDocument('businesses', data.business_id);
            if (businessResponse.data) {
              data.business = businessResponse.data;

            }
          } catch (err) {
            console.error("Error fetching business data:", err);
          }
        }
        
        // Force completeness percentage to 100 if application status is 'submitted'
        if (data.status === 'submitted') {
          data.completeness_percentage = 100;
        }
        
        return data;
      } catch (err) {
        console.error("Error in queryFn:", err);
        setErrorMessage(`Error loading application: ${err instanceof Error ? err.message : 'Unknown error'}`);
        throw err;
      }
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch credit score data using the same hook as ApplicationDetail
  const { data: creditScoreData, isLoading: isLoadingCreditScore } = useCreditScoreAvailability(
    application?.business_id || user?.uid
  );
  
  const creditScore = creditScoreData?.score;

  // Fetch financial documents availability using the new hook
  const { data: financialDocsAvailability, isLoading: isLoadingFinancialDocsHook } = useFinancialDocumentsAvailability(
    application?.business_id || user?.uid
  );

  // Fetch business profile data
  const { data: businessProfile } = useQuery({
    queryKey: ['businessProfile', user?.uid, application?.business_id],
    queryFn: async () => {
      if (!user?.uid && !application?.business_id) return null;
      
      // First try to get business data from the application
      if (application?.business) {

        return application.business;
      }
      
      // Then try to get it using application.business_id
      if (application?.business_id) {

        const { data, error } = await getDocument('businesses', application.business_id);
        if (data && !error) {

          return data;
        }
      }
      
      // Finally, try using user.uid

      const { data, error } = await getDocument('businesses', user.uid);
      if (error) {
        console.error('Error fetching business profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!(user?.uid || application?.business_id),
  });

  // Fetch accounting integration status
  const { data: accountingIntegration } = useQuery({
    queryKey: ['accountingIntegration', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const { data, error } = await getDocument('accounting_integrations', user.uid);
      if (error) {
        console.error('Error fetching accounting integration:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch financial documents
  const { data: financialsData, isLoading: isLoadingFinancials } = useQuery<FinancialDocument[]>({
    queryKey: ['financialDocuments', user?.uid, application?.business_id, application?.id],
    queryFn: async () => {
      // Determine the business ID to use for fetching documents
      let businessId = application?.business_id || null;
      
      if (!businessId && application?.business?.id) {
        businessId = application.business.id;
      }
      
      if (!businessId && user?.uid) {
        try {
          const db = getFirestore();
          // First get the business ID from the user document
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          businessId = userDoc.data()?.businessId || user.uid;
        } catch (err) {
          console.error('Error getting business ID from user document:', err);
        }
      }
      
      if (!businessId) {

        return [];
      }
      

      
      try {
        const db = getFirestore();
        
        // Query the financials collection for this business
        const financialsCollection = collection(db, "businesses", businessId, "financials");
        const querySnapshot = await getDocs(financialsCollection);
        
        const financialDocs: FinancialDocument[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        

        
        // Group documents by type and process them
        let processedFinancialDocs = {};
        let financialSummaries = {};

        financialDocs.forEach((doc: FinancialDocument) => {
          const key = doc.documentType?.toLowerCase()?.includes('profit') ? 'pl'
            : doc.documentType?.toLowerCase()?.includes('balance') && !doc.documentType?.toLowerCase()?.includes('trial') ? 'bs'
            : doc.documentType?.toLowerCase()?.includes('trial') ? 'tb'
            : doc.documentType?.toLowerCase()?.includes('payable') ? 'ap'
            : doc.documentType?.toLowerCase()?.includes('receivable') ? 'ar'
            : null;

          if (key) {
            // Process the data with extra handling for Trial Balance and Balance Sheet
            let processedData = doc.data || {};
            
            // Sometimes the data is a string that needs to be parsed
            if (typeof processedData === 'string') {
              try {
                processedData = JSON.parse(processedData);
              } catch (e) {
                console.error(`Failed to parse ${key} data as JSON:`, e);
              }
            }
            
            // Special handling for Trial Balance
            if (key === 'tb' && (!processedData || Object.keys(processedData).length === 0)) {
              // Try to extract data from the summary if the data field is empty
              try {
                if (doc.summary && typeof doc.summary === 'string') {
                  const summaryJson = JSON.parse(doc.summary);
                  if (summaryJson.json && Object.keys(summaryJson.json).length > 0) {
                    processedData = summaryJson.json;
                  }
                }
              } catch (e) {
                console.error('Failed to extract Trial Balance data from summary:', e);
              }
            }
            
            processedFinancialDocs[key] = processedData;
            financialSummaries[key] = doc.summary || '';
          }
        });
        
        // Update the application object with the processed financial documents
        if (application) {
          application.financialDocuments = processedFinancialDocs;
          application.financialSummaries = financialSummaries;
        }
        
        setFinancialDocs(financialDocs);
        return financialDocs;
      } catch (error) {
        console.error('Error fetching financial documents:', error);
        return [] as FinancialDocument[];
      }
    },
    enabled: !!(user?.uid || application?.business_id), // Always try to fetch if we have a user or business ID
  });

  // Helper function to check if any financial documents exist
  const hasFinancialDocs = (() => {
    // First, check the new hook (most reliable source)
    if (!isLoadingFinancialDocsHook && financialDocsAvailability) {
      console.log("[DEBUG] Using financial documents hook result:", financialDocsAvailability.hasDocuments);
      return financialDocsAvailability.hasDocuments;
    }
    
    // Fall back to the existing query results if hook is still loading
    const hasFetchedDocs = financialDocs && financialDocs.length > 0;
    
    // If we have fetched documents, that's the secondary source
    if (hasFetchedDocs) {
      console.log("[DEBUG] Financial documents found via supporting documents page:", financialDocs.length);
      return true;
    }
    
    // Fallback to other sources if no documents from supporting documents page
    const hasTraditionalFormat = 
      (application?.financial_documents && application.financial_documents.length > 0) ||
      (businessProfile?.financial_documents && businessProfile.financial_documents.length > 0);
      
    const hasObjectFormat = 
      (application?.financialDocuments && Object.keys(application.financialDocuments || {}).length > 0) || 
      (application?.financialDocumentsTab && Object.keys(application.financialDocumentsTab || {}).length > 0);
      
    const hasFinancialSummaries = application?.financialSummaries && 
      Object.keys(application.financialSummaries || {}).length > 0;
      
    const hasFinancialsProperty = application?.financials && 
      Object.keys(application.financials || {}).length > 0;
    
    // Also check for presence of any document-specific fields that might be used
    const hasDocumentFields = 
      application?.profit_and_loss || 
      application?.balance_sheet || 
      application?.trial_balance || 
      application?.aged_payables || 
      application?.aged_receivables;
    
    // We should only use the completeness percentage if we can verify documents exist
    const hasCompleteness = application?.completeness_percentage === 100 && (
      hasTraditionalFormat || hasObjectFormat || hasFinancialSummaries || 
      hasFinancialsProperty || hasDocumentFields
    );
    
    console.log("[DEBUG] Financial document sources (fallback checks):", {
      hasTraditionalFormat,
      hasObjectFormat,
      hasFinancialSummaries,
      hasFinancialsProperty,
      hasDocumentFields,
      hasCompleteness
    });
    
    // Consider it valid if any of these are true, but don't rely solely on completeness percentage
    return hasTraditionalFormat || 
           hasObjectFormat || 
           hasFinancialSummaries || 
           hasFinancialsProperty || 
           hasDocumentFields || 
           hasCompleteness;
  })();

  // Calculate application completeness
  const calculateCompleteness = () => {
    let completed = 0;
    let total = 0;
    const missing = [];

    if (!application) {
      return { completed: 0, total: 4, percentage: 0, missing: ['Application Data'] };
    }
    
    // Check if any credit score exists
    const hasCreditScore = 
      // Check from the credit score hook (Firestore subcollection)
      (creditScore !== null && creditScore !== undefined) ||
      // Check on businessProfile
      (businessProfile?.credit_info?.credit_score) || 
      // Check on application.business
      (application?.business?.credit_info?.credit_score) ||
      // Check for score property
      (application?.business?.credit_info?.score !== undefined && 
       application?.business?.credit_info?.score !== null) || 
      // Check for direct credit_info on application
      (application?.credit_info?.credit_score || application?.credit_info?.score);
    
    console.log("[DEBUG] Credit score detection:", {
      creditScoreFromHook: creditScore,
      businessProfileScore: businessProfile?.credit_info?.credit_score,
      applicationBusinessScore: application?.business?.credit_info?.credit_score,
      applicationBusinessScoreAlt: application?.business?.credit_info?.score,
      applicationDirectScore: application?.credit_info?.credit_score,
      result: hasCreditScore
    });
    
    // Business check should look at both businessProfile and application.business
    const hasBusinessProfile = businessProfile || application?.business;
    
    // Application details check
    const hasApplicationDetails = application.loan_amount && application.loan_term_months && application.purpose;

    const checks = [
      { name: 'Business profile', value: hasBusinessProfile ? true : false },
      { name: 'Credit score', value: hasCreditScore ? true : false },
      { name: 'Financial documents', value: hasFinancialDocs ? true : false },
      { name: 'Application details', value: hasApplicationDetails ? true : false }
    ];
    
    // Debug output for all checks
    console.log("[DEBUG] Application completeness checks:", checks.map(c => ({
      name: c.name, 
      value: c.value
    })));
    
    const completedChecks = checks.filter(check => check.value).length;
    const missingChecks = checks.filter(check => !check.value).map(check => check.name);
    const totalChecks = checks.length;

    const percentage = Math.round((completedChecks / totalChecks) * 100);
    return { 
      completed: completedChecks, 
      total: totalChecks, 
      percentage, 
      missing: missingChecks 
    };
  };

  // If application already has a completeness percentage from ApplicationDetail,
  // use that instead of recalculating
  const completenessFromApplication = application?.completeness_percentage ? {
    percentage: application.completeness_percentage,
    completed: application.completeness_percentage === 100 ? 4 : Math.round((application.completeness_percentage / 100) * 4),
    total: 4,
    missing: []
  } : null;
  
  // Calculate completeness after all data is loaded
  const calculatedCompleteness = calculateCompleteness();
  
  // Use the higher of the two completeness values
  const completeness = 
    completenessFromApplication && 
    completenessFromApplication.percentage > calculatedCompleteness.percentage 
      ? completenessFromApplication 
      : calculatedCompleteness;
  
  console.log("[DEBUG] Final completeness:", {
    fromApplication: completenessFromApplication,
    calculated: calculatedCompleteness,
    final: completeness
  });
  
  useEffect(() => {
    // Force completeness recalculation when financialDocs change
    if (financialDocs && financialDocs.length > 0) {

    }
  }, [financialDocs]);

  const handleSubmitClick = () => {
    // If the application is incomplete (especially missing financial documents), show modal
    if (completeness.percentage < 100 && !hasFinancialDocs) {
      setShowSubmitModal(true);
    } else {
      // If complete or has financial docs, submit directly
      handleSubmitApplication();
    }
  };

  const handleSubmitApplication = async (forceSubmit: boolean = false) => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    try {
      setIsSubmitting(true);

      
      if (!id) {
        const error = new Error("Application ID is missing");
        setErrorMessage(error.message);
        throw error;
      }
      
      // Prepare business profile data (simplified version for lenders)
      const businessProfileData = businessProfile ? (() => {
        const data = {
          business_name: businessProfile.business_name,
          company_number: businessProfile.company_number,
          industry: businessProfile.industry,
          company_size: businessProfile.company_size || businessProfile.size,
          year_established: businessProfile.year_established,
          website: businessProfile.website,
          address: businessProfile.address,
          contact_email: businessProfile.contact_email,
          contact_phone: businessProfile.contact_phone,
          director_name: businessProfile.director_name,
        };
        
        // Filter out undefined values to avoid Firestore errors
        return Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        );
      })() : null;
      
      // Prepare credit info data
      const creditInfoData = businessProfile?.credit_info || application?.business?.credit_info || null;
      
      // Prepare financial documents data
      let financialDocumentsData = {};
      let documentSummaries = {};
      
      // First check for already processed documents in application
      if (application?.financialDocuments) {
        financialDocumentsData = application.financialDocuments;
      }
      
      if (application?.financialSummaries) {
        documentSummaries = application.financialSummaries;
      }
      
      // If we have fetched financial docs, process them
      if (financialDocs && financialDocs.length > 0) {

        
        // Group documents by type
        financialDocs.forEach(doc => {
          const key = doc.documentType?.toLowerCase()?.includes('profit') ? 'pl'
            : doc.documentType?.toLowerCase()?.includes('balance') && !doc.documentType?.toLowerCase()?.includes('trial') ? 'bs'
            : doc.documentType?.toLowerCase()?.includes('trial') ? 'tb'
            : doc.documentType?.toLowerCase()?.includes('payable') ? 'ap'
            : doc.documentType?.toLowerCase()?.includes('receivable') ? 'ar'
            : null;

          if (key) {
            // Process the data with extra handling for Trial Balance and Balance Sheet
            let processedData = doc.data || {};
            
            // Sometimes the data is a string that needs to be parsed
            if (typeof processedData === 'string') {
              try {
                processedData = JSON.parse(processedData);
              } catch (e) {
                console.error(`Failed to parse ${key} data as JSON:`, e);
              }
            }
            
            // Special handling for Trial Balance
            if (key === 'tb' && (!processedData || Object.keys(processedData).length === 0)) {
              try {
                if (doc.summary && typeof doc.summary === 'string') {
                  const summaryJson = JSON.parse(doc.summary);
                  if (summaryJson.json && Object.keys(summaryJson.json).length > 0) {
                    processedData = summaryJson.json;
                  }
                }
              } catch (e) {
                console.error('Failed to extract Trial Balance data from summary:', e);
              }
            }
            
            financialDocumentsData[key] = processedData;
            documentSummaries[key] = doc.summary || '';
          }
        });
      }
      
      // Comprehensive update data for the application
      const updateData = { 
        status: 'submitted',
        status_updated_at: new Date().toISOString(),
        application_date: application?.application_date || new Date().toISOString(),
        completeness_percentage: 100,
        
        // Include consolidated data (filter out undefined values)
        ...(businessProfileData && { business_profile: businessProfileData }),
        ...(creditInfoData && { credit_info: creditInfoData }),
        financialDocuments: financialDocumentsData,
        financialSummaries: documentSummaries,
        
        // Flag to indicate this application has all data consolidated
        data_consolidated: true,
        consolidated_at: new Date().toISOString()
      };
      

      
      const { data, error } = await updateDocument('applications', id, updateData);
      
      if (error) {
        console.error("Error submitting application:", error);
        setErrorMessage(`Failed to submit application: ${error.message || 'Unknown error'}`);
        throw error;
      }
      
      // Invalidate both the single application query and the applications list query
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      

      toast.success('Application submitted successfully');
      navigate('/applications');
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error(`Failed to submit application: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (!id) {
        const error = new Error("Application ID is missing");
        setErrorMessage(error.message);
        throw error;
      }
      
      const { data, error } = await updateDocument('applications', id, { 
        status: 'draft',
        status_updated_at: new Date().toISOString()
      });
      
      if (error) {
        console.error("Error saving application as draft:", error);
        setErrorMessage(`Failed to save application: ${error.message || 'Unknown error'}`);
        throw error;
      }
      
      // Invalidate the query to refresh data if user navigates back
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      
      toast.success('Application saved as draft');
      navigate('/applications');
    } catch (err) {
      console.error('Error saving application:', err);
      toast.error(`Failed to save application: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-mark application as complete when all items are present
  useEffect(() => {
    const updateApplicationCompleteness = async () => {
      // Only update if application exists and is not already submitted
      if (!application || !id || application.status === 'submitted') return;
      
      // Only update if calculated completeness is 100% but the stored value isn't
      if (completeness.percentage === 100 && application.completeness_percentage !== 100) {

        try {
          await updateDocument('applications', id, {
            completeness_percentage: 100
          });
          toast.success("Application is ready to submit!");
        } catch (err) {
          console.error("Failed to update application completeness:", err);
        }
      }
    };
    
    updateApplicationCompleteness();
  }, [application, completeness.percentage, id]);

  return (
    <>
      {/* Submit Confirmation Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-[#ff8000]" />
              Submit Application Without Financial Documents?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                We notice you haven't uploaded all your financial documents yet. You can still submit your application, but please note:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Lenders may request these documents during their review process</li>
                <li>Having financial documents can strengthen your application</li>
                <li>You can always upload them later if a lender requests them</li>
              </ul>
              <p className="text-sm font-medium text-white">
                Would you like to proceed with submitting your application?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSubmitModal(false);
                handleSubmitApplication(true);
              }}
              disabled={isSubmitting}
              className="bg-[#ff8000] hover:bg-[#e67300] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Yes, Submit Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="w-full py-8 px-6">
          <Button
            variant="ghost"
            className="mb-6 hover:bg-white/60 text-slate-700 hover:text-slate-900 border border-slate-200/50 backdrop-blur-sm"
            onClick={() => navigate('/applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          
          <div className="w-full max-w-none">
            <div className="bg-[#212936] text-white rounded-xl p-8 mb-8 shadow-xl border-b-2 border-[#ff8000]">
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Review Your Application</h1>
              <p className="text-gray-200 text-lg leading-relaxed">
                Review your application details and supporting information before submitting to lenders
              </p>
            </div>
            
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg"></div>
            ) : application ? (
              <>
                {/* Blind Application Notice */}
                <Alert className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/60 shadow-lg backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-[#ff8000]" />
                  <AlertTitle className="text-blue-900 font-semibold">Anonymous Application Process</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    Your application is submitted <strong>anonymously</strong> to protect your privacy. Lenders will only see:
                    <ul className="list-disc ml-6 mt-3 space-y-1.5 text-blue-800">
                      <li>Industry sector and business size</li>
                      <li>Funding amount and purpose</li>
                      <li>Financial strength indicators</li>
                      <li>Years in operation</li>
                    </ul>
                    <div className="mt-4 p-4 bg-blue-100/70 rounded-lg border border-blue-200/50">
                      <strong className="text-blue-900">Your business details will only be revealed after a lender makes an offer and you choose to connect with them.</strong>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Application Strength and Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Application Strength */}
                  <Card className="bg-gradient-to-b from-white to-gray-50 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardHeader className="pb-3 bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center text-lg">
                        <Zap className="h-5 w-5 mr-2 text-[#ff8000]" />
                        <span className="text-white">Application Strength</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Circular Progress Indicator */}
                      <div className="relative p-6 flex flex-col items-center justify-center">
                        <div className="w-40 h-40 relative mb-4">
                          {/* Background Circle */}
                          <div className="absolute inset-0 rounded-full bg-gray-100 border border-gray-200"></div>
                          
                          {/* Progress Circle - Dynamic SVG */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="45" 
                              fill="none" 
                              stroke="#f2f2f2" 
                              strokeWidth="8"
                            />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="45" 
                              fill="none" 
                              stroke={
                                completeness.percentage < 50 ? "#f97316" : 
                                completeness.percentage < 75 ? "#facc15" : 
                                completeness.percentage < 100 ? "#22c55e" : 
                                "#10b981"
                              } 
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 45}`}
                              strokeDashoffset={`${2 * Math.PI * 45 * (1 - completeness.percentage / 100)}`}
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          
                          {/* Percentage in Middle */}
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-4xl font-bold text-[#212936]">
                              {completeness.percentage}%
                            </span>
                            <span className="text-sm font-medium text-gray-500">Strength</span>
                          </div>
                        </div>
                        
                        <div className="text-center w-full">
                          <div className="flex justify-center items-center mb-2">
                            <div className="h-2 w-2 mr-1.5 rounded-full bg-[#ff8000]"></div>
                            <span className="text-slate-700 text-sm font-medium">
                              {completeness.completed} of {completeness.total} items complete
                            </span>
                          </div>
                          
                          {completeness.percentage < 100 && completeness.missing.length > 0 && (
                            <div className="mt-2 px-4">
                              {completeness.missing.map((item, index) => (
                                <div key={index} className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                                  <p className="text-amber-800 text-xs font-medium">{item} missing</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {completeness.percentage === 100 && (
                            <div className="mt-2 px-4">
                              <div className="bg-green-50 border border-green-200/70 rounded-lg p-2 mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                <p className="text-green-800 text-xs font-medium">Application Complete</p>
                              </div>
                            </div>
                          )}
                          
                          {completeness.percentage === 100 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 mx-4">
                              <p className="text-green-800 text-sm font-medium">
                                ✓ Application ready for submission
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Application Summary */}
                  <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl text-white">Application Summary</CardTitle>
                          <CardDescription className="text-gray-200">
                            Application #{formatApplicationNumber(application, id)}
                          </CardDescription>
                        </div>
                        <StatusBadge status={application.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Funding Amount</p>
                          <p className="font-semibold text-slate-900 text-lg">£{application.loan_amount?.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Loan Term</p>
                          <p className="font-semibold text-slate-900 text-lg">{application.loan_term_months} months</p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Purpose</p>
                          <p className="font-medium text-slate-900">{application.purpose}</p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Type</p>
                          <p className="font-medium text-slate-900 capitalize">{application.loan_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <Separator className="bg-slate-200" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500">Personal Guarantee</p>
                          <p className="font-medium text-slate-900">{application.has_personal_guarantee ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Secured Loan</p>
                          <p className="font-medium text-slate-900">{application.is_secured ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Information Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Business Profile Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Building2 className="mr-2 h-5 w-5 text-[#ff8000]" />
                          <span className="text-white">Business Profile</span>
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200 shadow-sm">
                          Private Until Connected
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Your business information - shared only after lender connection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[240px] overflow-y-auto">
                      {businessProfile ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                              <p className="text-sm text-slate-500">Company Name</p>
                              <p className="font-medium text-slate-900">{businessProfile.business_name || 'Not specified'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                                <p className="text-sm text-slate-500">Industry</p>
                                <p className="font-medium text-slate-900 text-sm">{businessProfile.industry_sector || 'Not specified'}</p>
                              </div>
                              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                                <p className="text-sm text-slate-500">Size</p>
                                <p className="font-medium text-slate-900 text-sm">{businessProfile.company_size || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200 shadow-sm">
                            ✓ Ready for sharing when connected
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
                            <p className="font-medium text-orange-800">Business profile incomplete</p>
                            <p className="text-sm text-orange-600 mt-1">Complete your profile to strengthen your application</p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/business/profile')} 
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                          >
                            Complete Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Credit Score Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5 text-[#ff8000]" />
                          <span className="text-white">Credit Assessment</span>
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-800 border-green-200 shadow-sm">
                          Anonymous Score Only
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Credit strength indicator - details shared only when connected
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[240px] overflow-y-auto">
                      {(creditScore !== null && creditScore !== undefined) || 
                       (businessProfile?.credit_info?.credit_score || 
                        application?.business?.credit_info?.credit_score || 
                        application?.business?.credit_info?.score ||
                        application?.credit_info?.credit_score ||
                        application?.credit_info?.score) ? (
                        <div className="text-center py-4">
                          <div className="bg-green-50/80 border border-green-200/70 rounded-lg p-4 mb-4">
                            <div className="text-4xl font-bold text-green-700 mb-2">
                              {creditScore || 
                               businessProfile?.credit_info?.credit_score || 
                               application?.business?.credit_info?.credit_score || 
                               application?.business?.credit_info?.score ||
                               application?.credit_info?.credit_score ||
                               application?.credit_info?.score || 
                               "✓"}
                            </div>
                            <p className="text-sm text-green-600">Business Credit Score</p>
                            {(businessProfile?.credit_info?.risk || 
                              application?.business?.credit_info?.risk ||
                              application?.business?.credit_info?.risk_level ||
                              application?.credit_info?.risk ||
                              application?.credit_info?.risk_level) && (
                              <p className="text-sm font-medium text-green-700 mt-1">
                                {businessProfile?.credit_info?.risk || 
                                 application?.business?.credit_info?.risk ||
                                 application?.business?.credit_info?.risk_level ||
                                 application?.credit_info?.risk ||
                                 application?.credit_info?.risk_level}
                              </p>
                            )}
                          </div>
                          <Badge variant="default" className="bg-green-600 text-white shadow-sm">Score Available</Badge>
                        </div>
                      ) : isLoadingCreditScore ? (
                        <div className="text-center py-6">
                          <div className="bg-blue-50/80 border border-blue-200/70 rounded-lg p-4 mb-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                            <p className="font-medium text-blue-800">Checking credit score...</p>
                            <p className="text-sm text-blue-600 mt-1">Please wait while we retrieve your information</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
                            <p className="font-medium text-orange-800">Credit score not available</p>
                            <p className="text-sm text-orange-600 mt-1">We'll use other factors to evaluate your application</p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/credit-score')} 
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                          >
                            Check Credit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-[#ff8000]" />
                          <span className="text-white">Supporting Documents</span>
                        </div>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-800 border-indigo-200 shadow-sm">
                          Verification Only
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Document verification status - full documents shared only when connected
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[240px] overflow-y-auto">
                      <div className="space-y-2 mb-4">
                        {DOCUMENT_TYPES.map(docType => {
                          const hasDocumentInFinancialDocs = financialDocs?.some((doc: FinancialDocument) => 
                            (doc.documentType?.toLowerCase().includes(docType.label.toLowerCase()) || 
                             doc.documentName?.toLowerCase().includes(docType.key) || 
                             doc.documentName?.toLowerCase().includes(docType.label.toLowerCase()))
                          );
                          
                          // Also check in the application.financialDocuments object
                          const hasDocumentInFinancialDocuments = 
                            application?.financialDocuments?.[docType.key] && 
                            Object.keys(application.financialDocuments[docType.key]).length > 0;
                          
                          // Also check in traditional financial_documents array
                          const hasDocumentInTraditionalFormat = application?.financial_documents?.some(doc => 
                            (doc.type?.toLowerCase().includes(docType.label.toLowerCase()) || 
                             doc.type?.toLowerCase().includes(docType.key))
                          );
                          
                          const hasDocument = hasDocumentInFinancialDocs || 
                                            hasDocumentInFinancialDocuments || 
                                            hasDocumentInTraditionalFormat;
                          
                          return (
                            <div key={docType.key} className="flex items-center justify-between bg-slate-50/70 rounded-lg p-1.5 border border-slate-100">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-3 w-3 text-slate-500" />
                                <span className="text-xs font-medium text-slate-900">{docType.label}</span>
                              </div>
                              <Badge 
                                variant={hasDocument ? "default" : "secondary"} 
                                className={
                                  hasDocument 
                                    ? "bg-green-600 text-white shadow-sm text-xs h-5" 
                                    : "bg-slate-200 text-slate-600 text-xs h-5"
                                }
                              >
                                {hasDocument ? "✓" : "—"}
                              </Badge>
                            </div>
                          );
                        })}

                      </div>
                      {(!hasFinancialDocs) && (
                        <div className="text-center">
                          <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-orange-800">No documents uploaded</p>
                            <p className="text-xs text-orange-600 mt-1">Upload financial documents to strengthen your application</p>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/business/documents')} 
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-colors text-sm"
                          >
                            <Upload className="mr-1 h-3 w-3" />
                            Upload Documents
                          </Button>
                        </div>
                      )}
                      {(hasFinancialDocs) && (
                        <div className="text-center bg-green-50/80 border border-green-200/70 rounded-lg p-3 mt-2">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <p className="text-sm font-medium text-green-800">
                              Financial documents ready
                            </p>
                          </div>
                          <p className="text-xs text-green-600">Documents will be shared when matched with lenders</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              
              {/* Privacy and Data Protection */}
              <Card className="mb-8 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-[#ff8000]" />
                    <span className="text-white">Privacy & Anonymous Application Process</span>
                  </CardTitle>
                  <CardDescription className="text-gray-200">
                    How we protect your business information during the application process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/70 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-[#ff8000]" />
                        What Lenders See Initially
                      </h3>
                      <p className="text-xs text-green-700 mb-2 font-medium">(Anonymous Information)</p>
                      <ul className="text-sm text-green-800 space-y-1.5">
                        <li>• Industry sector and business size category</li>
                        <li>• Funding amount and general purpose</li>
                        <li>• Financial strength indicators and ratios</li>
                        <li>• Years in operation and credit score band</li>
                        <li>• Document verification status</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        What Remains Private
                      </h3>
                      <p className="text-xs text-blue-700 mb-2 font-medium">(Until You Connect)</p>
                      <ul className="text-sm text-blue-800 space-y-1.5">
                        <li>• Your business name and exact address</li>
                        <li>• Contact details and key personnel names</li>
                        <li>• Detailed financial documents and statements</li>
                        <li>• Bank account information and transaction data</li>
                        <li>• Customer and supplier information</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-lg p-4">
                      <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4 rotate-180" />
                        When Details Are Shared
                      </h3>
                      <p className="text-xs text-amber-700 mb-2 font-medium">(Your Control)</p>
                      <div className="text-sm text-amber-800 space-y-1.5">
                        <p><strong>Only after:</strong></p>
                        <p>1. Lender makes an offer</p>
                        <p>2. You review their terms</p>
                        <p>3. You choose to connect</p>
                        <div className="mt-3 p-2 bg-amber-100/70 rounded border border-amber-200/50">
                          <p className="text-xs text-amber-900 font-medium">
                            You remain in complete control
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <div className="flex gap-4 justify-between mb-8">
                <Button
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
                <Button
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#ff8000] hover:bg-[#e67300] disabled:bg-slate-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Anonymous Application...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Submit Anonymous Application
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Alert variant="destructive" className="bg-red-50/90 backdrop-blur-sm border-red-200/60 shadow-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-red-900 font-semibold">Application not found</AlertTitle>
                <AlertDescription className="text-red-800">
                  {errorMessage || "The application you're looking for doesn't exist or you don't have permission to view it."}
                  <br />
                  <span className="text-xs mt-2 block text-red-600">Debug info: ID parameter: {id || 'missing'}</span>
                </AlertDescription>
              </Alert>
            </div>
          )}
          </div>
        </div>
      </div>
    </PageLayout>
    </>
  );
};

export default ApplicationReview;
