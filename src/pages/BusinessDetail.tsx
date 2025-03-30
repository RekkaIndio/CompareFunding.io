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
  ThumbsUp
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
    return `Application #${applicationData.application.application_number || id?.substring(0, 8)}`;
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
            className="mb-6"
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

    if (isInMatchedLenders || interestStatus === 'accepted') {
      return (
        <div className="flex gap-2">
          <Button variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Matched
          </Button>
          <Button 
            className="bg-fundhub-blue hover:bg-fundhub-blue/90"
            onClick={() => navigate(`/create-offer/${id}`)}
          >
            Create Offer
          </Button>
        </div>
      );
    }

    if (interestStatus === 'pending') {
      return (
        <Button variant="outline" className="text-green-600 border-green-600" disabled>
          <ThumbsUp className="mr-2 h-4 w-4" />
          Interest Sent
        </Button>
      );
    }

    if (interestStatus === 'rejected') {
      return (
        <Button variant="outline" className="text-red-600 border-red-600" disabled>
          Interest Declined
        </Button>
      );
    }

    return (
      <Button className="bg-fundhub-blue hover:bg-fundhub-blue/90" onClick={handleExpressInterest}>
        Express Interest
      </Button>
    );
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/matched-applications')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {isLenderMatched() && applicationData?.business?.logo_url && (
                      <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                        <img 
                          src={applicationData.business.logo_url} 
                          alt={`${applicationData.business.business_name} logo`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-fundhub-blue" />
                        {getDisplayName()}
                      </CardTitle>
                      {isLenderMatched() && (
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="capitalize">
                              {applicationData?.business?.industry_sector}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {applicationData?.business?.company_size} employees
                            </span>
                          </div>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {getActionButton()}
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
                  // Show essential business information without identifying details
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Industry</div>
                        <div className="font-medium flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          {applicationData?.business?.industry_sector || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Company Size</div>
                        <div className="font-medium flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          {applicationData?.business?.company_size || 'Not specified'} employees
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
                        <div className="text-sm text-muted-foreground mb-1">Years in Business</div>
                        <div className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {applicationData?.business?.incorporation_date ? 
                            `${new Date().getFullYear() - new Date(applicationData.business.incorporation_date).getFullYear()} years` :
                            'Not specified'}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Business Overview</h3>
                      <p className="text-sm text-muted-foreground">
                        {applicationData?.business?.description || 'No business description provided.'}
                      </p>
                      <div className="mt-4 p-4 bg-fundhub-light-blue/10 rounded-lg">
                        <div className="text-sm font-medium text-fundhub-blue mb-2">Note:</div>
                        <div className="text-sm text-muted-foreground">
                          Business name and contact details will be available after expressing interest and being matched.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Financial Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgePoundSterling className="h-5 w-5 text-fundhub-blue" />
                  Financial Overview
                </CardTitle>
                <CardDescription>
                  Financial statements and key metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Profit & Loss Section */}
                <div>
                  <h3 className="font-medium text-lg mb-4">Profit and Loss</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium p-2">Item</th>
                          <th className="text-right font-medium p-2">2024</th>
                          <th className="text-right font-medium p-2">2023</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Turnover</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.turnover || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.turnover || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Cost of Sales</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.costOfSales || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.costOfSales || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Gross profit</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.grossProfit || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.grossProfit || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">GP%</td>
                          <td className="text-right p-2">
                            {applicationData?.application?.financial_data?.profitAndLoss['2024']?.grossProfitMargin?.toFixed(2)}%
                          </td>
                          <td className="text-right p-2">
                            {applicationData?.application?.financial_data?.profitAndLoss['2023']?.grossProfitMargin?.toFixed(2)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Less: Administrative expenses</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.administrativeExpenses || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.administrativeExpenses || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Operating Profit / loss</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.operatingProfit || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.operatingProfit || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Tax</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.tax || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.tax || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Net profit / loss</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.netProfit || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.netProfit || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Dividends paid</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.dividendsPaid || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.dividendsPaid || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Profit after tax</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2024']?.profitAfterTax || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.profitAndLoss['2023']?.profitAfterTax || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                {/* Balance Sheet Section */}
                <div>
                  <h3 className="font-medium text-lg mb-4">Balance Sheet</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium p-2">Item</th>
                          <th className="text-right font-medium p-2">2024</th>
                          <th className="text-right font-medium p-2">2023</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Intangible Fixed Assets</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.intangibleFixedAssets || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.intangibleFixedAssets || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Tangible Fixed Assets</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.tangibleFixedAssets || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.tangibleFixedAssets || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Current Assets</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.currentAssets || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.currentAssets || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Current Liabilities</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.currentLiabilities || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.currentLiabilities || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Net Current Assets</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.netCurrentAssets || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.netCurrentAssets || 0)}
                          </td>
                        </tr>
                        <tr className="font-medium">
                          <td className="p-2">Total Assets Less Current Liabilities</td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2024']?.totalAssetsLessCurrentLiabilities || 0)}
                          </td>
                          <td className="text-right p-2">
                            {getFinancialMetric(applicationData?.application?.financial_data?.balanceSheet['2023']?.totalAssetsLessCurrentLiabilities || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Non Current Liabilities</td>
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
                <div>
                  <h3 className="font-medium mb-4">Key Financial Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Gross Profit Margin (2024)</div>
                      <div className="font-medium">25.00%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Operating Margin (2024)</div>
                      <div className="font-medium">8.33%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Current Ratio (2024)</div>
                      <div className="font-medium">1.50x</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Net Profit Margin (2024)</div>
                      <div className="font-medium">6.25%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Credit & Funding Request */}
          <div className="col-span-1 space-y-6">
            {/* Credit Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-fundhub-blue" />
                  Credit Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className={`text-4xl font-bold mb-2 ${getCreditScoreColor(applicationData?.application?.credit_score || 0)}`}>
                    {applicationData?.application?.credit_score || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Business Credit Score
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Credit Risk Score</div>
                    <div className="font-medium">
                      {applicationData?.application?.risk_score || 'Not Available'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Credit Limit</div>
                    <div className="text-2xl font-bold">
                      {getFinancialMetric(applicationData?.application?.credit_limit || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funding Request Card */}
            <Card>
              <CardHeader>
                <CardTitle>Funding Request</CardTitle>
                <CardDescription>
                  Current application details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Amount Requested</div>
                  <div className="text-2xl font-bold">
                    {getFinancialMetric(application.loan_amount)}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Term Length</span>
                    <span className="font-medium">{application.loan_term_months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purpose</span>
                    <span className="font-medium capitalize">{application.purpose_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Security Offered</span>
                    <span className="font-medium">{application.is_secured ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Personal Guarantee</span>
                    <span className="font-medium">{application.has_personal_guarantee ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                {getActionButton()}
                <Button variant="outline" className="w-full">
                  Download Application
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Express Interest</DialogTitle>
            <DialogDescription>
              Are you interested in this loan application? Your information will be shared with the 
              business and they will be notified of your interest.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="font-medium mb-2">Application Details:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Application:</div>
              <div>#{applicationData?.application?.application_number || id?.substring(0, 8)}</div>
              
              <div className="text-muted-foreground">Amount:</div>
              <div>£{applicationData?.application?.loan_amount?.toLocaleString()}</div>
              
              <div className="text-muted-foreground">Term:</div>
              <div>{applicationData?.application?.loan_term_months} months</div>
              
              <div className="text-muted-foreground">Purpose:</div>
              <div>{applicationData?.application?.purpose || 'Not specified'}</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
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