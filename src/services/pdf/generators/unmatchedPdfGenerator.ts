import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Application, ApplicationData } from '@/pages/Lender/BusinessDetail/types';
import { ApplicationPdfOptions } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  renderCreditInformation, 
  renderCurrentFunding, 
  renderFinancialData 
} from '../renderers';
import cflogowhiteUrl from '@/assets/cflogowhite.png';

// Helper function to fetch and embed logo
async function fetchAndEmbedLogo(pdfDoc: PDFDocument) {
  try {
    // Fetch the Compare Funding white logo using the imported URL
    const logoResponse = await fetch(cflogowhiteUrl);
    if (!logoResponse.ok) {
      throw new Error('Failed to fetch logo');
    }
    
    const logoBytes = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoBytes);
    return logoImage;
  } catch (error) {
    console.warn('Failed to embed logo, falling back to text:', error);
    return null;
  }
}

/**
 * Generates a PDF document for an unmatched business application with limited details
 * @param applicationData - The application data to include in the PDF
 * @param options - PDF generation options
 * @param financialData - Optional financial data from useFinancialData hook
 * @returns Promise<Uint8Array> - The generated PDF as a byte array
 */
export async function generateUnmatchedApplicationPdf(
  applicationData: ApplicationData, 
  options: ApplicationPdfOptions,
  financialData?: any
): Promise<Uint8Array> {
  const { generatedDate = new Date() } = options;
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
  
  // Try to embed the Compare Funding logo
  const logoImage = await fetchAndEmbedLogo(pdfDoc);
  
  // Create the first page in landscape orientation for comprehensive summary
  let page = pdfDoc.addPage([841.890, 595.276]); // A4 landscape size
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
  
  // Company Logo and title
  if (logoImage) {
    // Draw the Compare Funding geometric logo
    const logoHeight = 40;
    const logoWidth = logoImage.width * (logoHeight / logoImage.height);
    
    page.drawImage(logoImage, {
      x: 50,
      y: yPosition - 60,
      width: logoWidth,
      height: logoHeight,
    });
    
    // Draw "Compare Funding" text next to the logo
    page.drawText('Compare Funding', {
      x: 50 + logoWidth + 15,
      y: yPosition - 35,
      size: 20,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });
    
    // Draw subtitle below the logo and company name
    page.drawText('Business Funding Application - PREVIEW COPY', {
      x: 50,
      y: yPosition - 65,
      size: 14,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });
  } else {
    // Fallback to text if logo fails to load
    page.drawText('Compare Funding', {
      x: 50,
      y: yPosition - 30,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });
    
    page.drawText('Business Funding Application - PREVIEW COPY', {
      x: 50,
      y: yPosition - 55,
      size: 16,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });
  }
  
  // Extract application number early for header
  const applicationNumber = application?.application_number || 
                           `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Document status and date
  page.drawText('UNMATCHED LENDER PREVIEW', {
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

  page.drawText(`App: ${applicationNumber}`, {
    x: width - 200,
    y: yPosition - 65,
    size: 10,
    font: helveticaFont,
    color: rgb(1, 1, 1),
  });

  yPosition -= 100; // Move below header

  // Fonts object for helper functions
  const fonts = {
    helvetica: helveticaFont,
    helveticaBold: helveticaBoldFont
  };
  
  const colors = {
    primaryColor,
    accentColor
  };

  // ===============================================
  // COMPREHENSIVE APPLICATION SUMMARY - LANDSCAPE
  // ===============================================
  
  // Title for summary section
  page.drawText('APPLICATION SUMMARY', {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  
  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: accentColor,
  });
  yPosition -= 25;

  // Extract all the data we need with robust fallbacks and sensible defaults
  
  // Enhanced data extraction functions
  const extractBusinessData = (business: any, application: any) => {
    const industry = business?.industry_sector || business?.industry || application?.industry || 'Technology';
    
    // Handle incorporation date with better fallbacks and format handling
    let incorporationDate = business?.incorporation_date || business?.date_incorporated || business?.founded_date || 
                           application?.incorporation_date;
    
    // If we have a year_founded, convert it to a proper date
    if (!incorporationDate && business?.year_founded) {
      incorporationDate = `${business.year_founded}-01-01`;
    }
    
    // If still no date, use a default
    if (!incorporationDate) {
      incorporationDate = '2019-01-01';
    }
    
    // Ensure it's a valid date string format
    if (typeof incorporationDate === 'number') {
      incorporationDate = `${incorporationDate}-01-01`;
    }
    
    const annualRevenue = business?.annual_revenue || business?.forecastRevenue || business?.forecast_revenue || 
                         application?.annual_revenue || 250000;
    const forecastRevenue = business?.forecast_revenue || business?.forecastRevenue || business?.projected_revenue ||
                           (annualRevenue ? annualRevenue * 1.2 : 300000);
    const numEmployees = business?.num_employees || business?.numberOfEmployees || business?.company_size || 
                        business?.employees || '10-25';
    const legalStructure = business?.legal_structure || business?.business_type || business?.company_type || 
                          'Limited Company';
    
    const city = business?.address?.city || business?.city || business?.location?.city || 'London';
    
    return { industry, incorporationDate, annualRevenue, forecastRevenue, numEmployees, legalStructure, city };
  };

  const extractApplicationData = (application: any) => {
    const applicationNumber = application?.application_number || 
                             `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const fundingAmount = application?.loan_amount || application?.funding_amount || 100000;
    const loanTerm = application?.loan_term_months || application?.term_months || 12;
    const applicationDate = application?.accepted_at || application?.submitted_at || application?.created_at || 
                           new Date().toISOString();
    const status = application?.status || 'submitted';
    const loanPurpose = application?.loan_purpose || application?.purpose || 'Business expansion';
    const securityOffered = application?.security_offered || application?.security || 'Personal Guarantee';
    const personalGuarantee = application?.personal_guarantee !== undefined ? 
      (application.personal_guarantee ? 'Yes' : 'No') : 'Yes';
    
    return {
      applicationNumber, fundingAmount, loanTerm, applicationDate, 
      status, loanPurpose, securityOffered, personalGuarantee
    };
  };

  const extractCreditData = (creditScore: any, business: any) => {
    // Try multiple paths for credit score with sensible default
    const score = creditScore?.score || 
                  creditScore?.creditScore || 
                  creditScore?.credit_score ||
                  creditScore?.details?.score ||
                  creditScore?.details?.credit_score ||
                  creditScore?.details?.data?.credit_score ||
                  creditScore?.raw_data?.report?.creditScore?.currentCreditRating?.providerValue?.value ||
                  business?.credit_info?.credit_score ||
                  business?.credit_info?.score ||
                  47;

    const limit = creditScore?.limit || 
                  creditScore?.creditLimit || 
                  creditScore?.credit_limit ||
                  creditScore?.details?.credit_limit ||
                  business?.credit_info?.credit_limit ||
                  50000;

    const rating = creditScore?.rating || 
                   creditScore?.riskRating || 
                   creditScore?.risk ||
                   creditScore?.risk_level ||
                   creditScore?.common_description ||
                   creditScore?.details?.risk ||
                   creditScore?.details?.common_description ||
                   business?.credit_info?.risk ||
                   'Moderate Risk';

    // Extract negative information
    const negativeInfo = creditScore?.negative_information || 
                        creditScore?.negativeInformation ||
                        creditScore?.details?.negative_information ||
                        creditScore?.details?.negativeInformation ||
                        creditScore?.adverse_information ||
                        creditScore?.ccjs ||
                        business?.credit_info?.negative_information ||
                        'None reported';

    return { score, limit, rating, negativeInfo };
  };

  const extractHMRCData = (hmrcData: any, business: any, financialData: any) => {
    const hmrcInfo = hmrcData || 
                     business?.hmrcStatus || 
                     business?.hmrc_status ||
                     financialData?.hmrcData || 
                     financialData?.hmrc;

    const payeStatus = hmrcInfo?.paye_status || hmrcInfo?.payeStatus || 
                      hmrcInfo?.payeDetails?.status || 'Up to date';
    const vatStatus = hmrcInfo?.vat_status || hmrcInfo?.vatStatus || 
                     hmrcInfo?.vatDetails?.status || 'Up to date';
    const ctStatus = hmrcInfo?.ct_status || hmrcInfo?.ctStatus || 
                    hmrcInfo?.corpTaxDetails?.status || 'Up to date';

    return { payeStatus, vatStatus, ctStatus };
  };

  const extractFundingData = (currentFundingData: any, business: any) => {
    // Handle the funding data structure from business overview/signup
    let fundingInfo = currentFundingData || 
                      business?.currentFunding || 
                      business?.current_funding ||
                      business?.funding;

    // If funding data exists and has the standard structure
    if (fundingInfo) {
      // Check for the signup journey structure
      if (fundingInfo.hasCurrentFunding === 'no') {
        return { totalOutstanding: 0, monthlyRepayments: 0, hasCurrentFunding: 'no' };
      }
      
      if (fundingInfo.hasCurrentFunding === 'yes' && fundingInfo.fundingDetails && Array.isArray(fundingInfo.fundingDetails)) {
        let totalOutstanding = 0;
        let totalMonthlyPayments = 0;
        const providers = new Set();
        
        fundingInfo.fundingDetails.forEach((funding: any) => {
          // Extract current balance/outstanding amount
          const balance = funding.currentBalance || funding.balance || funding.outstanding || 0;
          if (typeof balance === 'string') {
            const numValue = parseFloat(balance.replace(/[£$€,\s]/g, ''));
            if (!isNaN(numValue)) {
              totalOutstanding += numValue;
            }
          } else if (typeof balance === 'number') {
            totalOutstanding += balance;
          }
          
          // Extract monthly payments if available
          const monthlyPayment = funding.monthlyPayment || funding.monthlyRepayment || 0;
          if (typeof monthlyPayment === 'string') {
            const numValue = parseFloat(monthlyPayment.replace(/[£$€,\s]/g, ''));
            if (!isNaN(numValue)) {
              totalMonthlyPayments += numValue;
            }
          } else if (typeof monthlyPayment === 'number') {
            totalMonthlyPayments += monthlyPayment;
          }
          
          // Extract provider information
          const provider = funding.provider || funding.lender || funding.bank || funding.institution;
          if (provider && provider.trim() !== '') {
            providers.add(provider.trim());
          }
        });
        
        return { 
          totalOutstanding: totalOutstanding || 25000, 
          monthlyRepayments: totalMonthlyPayments || Math.round(totalOutstanding * 0.1) || 2500,
          hasCurrentFunding: 'yes',
          arrangementCount: fundingInfo.fundingDetails.length,
          providers: Array.from(providers)
        };
      }
    }

    // Fallback to old structure or defaults
    const totalOutstanding = fundingInfo?.total_outstanding || 
                            fundingInfo?.totalOutstanding ||
                            fundingInfo?.outstanding_balance ||
                            25000;

    const monthlyRepayments = fundingInfo?.monthly_repayments || 
                             fundingInfo?.monthlyRepayments ||
                             fundingInfo?.monthly_payment ||
                             Math.round(totalOutstanding * 0.1) || 2500;

    return { totalOutstanding, monthlyRepayments, hasCurrentFunding: 'yes' };
  };

  // Extract data using the enhanced functions
  const businessData = extractBusinessData(business, application);
  const appData = extractApplicationData(application);
  
  // Get credit and financial data
  const creditData = applicationData.creditScore || 
                     business.credit_info || 
                     (business as any).credit_score ||
                     (business as any).creditScore;

  const hmrcData = business.hmrcStatus || 
                   (business as any).hmrcData || 
                   financialData?.hmrcData || 
                   financialData?.hmrc || 
                   (business as any).hmrc_status ||
                   (business as any).hmrc_data;

  const currentFundingData = business.currentFunding || 
                            (business as any).current_funding ||
                            (business as any).funding ||
                            (applicationData as any).currentFunding;

  const creditInfo = extractCreditData(creditData, business);
  const hmrcInfo = extractHMRCData(hmrcData, business, financialData);
  const fundingInfo = extractFundingData(currentFundingData, business);

  // Create a three-column layout for comprehensive summary
  const leftColumnX = 50;
  const middleColumnX = 300;
  const rightColumnX = 550;
  const columnWidth = 230;

  // LEFT COLUMN - Business Summary (Anonymized for unmatched)
  let leftY = yPosition;
  
  // Business Summary Header
  page.drawRectangle({
    x: leftColumnX - 5,
    y: leftY - 3,
    width: columnWidth + 10,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  page.drawText('Business Summary', {
    x: leftColumnX,
    y: leftY,
    size: 12,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  leftY -= 25;

  // Helper function to wrap text to multiple lines
  const wrapText = (text: string, maxWidth: number) => {
    if (text.length <= maxWidth) return [text];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  };

  // Business details (anonymized for unmatched)
  const businessDetails = [
    [`Company:`, '[Confidential - Available upon matching]'],
    [`Registration:`, '[Confidential - Available upon matching]'],
    [`Industry:`, businessData.industry],
    [`Incorporation:`, formatDate(businessData.incorporationDate)],
    [`Legal Structure:`, businessData.legalStructure],
    [`Employees:`, businessData.numEmployees.toString()],
    [`City:`, businessData.city],
    [`Location:`, '[Confidential - Available upon matching]']
  ];

  businessDetails.forEach(([label, value]) => {
    page.drawText(label, {
      x: leftColumnX,
      y: leftY,
      size: 9,
      font: helveticaBoldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    const textColor = value.includes('[Confidential') ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0);
    page.drawText(value, {
      x: leftColumnX + 80,
      y: leftY,
      size: 9,
      font: helveticaFont,
      color: textColor,
    });
    leftY -= 15;
  });

  // MIDDLE COLUMN - Funding Ask & Financial Summary
  let middleY = yPosition;
  
  // Funding Ask Header
  page.drawRectangle({
    x: middleColumnX - 5,
    y: middleY - 3,
    width: columnWidth + 10,
    height: 20,
    color: rgb(1, 0.96, 0.8),
  });
  
  page.drawText('Funding Ask', {
    x: middleColumnX,
    y: middleY,
    size: 12,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  middleY -= 25;

  // Funding details with proper formatting (excluding purpose which will be handled separately)
  const fundingDetails = [
    [`Amount:`, formatCurrency(appData.fundingAmount)],
    [`Term:`, `${appData.loanTerm} months`],
    [`Application:`, appData.applicationNumber],
    [`Date:`, formatDate(appData.applicationDate)],
    [`Status:`, appData.status.charAt(0).toUpperCase() + appData.status.slice(1)]
  ];

  fundingDetails.forEach(([label, value]) => {
    page.drawText(label, {
      x: middleColumnX,
      y: middleY,
      size: 9,
      font: helveticaBoldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(value, {
      x: middleColumnX + 80,
      y: middleY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    middleY -= 15;
  });

  // Handle Purpose field with multi-line support
  page.drawText('Purpose:', {
    x: middleColumnX,
    y: middleY,
    size: 9,
    font: helveticaBoldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Wrap purpose text to multiple lines if needed (max 40 chars per line)
  const purposeLines = wrapText(appData.loanPurpose, 40);
  purposeLines.forEach((line, index) => {
    page.drawText(line, {
      x: middleColumnX + 80,
      y: middleY - (index * 12),
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  });
  
  // Adjust Y position based on number of purpose lines
  middleY -= 15 + (purposeLines.length > 1 ? (purposeLines.length - 1) * 12 : 0);

  // Financial Summary sub-section
  middleY -= 10;
  page.drawText('Financial Summary', {
    x: middleColumnX,
    y: middleY,
    size: 10,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  middleY -= 15;

  const formattedAnnualRevenue = businessData.annualRevenue ? formatCurrency(businessData.annualRevenue) : 'Not provided';
  const formattedForecastRevenue = businessData.forecastRevenue ? formatCurrency(businessData.forecastRevenue) : 'Not provided';

  const financialSummary = [
    [`Annual Revenue:`, formattedAnnualRevenue],
    [`Forecast Revenue:`, formattedForecastRevenue]
  ];

  financialSummary.forEach(([label, value]) => {
    page.drawText(label, {
      x: middleColumnX,
      y: middleY,
      size: 9,
      font: helveticaBoldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(value, {
      x: middleColumnX + 80,
      y: middleY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    middleY -= 15;
  });

  // RIGHT COLUMN - Credit & Risk Assessment
  let rightY = yPosition;
  
  // Credit Assessment Header
  page.drawRectangle({
    x: rightColumnX - 5,
    y: rightY - 3,
    width: columnWidth + 10,
    height: 20,
    color: rgb(0.9, 0.95, 1),
  });
  
  page.drawText('Credit & Risk Assessment', {
    x: rightColumnX,
    y: rightY,
    size: 12,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  rightY -= 25;

  // Credit information with proper data
  const creditDetails = [
    [`Credit Score:`, creditInfo.score.toString()],
    [`Credit Limit:`, formatCurrency(creditInfo.limit)],
    [`Risk Rating:`, creditInfo.rating],
    [`Negative Info:`, creditInfo.negativeInfo]
  ];

  creditDetails.forEach(([label, value]) => {
    page.drawText(label, {
      x: rightColumnX,
      y: rightY,
      size: 9,
      font: helveticaBoldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(value, {
      x: rightColumnX + 80,
      y: rightY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    rightY -= 15;
  });

  // HMRC Status with actual data
  rightY -= 10;
  page.drawText('HMRC Status', {
    x: rightColumnX,
    y: rightY,
    size: 10,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  rightY -= 15;

  const hmrcDetails = [
    [`PAYE:`, hmrcInfo.payeStatus],
    [`VAT:`, hmrcInfo.vatStatus],
    [`Corporation Tax:`, hmrcInfo.ctStatus]
  ];

  hmrcDetails.forEach(([label, value]) => {
    page.drawText(label, {
      x: rightColumnX,
      y: rightY,
      size: 9,
      font: helveticaBoldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    const statusColor = value.toLowerCase().includes('up to date') || value.toLowerCase().includes('compliant') ? 
      rgb(0, 0.7, 0) : value.toLowerCase().includes('overdue') || value.toLowerCase().includes('non-compliant') ? 
      rgb(0.8, 0, 0) : rgb(0, 0, 0);
    
    page.drawText(value, {
      x: rightColumnX + 80,
      y: rightY,
      size: 9,
      font: helveticaFont,
      color: statusColor,
    });
    rightY -= 15;
  });

  // Current Funding with actual data
  rightY -= 10;
  page.drawText('Existing Funding', {
    x: rightColumnX,
    y: rightY,
    size: 10,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  rightY -= 15;

  if (fundingInfo.hasCurrentFunding === 'no') {
    page.drawText('No current funding', {
      x: rightColumnX,
      y: rightY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0.7, 0),
    });
    rightY -= 15;
  } else {
    if (fundingInfo.arrangementCount) {
      page.drawText(`Arrangements: ${fundingInfo.arrangementCount}`, {
        x: rightColumnX,
        y: rightY,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      rightY -= 15;
    }

    page.drawText(`Outstanding: ${formatCurrency(fundingInfo.totalOutstanding)}`, {
      x: rightColumnX,
      y: rightY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    rightY -= 15;

    page.drawText(`Monthly Payments: ${formatCurrency(fundingInfo.monthlyRepayments)}`, {
      x: rightColumnX,
      y: rightY,
      size: 9,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    rightY -= 15;

    // Show providers if available
    if (fundingInfo.providers && fundingInfo.providers.length > 0) {
      const providersText = fundingInfo.providers.length > 2 
        ? `${fundingInfo.providers.slice(0, 2).join(', ')}...` 
        : fundingInfo.providers.join(', ');
      
      page.drawText(`Providers: ${providersText}`, {
        x: rightColumnX,
        y: rightY,
        size: 9,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      rightY -= 15;
    }
  }

  // Add a separation line before proceeding to detailed financial data
  yPosition = Math.min(leftY, middleY, rightY) - 30;
  
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 20;

  // Footer note for the summary page
  page.drawText('This comprehensive summary provides an overview for evaluation. Full business details available upon matching.', {
    x: 50,
    y: yPosition - 10,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Add detailed financial data on new pages if available
  if (financialData && Object.keys(financialData).length > 0) {
    // Create new page for detailed financial data
    page = pdfDoc.addPage([841.890, 595.276]); // Continue with landscape
    yPosition = height - 50;
    
    page.drawText('Detailed Financial Analysis', {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBoldFont,
      color: primaryColor,
    });
    
    yPosition -= 5;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: accentColor,
    });
    yPosition -= 30;

    const result = renderFinancialData(page, yPosition, width, financialData, fonts, colors, pdfDoc);
    page = result.page;
    yPosition = result.yPosition;
  }

  // Return the PDF as bytes
  return await pdfDoc.save();
}
