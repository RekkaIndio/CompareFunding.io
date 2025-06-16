import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Application, ApplicationData, Business } from '@/pages/Lender/BusinessDetail/types';
import { ApplicationPdfOptions } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { renderFinancialData } from '../renderers';

/**
 * Generates a PDF document for a matched business application with full details
 * @param applicationData - The application data to include in the PDF
 * @param options - PDF generation options
 * @param financialData - Optional financial data from useFinancialData hook
 * @returns Promise<Uint8Array> - The generated PDF as a byte array
 */
export async function generateMatchedApplicationPdf(
  applicationData: ApplicationData, 
  options: ApplicationPdfOptions,
  financialData?: any
): Promise<Uint8Array> {
  const { lenderName = 'Lender', generatedDate = new Date() } = options;
  const application = applicationData.application;
  const business = applicationData.business;
  const creditScore = applicationData.creditScore;
  
  if (!application || !business) {
    throw new Error('Missing application or business data');
  }

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Create the first page
  let page = pdfDoc.addPage([595.276, 841.890]); // A4 size
  const { width, height } = page.getSize();
  
  // Define colors
  const primaryColor = rgb(0.13, 0.16, 0.21); // #212936
  const accentColor = rgb(1, 0.5, 0); // #ff8000
  
  let yPosition = height - 60;
  
  // Header Section
  page.drawRectangle({
    x: 0,
    y: yPosition - 80,
    width: width,
    height: 80,
    color: primaryColor,
  });
  
  // Company Logo placeholder and title
  page.drawText('Compare Funding', {
    x: 50,
    y: yPosition - 30,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('Business Funding Application - MATCHED LENDER COPY', {
    x: 50,
    y: yPosition - 55,
    size: 16,
    font: helveticaFont,
    color: rgb(1, 1, 1),
  });
  
  // Document status and date
  page.drawText(`For: ${lenderName}`, {
    x: width - 200,
    y: yPosition - 25,
    size: 12,
    font: helveticaBoldFont,
    color: accentColor,
  });
  
  page.drawText(`Generated: ${generatedDate.toLocaleDateString()}`, {
    x: width - 200,
    y: yPosition - 45,
    size: 10,
    font: helveticaFont,
    color: rgb(1, 1, 1),
  });

  yPosition -= 120; // Move below header

  // Fonts object for helper functions
  const fonts = {
    helvetica: helveticaFont,
    helveticaBold: helveticaBoldFont
  };
  
  const colors = {
    primaryColor,
    accentColor
  };

  // Business Information Section - Full Details for Matched Lenders
  yPosition -= 20;
  
  page.drawText('Business Information', {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  
  yPosition -= 10;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: accentColor,
  });
  yPosition -= 25;

  // Show full business details for matched lenders
  const businessName = business.business_name || business.companyName || 'N/A';
  const registrationNumber = business.registration_number || business.companyNumber || business.company_number || 'N/A';
  const industry = business.industry_sector || 'N/A';
  const yearsTrading = business.years_trading || 'N/A';
  const annualRevenue = business.annual_revenue ? formatCurrency(business.annual_revenue) : 'N/A';
  const numEmployees = (business as any).num_employees || (business as any).numberOfEmployees || 'N/A';
  const legalStructure = (business as any).legal_structure || business.business_type || 'N/A';
  
  page.drawText(`Company Name: ${businessName}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Registration Number: ${registrationNumber}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Industry: ${industry}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Years Trading: ${yearsTrading}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Annual Revenue: ${annualRevenue}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  if (numEmployees !== 'N/A') {
    page.drawText(`Number of Employees: ${numEmployees}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  if (legalStructure !== 'N/A') {
    page.drawText(`Legal Structure: ${legalStructure}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  // Show full address for matched lenders
  if (business.address) {
    const address = typeof business.address === 'string' 
      ? business.address 
      : [
          business.address.line1,
          business.address.city,
          business.address.postal_code
        ].filter(Boolean).join(', ');
    
    page.drawText(`Address: ${address}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  yPosition -= 10;

  // Financial Data (show comprehensive data for matched)
  if (financialData && Object.keys(financialData).length > 0) {
    const result = renderFinancialData(page, yPosition, width, financialData, fonts, colors, pdfDoc);
    page = result.page;
    yPosition = result.yPosition;
  }

  // Application Information Section
  yPosition -= 20;
  
  page.drawText('Application Details', {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  
  yPosition -= 10;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: accentColor,
  });
  yPosition -= 25;

  // Application details
  const applicationNumber = application.application_number || 'N/A';
  const fundingAmount = formatCurrency(application.loan_amount);
  const loanTerm = application.loan_term_months ? `${application.loan_term_months} months` : 'N/A';
  const applicationDate = formatDate(application.accepted_at);
  const status = application.status || 'N/A';
  const loanPurpose = application.loan_purpose || application.purpose || 'N/A';
  const securityOffered = application.security_offered || 'N/A';
  const personalGuarantee = application.personal_guarantee !== undefined ? 
    (application.personal_guarantee ? 'Yes' : 'No') : 'N/A';

  page.drawText(`Application Number: ${applicationNumber}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Funding Amount Requested: ${fundingAmount}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Loan Term: ${loanTerm}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Purpose: ${loanPurpose}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Security Offered: ${securityOffered}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Personal Guarantee: ${personalGuarantee}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Application Date: ${applicationDate}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 20;

  page.drawText(`Status: ${status}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  // Footer note for matched
  yPosition -= 30;
  page.drawText('This document contains full business details for matched lender review.', {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  yPosition -= 15;
  
  page.drawText('All information is provided for evaluation purposes and remains confidential.', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Return the PDF as bytes
  return await pdfDoc.save();
}
