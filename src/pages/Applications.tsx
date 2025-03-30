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

export type Application = {
  id: string;
  application_number: string;
  loan_amount: number;
  loan_term_months: number;
  purpose: string;
  status: string;
  application_date: string;
  expires_at: string | null;
  matched_lenders: string[] | null;
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

        // Sort the applications in memory instead
        const processedData = (data || [])
          .map(app => ({
            ...app,
            application_date: app.application_date || app.created_at || new Date().toISOString(),
            status: app.status || 'draft'
          }))
          .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());
        
        console.log('Processed applications data:', processedData);
        return processedData as Application[];
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    enabled: !!user?.uid,
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

  // Add businessProfile to fetch logo
  const { data: businessProfile } = useQuery({
    queryKey: ['businessProfile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const { data, error } = await getDocument('business_profiles', user?.uid);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid
  });

  return (
    <PageLayout>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Applications</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your financing applications
            </p>
          </div>
          <Button asChild className="bg-fundhub-blue hover:bg-fundhub-blue/90">
            <Link to="/applications/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Application
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-gray-100">
                <CardContent className="pt-6"></CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 flex items-center">
              <AlertCircle className="text-red-500 mr-2" />
              <span>There was an error loading your applications. Please try again later.</span>
            </CardContent>
          </Card>
        ) : applications?.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No applications found</CardTitle>
              <CardDescription>
                Get started by creating your first funding application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                <Link to="/applications/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Application
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeApplications.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Active Applications</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {activeApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      id={application.id}
                      amount={application.loan_amount}
                      purpose={application.purpose}
                      status={application.status}
                      dateApplied={new Date(application.application_date).toLocaleDateString()}
                      term={`${application.loan_term_months} months`}
                      offersCount={application.matched_lenders?.length || 0}
                      business_name={businessProfile?.business_name}
                      logo_url={businessProfile?.logo_url}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedApplications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Past Applications</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {completedApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      id={application.id}
                      amount={application.loan_amount}
                      purpose={application.purpose}
                      status={application.status}
                      dateApplied={new Date(application.application_date).toLocaleDateString()}
                      term={`${application.loan_term_months} months`}
                      offersCount={application.matched_lenders?.length || 0}
                      business_name={businessProfile?.business_name}
                      logo_url={businessProfile?.logo_url}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Applications;
