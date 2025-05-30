/**
 * Data Migration Script
 * 
 * This script performs batch data migration across all businesses in the database.
 * It consolidates credit score data and financial documents into the canonical structure.
 * 
 * Usage:
 * npm run migrate-data
 * 
 * Environment variables:
 * - DRY_RUN=true|false - When true, only logs what would be migrated without making changes
 * - LIMIT=number - Limits the number of businesses processed
 * - BUSINESS_ID=id - Process only a specific business ID
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Constants
const DRY_RUN = process.env.DRY_RUN === 'true';
const LIMIT = parseInt(process.env.LIMIT) || Infinity;
const SPECIFIC_BUSINESS_ID = process.env.BUSINESS_ID;

// Main migration function
async function runMigration() {
  console.log(`⚙️ Starting data migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log(`Limit: ${LIMIT === Infinity ? 'No limit' : LIMIT} businesses`);
  
  if (SPECIFIC_BUSINESS_ID) {
    console.log(`Processing only business ID: ${SPECIFIC_BUSINESS_ID}`);
    await processBusinessId(SPECIFIC_BUSINESS_ID);
  } else {
    await processAllBusinesses();
  }
}

// Process all businesses
async function processAllBusinesses() {
  console.log('Gathering list of businesses...');
  
  // Step 1: Get all business IDs from business_profiles collection
  const businessProfilesSnapshot = await db.collection('business_profiles').limit(LIMIT).get();
  const businessIds = businessProfilesSnapshot.docs.map(doc => doc.id);
  
  console.log(`Found ${businessIds.length} businesses in business_profiles collection`);
  
  // Step 2: Process each business
  const results = {
    total: businessIds.length,
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (let i = 0; i < businessIds.length; i++) {
    const businessId = businessIds[i];
    console.log(`Processing business ${i + 1}/${businessIds.length}: ${businessId}`);
    
    try {
      const result = await processBusinessId(businessId);
      if (result.success) {
        results.success++;
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`❌ Error processing business ${businessId}:`, error);
      results.failed++;
    }
  }
  
  // Print final results
  console.log('\n===== MIGRATION RESULTS =====');
  console.log(`Total businesses: ${results.total}`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`⚠️ Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
}

// Process a single business
async function processBusinessId(businessId) {
  const result = {
    businessId,
    success: false,
    skipped: false,
    creditScore: {
      found: false,
      migrated: false,
      source: null
    },
    financialDocs: {
      found: false,
      migrated: false,
      count: 0,
      sources: []
    }
  };
  
  try {
    // Step 1: Migrate credit score data
    await migrateCreditScoreData(businessId, result);
    
    // Step 2: Migrate financial documents
    await migrateFinancialDocuments(businessId, result);
    
    // Mark as successful if either credit score or financial docs were processed
    result.success = result.creditScore.migrated || result.financialDocs.migrated;
    
    // Mark as skipped if nothing was found to migrate
    result.skipped = !result.creditScore.found && !result.financialDocs.found;
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing business ${businessId}:`, error);
    return {
      ...result,
      error: error.message
    };
  }
}

// Credit score migration
async function migrateCreditScoreData(businessId, result) {
  // Step 1: Check for credit score data in business_profiles
  const businessProfileRef = db.collection('business_profiles').doc(businessId);
  const businessProfile = await businessProfileRef.get();
  
  let creditScoreData = null;
  let sourceCollection = null;
  
  if (businessProfile.exists && businessProfile.data().credit_info) {
    creditScoreData = businessProfile.data().credit_info;
    sourceCollection = 'business_profiles';
    result.creditScore.found = true;
    result.creditScore.source = sourceCollection;
  }
  
  // Step 2: If not found, check credit_scores collection
  if (!creditScoreData) {
    const creditScoreRef = db.collection('credit_scores').doc(businessId);
    const creditScore = await creditScoreRef.get();
    
    if (creditScore.exists) {
      creditScoreData = creditScore.data();
      sourceCollection = 'credit_scores';
      result.creditScore.found = true;
      result.creditScore.source = sourceCollection;
    }
  }
  
  // Step 3: If credit score data found, normalize and save it
  if (creditScoreData) {
    console.log(`Found credit score data in ${sourceCollection} collection`);
    
    // Normalize the credit score data
    const normalizedData = normalizeCreditScoreData(creditScoreData);
    
    // Get or create business document
    const businessRef = db.collection('businesses').doc(businessId);
    const businessDoc = await businessRef.get();
    
    if (!DRY_RUN) {
      if (!businessDoc.exists) {
        // Create new business document
        await businessRef.set({
          credit_info: normalizedData,
          _created: true,
          _createdAt: admin.firestore.FieldValue.serverTimestamp(),
          _dataSource: sourceCollection,
          _dataVersion: '1.0'
        });
      } else {
        // Update existing business document
        await businessRef.update({
          credit_info: normalizedData,
          _updated: true,
          _updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          _dataSource: sourceCollection,
          _dataVersion: '1.0'
        });
      }
      
      result.creditScore.migrated = true;
      console.log('✅ Credit score data migrated successfully');
    } else {
      console.log('🔍 [DRY RUN] Would migrate credit score data');
    }
  } else {
    console.log('⚠️ No credit score data found');
  }
}

// Financial documents migration
async function migrateFinancialDocuments(businessId, result) {
  // Track what document types we've already migrated
  const migratedDocTypes = new Set();
  
  // Step 1: Check if businesses/{businessId} document has embedded financial data
  const businessRef = db.collection('businesses').doc(businessId);
  const businessDoc = await businessRef.get();
  
  if (businessDoc.exists) {
    const data = businessDoc.data();
    if (data.financials || data.financial_data) {
      console.log('Found embedded financial data in business document');
      result.financialDocs.found = true;
      result.financialDocs.sources.push('businesses.document');
      
      // Extract the financials
      const financials = data.financials || data.financial_data || {};
      
      // For each financial document type, create a document in the financials subcollection
      for (const [key, value] of Object.entries(financials)) {
        try {
          const docKey = mapDocumentTypeToKey(key) || key;
          
          // Skip if we've already migrated this type
          if (migratedDocTypes.has(docKey)) continue;
          
          const processedData = {
            documentType: docKey,
            data: value,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            _sourceCollection: 'businesses.document',
            _sourceField: key,
            _dataVersion: '1.0'
          };
          
          if (!DRY_RUN) {
            // Save to the financials subcollection
            await db.collection('businesses').doc(businessId)
              .collection('financials').doc(docKey).set(processedData);
            
            console.log(`✅ Migrated embedded ${docKey} financial data`);
            
            result.financialDocs.count++;
            migratedDocTypes.add(docKey);
          } else {
            console.log(`🔍 [DRY RUN] Would migrate ${docKey} financial data`);
            result.financialDocs.count++;
          }
        } catch (e) {
          console.error(`❌ Error migrating embedded financial document ${key}:`, e);
        }
      }
    }
  }
  
  // Step 2: Check existing financials subcollection
  try {
    const financialsCollection = db.collection('businesses').doc(businessId).collection('financials');
    const querySnapshot = await financialsCollection.get();
    
    if (!querySnapshot.empty) {
      console.log(`Found ${querySnapshot.size} existing documents in financials subcollection`);
      
      querySnapshot.forEach(doc => {
        const docType = doc.id;
        migratedDocTypes.add(docType); // Mark as already exists
      });
    }
  } catch (e) {
    console.error('Error checking existing financials subcollection:', e);
  }
  
  // Step 3: Check business_financials collection
  try {
    const financialsQuery = db.collection('business_financials')
      .where('business_id', '==', businessId)
      .orderBy('createdAt', 'desc');
    
    const querySnapshot = await financialsQuery.get();
    
    if (!querySnapshot.empty) {
      console.log(`Found ${querySnapshot.size} documents in business_financials collection`);
      result.financialDocs.found = true;
      result.financialDocs.sources.push('business_financials');
      
      // Process each document
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const docKey = mapDocumentTypeToKey(data.documentType) || 'other';
        
        // Skip if we've already migrated this type
        if (migratedDocTypes.has(docKey)) {
          console.log(`⚠️ Skipping ${docKey} - already exists`);
          continue;
        }
        
        try {
          const processedData = {
            ...data,
            _sourceCollection: 'business_financials',
            _sourceDocId: doc.id,
            _dataVersion: '1.0'
          };
          
          if (!DRY_RUN) {
            // Save to the financials subcollection
            await db.collection('businesses').doc(businessId)
              .collection('financials').doc(docKey).set(processedData);
            
            console.log(`✅ Migrated ${docKey} from business_financials`);
            
            result.financialDocs.count++;
            migratedDocTypes.add(docKey);
          } else {
            console.log(`🔍 [DRY RUN] Would migrate ${docKey} from business_financials`);
            result.financialDocs.count++;
          }
        } catch (e) {
          console.error(`❌ Error migrating business_financials document:`, e);
        }
      }
    }
  } catch (e) {
    console.error('Error checking business_financials collection:', e);
  }
  
  // Step 4: Check financial_documents collection
  try {
    const financialDocsQuery = db.collection('financial_documents')
      .where('business_id', '==', businessId)
      .orderBy('createdAt', 'desc');
    
    const querySnapshot = await financialDocsQuery.get();
    
    if (!querySnapshot.empty) {
      console.log(`Found ${querySnapshot.size} documents in financial_documents collection`);
      result.financialDocs.found = true;
      result.financialDocs.sources.push('financial_documents');
      
      // Process each document
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const docKey = mapDocumentTypeToKey(data.documentType) || 'other';
        
        // Skip if we've already migrated this type
        if (migratedDocTypes.has(docKey)) {
          console.log(`⚠️ Skipping ${docKey} - already exists`);
          continue;
        }
        
        try {
          const processedData = {
            ...data,
            _sourceCollection: 'financial_documents',
            _sourceDocId: doc.id,
            _dataVersion: '1.0'
          };
          
          if (!DRY_RUN) {
            // Save to the financials subcollection
            await db.collection('businesses').doc(businessId)
              .collection('financials').doc(docKey).set(processedData);
            
            console.log(`✅ Migrated ${docKey} from financial_documents`);
            
            result.financialDocs.count++;
            migratedDocTypes.add(docKey);
          } else {
            console.log(`🔍 [DRY RUN] Would migrate ${docKey} from financial_documents`);
            result.financialDocs.count++;
          }
        } catch (e) {
          console.error(`❌ Error migrating financial_documents document:`, e);
        }
      }
    }
  } catch (e) {
    console.error('Error checking financial_documents collection:', e);
  }
  
  // Set migration status
  result.financialDocs.migrated = result.financialDocs.count > 0;
}

// Helper to normalize credit score data
function normalizeCreditScoreData(creditData) {
  if (!creditData) return null;
  
  // Standard format we want to return
  const normalized = {
    score: null,
    risk_level: null,
    last_updated: null,
    details: {},
    _dataVersion: '1.0',
    _consolidated: true,
    _updatedAt: new Date().toISOString()
  };
  
  // Handle format from business_profiles.credit_info
  if (creditData.credit_score) {
    normalized.score = creditData.credit_score;
  } else if (creditData.score) {
    normalized.score = creditData.score;
  }
  
  // Risk level
  if (creditData.risk_level) {
    normalized.risk_level = creditData.risk_level;
  } else if (creditData.risk) {
    normalized.risk_level = creditData.risk;
  } else if (creditData.common_description) {
    normalized.risk_level = creditData.common_description;
  }
  
  // Last updated
  if (creditData.last_updated) {
    normalized.last_updated = creditData.last_updated;
  } else if (creditData.updatedAt) {
    normalized.last_updated = creditData.updatedAt;
  } else if (creditData.date) {
    normalized.last_updated = creditData.date;
  } else {
    normalized.last_updated = new Date().toISOString();
  }
  
  // Additional details
  normalized.details = { ...creditData };
  
  return normalized;
}

// Helper to map document types to standard keys
function mapDocumentTypeToKey(docType) {
  if (!docType) return null;
  
  docType = docType.toLowerCase();
  
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
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
