import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Loader2 } from 'lucide-react';
import { getDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface CreditScoreCardProps {
  application: any;
}

const CreditScoreCard: React.FC<CreditScoreCardProps> = ({ application }) => {
  const { user } = useAuth();
  
  if (!application) return null;

  // Determine which business ID to use
  const businessId = application.business_id || application.user_id;
  
  // Fetch credit score data from multiple possible locations
  const { data: creditScoreData, isLoading: isLoadingCreditScore } = useQuery({
    queryKey: ['creditScore', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      
      console.log('CreditScoreCard: Fetching credit score for businessId:', businessId);
      
      // Try multiple locations for credit score data
      
      // 1. Try the new credit_score subcollection
      try {
        const creditScoreDoc = await getDocument('businesses', `${businessId}/credit_score/latest`);
        console.log('CreditScoreCard: credit_score subcollection data:', creditScoreDoc?.data);
        if (creditScoreDoc?.data && Object.keys(creditScoreDoc.data).length > 0) {
          const data = creditScoreDoc.data;
          
          // Extract credit score from the correct path based on the actual data structure
          const creditScore = 
            // From raw_data structure (correct path)
            data.raw_data?.report?.creditScore?.currentCreditRating?.providerValue?.value ||
            data.raw_data?.report?.companySummary?.creditRating?.providerValue?.value ||
            // From data.details structure (alternative path)
            data.data?.details?.report?.creditScore?.currentCreditRating?.providerValue?.value ||
            data.data?.details?.report?.companySummary?.creditRating?.providerValue?.value ||
            // Fallback to direct fields
            data.credit_score || 
            data.data?.credit_score || 
            data.score;
            
          const risk = 
            data.raw_data?.report?.creditScore?.currentCreditRating?.commonDescription ||
            data.raw_data?.report?.companySummary?.creditRating?.commonDescription ||
            data.data?.details?.report?.creditScore?.currentCreditRating?.commonDescription ||
            data.data?.details?.report?.companySummary?.creditRating?.commonDescription ||
            data.risk || 
            data.data?.risk || 
            data.common_description;
          
          console.log('CreditScoreCard: Extracted credit score:', creditScore);
          console.log('CreditScoreCard: Extracted risk:', risk);
          
          if (creditScore) {
            return {
              credit_score: creditScore,
              risk: risk,
              common_description: risk,
              source: 'credit_score_subcollection'
            };
          }
        }
      } catch (error) {
        console.log('Credit score subcollection not found, trying next location...', error);
      }
      
      // 2. Try the financials subcollection
      try {
        const financialsDoc = await getDocument('businesses', `${businessId}/financials/credit_score`);
        console.log('CreditScoreCard: financials subcollection data:', financialsDoc?.data);
        if (financialsDoc?.data && Object.keys(financialsDoc.data).length > 0) {
          return {
            credit_score: financialsDoc.data.credit_score || financialsDoc.data.data?.credit_score || financialsDoc.data.data?.score,
            risk: financialsDoc.data.risk || financialsDoc.data.data?.risk || financialsDoc.data.data?.common_description,
            common_description: financialsDoc.data.common_description || financialsDoc.data.data?.common_description,
            source: 'financials_subcollection'
          };
        }
      } catch (error) {
        console.log('Financials subcollection not found, trying next location...', error);
      }
      
      // 3. Try the main business document credit_info
      try {
        const businessDoc = await getDocument('businesses', businessId);
        console.log('CreditScoreCard: main business document data:', businessDoc?.data);
        if (businessDoc?.data?.credit_info && Object.keys(businessDoc.data.credit_info).length > 0) {
          return {
            credit_score: businessDoc.data.credit_info.credit_score || businessDoc.data.credit_info.score,
            risk: businessDoc.data.credit_info.risk || businessDoc.data.credit_info.common_description,
            common_description: businessDoc.data.credit_info.common_description,
            source: 'main_business_document'
          };
        }
      } catch (error) {
        console.log('Main business document not found or has no credit_info...', error);
      }
      
      // 4. Check if credit info is already consolidated in the application
      console.log('CreditScoreCard: application.credit_info:', application.credit_info);
      if (application.credit_info) {
        return {
          credit_score: application.credit_info.credit_score || application.credit_info.score,
          risk: application.credit_info.risk || application.credit_info.common_description,
          common_description: application.credit_info.common_description,
          source: 'application_consolidated'
        };
      }
      
      // 5. Check the application's business object
      console.log('CreditScoreCard: application.business:', application.business);
      if (application.business?.credit_info) {
        return {
          credit_score: application.business.credit_info.credit_score || application.business.credit_info.score,
          risk: application.business.credit_info.risk || application.business.credit_info.common_description,
          common_description: application.business.credit_info.common_description,
          source: 'application_business_object'
        };
      }
      
      console.log('CreditScoreCard: No credit score found in any location');
      return null;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const creditScore = creditScoreData?.credit_score;
  const creditRisk = creditScoreData?.risk || creditScoreData?.common_description;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Credit Assessment</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Business credit score and risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isLoadingCreditScore ? (
          <div className="text-center py-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600">Loading credit score...</p>
          </div>
        ) : creditScore ? (
          <div className="text-center py-4">
            <div className="flex flex-col items-center justify-center mb-4">
              {/* Circular Credit Score Indicator */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle
                    cx="48" cy="48" r="44"
                    fill="#fff"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48" cy="48" r="44"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - (Number(creditScore) / 100))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-green-700">
                  {creditScore}
                </span>
              </div>
              <p className="text-sm text-green-600">Business Credit Score</p>
              {creditRisk && (
                <p className="text-sm font-medium text-green-700 mt-1">{creditRisk}</p>
              )}
            </div>
            <Badge variant="default" className="bg-green-600 text-white shadow-sm">Score Available</Badge>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
              <p className="font-medium text-orange-800">Credit score not available</p>
              <p className="text-sm text-orange-600 mt-1">Other factors will be used to evaluate this application</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditScoreCard;
