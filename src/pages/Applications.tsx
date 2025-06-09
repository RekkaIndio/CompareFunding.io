import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments, getDocument } from "@/firebase";
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/PageLayout';
import ApplicationCard from '@/components/ApplicationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  CreditCard,
  Users,
  Calendar,
  PoundSterling,
  Target,
  Eye,
  Edit3,
  ArrowRight,
  Edit,
  Star,
  Building,
  BarChart3,
  Activity,
  Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { formatApplicationTitle } from '@/lib/applicationUtils';

export type Application = {
  id: string;
  application_number: string;
  loan_amount: number;
  loan_term_months: number;
  purpose: string;
  purpose_details?: string;
  status: string;
  application_date: string;
  expires_at: string | null;
  matched_lenders: string[] | null;
  completeness_percentage?: number;
  has_documents?: boolean;
  is_secured?: boolean;
  has_personal_guarantee?: boolean;
  loan_type?: string;
  interested_lenders?: any[];
  offers?: any[];
  viewed_by_lenders?: string[];
  created_at?: string;
  status_updated_at?: string;
}

// Helper function to format currency
const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return 'N/A';
  return `£${amount.toLocaleString('en-GB')}`;
};

// Helper functions for financial calculations (matching OffersList)
const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(monthlyPayment * 100) / 100;
};

const calculateTotalCost = (amount: number, interestRate: number, termMonths: number) => {
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, termMonths);
  return Math.round(monthlyPayment * termMonths);
};

const calculateTotalInterest = (amount: number, interestRate: number, termMonths: number) => {
  const totalRepayment = calculateTotalCost(amount, interestRate, termMonths);
  return totalRepayment - amount;
};

const Applications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Debug user authentication
  useEffect(() => {

  }, [user]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Add businessProfile to fetch logo and use in application strength calculation
  const { data: businessProfile } = useQuery({
    queryKey: ['businessProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      // First try to fetch from businesses collection
      const businessesResult = await getDocument('businesses', user?.uid);
      if (businessesResult.data) {

        return { ...businessesResult.data, _source: 'businesses' };
      }
      // If not found, try business_profiles collection
      const profilesResult = await getDocument('business_profiles', user?.uid);
      if (profilesResult.error) throw profilesResult.error;
      if (profilesResult.data) {

        return { ...profilesResult.data, _source: 'business_profiles' };
      }

      return null;
    },
    enabled: !!user?.uid
  });

  // Fetch offers data to filter out applications that have received offers
  const { data: offers } = useQuery({
    queryKey: ['offers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      // Get applications first to get application IDs
      const { data: apps } = await getDocuments(
        'applications',
        [{ field: 'user_id', operator: '==', value: user.uid }]
      );
      
      if (!apps || apps.length === 0) return [];
      
      const applicationIds = apps.map(app => app.id);
      const allOffers: any[] = [];
      
      // Get offers for these applications
      for (const appId of applicationIds) {
        const { data: appOffers } = await getDocuments(
          'offers',
          [{ field: 'application_id', operator: '==', value: appId }]
        );
        
        if (appOffers) {
          allOffers.push(...appOffers);
        }
      }
      
      return allOffers;
    },
    enabled: !!user?.uid
  });

  // Fetch applications data from Firebase
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['applications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        console.error('No user ID available');
        throw new Error('User not authenticated');
      }
      

      
      try {
        const { data, error } = await getDocuments(
          'applications',
          [
            { field: 'user_id', operator: '==', value: user.uid }
          ]
        );
        
        if (error) {
          console.error('Error fetching applications:', error);
          toast.error('Failed to load applications');
          throw error;
        }

        if (!data || data.length === 0) {

          return [];
        }

        // Get financial documents to check if documents exist for each application
        let financialDocs = [];
        try {
          const db = getFirestore();
          if (data[0].business_id) {
            const docsQuery = query(
              collection(db, 'financial_documents'),
              where('business_id', '==', data[0].business_id)
            );
            const docsSnapshot = await getDocs(docsQuery);
            financialDocs = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        } catch (err) {
          console.error('Error fetching financial documents:', err);
        }

        // Sort the applications in memory instead
        const processedData = (data || [])
          .map(app => {
            // Determine if the application actually has documents
            const hasDocuments = financialDocs.length > 0 || 
              (app.financialDocuments && Object.keys(app.financialDocuments).length > 0) ||
              (app.financialDocumentsTab && Object.keys(app.financialDocumentsTab).length > 0) ||
              (app.financial_documents && app.financial_documents.length > 0);
              
            // Calculate application completeness
            const checks = [
              { name: 'Business profile', value: !!businessProfile }, // We've already fetched the businessProfile
              { name: 'Credit score', value: !!businessProfile?.credit_info?.credit_score },
              { name: 'Financial documents', value: hasDocuments },
              { name: 'Application details', value: !!app.loan_amount && !!app.loan_term_months && !!app.purpose }
            ];
            
            const completed = checks.filter(check => check.value).length;
            const percentage = Math.round((completed / checks.length) * 100);
            
            // If the application status is submitted, check that we actually have documents before marking as 100%
            const finalPercentage = app.status === 'submitted' && !hasDocuments ? 
              Math.min(percentage, 75) : // Cap at 75% if missing documents but submitted
              percentage;
            
            return {
              ...app,
              application_date: app.application_date || app.created_at || new Date().toISOString(),
              status: app.status || 'draft',
              completeness_percentage: finalPercentage,
              has_documents: hasDocuments
            };
          })
          .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());
        

        // Filter out applications that have received offers
        const applicationsWithOffers = new Set(
          (offers || []).map(offer => offer.application_id)
        );
        
        const applicationsWithoutOffers = processedData.filter(app => 
          !applicationsWithOffers.has(app.id)
        );

        return applicationsWithoutOffers as Application[];
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    enabled: !!user?.uid && offers !== undefined, // Wait for offers data
    staleTime: 30000, // 30 seconds - reduce this to refresh more frequently
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Debug applications data changes
  useEffect(() => {
    if (applications) {




    }
  }, [applications]);

  // Filter for pending applications (applications without offers)
  const pendingApplications = applications?.filter(app => {
    // Show applications that are in active status and don't have offers
    const normalizedStatus = app.status?.toLowerCase?.();
    return [
      'draft', 'submitted', 'matching', 'matched', 'in_review', 'in-review',
      'pending', 'processing', 'reviewing', 'documents_requested', 'under_review'
    ].includes(normalizedStatus);
  }) || [];

  // Define variables used in overview cards
  const activeApplications = pendingApplications?.filter(app => 
    ['submitted', 'matching', 'matched', 'in_review', 'in-review', 'under_review'].includes(app.status?.toLowerCase?.())
  ) || [];
  
  const completedApplications = []; // Empty since this page only shows pending applications

  // Helper function to get status styling for applications
  const getApplicationStatusStyling = (status: string) => {
    const statusStyles = {
      'pending': { 
        gradient: 'from-amber-500 to-amber-600', 
        bgClass: 'bg-amber-50', 
        textClass: 'text-amber-700',
        label: 'Pending Review',
        icon: <Clock className="h-4 w-4" />
      },
      'under_review': { 
        gradient: 'from-blue-500 to-blue-600', 
        bgClass: 'bg-blue-50', 
        textClass: 'text-blue-700',
        label: 'Under Review',
        icon: <Eye className="h-4 w-4" />
      },
      'documents_requested': { 
        gradient: 'from-purple-500 to-purple-600', 
        bgClass: 'bg-purple-50', 
        textClass: 'text-purple-700',
        label: 'Documents Requested',
        icon: <FileText className="h-4 w-4" />
      },
      'submitted': { 
        gradient: 'from-slate-500 to-slate-600', 
        bgClass: 'bg-slate-50', 
        textClass: 'text-slate-700',
        label: 'Submitted',
        icon: <CheckCircle className="h-4 w-4" />
      },
      'draft': { 
        gradient: 'from-gray-500 to-gray-600', 
        bgClass: 'bg-gray-50', 
        textClass: 'text-gray-700',
        label: 'Draft',
        icon: <Edit3 className="h-4 w-4" />
      },
      'matching': { 
        gradient: 'from-indigo-500 to-indigo-600', 
        bgClass: 'bg-indigo-50', 
        textClass: 'text-indigo-700',
        label: 'Finding Matches',
        icon: <Target className="h-4 w-4" />
      }
    };
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
  };

  // This businessProfile query is already declared earlier in the file

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" data-tour="applications-main">
        <div className="container px-6 py-8 mx-auto">
          {/* Enhanced Header Section */}
          <div className="relative bg-gradient-to-r from-[#212936] via-[#2a3441] to-[#212936] text-white rounded-2xl p-8 mb-8 shadow-2xl border border-slate-200/20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff8000] rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#ff8000]/20 rounded-xl border border-[#ff8000]/30">
                    <FileText className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text">
                      Your Applications
                    </h1>
                    <p className="text-gray-300 text-lg">
                      Track and manage your business funding journey
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats in Header */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium">
                      {applications?.filter(app => app.status === 'matched').length || 0} Matched
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">
                      {activeApplications?.length || 0} In Progress
                    </span>
                  </div>                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                      <PoundSterling className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">
                        £{applications?.reduce((sum, app) => sum + (app.loan_amount || 0), 0).toLocaleString() || '0'} Applied
                      </span>
                    </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-[#ff8000] hover:bg-[#ff8000]/90 shadow-lg text-white border-0 px-6 py-3 font-semibold group"
                >
                  <Link to="/applications/new">
                    <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                    New Application
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-6 py-3"
                >
                  <Link to="/business/documents">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Documents
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg rounded-xl">
                  <div className="h-3 bg-slate-300 rounded-t-xl"></div>
                  <div className="h-32 bg-slate-100 rounded-t-lg"></div>
                  <CardContent className="pt-6 space-y-4">
                    <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="h-16 bg-slate-100 rounded-lg"></div>
                      ))}
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-50/90 backdrop-blur-sm border-red-200/60 shadow-lg rounded-xl">
              <CardContent className="pt-6 flex items-center">
                <AlertCircle className="text-red-500 mr-2" />
                <span className="text-red-800">There was an error loading your applications. Please try again later.</span>
              </CardContent>
            </Card>
          ) : !applications || applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="text-center max-w-md mx-auto">
                <div className="mb-8">
                  <FileText className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No Applications Yet
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    You haven't created any funding applications yet. Start your business funding journey by creating your first application.
                  </p>
                </div>
                
                <Button 
                  asChild 
                  size="lg"
                  className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-xl"
                >
                  <Link to="/applications/new" className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Create Your First Application
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                
                <p className="text-sm text-gray-500 mt-4">
                  Get matched with multiple lenders and receive competitive funding offers
                </p>
              </div>
            </div>
          ) : pendingApplications?.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg rounded-xl">
              <CardHeader className="bg-gradient-to-r from-[#212936] to-[#2a3441] text-white rounded-t-xl">
                <CardTitle className="text-white">No Pending Applications</CardTitle>
                <CardDescription className="text-gray-200">
                  All your applications have received offers or are completed
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="mb-4 p-6 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-3" />
                  <p className="text-slate-600 mb-4">Great news! All your applications are progressing well.</p>
                  <p className="text-sm text-slate-500 mb-4">Check your dashboard to view applications with offers, or create a new application.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] shadow-md">
                    <Link to="/business-dashboard">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/applications/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Application
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pending Applications</h2>
                  <p className="text-gray-600">Applications awaiting lender responses</p>
                </div>
              </div>
              
              <div className="grid gap-8">
                {pendingApplications.map((application) => {
                  const statusStyling = getApplicationStatusStyling(application.status);
                  
                  // Calculate financial projections with estimated rates
                  const displayAmount = application.loan_amount;
                  const estimatedRate = 8.5; // Default estimated rate for applications without offers
                  const displayTerm = application.loan_term_months || 60; // Default 5 years
                  
                  const monthlyPayment = calculateMonthlyPayment(displayAmount, estimatedRate, displayTerm);
                  const totalCost = calculateTotalCost(displayAmount, estimatedRate, displayTerm);
                  const totalInterest = calculateTotalInterest(displayAmount, estimatedRate, displayTerm);
                  
                  return (
                    <Card 
                      key={application.id} 
                      className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl cursor-pointer"
                      onClick={() => navigate(`/applications/${application.id}`)}
                    >
                      {/* Enhanced status indicator bar with premium gradient - matching OffersList */}
                      <div className={`h-3 w-full bg-gradient-to-r ${statusStyling.gradient}`}></div>
                      
                      {/* Enhanced header with sophisticated styling matching OffersList */}
                      <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {/* Empty space for balance */}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${statusStyling.bgClass} ${statusStyling.textClass} border border-white/20 shadow-lg`}>
                                {statusStyling.icon}
                                <span className="ml-1.5">{statusStyling.label}</span>
                              </div>
                              <ArrowRight className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                            </div>
                          </div>
                          
                          <CardTitle className="text-xl font-bold text-white mb-2">
                            {formatApplicationTitle(application, application.id, true, statusStyling.label)}
                          </CardTitle>
                          
                          <div className="flex items-center gap-6 text-white/80 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Applied {new Date(application.application_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span className="font-semibold">{businessProfile?.company_name || 'Your Business'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Background pattern matching OffersList */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                      </CardHeader>
                      
                      <CardContent className="p-6 space-y-6 bg-white">
                        {/* Application purpose and details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Funding Purpose</h4>
                            <p className="text-gray-900 font-medium">{application.purpose}</p>
                            {application.purpose_details && (
                              <p className="text-sm text-gray-600 mt-1">{application.purpose_details}</p>
                            )}
                          </div>
                          
                          {/* Amount box only */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Loan Amount</p>
                                <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                                  <PoundSterling className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <p className="font-bold text-2xl text-[#212936] mb-2">{formatCurrency(application.loan_amount)}</p>
                              <div className="w-full bg-slate-200/50 h-2 rounded-full">
                                <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-2 rounded-full w-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Applications;
