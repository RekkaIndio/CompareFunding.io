import { PDFPage, PDFDocument, rgb } from 'pdf-lib';
import { RenderResult } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Helper function to render a modern card container with header
 */
function renderHMRCModernCard(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  subtitle: string,
  fonts: {[key: string]: any}
): number {
  // Card shadow
  page.drawRectangle({
    x: x + 3,
    y: y - height - 3,
    width: width,
    height: height,
    color: rgb(0.8, 0.8, 0.8),
    opacity: 0.2,
  });
  
  // Main container with white background
  page.drawRectangle({
    x: x,
    y: y - height,
    width: width,
    height: height,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.89, 0.95),
    borderWidth: 1,
  });
  
  // Header section with dark background
  const headerHeight = 45;
  page.drawRectangle({
    x: x,
    y: y - headerHeight,
    width: width,
    height: headerHeight,
    color: rgb(0.129, 0.161, 0.212), // matching [#212936]
  });
  
  // Header icon placeholder (document icon for HMRC)
  page.drawRectangle({
    x: x + 15,
    y: y - 30,
    width: 12,
    height: 16,
    color: rgb(1, 0.5, 0), // orange color
  });
  
  // Header title
  page.drawText(title, {
    x: x + 35,
    y: y - 27,
    size: 14,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1), // white text
  });
  
  // Header subtitle
  page.drawText(subtitle, {
    x: x + 35,
    y: y - 40,
    size: 10,
    font: fonts.helvetica,
    color: rgb(0.8, 0.8, 0.8), // light gray text
  });
  
  return headerHeight;
}

/**
 * Helper function to render a modern section header
 */
function renderHMRCSectionHeader(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  title: string,
  fonts: {[key: string]: any},
  colors: {[key: string]: any}
): void {
  // Header background gradient effect
  page.drawRectangle({
    x: x,
    y: y - 30,
    width: width,
    height: 35,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.85, 0.89, 0.95),
    borderWidth: 1,
  });
  
  // Accent line
  page.drawRectangle({
    x: x,
    y: y - 5,
    width: width,
    height: 4,
    color: colors.accentColor,
  });
  
  // Title text
  page.drawText(title, {
    x: x + 15,
    y: y - 20,
    size: 14,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
}

/**
 * Helper function to get status color based on HMRC compliance
 */
function getHMRCStatusColor(status: string | boolean): { r: number; g: number; b: number } {
  if (status === 'yes' || status === true) {
    return { r: 0.133, g: 0.773, b: 0.369 }; // green-500
  } else if (status === 'no' || status === false) {
    return { r: 0.937, g: 0.267, b: 0.267 }; // red-500
  } else {
    return { r: 0.392, g: 0.455, b: 0.545 }; // slate-500
  }
}

/**
 * Helper function to render HMRC status badge
 */
function renderHMRCStatusBadge(
  page: PDFPage,
  x: number,
  y: number,
  text: string,
  status: string | boolean,
  fonts: {[key: string]: any}
): void {
  const color = getHMRCStatusColor(status);
  const badgeWidth = Math.max(text.length * 7 + 25, 110);
  const badgeHeight = 28;
  
  // Badge shadow
  page.drawRectangle({
    x: x + 2,
    y: y - badgeHeight + 3,
    width: badgeWidth,
    height: badgeHeight,
    color: rgb(0, 0, 0),
    opacity: 0.1,
  });
  
  // Badge background
  page.drawRectangle({
    x: x,
    y: y - badgeHeight + 5,
    width: badgeWidth,
    height: badgeHeight,
    color: rgb(color.r, color.g, color.b),
    opacity: 0.15,
  });
  
  // Badge border
  page.drawRectangle({
    x: x,
    y: y - badgeHeight + 5,
    width: badgeWidth,
    height: badgeHeight,
    borderColor: rgb(color.r, color.g, color.b),
    borderWidth: 2,
  });
  
  // Badge text
  page.drawText(text, {
    x: x + 12,
    y: y - 12,
    size: 11,
    font: fonts.helveticaBold,
    color: rgb(color.r, color.g, color.b),
  });
}

/**
 * Render HMRC status and tax information
 */
export function renderHMRCData(
  page: PDFPage,
  yPosition: number,
  width: number,
  hmrcData: any,
  fonts: {[key: string]: any},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): RenderResult {
  let currentY = yPosition - 20;
  let currentPage = page;
  
  // Modern section header
  renderHMRCSectionHeader(currentPage, 40, currentY, width - 80, 'HMRC Status', fonts, colors);
  currentY -= 50;

  if (hmrcData && typeof hmrcData === 'object') {
    // Check if we need a new page
    if (currentY < 150) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
    }

    let hasRenderedContent = false;

    // Modern overall HMRC status display
    if (hmrcData.isUpToDate !== undefined) {
      const isUpToDate = hmrcData.isUpToDate === 'yes';
      const statusText = isUpToDate ? 'Up to Date' : 'Outstanding Liabilities';
      
      // Main status container with modern styling
      const statusHeight = 70;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        350, 
        statusHeight,
        isUpToDate ? { r: 0.95, g: 0.99, b: 0.95 } : { r: 0.99, g: 0.95, b: 0.95 },
        isUpToDate ? { r: 0.133, g: 0.773, b: 0.369 } : { r: 0.937, g: 0.267, b: 0.267 }
      );
      
      // Status label
      currentPage.drawText('Tax Status', {
        x: 65,
        y: currentY - 20,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Status value with prominent styling
      currentPage.drawText(statusText, {
        x: 65,
        y: currentY - 40,
        size: 14,
        font: fonts.helveticaBold,
        color: isUpToDate ? rgb(0.133, 0.773, 0.369) : rgb(0.937, 0.267, 0.267),
      });
      
      // Status badge
      renderHMRCStatusBadge(currentPage, 250, currentY - 25, statusText, hmrcData.isUpToDate, fonts);
      
      currentY -= statusHeight + 20;
      hasRenderedContent = true;
    }

    // Modern tax details section
    currentPage.drawText('Tax Details', {
      x: 50,
      y: currentY,
      size: 13,
      font: fonts.helveticaBold,
      color: colors.primaryColor,
    });
    currentY -= 30;

    // VAT Details with modern styling
    if (hmrcData.vatDetails && typeof hmrcData.vatDetails === 'object') {
      const vatDetails = hmrcData.vatDetails;
      
      const vatHeight = 80;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        vatHeight,
        { r: 0.97, g: 0.99, b: 0.97 },
        { r: 0.8, g: 0.9, b: 0.8 }
      );
      
      // VAT header with modern bullet
      currentPage.drawCircle({
        x: 70,
        y: currentY - 20,
        size: 4,
        color: rgb(0.133, 0.773, 0.369),
      });
      
      currentPage.drawText('VAT Status', {
        x: 85,
        y: currentY - 22,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });

      let vatY = currentY - 45;
      if (vatDetails.amount) {
        currentPage.drawText(`Outstanding Amount: ${formatCurrency(vatDetails.amount)}`, {
          x: 85,
          y: vatY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        vatY -= 15;
      }

      if (vatDetails.timeToPay) {
        currentPage.drawText(`Expected Payment: ${vatDetails.timeToPay}`, {
          x: 85,
          y: vatY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
      }

      currentY -= vatHeight + 15;
      hasRenderedContent = true;
    }

    // Corporation Tax Details with modern styling
    if (hmrcData.corpTaxDetails && typeof hmrcData.corpTaxDetails === 'object') {
      const corpTaxDetails = hmrcData.corpTaxDetails;
      
      const corpHeight = 80;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        corpHeight,
        { r: 0.97, g: 0.97, b: 0.99 },
        { r: 0.8, g: 0.8, b: 0.9 }
      );
      
      // Corporation Tax header with modern bullet
      currentPage.drawCircle({
        x: 70,
        y: currentY - 20,
        size: 4,
        color: rgb(0.392, 0.455, 0.545),
      });
      
      currentPage.drawText('Corporation Tax Status', {
        x: 85,
        y: currentY - 22,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });

      let corpY = currentY - 45;
      if (corpTaxDetails.amount) {
        currentPage.drawText(`Outstanding Amount: ${formatCurrency(corpTaxDetails.amount)}`, {
          x: 85,
          y: corpY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        corpY -= 15;
      }

      if (corpTaxDetails.dueDate) {
        currentPage.drawText(`Due Date: ${formatDate(corpTaxDetails.dueDate)}`, {
          x: 85,
          y: corpY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
      }

      currentY -= corpHeight + 15;
      hasRenderedContent = true;
    }

    // PAYE Details with modern styling
    if (hmrcData.payeDetails && typeof hmrcData.payeDetails === 'object') {
      const payeDetails = hmrcData.payeDetails;
      
      const payeHeight = 80;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        payeHeight,
        { r: 0.99, g: 0.97, b: 0.97 },
        { r: 0.9, g: 0.8, b: 0.8 }
      );
      
      // PAYE header with modern bullet
      currentPage.drawCircle({
        x: 70,
        y: currentY - 20,
        size: 4,
        color: rgb(0.937, 0.267, 0.267),
      });
      
      currentPage.drawText('PAYE Status', {
        x: 85,
        y: currentY - 22,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });

      let payeY = currentY - 45;
      if (payeDetails.amount) {
        currentPage.drawText(`Outstanding Amount: ${formatCurrency(payeDetails.amount)}`, {
          x: 85,
          y: payeY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        payeY -= 15;
      }

      if (payeDetails.periodEnd) {
        currentPage.drawText(`Period End: ${formatDate(payeDetails.periodEnd)}`, {
          x: 85,
          y: payeY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
      }

      currentY -= payeHeight + 15;
      hasRenderedContent = true;
    }

    // Additional HMRC information with modern styling
    const processedCategories = ['vatReturns', 'vat_returns', 'corporationTax', 'corporation_tax', 'paye', 'payroll', 'isUpToDate', 'vatDetails', 'corpTaxDetails', 'payeDetails', 'updatedAt'];
    const otherCategories = Object.keys(hmrcData).filter(key => !processedCategories.includes(key));
    
    if (otherCategories.length > 0) {
      const additionalHeight = 60;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        additionalHeight,
        { r: 0.99, g: 0.99, b: 0.97 },
        { r: 0.9, g: 0.9, b: 0.85 }
      );
      
      currentPage.drawText('Additional HMRC Information', {
        x: 65,
        y: currentY - 20,
        size: 11,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      
      let infoY = currentY - 40;
      for (const category of otherCategories.slice(0, 2)) {
        const value = hmrcData[category];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          currentPage.drawCircle({
            x: 70,
            y: infoY - 3,
            size: 2,
            color: colors.accentColor,
          });
          
          currentPage.drawText(`${category}: Available`, {
            x: 85,
            y: infoY,
            size: 9,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          infoY -= 15;
          hasRenderedContent = true;
        }
      }
      
      currentY -= additionalHeight + 10;
    }

    // Modern "no data" message
    if (!hasRenderedContent) {
      const noDataHeight = 50;
      renderHMRCCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        noDataHeight,
        { r: 0.98, g: 0.98, b: 0.98 },
        { r: 0.9, g: 0.9, b: 0.9 }
      );
      
      currentPage.drawText('* HMRC data is available for this business', {
        x: 65,
        y: currentY - 25,
        size: 10,
        font: fonts.helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= noDataHeight + 10;
    }
  } else {
    // Modern "no HMRC data" message
    const noDataHeight = 50;
    renderHMRCCardContainer(
      currentPage, 
      50, 
      currentY, 
      width - 100, 
      noDataHeight,
      { r: 0.98, g: 0.98, b: 0.98 },
      { r: 0.9, g: 0.9, b: 0.9 }
    );
    
    currentPage.drawText('* HMRC data is available for this business', {
      x: 65,
      y: currentY - 25,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    currentY -= noDataHeight + 10;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Alias for backward compatibility
 */
function renderHMRCCardContainer(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor?: { r: number; g: number; b: number },
  borderColor?: { r: number; g: number; b: number }
): void {
  const bgColor = backgroundColor || { r: 0.99, g: 0.99, b: 0.99 };
  const bColor = borderColor || { r: 0.9, g: 0.9, b: 0.9 };
  
  // Container shadow
  page.drawRectangle({
    x: x + 2,
    y: y - height - 2,
    width: width,
    height: height,
    color: rgb(0.85, 0.85, 0.85),
    opacity: 0.3,
  });
  
  // Main container
  page.drawRectangle({
    x: x,
    y: y - height,
    width: width,
    height: height,
    color: rgb(bgColor.r, bgColor.g, bgColor.b),
    borderColor: rgb(bColor.r, bColor.g, bColor.b),
    borderWidth: 1,
  });
}
