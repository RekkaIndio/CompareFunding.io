import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Star, Edit3 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { useTour } from '@/contexts/TourContext';
import { useDashboardData } from './hooks';
import { 
  DashboardHeader, 
  NewApplicationCard, 
  ActiveApplications, 
  ApplicationsWithOffers, 
  DraftApplications, 
  DashboardLoading,
  DeclineFeedbackCard
} from './components';

const BusinessDashboard = () => {
  const { showNavbar } = useNavbar();
  const { startTour } = useTour();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');

  const {
    businessProfile,
    applications,
    offers,
    notifications,
    overallDashboardLoading,
    uploadedDocuments,
    documentsLoading,
    refreshDashboardData
  } = useDashboardData();

  // Ensure navbar is visible when component mounts
  useEffect(() => {
    showNavbar();
  }, [showNavbar]);

  // Handle tour start from URL parameter
  useEffect(() => {
    if (searchParams.get('tour') === 'start' && !overallDashboardLoading) {
      // Small delay to ensure components are rendered
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour, overallDashboardLoading]);

  const getTabCounts = () => {
    const activeApplications = applications.filter(app => {
      const status = app.status?.toLowerCase?.();
      return ['submitted', 'under_review', 'documents_requested'].includes(status);
    });

    const applicationsWithOffers = applications.filter(app => {
      const applicationOffers = offers.filter(offer => offer.application_id === app.id);
      const hasOffers = applicationOffers.length > 0;
      const isApprovedOrOffered = ['approved', 'offered', 'funded', 'accepted'].includes(app.status?.toLowerCase?.());
      return hasOffers || isApprovedOrOffered;
    });

    const draftApplications = applications.filter(app => app.status === 'draft');

    return {
      active: activeApplications.length,
      offers: applicationsWithOffers.length,
      drafts: draftApplications.length
    };
  };

  // Main component return
  if (overallDashboardLoading) {
    return <DashboardLoading />;
  }

  const tabCounts = getTabCounts();

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Professional Header */}
        <DashboardHeader businessProfile={businessProfile} />

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Applications Section with Tabs */}
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col space-y-6">
                {/* Tab Headers */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Applications</h2>
                    <p className="text-gray-600">Track and manage all your funding applications</p>
                  </div>
                  <TabsList className="grid w-full max-w-md grid-cols-3">

                     <TabsTrigger value="offers" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Offers ({tabCounts.offers})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Active ({tabCounts.active})
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Drafts ({tabCounts.drafts})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    
                    <TabsContent value="offers" className="mt-0">
                      <ApplicationsWithOffers applications={applications} offers={offers} />
                    </TabsContent>

                    <TabsContent value="active" className="mt-0">
                      <ActiveApplications applications={applications} />
                    </TabsContent>
                    
                    <TabsContent value="drafts" className="mt-0">
                      <DraftApplications applications={applications} />
                    </TabsContent>
                  </div>
                  
                  {/* Sidebar with New Application Card and Decline Feedback */}
                  <div className="lg:col-span-1 space-y-6">
                    <NewApplicationCard />
                    <DeclineFeedbackCard 
                      notifications={notifications} 
                      applications={applications} 
                    />
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessDashboard;
