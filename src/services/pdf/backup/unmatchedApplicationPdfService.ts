// @ts-nocheck - This is a backup file, use the modular structure in /src/services/pdf/ instead
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import { Application, ApplicationData, Business, FinancialData } from '@/pages/Lender/BusinessDetail/types';

export interface ApplicationPdfOptions {
  isLenderMatched: boolean;
  lenderName?: string;
  generatedDate?: Date;
}

// Helper function to format currency
function formatCurrency(value: any): string {
  if (!value && value !== 0) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

// Helper function to safely format dates
function formatDate(dateInput: any): string {
  if (!dateInput) return 'Unknown Date';
  
  try {
    let date: Date;
    
    // Handle different date formats
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput.seconds) {
      // Firestore timestamp
      date = new Date(dateInput.seconds * 1000);
    } else if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      // Firestore timestamp with toDate method
      date = dateInput.toDate();
    } else {
      return 'Unknown Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown Date';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown Date';
  }
}

// Helper function to extract line items from financial data
function extractLineItems(data: any): any[] {
  if (!data) return [];
  
  // If lineItems already exists, use it
  if (data.lineItems && Array.isArray(data.lineItems)) {
    return data.lineItems;
  }
  
  // Try to extract from various data structures
  const extractedItems: any[] = [];
  
  // Check for nested structures (profitAndLoss, balanceSheet, etc.)
  if (data.profitAndLoss && data.profitAndLoss.lineItems) {
    return data.profitAndLoss.lineItems;
  }
  
  if (data.balanceSheet && data.balanceSheet.lineItems) {
    return data.balanceSheet.lineItems;
  }
  
  // Check for structured data with proper financial items
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // Check for array at root level
  if (Array.isArray(data)) {
    return data;
  }
  
  // For object-based financial data, extract as key-value pairs
  if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      // Skip metadata fields
      if (['pages', 'fileName', 'documentType', 'currency', 'period', 'companyName', 'createdAt', 'summary'].includes(key)) {
        return;
      }
      
      // Handle nested objects (like categories of financial items)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Extract from nested object
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (typeof nestedValue === 'number' || 
              (typeof nestedValue === 'string' && !isNaN(parseFloat(nestedValue.toString().replace(/[^\d.-]/g, ''))))) {
            extractedItems.push({
              item: nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
              value: typeof nestedValue === 'number' ? nestedValue : parseFloat(nestedValue.toString().replace(/[^\d.-]/g, '')),
              currentYear: typeof nestedValue === 'number' ? nestedValue : parseFloat(nestedValue.toString().replace(/[^\d.-]/g, '')),
              category: key
            });
          }
        });
      } 
      // Handle direct numeric values
      else if (typeof value === 'number' || 
               (typeof value === 'string' && !isNaN(parseFloat(value.toString().replace(/[^\d.-]/g, ''))))) {
        extractedItems.push({
          item: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value: typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')),
          currentYear: typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')),
          category: 'financial'
        });
      }
    });
  }
  
  return extractedItems;
}

// Helper function to get column headers from financial data
function getFinancialColumns(lineItems: any[]): string[] {
  if (!lineItems || lineItems.length === 0) return ['item', 'value'];
  
  const firstItem = lineItems[0];
  const columns = Object.keys(firstItem);
  
  // Preferred column order - prioritize 'item' column first
  const preferredOrder = ['item', 'note', 'description', 'account'];
  
  // Find financial columns (date patterns, amounts, etc.)
  const financialColumns: string[] = [];
  const textColumns: string[] = [];
  
  columns.forEach(col => {
    if (preferredOrder.includes(col.toLowerCase())) {
      textColumns.push(col);
    } else if (isFinancialColumn(col)) {
      financialColumns.push(col);
    } else if (!['category', 'isTotal', 'isHeader', 'isSubtotal', 'calculated'].includes(col)) {
      textColumns.push(col);
    }
  });
  
  // Sort financial columns - dates first, then others
  financialColumns.sort((a, b) => {
    // Date pattern (e.g., "31 MAR 2025", "2023", "2024")
    const dateRegex = /\d{1,2}\s+[A-Z]{3}\s+\d{4}|\d{4}/;
    const aIsDate = dateRegex.test(a);
    const bIsDate = dateRegex.test(b);
    
    if (aIsDate && !bIsDate) return -1;
    if (!aIsDate && bIsDate) return 1;
    
    // For dates, sort chronologically
    if (aIsDate && bIsDate) {
      const aYear = parseInt(a.match(/\d{4}/)?.[0] || '0');
      const bYear = parseInt(b.match(/\d{4}/)?.[0] || '0');
      return bYear - aYear; // Newest first
    }
    
    return a.localeCompare(b);
  });
  
  // Combine: text columns first, then financial columns
  return [...textColumns, ...financialColumns];
}

// Helper function to check if a column contains financial data
function isFinancialColumn(colKey: string): boolean {
  const key = colKey.toLowerCase();
  const nonFinancialColumns = ['item', 'note', 'notes', 'reference', 'ref', 'account', 'description', 'name'];
  
  if (nonFinancialColumns.includes(key)) return false;
  
  // Check for date patterns (e.g., "31 MAR 2025", "2023")
  if (/\d{1,2}\s+[A-Z]{3}\s+\d{4}|\d{4}/.test(colKey)) return true;
  
  // Check for time periods (e.g., "2 MONTHS", "3 MONTHS", "1 MONTH")
  if (/\d+\s+MONTHS?/i.test(colKey)) return true;
  
  // Check if it contains financial terms
  const financialTerms = [
    'year', 'amount', 'value', 'balance', 'total', 'debit', 'credit', 
    'current', 'previous', 'assets', 'liabilities', 'equity', 'profit',
    'loss', 'revenue', 'expense', 'cost', 'percentage', 'margin'
  ];
  
  return financialTerms.some(term => key.includes(term));
}

// Helper function to format column header for display
function formatColumnHeader(colKey: string): string {
  const headerMapping: Record<string, string> = {
    item: 'Item',
    note: 'Note',
    description: 'Description',
    account: 'Account',
    currentyear: 'Current Year',
    previousyear: 'Previous Year',
    value: 'Amount',
    currentYear: 'Current Year',
    previousYear: 'Previous Year',
    total: 'Total',
    percentage: 'Percentage'
  };
  
  const mapped = headerMapping[colKey.toLowerCase()];
  if (mapped) return mapped;
  
  // Check if it's a date pattern (e.g., "31 MAR 2025")
  if (/\d{1,2}\s+[A-Z]{3}\s+\d{4}/.test(colKey)) {
    return colKey; // Return as is for date formats
  }
  
  // Check if it's a year (e.g., "2023", "2022")
  if (/^20\d{2}$/.test(colKey)) {
    return colKey;
  }
  
  // Check if it's a time period (e.g., "2 MONTHS", "3 MONTHS")
  if (/\d+\s+MONTHS?/i.test(colKey)) {
    return colKey;
  }
  
  // Default: capitalize and format
  return colKey.replace(/([A-Z])/g, ' $1')
              .replace(/_/g, ' ')
              .replace(/^./, str => str.toUpperCase())
              .trim();
}

// Helper function to calculate dynamic column widths based on content
function calculateColumnWidths(columns: string[], items: any[], totalWidth: number): number[] {
  if (columns.length === 0) return [];
  
  const widths: number[] = [];
  const minWidth = 70;
  const maxTableWidth = totalWidth * 0.9; // Use 90% of available width
  
  // Reserve more space for item/description columns and less for financial columns
  columns.forEach((col, index) => {
    const isItemColumn = col.toLowerCase() === 'item' || 
                        col.toLowerCase() === 'description' || 
                        col.toLowerCase() === 'account';
    const isFinancialCol = isFinancialColumn(col);
    
    if (isItemColumn) {
      widths[index] = Math.max(minWidth * 2, maxTableWidth * 0.4); // 40% for item columns
    } else if (isFinancialCol) {
      widths[index] = Math.max(minWidth, maxTableWidth * 0.15); // 15% for financial columns
    } else {
      widths[index] = Math.max(minWidth, maxTableWidth * 0.2); // 20% for other columns
    }
  });
  
  // Ensure total width doesn't exceed available space
  const totalCalculated = widths.reduce((sum, w) => sum + w, 0);
  if (totalCalculated > maxTableWidth) {
    const scaleFactor = maxTableWidth / totalCalculated * 0.9;
    widths.forEach((_, index) => {
      widths[index] = Math.max(minWidth * 0.8, widths[index] * scaleFactor);
    });
  }
  
  return widths;
}

// Helper function to get X position for a column
function getColumnXPosition(columnIndex: number, columnWidths: number[]): number {
  const baseX = 50; // Starting X position
  let xPos = baseX;
  
  for (let i = 0; i < columnIndex; i++) {
    xPos += columnWidths[i];
  }
  
  return xPos;
}
function formatFinancialValue(value: any, key: string): string {
  // Handle object values first to prevent rendering objects directly
  if (typeof value === 'object' && value !== null) {
    // If it's an object with amount and description, extract the amount
    if (value.hasOwnProperty('amount') && value.hasOwnProperty('description')) {
      value = value.amount || 0;
    } else {
      // For other objects, return a string representation
      return JSON.stringify(value);
    }
  }

  // Fixed key terms that should always be formatted as currency
  const financialTerms = [
    'sales', 'turnover', 'revenue', 'cost', 'expense', 'profit', 'asset', 
    'liability', 'equity', 'balance', 'income', 'total', 'capital', 'tax', 'ebitda',
    'amount', 'value', 'current', '30days', '60days', '90days', 'over90days',
    'debit', 'credit', 'grossprofit', 'netprofit', 'totalassets', 'totalliabilities',
    'totalequity', 'grandtotal', 'currentyear', 'previousyear'
  ];
  
  // Check if the key suggests this is a financial value that should be a currency
  const shouldBeCurrency = financialTerms.some(term => 
    key.toLowerCase().includes(term) || /\d{4}/.test(key) // Also check for year patterns
  );
  
  // Check if value is a number or can be converted to a number
  if ((typeof value === 'number' || !isNaN(Number(value))) && value !== "") {
    const num = Number(value);
    
    // Handle zero values
    if (num === 0) return '0';
    
    // Handle currency values
    if (shouldBeCurrency || Math.abs(num) >= 100) {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    }
    
    // Format percentages or ratios
    else if (key.toLowerCase().includes('percentage') || 
             key.toLowerCase().includes('ratio') || 
             key.toLowerCase().includes('margin') || 
             (num !== 0 && Math.abs(num) <= 100)) {
      const formatted = new Intl.NumberFormat('en-GB', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      }).format(num);
      
      // Add % symbol for percentages
      if (key.toLowerCase().includes('percentage') || 
          key.toLowerCase().includes('margin')) {
        return formatted + '%';
      }
      return formatted;
    }
    
    // Default number format for other cases
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Default for all other values
  return String(value || '');
}

// Helper function to render comprehensive credit score information
function renderCreditInformation(
  page: PDFPage,
  yPosition: number,
  width: number,
  creditInfo: any,
  fonts: {[key: string]: PDFFont},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): { page: PDFPage, yPosition: number } {
  let currentY = yPosition;
  let currentPage = page;
  
  currentPage.drawText('Credit Information', {
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

  // Try to access nested data structures
  let actualCreditData = creditInfo;
  
  // Handle normalized data structure (from normalizeCreditScoreData)
  if (creditInfo && creditInfo.details && typeof creditInfo.details === 'object') {
    // Use both the normalized data at the top level and the original data in details
    actualCreditData = {
      ...creditInfo,  // normalized data (score, risk_level, last_updated)
      ...creditInfo.details  // original detailed data
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
  for (const field of scoreFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      const creditScore = actualCreditData[field];
      currentPage.drawText(`Credit Score: ${creditScore}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
      hasDisplayedCreditData = true;
      break;
    }
  }

  // Display credit rating/risk level if available
  const ratingFields = ['risk_level', 'rating', 'credit_rating', 'creditRating', 'grade', 'risk_rating', 'riskLevel', 'status'];
  for (const field of ratingFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      const rating = actualCreditData[field];
      currentPage.drawText(`Risk Level: ${rating}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
      hasDisplayedCreditData = true;
      break;
    }
  }

  // Display probability of default if available
  const probabilityFields = ['probability_of_default', 'default_probability', 'defaultProbability', 'risk_percentage', 'pd'];
  for (const field of probabilityFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      const probability = actualCreditData[field];
      const displayProb = typeof probability === 'number' && probability < 1 ? 
        `${(probability * 100).toFixed(1)}%` : `${probability}%`;
      currentPage.drawText(`Probability of Default: ${displayProb}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
      hasDisplayedCreditData = true;
      break;
    }
  }

  // Display credit limit if available
  const limitFields = ['credit_limit', 'creditLimit', 'max_credit', 'available_credit'];
  for (const field of limitFields) {
    if (actualCreditData[field] !== undefined && actualCreditData[field] !== null && actualCreditData[field] !== '') {
      const limit = actualCreditData[field];
      currentPage.drawText(`Credit Limit: ${formatCurrency(limit)}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
      hasDisplayedCreditData = true;
      break;
    }
  }

  // Display additional credit metrics if available
  const additionalFields = [
    { key: 'payment_score', label: 'Payment Score' },
    { key: 'financial_strength', label: 'Financial Strength' },
    { key: 'risk_category', label: 'Risk Category' },
    { key: 'sector_risk', label: 'Sector Risk' },
    { key: 'years_on_file', label: 'Years on File' },
    { key: 'last_updated', label: 'Last Updated', isDate: true }
  ];

  for (const { key, label, isDate } of additionalFields) {
    if (actualCreditData[key] !== undefined && actualCreditData[key] !== null && actualCreditData[key] !== '') {
      const value = isDate ? formatDate(actualCreditData[key]) : actualCreditData[key];
      currentPage.drawText(`${label}: ${value}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
      hasDisplayedCreditData = true;
    }
  }

  // Show credit history summary if available
  if (actualCreditData.payment_history || actualCreditData.paymentHistory) {
    const paymentHistory = actualCreditData.payment_history || actualCreditData.paymentHistory;
    
    currentPage.drawText('Payment History Summary:', {
      x: 50,
      y: currentY,
      size: 11,
      font: fonts.helveticaBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 15;

    if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
      // Show recent payment behavior
      const recentPayments = paymentHistory.slice(0, 5);
      for (const payment of recentPayments) {
        if (payment.period && payment.status) {
          currentPage.drawText(`• ${payment.period}: ${payment.status}`, {
            x: 70,
            y: currentY,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          currentY -= 12;
        }
      }
      hasDisplayedCreditData = true;
    } else if (typeof paymentHistory === 'object') {
      // Show payment history metrics
      Object.entries(paymentHistory).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          currentPage.drawText(`• ${label}: ${value}`, {
            x: 70,
            y: currentY,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          currentY -= 12;
        }
      });
      hasDisplayedCreditData = true;
    }
  }

  if (!hasDisplayedCreditData) {
    currentPage.drawText('Credit information is available for this business', {
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

function renderHMRCData(
  page: PDFPage,
  yPosition: number,
  width: number,
  hmrcData: any,
  fonts: {[key: string]: PDFFont},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): { page: PDFPage, yPosition: number } {
  let currentY = yPosition - 20;
  let currentPage = page;
  
  currentPage.drawText('HMRC Status', {
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

  if (hmrcData && typeof hmrcData === 'object') {
    // Check if we need a new page
    if (currentY < 150) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
    }

    let hasRenderedContent = false;

    // Check for overall HMRC status
    if (hmrcData.isUpToDate !== undefined) {
      const statusText = hmrcData.isUpToDate === 'yes' ? 'Up to Date' : 'Outstanding Liabilities';
      currentPage.drawText(`Tax Status: ${statusText}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: hmrcData.isUpToDate === 'yes' ? rgb(0, 0.7, 0) : rgb(0.7, 0, 0),
      });
      currentY -= 20;
      hasRenderedContent = true;
    }

    // VAT Details
    if (hmrcData.vatDetails && typeof hmrcData.vatDetails === 'object') {
      const vatDetails = hmrcData.vatDetails;
      currentPage.drawText('VAT Status:', {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;

      if (vatDetails.amount) {
        currentPage.drawText(`  Outstanding Amount: ${formatCurrency(vatDetails.amount)}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (vatDetails.timeToPay) {
        currentPage.drawText(`  Expected Payment: ${vatDetails.timeToPay}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (vatDetails.details) {
        currentPage.drawText(`  Details: ${vatDetails.details}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      currentY -= 10;
      hasRenderedContent = true;
    }

    // Corporation Tax Details
    if (hmrcData.corpTaxDetails && typeof hmrcData.corpTaxDetails === 'object') {
      const corpTaxDetails = hmrcData.corpTaxDetails;
      currentPage.drawText('Corporation Tax Status:', {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;

      if (corpTaxDetails.amount) {
        currentPage.drawText(`  Outstanding Amount: ${formatCurrency(corpTaxDetails.amount)}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (corpTaxDetails.timeToPay) {
        currentPage.drawText(`  Expected Payment: ${corpTaxDetails.timeToPay}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (corpTaxDetails.details) {
        currentPage.drawText(`  Details: ${corpTaxDetails.details}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      currentY -= 10;
      hasRenderedContent = true;
    }

    // PAYE Details
    if (hmrcData.payeDetails && typeof hmrcData.payeDetails === 'object') {
      const payeDetails = hmrcData.payeDetails;
      currentPage.drawText('PAYE Status:', {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;

      if (payeDetails.amount) {
        currentPage.drawText(`  Outstanding Amount: ${formatCurrency(payeDetails.amount)}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (payeDetails.timeToPay) {
        currentPage.drawText(`  Expected Payment: ${payeDetails.timeToPay}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      if (payeDetails.details) {
        currentPage.drawText(`  Details: ${payeDetails.details}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 12;
      }

      currentY -= 10;
      hasRenderedContent = true;
    }

    // Look for VAT return data (comprehensive HMRC data)
    if (hmrcData.vatReturns || hmrcData.vat_returns) {
      const vatData = hmrcData.vatReturns || hmrcData.vat_returns;
      currentPage.drawText('VAT Returns', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      if (Array.isArray(vatData) && vatData.length > 0) {
        currentPage.drawText(`Total VAT Returns: ${vatData.length}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;

        // Create table for VAT returns
        const vatColumns = ['periodKey', 'vatDueSales', 'vatDueAcquisitions', 'totalValueSalesExVAT', 'totalValuePurchasesExVAT'];
        const vatHeaders = ['Period', 'VAT Due Sales', 'VAT Due Acquisitions', 'Sales (Ex VAT)', 'Purchases (Ex VAT)'];
        const columnWidth = (width - 100) / vatColumns.length;

        // Table header
        currentY -= 5;
        vatHeaders.forEach((header, index) => {
          currentPage.drawText(header, {
            x: 50 + (index * columnWidth),
            y: currentY,
            size: 9,
            font: fonts.helveticaBold,
            color: rgb(0, 0, 0),
          });
        });

        currentY -= 5;
        currentPage.drawLine({
          start: { x: 50, y: currentY },
          end: { x: width - 50, y: currentY },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        currentY -= 10;

        // Show up to 10 most recent VAT returns
        const recentVATReturns = vatData.slice(0, 10);
        for (const vatReturn of recentVATReturns) {
          if (currentY < 80) {
            currentPage = pdfDoc.addPage([595.276, 841.890]);
            currentY = 750;
          }

          vatColumns.forEach((col, index) => {
            let value = vatReturn[col];
            if (col !== 'periodKey' && value) {
              value = formatCurrency(value);
            }
            
            currentPage.drawText(value || 'N/A', {
              x: 50 + (index * columnWidth),
              y: currentY,
              size: 8,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
          });
          currentY -= 12;
        }

        if (vatData.length > 10) {
          currentY -= 5;
          currentPage.drawText(`... and ${vatData.length - 10} more VAT returns`, {
            x: 70,
            y: currentY,
            size: 9,
            font: fonts.helvetica,
            color: rgb(0.5, 0.5, 0.5),
          });
          currentY -= 15;
        }

        currentY -= 15;
        hasRenderedContent = true;
      }
    }

    // Look for Corporation Tax data
    if (hmrcData.corporationTax || hmrcData.corporation_tax) {
      const ctData = hmrcData.corporationTax || hmrcData.corporation_tax;
      
      if (currentY < 100) {
        currentPage = pdfDoc.addPage([595.276, 841.890]);
        currentY = 750;
      }

      currentPage.drawText('Corporation Tax Data', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      if (Array.isArray(ctData) && ctData.length > 0) {
        currentPage.drawText(`Corporation Tax Records: ${ctData.length}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;

        // Show recent CT data summary
        const recentCT = ctData.slice(0, 5);
        for (const ct of recentCT) {
          if (ct.period) {
            currentPage.drawText(`• Period: ${ct.period}`, {
              x: 90,
              y: currentY,
              size: 9,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
            currentY -= 12;
          }
          if (ct.taxDue) {
            currentPage.drawText(`  Tax Due: ${formatCurrency(ct.taxDue)}`, {
              x: 110,
              y: currentY,
              size: 9,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
            currentY -= 12;
          }
        }
      } else if (typeof ctData === 'object') {
        currentPage.drawText('Corporation Tax data available', {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;
      }

      currentY -= 15;
      hasRenderedContent = true;
    }

    // Look for PAYE data
    if (hmrcData.paye || hmrcData.payroll) {
      const payeData = hmrcData.paye || hmrcData.payroll;
      
      if (currentY < 100) {
        currentPage = pdfDoc.addPage([595.276, 841.890]);
        currentY = 750;
      }

      currentPage.drawText('PAYE Data', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      if (Array.isArray(payeData) && payeData.length > 0) {
        currentPage.drawText(`PAYE Records: ${payeData.length}`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;
      } else if (typeof payeData === 'object') {
        currentPage.drawText('PAYE data available', {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;
      }

      currentY -= 15;
      hasRenderedContent = true;
    }

    // Show any other HMRC data categories
    const processedCategories = ['vatReturns', 'vat_returns', 'corporationTax', 'corporation_tax', 'paye', 'payroll', 'isUpToDate', 'vatDetails', 'corpTaxDetails', 'payeDetails', 'updatedAt'];
    const otherCategories = Object.keys(hmrcData).filter(key => !processedCategories.includes(key));
    
    if (otherCategories.length > 0) {
      currentPage.drawText('Additional HMRC Information:', {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;

      for (const category of otherCategories) {
        const categoryData = hmrcData[category];
        if (categoryData) {
          const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
          currentPage.drawText(`• ${categoryTitle}: Available`, {
            x: 70,
            y: currentY,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          currentY -= 15;
        }
      }
      hasRenderedContent = true;
    }

    if (!hasRenderedContent) {
      currentPage.drawText('HMRC tax status and compliance information is available', {
        x: 50,
        y: currentY,
        size: 10,
        font: fonts.helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 20;
    }
  } else {
    currentPage.drawText('HMRC data is available for this business', {
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

// Helper function to render comprehensive current funding information
function renderCurrentFunding(
  page: PDFPage,
  yPosition: number,
  width: number,
  fundingData: any,
  fonts: {[key: string]: PDFFont},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): { page: PDFPage, yPosition: number } {
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
      if (fundingData.hasCurrentFunding === 'no') {
        currentPage.drawText('Current Funding Status: No current funding arrangements', {
          x: 50,
          y: currentY,
          size: 11,
          font: fonts.helvetica,
          color: rgb(0, 0.7, 0),
        });
        currentY -= 20;
        return { page: currentPage, yPosition: currentY };
      } else if (fundingData.hasCurrentFunding === 'yes' && fundingData.fundingDetails) {
        const fundingDetails = fundingData.fundingDetails;
        if (Array.isArray(fundingDetails) && fundingDetails.length > 0) {
          currentPage.drawText(`Current Funding Arrangements: ${fundingDetails.length}`, {
            x: 50,
            y: currentY,
            size: 11,
            font: fonts.helveticaBold,
            color: rgb(0, 0, 0),
          });
          currentY -= 20;

          // Create table for funding details
          const fundingColumns = ['provider', 'product', 'terms', 'currentBalance', 'expiryDate'];
          const fundingHeaders = ['Provider', 'Product', 'Terms', 'Current Balance', 'Expiry Date'];
          const columnWidth = (width - 100) / fundingColumns.length;

          // Table header
          currentY -= 5;
          fundingHeaders.forEach((header, index) => {
            currentPage.drawText(header, {
              x: 50 + (index * columnWidth),
              y: currentY,
              size: 9,
              font: fonts.helveticaBold,
              color: rgb(0, 0, 0),
            });
          });

          currentY -= 5;
          currentPage.drawLine({
            start: { x: 50, y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
          });
          currentY -= 10;

          // Show all funding arrangements
          for (let i = 0; i < fundingDetails.length; i++) {
            const funding = fundingDetails[i];
            
            // Check if we need a new page
            if (currentY < 80) {
              currentPage = pdfDoc.addPage([595.276, 841.890]);
              currentY = 750;
              
              // Redraw header on new page
              fundingHeaders.forEach((header, index) => {
                currentPage.drawText(header, {
                  x: 50 + (index * columnWidth),
                  y: currentY,
                  size: 9,
                  font: fonts.helveticaBold,
                  color: rgb(0, 0, 0),
                });
              });
              currentY -= 5;
              currentPage.drawLine({
                start: { x: 50, y: currentY },
                end: { x: width - 50, y: currentY },
                thickness: 1,
                color: rgb(0.8, 0.8, 0.8),
              });
              currentY -= 10;
            }

            fundingColumns.forEach((col, index) => {
              let value = funding[col] || 'Not specified';
              
              // Format specific columns
              if (col === 'currentBalance' && value !== 'Not specified') {
                value = formatCurrency(value);
              } else if (col === 'expiryDate' && value !== 'Not specified') {
                value = formatDate(value);
              }
              
              // Truncate long text
              const maxChars = Math.floor(columnWidth / 6);
              const truncatedValue = value.length > maxChars ? 
                value.substring(0, maxChars - 3) + '...' : value;
              
              currentPage.drawText(truncatedValue, {
                x: 50 + (index * columnWidth),
                y: currentY,
                size: 8,
                font: fonts.helvetica,
                color: rgb(0, 0, 0),
              });
            });

            currentY -= 12;
          }

          currentY -= 15;
          return { page: currentPage, yPosition: currentY };
        }
      }
    }

    // Handle direct array of funding arrangements
    if (Array.isArray(fundingData) && fundingData.length > 0) {
      currentPage.drawText(`Total Current Funding Arrangements: ${fundingData.length}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: fonts.helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;

      // Calculate totals if amount field exists
      const totalAmount = fundingData.reduce((sum, funding) => {
        const amount = typeof funding.amount === 'number' ? funding.amount : 
                      (typeof funding.amount === 'string' ? parseFloat(funding.amount) || 0 : 0);
        return sum + amount;
      }, 0);

      if (totalAmount > 0) {
        currentPage.drawText(`Total Current Funding: ${formatCurrency(totalAmount)}`, {
          x: 50,
          y: currentY,
          size: 11,
          font: fonts.helveticaBold,
          color: rgb(0, 0, 0),
        });
        currentY -= 25;
      }

      // Create table for funding details
      const fundingColumns = ['type', 'amount', 'status', 'provider', 'startDate', 'endDate'];
      const fundingHeaders = ['Type', 'Amount', 'Status', 'Provider', 'Start Date', 'End Date'];
      const columnWidth = (width - 100) / fundingColumns.length;

      // Table header
      currentY -= 5;
      fundingHeaders.forEach((header, index) => {
        currentPage.drawText(header, {
          x: 50 + (index * columnWidth),
          y: currentY,
          size: 9,
          font: fonts.helveticaBold,
          color: rgb(0, 0, 0),
        });
      });

      currentY -= 5;
      currentPage.drawLine({
        start: { x: 50, y: currentY },
        end: { x: width - 50, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 10;

      // Show all funding arrangements (up to 15 per page)
      const itemsPerPage = 15;
      for (let i = 0; i < fundingData.length; i++) {
        const funding = fundingData[i];
        
        // Check if we need a new page
        if (i > 0 && i % itemsPerPage === 0) {
          currentPage = pdfDoc.addPage([595.276, 841.890]);
          currentY = 750;
          
          // Redraw header on new page
          fundingHeaders.forEach((header, index) => {
            currentPage.drawText(header, {
              x: 50 + (index * columnWidth),
              y: currentY,
              size: 9,
              font: fonts.helveticaBold,
              color: rgb(0, 0, 0),
            });
          });
          currentY -= 5;
          currentPage.drawLine({
            start: { x: 50, y: currentY },
            end: { x: width - 50, y: currentY },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
          });
          currentY -= 10;
        }

        fundingColumns.forEach((col, index) => {
          let value = funding[col];
          
          // Format specific columns
          if (col === 'amount' && value) {
            value = formatCurrency(value);
          } else if ((col === 'startDate' || col === 'endDate') && value) {
            value = formatDate(value);
          } else if (col === 'type' && value) {
            // Capitalize type
            value = value.charAt(0).toUpperCase() + value.slice(1);
          }
          
          // Truncate long text
          const displayValue = value ? value.toString() : 'N/A';
          const maxChars = Math.floor(columnWidth / 6);
          const truncatedValue = displayValue.length > maxChars ? 
            displayValue.substring(0, maxChars - 3) + '...' : displayValue;
          
          currentPage.drawText(truncatedValue, {
            x: 50 + (index * columnWidth),
            y: currentY,
            size: 8,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
        });

        currentY -= 12;
      }

      currentY -= 15;

      // Summary by type if multiple funding sources
      if (fundingData.length > 1) {
        const fundingByType: { [key: string]: { count: number, total: number } } = {};
        
        fundingData.forEach(funding => {
          const type = funding.type || 'Unknown';
          const amount = typeof funding.amount === 'number' ? funding.amount : 
                        (typeof funding.amount === 'string' ? parseFloat(funding.amount) || 0 : 0);
          
          if (!fundingByType[type]) {
            fundingByType[type] = { count: 0, total: 0 };
          }
          fundingByType[type].count += 1;
          fundingByType[type].total += amount;
        });

        currentPage.drawText('Summary by Funding Type:', {
          x: 50,
          y: currentY,
          size: 11,
          font: fonts.helveticaBold,
          color: rgb(0, 0, 0),
        });
        currentY -= 15;

        Object.entries(fundingByType).forEach(([type, data]) => {
          const typeDisplay = type.charAt(0).toUpperCase() + type.slice(1);
          currentPage.drawText(`• ${typeDisplay}: ${data.count} arrangement(s), Total: ${formatCurrency(data.total)}`, {
            x: 70,
            y: currentY,
            size: 10,
            font: fonts.helvetica,
            color: rgb(0, 0, 0),
          });
          currentY -= 12;
        });
      }
    } else {
      // Handle case where funding data exists but is not in expected format
      currentPage.drawText('Current funding information is available for this business', {
        x: 50,
        y: currentY,
        size: 10,
        font: fonts.helvetica,
        color: rgb(0.5, 0.5, 0.5),
      });
      currentY -= 20;
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

// Helper function to render detailed financial data with tables
function renderFinancialData(
  page: PDFPage,
  yPosition: number,
  width: number,
  financialData: any,
  fonts: {[key: string]: PDFFont},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): { page: PDFPage, yPosition: number } {
  let currentY = yPosition - 20;
  let currentPage = page;
  
  currentPage.drawText('Financial Data', {
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

  if (financialData && typeof financialData === 'object') {
    const financialCategories = Object.keys(financialData);
    
    for (const categoryKey of financialCategories) {
      // Skip metadata fields
      if (['pages', 'fileName', 'documentType', 'currency', 'period', 'companyName', 'summary'].includes(categoryKey)) {
        continue;
      }

      const categoryData = financialData[categoryKey];
      if (!categoryData || (typeof categoryData === 'object' && Object.keys(categoryData).length === 0)) {
        continue;
      }

      // Check if we need a new page
      if (currentY < 150) {
        currentPage = pdfDoc.addPage([595.276, 841.890]);
        currentY = 750;
      }

      // Category header
      const categoryTitle = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).replace(/([A-Z])/g, ' $1');
      currentPage.drawText(categoryTitle, {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 15;

      // Extract line items for this category
      const lineItems = extractLineItems(categoryData);
      
      if (lineItems && lineItems.length > 0) {
        // Get columns and calculate widths
        const columns = getFinancialColumns(lineItems);
        const columnWidths = calculateColumnWidths(columns, lineItems, width);
        
        // Check if we have enough space for the table header
        if (currentY < 100) {
          currentPage = pdfDoc.addPage([595.276, 841.890]);
          currentY = 750;
        }

        // Draw table header
        currentY -= 5;
        columns.forEach((col, index) => {
          const xPos = getColumnXPosition(index, columnWidths);
          const headerText = formatColumnHeader(col);
          
          currentPage.drawText(headerText, {
            x: xPos,
            y: currentY,
            size: 9,
            font: fonts.helveticaBold,
            color: rgb(0, 0, 0),
          });
        });

        // Draw header underline
        currentY -= 5;
        const tableStartX = 50;
        const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);
        currentPage.drawLine({
          start: { x: tableStartX, y: currentY },
          end: { x: tableStartX + tableWidth, y: currentY },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        currentY -= 10;

        // Draw table rows
        const maxRowsPerPage = Math.floor((currentY - 50) / 15);
        let currentRowIndex = 0;
        
        for (const item of lineItems) {
          // Check if we need a new page
          if (currentRowIndex >= maxRowsPerPage || currentY < 80) {
            currentPage = pdfDoc.addPage([595.276, 841.890]);
            currentY = 750;
            currentRowIndex = 0;
            
            // Redraw header on new page
            columns.forEach((col, index) => {
              const xPos = getColumnXPosition(index, columnWidths);
              const headerText = formatColumnHeader(col);
              
              currentPage.drawText(headerText, {
                x: xPos,
                y: currentY,
                size: 9,
                font: fonts.helveticaBold,
                color: rgb(0, 0, 0),
              });
            });
            currentY -= 5;
            currentPage.drawLine({
              start: { x: tableStartX, y: currentY },
              end: { x: tableStartX + tableWidth, y: currentY },
              thickness: 1,
              color: rgb(0.8, 0.8, 0.8),
            });
            currentY -= 10;
          }

          // Draw row data
          columns.forEach((col, index) => {
            const xPos = getColumnXPosition(index, columnWidths);
            const cellValue = item[col];
            let displayValue = formatFinancialValue(cellValue, col);
            
            // Truncate long text to fit column width
            const maxChars = Math.floor(columnWidths[index] / 6);
            if (displayValue && displayValue.length > maxChars) {
              displayValue = displayValue.substring(0, maxChars - 3) + '...';
            }
            
            currentPage.drawText(displayValue || '', {
              x: xPos,
              y: currentY,
              size: 8,
              font: fonts.helvetica,
              color: rgb(0, 0, 0),
            });
          });

          currentY -= 15;
          currentRowIndex++;
        }

        currentY -= 10; // Space after table
      } else {
        // Show summary if no detailed line items
        currentPage.drawText(`${categoryTitle} data is available`, {
          x: 70,
          y: currentY,
          size: 10,
          font: fonts.helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 20;
      }
    }
  } else {
    currentPage.drawText('Financial data is available for this business', {
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
  
  page.drawText('Business Funding Application - PREVIEW COPY', {
    x: 50,
    y: yPosition - 55,
    size: 16,
    font: helveticaFont,
    color: rgb(1, 1, 1),
  });
  
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

  // Business Information Section - Limited Details for Unmatched Lenders
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

  // Show comprehensive business data for unmatched (hiding only sensitive identifiers)
  const industry = business.industry_sector || 'N/A';
  const yearsTrading = business.years_trading || 'N/A';
  const annualRevenue = business.annual_revenue ? formatCurrency(business.annual_revenue) : 'N/A';
  const numEmployees = (business as any).num_employees || (business as any).numberOfEmployees || 'N/A';
  const legalStructure = (business as any).legal_structure || business.business_type || 'N/A';
  
  // Show business name as anonymized for unmatched
  page.drawText('Company Name: [Confidential - Available upon matching]', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  yPosition -= 20;

  // Show registration number as anonymized for unmatched
  page.drawText('Registration Number: [Confidential - Available upon matching]', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
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

  // Show address as anonymized for unmatched
  page.drawText('Address: [Confidential - Available upon matching]', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  yPosition -= 30;

  // Credit Score Information (show comprehensive data for unmatched)
  const creditData = applicationData.creditScore || 
                     business.credit_info || 
                     (business as any).credit_score ||
                     (business as any).creditScore;
  
  if (creditData) {
    const result = renderCreditInformation(page, yPosition, width, creditData, fonts, colors, pdfDoc);
    page = result.page;
    yPosition = result.yPosition;
  }

  // HMRC Data (show comprehensive data for unmatched)
  // Check multiple possible locations for HMRC data
  const hmrcData = business.hmrcStatus || 
                   (business as any).hmrcData || 
                   financialData?.hmrcData || 
                   financialData?.hmrc || 
                   (business as any).hmrc_status ||
                   (business as any).hmrc_data;
  
  if (hmrcData) {
    const result = renderHMRCData(page, yPosition, width, hmrcData, fonts, colors, pdfDoc);
    page = result.page;
    yPosition = result.yPosition;
  }

  // Current Funding (show comprehensive data for unmatched)
  const currentFundingData = business.currentFunding || 
                            (business as any).current_funding ||
                            (business as any).funding ||
                            (applicationData as any).currentFunding;
  
  if (currentFundingData) {
    const result = renderCurrentFunding(page, yPosition, width, currentFundingData, fonts, colors, pdfDoc);
    page = result.page;
    yPosition = result.yPosition;
  }

  // Financial Data (show comprehensive data for unmatched)
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

  // Footer note for unmatched
  yPosition -= 30;
  page.drawText('This is a preview document for unmatched lenders.', {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaBoldFont,
    color: primaryColor,
  });
  yPosition -= 15;
  
  page.drawText('Complete business details and financial analysis will be available upon successful matching.', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Return the PDF as bytes
  return await pdfDoc.save();
}

// Helper function to generate PDF filename for unmatched
export function generateUnmatchedPdfFilename(application: Application): string {
  const applicationNumber = application.application_number || 'Unknown';
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `Application_Preview_${applicationNumber}_${date}.pdf`;
}

// Helper function to download PDF blob
export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  URL.revokeObjectURL(url);
}
