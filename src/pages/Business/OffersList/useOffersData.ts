import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getDocuments, getDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Offer } from './types';

// Helper function to deduplicate offers by lender_id, keeping only the most recent offer per lender
const deduplicateOffersByLender = (offers: any[]): any[] => {
  const lenderOfferMap = new Map();
  
  offers.forEach(offer => {
    const lenderId = offer.lender_id;
    
    // Skip if no lender_id (shouldn't happen for real offers)
    if (!lenderId) return;
    
    const existingOffer = lenderOfferMap.get(lenderId);
    
    if (!existingOffer) {
      // First offer from this lender
      lenderOfferMap.set(lenderId, offer);
    } else {
      // Compare offers and keep the better one
      // Priority: 1. Most recent created_at, 2. Best interest rate, 3. Highest offered amount
      const currentDate = new Date(offer.created_at).getTime();
      const existingDate = new Date(existingOffer.created_at).getTime();
      
      let shouldReplace = false;
      
      if (currentDate > existingDate) {
        // Current offer is more recent
        shouldReplace = true;
      } else if (currentDate === existingDate) {
        // Same date, compare by interest rate (lower is better)
        if (offer.interest_rate < existingOffer.interest_rate) {
          shouldReplace = true;
        } else if (offer.interest_rate === existingOffer.interest_rate) {
          // Same rate, compare by offered amount (higher is better)
          if (offer.offered_amount > existingOffer.offered_amount) {
            shouldReplace = true;
          }
        }
      }
      
      if (shouldReplace) {
        lenderOfferMap.set(lenderId, offer);
      }
    }
  });
  
  return Array.from(lenderOfferMap.values());
};

// Helper function to deduplicate offers by application_id for lenders, keeping only the most recent offer per application
const deduplicateOffersByApplication = (offers: any[]): any[] => {
  const applicationOfferMap = new Map();
  
  offers.forEach(offer => {
    const applicationId = offer.application_id;
    
    if (!applicationId) return;
    
    const existingOffer = applicationOfferMap.get(applicationId);
    
    if (!existingOffer) {
      // First offer for this application
      applicationOfferMap.set(applicationId, offer);
    } else {
      // Compare offers and keep the more recent one
      const currentDate = new Date(offer.created_at).getTime();
      const existingDate = new Date(existingOffer.created_at).getTime();
      
      if (currentDate > existingDate) {
        applicationOfferMap.set(applicationId, offer);
      }
    }
  });
  
  return Array.from(applicationOfferMap.values());
};

export const useOffersData = () => {
  const { user } = useAuth();
  const isLender = user?.role === 'lender';

  return useQuery({
    queryKey: ['offers', user?.uid, isLender],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      if (isLender) {
        // For lenders: Get all offers created by this lender
        const { data: lenderOffers, error: offerError } = await getDocuments(
          'offers',
          [{ field: 'lender_id', operator: '==', value: user.uid }],
          [{ field: 'created_at', direction: 'desc' }]
        );
        
        if (offerError) {
          toast.error('Failed to load your offers');
          throw offerError;
        }
        
        // Filter out declined offers
        const activeOffers = lenderOffers?.filter(offer => offer.status !== 'declined') || [];
        
        // Enhance with business and application details
        if (activeOffers && activeOffers.length > 0) {
          // Get lender's own details first
          let lenderName = 'Your Company';
          let lenderLogo = '';
          
          try {
            // Try to get from lenders collection first
            const { data: lenderData } = await getDocument('lenders', user.uid);
            if (lenderData) {
              lenderName = lenderData.company_name || lenderData.name || 'Your Company';
              lenderLogo = lenderData.logo_url || lenderData.company_logo || '';
            } else {
              // Fallback to users collection
              const { data: userData } = await getDocument('users', user.uid);
              if (userData) {
                lenderName = userData.company_name || userData.displayName || 'Your Company';
                lenderLogo = userData.photoURL || '';
              }
            }
          } catch (error) {
            console.warn('Could not fetch lender details:', error);
          }
          
          const enhancedOffers = await Promise.all(
            activeOffers.map(async (offer) => {
              // Get application details
              const { data: application } = await getDocuments(
                'applications',
                [{ field: 'id', operator: '==', value: offer.application_id }]
              );
              
              let businessName = 'Unknown business';
              let businessId = '';
              
              // Get business details if we have application
              if (application && application[0]) {
                businessId = application[0].business_id || application[0].user_id || '';
                
                if (businessId) {
                  try {
                    const { data: businessData } = await getDocument('users', businessId);
                    if (businessData) {
                      businessName = businessData.company_name || businessData.displayName || 'Unknown business';
                    }
                  } catch (error) {
                    console.warn('Could not fetch business details:', error);
                  }
                }
              }
              
              return {
                ...offer,
                lender_name: lenderName,
                company_logo: lenderLogo,
                business_name: businessName,
                business_id: businessId,
                application: application?.[0] || null
              };
            })
          );
          
          // Deduplicate offers by application_id to ensure only one offer per application
          const deduplicatedOffers = deduplicateOffersByApplication(enhancedOffers);
          
          // Additional safety filter to ensure no declined offers are returned
          const filteredOffers = deduplicatedOffers.filter(offer => offer.status !== 'declined');
          
          return filteredOffers as Offer[];
        }
        
        return activeOffers as Offer[];
      } else {
        // For businesses: Get offers for this business's applications
        const { data: applications, error: appError } = await getDocuments(
          'applications',
          [{ field: 'user_id', operator: '==', value: user?.uid }]
        );
        
        if (appError) {
          toast.error('Failed to load applications');
          throw appError;
        }
        
        if (!applications || applications.length === 0) {
          // No applications, so no offers
          return [];
        }
        
        // Get application IDs
        const applicationIds = applications.map(app => app.id);
        
        // Get offers for these applications and include applications without offers
        const allOffers: any[] = [];
        const applicationsWithOffers = new Set<string>();
        
        for (const appId of applicationIds) {
          const { data: appOffers, error: offersError } = await getDocuments(
            'offers',
            [{ field: 'application_id', operator: '==', value: appId }],
            [{ field: 'created_at', direction: 'desc' }]
          );
          
          if (offersError) {
            console.error('Error fetching offers for application:', appId, offersError);
            continue;
          }
          
          const app = applications.find(a => a.id === appId);
          
          // Filter out declined offers
          const activeAppOffers = appOffers?.filter(offer => offer.status !== 'declined') || [];
          
          if (activeAppOffers && activeAppOffers.length > 0) {
            // Track applications that have offers
            applicationsWithOffers.add(appId);
            
            // Add application details and lender details to each offer
            const offersWithDetails = await Promise.all(
              activeAppOffers.map(async (offer) => {
                // Get lender details
                let lenderName = offer.lender_name || 'Unknown Lender';
                let lenderLogo = offer.company_logo || '';
                
                if (offer.lender_id) {
                  try {
                    const { data: lenderData } = await getDocument('lenders', offer.lender_id);
                    if (lenderData) {
                      lenderName = lenderData.company_name || lenderData.name || lenderName;
                      lenderLogo = lenderData.logo_url || lenderData.company_logo || lenderLogo;
                    } else {
                      // Fallback to users collection
                      const { data: userData } = await getDocument('users', offer.lender_id);
                      if (userData) {
                        lenderName = userData.company_name || userData.displayName || lenderName;
                        lenderLogo = userData.photoURL || lenderLogo;
                      }
                    }
                  } catch (error) {
                    console.warn('Could not fetch lender details for offer:', offer.id, error);
                  }
                }
                
                return {
                  ...offer,
                  lender_name: lenderName,
                  company_logo: lenderLogo,
                  applications: {
                    id: app?.id || appId,
                    application_number: app?.application_number,
                    loan_amount: app?.loan_amount || 0,
                    loan_term_months: app?.loan_term_months || 0,
                    purpose: app?.purpose || 'Unknown',
                    status: app?.status || 'unknown',
                    business_logo_url: app?.business_logo_url || '',
                    business_name: app?.business_name || '',
                    business_id: app?.business_id || app?.user_id || '',
                    expires_at: app?.expires_at // Add expires_at for expiry checking
                  }
                };
              })
            );

            // Deduplicate offers by lender_id - keep only the most recent offer per lender
            const deduplicatedOffers = deduplicateOffersByLender(offersWithDetails);
            
            allOffers.push(...deduplicatedOffers);
          }
        }
        
        // Add applications without offers as placeholder entries
        for (const app of applications) {
          if (!applicationsWithOffers.has(app.id)) {
            // Get business profile details for the application
            let businessLogoUrl = '';
            let businessName = '';
            
            if (app.business_id || app.user_id) {
              try {
                const { data: businessData } = await getDocument('users', app.business_id || app.user_id);
                if (businessData) {
                  businessLogoUrl = businessData.photoURL || businessData.logo_url || '';
                  businessName = businessData.company_name || businessData.displayName || '';
                }
              } catch (error) {
                console.warn('Could not fetch business details for application:', app.id, error);
              }
            }
            
            // Create a placeholder offer entry for applications without offers
            allOffers.push({
              id: `no-offers-${app.id}`,
              application_id: app.id,
              lender_id: '',
              lender_name: '',
              company_logo: '',
              interest_rate: 0,
              offered_amount: 0,
              offered_term_months: 0,
              status: 'no-offers',
              offer_date: app.created_at || new Date().toISOString(),
              expires_at: '',
              fees: {},
              conditions: [],
              created_at: app.created_at || new Date().toISOString(),
              applications: {
                id: app.id,
                application_number: app.application_number,
                loan_amount: app.loan_amount || 0,
                loan_term_months: app.loan_term_months || 0,
                purpose: app.purpose || 'Unknown',
                status: app.status || 'pending',
                business_logo_url: businessLogoUrl,
                business_name: businessName,
                business_id: app.business_id || app.user_id || '',
                expires_at: app.expires_at // Add expires_at for expiry checking
              }
            });
          }
        }
        
        // Sort by created_at date and filter out any declined offers as a safety measure
        allOffers.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Additional safety filter to ensure no declined offers are returned
        const filteredOffers = allOffers.filter(offer => offer.status !== 'declined');

        return filteredOffers as Offer[];
      }
    },
    enabled: !!user,
  });
};
