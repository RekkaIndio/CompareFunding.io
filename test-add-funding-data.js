// Test script to add sample funding data to the current user
// This simulates what would be saved during the signup journey

import { getAuth } from 'firebase/auth';
import { updateDocument } from '../src/firebase';

const addTestFundingData = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user logged in');
      return;
    }
    
    console.log('Adding test funding data for user:', user.uid);
    
    const testFundingData = {
      amount: 75000,
      fundingPurpose: 'expansion',
      duration: '2_years'
    };
    
    const { error } = await updateDocument('users', user.uid, {
      fundingApplication: testFundingData
    });
    
    if (error) {
      console.error('Error adding test funding data:', error);
    } else {
      console.log('Test funding data added successfully:', testFundingData);
      console.log('Now visit /applications/new to test the prefill functionality');
    }
    
  } catch (err) {
    console.error('Test failed with error:', err);
  }
};

// Export for use in browser console
window.addTestFundingData = addTestFundingData;
console.log('Run addTestFundingData() in console to add test data');
