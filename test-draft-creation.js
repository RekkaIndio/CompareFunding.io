// Test script to verify draft creation functionality
// Run this in browser console when logged in as a user

console.log('🧪 Testing draft creation functionality...');

// Mock user ID - replace with actual user ID when testing
const TEST_USER_ID = 'test_user_123';

// Test the mapping function
const testSignupData = {
  amount: '75000',
  fundingPurpose: 'expansion',
  duration: '2_years',
  timeframe: 'immediate',
  marketingConsent: true
};

const testBusinessData = {
  business_name: 'Test Company Ltd',
  company_number: 'TC123456',
  industry: 'Technology',
  company_size: '11-50',
  website: 'https://testcompany.com',
  annual_revenue: '500000',
  description: 'A technology company focused on innovation'
};

// Create a draft application function for testing
window.testCreateDraftApplication = async (userId = TEST_USER_ID) => {
  try {
    console.log('🔄 Testing draft creation for user:', userId);
    
    // This would normally be called from the signup journey completion
    const result = await window.signupDataUtils?.createDraftApplication(userId);
    
    if (result) {
      console.log('✅ Draft application created successfully');
    } else {
      console.log('ℹ️ Draft application was not created (likely already exists)');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error creating draft application:', error);
    return false;
  }
};

// Test the tour completion workflow
window.testTourCompletion = () => {
  console.log('🎯 Testing tour completion workflow...');
  
  // Simulate tour completion
  if (window.tourContext?.endTour) {
    console.log('🔄 Calling endTour...');
    window.tourContext.endTour();
  } else {
    console.error('❌ Tour context not available');
  }
};

// Test eligibility skip workflow
window.testEligibilitySkip = () => {
  console.log('🎯 Testing eligibility skip workflow...');
  
  // This would be called when user clicks "Skip Tour" on eligibility page
  // The actual function is in EligibilityPage component
  console.log('ℹ️ This would create a draft when user skips tour');
};

console.log('✅ Test functions loaded:');
console.log('- testCreateDraftApplication(userId)');
console.log('- testTourCompletion()');
console.log('- testEligibilitySkip()');

// Instructions
console.log('\n📋 To test:');
console.log('1. Complete the signup journey');
console.log('2. Reach the eligibility page');
console.log('3. Either start the tour or skip to dashboard');
console.log('4. Check the dashboard for draft applications');
console.log('5. Check browser console for creation logs');
