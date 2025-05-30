import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments, getDocument } from "@/firebase";
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/PageLayout';
import ApplicationCard from '@/components/ApplicationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
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
    console.log('Current user:', user);
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
        console.log('Found business profile in businesses collection');
        return { ...businessesResult.data, _source: 'businesses' };
      }
      // If not found, try business_profiles collection
      const profilesResult = await getDocument('business_profiles', user?.uid);
      if (profilesResult.error) throw profilesResult.error;
      if (profilesResult.data) {
        console.log('Found business profile in business_profiles collection');
        return { ...profilesResult.data, _source: 'business_profiles' };
      }
      console.log('No business profile found in either collection');
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
      
      console.log('Fetching applications for user:', user.uid);
      
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
          console.log('No applications found for user');
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
        
        console.log('Processed applications data:', processedData);
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
      console.log('Applications data:', applications);
      console.log('Active applications:', activeApplications);
      console.log('Completed applications:', completedApplications);
      console.log('Statuses:', applications.map(app => app.status));
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container px-6 py-8 mx-auto">
          {/* Main Header Section */}
          <div className="bg-[#212936] text-white rounded-xl p-6 sm:p-8 mb-8 shadow-xl border-b-2 border-[#ff8000] flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">Your Applications</h1>
              <p className="text-gray-200 text-base sm:text-lg">
                Manage and track your business funding applications
              </p>
            </div>
            <Button asChild className="mt-4 md:mt-0 bg-[#ff8000] hover:bg-[#ff8000]/90 shadow-md text-white">
              <Link to="/applications/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Application
              </Link>
            </Button>
          </div>

          {/* Application Summary - New Component */}
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
            <CardHeader className="bg-[#212936] text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-[#ff8000]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
                <span className="text-white">Applications Summary</span>
              </CardTitle>
              <CardDescription className="text-gray-200">
                Overview of your current funding applications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {isLoading ? (
                      <div className="h-8 w-16 mx-auto bg-blue-200 animate-pulse rounded"></div>
                    ) : (
                      applications?.length || 0
                    )}
                  </div>
                  <p className="text-blue-600 font-medium">Total Applications</p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {isLoading ? (
                      <div className="h-8 w-16 mx-auto bg-amber-200 animate-pulse rounded"></div>
                    ) : (
                      activeApplications?.length || 0
                    )}
                  </div>
                  <p className="text-amber-600 font-medium">Active Applications</p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {isLoading ? (
                      <div className="h-8 w-16 mx-auto bg-green-200 animate-pulse rounded"></div>
                    ) : (
                      applications?.filter(app => app.matched_lenders?.length > 0).length || 0
                    )}
                  </div>
                  <p className="text-green-600 font-medium">With Lender Matches</p>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">Application Progress</h3>
                  <Button 
                    variant="outline" 
                    className="text-xs h-8 border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white"
                    onClick={() => window.location.href = '/business/documents'}
                  >
                    Manage Documents
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1 mb-3">
                  Complete your profile to improve application strength
                </p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Business Profile</span>
                      <span className="font-medium">{businessProfile ? '✓ Complete' : 'Incomplete'}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${businessProfile ? 'bg-green-500' : 'bg-amber-400'}`} 
                           style={{ width: businessProfile ? '100%' : '30%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Financial Documents</span>
                      <span className="font-medium">
                        {applications?.some(app => app.has_documents) ? 
                          '✓ Uploaded' : 'Upload Required'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${applications?.some(app => app.has_documents) ? 'bg-green-500' : 'bg-amber-400'}`} 
                           style={{ width: applications?.some(app => app.has_documents) ? '100%' : '0%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span>Credit Score</span>
                      <span className="font-medium">
                        {businessProfile?.credit_info?.credit_score ? 
                          '✓ Available' : 'Check Required'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${businessProfile?.credit_info?.credit_score ? 'bg-green-500' : 'bg-amber-400'}`} 
                           style={{ width: businessProfile?.credit_info?.credit_score ? '100%' : '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <CardHeader className="bg-[#212936] text-white">
                      <CardTitle className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-[#ff8000]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                        </svg>
                        <span className="text-white">Active Applications</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Applications currently in progress or under review
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {activeApplications.map((application) => (
                        <Link to={`/applications/${application.id}`} key={application.id} className="block">
                          <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              {/* Status Indicator */}
                              <div className={`
                                w-full md:w-2 
                                ${application.status === 'draft' ? 'bg-amber-400' : 
                                  application.status === 'submitted' ? 'bg-blue-500' : 
                                  application.status === 'matching' ? 'bg-purple-500' : 
                                  application.status === 'matched' ? 'bg-green-500' : 'bg-slate-400'}
                              `}></div>
                              
                              <div className="flex flex-col md:flex-row flex-grow p-4 md:p-5">
                                {/* Left Column: Application Details */}
                                <div className="flex-grow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-[#212936]">
                                      £{application.loan_amount?.toLocaleString() || '0'}
                                    </h3>
                                    <div className={`
                                      px-2 py-1 rounded-full text-xs font-medium
                                      ${application.status === 'draft' ? 'bg-amber-100 text-amber-700' : 
                                        application.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 
                                        application.status === 'matching' ? 'bg-purple-100 text-purple-700' : 
                                        application.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}
                                    `}>
                                      {application.status === 'draft' ? 'Draft' : 
                                       application.status === 'submitted' ? 'Submitted' : 
                                       application.status === 'matching' ? 'Matching' : 
                                       application.status === 'matched' ? 'Matched' : 
                                       application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </div>
                                  </div>
                                  
                                  <p className="text-slate-700 mb-2 line-clamp-1">
                                    {application.purpose}
                                  </p>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                      </svg>
                                      <span>Applied: {new Date(application.application_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                      <span>Term: {application.loan_term_months} months</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                      </svg>
                                      <span>Type: {application.loan_type?.replace('_', ' ') || 'Standard'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                      </svg>
                                      <span>Lenders: {application.matched_lenders?.length || 0}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right Column: Action Area */}
                                <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:ml-4 pt-3 md:pt-0 border-t md:border-t-0 mt-3 md:mt-0">
                                  {application.status === 'draft' ? (
                                    <Button 
                                      asChild 
                                      size="sm"
                                      className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 shadow-sm"
                                    >
                                      <Link to={`/applications/${application.id}/review`}>
                                        Complete Draft
                                      </Link>
                                    </Button>
                                  ) : (
                                    <>
                                      {application.matched_lenders && application.matched_lenders.length > 0 ? (
                                        <div className="flex flex-col items-center md:items-end">
                                          <span className="text-green-600 text-sm font-medium mb-1">
                                            {application.matched_lenders.length} {application.matched_lenders.length === 1 ? 'Lender' : 'Lenders'}
                                          </span>
                                          <Button
                                            asChild
                                            size="sm"
                                            className="bg-[#212936] hover:bg-[#212936]/90 border-b border-[#ff8000] shadow-sm"
                                          >
                                            <Link to={`/applications/${application.id}`}>
                                              View Matches
                                            </Link>
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button 
                                          asChild 
                                          size="sm"
                                          variant="outline" 
                                          className="border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white shadow-sm"
                                        >
                                          <Link to={`/applications/${application.id}`}>
                                            View Details
                                          </Link>
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* Application Strength Indicator */}
                                  <div className="flex items-center mt-2" title="Application Strength">
                                    <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          !application.completeness_percentage || application.completeness_percentage < 50 ? 'bg-amber-500' : 
                                          application.completeness_percentage < 75 ? 'bg-yellow-500' : 
                                          application.completeness_percentage < 100 ? 'bg-green-500' : 
                                          'bg-green-500'
                                        }`}
                                        style={{ width: `${application.completeness_percentage || 50}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {application.completeness_percentage || 50}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {completedApplications.length > 0 && (
                <div>
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg overflow-hidden">
                    <CardHeader className="bg-[#212936] text-white">
                      <CardTitle className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-[#ff8000]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <span className="text-white">Past Applications</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Completed, funded or declined applications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {completedApplications.map((application) => (
                        <Link to={`/applications/${application.id}`} key={application.id} className="block">
                          <div className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              {/* Status Indicator */}
                              <div className={`
                                w-full md:w-2 
                                ${application.status === 'approved' || application.status === 'funded' ? 'bg-green-500' : 
                                  application.status === 'rejected' || application.status === 'declined' ? 'bg-red-500' : 
                                  application.status === 'cancelled' || application.status === 'withdrawn' ? 'bg-slate-500' : 
                                  'bg-slate-400'}
                              `}></div>
                              
                              <div className="flex flex-col md:flex-row flex-grow p-4 md:p-5">
                                {/* Left Column: Application Details */}
                                <div className="flex-grow">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-[#212936]">
                                      £{application.loan_amount?.toLocaleString() || '0'}
                                    </h3>
                                    <div className={`
                                      px-2 py-1 rounded-full text-xs font-medium
                                      ${application.status === 'approved' || application.status === 'funded' ? 'bg-green-100 text-green-700' : 
                                        application.status === 'rejected' || application.status === 'declined' ? 'bg-red-100 text-red-700' : 
                                        application.status === 'cancelled' || application.status === 'withdrawn' ? 'bg-slate-100 text-slate-700' : 
                                        'bg-slate-100 text-slate-700'}
                                    `}>
                                      {application.status === 'approved' ? 'Approved' : 
                                       application.status === 'funded' ? 'Funded' : 
                                       application.status === 'rejected' ? 'Rejected' : 
                                       application.status === 'declined' ? 'Declined' : 
                                       application.status === 'cancelled' ? 'Cancelled' : 
                                       application.status === 'withdrawn' ? 'Withdrawn' : 
                                       application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </div>
                                  </div>
                                  
                                  <p className="text-slate-700 mb-2 line-clamp-1">
                                    {application.purpose}
                                  </p>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                      </svg>
                                      <span>Applied: {new Date(application.application_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                      <span>Term: {application.loan_term_months} months</span>
                                    </div>
                                    <div className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                      </svg>
                                      <span>{application.loan_type?.replace('_', ' ') || 'Standard'}</span>
                                    </div>
                                    {application.offers && application.offers.length > 0 && (
                                      <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 text-[#212936]">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15M4.5 4.5h16.5" />
                                        </svg>
                                        <span>Offers: {application.offers.length}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Right Column: Status and Action */}
                                <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:ml-4 pt-3 md:pt-0 border-t md:border-t-0 mt-3 md:mt-0">
                                  <Button 
                                    asChild 
                                    size="sm"
                                    variant="outline" 
                                    className="border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white shadow-sm"
                                  >
                                    <Link to={`/applications/${application.id}`}>
                                      View Details
                                    </Link>
                                  </Button>
                                  
                                  {/* Completion Date */}
                                  <div className="mt-2 text-xs text-slate-500">
                                    {application.status_updated_at ? (
                                      <span>Completed: {new Date(application.status_updated_at).toLocaleDateString()}</span>
                                    ) : (
                                      <span>&nbsp;</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
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
