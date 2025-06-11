import { useQuery } from '@tanstack/react-query';
import { getDocument, getDocuments } from '@/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { normalizeCreditScoreData } from '@/services';
import { useState } from 'react';
import { ApplicationData } from '../types';

export const useBusinessData = (id: string | undefined, user: any) => {
  const db = getFirestore();

  // Fetch application and associated business data
  const { data: applicationData, isLoading, error } = useQuery<ApplicationData>({
    queryKey: ['businessDetail', id],
    queryFn: async () => {
      if (!id || !user) throw new Error('Invalid request');

      try {
        // Try to get application details first
        const { data: application, error: appError } = await getDocument('applications', id);
        
        // If we found an application, get the business details through the application
        if (!appError && application) {



          
          // If no business_id, fall back to using the application owner's ID
          const businessId = application.business_id || application.user_id;
          if (!businessId) {
            console.error('[DEBUG Business ID] Application missing both business_id and user_id');
            throw new Error('Could not determine business reference');
          }
          
          console.log('[DEBUG Business ID] Using business ID for lookups:', businessId);
          console.log('[DEBUG Business ID] Application data:', { 
            application_id: application.id, 
            business_id: application.business_id, 
            user_id: application.user_id 
          });



          // Get business profile using business_id or user_id from the application
          const { data: business, error: businessError } = await getDocument(
            'businesses',
            businessId
          );
          
          if (businessError) {
            console.error('[DEBUG Business ID] Error fetching business profile:', businessError);
            // If business profile doesn't exist, create a basic business object
            console.warn('[DEBUG Business ID] Business profile not found, using basic application data');
            return {
              application,
              business: {
                business_name: `Application #${application.application_number || id?.substring(0, 8)}`,
                industry_sector: 'Not specified',
                description: 'Business profile not available'
              },
              accounting: null,
              creditScore: null
            };
          }

          if (!business) {
            console.warn('Business profile is null, using basic application data');
            return {
              application,
              business: {
                business_name: `Application #${application.application_number || id?.substring(0, 8)}`,
                industry_sector: 'Not specified',
                description: 'Business profile not available'
              },
              accounting: null,
              creditScore: null
            };
          }

          // Get accounting data if connected
          const { data: accounting } = await getDocument(
            'accounting_integrations',
            businessId
          );

          // Get credit score data - UPDATED TO CHECK CREDIT_SCORE SUBCOLLECTION
          let creditScore = null;
          
          console.log('[DEBUG Credit Score Fetch] Starting credit score fetch for business ID:', businessId);
          
          // First check the credit_score/latest subcollection (current Firebase structure)
          try {
            const creditScoreDoc = await getDoc(doc(db, "businesses", businessId, "credit_score", "latest"));
            if (creditScoreDoc.exists()) {
              creditScore = creditScoreDoc.data();
              console.log('[DEBUG Credit Score] Found credit score in subcollection:', creditScore);
            } else {
              console.log('[DEBUG Credit Score] No credit score found in subcollection path: businesses/' + businessId + '/credit_score/latest');
            }
          } catch (err) {
            console.error('[DEBUG] Error fetching credit score from subcollection:', err);
          }
          
          // If not found in subcollection, check business.credit_info (legacy)
          if (!creditScore && business && business.credit_info) {
            console.log('[DEBUG Credit Score] Found credit score in business.credit_info:', business.credit_info);
            creditScore = business.credit_info;
          }
          
          // If still not found, try dedicated credit_scores collection as fallback
          if (!creditScore) {
            const { data: creditScoreData } = await getDocument(
              'credit_scores',
              businessId
            );
            if (creditScoreData) {
              console.log('[DEBUG Credit Score] Found credit score in credit_scores collection:', creditScoreData);
              creditScore = creditScoreData;
            } else {
              console.log('[DEBUG Credit Score] No credit score found in credit_scores collection');
            }
          }
          
          console.log('[DEBUG Credit Score Final] Final creditScore before normalization:', creditScore);

          // Normalize credit score data before returning
          const normalizedCreditScore = normalizeCreditScoreData(creditScore);
          console.log('[DEBUG Credit Score Normalized] After normalization:', normalizedCreditScore);
          
          return {
            application,
            business,
            accounting,
            creditScore: normalizedCreditScore
          };
        } 
        
        // If no application found, try direct business profile lookup

        const { data: business, error: businessError } = await getDocument('businesses', id);
        
        if (businessError) {
          console.error('Error fetching business profile:', businessError);
          throw new Error(`Could not find business profile: ${businessError.message || 'Unknown error'}`);
        }
        
        if (!business) {
          console.error('Business profile not found for ID:', id);
          throw new Error('Business profile not found');
        }

        // Get accounting data if available
        const { data: accounting } = await getDocument(
          'accounting_integrations',
          id
        );

        // Get credit score data from subcollection
        let creditScore = null;
        try {
          const creditScoreDoc = await getDoc(doc(db, "businesses", id, "credit_score", "latest"));
          if (creditScoreDoc.exists()) {
            creditScore = creditScoreDoc.data();
            console.log('[DEBUG Credit Score Direct] Found credit score in subcollection:', creditScore);
          }
        } catch (err) {
          console.error('[DEBUG] Error fetching credit score from subcollection (direct):', err);
          // Fallback to old method
          const { data: creditScoreData } = await getDocument('credit_scores', id);
          if (creditScoreData) {
            creditScore = creditScoreData;
          }
        }

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

  // Check for accepted connections between lender and this application
  const { data: lenderConnection } = useQuery({
    queryKey: ['lenderConnection', user?.uid, id],
    queryFn: async () => {
      if (!user?.uid || !id) return null;
      
      const { data, error } = await getDocuments('lender_connections', [
        { field: 'lender_id', operator: '==', value: user.uid },
        { field: 'application_id', operator: '==', value: id },
        { field: 'status', operator: '==', value: 'accepted' }
      ]);
      
      if (error) {
        console.error('Error checking lender connection:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!id && !!user?.uid,
  });

  // Check if lender has accepted interest or made an offer (can see business details)
  const canSeeBusinessDetails = () => {
    if (!applicationData?.application) {

      return false;
    }
    
    // Check if lender has an accepted connection
    const hasAcceptedConnection = !!lenderConnection;
    
    // Check if lender has expressed interest AND it has been accepted
    const hasAcceptedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'accepted'
    );
    
    // Check if lender has made an offer
    const hasMadeOffer = applicationData.application.offers?.some(o => o.lender_id === user?.uid);
    
    // Check if any offers from this lender have been accepted
    const hasAcceptedOffer = applicationData.application.offers?.some(
      o => o.lender_id === user?.uid && o.status === 'accepted'
    );
    
    // Check if lender is in matched_lenders array
    const isMatched = applicationData.application.matched_lenders?.includes(user?.uid);
    
    // Check if application has been approved (accepting any offer approves the application)
    const isApplicationApproved = applicationData.application?.status === 'approved';
    
    console.log('[DEBUG Access] Access control check:', { 
      userId: user?.uid, 
      hasAcceptedConnection,
      hasAcceptedInterest,
      hasMadeOffer,
      hasAcceptedOffer,
      isMatched,
      isApplicationApproved,
      applicationStatus: applicationData.application?.status,
      interestedLenders: applicationData.application.interested_lenders || [],
      offers: applicationData.application.offers || [],
      matchedLenders: applicationData.application.matched_lenders || [],
      lenderConnection: lenderConnection
    });
    
    return hasAcceptedConnection || hasAcceptedInterest || hasMadeOffer || isMatched || hasAcceptedOffer || isApplicationApproved;
  };

  // Check if lender is already matched
  const isAlreadyMatched = () => {
    if (!applicationData?.application) return false;
    const hasAcceptedConnection = !!lenderConnection;
    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);
    const hasExpressedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && (l.status === 'accepted' || l.status === 'pending')
    );
    return hasAcceptedConnection || isInMatchedLenders || hasExpressedInterest;
  };

  // Add a function to check if lender is matched
  const isLenderMatched = () => {
    if (!applicationData?.application) return false;
    
    const hasAcceptedConnection = !!lenderConnection;
    const isInMatchedLenders = applicationData.application.matched_lenders?.includes(user?.uid);
    const isAcceptedInterest = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'accepted'
    );
    
    // Check if any offers from this lender have been accepted
    const hasAcceptedOffer = applicationData.application.offers?.some(
      o => o.lender_id === user?.uid && o.status === 'accepted'
    );
    
    // Check if application has an accepted offer from this lender
    const hasAcceptedOfferId = applicationData.application?.accepted_offer_id;
    const isOfferAccepter = hasAcceptedOfferId && applicationData.application.offers?.some(
      o => o.id === hasAcceptedOfferId && o.lender_id === user?.uid
    );
    
    // Check if application has been approved and this lender is the one who was accepted
    const isApplicationApproved = applicationData.application?.status === 'approved';
    const isApprovedForThisLender = isApplicationApproved && applicationData.application?.lender_id === user?.uid;
    
    console.log('[DEBUG Match] Lender match status check:', {
      hasAcceptedConnection,
      isInMatchedLenders,
      isAcceptedInterest,
      hasAcceptedOffer,
      isOfferAccepter,
      isApplicationApproved,
      isApprovedForThisLender,
      applicationStatus: applicationData.application?.status,
      userId: user?.uid,
      lenderId: applicationData.application?.lender_id
    });
    
    return hasAcceptedConnection ||
           isInMatchedLenders || 
           isAcceptedInterest || 
           hasAcceptedOffer || 
           isOfferAccepter || 
           isApprovedForThisLender;
  };

  // Add function to get display name based on match status
  const getDisplayName = () => {
    if (!applicationData?.application) return 'Application Not Found';
    
    // Only show business name if lender can see business details
    if (canSeeBusinessDetails() && applicationData?.business?.business_name) {
      return applicationData.business.business_name;
    }
    
    return `Application #${applicationData.application.application_number || id?.substring(0, 8)}`;
  };

  // Check if lender has expressed interest
  const hasExpressedInterest = () => {
    if (!applicationData?.application) return false;
    return applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'pending'
    );
  };

  return {
    applicationData,
    isLoading,
    error,
    canSeeBusinessDetails,
    isAlreadyMatched,
    isLenderMatched,
    getDisplayName,
    hasExpressedInterest
  };
};
