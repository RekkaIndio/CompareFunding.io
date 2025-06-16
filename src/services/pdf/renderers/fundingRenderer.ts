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
  let currentY = yPosition - 20;
  let currentPage = page;
  
  currentPage.drawText('Current Funding', {
    x: 50,
    y: currentY,
    size: 14,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
  
  currentY -= 10;
  currentPage.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 1,
    color: colors.accentColor,
  });
  currentY -= 20;

  // Check if we need a new page
  if (currentY < 150) {
    currentPage = pdfDoc.addPage([595.276, 841.890]);
    currentY = 750;
  }

  // Handle the data structure used in the business overview component
  if (fundingData && typeof fundingData === 'object') {
    // Check for hasCurrentFunding and fundingDetails structure
    if (fundingData.hasCurrentFunding !== undefined) {
      const hasCurrentFunding = fundingData.hasCurrentFunding;
      currentPage.drawText(`Has Current Funding: ${hasCurrentFunding ? 'Yes' : 'No'}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      if (hasCurrentFunding && fundingData.fundingDetails) {
        const details = fundingData.fundingDetails;
        
        if (details.totalAmount) {
          currentPage.drawText(`Total Current Funding: ${formatCurrency(details.totalAmount)}`, {
            x: 50,
            y: currentY,
            size: 11,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          currentY -= 20;
        }

        if (details.arrangements && Array.isArray(details.arrangements)) {
          currentPage.drawText('Funding Arrangements:', {
            x: 50,
            y: currentY,
            size: 11,
            font: fonts.helveticaBold,
            color: rgb(0, 0, 0),
          });
          currentY -= 15;

          details.arrangements.forEach((arrangement: any, index: number) => {
            if (currentY < 100) {
              currentPage = pdfDoc.addPage([595.276, 841.890]);
              currentY = 750;
            }

            currentPage.drawText(`${index + 1}. ${arrangement.type || 'Unknown Type'}`, {
              x: 70,
              y: currentY,
              size: 10,
              font: fonts.helveticaBold,
              color: rgb(0, 0, 0),
            });
            currentY -= 12;

            if (arrangement.lender) {
              currentPage.drawText(`   Lender: ${arrangement.lender}`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            if (arrangement.amount) {
              currentPage.drawText(`   Amount: ${formatCurrency(arrangement.amount)}`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            if (arrangement.rate) {
              currentPage.drawText(`   Rate: ${arrangement.rate}%`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            if (arrangement.term) {
              currentPage.drawText(`   Term: ${arrangement.term}`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            if (arrangement.security) {
              currentPage.drawText(`   Security: ${arrangement.security}`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            if (arrangement.monthlyPayment) {
              currentPage.drawText(`   Monthly Payment: ${formatCurrency(arrangement.monthlyPayment)}`, {
                x: 70,
                y: currentY,
                size: 9,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
              currentY -= 12;
            }

            currentY -= 5; // Space between arrangements
          });
        }
      }
    }

    // Handle direct array of funding arrangements
    if (Array.isArray(fundingData) && fundingData.length > 0) {
      currentPage.drawText('Current Funding Arrangements:', {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;

      fundingData.forEach((funding: any, index: number) => {
        if (currentY < 100) {
          currentPage = pdfDoc.addPage([595.276, 841.890]);
          currentY = 750;
        }

        currentPage.drawText(`${index + 1}. ${funding.type || funding.name || 'Funding Arrangement'}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helveticaBold,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;

        // Display relevant fields
        const fieldsToShow = [
          { key: 'lender', label: 'Lender' },
          { key: 'provider', label: 'Provider' },
          { key: 'amount', label: 'Amount', isCurrency: true },
          { key: 'outstanding', label: 'Outstanding', isCurrency: true },
          { key: 'rate', label: 'Rate', isPercentage: true },
          { key: 'term', label: 'Term' },
          { key: 'maturity', label: 'Maturity Date', isDate: true },
          { key: 'security', label: 'Security' }
        ];

        fieldsToShow.forEach(field => {
          if (funding[field.key]) {
            let value = funding[field.key];
            if (field.isCurrency) {
              value = formatCurrency(value);
            } else if (field.isPercentage) {
              value = `${value}%`;
            } else if (field.isDate) {
              value = formatDate(value);
            }

            currentPage.drawText(`   ${field.label}: ${value}`, {
              x: 70,
              y: currentY,
              size: 9,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
            currentY -= 12;
          }
        });

        currentY -= 5; // Space between arrangements
      });
    } else {
      // Handle object-based funding data
      const fundingKeys = Object.keys(fundingData).filter(key => 
        !['hasCurrentFunding', 'fundingDetails'].includes(key)
      );

      if (fundingKeys.length > 0) {
        currentPage.drawText('Current Funding Summary:', {
          x: 50,
          y: currentY,
          size: 11,
          font: fonts.helveticaBold,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;

        fundingKeys.slice(0, 10).forEach(key => { // Limit to avoid too much data
          const value = fundingData[key];
          if (value && typeof value !== 'object') {
            currentPage.drawText(`${key}: ${value}`, {
              x: 50,
              y: currentY,
              size: 10,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
            currentY -= 15;
          }
        });
      } else {
        currentPage.drawText('Current funding information is available for this business', {
          x: 50,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 20;
      }
    }
  } else {
    currentPage.drawText('Current funding information is available for this business', {
      x: 50,
      y: currentY,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= 20;
  }

  return { page: currentPage, yPosition: currentY };
}
