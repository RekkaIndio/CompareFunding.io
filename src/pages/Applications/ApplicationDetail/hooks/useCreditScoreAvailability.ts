import { useQuery } from '@tanstack/react-query';
import { getDocument } from '@/firebase';

/**
 * Custom hook to check if credit score data is available for a business
 * Returns whether credit score exists and the actual score if available
 */
export const useCreditScoreAvailability = (businessId: string | null) => {
  return useQuery({
    queryKey: ['creditScoreAvailability', businessId],
    queryFn: async () => {
      if (!businessId) return { hasScore: false, score: null };
      
      // Try multiple locations for credit score data
      
      // 1. Try the new credit_score subcollection
      try {
        const creditScoreDoc = await getDocument('businesses', `${businessId}/credit_score/latest`);
        if (creditScoreDoc?.data && Object.keys(creditScoreDoc.data).length > 0) {
          const data = creditScoreDoc.data;
          
          // Extract credit score from the correct path based on the actual data structure
          const creditScore = 
            // From raw_data structure (correct path)
            data.raw_data?.report?.creditScore?.currentCreditRating?.providerValue?.value ||
            data.raw_data?.report?.companySummary?.creditRating?.providerValue?.value ||
            // From data.details structure (alternative path)
            data.data?.details?.report?.creditScore?.currentCreditRating?.providerValue?.value ||
            // Direct credit_score field
            data.credit_score ||
            data.data?.credit_score ||
            // Fallback to score field
            data.score ||
            data.data?.score;
            
          if (creditScore !== undefined && creditScore !== null) {
            return { hasScore: true, score: creditScore };
          }
        }
      } catch (error) {
        console.log('Credit score subcollection not found, trying other sources');
      }

      // 2. Try businesses collection directly
      try {
        const businessDoc = await getDocument('businesses', businessId);
        if (businessDoc?.data?.credit_score) {
          return { hasScore: true, score: businessDoc.data.credit_score };
        }
      } catch (error) {
        console.log('Business document not found or no credit score');
      }

      // 3. Try users collection (fallback)
      try {
        const userDoc = await getDocument('users', businessId);
        if (userDoc?.data?.credit_score) {
          return { hasScore: true, score: userDoc.data.credit_score };
        }
      } catch (error) {
        console.log('User document not found or no credit score');
      }

      return { hasScore: false, score: null };
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
