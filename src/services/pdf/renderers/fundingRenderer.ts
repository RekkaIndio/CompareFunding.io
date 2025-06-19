import { PDFPage, PDFDocument, rgb } from 'pdf-lib';
import { RenderResult } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Helper function to render comprehensive current funding information
 */
export function renderCurrentFunding(
  page: PDFPage,
  yPosition: number,
  width: number,
  fundingData: any,
  fonts: {[key: string]: any},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): RenderResult {
  let currentY = yPosition - 30;
  let currentPage = page;
  const leftMargin = 50;
  const rightMargin = 50;
  const contentWidth = width - leftMargin - rightMargin;
  
  // Check if we need a new page for the header - ensure we have enough space for header + some content
  if (currentY < 250) {
    currentPage = pdfDoc.addPage([595.276, 841.890]);
    currentY = 750;
  }
  
  // Enhanced section header with background and improved typography
  currentPage.drawRectangle({
    x: leftMargin - 15,
    y: currentY - 5,
    width: contentWidth + 30,
    height: 35,
    color: rgb(0.97, 0.98, 1.0),
  });
  
  currentPage.drawText('Current Funding', {
    x: leftMargin,
    y: currentY + 5,
    size: 18,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
  
  currentY -= 15;
  // Elegant underline with rounded effect
  currentPage.drawRectangle({
    x: leftMargin,
    y: currentY - 2,
    width: 140,
    height: 2,
    color: colors.accentColor,
  });
  currentY -= 35;

  // Check if we need a new page
  if (currentY < 180) {
    currentPage = pdfDoc.addPage([595.276, 841.890]);
    currentY = 750;
  }

  // Handle the data structure used in the business overview component
  if (fundingData && typeof fundingData === 'object') {
    // Check for hasCurrentFunding and fundingDetails structure (from signup/business page)
    if (fundingData.hasCurrentFunding !== undefined) {
      const hasCurrentFunding = fundingData.hasCurrentFunding;
      
      // Status indicator with enhanced styling and badge
      const statusText = hasCurrentFunding === 'yes' ? 'Yes' : 'No';
      const statusColor = hasCurrentFunding === 'yes' ? rgb(0.2, 0.7, 0.2) : rgb(0.7, 0.2, 0.2);
      const badgeColor = hasCurrentFunding === 'yes' ? rgb(0.9, 0.98, 0.9) : rgb(0.98, 0.9, 0.9);
      
      currentPage.drawText('Has Current Funding:', {
        x: leftMargin,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Status badge with background
      currentPage.drawRectangle({
        x: leftMargin + 145,
        y: currentY - 4,
        width: 35,
        height: 16,
        color: badgeColor,
      });
      
      currentPage.drawText(statusText, {
        x: leftMargin + 152,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: statusColor,
      });
      currentY -= 30;

      if (hasCurrentFunding === 'yes' && fundingData.fundingDetails && Array.isArray(fundingData.fundingDetails)) {
        const details = fundingData.fundingDetails;
        
        // Calculate total funding from all arrangements
        const totalFunding = details.reduce((total, funding) => {
          const balance = funding.currentBalance || funding.balance || 0;
          if (typeof balance === 'string') {
            // Extract number from string like "12500" or "£25,000"
            const numValue = parseFloat(balance.replace(/[£$€,\s]/g, ''));
            return total + (isNaN(numValue) ? 0 : numValue);
          }
          return total + (typeof balance === 'number' ? balance : 0);
        }, 0);

        // Display total funding amount prominently with enhanced styling
        if (totalFunding > 0) {
          // Background highlight for total funding
          currentPage.drawRectangle({
            x: leftMargin - 10,
            y: currentY - 5,
            width: contentWidth + 20,
            height: 25,
            color: rgb(0.95, 0.98, 1.0),
          });
          
          currentPage.drawText('Total Current Funding:', {
            x: leftMargin,
            y: currentY,
            size: 13,
            font: fonts.helveticaBold,
            color: rgb(0.1, 0.1, 0.1),
          });
          
          currentPage.drawText(formatCurrency(totalFunding), {
            x: leftMargin + 160,
            y: currentY,
            size: 14,
            font: fonts.helveticaBold,
            color: colors.accentColor,
          });
          currentY -= 35;
        }

        // Display number of arrangements with improved styling
        currentPage.drawText('Active Arrangements:', {
          x: leftMargin,
          y: currentY,
          size: 11,
          font: fonts.helveticaBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        currentPage.drawText(`${details.length}`, {
          x: leftMargin + 130,
          y: currentY,
          size: 11,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 30;

        // Section header for detailed arrangements with enhanced styling
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: currentY - 5,
          width: contentWidth + 10,
          height: 25,
          color: rgb(0.95, 0.97, 1.0),
        });
        
        currentPage.drawText('DETAILED FUNDING ARRANGEMENTS', {
          x: leftMargin,
          y: currentY,
          size: 12,
          font: fonts.helveticaBold,
          color: colors.primaryColor,
        });
        currentY -= 35;

        details.forEach((arrangement: any, index: number) => {
          if (currentY < 150) {
            currentPage = pdfDoc.addPage([595.276, 841.890]);
            currentY = 750;
          }

          // Enhanced arrangement card styling with professional borders
          const cardY = currentY - 10;
          const cardHeight = 120;
          
          // Card shadow effect
          currentPage.drawRectangle({
            x: leftMargin - 3,
            y: cardY - cardHeight - 2,
            width: contentWidth + 8,
            height: cardHeight,
            color: rgb(0.9, 0.9, 0.9),
          });
          
          // Main card background
          currentPage.drawRectangle({
            x: leftMargin - 5,
            y: cardY - cardHeight,
            width: contentWidth + 10,
            height: cardHeight,
            color: rgb(0.99, 0.99, 0.99),
          });
          
          // Card border (subtle)
          currentPage.drawRectangle({
            x: leftMargin - 5,
            y: cardY - cardHeight,
            width: contentWidth + 10,
            height: 1,
            color: rgb(0.8, 0.8, 0.8),
          });
          currentPage.drawRectangle({
            x: leftMargin - 5,
            y: cardY,
            width: contentWidth + 10,
            height: 1,
            color: rgb(0.8, 0.8, 0.8),
          });

          // Left accent border for visual appeal
          currentPage.drawRectangle({
            x: leftMargin - 5,
            y: cardY - cardHeight,
            width: 4,
            height: cardHeight,
            color: colors.accentColor,
          });
          
          // Arrangement header with enhanced styling
          currentPage.drawText(`ARRANGEMENT ${index + 1}`, {
            x: leftMargin + 10,
            y: currentY,
            size: 12,
            font: fonts.helveticaBold,
            color: colors.primaryColor,
          });
          currentY -= 25;

          // Display the specific funding fields as shown in the business details page
          const fundingDisplayFields = [
            { key: 'provider', label: 'Provider', priority: 1 },
            { key: 'product', label: 'Product', priority: 1 },
            { key: 'terms', label: 'Terms', priority: 2 },
            { key: 'currentBalance', label: 'Balance', isCurrency: true, priority: 1 },
            { key: 'balance', label: 'Balance', isCurrency: true, priority: 1 },
            { key: 'expiryDate', label: 'Expiry', isDate: true, priority: 2 },
            { key: 'expiry', label: 'Expiry', isDate: true, priority: 2 }
          ];

          // Sort by priority and display available fields
          fundingDisplayFields.sort((a, b) => a.priority - b.priority).forEach(field => {
            const value = arrangement[field.key];
            if (value !== undefined && value !== null && value !== '') {
              if (currentY < 100) {
                currentPage = pdfDoc.addPage([595.276, 841.890]);
                currentY = 750;
              }

              let displayValue = value;
              if (field.isCurrency) {
                if (typeof value === 'number') {
                  displayValue = formatCurrency(value);
                } else if (typeof value === 'string') {
                  // Handle values like "12500" or "£25,000"
                  const numValue = parseFloat(value.replace(/[£$€,\s]/g, ''));
                  if (!isNaN(numValue)) {
                    displayValue = formatCurrency(numValue);
                  } else {
                    displayValue = value; // Keep as string if not a valid number
                  }
                }
              } else if (field.isDate) {
                // Handle date values like "19/03/2025" or "2025-03-19"
                if (typeof value === 'string') {
                  try {
                    let dateObj;
                    if (value.includes('/')) {
                      // Handle DD/MM/YYYY format
                      const [day, month, year] = value.split('/');
                      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    } else {
                      dateObj = new Date(value);
                    }
                    if (!isNaN(dateObj.getTime())) {
                      displayValue = dateObj.toLocaleDateString('en-GB');
                    }
                  } catch {
                    displayValue = value; // Keep original if parsing fails
                  }
                } else {
                  displayValue = formatDate(value);
                }
              }

              // Enhanced field display with table-like formatting
              const labelWidth = 80;
              const valueX = leftMargin + labelWidth + 15;
              
              // Alternate row background for better readability
              if ((fundingDisplayFields.filter(f => arrangement[f.key] !== undefined && arrangement[f.key] !== null && arrangement[f.key] !== '').indexOf(field) % 2) === 0) {
                currentPage.drawRectangle({
                  x: leftMargin + 5,
                  y: currentY - 3,
                  width: contentWidth - 10,
                  height: 14,
                  color: rgb(0.97, 0.97, 0.99),
                });
              }
              
              currentPage.drawText(field.label + ':', {
                x: leftMargin + 15,
                y: currentY,
                size: 10,
                font: fonts.helveticaBold,
                color: rgb(0.4, 0.4, 0.4),
              });
              
              // Enhanced value styling with appropriate colors
              let valueColor = rgb(0, 0, 0);
              if (field.isCurrency) {
                valueColor = colors.accentColor;
              } else if (field.isDate) {
                valueColor = rgb(0.2, 0.5, 0.8);
              }
              
              currentPage.drawText(displayValue.toString(), {
                x: valueX,
                y: currentY,
                size: 10,
                font: fonts.helvetica,
                color: valueColor,
              });
              currentY -= 16;
            }
          });

          currentY -= 30; // Better spacing between arrangements
        });

        // Show summary if no detailed arrangements but has total
        if (details.length === 0 && totalFunding > 0) {
          // Enhanced info box styling
          currentPage.drawRectangle({
            x: leftMargin - 5,
            y: currentY - 25,
            width: contentWidth + 10,
            height: 30,
            color: rgb(0.95, 0.95, 0.98),
          });
          
          currentPage.drawText('📋 Funding details are available but specific arrangement breakdown is not provided.', {
            x: leftMargin + 5,
            y: currentY - 10,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
          currentY -= 35;
        }
      } else if (hasCurrentFunding === 'yes') {
        // Enhanced info styling for unavailable details
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: currentY - 25,
          width: contentWidth + 10,
          height: 30,
          color: rgb(0.98, 0.95, 0.95),
        });
        
        currentPage.drawText('ℹ️ Business has current funding arrangements, but details are not available in this view.', {
          x: leftMargin + 5,
          y: currentY - 10,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 35;
      }
    }

    // Handle direct array of funding arrangements
    if (Array.isArray(fundingData) && fundingData.length > 0) {
      // Calculate total funding across all arrangements
      const totalFunding = fundingData.reduce((total, funding) => {
        const amount = funding.amount || funding.facilityAmount || funding.outstanding || 0;
        return total + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
      }, 0);

      // Enhanced total funding display
      if (totalFunding > 0) {
        currentPage.drawRectangle({
          x: leftMargin - 10,
          y: currentY - 5,
          width: contentWidth + 20,
          height: 25,
          color: rgb(0.95, 0.98, 1.0),
        });
        
        currentPage.drawText('Total Current Funding:', {
          x: leftMargin,
          y: currentY,
          size: 13,
          font: fonts.helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        
        currentPage.drawText(formatCurrency(totalFunding), {
          x: leftMargin + 160,
          y: currentY,
          size: 14,
          font: fonts.helveticaBold,
          color: colors.accentColor,
        });
        currentY -= 35;
      }

      // Enhanced arrangements count display
      currentPage.drawText('Active Arrangements:', {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      currentPage.drawText(`${fundingData.length}`, {
        x: leftMargin + 130,
        y: currentY,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      currentY -= 30;

      currentPage.drawRectangle({
        x: leftMargin - 5,
        y: currentY - 5,
        width: contentWidth + 10,
        height: 25,
        color: rgb(0.95, 0.97, 1.0),
      });
      
      currentPage.drawText('DETAILED FUNDING ARRANGEMENTS', {
        x: leftMargin,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 35;

      fundingData.forEach((funding: any, index: number) => {
        if (currentY < 150) {
          currentPage = pdfDoc.addPage([595.276, 841.890]);
          currentY = 750;
        }

        // Enhanced arrangement card styling with professional borders
        const cardY = currentY - 10;
        const estimatedCardHeight = 140;
        
        // Card shadow effect
        currentPage.drawRectangle({
          x: leftMargin - 3,
          y: cardY - estimatedCardHeight - 2,
          width: contentWidth + 8,
          height: estimatedCardHeight,
          color: rgb(0.9, 0.9, 0.9),
        });
        
        // Main card background
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: cardY - estimatedCardHeight,
          width: contentWidth + 10,
          height: estimatedCardHeight,
          color: rgb(0.99, 0.99, 0.99),
        });
        
        // Card border (subtle)
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: cardY - estimatedCardHeight,
          width: contentWidth + 10,
          height: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: cardY,
          width: contentWidth + 10,
          height: 1,
          color: rgb(0.8, 0.8, 0.8),
        });

        // Left accent border for visual appeal
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: cardY - estimatedCardHeight,
          width: 4,
          height: estimatedCardHeight,
          color: colors.accentColor,
        });

        // Arrangement header with enhanced styling
        const arrangementTitle = funding.type || funding.productType || funding.name || `Funding Arrangement ${index + 1}`;
        currentPage.drawText(`ARRANGEMENT ${index + 1}`, {
          x: leftMargin + 10,
          y: currentY,
          size: 12,
          font: fonts.helveticaBold,
          color: colors.primaryColor,
        });
        
        if (arrangementTitle !== `Funding Arrangement ${index + 1}`) {
          currentPage.drawText(`${arrangementTitle}`, {
            x: leftMargin + 180,
            y: currentY,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
        currentY -= 25;

        // Comprehensive display of all funding fields with priority ordering
        const allFundingFields = [
          { key: 'lender', label: 'Lender/Provider', priority: 1 },
          { key: 'provider', label: 'Provider', priority: 1 },
          { key: 'bank', label: 'Bank', priority: 1 },
          { key: 'institution', label: 'Institution', priority: 1 },
          { key: 'amount', label: 'Facility Amount', isCurrency: true, priority: 1 },
          { key: 'facilityAmount', label: 'Facility Amount', isCurrency: true, priority: 1 },
          { key: 'creditLimit', label: 'Credit Limit', isCurrency: true, priority: 1 },
          { key: 'outstanding', label: 'Outstanding Balance', isCurrency: true, priority: 1 },
          { key: 'outstandingBalance', label: 'Outstanding Balance', isCurrency: true, priority: 1 },
          { key: 'currentBalance', label: 'Current Balance', isCurrency: true, priority: 1 },
          { key: 'available', label: 'Available to Draw', isCurrency: true, priority: 2 },
          { key: 'availableBalance', label: 'Available Balance', isCurrency: true, priority: 2 },
          { key: 'utilised', label: 'Amount Utilised', isCurrency: true, priority: 2 },
          { key: 'utilisationRate', label: 'Utilisation Rate', isPercentage: true, priority: 2 },
          { key: 'rate', label: 'Interest Rate', isPercentage: true, priority: 2 },
          { key: 'interestRate', label: 'Interest Rate', isPercentage: true, priority: 2 },
          { key: 'apr', label: 'APR', isPercentage: true, priority: 2 },
          { key: 'margin', label: 'Margin', isPercentage: true, priority: 2 },
          { key: 'baseRate', label: 'Base Rate', isPercentage: true, priority: 2 },
          { key: 'term', label: 'Term', priority: 2 },
          { key: 'termMonths', label: 'Term (Months)', priority: 2 },
          { key: 'maturityDate', label: 'Maturity Date', isDate: true, priority: 2 },
          { key: 'maturity', label: 'Maturity Date', isDate: true, priority: 2 },
          { key: 'expiryDate', label: 'Expiry Date', isDate: true, priority: 2 },
          { key: 'monthlyPayment', label: 'Monthly Payment', isCurrency: true, priority: 2 },
          { key: 'monthlyRepayment', label: 'Monthly Repayment', isCurrency: true, priority: 2 },
          { key: 'repaymentAmount', label: 'Repayment Amount', isCurrency: true, priority: 2 },
          { key: 'security', label: 'Security', priority: 3 },
          { key: 'securityType', label: 'Security Type', priority: 3 },
          { key: 'collateral', label: 'Collateral', priority: 3 },
          { key: 'establishedDate', label: 'Established Date', isDate: true, priority: 3 },
          { key: 'startDate', label: 'Start Date', isDate: true, priority: 3 },
          { key: 'lastReviewDate', label: 'Last Review Date', isDate: true, priority: 3 },
          { key: 'nextReviewDate', label: 'Next Review Date', isDate: true, priority: 3 },
          { key: 'reviewDate', label: 'Review Date', isDate: true, priority: 3 },
          { key: 'covenants', label: 'Covenants', priority: 3 },
          { key: 'guarantees', label: 'Guarantees', priority: 3 },
          { key: 'personalGuarantee', label: 'Personal Guarantee', priority: 3 },
          { key: 'guarantor', label: 'Guarantor', priority: 3 },
          { key: 'purpose', label: 'Purpose', priority: 3 },
          { key: 'status', label: 'Status', priority: 3 },
          { key: 'accountNumber', label: 'Account Number', priority: 4 },
          { key: 'reference', label: 'Reference', priority: 4 },
          { key: 'agreementDate', label: 'Agreement Date', isDate: true, priority: 4 }
        ];

        // Sort by priority and display available fields with enhanced formatting
        allFundingFields.sort((a, b) => a.priority - b.priority).forEach(field => {
          const value = funding[field.key];
          if (value !== undefined && value !== null && value !== '') {
            if (currentY < 100) {
              currentPage = pdfDoc.addPage([595.276, 841.890]);
              currentY = 750;
            }

            let displayValue = value;
            if (field.isCurrency) {
              if (typeof value === 'number') {
                displayValue = formatCurrency(value);
              } else if (typeof value === 'string') {
                const numValue = parseFloat(value.replace(/[£$€,\s]/g, ''));
                if (!isNaN(numValue)) {
                  displayValue = formatCurrency(numValue);
                }
              }
            } else if (field.isPercentage) {
              displayValue = typeof value === 'number' ? `${value}%` : `${value}${value.toString().includes('%') ? '' : '%'}`;
            } else if (field.isDate) {
              displayValue = formatDate(value);
            }

            // Enhanced field display with table-like formatting and professional styling
            const labelWidth = 100;
            const valueX = leftMargin + labelWidth + 15;
            
            // Alternate row background for better readability
            const fieldsDisplayed = allFundingFields.filter(f => 
              funding[f.key] !== undefined && funding[f.key] !== null && funding[f.key] !== ''
            );
            const fieldIndex = fieldsDisplayed.indexOf(field);
            
            if (fieldIndex % 2 === 0) {
              currentPage.drawRectangle({
                x: leftMargin + 5,
                y: currentY - 3,
                width: contentWidth - 10,
                height: 14,
                color: rgb(0.97, 0.97, 0.99),
              });
            }

            // Enhanced field display with better spacing and styling
            currentPage.drawText(field.label + ':', {
              x: leftMargin + 15,
              y: currentY,
              size: 10,
              font: fonts.helveticaBold,
              color: rgb(0.4, 0.4, 0.4),
            });
            
            // Color coding for important values with enhanced styling
            let valueColor = rgb(0, 0, 0);
            if (field.isCurrency && typeof value === 'number' && value > 0) {
              valueColor = colors.accentColor;
            } else if (field.isPercentage) {
              valueColor = rgb(0.2, 0.5, 0.2);
            } else if (field.isDate) {
              valueColor = rgb(0.2, 0.5, 0.8);
            }
            
            currentPage.drawText(displayValue.toString(), {
              x: valueX,
              y: currentY,
              size: 10,
              font: fonts.helvetica,
              color: valueColor,
            });
            currentY -= 16;
          }
        });

        // Display any additional custom fields not covered above with enhanced styling
        Object.keys(funding).forEach(key => {
          if (!allFundingFields.some(f => f.key === key) && 
              !['type', 'productType', 'name'].includes(key) &&
              funding[key] !== undefined && 
              funding[key] !== null && 
              funding[key] !== '') {
            
            if (currentY < 100) {
              currentPage = pdfDoc.addPage([595.276, 841.890]);
              currentY = 750;
            }

            const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const labelWidth = 100;
            const valueX = leftMargin + labelWidth + 15;
            
            currentPage.drawText(displayKey + ':', {
              x: leftMargin + 15,
              y: currentY,
              size: 9,
              font: fonts.helvetica,
              color: rgb(0.5, 0.5, 0.5),
            });
            
            currentPage.drawText(funding[key].toString(), {
              x: valueX,
              y: currentY,
              size: 9,
              font: fonts.helvetica,
              color: rgb(0.4, 0.4, 0.4),
            });
            currentY -= 14;
          }
        });

        currentY -= 30; // Better spacing between arrangements
      });
    } else {
      // Handle object-based funding data - extract and display comprehensive information
      const fundingKeys = Object.keys(fundingData).filter(key => 
        !['hasCurrentFunding', 'fundingDetails'].includes(key)
      );

      if (fundingKeys.length > 0) {
        // Try to extract meaningful funding information
        const fundingInfo = {};
        let totalAmount = 0;
        let lenderCount = 0;
        const lenders = new Set();

        // Analyze the data structure to extract funding details
        fundingKeys.forEach(key => {
          const value = fundingData[key];
          if (value && typeof value !== 'function') {
            // Check for monetary values
            if (typeof value === 'number' && value > 1000) {
              totalAmount += value;
            } else if (typeof value === 'string') {
              // Check for currency strings
              const currencyMatch = value.match(/[£$€]\s*[\d,]+/);
              if (currencyMatch) {
                const numValue = parseFloat(currencyMatch[0].replace(/[£$€,\s]/g, ''));
                if (!isNaN(numValue)) {
                  totalAmount += numValue;
                }
              }
              // Check for lender names
              if (key.toLowerCase().includes('lender') || 
                  key.toLowerCase().includes('bank') || 
                  key.toLowerCase().includes('provider')) {
                lenders.add(value);
              }
            }
            fundingInfo[key] = value;
          }
        });

        // Only show this section if we have meaningful data to display
        if (totalAmount > 0 || lenders.size > 0 || fundingKeys.some(key => {
          const value = fundingData[key];
          return value && typeof value !== 'object' && typeof value !== 'function' && 
                 value.toString().trim() !== '';
        })) {
          // Enhanced section header
          currentPage.drawText('CURRENT FUNDING DETAILS', {
            x: leftMargin,
            y: currentY,
            size: 12,
            font: fonts.helveticaBold,
            color: colors.primaryColor,
          });
          currentY -= 25;

          // Display summary if we found meaningful data with enhanced styling
          if (totalAmount > 0) {
            currentPage.drawRectangle({
              x: leftMargin - 10,
              y: currentY - 5,
              width: contentWidth + 20,
              height: 25,
              color: rgb(0.95, 0.98, 1.0),
            });
            
            currentPage.drawText('Estimated Total Funding:', {
              x: leftMargin,
              y: currentY,
              size: 12,
              font: fonts.helveticaBold,
              color: rgb(0.1, 0.1, 0.1),
            });
            
            currentPage.drawText(formatCurrency(totalAmount), {
              x: leftMargin + 170,
              y: currentY,
              size: 12,
              font: fonts.helveticaBold,
              color: colors.accentColor,
            });
            currentY -= 35;
          }

          if (lenders.size > 0) {
            currentPage.drawText('Funding Providers:', {
              x: leftMargin,
              y: currentY,
              size: 11,
              font: fonts.helveticaBold,
              color: rgb(0.2, 0.2, 0.2),
            });
            
            currentPage.drawText(Array.from(lenders).join(', '), {
              x: leftMargin + 120,
              y: currentY,
              size: 10,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
            currentY -= 25;
          }

          // Sort keys by importance (financial info first)
          const sortedKeys = fundingKeys.sort((a, b) => {
            const aIsMoney = a.toLowerCase().includes('amount') || 
                            a.toLowerCase().includes('balance') || 
                            a.toLowerCase().includes('limit') ||
                            a.toLowerCase().includes('funding');
            const bIsMoney = b.toLowerCase().includes('amount') || 
                            b.toLowerCase().includes('balance') || 
                            b.toLowerCase().includes('limit') ||
                            b.toLowerCase().includes('funding');
            
            const aIsLender = a.toLowerCase().includes('lender') || 
                             a.toLowerCase().includes('bank') || 
                             a.toLowerCase().includes('provider');
            const bIsLender = b.toLowerCase().includes('lender') || 
                             b.toLowerCase().includes('bank') || 
                             b.toLowerCase().includes('provider');

            if (aIsMoney && !bIsMoney) return -1;
            if (!aIsMoney && bIsMoney) return 1;
            if (aIsLender && !bIsLender) return -1;
            if (!aIsLender && bIsLender) return 1;
            return a.localeCompare(b);
          });

          // Only show meaningful fields
          const meaningfulFields = sortedKeys.filter(key => {
            const value = fundingData[key];
            return value && typeof value !== 'object' && typeof value !== 'function' && 
                   value.toString().trim() !== '';
          }).slice(0, 10); // Limit to 10 most important fields

          if (meaningfulFields.length > 0) {
            currentPage.drawText('Additional Funding Information:', {
              x: leftMargin,
              y: currentY,
              size: 11,
              font: fonts.helveticaBold,
              color: rgb(0.2, 0.2, 0.2),
            });
            currentY -= 20;

            meaningfulFields.forEach(key => {
              const value = fundingData[key];
              if (currentY < 100) {
                currentPage = pdfDoc.addPage([595.276, 841.890]);
                currentY = 750;
              }

              const displayKey = key.replace(/([A-Z])/g, ' $1')
                                  .replace(/_/g, ' ')
                                  .replace(/^./, str => str.toUpperCase());
              
              let displayValue = value;
              // Format currency if it looks like a monetary value
              if (typeof value === 'number' && value > 100) {
                displayValue = formatCurrency(value);
              } else if (typeof value === 'string' && /[\d,]+/.test(value)) {
                const numValue = parseFloat(value.replace(/[£$€,\s]/g, ''));
                if (!isNaN(numValue) && numValue > 100) {
                  displayValue = formatCurrency(numValue);
                }
              }

              // Enhanced field display with better spacing
              currentPage.drawText(displayKey + ':', {
                x: leftMargin + 10,
                y: currentY,
                size: 10,
                font: fonts.helveticaBold,
                color: rgb(0.3, 0.3, 0.3),
              });
              
              // Color coding for monetary values
              let valueColor = rgb(0, 0, 0);
              if (typeof displayValue === 'string' && (displayValue.includes('£') || displayValue.includes('$') || displayValue.includes('€'))) {
                valueColor = colors.accentColor;
              }
              
              currentPage.drawText(displayValue.toString(), {
                x: leftMargin + 150,
                y: currentY,
                size: 10,
                font: fonts.helvetica,
                color: valueColor,
              });
              currentY -= 15;
            });
          }
        }
      } else {
        // Enhanced styling for available funding message
        currentPage.drawRectangle({
          x: leftMargin - 5,
          y: currentY - 25,
          width: contentWidth + 10,
          height: 30,
          color: rgb(0.95, 0.98, 0.95),
        });
        
        currentPage.drawText('✓ Current funding information is available for this business', {
          x: leftMargin + 5,
          y: currentY - 8,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0.2, 0.6, 0.2),
        });
        currentY -= 35;
      }
    }
  } else {
    // Enhanced styling for general funding availability message
    currentPage.drawRectangle({
      x: leftMargin - 5,
      y: currentY - 25,
      width: contentWidth + 10,
      height: 30,
      color: rgb(0.95, 0.98, 0.95),
    });
    
    currentPage.drawText('✓ Current funding information is available for this business', {
      x: leftMargin + 5,
      y: currentY - 8,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.2, 0.6, 0.2),
    });
    currentY -= 35;
  }

  // Add final spacing before next section
  currentY -= 20;

  return { page: currentPage, yPosition: currentY };
}
