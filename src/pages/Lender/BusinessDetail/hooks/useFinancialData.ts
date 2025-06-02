import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { ApplicationData, FinancialData } from '../types';

export const useFinancialData = (id: string | undefined, applicationData: ApplicationData | undefined) => {
  const db = getFirestore();

  // Fetch financial data from the businesses/{businessId}/financials collection
  const { data: financialData } = useQuery<FinancialData>({
    queryKey: ['businessFinancials', id, applicationData?.application?.business_id, applicationData?.application?.user_id],
    queryFn: async () => {
      if (!id || !applicationData) return {} as FinancialData;

      try {
        // Get business ID from various possible locations
        let businessId = null;
        
        // Check if it's directly in the application
        if (applicationData.application?.business_id) {
          businessId = applicationData.application.business_id;
          console.log('[DEBUG] Found business_id in application:', businessId);
        }
        
        // If not in application, check if it's in the business object
        else if (applicationData.business?.id) {
          businessId = applicationData.business.id;
          console.log('[DEBUG] Found business ID in business object:', businessId);
        }
        
        // Fall back to user_id if no business_id is available
        else if (applicationData.application?.user_id) {
          // In this case, we need to first get the businessId from the user document
          const userRef = doc(db, "users", applicationData.application.user_id);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().businessId) {
            businessId = userSnap.data().businessId;
            console.log('[DEBUG] Found businessId from user document:', businessId);
          } else {
            // Final fallback to the user_id itself
            businessId = applicationData.application.user_id;
            console.log('[DEBUG] Falling back to user_id as business ID:', businessId);
          }
        }
        
        // Last resort fallback to the application ID
        if (!businessId) {
          businessId = id;
          console.log('[DEBUG] Using application ID as fallback business ID:', businessId);
        }
        
        console.log('[DEBUG] Using business ID for financials:', businessId);
        
        let financials = {} as FinancialData;
        
        // Try direct approach first - check if the business doc itself contains financial data
        try {
          const businessDocRef = doc(db, "businesses", businessId);
          const businessDoc = await getDoc(businessDocRef);
          
          if (businessDoc.exists()) {
            console.log('[DEBUG] Found business document:', businessId);
            // If the business document has direct financial data fields
            const data = businessDoc.data();
            if (data.financials || data.financial_data) {
              console.log('[DEBUG] Found embedded financial data in business document');
              financials = data.financials || data.financial_data || {};
            }
          }
        } catch (e) {
          console.error('[DEBUG] Error fetching business document:', e);
        }
        
        // If we didn't find embedded financials, try the subcollection
        if (Object.keys(financials).length === 0) {
          console.log('[DEBUG] Trying financials subcollection');
          const financialsCollection = collection(db, "businesses", businessId, "financials");
          const querySnapshot = await getDocs(query(financialsCollection, orderBy("createdAt", "desc")));
          
          console.log(`[DEBUG] Financial documents found: ${querySnapshot.size} for business ID: ${businessId}`);
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('[DEBUG] Financial document:', doc.id, data);
            
            let docKey = "";
            
            // Map document types to keys matching the tabs
            if (data.documentType?.toLowerCase().includes("profit") || 
                data.documentType?.toLowerCase().includes("loss") || 
                data.documentType === "pl") {
              docKey = "profitLoss";
            } else if (data.documentType?.toLowerCase().includes("balance") || 
                      data.documentType === "bs") {
              docKey = "balanceSheet";
            } else if (data.documentType?.toLowerCase().includes("trial") || 
                      data.documentType === "tb") {
              docKey = "trialBalance";
            } else if (data.documentType?.toLowerCase().includes("payable") || 
                      data.documentType === "ap") {
              docKey = "agedPayables";
            } else if (data.documentType?.toLowerCase().includes("receivable") || 
                      data.documentType === "ar") {
              docKey = "agedReceivables";
            }
            
            if (docKey) {
              console.log(`[DEBUG] Mapping document type '${data.documentType}' to tab key: ${docKey}`);
              financials[docKey as keyof FinancialData] = {
                id: doc.id,
                ...data,
                // Ensure we have the data field, which might be in different places
                data: data.data || data.financialData || data.extractedData || data.json || {},
                // Store the document URL for downloading
                fileUrl: data.fileUrl || data.documentUrl || data.url || null,
                documentName: data.documentName || data.fileName || `${data.documentType} Document`,
                createdAt: data.createdAt || new Date().toISOString()
              };
            }
          });
        }
        
        // Also check the business_financials collection as a fallback
        if (Object.keys(financials).length === 0) {
          console.log('[DEBUG] Trying business_financials collection');
          try {
            const altFinancialsQuery = query(
              collection(db, "business_financials"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const altQuerySnapshot = await getDocs(altFinancialsQuery);
            console.log(`[DEBUG] Found ${altQuerySnapshot.size} documents in business_financials collection`);
            
            // Process documents if found
            if (!altQuerySnapshot.empty) {
              altQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                // Similar processing to above...
                // Map document types to keys matching the tabs
                let docKey = "";
                if (data.documentType?.toLowerCase().includes("profit") || 
                    data.documentType?.toLowerCase().includes("loss") || 
                    data.documentType === "pl") {
                  docKey = "profitLoss";
                } else if (data.documentType?.toLowerCase().includes("balance") || 
                          data.documentType === "bs") {
                  docKey = "balanceSheet";
                } else if (data.documentType?.toLowerCase().includes("trial") || 
                          data.documentType === "tb") {
                  docKey = "trialBalance";
                } else if (data.documentType?.toLowerCase().includes("payable") || 
                          data.documentType === "ap") {
                  docKey = "agedPayables";
                } else if (data.documentType?.toLowerCase().includes("receivable") || 
                          data.documentType === "ar") {
                  docKey = "agedReceivables";
                }
                
                if (docKey) {
                  financials[docKey as keyof FinancialData] = {
                    id: doc.id,
                    ...data,
                    data: data.data || data.financialData || data.extractedData || data.json || {},
                    // Store the document URL for downloading
                    fileUrl: data.fileUrl || data.documentUrl || data.url || null,
                    documentName: data.documentName || data.fileName || `${data.documentType} Document`,
                    createdAt: data.createdAt || new Date().toISOString()
                  };
                }
              });
            }
          } catch (e) {
            console.error('[DEBUG] Error querying business_financials collection:', e);
          }
        }
        
        console.log('[DEBUG] Final financials object keys:', Object.keys(financials));
        
        // If we still have no data, check the financial_documents collection
        if (Object.keys(financials).length === 0) {
          try {
            console.log('[DEBUG] Trying financial_documents collection');
            const financialDocsQuery = query(
              collection(db, "financial_documents"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const docsSnapshot = await getDocs(financialDocsQuery);
            console.log(`[DEBUG] Found ${docsSnapshot.size} documents in financial_documents collection`);
          } catch (e) {
            console.error('[DEBUG] Error querying financial_documents collection:', e);
          }
        }

        return financials as FinancialData;
      } catch (error) {
        console.error("[DEBUG] Error fetching financial data:", error);
        return {} as FinancialData;
      }
    },
    enabled: !!id && !!applicationData,
    retry: 1,
  });

  return { financialData };
};
