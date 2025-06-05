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
  DollarSign,
  Target,
  Eye,
  Edit3,
  ArrowRight,
  Edit,
  Star,
  Building,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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

const Applications = () => {
  const { user } = useAuth();
  
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
            // Calculate application completeness
            const checks = [
              { name: 'Business profile', value: !!businessProfile }, // We've already fetched the businessProfile
              { name: 'Credit score', value: !!businessProfile?.credit_info?.credit_score },
              { name: 'Financial documents', value: financialDocs.length > 0 },
              { name: 'Application details', value: !!app.loan_amount && !!app.loan_term_months && !!app.purpose }
            ];
            
            const completed = checks.filter(check => check.value).length;
            const percentage = Math.round((completed / checks.length) * 100);
            
            return {
              ...app,
              application_date: app.application_date || app.created_at || new Date().toISOString(),
              status: app.status || 'draft',
              completeness_percentage: percentage,
              has_documents: financialDocs.length > 0
            };
          })
          .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());
        

        return processedData as Application[];
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    enabled: !!user?.uid, // Don't wait for business profile, we'll check it inside the queryFn
    staleTime: 30000, // 30 seconds - reduce this to refresh more frequently
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Debug applications data changes
  useEffect(() => {
    if (applications) {




    }
  }, [applications]);

  // Group applications by status - using normalized status values
  const activeApplications = applications?.filter(app => {
    // Normalize status by converting to lowercase and handle both underscore and hyphen formats
    const normalizedStatus = app.status?.toLowerCase?.();
    return [
      'draft', 'submitted', 'matching', 'matched', 'in_review', 'in-review',
      'pending', 'processing', 'reviewing'
    ].includes(normalizedStatus);
  }) || [];
  
  const completedApplications = applications?.filter(app => {
    // Normalize status by converting to lowercase and handle both underscore and hyphen formats
    const normalizedStatus = app.status?.toLowerCase?.();
    return [
      'approved', 'funded', 'rejected', 'cancelled', 'expired',
      'completed', 'declined', 'withdrawn'
    ].includes(normalizedStatus);
  }) || [];

  // This businessProfile query is already declared earlier in the file

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <DollarSign className="h-4 w-4 text-blue-400" />
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

          {/* Enhanced Application Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Summary Cards */}
            <div className="lg:col-span-2">
              <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/50 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-[#212936] to-[#2a3441] text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <div className="p-2 bg-[#ff8000]/20 rounded-lg mr-3">
                      <Target className="w-5 h-5 text-[#ff8000]" />
                    </div>
                    <span className="text-white">Applications Overview</span>
                  </CardTitle>
                  <CardDescription className="text-gray-200">
                    Your funding application statistics and progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mb-1">
                        {isLoading ? (
                          <div className="h-6 w-12 mx-auto bg-blue-200 animate-pulse rounded"></div>
                        ) : (
                          applications?.length || 0
                        )}
                      </div>
                      <p className="text-blue-600 font-medium text-sm">Total Applications</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 text-center group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-amber-600 mb-1">
                        {isLoading ? (
                          <div className="h-6 w-12 mx-auto bg-amber-200 animate-pulse rounded"></div>
                        ) : (
                          activeApplications?.length || 0
                        )}
                      </div>
                      <p className="text-amber-600 font-medium text-sm">Active Applications</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {isLoading ? (
                          <div className="h-6 w-12 mx-auto bg-green-200 animate-pulse rounded"></div>
                        ) : (
                          applications?.filter(app => app.matched_lenders?.length > 0).length || 0
                        )}
                      </div>
                      <p className="text-green-600 font-medium text-sm">With Matches</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {isLoading ? (
                          <div className="h-6 w-12 mx-auto bg-purple-200 animate-pulse rounded"></div>
                        ) : (
                          completedApplications?.filter(app => ['approved', 'funded'].includes(app.status)).length || 0
                        )}
                      </div>
                      <p className="text-purple-600 font-medium text-sm">Approved</p>
                    </div>
                  </div>

                  {/* Application Value Summary */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Applied</p>
                        <p className="text-xl font-bold text-slate-800">
                          £{applications?.reduce((sum, app) => sum + (app.loan_amount || 0), 0).toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Average Amount</p>
                        <p className="text-xl font-bold text-slate-800">
                          £{applications?.length ? Math.round(applications.reduce((sum, app) => sum + (app.loan_amount || 0), 0) / applications.length).toLocaleString() : '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Success Rate</p>
                        <p className="text-xl font-bold text-slate-800">
                          {applications?.length ? Math.round((completedApplications?.filter(app => ['approved', 'funded'].includes(app.status)).length || 0) / applications.length * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Completion Card */}
            <div>
              <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/50 shadow-xl h-full">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-base">
                    <div className="p-2 bg-white/20 rounded-lg mr-3">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    Profile Strength
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Overall Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                        <span className="text-sm font-bold text-slate-900">
                          {Math.round(([
                            !!businessProfile,
                            !!businessProfile?.credit_info?.credit_score,
                            applications?.some(app => app.has_documents),
                            applications?.some(app => app.loan_amount && app.purpose)
                          ].filter(Boolean).length / 4) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={([
                          !!businessProfile,
                          !!businessProfile?.credit_info?.credit_score,
                          applications?.some(app => app.has_documents),
                          applications?.some(app => app.loan_amount && app.purpose)
                        ].filter(Boolean).length / 4) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Individual Items */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {businessProfile ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Business Profile</span>
                        </div>
                        <Badge variant={businessProfile ? "default" : "destructive"} className="text-xs">
                          {businessProfile ? "Complete" : "Missing"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {businessProfile?.credit_info?.credit_score ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Credit Score</span>
                        </div>
                        <Badge variant={businessProfile?.credit_info?.credit_score ? "default" : "destructive"} className="text-xs">
                          {businessProfile?.credit_info?.credit_score ? "Available" : "Check Needed"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {applications?.some(app => app.has_documents) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Documents</span>
                        </div>
                        <Badge variant={applications?.some(app => app.has_documents) ? "default" : "destructive"} className="text-xs">
                          {applications?.some(app => app.has_documents) ? "Uploaded" : "Required"}
                        </Badge>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => window.location.href = '/business/profile'}
                    >
                      <Edit3 className="mr-2 h-3 w-3" />
                      Improve Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <div className="h-16 bg-slate-100 rounded-t-lg"></div>
                  <CardContent className="pt-6">
                    <div className="h-6 bg-slate-100 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-50/90 backdrop-blur-sm border-red-200/60 shadow-lg">
              <CardContent className="pt-6 flex items-center">
                <AlertCircle className="text-red-500 mr-2" />
                <span className="text-red-800">There was an error loading your applications. Please try again later.</span>
              </CardContent>
            </Card>
          ) : applications?.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
              <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                <CardTitle className="text-white">No Applications Yet</CardTitle>
                <CardDescription className="text-gray-200">
                  Get started by creating your first funding application
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="mb-4 p-6 bg-slate-50 rounded-lg border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-slate-400 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <p className="text-slate-600 mb-4">Start your funding journey by creating an application</p>
                </div>
                <Button asChild className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] shadow-md">
                  <Link to="/applications/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Application
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeApplications.length > 0 && (
                <div className="mb-10">
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-[#212936] to-[#2a3441] text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#ff8000]/20 rounded-lg border border-[#ff8000]/30">
                            <Clock className="h-5 w-5 text-[#ff8000]" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">Active Applications</CardTitle>
                            <CardDescription className="text-gray-200">
                              {activeApplications.length} application{activeApplications.length !== 1 ? 's' : ''} in progress
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-[#ff8000]/20 text-[#ff8000] border-[#ff8000]/30">
                          {activeApplications.length} Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {activeApplications.map((application) => (
                        <div key={application.id} className="group">
                          <Card className="border border-slate-200/60 hover:border-[#ff8000]/40 transition-all duration-300 hover:shadow-md bg-gradient-to-r from-white to-slate-50/50">
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Left Section - Application Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-4">
                                    <div className="p-3 bg-[#ff8000]/10 rounded-xl border border-[#ff8000]/20 shrink-0">
                                      <FileText className="h-6 w-6 text-[#ff8000]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                          Application #{application.application_number}
                                        </h3>
                                        <Badge 
                                          variant="outline" 
                                          className={`
                                            ${application.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                              application.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                              application.status === 'matching' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                              application.status === 'matched' ? 'bg-green-50 text-green-700 border-green-200' : 
                                              'bg-slate-50 text-slate-700 border-slate-200'}
                                          `}
                                        >
                                          {application.status === 'draft' ? 'Draft' : 
                                           application.status === 'submitted' ? 'Submitted' : 
                                           application.status === 'matching' ? 'Matching' : 
                                           application.status === 'matched' ? 'Matched' : 
                                           application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4 text-green-600" />
                                          <span className="font-medium">
                                            £{application.loan_amount?.toLocaleString() || 'Not specified'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-blue-600" />
                                          <span>
                                            {application.loan_term_months || 'Not specified'} months
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Building className="h-4 w-4 text-purple-600" />
                                          <span className="truncate">
                                            {application.purpose || 'Purpose not specified'}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Progress Section */}
                                      <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-gray-700">
                                            Application Strength
                                          </span>
                                          <span className="text-sm font-semibold text-[#ff8000]">
                                            {application.completeness_percentage || 0}%
                                          </span>
                                        </div>
                                        <Progress 
                                          value={application.completeness_percentage || 0} 
                                          className="h-2 bg-gray-200" 
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          {application.completeness_percentage >= 80 
                                            ? 'Strong application - ready for matching' 
                                            : application.completeness_percentage >= 60 
                                            ? 'Good progress - add more details' 
                                            : 'Needs improvement - complete missing sections'
                                          }
                                        </p>
                                      </div>

                                      {/* Application Details */}
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {application.has_documents && (
                                          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Documents uploaded
                                          </Badge>
                                        )}
                                        {application.matched_lenders && application.matched_lenders.length > 0 && (
                                          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                                            <Users className="h-3 w-3 mr-1" />
                                            {application.matched_lenders.length} lender{application.matched_lenders.length !== 1 ? 's' : ''} matched
                                          </Badge>
                                        )}
                                        {application.offers && application.offers.length > 0 && (
                                          <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {application.offers.length} offer{application.offers.length !== 1 ? 's' : ''}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Dates */}
                                      <div className="text-xs text-gray-500">
                                        <div className="flex items-center gap-4">
                                          <span>Applied: {format(new Date(application.application_date), 'MMM d, yyyy')}</span>
                                          {application.expires_at && (
                                            <span className="text-amber-600">
                                              Expires: {format(new Date(application.expires_at), 'MMM d, yyyy')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Section - Actions */}
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                                  <Button 
                                    asChild 
                                    className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-sm group"
                                  >
                                    <Link to={`/applications/${application.id}`}>
                                      <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                      View Details
                                    </Link>
                                  </Button>
                                  
                                  {application.status === 'draft' && (
                                    <Button 
                                      asChild 
                                      variant="outline" 
                                      className="border-[#ff8000]/30 text-[#ff8000] hover:bg-[#ff8000]/5"
                                    >
                                      <Link to={`/applications/${application.id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Continue
                                      </Link>
                                    </Button>
                                  )}
                                  
                                  {application.offers && application.offers.length > 0 && (
                                    <Button 
                                      asChild 
                                      variant="outline" 
                                      className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                      <Link to={`/applications/${application.id}/offers`}>
                                        <Star className="h-4 w-4 mr-2" />
                                        View Offers
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {completedApplications.length > 0 && (
                <div>
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-200/20 rounded-lg border border-slate-200/30">
                            <CheckCircle className="h-5 w-5 text-slate-200" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">Completed Applications</CardTitle>
                            <CardDescription className="text-gray-200">
                              {completedApplications.length} application{completedApplications.length !== 1 ? 's' : ''} finished
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-slate-200/20 text-slate-200 border-slate-200/30">
                          {completedApplications.length} Complete
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {completedApplications.map((application) => (
                        <div key={application.id} className="group">
                          <Card className="border border-slate-200/60 hover:border-slate-400/40 transition-all duration-300 hover:shadow-md bg-gradient-to-r from-white to-slate-50/30">
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Left Section - Application Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl border shrink-0 ${
                                      application.status === 'approved' || application.status === 'funded' 
                                        ? 'bg-green-100 border-green-200' 
                                        : application.status === 'rejected' || application.status === 'declined'
                                        ? 'bg-red-100 border-red-200'
                                        : 'bg-slate-100 border-slate-200'
                                    }`}>
                                      {application.status === 'approved' || application.status === 'funded' ? (
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                      ) : application.status === 'rejected' || application.status === 'declined' ? (
                                        <XCircle className="h-6 w-6 text-red-600" />
                                      ) : (
                                        <FileText className="h-6 w-6 text-slate-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                          Application #{application.application_number}
                                        </h3>
                                        <Badge 
                                          variant="outline" 
                                          className={`
                                            ${application.status === 'approved' || application.status === 'funded' 
                                              ? 'bg-green-50 text-green-700 border-green-200' 
                                              : application.status === 'rejected' || application.status === 'declined'
                                              ? 'bg-red-50 text-red-700 border-red-200'
                                              : 'bg-slate-50 text-slate-700 border-slate-200'}
                                          `}
                                        >
                                          {application.status === 'approved' ? 'Approved' : 
                                           application.status === 'funded' ? 'Funded' : 
                                           application.status === 'rejected' ? 'Rejected' : 
                                           application.status === 'declined' ? 'Declined' : 
                                           application.status === 'cancelled' ? 'Cancelled' : 
                                           application.status === 'withdrawn' ? 'Withdrawn' : 
                                           application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4 text-green-600" />
                                          <span className="font-medium">
                                            £{application.loan_amount?.toLocaleString() || 'Not specified'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-blue-600" />
                                          <span>
                                            {application.loan_term_months || 'Not specified'} months
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Building className="h-4 w-4 text-purple-600" />
                                          <span className="truncate">
                                            {application.purpose || 'Purpose not specified'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Application Details */}
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {application.offers && application.offers.length > 0 && (
                                          <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {application.offers.length} offer{application.offers.length !== 1 ? 's' : ''} received
                                          </Badge>
                                        )}
                                        {application.matched_lenders && application.matched_lenders.length > 0 && (
                                          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                                            <Users className="h-3 w-3 mr-1" />
                                            {application.matched_lenders.length} lender{application.matched_lenders.length !== 1 ? 's' : ''} matched
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Dates */}
                                      <div className="text-xs text-gray-500">
                                        <div className="flex items-center gap-4">
                                          <span>Applied: {format(new Date(application.application_date), 'MMM d, yyyy')}</span>
                                          {application.status_updated_at && (
                                            <span>
                                              Completed: {format(new Date(application.status_updated_at), 'MMM d, yyyy')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Section - Actions */}
                                <div className="flex flex-col gap-2 shrink-0">
                                  <Button 
                                    asChild 
                                    variant="outline"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                  >
                                    <Link to={`/applications/${application.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Link>
                                  </Button>
                                  
                                  {application.status === 'funded' && (
                                    <Button 
                                      asChild 
                                      variant="outline" 
                                      className="border-green-200 text-green-700 hover:bg-green-50"
                                    >
                                      <Link to={`/applications/${application.id}/funding-details`}>
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Funding Details
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Applications;
