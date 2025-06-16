import { getDocuments, deleteDocument } from '@/firebase';

/**
 * Utility function to clean up existing declined offers from the database
 * This should be run once to remove any offers that were declined before
 * the new deletion logic was implemented.
 */
export const cleanupDeclinedOffers = async () => {
  try {
    console.log('Starting cleanup of declined offers...');
    
    // Get all declined offers
    const { data: declinedOffers, error } = await getDocuments(
      'offers',
      [{ field: 'status', operator: '==', value: 'declined' }]
    );
    
    if (error) {
      console.error('Error fetching declined offers:', error);
      return { success: false, error };
    }
    
    if (!declinedOffers || declinedOffers.length === 0) {
      console.log('No declined offers found to clean up');
      return { success: true, deletedCount: 0 };
    }
    
    console.log(`Found ${declinedOffers.length} declined offers to delete`);
    
    // Delete each declined offer
    let deletedCount = 0;
    let errors = [];
    
    for (const offer of declinedOffers) {
      try {
        const { error: deleteError } = await deleteDocument('offers', offer.id);
        if (deleteError) {
          console.error(`Error deleting offer ${offer.id}:`, deleteError);
          errors.push({ offerId: offer.id, error: deleteError });
        } else {
          deletedCount++;
          console.log(`Deleted declined offer ${offer.id}`);
        }
      } catch (err) {
        console.error(`Exception deleting offer ${offer.id}:`, err);
        errors.push({ offerId: offer.id, error: err });
      }
    }
    
    console.log(`Cleanup completed. Deleted ${deletedCount} declined offers.`);
    
    if (errors.length > 0) {
      console.warn(`${errors.length} errors occurred during cleanup:`, errors);
    }
    
    return { 
      success: true, 
      deletedCount, 
      errors: errors.length > 0 ? errors : null 
    };
    
  } catch (err) {
    console.error('Exception during cleanup:', err);
    return { success: false, error: err };
  }
};

/**
 * Check if there are any declined offers in the database
 */
export const checkForDeclinedOffers = async () => {
  try {
    const { data: declinedOffers, error } = await getDocuments(
      'offers',
      [{ field: 'status', operator: '==', value: 'declined' }]
    );
    
    if (error) {
      console.error('Error checking for declined offers:', error);
      return { count: 0, error };
    }
    
    return { count: declinedOffers?.length || 0, error: null };
  } catch (err) {
    console.error('Exception checking for declined offers:', err);
    return { count: 0, error: err };
  }
};
