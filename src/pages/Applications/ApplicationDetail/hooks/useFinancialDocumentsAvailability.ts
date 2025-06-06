import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export const useFinancialDocumentsAvailability = (businessId?: string) => {
  return useQuery({
    queryKey: ['financialDocumentsAvailability', businessId],
    queryFn: async () => {
      if (!businessId) {
        return { hasDocuments: false, count: 0, documents: [] };
      }

      try {
        const db = getFirestore();
        
        // Query the financials collection for this business
        const financialsCollection = collection(db, "businesses", businessId, "financials");
        const querySnapshot = await getDocs(financialsCollection);
        
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const hasDocuments = documents.length > 0;
        
        return {
          hasDocuments,
          count: documents.length,
          documents
        };
      } catch (error) {
        console.error('Error checking financial documents availability:', error);
        return { hasDocuments: false, count: 0, documents: [] };
      }
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
