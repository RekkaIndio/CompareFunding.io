import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, expressInterestInApplication } from '@/firebase';
import { consolidateBusinessData, normalizeCreditScoreData } from '@/services';
import { collection, query, orderBy, getDocs, getFirestore, doc, getDoc, where, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  BadgePoundSterling,
  TrendingUp,
  Calendar,
  Users,
  BarChart4,
  FileText,
  AlertTriangle,
  Building,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  CheckCircle,
  ThumbsUp,
  Star,
  Download,
  Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FinancialsTable from '@/pages/Business/Documents/FinancialsTable';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const db = getFirestore();

  // Add lender profile query
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

  // Fetch application and associated business data first
  const { data: applicationData, isLoading, error } = useQuery({
    queryKey: ['businessDetail', id],
    queryFn: async () => {
      if (!id || !user) throw new Error('Invalid request');

      try {
        // Try to get application details first
        const { data: application, error: appError } = await getDocument('applications', id);
        
        // If we found an application, get the business details through the application
        if (!appError && application) {
          console.log('[DEBUG Business ID] Found application:', application);
          console.log('[DEBUG Business ID] Application business_id:', application.business_id);
          console.log('[DEBUG Business ID] Application user_id:', application.user_id);
          
          // If no business_id, fall back to using the application owner's ID
          const businessId = application.business_id || application.user_id;
          if (!businessId) {
            console.error('[DEBUG Business ID] Application missing both business_id and user_id');
            throw new Error('Could not determine business reference');
          }

          console.log('[DEBUG Business ID] Trying to fetch business profile with ID:', businessId);

          // Get business profile using business_id or user_id from the application
          const { data: business, error: businessError } = await getDocument(
            'businesses',
            businessId
          );
          
          if (businessError) {
            console.error('[DEBUG Business ID] Error fetching business profile:', businessError);
            // If business profile doesn't exist, create a basic business object
            console.warn('[DEBUG Business ID] Business profile not found, using basic application data');
            return {
              application,
              business: {
                business_name: `Application #${application.application_number || id?.substring(0, 8)}`,
                industry_sector: 'Not specified',
                description: 'Business profile not available'
              },
              accounting: null,
              creditScore: null
            };
          }

          if (!business) {
            console.warn('Business profile is null, using basic application data');
            return {
              application,
              business: {
                business_name: `Application #${application.application_number || id?.substring(0, 8)}`,
                industry_sector: 'Not specified',
                description: 'Business profile not available'
              },
              accounting: null,
              creditScore: null
            };
          }

          // Get accounting data if connected
          const { data: accounting } = await getDocument(
            'accounting_integrations',
            businessId
          );

          // Get credit score data - UPDATED TO CHECK BOTH LOCATIONS
          let creditScore = null;
          
          // First check businesses (current location)
          if (business && business.credit_info) {
            console.log('[DEBUG] Found credit score in businesses:', business.credit_info);
            creditScore = business.credit_info;
          } else {
            // If not found, try the businesses collection
            try {
              const businessDoc = await getDoc(doc(db, "businesses", businessId));
              if (businessDoc.exists() && businessDoc.data().credit_info) {
                console.log('[DEBUG] Found credit score in businesses collection:', businessDoc.data().credit_info);
                creditScore = businessDoc.data().credit_info;
              }
            } catch (err) {
              console.error('[DEBUG] Error fetching credit score from businesses collection:', err);
            }
            
            // If still not found, try dedicated credit_scores collection as a fallback
            if (!creditScore) {
              const { data: creditScoreData } = await getDocument(
                'credit_scores',
                businessId
              );
              if (creditScoreData) {
                console.log('[DEBUG] Found credit score in credit_scores collection:', creditScoreData);
                creditScore = creditScoreData;
              }
            }
          }

          // Normalize credit score data before returning
          const normalizedCreditScore = normalizeCreditScoreData(creditScore);
          
          return {
            application,
            business,
            accounting,
            creditScore: normalizedCreditScore
          };
        } 
        
        // If no application found, try direct business profile lookup
        console.log('No application found, trying direct business lookup with ID:', id);
        const { data: business, error: businessError } = await getDocument('businesses', id);
        
        if (businessError) {
          console.error('Error fetching business profile:', businessError);
          throw new Error(`Could not find business profile: ${businessError.message || 'Unknown error'}`);
        }
        
        if (!business) {
          console.error('Business profile not found for ID:', id);
          throw new Error('Business profile not found');
        }

        // Get accounting data if available
        const { data: accounting } = await getDocument(
          'accounting_integrations',
          id
        );

        // Get credit score data if available
        const { data: creditScore } = await getDocument(
          'credit_scores',
          id
        );

        return {
          business,
          application: null,
          accounting,
          creditScore
        };
      } catch (err) {
        console.error('Error in businessDetail query:', err);
        throw err;
      }
    },
    enabled: !!id && !!user?.uid,
    retry: 1
  });

  // Fetch financial data from the businesses/{businessId}/financials collection
  const { data: financialData } = useQuery({
    queryKey: ['businessFinancials', id, applicationData?.application?.business_id, applicationData?.application?.user_id],
    queryFn: async () => {
      if (!id || !applicationData) return {};

      try {
        // Get business ID from various possible locations
        let businessId = null;
        
        // Check if it's directly in the application
        if (applicationData.application?.business_id) {
          businessId = applicationData.application.business_id;
          console.log('[DEBUG] Found business_id in application:', businessId);
        }
        
        // If not in application, check if it's in the business object
        else if (applicationData.business?.id) {
          businessId = applicationData.business.id;
          console.log('[DEBUG] Found business ID in business object:', businessId);
        }
        
        // Fall back to user_id if no business_id is available
        else if (applicationData.application?.user_id) {
          // In this case, we need to first get the businessId from the user document
          const userRef = doc(db, "users", applicationData.application.user_id);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().businessId) {
            businessId = userSnap.data().businessId;
            console.log('[DEBUG] Found businessId from user document:', businessId);
          } else {
            // Final fallback to the user_id itself
            businessId = applicationData.application.user_id;
            console.log('[DEBUG] Falling back to user_id as business ID:', businessId);
          }
        }
        
        // Last resort fallback to the application ID
        if (!businessId) {
          businessId = id;
          console.log('[DEBUG] Using application ID as fallback business ID:', businessId);
        }
        
        console.log('[DEBUG] Using business ID for financials:', businessId);
        
        let financials = {};
        
        // Try direct approach first - check if the business doc itself contains financial data
        try {
          const businessDocRef = doc(db, "businesses", businessId);
          const businessDoc = await getDoc(businessDocRef);
          
          if (businessDoc.exists()) {
            console.log('[DEBUG] Found business document:', businessId);
            // If the business document has direct financial data fields
            const data = businessDoc.data();
            if (data.financials || data.financial_data) {
              console.log('[DEBUG] Found embedded financial data in business document');
              financials = data.financials || data.financial_data || {};
            }
          }
        } catch (e) {
          console.error('[DEBUG] Error fetching business document:', e);
        }
        
        // If we didn't find embedded financials, try the subcollection
        if (Object.keys(financials).length === 0) {
          console.log('[DEBUG] Trying financials subcollection');
          const financialsCollection = collection(db, "businesses", businessId, "financials");
          const querySnapshot = await getDocs(query(financialsCollection, orderBy("createdAt", "desc")));
          
          console.log(`[DEBUG] Financial documents found: ${querySnapshot.size} for business ID: ${businessId}`);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('[DEBUG] Financial document:', doc.id, data);
            
            let docKey = "";
            
            // Map document types to keys matching the tabs
            if (data.documentType?.toLowerCase().includes("profit") || 
                data.documentType?.toLowerCase().includes("loss") || 
                data.documentType === "pl") {
              docKey = "profitLoss";
            } else if (data.documentType?.toLowerCase().includes("balance") || 
                      data.documentType === "bs") {
              docKey = "balanceSheet";
            } else if (data.documentType?.toLowerCase().includes("trial") || 
                      data.documentType === "tb") {
              docKey = "trialBalance";
            } else if (data.documentType?.toLowerCase().includes("payable") || 
                      data.documentType === "ap") {
              docKey = "agedPayables";
            } else if (data.documentType?.toLowerCase().includes("receivable") || 
                      data.documentType === "ar") {
              docKey = "agedReceivables";
            }
            
            if (docKey) {
              console.log(`[DEBUG] Mapping document type '${data.documentType}' to tab key: ${docKey}`);
              financials[docKey] = {
                id: doc.id,
                ...data,
                // Ensure we have the data field, which might be in different places
                data: data.data || data.financialData || data.extractedData || data.json || {}
              };
            }
          });
        }
        
        // Also check the business_financials collection as a fallback
        if (Object.keys(financials).length === 0) {
          console.log('[DEBUG] Trying business_financials collection');
          try {
            const altFinancialsQuery = query(
              collection(db, "business_financials"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const altQuerySnapshot = await getDocs(altFinancialsQuery);
            console.log(`[DEBUG] Found ${altQuerySnapshot.size} documents in business_financials collection`);
            
            // Process documents if found
            if (!altQuerySnapshot.empty) {
              altQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                // Similar processing to above...
                // Map document types to keys matching the tabs
                let docKey = "";
                if (data.documentType?.toLowerCase().includes("profit") || 
                    data.documentType?.toLowerCase().includes("loss") || 
                    data.documentType === "pl") {
                  docKey = "profitLoss";
                } else if (data.documentType?.toLowerCase().includes("balance") || 
                          data.documentType === "bs") {
                  docKey = "balanceSheet";
                } else if (data.documentType?.toLowerCase().includes("trial") || 
                          data.documentType === "tb") {
                  docKey = "trialBalance";
                } else if (data.documentType?.toLowerCase().includes("payable") || 
                          data.documentType === "ap") {
                  docKey = "agedPayables";
                } else if (data.documentType?.toLowerCase().includes("receivable") || 
                          data.documentType === "ar") {
                  docKey = "agedReceivables";
                }
                
                if (docKey) {
                  financials[docKey] = {
                    id: doc.id,
                    ...data,
                    data: data.data || data.financialData || data.extractedData || data.json || {}
                  };
                }
              });
            }
          } catch (e) {
            console.error('[DEBUG] Error querying business_financials collection:', e);
          }
        }
        
        console.log('[DEBUG] Final financials object keys:', Object.keys(financials));
        
        // If we still have no data, check the financial_documents collection
        if (Object.keys(financials).length === 0) {
          try {
            console.log('[DEBUG] Trying financial_documents collection');
            const financialDocsQuery = query(
              collection(db, "financial_documents"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const docsSnapshot = await getDocs(financialDocsQuery);
            console.log(`[DEBUG] Found ${docsSnapshot.size} documents in financial_documents collection`);
            
            // Process if found
            if (!docsSnapshot.empty) {
              // Similar processing as above
            }
          } catch (e) {
            console.error('[DEBUG] Error querying financial_documents collection:', e);
          }
        }

        // Add a direct document check function to examine what's in the financials collection
        const checkSpecificFinancialDocument = async (businessId: string) => {
          if (!businessId) return null;
          
          try {
            // Get a reference to the financials subcollection
            const financialsCollection = collection(db, "businesses", businessId, "financials");
            const financialsSnapshot = await getDocs(financialsCollection);
            
            console.log(`[DEBUG] Found ${financialsSnapshot.size} documents in financials collection`);
            
            // Log each document's structure
            financialsSnapshot.forEach(doc => {
              const data = doc.data();
              console.log(`[DEBUG] Document ID: ${doc.id}`);
              console.log(`[DEBUG] Document Data:`, data);
              
              // Check if document has nested data
              if (data.data) {
                console.log(`[DEBUG] Document has nested data field:`, typeof data.data);
                if (typeof data.data === 'string') {
                  try {
                    // Try to parse if it's stringified JSON
                    const parsedData = JSON.parse(data.data);
                    console.log(`[DEBUG] Parsed data:`, parsedData);
                  } catch (e) {
                    console.log(`[DEBUG] Could not parse data as JSON:`, e);
                  }
                }
              }
            });
            
            return financialsSnapshot.size > 0;
          } catch (e) {
            console.error(`[DEBUG] Error checking financial documents:`, e);
            return null;
          }
        };

        return financials;
      } catch (error) {
        console.error("[DEBUG] Error fetching financial data:", error);
        return {};
      }
    },
    enabled: !!id && !!applicationData,
    retry: 1,
  });

  // Admin state for migration status
  const [migrationStatus, setMigrationStatus] = useState({
    isRunning: false,
    results: null,
    error: null
  });

  // Handle data migration
  const handleDataMigration = async () => {
    if (!id) return;
    
    setMigrationStatus({ isRunning: true, results: null, error: null });
    
    try {
      // Get the correct business ID from applicationData
      const businessId = 
        applicationData?.business?.id || 
        applicationData?.application?.business_id || 
        applicationData?.application?.user_id || 
        id;
      
      toast.info(`Starting data migration for business ${businessId}...`);
      
      // Use our new consolidated migration service
      const results = await consolidateBusinessData(businessId);
      
      setMigrationStatus({ 
        isRunning: false, 
        results: results, 
        error: null 
      });
      
      if (results.success) {
        toast.success(`Data migration complete. ${results.dataMigrated?.length || 0} items migrated.`);
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['businessDetail', id] });
        queryClient.invalidateQueries({ queryKey: ['businessFinancials'] });
      } else {
        toast.error(`Migration issue: ${results.message}`);
      }
    } catch (error) {
      console.error('[ADMIN] Error in data migration:', error);
      setMigrationStatus({ 
        isRunning: false, 
        results: null, 
        error: error.message 
      });
      toast.error(`Migration error: ${error.message}`);
    }
  };

  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      const { data, error } = await expressInterestInApplication(
        id, 
        user.uid,
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
    onError: (error) => {
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

  // Update isAlreadyMatched function to use correct data structure
  const isAlreadyMatched = () => {
    if (!applicationData?.application) return false;
    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);
    const hasExpressedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && (l.status === 'accepted' || l.status === 'pending')
    );
    return isInMatchedLenders || hasExpressedInterest;
  };

  // Check if lender has expressed interest or made an offer (can see business details)
  const canSeeBusinessDetails = () => {
    if (!applicationData?.application) {
      console.log('[DEBUG Access] No application data available, cannot see business details');
      return false;
    }
    
    // Check if lender has expressed interest (any status except declined/rejected)
    const hasExpressedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status !== 'rejected' && l.status !== 'declined'
    );
    
    // Check if lender has made an offer
    const hasMadeOffer = applicationData.application.offers?.some(o => o.lender_id === user?.uid);
    
    // Check if lender is in matched_lenders array
    const isMatched = applicationData.application.matched_lenders?.includes(user?.uid);
    
    console.log('[DEBUG Access] Access control check:', { 
      userId: user?.uid, 
      hasExpressedInterest,
      hasMadeOffer,
      isMatched,
      interestedLenders: applicationData.application.interested_lenders || [],
      offers: applicationData.application.offers || [],
      matchedLenders: applicationData.application.matched_lenders || []
    });
    
    return hasExpressedInterest || hasMadeOffer || isMatched;
  };

  // Add a function to check if lender is matched
  const isLenderMatched = () => {
    if (!applicationData?.application) return false;
    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);
    const isAcceptedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'accepted'
    );
    return isInMatchedLenders || isAcceptedInterest;
  };

  // Add function to get display name based on match status
  const getDisplayName = () => {
    if (!applicationData?.application) return 'Application Not Found';
    
    // Only show business name if lender can see business details
    if (canSeeBusinessDetails() && applicationData?.business?.business_name) {
      return applicationData.business.business_name;
    }
    
    return `Application #${applicationData.application.application_number || id?.substring(0, 8)}`;
  };

  // Update document title based on match status
  useEffect(() => {
    if (applicationData?.application) {
      document.title = `${getDisplayName()} | FundHub`;
    }
  }, [applicationData]);

  // Debug logs for visibility checks and financial data
  useEffect(() => {
    if (applicationData) {
      console.log('Can see business details:', canSeeBusinessDetails());
      console.log('Business data available:', !!applicationData?.business);
      console.log('Application data available:', !!applicationData?.application);
    }
    
    console.log('Financial data available:', !!financialData);
    if (financialData) {
      console.log('Available financial documents:', Object.keys(financialData).join(', '));
    }
  }, [applicationData, financialData]);

  // Debug output for application data
  useEffect(() => {
    if (applicationData) {
      console.log('[DEBUG] Application data loaded:', applicationData);
      
      // Log the business ID we're using
      const businessId = applicationData.application?.business_id || 
                       applicationData.business?.id || 
                       applicationData.application?.user_id;
                       
      console.log('[DEBUG] Business ID for financials:', businessId);
      
      // Log financial data state
      console.log('[DEBUG] Financial data state:', financialData);
    }
  }, [applicationData, financialData]);

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
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'An unexpected error occurred while loading the business profile.'}
            </AlertDescription>
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
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>
              The business profile you're looking for doesn't exist or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  const { application, business, accounting, creditScore } = applicationData;

  // Calculate credit score visualization
  const getCreditScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-500';
    if (score >= 670) return 'text-blue-500';
    if (score >= 580) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFinancialMetric = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Update getActionButton to show different states
  const getActionButton = () => {
    if (!applicationData?.application) return null;

    const interestStatus = applicationData.application.interested_lenders?.find(
      l => l.lender_id === user?.uid
    )?.status;

    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);

    if (interestStatus === 'accepted' || isInMatchedLenders) {
      return (
        <Button className="bg-[#212936] hover:bg-[#212936]/90 text-white shadow-lg">
          <FileText className="mr-2 h-4 w-4" />
          Make Offer
        </Button>
      );
    }
    
    if (interestStatus === 'pending') {
      return (
        <Button variant="outline" disabled className="border-blue-200 bg-blue-50 text-blue-700">
          <ThumbsUp className="mr-2 h-4 w-4" />
          Interest Expressed
        </Button>
      );
    }

    if (interestStatus === 'declined') {
      return (
        <Button variant="outline" disabled className="border-red-200 bg-red-50 text-red-700">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Interest Declined
        </Button>
      );
    }

    return (
      <Button onClick={handleExpressInterest} className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg">
        <ThumbsUp className="mr-2 h-4 w-4" />
        Express Interest
      </Button>
    );
  };

  // Return the business detail view
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

          {/* Header Section */}
          <div className="bg-[#212936] text-white rounded-xl p-6 sm:p-8 mb-8 shadow-xl border-b-2 border-[#ff8000] flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-white">{getDisplayName()}</h1>
              <p className="text-gray-200 text-base sm:text-lg">
                {applicationData?.business?.industry_sector || 'Business Details'} | Application #{application?.application_number || id?.substring(0, 8)}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              {getActionButton()}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Business Overview Card */}
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Business Overview</CardTitle>
                    <div className="flex items-center">
                      {applicationData.business?.rating && (
                        <div className="flex items-center bg-[#ff8000]/20 text-[#ff8000] px-3 py-1 rounded-full text-sm font-medium mr-2">
                          <Star className="h-4 w-4 mr-1" />
                          <span>{applicationData.business.rating}/5</span>
                        </div>
                      )}
                      {getActionButton()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {canSeeBusinessDetails() ? (
                    // Show full business details when lender has expressed interest or made an offer
                    <>
                      <div>
                        <h3 className="font-medium mb-2">About</h3>
                        <p className="text-sm text-muted-foreground">
                          {applicationData?.business?.description || 'No business description provided.'}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Business Name</div>
                          <div className="font-medium flex items-center">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            {applicationData?.business?.business_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Website</div>
                          <div className="font-medium flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                            {applicationData?.business?.website || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Location</div>
                          <div className="font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            {applicationData?.business?.city}, {applicationData?.business?.country}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Founded</div>
                          <div className="font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {applicationData?.business?.incorporation_date && 
                              new Date(applicationData.business.incorporation_date).getFullYear()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Show limited info for non-matched lenders
                    <Alert className="bg-[#212936]/5 border border-[#212936]/20">
                      <Shield className="h-4 w-4 text-[#ff8000]" />
                      <AlertTitle className="text-[#212936]">Limited Information Available</AlertTitle>
                      <AlertDescription>
                        Express interest in this application to view the complete business profile including financial data and comprehensive business information.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Always show application details */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-inner">
                    <h3 className="font-medium mb-3 flex items-center text-[#212936]">
                      <BadgePoundSterling className="h-4 w-4 mr-2 text-[#ff8000]" />
                      Funding Request
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Amount Requested</div>
                        <div className="text-xl font-bold text-[#212936]">
                          {getFinancialMetric(application.loan_amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Term Length</div>
                        <div className="text-xl font-bold text-[#212936]">
                          {application.loan_term_months} months
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Purpose:</div>
                      <div className="font-medium capitalize">{application.purpose_category}</div>

                      <div className="text-muted-foreground">Security Offered:</div>
                      <div className="font-medium">{application.is_secured ? 'Yes' : 'No'}</div>

                      <div className="text-muted-foreground">Personal Guarantee:</div>
                      <div className="font-medium">{application.has_personal_guarantee ? 'Yes' : 'No'}</div>

                      <div className="text-muted-foreground">Applied On:</div>
                      <div className="font-medium">
                        {application.created_at && new Date(application.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Data Card with Tabs - Always visible */}
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
                  <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white">Financial Data</CardTitle>
                        <CardDescription className="text-gray-200">
                          Anonymous financial metrics extracted from business records
                        </CardDescription>
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-slate-300 text-slate-100 hover:bg-[#212936]/80"
                          onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['businessFinancials'] });
                            toast.success('Refreshing financial data...');
                          }}
                        >
                          Refresh Data
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Alert className="rounded-none border-x-0 border-t-0 bg-blue-50 text-blue-800 border-blue-100">
                      <AlertDescription className="text-xs">
                        These are anonymous financial metrics. Express interest to see full business details and company information.
                      </AlertDescription>
                    </Alert>
                    <Tabs defaultValue="profitLoss" className="w-full">
                      <TabsList className="grid grid-cols-5 w-full rounded-none border-b bg-slate-50">
                        <TabsTrigger value="profitLoss" className="text-xs data-[state=active]:bg-[#212936] data-[state=active]:text-white">
                          P&L
                        </TabsTrigger>
                        <TabsTrigger value="balanceSheet" className="text-xs data-[state=active]:bg-[#212936] data-[state=active]:text-white">
                          Balance Sheet
                        </TabsTrigger>
                        <TabsTrigger value="trialBalance" className="text-xs data-[state=active]:bg-[#212936] data-[state=active]:text-white">
                          Trial Balance
                        </TabsTrigger>
                        <TabsTrigger value="agedPayables" className="text-xs data-[state=active]:bg-[#212936] data-[state=active]:text-white">
                          Aged Payables
                        </TabsTrigger>
                        <TabsTrigger value="agedReceivables" className="text-xs data-[state=active]:bg-[#212936] data-[state=active]:text-white">
                          Aged Receivables
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Profit & Loss Tab */}
                      <TabsContent value="profitLoss" className="p-6 m-0">
                        {financialData?.profitLoss ? (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-[#212936] flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                                Profit & Loss
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Last updated: {new Date(financialData.profitLoss.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {financialData.profitLoss.summary && (
                              <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
                                <p className="text-sm text-slate-700">{financialData.profitLoss.summary}</p>
                              </div>
                            )}
                            
                            <FinancialsTable 
                              data={financialData.profitLoss.data}
                              summary={financialData.profitLoss.summary}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No Profit & Loss Data</h3>
                            <p className="text-sm text-slate-500">This business hasn't uploaded a Profit & Loss statement yet.</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Balance Sheet Tab */}
                      <TabsContent value="balanceSheet" className="p-6 m-0">
                        {financialData?.balanceSheet ? (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-[#212936] flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-[#ff8000]" />
                                Balance Sheet
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Last updated: {new Date(financialData.balanceSheet.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {financialData.balanceSheet.summary && (
                              <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
                                <p className="text-sm text-slate-700">{financialData.balanceSheet.summary}</p>
                              </div>
                            )}
                            
                            <FinancialsTable 
                              data={financialData.balanceSheet.data}
                              summary={financialData.balanceSheet.summary}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No Balance Sheet Data</h3>
                            <p className="text-sm text-slate-500">This business hasn't uploaded a Balance Sheet yet.</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Trial Balance Tab */}
                      <TabsContent value="trialBalance" className="p-6 m-0">
                        {financialData?.trialBalance ? (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-[#212936] flex items-center">
                                <BarChart4 className="h-4 w-4 mr-2 text-[#ff8000]" />
                                Trial Balance
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Last updated: {new Date(financialData.trialBalance.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                                <strong>Debug:</strong> Trial Balance data type: {typeof financialData.trialBalance.data}. 
                                Keys: {typeof financialData.trialBalance.data === 'object' ? 
                                  Object.keys(financialData.trialBalance.data || {}).join(', ') : 'Not an object'}
                              </div>
                            )}
                            
                            <FinancialsTable 
                              data={financialData.trialBalance.data || {}}
                              summary={financialData.trialBalance.summary}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BarChart4 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No Trial Balance Data</h3>
                            <p className="text-sm text-slate-500">This business hasn't uploaded a Trial Balance yet.</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Aged Payables Tab */}
                      <TabsContent value="agedPayables" className="p-6 m-0">
                        {financialData?.agedPayables ? (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-[#212936] flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-[#ff8000]" />
                                Aged Payables
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Last updated: {new Date(financialData.agedPayables.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                                <strong>Debug:</strong> Aged Payables data type: {typeof financialData.agedPayables.data}. 
                                Keys: {typeof financialData.agedPayables.data === 'object' ? 
                                  Object.keys(financialData.agedPayables.data || {}).join(', ') : 'Not an object'}
                              </div>
                            )}
                            
                            <FinancialsTable 
                              data={financialData.agedPayables.data || {}}
                              summary={financialData.agedPayables.summary}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Payables Data</h3>
                            <p className="text-sm text-slate-500">This business hasn't uploaded Aged Payables data yet.</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Aged Receivables Tab */}
                      <TabsContent value="agedReceivables" className="p-6 m-0">
                        {financialData?.agedReceivables ? (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-[#212936] flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                                Aged Receivables
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Last updated: {new Date(financialData.agedReceivables.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            
                            {process.env.NODE_ENV === 'development' && (
                              <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                                <strong>Debug:</strong> Aged Receivables data type: {typeof financialData.agedReceivables.data}. 
                                Keys: {typeof financialData.agedReceivables.data === 'object' ? 
                                  Object.keys(financialData.agedReceivables.data || {}).join(', ') : 'Not an object'}
                              </div>
                            )}
                            
                            <FinancialsTable 
                              data={financialData.agedReceivables.data || {}}
                              summary={financialData.agedReceivables.summary}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <TrendingUp className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Receivables Data</h3>
                            <p className="text-sm text-slate-500">This business hasn't uploaded Aged Receivables data yet.</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>                  {/* Financial Tabs Debug (only in development) */}
                  {process.env.NODE_ENV === 'development' && canSeeBusinessDetails() && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
                      <div className="mt-2 text-xs">
                        <p className="mb-1"><strong>Keys in financialData:</strong> {Object.keys(financialData || {}).join(', ') || 'None'}</p>
                        
                        {/* Check available financial data */}
                        <p className="mb-1"><strong>Has profitLoss:</strong> {financialData?.profitLoss ? 'Yes' : 'No'}</p>
                        <p className="mb-1"><strong>Has balanceSheet:</strong> {financialData?.balanceSheet ? 'Yes' : 'No'}</p>
                        <p className="mb-1"><strong>Has trialBalance:</strong> {financialData?.trialBalance ? 'Yes' : 'No'}</p>
                        <p className="mb-1"><strong>Has agedPayables:</strong> {financialData?.agedPayables ? 'Yes' : 'No'}</p>
                        <p className="mb-1"><strong>Has agedReceivables:</strong> {financialData?.agedReceivables ? 'Yes' : 'No'}</p>
                        
                        {/* Debug structure of each document */}
                        {financialData?.profitLoss && (
                          <div className="mt-2">
                            <p><strong>Profit & Loss structure:</strong></p>
                            <ul className="list-disc ml-4">
                              <li>Keys: {Object.keys(financialData.profitLoss).join(', ')}</li>
                              <li>Has data: {financialData.profitLoss.data ? 'Yes' : 'No'}</li>
                              {financialData.profitLoss.data && (
                                <li>Data type: {typeof financialData.profitLoss.data}</li>
                              )}
                              {financialData.profitLoss.data && typeof financialData.profitLoss.data === 'object' && (
                                <li>Data keys: {Object.keys(financialData.profitLoss.data).join(', ')}</li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {/* IDs used for lookups */}
                        <div className="mt-2 p-2 bg-white rounded">
                          <p><strong>Business ID used:</strong> {applicationData.application?.business_id || applicationData.business?.id || 'Not available'}</p>
                          <p><strong>User ID:</strong> {applicationData.application?.user_id || 'Not available'}</p>
                          <p><strong>Application ID:</strong> {id || 'Not available'}</p>
                        </div>
                      </div>
                      
                      {/* Button to force reload financial data */}
                      <button 
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['businessFinancials'] })}
                        className="mt-4 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Reload Financial Data
                      </button>
                    </div>
                  )}
                  </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Credit Score Card */}
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
                  <CardTitle className="text-white">Credit Score</CardTitle>
                  <CardDescription className="text-gray-200">
                    Business creditworthiness assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-4 px-6">
                  {applicationData.creditScore?.score ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <svg className="w-40 h-40">
                          <circle
                            className="text-gray-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="62"
                            cx="80"
                            cy="80"
                          />
                          <circle
                            className={
                              applicationData.creditScore.score >= 800 ? 'text-green-500' :
                              applicationData.creditScore.score >= 670 ? 'text-blue-500' :
                              applicationData.creditScore.score >= 580 ? 'text-yellow-500' : 'text-red-500'
                            }
                            strokeWidth="8"
                            strokeDasharray={`${(applicationData.creditScore.score / 1000) * 390} 390`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="62"
                            cx="80"
                            cy="80"
                            transform="rotate(-90 80 80)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl font-bold">{applicationData.creditScore.score}</div>
                            <div className="text-sm text-slate-500">out of 1000</div>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${getCreditScoreColor(applicationData.creditScore.score)}`}>
                        {applicationData.creditScore.risk_level ? applicationData.creditScore.risk_level : 
                          applicationData.creditScore.score >= 800 ? 'Excellent' :
                          applicationData.creditScore.score >= 670 ? 'Good' :
                          applicationData.creditScore.score >= 580 ? 'Fair' : 'Poor'
                        }
                      </div>
                      <p className="text-sm text-slate-500 text-center mt-2">
                        Last updated: {applicationData.creditScore.last_updated ?
                          new Date(applicationData.creditScore.last_updated).toLocaleDateString() :
                          'Not available'}
                      </p>
                      
                      {/* Show extra credit data if available in debug mode */}
                      {process.env.NODE_ENV === 'development' && applicationData.creditScore.details && (
                        <div className="mt-3 text-xs text-left bg-slate-50 p-2 rounded w-full">
                          <p className="font-semibold mb-1">Debug - Additional Credit Data:</p>
                          <ul className="list-disc ml-4">
                            {Object.entries(applicationData.creditScore.details)
                              .filter(([key]) => !['score', 'risk_level', 'last_updated'].includes(key))
                              .slice(0, 3) // Limit to first 3 items
                              .map(([key, value]) => (
                                <li key={key}>{key}: {String(value)}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-700 mb-1">Credit Score Not Available</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        {canSeeBusinessDetails() ? 
                          "This business hasn't connected their credit data yet." :
                          "Express interest to view the business's credit score information."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funding Request Card */}
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
                  <CardTitle className="text-white">Funding Request</CardTitle>
                  <CardDescription className="text-gray-200">
                    Current application details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Amount Requested</div>
                    <div className="text-2xl font-bold text-[#212936]">
                      {getFinancialMetric(application.loan_amount)}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Term Length</span>
                      <span className="font-medium text-[#212936]">{application.loan_term_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Purpose</span>
                      <span className="font-medium text-[#212936] capitalize">{application.purpose_category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Security Offered</span>
                      <span className="font-medium text-[#212936]">{application.is_secured ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Personal Guarantee</span>
                      <span className="font-medium text-[#212936]">{application.has_personal_guarantee ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2 bg-slate-50 rounded-b-xl p-4">
                  {getActionButton()}
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-100 shadow-sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Application
                  </Button>
                </CardFooter>
              </Card>

              {/* Admin controls - only visible in development mode */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Admin Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const businessId = applicationData.application?.business_id || applicationData.business?.id;
                                if (businessId) {
                                  toast.info(`Starting data consolidation for business ID: ${businessId}`);
                                  consolidateBusinessData(businessId);
                                } else {
                                  toast.error('No business ID available for consolidation');
                                }
                              }}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 border border-purple-200"
                            >
                              Consolidate Data
                            </button>
                            
                            <button
                              onClick={() => {
                                queryClient.invalidateQueries({ queryKey: ['businessDetail', id] });
                                toast.info('Refreshing all business data...');
                              }}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200"
                            >
                              Refresh All Data
                            </button>
                          </div>
                        </div>
                      )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin Panel - shown only in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="container mt-8 mb-12">
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl">
            <CardHeader className="bg-purple-800 text-white rounded-t-xl border-b-2 border-purple-500">
              <CardTitle className="text-white text-lg flex items-center">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mr-3">ADMIN</span>
                Data Migration and Debugging Tools
              </CardTitle>
              <CardDescription className="text-purple-100">
                These tools help consolidate data across collections and fix inconsistencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold mb-2">Data Migration</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Consolidate data from multiple collections into the canonical data structure
                    (credit_info in businesses collection and financials in a subcollection).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleDataMigration}
                      disabled={migrationStatus.isRunning}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="sm"
                    >
                      {migrationStatus.isRunning ? 'Migrating...' : 'Run Data Migration'}
                    </Button>
                    <Button
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['businessDetail', id] });
                        queryClient.invalidateQueries({ queryKey: ['businessFinancials'] });
                        toast.info('Refreshing all business data...');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Refresh Data
                    </Button>
                  </div>
                  
                  {/* Migration status */}
                  {migrationStatus.results && (
                    <div className="mt-4 p-4 bg-slate-50 rounded border text-xs font-mono overflow-auto max-h-60">
                      <div className={`mb-2 font-bold ${migrationStatus.results.success ? 'text-green-600' : 'text-amber-600'}`}>
                        {migrationStatus.results.message}
                      </div>
                      
                      {migrationStatus.results.sourceFound && migrationStatus.results.sourceFound.length > 0 && (
                        <div className="mb-2">
                          <span className="font-bold">Sources found:</span> {migrationStatus.results.sourceFound.join(', ')}
                        </div>
                      )}
                      
                      {migrationStatus.results.dataMigrated && migrationStatus.results.dataMigrated.length > 0 && (
                        <div className="mb-2">
                          <span className="font-bold">Data migrated:</span> {migrationStatus.results.dataMigrated.join(', ')}
                        </div>
                      )}
                      
                      {migrationStatus.results.errors && migrationStatus.results.errors.length > 0 && (
                        <div>
                          <span className="font-bold text-red-600">Errors:</span>
                          <ul className="list-disc list-inside text-red-600">
                            {migrationStatus.results.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {migrationStatus.error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <div className="font-bold">Error:</div>
                      <div>{migrationStatus.error}</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-md font-semibold mb-2">Data Locations</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    This shows where different data was found for this business.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded border">
                      <div className="font-semibold mb-1">Business Profile</div>
                      <div className="text-slate-700">
                        {applicationData?.business ? (
                          <div>
                            <div>ID: {applicationData.business.id || 'N/A'}</div>
                            <div>Name: {applicationData.business.business_name || 'N/A'}</div>
                            <div>Credit Info: {applicationData.business.credit_info ? '✅' : '❌'}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600">Not found</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded border">
                      <div className="font-semibold mb-1">Credit Score</div>
                      <div className="text-slate-700">
                        {applicationData?.creditScore ? (
                          <div>
                            <div>Score: {applicationData.creditScore.score || 'N/A'}</div>
                            <div>Risk: {applicationData.creditScore.risk_level || 'N/A'}</div>
                            <div>Updated: {applicationData.creditScore.last_updated ? 
                              new Date(applicationData.creditScore.last_updated).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600">Not found</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded border col-span-2">
                      <div className="font-semibold mb-1">Financial Documents</div>
                      <div className="text-slate-700">
                        {financialData && Object.keys(financialData).length > 0 ? (
                          <div>
                            <div>Documents found: {Object.keys(financialData).join(', ')}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600">No financial documents found</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#212936] text-xl">Express Interest</DialogTitle>
            <DialogDescription>
              Are you interested in this loan application? Your information will be shared with the 
              business and they will be notified of your interest.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="font-medium mb-2 text-[#212936]">Application Details:</div>
            <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-muted-foreground">Application:</div>
              <div className="font-medium">#{applicationData?.application?.application_number || id?.substring(0, 8)}</div>
              
              <div className="text-muted-foreground">Amount:</div>
              <div className="font-medium">£{applicationData?.application?.loan_amount?.toLocaleString()}</div>
              
              <div className="text-muted-foreground">Term:</div>
              <div className="font-medium">{applicationData?.application?.loan_term_months} months</div>
              
              <div className="text-muted-foreground">Purpose:</div>
              <div className="font-medium capitalize">{applicationData?.application?.purpose || 'Not specified'}</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              className="border-slate-200 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white"
              onClick={confirmExpressInterest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Confirm Interest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default BusinessDetail;