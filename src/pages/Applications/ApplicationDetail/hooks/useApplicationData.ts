import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getDocument, updateDocument, getDocuments, createDocument } from '@/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

interface User {
  uid: string;
  role?: string;
  [key: string]: any;
}

interface ApplicationData {
  id?: string;
  user_id?: string;
  business_id?: string;
  status?: string;
  loan_amount?: number;
  loan_term_months?: number;
  loan_type?: string;
  purpose?: string;
  purpose_details?: string;
  application_number?: string;
  application_date?: string;
  status_updated_at?: string;
  is_secured?: boolean;
  has_personal_guarantee?: boolean;
  viewed_by_lenders?: string[];
  matched_lenders?: string[];
  interested_lenders?: Array<{
    lender_id: string;
    lender_name?: string;
    lender_company?: string;
    expressed_at?: any;
    status?: 'pending' | 'accepted' | 'rejected';
  }>;
  offers?: Array<any>;
  isOwner?: boolean;
  isLender?: boolean;
  business?: any;
  financial_documents?: Array<any>;
  financialDocuments?: Record<string, any>;
  financialSummaries?: Record<string, string>;
  completeness_percentage?: number;
  [key: string]: any;
}

interface FinancialDocument {
  id: string;
  documentType: string;
  documentName?: string;
  data?: any;
  summary?: string;
  fileUrl?: string;
  extractedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  documentFormat?: string;
  [key: string]: any;
}

export const useApplicationData = (id?: string | null, user?: User | null) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Fetch application data
  const { 
    data: application, 
    isLoading, 
    refetch: refetchApplication 
  } = useQuery({
    queryKey: ['applicationDetail', id],
    queryFn: async () => {
      if (!id) throw new Error('Application ID is required');
      // Get application details
      const { data, error } = await getDocument('applications', id);
      if (error) {
        toast.error('Failed to load application details');
        setErrorMessage('Failed to load application details');
        throw error;
      }
      
      // Check if the user is either the owner of the application or a lender with access
      const isOwner = data.user_id === user?.uid;
      const isMatchedLender = data.matched_lenders && Array.isArray(data.matched_lenders) && data.matched_lenders.includes(user?.uid);
      const hasExpressedInterest = data.interested_lenders && Array.isArray(data.interested_lenders) && 
                                data.interested_lenders.some(l => l.lender_id === user?.uid);
      // Check for lender role - this allows lenders from MatchedApplications page to view details
      const isLender = user?.role === 'lender';
      // Allow access for owners, matched lenders, lenders who have expressed interest, or any lender viewing from correct route
      const hasPermission = isOwner || isMatchedLender || hasExpressedInterest || isLender;
      
      if (!hasPermission) {
        toast.error('You do not have permission to view this application');
        setErrorMessage('You do not have permission to view this application');
        throw new Error('Unauthorized');
      }
      
      // Get business details
      let businessData = null;
      let creditInfo = null;
      
      if (isOwner) {
        const businessResponse = await getDocument('businesses', user.uid);
        businessData = businessResponse.data;
      } else if (data.business_id) {
        // For lenders, get the business profile using business_id from the application
        const businessResponse = await getDocument('businesses', data.business_id);
        businessData = businessResponse.data;
      }
      
      // Fetch latest credit score from subcollection if businessData exists
      if (businessData) {
        try {
          const creditScoreResp = await getDocument(`businesses/${businessData.id || (isOwner ? user.uid : data.business_id)}/credit_score`, 'latest');
          if (creditScoreResp && creditScoreResp.data) {
            creditInfo = creditScoreResp.data;
            businessData.credit_info = creditInfo.details || creditInfo; // Use .details if present
          }
        } catch (err) {
          console.error('Error fetching credit score:', err);
        }
        
        try {
          // Fetch financial documents from business-financials collection
          const db = getFirestore();
          const financialsQuery = query(
            collection(db, 'businesses', businessData.id, 'financials')
          );
          const financialsSnapshot = await getDocs(financialsQuery);
          const financialDocs = financialsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FinancialDocument[];

          // Group documents by type
          let financialDocuments = {};
          let financialSummaries = {};

          financialDocs.forEach(doc => {
            const key = doc.documentType?.toLowerCase()?.includes('profit') ? 'pl'
              : doc.documentType?.toLowerCase()?.includes('balance') && !doc.documentType?.toLowerCase()?.includes('trial') ? 'bs'
              : doc.documentType?.toLowerCase()?.includes('trial') ? 'tb'
              : doc.documentType?.toLowerCase()?.includes('payable') ? 'ap'
              : doc.documentType?.toLowerCase()?.includes('receivable') ? 'ar'
              : null;

            if (key) {
              // Process the data with extra handling for Trial Balance and Balance Sheet
              let processedData = doc.data || {};
              
              // Sometimes the data is a string that needs to be parsed
              if (typeof processedData === 'string') {
                try {
                  processedData = JSON.parse(processedData);
                } catch (e) {
                  console.error(`Failed to parse ${key} data as JSON:`, e);
                }
              }
              
              // Special handling for Trial Balance
              if (key === 'tb' && (!processedData || Object.keys(processedData).length === 0)) {
                // Try to extract data from the summary if the data field is empty
                try {
                  if (doc.summary && typeof doc.summary === 'string') {
                    const summaryJson = JSON.parse(doc.summary);
                    if (summaryJson.json && Object.keys(summaryJson.json).length > 0) {
                      processedData = summaryJson.json;
                    }
                  }
                } catch (e) {
                  console.error('Failed to extract Trial Balance data from summary:', e);
                }
              }
              
              financialDocuments[key] = processedData;
              financialSummaries[key] = doc.summary || '';
            }
          });

          const appData = {
            ...data,
            business: businessData,
            financial_documents: businessData?.financial_documents || [],
            financialDocuments,
            financialSummaries,
            isOwner,
            isLender: !isOwner
          };
          
          // Calculate application completeness
          calculateCompleteness(appData);
          return appData;
        } catch (err) {
          console.error('Error fetching financial documents:', err);
        }
      }
      
      const appData = {
        ...data,
        business: businessData,
        financial_documents: businessData?.financial_documents || [],
        isOwner,
        isLender: !isOwner
      };
      
      // Calculate application completeness
      calculateCompleteness(appData);
      return appData;
    },
    enabled: !!id && !!user?.uid,
  });
  
  // Calculate application completeness
  const calculateCompleteness = (app) => {
    if (!app) return { percentage: 0, completed: 0, total: 4, missing: [] };
    
    // Check if financial documents are available in either format
    const hasFinancialDocs = 
      // Check in the traditional format
      (app.financial_documents && app.financial_documents.length > 0) ||
      // Check in the financialDocuments object format
      (app.financialDocuments && Object.keys(app.financialDocuments).some(key => 
        app.financialDocuments[key] && Object.keys(app.financialDocuments[key]).length > 0));
    
    const checks = [
      { name: 'Business profile', value: app.business ? true : false },
      { name: 'Credit score', value: app.business?.credit_info?.credit_score ? true : false },
      { name: 'Financial documents', value: hasFinancialDocs },
      { name: 'Application details', value: app.loan_amount && app.loan_term_months && app.purpose ? true : false }
    ];
    
    const completed = checks.filter(check => check.value).length;
    const missing = checks.filter(check => !check.value).map(check => check.name);
    const percentage = Math.round((completed / checks.length) * 100);
    
    // Add completeness percentage to application object
    app.completeness_percentage = percentage;
    
    return {
      percentage,
      completed,
      total: checks.length,
      missing
    };
  };

  // Respond to lender interest (accept or reject)
  const handleRespondToInterest = async (lender, response) => {
    if (!id || !user || !application) return;
    
    try {
      // Find the interested lender in the array
      const interestedLenders = application.interested_lenders || [];
      const updatedLenders = interestedLenders.map(l => {
        if (l.lender_id === lender.lender_id) {
          return {
            ...l,
            status: response,
            responded_at: new Date()
          };
        }
        return l;
      });
      
      // Update the application with the new status
      await updateDocument('applications', id, {
        interested_lenders: updatedLenders
      });
      
      // Create a notification for the lender
      const notificationData = {
        user_id: lender.lender_id,
        type: response === 'accepted' ? 'interest_accepted' : 'interest_declined',
        title: response === 'accepted' ? 'Interest Accepted' : 'Interest Declined',
        message: response === 'accepted' 
          ? `Application #${application.application_number || id?.substring(0, 8)} has accepted your interest` 
          : `Application #${application.application_number || id?.substring(0, 8)} has declined your interest`,
        application_id: id,
        read: false,
        created_at: new Date()
      };
      
      await createDocument('notifications', notificationData);
      
      // If accepted, match the lender with the application
      if (response === 'accepted') {
        // Add this lender to matched_lenders array if not already there
        const matchedLenders = application.matched_lenders || [];
        if (!matchedLenders.includes(lender.lender_id)) {
          await updateDocument('applications', id, {
            matched_lenders: [...matchedLenders, lender.lender_id]
          });
        }
      }
      
      toast.success(
        response === 'accepted'
          ? 'You have accepted this lender\'s interest. They will be notified.'
          : 'You have declined this lender\'s interest. They will be notified.'
      );
      
      // Refresh the application data
      refetchApplication();
      
    } catch (error) {
      console.error('Error responding to lender interest:', error);
      toast.error('Failed to respond to lender interest');
    }
  };

  return {
    application,
    isLoading,
    errorMessage,
    refetchApplication,
    calculateCompleteness,
    handleRespondToInterest,
  };
};
