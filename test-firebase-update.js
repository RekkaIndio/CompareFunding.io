// Simple test to verify updateDocument functionality
import { updateDocument, getDocument } from './src/firebase.js';

const testUpdateDocument = async () => {
  try {
    console.log('Testing updateDocument functionality...');
    
    // Test data
    const testCollectionName = 'test_collection';
    const testDocumentId = 'test_doc_id';
    const testData = {
      test_field: 'test_value',
      test_array: ['item1', 'item2'],
      timestamp: new Date().toISOString()
    };
    
    console.log('Test data:', testData);
    
    // Try to update (this will create the document if it doesn't exist)
    const updateResult = await updateDocument(testCollectionName, testDocumentId, testData);
    console.log('Update result:', updateResult);
    
    if (updateResult.error) {
      console.error('Update failed:', updateResult.error);
      return;
    }
    
    // Verify the update by fetching the document
    const fetchResult = await getDocument(testCollectionName, testDocumentId);
    console.log('Fetch result:', fetchResult);
    
    if (fetchResult.data) {
      console.log('Document data after update:', fetchResult.data);
      console.log('Test field value:', fetchResult.data.test_field);
      console.log('Test array value:', fetchResult.data.test_array);
    } else {
      console.error('Failed to fetch document:', fetchResult.error);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

// Run the test
testUpdateDocument();
