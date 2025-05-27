import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, expressInterestInApplication } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update isAlreadyMatched function to use correct data structure
  const isAlreadyMatched = () => {
    if (!applicationData?.application) return false;
    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);
    const hasExpressedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && (l.status === 'accepted' || l.status === 'pending')
    );
    return isInMatchedLenders || hasExpressedInterest;
  };

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

  // Fetch application and associated business data
  const { data: applicationData, isLoading, error } = useQuery({
    queryKey: ['businessDetail', id],
    queryFn: async () => {
      if (!id || !user) throw new Error('Invalid request');

      try {
        // Try to get application details first
        const { data: application, error: appError } = await getDocument('applications', id);
        
        // If we found an application, get the business details through the application
        if (!appError && application) {
          console.log('Found application:', application);
          
          // If no business_id, fall back to using the application owner's ID
          const businessId = application.business_id || application.user_id;
          if (!businessId) {
            console.error('Application missing both business_id and user_id');
            throw new Error('Could not determine business reference');
          }

          // Get business profile using business_id or user_id from the application
          const { data: business, error: businessError } = await getDocument(
            'business_profiles',
            businessId
          );
          
          if (businessError || !business) {
            console.error('Error fetching business profile or profile not found:', businessError);
            throw new Error('Could not load business profile');
          }

          // Get accounting data if connected
          const { data: accounting } = await getDocument(
            'accounting_integrations',
            businessId
          );

          // Get credit score data if available
          const { data: creditScore } = await getDocument(
            'credit_scores',
            businessId
          );

          return {
            application,
            business,
            accounting,
            creditScore
          };
        } 
        
        // If no application found, try direct business profile lookup
        console.log('No application found, trying direct business lookup');
        const { data: business, error: businessError } = await getDocument('business_profiles', id);
        
        if (businessError || !business) {
          console.error('Error fetching business profile or profile not found:', businessError);
          throw new Error('Could not find business profile');
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
    return applicationData?.business?.business_name || `Application #${applicationData.application.application_number || id?.substring(0, 8)}`;
  };

  // Update document title based on match status
  useEffect(() => {
    if (applicationData?.application) {
      document.title = `${getDisplayName()} | FundHub`;
    }
  }, [applicationData]);

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
                  {isLenderMatched() ? (
                    // Show full business details when matched
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

              {/* Financial Data Card - Only show for matched lenders */}
              {isLenderMatched() && (
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
                    <CardTitle className="text-white">Financial Performance</CardTitle>
                    <CardDescription className="text-gray-200">
                      Recent financial data and key metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* P&L Summary */}
                    <div className="p-6">
                      <h3 className="font-semibold mb-4 text-[#212936] flex items-center">
                        <BarChart4 className="h-4 w-4 mr-2 text-[#ff8000]" /> 
                        Profit & Loss Summary
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left p-2">Item</th>
                              <th className="text-right p-2">FY 2024</th>
                              <th className="text-right p-2">FY 2023</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-2 font-medium">Revenue</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.revenue || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.revenue || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Cost of Sales</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.costOfSales || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.costOfSales || 0)}
                              </td>
                            </tr>
                            <tr className="font-medium">
                              <td className="p-2">Gross Profit</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.grossProfit || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.grossProfit || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2">Operating Expenses</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.operatingExpenses || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.operatingExpenses || 0)}
                              </td>
                            </tr>
                            <tr className="font-medium">
                              <td className="p-2">Operating Profit</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.operatingProfit || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.operatingProfit || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2">Net Profit</td>
                              <td className="text-right p-2 font-bold">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.netProfit || 0)}
                              </td>
                              <td className="text-right p-2 font-bold">
                                {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.netProfit || 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Separator />

                    {/* Balance Sheet Summary */}
                    <div className="p-6">
                      <h3 className="font-semibold mb-4 text-[#212936] flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-[#ff8000]" />
                        Balance Sheet Summary
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left p-2">Item</th>
                              <th className="text-right p-2">FY 2024</th>
                              <th className="text-right p-2">FY 2023</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-2 font-medium" colSpan={3}>Assets</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Current Assets</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.currentAssets || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.currentAssets || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Non-Current Assets</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.nonCurrentAssets || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.nonCurrentAssets || 0)}
                              </td>
                            </tr>
                            <tr className="font-medium">
                              <td className="p-2 pl-6">Total Assets</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.totalAssets || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.totalAssets || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium" colSpan={3}>Liabilities</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Current Liabilities</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.currentLiabilities || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.currentLiabilities || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Non-Current Liabilities</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.nonCurrentLiabilities || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.nonCurrentLiabilities || 0)}
                              </td>
                            </tr>
                            <tr className="font-medium">
                              <td className="p-2">Net Assets</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.netAssets || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.netAssets || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium" colSpan={3}>Equity Shareholders Funds</td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Share Capital</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.equityShareholdersFunds.shareCapital || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.equityShareholdersFunds.shareCapital || 0)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2 pl-6">Profit and Loss Account</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.equityShareholdersFunds.profitAndLossAccount || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.equityShareholdersFunds.profitAndLossAccount || 0)}
                              </td>
                            </tr>
                            <tr className="font-medium">
                              <td className="p-2 pl-6">Total Shareholders Funds</td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.equityShareholdersFunds.totalShareholdersFunds || 0)}
                              </td>
                              <td className="text-right p-2">
                                {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.equityShareholdersFunds.totalShareholdersFunds || 0)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Separator />

                    {/* Key Financial Metrics */}
                    <div className="p-6">
                      <h3 className="font-semibold mb-4 text-[#212936] flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                        Key Financial Metrics
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Gross Profit Margin</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {applicationData?.application?.financial_metrics?.grossProfitMargin || 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Net Profit Margin</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {applicationData?.application?.financial_metrics?.netProfitMargin || 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Debt to Equity Ratio</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {applicationData?.application?.financial_metrics?.debtToEquityRatio || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Current Ratio</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {applicationData?.application?.financial_metrics?.currentRatio || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Quick Ratio</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {applicationData?.application?.financial_metrics?.quickRatio || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Credit Limit</div>
                          <div className="text-2xl font-bold text-[#212936]">
                            {getFinancialMetric(applicationData?.application?.credit_limit || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                        {applicationData.creditScore.score >= 800 ? 'Excellent' :
                         applicationData.creditScore.score >= 670 ? 'Good' :
                         applicationData.creditScore.score >= 580 ? 'Fair' : 'Poor'}
                      </div>
                      <p className="text-sm text-slate-500 text-center mt-2">
                        Last updated: {applicationData.creditScore.last_updated ?
                          new Date(applicationData.creditScore.last_updated).toLocaleDateString() :
                          'Not available'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-700 mb-1">Credit Score Not Available</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        {isLenderMatched() ? 
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
            </div>
          </div>
        </div>
      </div>

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