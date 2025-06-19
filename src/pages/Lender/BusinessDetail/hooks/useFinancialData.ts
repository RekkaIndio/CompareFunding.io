import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { ApplicationData, FinancialData } from '../types';

export const useFinancialData = (id: string | undefined, applicationData: ApplicationData | undefined) => {
  const db = getFirestore();

  // Add debugging to see what applicationData we're receiving
  console.log('[DEBUG useFinancialData] Input params:', { id, applicationData });

  // Fetch financial data from the businesses/{businessId}/financials collection
  const { data: financialData, refetch, isLoading } = useQuery<FinancialData>({
    queryKey: [
      'businessFinancials', 
      id, 
      applicationData?.application?.business_id, 
      applicationData?.application?.user_id,
      // Add timestamp to ensure cache invalidation when data changes
      Math.floor(Date.now() / (1000 * 60)) // Invalidate every minute
    ],
    queryFn: async () => {
      if (!id || !applicationData) return {} as FinancialData;

      try {
        // Get business ID from various possible locations
        // We need to try multiple businessId sources since businesses save to {user.uid}/financials
        const potentialBusinessIds = [];
        
        // First priority: user_id from application (this is where businesses typically save documents)
        if (applicationData.application?.user_id) {
          potentialBusinessIds.push(applicationData.application.user_id);
        }
        
        // Second priority: business_id from application 
        if (applicationData.application?.business_id) {
          potentialBusinessIds.push(applicationData.application.business_id);
        }
        
        // Third priority: business object id
        if (applicationData.business?.id) {
          potentialBusinessIds.push(applicationData.business.id);
        }
        
        // Fourth priority: check user document for businessId
        if (applicationData.application?.user_id) {
          try {
            const userRef = doc(db, "users", applicationData.application.user_id);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists() && userSnap.data().businessId) {
              potentialBusinessIds.push(userSnap.data().businessId);
            }
          } catch (e) {
            console.warn('[DEBUG] Error fetching user document for businessId:', e);
          }
        }
        
        // Last resort: application ID
        if (id) {
          potentialBusinessIds.push(id);
        }
        
        // Remove duplicates
        const uniqueBusinessIds = [...new Set(potentialBusinessIds)];
        console.log('[DEBUG] Potential business IDs to try:', uniqueBusinessIds);
        
        let financials = {} as FinancialData;
        
        // Try each potential business ID until we find financial data
        for (const businessId of uniqueBusinessIds) {
          console.log(`[DEBUG] Trying to fetch financial data for business ID: ${businessId}`);
          
          // Try direct approach first - check if the business doc itself contains financial data
          try {
            const businessDocRef = doc(db, "businesses", businessId);
            const businessDoc = await getDoc(businessDocRef);
            
            if (businessDoc.exists()) {
              // If the business document has direct financial data fields
              const data = businessDoc.data();
              if (data.financials || data.financial_data) {
                console.log(`[DEBUG] Found embedded financial data in business document for ID: ${businessId}`);
                financials = data.financials || data.financial_data || {};
                break; // Found data, stop trying other IDs
              }
            }
          } catch (e) {
            console.error(`[DEBUG] Error fetching business document for ID ${businessId}:`, e);
          }
          
          // If we didn't find embedded financials, try the subcollection
          try {
            const financialsCollection = collection(db, "businesses", businessId, "financials");
            const querySnapshot = await getDocs(query(financialsCollection, orderBy("createdAt", "desc")));
            
            if (!querySnapshot.empty) {
              console.log(`[DEBUG] Found ${querySnapshot.size} documents in financials subcollection for business ID: ${businessId}`);
              
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
              
              // If we found financial data, break out of the business ID loop
              if (Object.keys(financials).length > 0) {
                console.log(`[DEBUG] Successfully found financial data for business ID: ${businessId}`);
                break;
              }
            }
          } catch (e) {
            console.error(`[DEBUG] Error querying financials subcollection for business ID ${businessId}:`, e);
          }
          
          // Also check the business_financials collection as a fallback for this business ID
          try {
            const altFinancialsQuery = query(
              collection(db, "business_financials"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const altQuerySnapshot = await getDocs(altFinancialsQuery);
            
            // Process documents if found
            if (!altQuerySnapshot.empty) {
              console.log(`[DEBUG] Found ${altQuerySnapshot.size} documents in business_financials collection for business ID: ${businessId}`);
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
              
              // If we found financial data, break out of the business ID loop
              if (Object.keys(financials).length > 0) {
                console.log(`[DEBUG] Successfully found financial data in business_financials for business ID: ${businessId}`);
                break;
              }
            }
          } catch (e) {
            console.error(`[DEBUG] Error querying business_financials collection for business ID ${businessId}:`, e);
          }
          
          // If we still have no data for this business ID, check the financial_documents collection
          try {
            const financialDocsQuery = query(
              collection(db, "financial_documents"),
              where("business_id", "==", businessId),
              orderBy("createdAt", "desc")
            );
            const docsSnapshot = await getDocs(financialDocsQuery);
            
            if (!docsSnapshot.empty) {
              console.log(`[DEBUG] Found ${docsSnapshot.size} documents in financial_documents collection for business ID: ${businessId}`);
              // If we found documents, break out (could add processing here if needed)
              break;
            }
          } catch (e) {
            console.error(`[DEBUG] Error querying financial_documents collection for business ID ${businessId}:`, e);
          }
        }
        
        console.log(`[DEBUG] Final financial data result:`, Object.keys(financials));

        return financials as FinancialData;
      } catch (error) {
        console.error("[DEBUG] Error fetching financial data:", error);
        return {} as FinancialData;
      }
    },
    enabled: !!id && !!applicationData,
    retry: 1,
    // Ensure fresh data is always fetched
    staleTime: 0, // Consider data immediately stale
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes but refetch
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  return { financialData, refetchFinancialData: refetch, isLoadingFinancialData: isLoading };
};
