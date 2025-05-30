import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getDocument, deductCredits, updateDocument } from '@/firebase';

interface User {
  uid: string;
  role?: string;
  [key: string]: any;
}

interface Application {
  id?: string;
  loan_amount?: number;
  viewed_by_lenders?: string[];
  [key: string]: any;
}

interface LenderData {
  total_credits: number;
  used_credits: number;
  [key: string]: any;
}

type ViewDetailsCallback = (lenderData: LenderData) => (() => void) | undefined;

export const useLenderCredits = (
  id?: string | null, 
  user?: User | null, 
  application?: Application | null, 
  onViewDetails?: ViewDetailsCallback
) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch lender's available credits
  const { data: lenderData } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User ID is required');
      
      const { data, error } = await getDocument('lender_billing', user.uid);
      
      if (error) {
        // Not an error if document doesn't exist yet - just provide default values
        return { 
          total_credits: 25, 
          used_credits: 10
        };
      }
      
      return data || { 
        total_credits: 25, 
        used_credits: 10
      };
    },
    enabled: !!user?.uid,
  });
  
  // Calculate available credits
  const availableCredits = lenderData 
    ? lenderData.total_credits - lenderData.used_credits 
    : 0;
    
  // Calculate credit cost based on loan amount
  const getCreditCost = (loanAmount) => {
    if (!loanAmount) return 1;
    const amount = Number(loanAmount);
    // £100 = 1 credit, so divide by 100 and round up
    return Math.ceil(amount / 100);
  };
  
  // Function to view application details after paying credits
  const handleViewFullDetails = async () => {
    if (!id || !user || !application) return;
    
    try {
      setIsLoading(true);
      
      // If onViewDetails returns a callback, execute it after processing
      const successCallback = onViewDetails(lenderData);
      
      if (!successCallback) {
        // If no callback, it means we shouldn't proceed (not enough credits, etc.)
        return;
      }
      
      const creditCost = getCreditCost(application.loan_amount);
      
      // Deduct credits from lender's account
      await deductCredits(user.uid, creditCost);
      
      // Record that this lender has viewed this application
      const viewedByLenders = application.viewed_by_lenders || [];
      
      if (!viewedByLenders.includes(user.uid)) {
        const updatedViewers = [...viewedByLenders, user.uid];
        await updateDocument('applications', id, {
          viewed_by_lenders: updatedViewers
        });
      }
      
      // Execute success callback if provided
      if (successCallback && typeof successCallback === 'function') {
        successCallback();
      }
      
      toast.success(`${creditCost} credits used to view details`);
    } catch (error) {
      console.error('Error viewing application details:', error);
      if (error.message === 'Insufficient credits') {
        toast.error('You do not have enough credits to view this application. Please purchase more credits.');
      } else {
        toast.error('Failed to unlock application details');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    lenderData,
    availableCredits,
    getCreditCost,
    handleViewFullDetails,
    isLoading
  };
};
