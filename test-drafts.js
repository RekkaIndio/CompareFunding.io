// Debug script to test draft application functionality
import { getDocuments, getDocument, createDocument } from '../src/firebase';

const testDraftApplicationFlow = async () => {
  try {
    console.log('=== Testing Draft Application Flow ===');
    
    // Test 1: Check if we can query applications
    console.log('\n1. Testing application queries...');
    const { data: allApps, error: appsError } = await getDocuments('applications', []);
    
    if (appsError) {
      console.error('Error fetching applications:', appsError);
    } else {
      console.log(`Found ${allApps?.length || 0} applications in database`);
      if (allApps && allApps.length > 0) {
        console.log('Sample application:', allApps[0]);
      }
    }
    
    // Test 2: Check for draft applications specifically
    console.log('\n2. Testing draft application queries...');
    const { data: draftApps, error: draftError } = await getDocuments('applications', [
      { field: 'status', operator: '==', value: 'draft' }
    ]);
    
    if (draftError) {
      console.error('Error fetching draft applications:', draftError);
    } else {
      console.log(`Found ${draftApps?.length || 0} draft applications`);
      if (draftApps && draftApps.length > 0) {
        console.log('Sample draft application:', draftApps[0]);
      }
    }
    
    // Test 3: Try to create a test draft application
    console.log('\n3. Testing draft application creation...');
    const testApplicationData = {
      application_number: `TEST-${Date.now()}`,
      user_id: 'test-user-id',
      business_id: 'test-user-id',
      company_name: 'Test Company',
      loan_amount: 50000,
      loan_term_months: 24,
      loan_type: 'term_loan',
      purpose_category: 'working_capital',
      purpose: 'Test purpose',
      has_personal_guarantee: false,
      is_secured: false,
      status: 'draft',
      application_date: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
      matched_lenders: [],
      is_prefilled: true,
      prefill_source: 'test_script',
    };
    
    const { data: newApp, error: createError } = await createDocument('applications', testApplicationData);
    
    if (createError) {
      console.error('Error creating test draft application:', createError);
    } else {
      console.log('Successfully created test draft application:', newApp?.id);
    }
    
  } catch (err) {
    console.error('Test failed with error:', err);
  }
};

// Run the test
testDraftApplicationFlow();
