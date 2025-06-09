// Manual test script to verify draft application functionality
// Run this in the browser console when logged in

const testDraftApplicationFlow = async () => {
  try {
    // Import Firebase functions
    const { createDocument, getDocuments } = window;
    
    if (!createDocument || !getDocuments) {
      console.error('Firebase functions not available. Make sure you\'re on the application page.');
      return;
    }
    
    // Get current user
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user logged in');
      return;
    }
    
    console.log('=== Testing Draft Application Flow ===');
    console.log('User ID:', user.uid);
    
    // Create a test draft application
    const testDraft = {
      application_number: `TEST-${Date.now()}`,
      user_id: user.uid,
      business_id: user.uid,
      company_name: 'Test Company Ltd',
      loan_amount: 75000,
      loan_term_months: 24,
      loan_type: 'term_loan',
      purpose_category: 'expansion',
      purpose: 'Test business expansion for draft functionality',
      has_personal_guarantee: false,
      is_secured: false,
      status: 'draft',
      application_date: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
      matched_lenders: [],
      is_prefilled: true,
      prefill_source: 'manual_test',
    };
    
    console.log('Creating test draft application...');
    const { data: newDraft, error: createError } = await createDocument('applications', testDraft);
    
    if (createError) {
      console.error('Error creating draft:', createError);
      return;
    }
    
    console.log('Draft created successfully:', newDraft.id);
    
    // Verify draft was created by querying
    console.log('Verifying draft creation...');
    const { data: allDrafts, error: queryError } = await getDocuments('applications', [
      { field: 'user_id', operator: '==', value: user.uid },
      { field: 'status', operator: '==', value: 'draft' }
    ]);
    
    if (queryError) {
      console.error('Error querying drafts:', queryError);
      return;
    }
    
    console.log(`Found ${allDrafts?.length || 0} draft applications for user`);
    console.log('Draft applications:', allDrafts);
    
    console.log('Test completed! Now navigate to the business dashboard to see if the draft appears.');
    
    return newDraft.id;
    
  } catch (err) {
    console.error('Test failed:', err);
  }
};

// Make function available globally
window.testDraftApplicationFlow = testDraftApplicationFlow;
console.log('Test function loaded. Run testDraftApplicationFlow() to test draft creation.');
