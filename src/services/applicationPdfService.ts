import { ApplicationData, Application, Business } from '@/pages/Lender/BusinessDetail/types';
import { 
  generateMatchedApplicationPdf, 
  generateUnmatchedApplicationPdf,
  generateMatchedPdfFilename,
  generateUnmatchedPdfFilename,
  downloadPdf,
  ApplicationPdfOptions
} from './pdf';

/**
 * Generates a PDF document for a business application
 * Routes to the appropriate service based on whether the lender is matched
 * @param applicationData - The application data to include in the PDF
 * @param options - PDF generation options including whether lender is matched
 * @param financialData - Optional financial data from useFinancialData hook
 * @returns Promise<Uint8Array> - The generated PDF as a byte array
 */
export async function generateApplicationPdf(
  applicationData: ApplicationData, 
  options: ApplicationPdfOptions,
  financialData?: any
): Promise<Uint8Array> {
  const { isLenderMatched } = options;

  if (isLenderMatched) {
    // Use matched PDF service for full business details
    return await generateMatchedApplicationPdf(applicationData, options, financialData);
  } else {
    // Use unmatched PDF service for limited details
    return await generateUnmatchedApplicationPdf(applicationData, options, financialData);
  }
}

/**
 * Generates an appropriate filename for the PDF based on match status
 * @param application - The application object
 * @param business - The business object (optional)
 * @param isLenderMatched - Whether the lender is matched
 * @returns string - The generated filename
 */
export function generatePdfFilename(application: Application, business?: Business, isLenderMatched?: boolean): string {
  if (isLenderMatched) {
    return generateMatchedPdfFilename(application, business);
  } else {
    return generateUnmatchedPdfFilename(application);
  }
}

// Re-export the download function for convenience
export { downloadPdf };