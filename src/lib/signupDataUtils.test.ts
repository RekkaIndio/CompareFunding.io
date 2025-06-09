import { mapSignupDataToApplication } from './signupDataUtils';

// Test the mapping function
const testSignupData = {
  amount: '50000',
  fundingPurpose: 'expansion',
  duration: '2_years',
  timeframe: 'immediate',
  marketingConsent: true
};

const result = mapSignupDataToApplication(testSignupData);
console.log('Test mapping result:', result);

// Expected output:
// {
//   loan_amount: 50000,
//   purpose_category: 'expansion',
//   purpose: 'Business expansion and growth initiatives',
//   loan_term_months: 24,
//   loan_type: 'term_loan'
// }
