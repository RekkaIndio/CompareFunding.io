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

        }
        
        // If not in application, check if it's in the business object
        else if (applicationData.business?.id) {
          businessId = applicationData.business.id;

        }
        
        // Fall back to user_id if no business_id is available
        else if (applicationData.application?.user_id) {
          // In this case, we need to first get the businessId from the user document
          const userRef = doc(db, "users", applicationData.application.user_id);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().businessId) {
            businessId = userSnap.data().businessId;

          } else {
            // Final fallback to the user_id itself
            businessId = applicationData.application.user_id;

          }
        }
        
        // Last resort fallback to the application ID
        if (!businessId) {
          businessId = id;

        }
        

        
        let financials = {} as FinancialData;
        
        // Try direct approach first - check if the business doc itself contains financial data
        try {
          const businessDocRef = doc(db, "businesses", businessId);
          const businessDoc = await getDoc(businessDocRef);
          
          if (businessDoc.exists()) {

            // If the business document has direct financial data fields
            const data = businessDoc.data();
            if (data.financials || data.financial_data) {

              financials = data.financials || data.financial_data || {};
            }
          }
        } catch (e) {
          console.error('[DEBUG] Error fetching business document:', e);
        }
        
        // If we didn't find embedded financials, try the subcollection
        if (Object.keys(financials).length === 0) {

          const financialsCollection = collection(db, "businesses", businessId, "financials");
          const querySnapshot = await getDocs(query(financialsCollection, orderBy("createdAt", "desc")));
          

          
          querySnapshot.forEach((doc) => {
            const data = doc.data();

            
            let docKey = "";
            
            // Map document types to keys matching the tabs
            // First check for the new document types from the business documents page
            if (data.documentType === "Signed Accounts" || 
                data.documentType?.toLowerCase().includes("signed accounts")) {
              docKey = "signed-accounts";
            } else if (data.documentType === "Management Accounts" || 
                      data.documentType?.toLowerCase().includes("management accounts")) {
              docKey = "management-accounts";
            } else if (data.documentType === "Aged Debtors" || 
                      data.documentType?.toLowerCase().includes("aged debtors")) {
              docKey = "aged-debtors";
            } else if (data.documentType === "Aged Creditors" || 
                      data.documentType?.toLowerCase().includes("aged creditors")) {
              docKey = "aged-creditors";
            }
            // Keep the old mappings for backward compatibility
            else if (data.documentType?.toLowerCase().includes("profit") || 
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

          try {
            const altFinancialsQuery = query(
              collection(db, "business_financials"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const altQuerySnapshot = await getDocs(altFinancialsQuery);

            
            // Process documents if found
            if (!altQuerySnapshot.empty) {
              altQuerySnapshot.forEach((doc) => {
                const data = doc.data();
                // Similar processing to above...
                // Map document types to keys matching the tabs
                let docKey = "";
                // First check for the new document types from the business documents page
                if (data.documentType === "Signed Accounts" || 
                    data.documentType?.toLowerCase().includes("signed accounts")) {
                  docKey = "signed-accounts";
                } else if (data.documentType === "Management Accounts" || 
                          data.documentType?.toLowerCase().includes("management accounts")) {
                  docKey = "management-accounts";
                } else if (data.documentType === "Aged Debtors" || 
                          data.documentType?.toLowerCase().includes("aged debtors")) {
                  docKey = "aged-debtors";
                } else if (data.documentType === "Aged Creditors" || 
                          data.documentType?.toLowerCase().includes("aged creditors")) {
                  docKey = "aged-creditors";
                }
                // Keep the old mappings for backward compatibility
                else if (data.documentType?.toLowerCase().includes("profit") || 
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
        

        
        // If we still have no data, check the financial_documents collection
        if (Object.keys(financials).length === 0) {
          try {

            const financialDocsQuery = query(
              collection(db, "financial_documents"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const docsSnapshot = await getDocs(financialDocsQuery);

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
