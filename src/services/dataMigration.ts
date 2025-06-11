import { getFirestore, doc, getDoc, setDoc, collection, getDocs, 
  query, where, orderBy, serverTimestamp, updateDoc, DocumentData } from 'firebase/firestore';
import { getDocument } from './firebase';

// Global constants
const DATA_VERSION = '1.0';
const SOURCE_MAPPING = {
  BUSINESS_PROFILES: 'business_profiles',
  BUSINESSES: 'businesses',
  BUSINESS_FINANCIALS: 'business_financials',
  FINANCIAL_DOCUMENTS: 'financial_documents',
  CREDIT_SCORES: 'credit_scores',
};

// Interface for migration result
interface MigrationResult {
  success: boolean;
  message: string;
  sourceFound?: string[];
  dataMigrated?: string[];
  errors?: string[];
}

/**
 * DATA MIGRATION SERVICE
 * 
 * This service handles the consolidation of business data across different collections
 * in the Firestore database. It migrates:
 *  1. Credit score data from business_profiles and credit_scores to businesses
 *  2. Financial documents from various collections to businesses/{businessId}/financials
 * 
 * The canonical data structure is:
 *  - businesses/{businessId} - contains basic business info and credit_info
 *  - businesses/{businessId}/financials/{documentType} - contains financial documents
 */

/**
 * Normalize credit score data from different sources to a common format
 */
export const normalizeCreditScoreData = (creditData: any) => {
  if (!creditData) return null;
  
  console.log('[DEBUG normalizeCreditScoreData] Input creditData:', creditData);
  
  // Standard format we want to return
  const normalized = {
    score: null,
    risk_level: null,
    last_updated: null,
    details: {},
    _dataVersion: DATA_VERSION,
    _consolidated: true,
    _updatedAt: new Date().toISOString()
  };
  
  // Handle format from Firebase subcollection (businesses/{id}/credit_score/latest)
  // Check if we have a nested data structure from Firebase
  if (creditData.data && typeof creditData.data === 'object') {
    // Firebase subcollection format
    if (creditData.data.credit_score !== undefined && creditData.data.credit_score !== null) {
      normalized.score = creditData.data.credit_score;
    } else if (creditData.data.score !== undefined && creditData.data.score !== null) {
      normalized.score = creditData.data.score;
    } else if (creditData.data.details?.report?.creditScore?.currentCreditRating?.providerValue?.value) {
      // Extract from deep nested Firebase structure
      normalized.score = creditData.data.details.report.creditScore.currentCreditRating.providerValue.value;
    }
    
    // Risk level from nested data
    if (creditData.data.risk) {
      normalized.risk_level = creditData.data.risk;
    } else if (creditData.data.common_description) {
      normalized.risk_level = creditData.data.common_description;
    } else if (creditData.data.risk_level) {
      normalized.risk_level = creditData.data.risk_level;
    } else if (creditData.data.details?.report?.creditScore?.currentCreditRating?.commonDescription) {
      // Extract risk level from deep nested Firebase structure
      normalized.risk_level = creditData.data.details.report.creditScore.currentCreditRating.commonDescription;
    }
  }
  
  // Fallback to direct fields if nested data didn't have what we need
  if (normalized.score === null && creditData.credit_score !== undefined && creditData.credit_score !== null) {
    normalized.score = creditData.credit_score;
  } else if (normalized.score === null && creditData.score !== undefined && creditData.score !== null) {
    normalized.score = creditData.score;
  } else if (normalized.score === null && creditData.raw_data?.report?.creditScore?.currentCreditRating?.providerValue?.value) {
    // Extract from raw_data structure at root level
    normalized.score = creditData.raw_data.report.creditScore.currentCreditRating.providerValue.value;
  }
  
  // Risk level - fallback to direct fields
  if (!normalized.risk_level) {
    if (creditData.risk_level) {
      normalized.risk_level = creditData.risk_level;
    } else if (creditData.risk) {
      normalized.risk_level = creditData.risk;
    } else if (creditData.common_description) {
      normalized.risk_level = creditData.common_description;
    }
  }
  
  // Last updated - handle different field names
  if (creditData.last_updated) {
    normalized.last_updated = creditData.last_updated;
  } else if (creditData.updatedAt) {
    normalized.last_updated = creditData.updatedAt;
  } else if (creditData.date) {
    normalized.last_updated = creditData.date;
  } else if (creditData._createdAt) {
    normalized.last_updated = creditData._createdAt;
  } else if (creditData.createdAt) {
    normalized.last_updated = creditData.createdAt;
  } else {
    normalized.last_updated = new Date().toISOString();
  }
  
  // Additional details - preserve all original data
  normalized.details = { ...creditData };
  
  console.log('[DEBUG normalizeCreditScoreData] Normalized result:', normalized);
  
  return normalized;
};

/**
 * Migrate credit score data from business_profiles to businesses collection
 */
export const migrateCreditScoreData = async (businessId: string): Promise<MigrationResult> => {
  console.log('[MIGRATION] Starting credit score migration for business:', businessId);
  const db = getFirestore();
  const result: MigrationResult = {
    success: false,
    message: 'No credit score data found to migrate',
    sourceFound: [],
    dataMigrated: [],
    errors: []
  };
  
  try {
    // Check all possible sources
    let creditScoreData = null;
    let sourceFound = null;
    
    // First check business_profiles
    const { data: businessProfile } = await getDocument('business_profiles', businessId);
    
    if (businessProfile && businessProfile.credit_info) {
      console.log('[MIGRATION] Found credit score in business_profiles');
      creditScoreData = businessProfile.credit_info;
      sourceFound = SOURCE_MAPPING.BUSINESS_PROFILES;
      result.sourceFound.push(sourceFound);
    }
    
    // If not found, check the credit_scores collection
    if (!creditScoreData) {
      const { data: creditScore } = await getDocument('credit_scores', businessId);
      if (creditScore) {
        console.log('[MIGRATION] Found credit score in credit_scores collection');
        creditScoreData = creditScore;
        sourceFound = SOURCE_MAPPING.CREDIT_SCORES;
        result.sourceFound.push(sourceFound);
      }
    }
    
    // If we found credit score data, normalize it and update businesses collection
    if (creditScoreData) {
      const normalizedData = normalizeCreditScoreData(creditScoreData);
      
      // Update the businesses collection
      const businessRef = doc(db, "businesses", businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        // Create new business document
        await setDoc(businessRef, {
          credit_info: normalizedData,
          _created: true,
          _createdAt: serverTimestamp(),
          _dataSource: sourceFound,
          _dataVersion: DATA_VERSION
        });
        console.log('[MIGRATION] Created new business document with credit info');
      } else {
        // Update existing business document
        await updateDoc(businessRef, {
          credit_info: normalizedData,
          _updated: true,
          _updatedAt: serverTimestamp(),
          _dataSource: sourceFound,
          _dataVersion: DATA_VERSION
        });
        console.log('[MIGRATION] Updated business document with credit info');
      }
      
      result.success = true;
      result.message = `Credit score data migrated from ${sourceFound} to businesses collection`;
      result.dataMigrated.push('credit_info');
    }
    
  } catch (error) {
    console.error('[MIGRATION] Error migrating credit score data:', error);
    result.success = false;
    result.message = `Error migrating credit score data: ${error.message}`;
    result.errors.push(error.message);
  }
  
  return result;
};

/**
 * Helper to map document types to standard keys
 */
const mapDocumentTypeToKey = (docType: string): string | null => {
  docType = docType?.toLowerCase() || '';
  
  if (docType.includes('profit') || docType.includes('loss') || docType === 'pl') {
    return 'profitLoss';
  } else if (docType.includes('balance') || docType === 'bs') {
    return 'balanceSheet';
  } else if (docType.includes('trial') || docType === 'tb') {
    return 'trialBalance';
  } else if (docType.includes('payable') || docType === 'ap') {
    return 'agedPayables';
  } else if (docType.includes('receivable') || docType === 'ar') {
    return 'agedReceivables';
  } else if (docType.includes('cash') || docType.includes('flow') || docType === 'cf') {
    return 'cashFlow'; 
  }
  
  return null;
};

/**
 * Process financial document data to ensure consistent structure
 */
const processFinancialDocData = (data: DocumentData): DocumentData => {
  const processed = { ...data };
  
  // Ensure data field exists and is properly structured
  if (!processed.data) {
    // Try to get data from various possible field names
    processed.data = processed.financialData || processed.extractedData || processed.json || {};
  }
  
  // Convert string data to object if needed
  if (typeof processed.data === 'string') {
    try {
      processed.data = JSON.parse(processed.data);
    } catch (e) {
      console.error('[MIGRATION] Could not parse financial data string:', e);
    }
  }
  
  // Add migration metadata
  processed._migrated = true;
  processed._migratedAt = new Date().toISOString();
  processed._dataVersion = DATA_VERSION;
  
  return processed;
};

/**
 * Migrate financial documents to the canonical location
 */
export const migrateFinancialDocuments = async (businessId: string): Promise<MigrationResult> => {
  console.log('[MIGRATION] Starting financial documents migration for business:', businessId);
  const db = getFirestore();
  const result: MigrationResult = {
    success: false,
    message: 'No financial documents found to migrate',
    sourceFound: [],
    dataMigrated: [],
    errors: []
  };
  
  try {
    // Track what we've migrated to avoid duplicates
    const migratedDocTypes = new Set<string>();
    
    // 1. Check if businesses/{businessId} document has embedded financial data
    const businessRef = doc(db, "businesses", businessId);
    const businessDoc = await getDoc(businessRef);
    
    if (businessDoc.exists()) {
      const data = businessDoc.data();
      if (data.financials || data.financial_data) {
        console.log('[MIGRATION] Found embedded financial data in business document');
        result.sourceFound.push('businesses.document');
        
        // Extract and process the financials
        const financials = data.financials || data.financial_data || {};
        
        // For each financial document type, create a document in the financials subcollection
        for (const [key, value] of Object.entries(financials)) {
          try {
            const docKey = mapDocumentTypeToKey(key) || key;
            
            // Skip if we've already migrated this type
            if (migratedDocTypes.has(docKey)) continue;
            
            const processedData = processFinancialDocData({
              documentType: docKey,
              data: value,
              createdAt: serverTimestamp(),
              _sourceCollection: 'businesses.document',
              _sourceField: key
            });
            
            // Save to the financials subcollection
            await setDoc(doc(db, "businesses", businessId, "financials", docKey), processedData);
            console.log(`[MIGRATION] Migrated embedded ${docKey} financial data`);
            
            result.dataMigrated.push(docKey);
            migratedDocTypes.add(docKey);
          } catch (e) {
            console.error(`[MIGRATION] Error migrating embedded financial document ${key}:`, e);
            result.errors.push(`Error migrating embedded ${key}: ${e.message}`);
          }
        }
      }
    }
    
    // 2. Check existing financials subcollection
    try {
      const financialsCollection = collection(db, "businesses", businessId, "financials");
      const querySnapshot = await getDocs(query(financialsCollection));
      
      if (!querySnapshot.empty) {
        console.log(`[MIGRATION] Found ${querySnapshot.size} existing documents in financials subcollection`);
        result.sourceFound.push('businesses/{id}/financials');
        
        querySnapshot.forEach(doc => {
          const docData = doc.data();
          const docType = docData.documentType || doc.id;
          migratedDocTypes.add(docType); // Mark as already exists
          console.log(`[MIGRATION] Document already exists: ${doc.id}`);
        });
      }
    } catch (e) {
      console.error('[MIGRATION] Error checking existing financials subcollection:', e);
    }
    
    // 3. Check business_financials collection
    try {
      const financialsQuery = query(
        collection(db, "business_financials"),
        where("business_id", "==", businessId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(financialsQuery);
      
      if (!querySnapshot.empty) {
        console.log(`[MIGRATION] Found ${querySnapshot.size} documents in business_financials collection`);
        result.sourceFound.push(SOURCE_MAPPING.BUSINESS_FINANCIALS);
        
        // Use a for...of loop instead of forEach with async to ensure proper async handling
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const docKey = mapDocumentTypeToKey(data.documentType) || 'other';
          
          // Skip if we've already migrated this type
          if (migratedDocTypes.has(docKey)) {
            console.log(`[MIGRATION] Skipping ${docKey} - already exists`);
            continue;
          }
          
          try {
            const processedData = processFinancialDocData({
              ...data,
              _sourceCollection: SOURCE_MAPPING.BUSINESS_FINANCIALS,
              _sourceDocId: docSnapshot.id
            });
            
            // Save to the financials subcollection
            const docRef = doc(db, "businesses", businessId, "financials", docKey);
            await setDoc(docRef, processedData);
            console.log(`[MIGRATION] Migrated ${docKey} from business_financials`);
            
            result.dataMigrated.push(docKey);
            migratedDocTypes.add(docKey);
          } catch (e) {
            console.error(`[MIGRATION] Error migrating business_financials document:`, e);
            result.errors.push(`Error migrating from business_financials: ${e.message}`);
          }
        };
      }
    } catch (e) {
      console.error('[MIGRATION] Error checking business_financials collection:', e);
      result.errors.push(`Error checking business_financials: ${e.message}`);
    }
    
    // 4. Check financial_documents collection
    try {
      const financialDocsQuery = query(
        collection(db, "financial_documents"),
        where("business_id", "==", businessId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(financialDocsQuery);
      
      if (!querySnapshot.empty) {
        console.log(`[MIGRATION] Found ${querySnapshot.size} documents in financial_documents collection`);
        result.sourceFound.push(SOURCE_MAPPING.FINANCIAL_DOCUMENTS);
        
        // Use a for...of loop instead of forEach with async to ensure proper async handling
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const docKey = mapDocumentTypeToKey(data.documentType) || 'other';
          
          // Skip if we've already migrated this type
          if (migratedDocTypes.has(docKey)) {
            console.log(`[MIGRATION] Skipping ${docKey} - already exists`);
            continue;
          }
          
          try {
            const processedData = processFinancialDocData({
              ...data,
              _sourceCollection: SOURCE_MAPPING.FINANCIAL_DOCUMENTS,
              _sourceDocId: docSnapshot.id
            });
            
            // Save to the financials subcollection
            const docRef = doc(db, "businesses", businessId, "financials", docKey);
            await setDoc(docRef, processedData);
            console.log(`[MIGRATION] Migrated ${docKey} from financial_documents`);
            
            result.dataMigrated.push(docKey);
            migratedDocTypes.add(docKey);
          } catch (e) {
            console.error(`[MIGRATION] Error migrating financial_documents document:`, e);
            result.errors.push(`Error migrating from financial_documents: ${e.message}`);
          }
        };
      }
    } catch (e) {
      console.error('[MIGRATION] Error checking financial_documents collection:', e);
      result.errors.push(`Error checking financial_documents: ${e.message}`);
    }
    
    // Set success if we found and migrated any data
    if (result.dataMigrated.length > 0) {
      result.success = true;
      result.message = `Financial documents migrated from ${result.sourceFound.join(', ')}`;
    }
    
  } catch (error) {
    console.error('[MIGRATION] Error migrating financial documents:', error);
    result.success = false;
    result.message = `Error migrating financial documents: ${error.message}`;
    result.errors.push(error.message);
  }
  
  return result;
};

/**
 * Consolidate all business data - main entry point
 * Runs both credit score and financial document migrations
 */
export const consolidateBusinessData = async (businessId: string): Promise<MigrationResult> => {
  console.log('[MIGRATION] Starting full data consolidation for business:', businessId);
  
  try {
    // Migrate credit score data first
    const creditScoreResult = await migrateCreditScoreData(businessId);
    
    // Then migrate financial documents
    const financialResult = await migrateFinancialDocuments(businessId);
    
    // Combine the results
    const combinedResult: MigrationResult = {
      success: creditScoreResult.success || financialResult.success,
      message: `Consolidation ${creditScoreResult.success || financialResult.success ? 'completed' : 'failed'}`,
      sourceFound: [
        ...(creditScoreResult.sourceFound || []),
        ...(financialResult.sourceFound || [])
      ],
      dataMigrated: [
        ...(creditScoreResult.dataMigrated || []),
        ...(financialResult.dataMigrated || [])
      ],
      errors: [
        ...(creditScoreResult.errors || []),
        ...(financialResult.errors || [])
      ]
    };
    
    return combinedResult;
    
  } catch (error) {
    console.error('[MIGRATION] Error in consolidateBusinessData:', error);
    return {
      success: false,
      message: `Consolidation error: ${error.message}`,
      errors: [error.message]
    };
  }
};
