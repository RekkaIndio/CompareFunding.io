import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument } from '@/firebase';
import { generateApplicationNumber } from '@/lib/applicationNumberUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, PoundSterling, Calendar, Building2, Target, FileText, Send, ArrowLeft, Shield, Lightbulb, BarChart4 } from 'lucide-react';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { loanTypeOptions, loanPurposeOptions, loanTermOptions } from './constants';
import { useCreditScoreAvailability, useFinancialDocumentsAvailability } from '@/pages/Applications/ApplicationDetail/hooks';

const NewApplicationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [application, setApplication] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if application is already submitted
  const isSubmitted = application?.status === 'submitted';

  // Fetch credit score data using the hook
  const { data: creditScoreData, isLoading: isLoadingCreditScore } = useCreditScoreAvailability(
    application?.business_id || user?.uid
  );
  
  // Fetch financial documents availability using the hook
  const { data: financialDocsAvailability, isLoading: isLoadingFinancialDocs } = useFinancialDocumentsAvailability(
    application?.business_id || user?.uid
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch application data
        const { data: appData, error: appError } = await getDocument('applications', id);
        if (appError || !appData) {
          setError('Application not found');
          toast.error('Application not found');
          navigate('/applications');
          return;
        }
        
        // Verify user owns this application
        if (appData.user_id !== user.uid) {
          setError('Unauthorized access');
          toast.error('You do not have permission to view this application');
          navigate('/applications');
          return;
        }
        
        setApplication(appData);
        
        // Fetch business profile
        const { data: businessData, error: businessError } = await getDocument('businesses', user.uid);
        if (businessError) {
          console.warn('Could not load business profile:', businessError);
        } else {
          setBusinessProfile(businessData);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load application data');
        toast.error('Failed to load application data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const processSubmit = async () => {
    if (!application || !user) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData = {
        status: 'submitted',
        status_updated_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        completeness_percentage: 100,
        // Map loan_type to product_type for LenderMarketplace compatibility
        product_type: application.loan_type,
        selectedProduct: application.loan_type, // Alternative field name
        // Add business profile data to help with matching
        ...(businessProfile && {
          company_name: businessProfile.business_name || businessProfile.companyName || businessProfile.company_name,
          company_number: businessProfile.companyNumber || businessProfile.company_number || businessProfile.registration_number,
          industry: businessProfile.industry || businessProfile.industry_sector,
          annual_revenue: businessProfile.annual_revenue || 
                         (businessProfile.forecastRevenue ? parseInt(businessProfile.forecastRevenue) : null) ||
                         businessProfile.annual_turnover,
          years_trading: businessProfile.years_trading || businessProfile.company_age || 
                        (businessProfile.founded_year ? new Date().getFullYear() - businessProfile.founded_year : null),
        }),
      };
      
      const { error } = await updateDocument('applications', id!, updateData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Application submitted with data:', { ...application, ...updateData });
      console.log('Loan type being submitted:', application.loan_type);
      console.log('Business profile data added:', {
        company_name: businessProfile?.business_name || businessProfile?.companyName || businessProfile?.company_name,
        industry: businessProfile?.industry || businessProfile?.industry_sector,
        annual_revenue: businessProfile?.annual_revenue || 
                       (businessProfile?.forecastRevenue ? parseInt(businessProfile.forecastRevenue) : null) ||
                       businessProfile?.annual_turnover,
      });
      toast.success('Application submitted successfully! We\'ll start matching you with lenders.');
      
      // Navigate to lender marketplace to start connecting with lenders
      navigate(`/lender-marketplace/${id}`, { 
        state: { 
          application: { ...application, ...updateData },
          message: 'Your application has been submitted! Start exploring lenders who might be interested in funding your business.'
        }
      });
      
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Helper functions to get display labels
  const getLoanTypeLabel = (value: string) => {
    return loanTypeOptions.find(option => option.value === value)?.label || value;
  };

  const getLoanPurposeLabel = (value: string) => {
    return loanPurposeOptions.find(option => option.value === value)?.label || value;
  };

  const getLoanTermLabel = (months: number) => {
    return loanTermOptions.find(option => option.value === months)?.label || `${months} months`;
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#ff8000]" />
            <p className="text-slate-600">Loading application...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !application) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Application not found'}</p>
            <Button onClick={() => navigate('/applications')} variant="outline">
              Back to Applications
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/applications')}
              className="mb-4 text-slate-600 hover:text-[#ff8000]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#212936] mb-2">
                {isSubmitted ? 'Application Submitted' : 'Review Your Application'}
              </h1>
              <p className="text-slate-600 text-lg">
                {isSubmitted 
                  ? 'Your application has been submitted and is being matched with lenders'
                  : 'Review your funding application details before submitting to lenders'
                }
              </p>
              
              {/* Application Number */}
              <div className="mt-4">
                <Badge variant="outline" className="text-[#ff8000] border-[#ff8000] bg-orange-50">
                  Application #{application.application_number}
                </Badge>
                {isSubmitted && (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Application Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-2xl font-bold text-[#212936] mb-1">
                £{application.loan_amount?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">Funding Amount</div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-2xl font-bold text-[#212936] mb-1">
                {application.loan_term_months}
              </div>
              <div className="text-sm text-slate-600">Months</div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-all duration-200">
              <div className="text-lg font-bold text-[#212936] mb-1">
                {getLoanTypeLabel(application.loan_type)}
              </div>
              <div className="text-sm text-slate-600">Loan Type</div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center mb-1">
                {isSubmitted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div className="text-sm text-slate-600">
                {isSubmitted ? 'Submitted' : 'Ready to Submit'}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Loan Details Card */}
            <Card className="border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2">
                    <PoundSterling className="h-5 w-5 text-white" />
                  </div>
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Loan Amount</p>
                    <p className="text-2xl font-bold text-[#212936]">
                      £{application.loan_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Loan Term</p>
                    <p className="text-lg font-semibold text-[#212936]">
                      {getLoanTermLabel(application.loan_term_months)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Loan Type</p>
                    <p className="text-lg font-semibold text-[#212936]">
                      {getLoanTypeLabel(application.loan_type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Purpose Category</p>
                    <p className="text-lg font-semibold text-[#212936]">
                      {getLoanPurposeLabel(application.purpose_category)}
                    </p>
                  </div>
                </div>
                
                {application.purpose && (
                  <div className="mt-6">
                    <p className="text-sm text-slate-600 mb-2">Purpose Description</p>
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <p className="text-[#212936] leading-relaxed">{application.purpose}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Details Card */}
            <Card className="border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${application.is_secured ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <div>
                      <p className="font-semibold text-[#212936]">Secured Loan</p>
                      <p className="text-sm text-slate-600">
                        {application.is_secured ? 'Yes - willing to offer security' : 'No security offered'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${application.has_personal_guarantee ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <div>
                      <p className="font-semibold text-[#212936]">Personal Guarantee</p>
                      <p className="text-sm text-slate-600">
                        {application.has_personal_guarantee ? 'Yes - willing to provide guarantee' : 'No personal guarantee'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview Card */}
            <Card className="border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-lg">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2">
                    <BarChart4 className="h-5 w-5 text-white" />
                  </div>
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Credit Score Section - Circular Display */}
                  <div className="flex flex-col items-center text-center">
                    <p className="text-sm text-slate-600 mb-4 font-medium">Credit Score</p>
                    {isLoadingCreditScore ? (
                      <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    ) : creditScoreData?.score ? (
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 border-4 border-green-300 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-green-800">{creditScoreData.score}</span>
                          <span className="text-xs text-green-600">Score</span>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-4 border-slate-300 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-slate-600">N/A</span>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HMRC Status and Current Lending Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* HMRC Status Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-600 mb-3 font-medium">HMRC Tax Status</p>
                      <div className="space-y-2">
                        {businessProfile?.hmrcStatus ? (
                          businessProfile.hmrcStatus.isUpToDate === 'yes' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 w-full justify-center py-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Up to Date with HMRC
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 w-full justify-center py-2">
                              <Shield className="h-4 w-4 mr-2" />
                              Outstanding Liabilities Declared
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200 w-full justify-center py-2">
                            HMRC Status Not Available
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Current Lending Status Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-600 mb-3 font-medium">Current Lending Status</p>
                      <div className="space-y-2">
                        {businessProfile?.currentFunding ? (
                          businessProfile.currentFunding.hasCurrentFunding === 'yes' ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 w-full justify-center py-2">
                              <Target className="h-4 w-4 mr-2" />
                              Has Existing Funding
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 w-full justify-center py-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              No Current Funding
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-slate-600 border-slate-200 w-full justify-center py-2">
                            Funding Status Not Available
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Financial Documents Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-600 mb-3 font-medium">Financial Documents</p>
                      <div className="space-y-2">
                        {isLoadingFinancialDocs ? (
                          <Badge variant="outline" className="text-slate-600 border-slate-200 w-full justify-center py-2">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </Badge>
                        ) : financialDocsAvailability?.hasDocuments ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 w-full justify-center py-2">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Financial Documents Available
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 w-full justify-center py-2">
                            <FileText className="h-4 w-4 mr-2" />
                            Business Profile Complete
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Application Completeness */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-600 mb-3 font-medium">Application Strength</p>
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200 w-full justify-center py-2">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          100% Complete
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            {businessProfile && (
              <Card className="border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-full p-2">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Company Name</p>
                      <p className="font-semibold text-[#212936]">
                        {businessProfile.business_name || businessProfile.companyName || businessProfile.company_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Company Number</p>
                      <p className="font-semibold text-[#212936]">
                        {businessProfile.companyNumber || businessProfile.company_number || businessProfile.registration_number || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Industry</p>
                      <p className="font-semibold text-[#212936] capitalize">
                        {businessProfile.industry || businessProfile.industry_sector || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Annual Revenue</p>
                      <p className="font-semibold text-[#212936]">
                        {businessProfile.annual_revenue && typeof businessProfile.annual_revenue === 'number' ? 
                          `£${businessProfile.annual_revenue.toLocaleString()}` : 
                          businessProfile.forecastRevenue ? 
                            `£${parseInt(businessProfile.forecastRevenue).toLocaleString()}` :
                            businessProfile.annual_turnover ? 
                              `£${businessProfile.annual_turnover.toLocaleString()}` : 
                              'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Information Card */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2">
                    <Lightbulb className="h-5 w-5 text-[#ff8000]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#212936] mb-3">
                      {isSubmitted ? 'Your Application Status' : 'What happens next?'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <ul className="text-sm text-slate-700 space-y-2">
                          {isSubmitted ? (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Application submitted successfully</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Currently being matched with suitable lenders</span>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Your application will be matched with suitable lenders</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Lenders will review your application anonymously</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div>
                        <ul className="text-sm text-slate-700 space-y-2">
                          {isSubmitted ? (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>You can view interested lenders in the marketplace</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Connect with lenders when you're ready</span>
                              </li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>You'll receive notifications when lenders express interest</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>You can then choose to connect with interested lenders</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800 text-sm">Privacy Protected</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Your business details remain confidential until you choose to connect with a lender.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              {/* Only show Edit button if not submitted or if submitted show "View in Marketplace" */}
              {isSubmitted ? (
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/applications')}
                    className="px-8 py-3 border-2 border-slate-300 hover:border-[#212936] hover:bg-slate-50 text-slate-700 hover:text-[#212936] font-semibold transition-all duration-200"
                  >
                    Back to Applications
                  </Button>
                  
                  <Button
                    onClick={() => navigate(`/lender-marketplace/${id}`)}
                    className="px-8 py-3 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    View Lender Marketplace
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/applications/new?draft=${id}`)}
                    className="px-8 py-3 border-2 border-slate-300 hover:border-[#212936] hover:bg-slate-50 text-slate-700 hover:text-[#212936] font-semibold transition-all duration-200"
                  >
                    Edit Application
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Submit Your Application
              </DialogTitle>
              <DialogDescription className="text-white">
                Are you ready to submit your application and start connecting with lenders? 
                Once submitted, you'll be taken to our lender marketplace where you can explore funding options.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 border-gray-300 text-white hover:text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={processSubmit} 
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default NewApplicationReview;
