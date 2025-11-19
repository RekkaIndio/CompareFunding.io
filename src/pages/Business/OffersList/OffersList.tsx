import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbar } from '@/contexts/NavbarContext';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InboxIcon, Users, Target, ArrowRight, Clock, Archive } from 'lucide-react';
import {
  IndividualOfferCard,
  ApplicationOffersCard,
  useOffersData,
  Offer,
  GroupedOffers
} from './index';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { getDocuments, deleteDocument } from '@/firebase';

const OffersList = () => {
  const { user } = useAuth();
  const { showNavbar } = useNavbar();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');
  const isLender = user?.role === 'lender';
  

  
  // Cleanup function to remove any existing declined offers
  const cleanupDeclinedOffers = async () => {
    try {
      console.log('Checking for declined offers to clean up...');
      
      // Get all declined offers
      const { data: declinedOffers, error } = await getDocuments(
        'offers',
        [{ field: 'status', operator: '==', value: 'declined' }]
      );
      
      if (error) {
        console.error('Error fetching declined offers:', error);
        return;
      }
      
      if (!declinedOffers || declinedOffers.length === 0) {
        console.log('No declined offers found to clean up');
        return;
      }
      
      console.log(`Found ${declinedOffers.length} declined offers to delete`);
      
      // Delete each declined offer
      for (const offer of declinedOffers) {
        try {
          const { error: deleteError } = await deleteDocument('offers', offer.id);
          if (deleteError) {
            console.error(`Error deleting declined offer ${offer.id}:`, deleteError);
          } else {
            console.log(`Deleted declined offer ${offer.id}`);
          }
        } catch (err) {
          console.error(`Exception deleting declined offer ${offer.id}:`, err);
        }
      }
      
      console.log('Declined offers cleanup completed');
    } catch (err) {
      console.error('Exception during declined offers cleanup:', err);
    }
  };
  
  // Ensure navbar is visible when component mounts
  useEffect(() => {
    showNavbar();
  }, [showNavbar]);
  
  // Clean up declined offers when component mounts (one-time cleanup)
  useEffect(() => {
    if (user?.uid) {
      cleanupDeclinedOffers();
    }
  }, [user?.uid]);
  
  // Get application parameter from URL for scrolling
  const targetApplicationId = searchParams.get('application');

  // Fetch offers data
  const { data: offers, isLoading } = useOffersData();
  

  
  // Group offers by application_id for businesses, or keep individual for lenders
  const groupOffersByApplication = (offersList: Offer[]) => {
    if (isLender) {
      // For lenders, return individual offers as before
      return offersList;
    }
    
    // For businesses, group offers by application_id
    const grouped: GroupedOffers = {};
    
    offersList.forEach(offer => {
      const appId = offer.application_id;
      if (!grouped[appId]) {
        grouped[appId] = {
          application_details: offer.applications ? {
            id: offer.applications.id,
            application_number: offer.applications.application_number,
            loan_amount: offer.applications.loan_amount,
            loan_term_months: offer.applications.loan_term_months,
            purpose: offer.applications.purpose,
            status: offer.applications.status,
            business_logo_url: offer.applications.business_logo_url,
            business_name: offer.applications.business_name
          } : {
            id: appId,
            application_number: undefined,
            loan_amount: 0,
            loan_term_months: 0,
            purpose: 'Unknown',
            status: 'unknown',
            business_logo_url: '',
            business_name: ''
          },
          offers: []
        };
      }
      grouped[appId].offers.push(offer);
    });
    
    // Sort offers within each group by interest rate (best rate first)
    Object.values(grouped).forEach(group => {
      group.offers.sort((a, b) => (a.interest_rate || 999) - (b.interest_rate || 999));
    });
    
    return grouped;
  };

  // Filter offers based on user role - different logic for businesses vs lenders
  let activeOffers: Offer[] = [];
  let historicalOffers: Offer[] = [];
  
  if (isLender) {
    // For lenders: Use simple offer-level status filtering
    // Note: declined offers are deleted, so they won't appear in queries
    activeOffers = offers?.filter(offer => 
      ['pending', 'accepted', 'negotiating', 'no-offers'].includes(offer.status)
    ) || [];
    
    historicalOffers = offers?.filter(offer => 
      ['expired', 'withdrawn', 'completed'].includes(offer.status)
    ) || [];
  } else {
    // For businesses: Use application-level logic to determine active vs historical
    // First group the offers by application
    const grouped: GroupedOffers = {};
    
    (offers || []).forEach(offer => {
      const appId = offer.application_id;
      if (!grouped[appId]) {
        grouped[appId] = {
          application_details: offer.applications ? {
            id: offer.applications.id,
            application_number: offer.applications.application_number,
            loan_amount: offer.applications.loan_amount,
            loan_term_months: offer.applications.loan_term_months,
            purpose: offer.applications.purpose,
            status: offer.applications.status,
            business_logo_url: offer.applications.business_logo_url,
            business_name: offer.applications.business_name,
            expires_at: offer.applications.expires_at // Get expires_at from application
          } : {
            id: appId,
            application_number: undefined,
            loan_amount: 0,
            loan_term_months: 0,
            purpose: 'Unknown',
            status: 'unknown',
            business_logo_url: '',
            business_name: '',
            expires_at: undefined
          },
          offers: []
        };
      }
      grouped[appId].offers.push(offer);
    });
    
    // Now categorize each application as active or historical
    Object.entries(grouped).forEach(([applicationId, groupData]) => {
      const { application_details, offers: appOffers } = groupData;
      
      // Check if application is expired
      const isApplicationExpired = application_details.expires_at && 
        new Date(application_details.expires_at) < new Date();
      
      // Check if all real offers (excluding no-offers placeholders) are in terminal states
      // Note: declined offers are deleted, so they won't appear in this check
      const realOffers = appOffers.filter(offer => offer.status !== 'no-offers');
      const allOffersTerminal = realOffers.length > 0 && 
        realOffers.every(offer => ['expired', 'withdrawn', 'completed', 'closed'].includes(offer.status));
      
      // Check if all accepted offers have been closed/completed
      const acceptedOffers = appOffers.filter(offer => offer.status === 'accepted');
      const allAcceptedOffersClosed = acceptedOffers.length > 0 && 
        acceptedOffers.every(offer => offer.deal_status === 'closed' || offer.deal_status === 'completed');
      
      // Application is historical if:
      // 1. Application itself has expired, OR  
      // 2. All real offers are terminal AND application status indicates it's closed, OR
      // 3. All accepted offers have been explicitly closed by both parties
      const isHistorical = isApplicationExpired || 
        (allOffersTerminal && ['completed', 'funded', 'closed', 'expired'].includes(application_details.status)) ||
        (acceptedOffers.length > 0 && allAcceptedOffersClosed);
      
      // Add all offers from this application to appropriate category
      if (isHistorical) {
        historicalOffers.push(...appOffers);
      } else {
        activeOffers.push(...appOffers);
      }
    });
  }

  // Group offers for businesses
  const groupedActiveOffers = groupOffersByApplication(activeOffers);
  const groupedHistoricalOffers = groupOffersByApplication(historicalOffers);
  
  // For businesses, check if there are any applications at all (including those with no offers)
  // For lenders, check if there are actual offers
  const isEmptyActiveOffers = isLender 
    ? activeOffers.length === 0 
    : Object.keys(groupedActiveOffers).length === 0;
  
  const isEmptyHistoricalOffers = isLender 
    ? historicalOffers.length === 0 
    : Object.keys(groupedHistoricalOffers).length === 0;
  
  // Scroll to target application if specified in URL parameters
  useEffect(() => {
    if (targetApplicationId && !isLoading && offers && offers.length > 0) {
      // Small delay to ensure the DOM is rendered
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`application-${targetApplicationId}`);
        if (targetElement) {
          // Get the header height for offset calculation (assume a fixed header of ~80px)
          const headerOffset = 80;
          
          // Get the element's position
          const elementPosition = targetElement.getBoundingClientRect().top;
          // Get the current scroll position
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          // Scroll to the element with offset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Add a highlight effect
          targetElement.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.5)';
          targetElement.style.transition = 'box-shadow 0.3s ease-in-out';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            targetElement.style.boxShadow = '';
          }, 3000);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [targetApplicationId, isLoading, offers]);
  
  // Get the title and description based on user role
  const getTitle = () => {
    return isLender ? "Offers Extended" : "Your Funding Offers";
  };
  
  const getDescription = () => {
    return isLender 
      ? "Manage financing offers you've extended to businesses" 
      : "Compare and manage funding offers from lenders";
  };

  // Main render return for OffersList component
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#212936] mb-2">
                {getTitle()}
              </h1>
              <p className="text-gray-600 text-lg">
                {getDescription()}
              </p>
            </div>
            {isLender && (
              <Button asChild className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                <Link to="/matched-applications">
                  Find Applications
                </Link>
              </Button>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200 bg-white rounded-t-lg">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'active'
                      ? 'border-[#ff8800] text-[#ff8800]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Offers
                  {activeOffers.length > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === 'active' 
                        ? 'bg-[#ff8800] text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isLender ? activeOffers.length : Object.keys(groupedActiveOffers).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('historical')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'historical'
                      ? 'border-[#ff8800] text-[#ff8800]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Historical Offers
                  {historicalOffers.length > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === 'historical' 
                        ? 'bg-[#ff8800] text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isLender ? historicalOffers.length : Object.keys(groupedHistoricalOffers).length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p>Loading offers...</p>
              </div>
            ) : !offers || offers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-center max-w-md mx-auto">
                  <div className="mb-8">
                    <InboxIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {isLender ? "No Offers Extended Yet" : "No Funding Offers Yet"}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                      {isLender 
                        ? "You haven't extended any offers to businesses yet. Browse available applications to get started." 
                        : "You don't have any funding offers because you haven't created any applications yet. Start by creating your first funding application to receive offers from lenders."
                      }
                    </p>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg"
                    className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-xl"
                  >
                    <Link to={isLender ? "/matched-applications" : "/applications/new"} className="flex items-center gap-2">
                      {isLender ? (
                        <>
                          <Users className="h-6 w-6" />
                          Browse Applications
                          <ArrowRight className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          <Target className="h-6 w-6" />
                          Create Your First Application
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Link>
                  </Button>
                  
                  {!isLender && (
                    <p className="text-sm text-gray-500 mt-4">
                      Creating an application takes just a few minutes and connects you with multiple lenders
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show content based on active tab */}
                {activeTab === 'active' ? (
                  // Active offers
                  isEmptyActiveOffers ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-center max-w-md mx-auto">
                        <div className="mb-6">
                          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Active Offers
                          </h3>
                          <p className="text-gray-600">
                            {isLender 
                              ? "You don't have any active offers at the moment." 
                              : "You don't have any active offers. Check back later or create a new application."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLender ? (
                        // Lender view: Show individual active offers
                        activeOffers.map((offer) => (
                          <IndividualOfferCard 
                            key={offer.id} 
                            offer={offer} 
                          />
                        ))
                      ) : (
                        // Business view: Show grouped active offers by application
                        Object.entries(groupedActiveOffers as GroupedOffers).map(([applicationId, groupData]) => (
                          <ApplicationOffersCard 
                            key={applicationId} 
                            applicationId={applicationId} 
                            groupData={groupData} 
                            id={`application-${applicationId}`}
                          />
                        ))
                      )}
                    </>
                  )
                ) : (
                  // Historical offers
                  isEmptyHistoricalOffers ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-center max-w-md mx-auto">
                        <div className="mb-6">
                          <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Historical Offers
                          </h3>
                          <p className="text-gray-600">
                            {isLender 
                              ? "You don't have any completed, expired, or withdrawn offers yet." 
                              : "You don't have any completed, expired, or withdrawn offers yet."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLender ? (
                        // Lender view: Show individual historical offers
                        historicalOffers.map((offer) => (
                          <IndividualOfferCard 
                            key={offer.id} 
                            offer={offer} 
                            isHistorical={true} 
                          />
                        ))
                      ) : (
                        // Business view: Show grouped historical offers by application
                        Object.entries(groupedHistoricalOffers as GroupedOffers).map(([applicationId, groupData]) => (
                          <ApplicationOffersCard 
                            key={applicationId} 
                            applicationId={applicationId} 
                            groupData={groupData} 
                            isHistorical={true}
                            id={`application-${applicationId}`}
                          />
                        ))
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default OffersList;
