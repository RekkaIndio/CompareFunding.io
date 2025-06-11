// Debug utility to check if declined lenders are being persisted correctly

export const debugDeclinedLenders = (application: any) => {
  console.log('=== DEBUG: Application Data ===');
  console.log('Application ID:', application?.id);
  console.log('Declined Lenders (raw):', application?.declined_lenders);
  console.log('Declined Lenders (type):', typeof application?.declined_lenders);
  console.log('Declined Lenders (is array):', Array.isArray(application?.declined_lenders));
  console.log('Declined Lenders (length):', application?.declined_lenders?.length);
  
  if (application?.declined_lenders) {
    console.log('Individual declined lenders:');
    application.declined_lenders.forEach((lenderId: string, index: number) => {
      console.log(`  [${index}]: ${lenderId}`);
    });
  }
  
  console.log('Connected Lenders (raw):', application?.connected_lenders);
  console.log('Connected Lenders (type):', typeof application?.connected_lenders);
  console.log('Connected Lenders (is array):', Array.isArray(application?.connected_lenders));
  console.log('Connected Lenders (length):', application?.connected_lenders?.length);
  console.log('===============================');
};
