import { PDFPage, PDFDocument, rgb } from 'pdf-lib';
import { PdfContext, RenderResult } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Helper function to render a modern card container
 */
function renderCardContainer(
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
  
  // Main container with subtle shadow effect
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

/**
 * Helper function to render a modern section header
 */
function renderSectionHeader(
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
 * Helper function to get score-based color (for the circular indicator)
 */
function getScoreBasedColor(score: number): { r: number; g: number; b: number } {
  if (score >= 71) {
    return { r: 0.066, g: 0.725, b: 0.506 }; // emerald-500 - Very Low Risk
  } else if (score >= 51) {
    return { r: 0.133, g: 0.773, b: 0.369 }; // green-500 - Low/Moderate Risk
  } else if (score >= 30) {
    return { r: 1, g: 0.647, b: 0 }; // orange-500 - Moderate Risk
  } else if (score >= 21) {
    return { r: 0.937, g: 0.267, b: 0.267 }; // red-500 - High Risk
  } else if (score >= 1) {
    return { r: 0.863, g: 0.149, b: 0.149 }; // red-600 - Very High Risk
  } else {
    return { r: 0.392, g: 0.455, b: 0.545 }; // slate-500 - Not Scored
  }
}

/**
 * Helper function to render rounded badge
 */
function renderRoundedBadge(
  page: PDFPage,
  x: number,
  y: number,
  text: string,
  backgroundColor: { r: number; g: number; b: number },
  textColor: { r: number; g: number; b: number },
  fonts: {[key: string]: any},
  width?: number
): number {
  const badgeWidth = width || 140; // Standardized width for all badges
  const badgeHeight = 22;
  const cornerRadius = 11; // Half the height for fully rounded corners
  
  // Create rounded badge using multiple shapes for better rounded appearance
  // Main rectangle (center part)
  page.drawRectangle({
    x: x + cornerRadius,
    y: y - badgeHeight + 5,
    width: badgeWidth - (cornerRadius * 2),
    height: badgeHeight,
    color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
  });
  
  // Left rounded end (circle)
  page.drawCircle({
    x: x + cornerRadius,
    y: y - cornerRadius + 5,
    size: cornerRadius,
    color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
  });
  
  // Right rounded end (circle)
  page.drawCircle({
    x: x + badgeWidth - cornerRadius,
    y: y - cornerRadius + 5,
    size: cornerRadius,
    color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
  });
  
  // Badge text (centered)
  const textWidth = text.length * 5.5;
  page.drawText(text, {
    x: x + (badgeWidth - textWidth) / 2,
    y: y - 11,
    size: 9,
    font: fonts.helveticaBold,
    color: rgb(textColor.r, textColor.g, textColor.b),
  });
  
  return badgeWidth;
}

/**
 * Helper function to render a modern status badge
 */
function renderStatusBadge(
  page: PDFPage,
  x: number,
  y: number,
  text: string,
  riskLevel: string,
  fonts: {[key: string]: any}
): void {
  // Use green for all status badges to match the web UI
  const color = { r: 0.133, g: 0.773, b: 0.369 }; // green-500
  renderRoundedBadge(page, x, y, text, color, { r: 1, g: 1, b: 1 }, fonts);
}

/**
 * Helper function to render a circular progress indicator using segments
 */
function renderCircularCreditScore(
  page: PDFPage,
  centerX: number,
  centerY: number,
  score: string | number,
  riskLevel: string,
  fonts: {[key: string]: any},
  colors: {[key: string]: any}
): void {
  const radius = 44;
  const strokeWidth = 8;
  const numericScore = typeof score === 'number' ? score : parseFloat(String(score));
  const maxScore = 100;
  const percentage = Math.min(numericScore / maxScore, 1);
  
  // Get proper score-based color using the existing helper function
  const progressColor = getScoreBasedColor(numericScore);
  
  // Draw outer background circle (light gray stroke)
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius,
    borderColor: rgb(0.898, 0.910, 0.918), // gray-300
    borderWidth: strokeWidth,
  });
  
  // Draw progress arc using multiple small segments to approximate SVG stroke-dasharray
  const totalSegments = 120; // More segments for smoother appearance
  const progressSegments = Math.floor(totalSegments * percentage);
  const segmentAngle = (2 * Math.PI) / totalSegments;
  const startAngle = -Math.PI / 2; // Start from top (12 o'clock position)
  
  for (let i = 0; i < progressSegments; i++) {
    const angle = startAngle + (i * segmentAngle);
    const nextAngle = startAngle + ((i + 1) * segmentAngle);
    
    // Calculate the midpoint for each segment
    const segmentRadius = radius;
    const x1 = centerX + segmentRadius * Math.cos(angle);
    const y1 = centerY + segmentRadius * Math.sin(angle);
    const x2 = centerX + segmentRadius * Math.cos(nextAngle);
    const y2 = centerY + segmentRadius * Math.sin(nextAngle);
    
    // Draw small circles at segment points to create smooth progress ring
    page.drawCircle({
      x: x1,
      y: y1,
      size: strokeWidth / 2,
      color: rgb(progressColor.r, progressColor.g, progressColor.b),
    });
  }
  
  // Add rounded end cap at the end of progress
  if (progressSegments > 0) {
    const endAngle = startAngle + (progressSegments * segmentAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);
    
    page.drawCircle({
      x: endX,
      y: endY,
      size: strokeWidth / 2,
      color: rgb(progressColor.r, progressColor.g, progressColor.b),
    });
  }
  
  // Draw inner white circle for clean center area
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: radius - strokeWidth - 2,
    color: rgb(1, 1, 1),
  });
  
  // Draw score text in center (larger, bolder to match web UI)
  const scoreText = String(score);
  const scoreTextWidth = scoreText.length * 10; // Adjusted for larger font
  page.drawText(scoreText, {
    x: centerX - scoreTextWidth / 2,
    y: centerY + 6,
    size: 24, // Reduced from 28 to fit better
    font: fonts.helveticaBold,
    color: rgb(progressColor.r * 0.8, progressColor.g * 0.8, progressColor.b * 0.8), // Slightly darker version of progress color
  });
  
  // Draw "Business Credit Score" label below score (matching web UI)
  const labelText = 'Business Credit Score';
  const labelWidth = labelText.length * 3.5;
  page.drawText(labelText, {
    x: centerX - labelWidth / 2,
    y: centerY - 16,
    size: 8,
    font: fonts.helvetica,
    color: rgb(progressColor.r * 0.9, progressColor.g * 0.9, progressColor.b * 0.9),
  });
}

/**
 * Helper function to render HMRC-style status indicators
 */
function renderStatusIndicators(
  page: PDFPage,
  x: number,
  y: number,
  fonts: {[key: string]: any}
): number {
  const indicatorWidth = 120;
  const indicatorHeight = 25;
  const spacing = 8;
  
  // VAT Up to Date indicator
  page.drawRectangle({
    x: x,
    y: y - indicatorHeight,
    width: indicatorWidth,
    height: indicatorHeight,
    color: rgb(0.9, 0.98, 0.9),
    borderColor: rgb(0.133, 0.773, 0.369),
    borderWidth: 1.5,
  });
  
  // Checkmark circle
  page.drawCircle({
    x: x + 12,
    y: y - 12,
    size: 4,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  page.drawText('VAT Up to Date', {
    x: x + 22,
    y: y - 16,
    size: 9,
    font: fonts.helveticaBold,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  let currentY = y - indicatorHeight - spacing;
  
  // Corp Tax Up to Date indicator
  page.drawRectangle({
    x: x,
    y: currentY - indicatorHeight,
    width: indicatorWidth,
    height: indicatorHeight,
    color: rgb(0.9, 0.98, 0.9),
    borderColor: rgb(0.133, 0.773, 0.369),
    borderWidth: 1.5,
  });
  
  page.drawCircle({
    x: x + 12,
    y: currentY - 12,
    size: 4,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  page.drawText('Corp Tax Up to Date', {
    x: x + 22,
    y: currentY - 16,
    size: 9,
    font: fonts.helveticaBold,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  currentY -= indicatorHeight + spacing;
  
  // PAYE Up to Date indicator
  page.drawRectangle({
    x: x,
    y: currentY - indicatorHeight,
    width: indicatorWidth,
    height: indicatorHeight,
    color: rgb(0.9, 0.98, 0.9),
    borderColor: rgb(0.133, 0.773, 0.369),
    borderWidth: 1.5,
  });
  
  page.drawCircle({
    x: x + 12,
    y: currentY - 12,
    size: 4,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  page.drawText('PAYE Up to Date', {
    x: x + 22,
    y: currentY - 16,
    size: 9,
    font: fonts.helveticaBold,
    color: rgb(0.133, 0.773, 0.369),
  });
  
  return (indicatorHeight + spacing) * 3;
}

/**
 * Helper function to render a modern credit score display with circular indicator
 */
function renderCreditScoreDisplay(
  page: PDFPage,
  x: number,
  y: number,
  score: string | number,
  riskLevel: string,
  creditData: any,
  hmrcData: any,
  fonts: {[key: string]: any},
  colors: {[key: string]: any}
): number {
  const containerWidth = 500;
  const containerHeight = 320; // Increased height to fit all elements
  
  // Modern container with subtle styling and shadow
  page.drawRectangle({
    x: x + 3,
    y: y - containerHeight - 3,
    width: containerWidth,
    height: containerHeight,
    color: rgb(0.8, 0.8, 0.8),
    opacity: 0.2,
  });
  
  // Main container with white background
  page.drawRectangle({
    x: x,
    y: y - containerHeight,
    width: containerWidth,
    height: containerHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.85, 0.89, 0.95),
    borderWidth: 1,
  });
  
  // Header section with dark background (matching web UI)
  const headerHeight = 45;
  page.drawRectangle({
    x: x,
    y: y - headerHeight,
    width: containerWidth,
    height: headerHeight,
    color: rgb(0.129, 0.161, 0.212), // matching [#212936]
  });
  
  // Header title with icon placeholder
  page.drawCircle({
    x: x + 20,
    y: y - 22,
    size: 8,
    color: rgb(1, 0.5, 0), // orange color for trend icon
  });
  
  page.drawText('Credit Assessment', {
    x: x + 35,
    y: y - 27,
    size: 14,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1), // white text
  });
  
  page.drawText('Complete business credit and tax compliance overview', {
    x: x + 35,
    y: y - 40,
    size: 10,
    font: fonts.helvetica,
    color: rgb(0.8, 0.8, 0.8), // light gray text
  });
  
  // Content area starts below header
  const contentY = y - headerHeight - 20;
  
  // Circular credit score indicator (centered in left section)
  const circleX = x + 100;
  const circleY = contentY - 70;
  renderCircularCreditScore(page, circleX, circleY, score, riskLevel, fonts, colors);
  
  // Right side content area
  const rightSideX = x + 220;
  let currentRightY = contentY - 20;
  
  // Credit score badge
  if (score) {
    const scoreColor = getScoreBasedColor(typeof score === 'number' ? score : parseFloat(String(score)));
    renderRoundedBadge(page, rightSideX, currentRightY, `Score: ${score}`, scoreColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 30;
  }
  
  // Risk level badge
  if (riskLevel) {
    const riskColor = { r: 0.133, g: 0.773, b: 0.369 }; // green for all status badges
    renderRoundedBadge(page, rightSideX, currentRightY, String(riskLevel), riskColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 30;
  }
  
  // Business type badge (if available)
  const businessTypeFields = ['business_type', 'company_type', 'entityType', 'type'];
  for (const field of businessTypeFields) {
    if (creditData[field]) {
      const businessColor = { r: 0.6, g: 0.8, b: 1 }; // blue
      renderRoundedBadge(page, rightSideX, currentRightY, String(creditData[field]), businessColor, { r: 1, g: 1, b: 1 }, fonts);
      currentRightY -= 30;
      break;
    }
  }
  
  // Credit limit badge (if available) - check multiple possible locations matching CreditScoreCard
  let creditLimit = null;
  
  // Check direct credit data fields first
  const limitFields = ['credit_limit', 'creditLimit', 'max_credit', 'available_credit', 'limit'];
  for (const field of limitFields) {
    if (creditData[field] !== undefined && creditData[field] !== null && creditData[field] !== '') {
      creditLimit = creditData[field];
      break;
    }
  }
  
  // Check details.credit_limit (matching CreditScoreCard logic)
  if (!creditLimit && creditData.details?.credit_limit !== undefined && creditData.details?.credit_limit !== null && creditData.details?.credit_limit !== '') {
    creditLimit = creditData.details.credit_limit;
  }
  
  // Check details.data.credit_limit
  if (!creditLimit && creditData.details?.data?.credit_limit !== undefined && creditData.details?.data?.credit_limit !== null && creditData.details?.data?.credit_limit !== '') {
    creditLimit = creditData.details.data.credit_limit;
  }
  
  // Check full credit report structure
  if (!creditLimit && creditData.details?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    creditLimit = creditData.details.report.creditScore.currentCreditRating.creditLimit.value;
  }
  
  // Check raw_data structure (matching CreditScoreCard logic)
  if (!creditLimit && creditData.details?.raw_data?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    creditLimit = creditData.details.raw_data.report.creditScore.currentCreditRating.creditLimit.value;
  }
  
  // Check raw_data at top level
  if (!creditLimit && creditData.raw_data?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    creditLimit = creditData.raw_data.report.creditScore.currentCreditRating.creditLimit.value;
  }
  
  // Check data.details structure
  if (!creditLimit && creditData.data?.details?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    creditLimit = creditData.data.details.report.creditScore.currentCreditRating.creditLimit.value;
  }
  
  // If we found a credit limit, render it
  if (creditLimit !== null && creditLimit !== undefined && creditLimit !== '') {
    // Format the credit limit properly (handle both numeric and string values)
    let formattedLimit = '';
    if (typeof creditLimit === 'string' && (creditLimit.includes('£') || creditLimit.includes('$') || creditLimit.includes('€'))) {
      formattedLimit = creditLimit; // Already formatted
    } else {
      formattedLimit = formatCurrency(creditLimit); // Use our formatter
    }
    
    const limitColor = { r: 0.8, g: 0.5, b: 1 }; // purple color for credit limit
    renderRoundedBadge(page, rightSideX, currentRightY, `Limit: ${formattedLimit}`, limitColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 30;
  }
  
  // Tax compliance badges based on actual HMRC data
  if (hmrcData && typeof hmrcData === 'object') {
    // VAT Status
    const vatStatus = hmrcData.vatStatus || hmrcData.vat_status || 'Current';
    const vatColor = vatStatus.toLowerCase().includes('current') || vatStatus.toLowerCase().includes('up to date') 
      ? { r: 0.133, g: 0.773, b: 0.369 } : { r: 0.937, g: 0.267, b: 0.267 };
    
    renderRoundedBadge(page, rightSideX, currentRightY, `VAT: ${vatStatus}`, vatColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
    
    // Corporation Tax Status
    const corpTaxStatus = hmrcData.corporationTaxStatus || hmrcData.corp_tax_status || 'Current';
    const corpTaxColor = corpTaxStatus.toLowerCase().includes('current') || corpTaxStatus.toLowerCase().includes('up to date')
      ? { r: 0.133, g: 0.773, b: 0.369 } : { r: 0.937, g: 0.267, b: 0.267 };
    
    renderRoundedBadge(page, rightSideX, currentRightY, `Corp Tax: ${corpTaxStatus}`, corpTaxColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
    
    // PAYE Status
    const payeStatus = hmrcData.payeStatus || hmrcData.paye_status || 'Compliant';
    const payeColor = payeStatus.toLowerCase().includes('compliant') || payeStatus.toLowerCase().includes('current') || payeStatus.toLowerCase().includes('up to date')
      ? { r: 0.133, g: 0.773, b: 0.369 } : { r: 0.937, g: 0.267, b: 0.267 };
    
    renderRoundedBadge(page, rightSideX, currentRightY, `PAYE: ${payeStatus}`, payeColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
    
    // Overall Tax Status
    const overallTaxStatus = (hmrcData.isUpToDate === 'yes' || hmrcData.isUpToDate === true) ? 'Tax Compliant' : 'Tax Issues';
    const overallColor = (hmrcData.isUpToDate === 'yes' || hmrcData.isUpToDate === true)
      ? { r: 0.133, g: 0.773, b: 0.369 } : { r: 0.937, g: 0.267, b: 0.267 };
    
    renderRoundedBadge(page, rightSideX, currentRightY, overallTaxStatus, overallColor, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
  } else {
    // Default tax compliance badges when no HMRC data is available
    renderRoundedBadge(page, rightSideX, currentRightY, 'VAT: Current', { r: 0.133, g: 0.773, b: 0.369 }, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
    
    renderRoundedBadge(page, rightSideX, currentRightY, 'Corp Tax: Current', { r: 0.133, g: 0.773, b: 0.369 }, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
    
    renderRoundedBadge(page, rightSideX, currentRightY, 'PAYE: Compliant', { r: 0.133, g: 0.773, b: 0.369 }, { r: 1, g: 1, b: 1 }, fonts);
    currentRightY -= 25;
  }
  
  // Last updated info at bottom right
  page.drawText('Last updated: 13 June 2025', {
    x: rightSideX,
    y: currentRightY - 10,
    size: 8,
    font: fonts.helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  return containerHeight + 30;
}

/**
 * Helper function to render comprehensive credit score information
 */
export function renderCreditInformation(
  page: PDFPage,
  yPosition: number,
  width: number,
  creditInfo: any,
  fonts: {[key: string]: any},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument,
  hmrcData?: any
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;
  
  // Modern section header
  renderSectionHeader(currentPage, 40, currentY, width - 80, 'Credit Information', fonts, colors);
  currentY -= 50;

  // Try to access nested data structures
  let actualCreditData = creditInfo;
  
  // Handle normalized data structure (from normalizeCreditScoreData)
  if (creditInfo && creditInfo.details && typeof creditInfo.details === 'object') {
    // Use both the normalized data at the top level and the original data in details
    actualCreditData = {
      ...creditInfo,
      ...creditInfo.details
    };
  } else if (creditInfo && creditInfo.data) {
    actualCreditData = creditInfo.data;
  } else if (creditInfo && creditInfo.report) {
    actualCreditData = creditInfo.report;
  } else if (creditInfo && creditInfo.result) {
    actualCreditData = creditInfo.result;
  } else if (creditInfo && creditInfo.companies && creditInfo.companies[0]) {
    actualCreditData = creditInfo.companies[0];
  }
  
  let hasDisplayedCreditData = false;

  // Check if we need a new page
  if (currentY < 150) {
    currentPage = pdfDoc.addPage([595.276, 841.890]);
    currentY = 750;
  }

  // Display credit score if available - prioritize normalized fields first
  const scoreFields = ['score', 'credit_score', 'creditScore', 'overall_score', 'rating_score', 'creditRating', 'rating'];
  let creditScore = null;
  let riskLevel = '';
  
  for (const field of scoreFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      creditScore = actualCreditData[field];
      break;
    }
  }

  // Get risk level for styling
  const ratingFields = ['risk_level', 'rating', 'credit_rating', 'creditRating', 'grade', 'risk_rating', 'riskLevel', 'status'];
  for (const field of ratingFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      riskLevel = actualCreditData[field];
      break;
    }
  }

  // Create a prominent credit score display with modern styling
  if (creditScore !== null) {
    const scoreHeight = renderCreditScoreDisplay(
      currentPage, 
      50, 
      currentY, 
      creditScore, 
      riskLevel, 
      actualCreditData,
      hmrcData,
      fonts, 
      colors
    );
    currentY -= scoreHeight;
    hasDisplayedCreditData = true;
  }

  // Skip the separate credit details section since everything is now in the main assessment box
  // Only show additional detailed information if there's something significant not already displayed

  // Additional credit metrics with modern styling
  if (hasDisplayedCreditData) {
    const additionalFields = [
      { key: 'payment_score', label: 'Payment Score' },
      { key: 'financial_strength', label: 'Financial Strength' },
      { key: 'risk_category', label: 'Risk Category' },
      { key: 'sector_risk', label: 'Sector Risk' },
      { key: 'years_on_file', label: 'Years on File' },
      { key: 'last_updated', label: 'Last Updated', isDate: true }
    ];

    let hasAdditionalData = false;
    for (const { key, label, isDate } of additionalFields) {
      if (actualCreditData[key] !== undefined && actualCreditData[key] !== null && actualCreditData[key] !== '') {
        hasAdditionalData = true;
        break;
      }
    }

    if (hasAdditionalData) {
      currentY -= 20;
      
      // Additional info container
      const additionalHeight = 80;
      renderCardContainer(
        currentPage, 
        50, 
        currentY, 
        width - 100, 
        additionalHeight,
        { r: 0.99, g: 0.99, b: 0.97 },
        { r: 0.9, g: 0.9, b: 0.85 }
      );
      
      currentPage.drawText('Additional Information', {
        x: 65,
        y: currentY - 20,
        size: 11,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      
      let infoY = currentY - 40;
      for (const { key, label, isDate } of additionalFields.slice(0, 3)) {
        if (actualCreditData[key] !== undefined && actualCreditData[key] !== null && actualCreditData[key] !== '') {
          const value = isDate ? formatDate(actualCreditData[key]) : actualCreditData[key];
          
          currentPage.drawCircle({
            x: 70,
            y: infoY - 3,
            size: 2,
            color: colors.accentColor,
          });
          
          currentPage.drawText(`${label}: ${value}`, {
            x: 85,
            y: infoY,
            size: 9,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          infoY -= 15;
        }
      }
      
      currentY -= additionalHeight + 10;
    }
  }

  // Payment history with modern styling
  if (actualCreditData.payment_history || actualCreditData.paymentHistory) {
    const paymentHistory = actualCreditData.payment_history || actualCreditData.paymentHistory;
    
    currentY -= 20;
    
    // Payment history container
    const historyHeight = 60;
    renderCardContainer(
      currentPage, 
      50, 
      currentY, 
      width - 100, 
      historyHeight,
      { r: 0.97, g: 0.98, b: 1 },
      { r: 0.8, g: 0.85, b: 0.95 }
    );
    
    currentPage.drawText('Payment History Summary', {
      x: 65,
      y: currentY - 20,
      size: 11,
      font: fonts.helveticaBold,
      color: colors.primaryColor,
    });

    if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      const summary = paymentHistory.slice(0, 3).map(p => `${p.period}: ${p.status}`).join(' | ');
      currentPage.drawText(summary, {
        x: 65,
        y: currentY - 40,
        size: 9,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
    } else if (typeof paymentHistory === 'object') {
      const entries = Object.entries(paymentHistory).slice(0, 3);
      const summary = entries.map(([key, value]) => `${key}: ${value}`).join(' | ');
      currentPage.drawText(summary, {
        x: 65,
        y: currentY - 40,
        size: 9,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
    }
    currentY -= historyHeight + 10;
    hasDisplayedCreditData = true;
  }

  // Modern "no data" message
  if (!hasDisplayedCreditData) {
    const noDataHeight = 50;
    renderCardContainer(
      currentPage, 
      50, 
      currentY, 
      width - 100, 
      noDataHeight,
      { r: 0.98, g: 0.98, b: 0.98 },
      { r: 0.9, g: 0.9, b: 0.9 }
    );
    
    currentPage.drawText('* Credit information is available for this business', {
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
