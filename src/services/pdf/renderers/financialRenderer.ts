import { PDFPage, PDFDocument, rgb } from 'pdf-lib';
import { RenderResult } from '../types';

// Financial document type mappings
const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  'profitAndLoss': 'Profit & Loss Statement',
  'balanceSheet': 'Balance Sheet', 
  'trialBalance': 'Trial Balance',
  'agedPayables': 'Aged Payables Report',
  'agedReceivables': 'Aged Receivables Report',
  'signedAccounts': 'Signed Accounts',
  'managementAccounts': 'Management Accounts',
  'agedDebtors': 'Aged Debtors',
  'agedCreditors': 'Aged Creditors'
};

// Table styling constants
const TABLE_STYLES = {
  rowHeight: 20,
  headerHeight: 25,
  fontSize: 9,
  headerFontSize: 10,
  titleFontSize: 14,
  padding: 8,
  minColumnWidth: 40,
  maxColumnWidth: 200,
  currencyColumnWidth: 80,
  descriptionColumnWidth: 150
};

// Page dimensions
const PAGE_DIMENSIONS = {
  portrait: { width: 595.276, height: 841.890 },
  landscape: { width: 841.890, height: 595.276 }
};

/**
 * Enhanced financial data renderer - matches the web business details page exactly
 * Renders complete financial data in professional tables with proper pagination
 */
export function renderFinancialData(
  page: PDFPage,
  yPosition: number,
  width: number,
  financialData: any,
  fonts: {[key: string]: any},
  colors: {[key: string]: any},
  pdfDoc: PDFDocument
): RenderResult {
  let currentY = yPosition - 20;
  let currentPage = page;
  
  // Main title with professional styling
  currentPage.drawText('Financial Documents', {
    x: 50,
    y: currentY,
    size: 18,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
  
  currentY -= 10;
  currentPage.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 2,
    color: colors.accentColor,
  });
  currentY -= 30;

  if (!financialData || typeof financialData !== 'object') {
    currentPage.drawText('No financial data available', {
      x: 50,
      y: currentY,
      size: 12,
      font: fonts.helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    return { page: currentPage, yPosition: currentY - 20 };
  }

  // Process each financial document type on separate pages
  const documentKeys = Object.keys(financialData).filter(key => 
    financialData[key] && typeof financialData[key] === 'object'
  );

  for (let docIndex = 0; docIndex < documentKeys.length; docIndex++) {
    const docKey = documentKeys[docIndex];
    const documentData = financialData[docKey];
    
    // Skip if no actual data
    if (!documentData || !hasValidData(documentData)) continue;

    // Determine if this document needs landscape orientation
    const needsLandscape = shouldUseLandscapeMode(documentData);
    
    // Create new page with appropriate orientation
    if (docIndex > 0 || needsLandscape) {
      const dimensions = needsLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
      currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
      currentY = needsLandscape ? 520 : 780;
    }

    // Update width based on page orientation
    const pageWidth = needsLandscape ? PAGE_DIMENSIONS.landscape.width : PAGE_DIMENSIONS.portrait.width;

    // Render the document with full data tables
    const result = renderFinancialDocument(
      currentPage, 
      currentY, 
      pageWidth, 
      docKey, 
      documentData, 
      fonts, 
      colors, 
      pdfDoc,
      needsLandscape
    );
    
    currentPage = result.page;
    currentY = result.yPosition;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Check if document data contains valid financial information
 */
function hasValidData(documentData: any): boolean {
  if (!documentData.data) return false;
  
  const data = documentData.data;
  
  // Check for line items
  if (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) {
    return true;
  }
  
  // Check for accounts (trial balance)
  if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
    return true;
  }
  
  // Check for suppliers/customers (aged reports)
  if ((data.suppliers && Array.isArray(data.suppliers) && data.suppliers.length > 0) ||
      (data.customers && Array.isArray(data.customers) && data.customers.length > 0)) {
    return true;
  }
  
  // Check for nested P&L or Balance Sheet data
  if (data.profitAndLoss?.lineItems || data.balanceSheet?.lineItems || data.trialBalance?.accounts) {
    return true;
  }
  
  return false;
}

/**
 * Determine if a document should be rendered in landscape mode
 */
function shouldUseLandscapeMode(documentData: any): boolean {
  if (!documentData.data) return false;
  
  const data = documentData.data;
  
  // Check for aged reports with many columns (typically have many time periods)
  if (data.suppliers || data.customers || data.agedPayables || data.agedReceivables) {
    return true; // Aged reports typically have many columns
  }
  
  // Check if document has multiple financial sections (P&L + Balance Sheet)
  const hasMultipleSections = [
    data.profitAndLoss,
    data.balanceSheet,
    data.trialBalance
  ].filter(Boolean).length > 1;
  
  if (hasMultipleSections) {
    return true; // Use landscape for documents with multiple sections
  }
  
  // Check line items for many columns
  if (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) {
    const firstItem = data.lineItems[0];
    const columnCount = Object.keys(firstItem).length;
    return columnCount > 6; // Use landscape if more than 6 columns
  }
  
  // Check accounts for trial balance
  if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
    const firstAccount = data.accounts[0];
    const columnCount = Object.keys(firstAccount).length;
    return columnCount > 4; // Trial balance usually has fewer columns
  }
  
  // Check nested structures for column count
  if (data.profitAndLoss?.lineItems) {
    const firstItem = data.profitAndLoss.lineItems[0];
    if (firstItem) {
      const columnCount = Object.keys(firstItem).length;
      return columnCount > 6;
    }
  }
  
  if (data.balanceSheet?.lineItems) {
    const firstItem = data.balanceSheet.lineItems[0];
    if (firstItem) {
      const columnCount = Object.keys(firstItem).length;
      return columnCount > 6;
    }
  }
  
  return false;
}

/**
 * Render a single financial document with complete data tables
 */
function renderFinancialDocument(
  page: PDFPage,
  yPosition: number,
  width: number,
  documentKey: string,
  documentData: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;
  
  const data = documentData.data;
  const documentName = DOCUMENT_TYPE_NAMES[documentKey] || formatDocumentName(documentKey);
  
  // Document header
  currentPage.drawText(documentName, {
    x: 50,
    y: currentY,
    size: 14,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
  currentY -= 25;

  // Document metadata - improved date handling
  const displayDate = getFormattedDate(documentData);
  
  // Debug logging to understand date format (can be removed later)
  
  
  if (displayDate) {
    currentPage.drawText(`Last updated: ${displayDate}`, {
      x: 50,
      y: currentY,
      size: 9,
      font: fonts.helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 20;
  }

  // Enhanced rendering to handle multiple financial tables within a single document
  // First, check if this document contains multiple financial sections
  const hasMultipleSections = [
    data.profitAndLoss,
    data.balanceSheet,
    data.trialBalance,
    data.agedPayables || data.suppliers,
    data.agedReceivables || data.customers
  ].filter(Boolean).length > 1;

  let sectionCount = 0;
  const addSpacingBetweenSections = () => {
    if (sectionCount > 0) {
      currentY -= 30; // Add spacing between sections
      if (currentY < 150) {
        // Start new page if running out of space
        const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
        currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
        currentY = isLandscape ? 520 : 780;
      }
    }
    sectionCount++;
  };

  // Render Profit & Loss if present
  if (data.profitAndLoss) {
    addSpacingBetweenSections();
    
    // Add section title if multiple sections exist
    if (hasMultipleSections) {
      currentPage.drawText('Profit & Loss Statement', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 20;
    }
    
    const result = renderProfitAndLoss(currentPage, currentY, width, data.profitAndLoss, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // Render Balance Sheet if present
  if (data.balanceSheet) {
    addSpacingBetweenSections();
    
    // Add section title if multiple sections exist
    if (hasMultipleSections) {
      currentPage.drawText('Balance Sheet', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 20;
    }
    
    const result = renderBalanceSheet(currentPage, currentY, width, data.balanceSheet, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // Render Trial Balance if present
  if (data.trialBalance) {
    addSpacingBetweenSections();
    
    // Add section title if multiple sections exist
    if (hasMultipleSections) {
      currentPage.drawText('Trial Balance', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 20;
    }
    
    const result = renderTrialBalance(currentPage, currentY, width, data.trialBalance, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // Render Aged Payables if present
  if (data.agedPayables || data.suppliers) {
    addSpacingBetweenSections();
    
    // Add section title if multiple sections exist
    if (hasMultipleSections) {
      currentPage.drawText('Aged Payables', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 20;
    }
    
    const agedData = data.agedPayables || { suppliers: data.suppliers };
    const result = renderAgedReport(currentPage, currentY, width, agedData, 'Aged Payables', fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // Render Aged Receivables if present
  if (data.agedReceivables || data.customers) {
    addSpacingBetweenSections();
    
    // Add section title if multiple sections exist
    if (hasMultipleSections) {
      currentPage.drawText('Aged Receivables', {
        x: 50,
        y: currentY,
        size: 12,
        font: fonts.helveticaBold,
        color: colors.primaryColor,
      });
      currentY -= 20;
    }
    
    const agedData = data.agedReceivables || { customers: data.customers };
    const result = renderAgedReport(currentPage, currentY, width, agedData, 'Aged Receivables', fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // If no structured sections were found, fall back to generic rendering
  if (sectionCount === 0) {
    if (data.lineItems && Array.isArray(data.lineItems)) {
      // Generic line items structure
      const result = renderLineItemsTable(currentPage, currentY, width, data, fonts, colors, pdfDoc, isLandscape);
      currentPage = result.page;
      currentY = result.yPosition;
    } else {
      // Fallback for other data structures
      const result = renderGenericFinancialData(currentPage, currentY, width, data, fonts, colors, pdfDoc, isLandscape);
      currentPage = result.page;
      currentY = result.yPosition;
    }
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render Profit & Loss statement with line items
 */
function renderProfitAndLoss(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  // Company name and statement title
  if (data.companyName) {
    currentPage.drawText(data.companyName, {
      x: 50,
      y: currentY,
      size: 12,
      font: fonts.helveticaBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 20;
  }

  if (data.statementTitle) {
    currentPage.drawText(data.statementTitle, {
      x: 50,
      y: currentY,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 25;
  }

  if (data.lineItems && Array.isArray(data.lineItems)) {
    const result = renderFinancialTable(currentPage, currentY, width, data, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render Balance Sheet with assets, liabilities, and equity sections
 */
function renderBalanceSheet(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  return renderProfitAndLoss(page, yPosition, width, data, fonts, colors, pdfDoc, isLandscape);
}

/**
 * Render Trial Balance with accounts and debit/credit columns
 */
function renderTrialBalance(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  // Company name and statement title
  if (data.companyName) {
    currentPage.drawText(data.companyName, {
      x: 50,
      y: currentY,
      size: 12,
      font: fonts.helveticaBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 20;
  }

  if (data.statementTitle) {
    currentPage.drawText(data.statementTitle, {
      x: 50,
      y: currentY,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 25;
  }

  // Render accounts table
  if (data.accounts && Array.isArray(data.accounts)) {
    // Table headers
    const result = renderTrialBalanceTable(currentPage, currentY, width, data.accounts, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render Aged Reports (Payables/Receivables)
 */
function renderAgedReport(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  reportTitle: string,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  // Company name and statement title
  if (data.companyName) {
    currentPage.drawText(data.companyName, {
      x: 50,
      y: currentY,
      size: 12,
      font: fonts.helveticaBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 20;
  }

  if (data.statementTitle) {
    currentPage.drawText(data.statementTitle, {
      x: 50,
      y: currentY,
      size: 10,
      font: fonts.helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 25;
  }

  // Determine if this is suppliers or customers
  const itemsKey = data.suppliers ? 'suppliers' : data.customers ? 'customers' : null;
  
  if (itemsKey && Array.isArray(data[itemsKey])) {
    // For aged reports, use a proper table format instead of individual items
    const result = renderAgedDataTable(currentPage, currentY, width, data[itemsKey], itemsKey, fonts, colors, pdfDoc, isLandscape);
    currentPage = result.page;
    currentY = result.yPosition;
  }

  // Render totals if available
  if (data.totals && typeof data.totals === 'object') {
    currentY -= 20;
    
    currentPage.drawText('TOTALS', {
      x: 50,
      y: currentY,
      size: 10,
      font: fonts.helveticaBold,
      color: colors.primaryColor,
    });
    currentY -= 15;
    
    Object.entries(data.totals).forEach(([key, value]) => {
      if (currentY < 100) {
        const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
        currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
        currentY = isLandscape ? 520 : 780;
      }
      
      const displayKey = formatFieldName(key);
      const displayValue = formatCurrencyValue(value);
      
      currentPage.drawText(displayKey, {
        x: 70,
        y: currentY,
        size: 9,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      
      currentPage.drawText(displayValue, {
        x: width - 150,
        y: currentY,
        size: 9,
        font: fonts.helvetica,
        color: rgb(0, 0, 0),
      });
      
      currentY -= 15;
    });
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render aged data as a proper table (like the web view)
 */
function renderAgedDataTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  items: any[],
  itemType: string,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  if (!items || items.length === 0) {
    return { page: currentPage, yPosition: currentY };
  }

  // Convert aged items to table format
  const firstItem = items[0];
  const columns = Object.keys(firstItem).filter(key => 
    key !== 'supplierName' && key !== 'customerName'
  );

  // Add the item name column first
  const itemNameCol = itemType === 'suppliers' ? 'supplierName' : 'customerName';
  const tableColumns = ['item', ...columns];

  // Prepare table data with proper structure
  const tableData = items.map(item => {
    const row: any = {};
    row.item = item[itemNameCol] || item.supplierName || item.customerName || 'Unknown';
    
    // Copy all other fields
    columns.forEach(col => {
      row[col] = item[col];
    });
    
    return row;
  });

  // Create a data structure compatible with renderFinancialTable
  const agedTableData = {
    lineItems: tableData,
    columns: tableColumns
  };

  // Render as a proper financial table
  const result = renderFinancialTable(currentPage, currentY, width, agedTableData, fonts, colors, pdfDoc, isLandscape);
  
  return { page: result.page, yPosition: result.yPosition };
}

/**
 * Render generic line items table (P&L, Balance Sheet, etc.)
 */
function renderFinancialTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;
  
  const lineItems = data.lineItems;
  if (!lineItems || lineItems.length === 0) {
    return { page: currentPage, yPosition: currentY };
  }

  // Determine columns from first item or provided columns
  let columns = data.columns || [];
  if (columns.length === 0 && lineItems.length > 0) {
    const firstItem = lineItems[0];
    columns = Object.keys(firstItem).filter(key => 
      !['category', 'isHeader', 'isSubtotal', 'isTotal', 'calculated', 'level'].includes(key)
    );
  }

  // Ensure 'item' column is first
  if (columns.includes('item') && columns[0] !== 'item') {
    columns = ['item', ...columns.filter(col => col !== 'item')];
  } else if (!columns.includes('item')) {
    columns = ['item', ...columns];
  }

  // Calculate column widths with improved logic for landscape mode
  const tableWidth = width - 60; // Reduced margins
  const columnWidths = calculateDynamicColumnWidths(columns, tableWidth, isLandscape);

  // Use smaller fonts for landscape tables with many columns
  const dynamicFontSize = isLandscape && columns.length > 8 ? 6 : 7;

  // Render table headers
  const headerResult = renderTableHeaders(currentPage, currentY, columns, columnWidths, fonts, colors, dynamicFontSize);
  currentY = headerResult.yPosition;

  // Render rows with pagination
  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    
    // Check if we need a new page
    if (currentY < 120) {
      const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
      currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
      currentY = isLandscape ? 480 : 750;
      
      // Re-render headers on new page
      const newHeaderResult = renderTableHeaders(currentPage, currentY, columns, columnWidths, fonts, colors, dynamicFontSize);
      currentY = newHeaderResult.yPosition;
    }

    const rowResult = renderTableRow(currentPage, currentY, item, columns, columnWidths, fonts, i, dynamicFontSize);
    currentY = rowResult.yPosition;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render Trial Balance accounts table
 */
function renderTrialBalanceTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  accounts: any[],
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  const tableWidth = width - 60; // Use more page width
  const accountNameWidth = tableWidth * 0.70; // 70% for account name (increased)
  const amountWidth = tableWidth * 0.30; // 30% for amount

  // Headers
  currentPage.drawRectangle({
    x: 50,
    y: currentY - 15,
    width: tableWidth,
    height: 20,
    color: rgb(0.2, 0.2, 0.2),
  });

  const fontSize = isLandscape ? 7 : 8;

  currentPage.drawText('Account Name', {
    x: 55,
    y: currentY - 8,
    size: fontSize,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentPage.drawText('Debit / Credit', {
    x: 50 + accountNameWidth + amountWidth - 80,
    y: currentY - 8,
    size: fontSize,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 25;

  // Render accounts
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    if (currentY < 100) {
      const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
      currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
      currentY = isLandscape ? 520 : 750;
    }

    // Alternate row background
    if (i % 2 === 0) {
      currentPage.drawRectangle({
        x: 50,
        y: currentY - 12,
        width: tableWidth,
        height: 15,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    const accountName = account.accountName || '';
    const debitAmount = account.debit || 0;
    const creditAmount = account.credit || 0;
    const displayAmount = debitAmount !== 0 
      ? `${formatCurrencyValue(debitAmount)} Dr` 
      : `${formatCurrencyValue(creditAmount)} Cr`;

    // Improved text truncation - more generous character limit
    const charWidth = 4; // Approximate character width for size 7 font
    const maxAccountChars = Math.floor((accountNameWidth - 10) / charWidth);
    let truncatedName = accountName;
    if (accountName.length > maxAccountChars && maxAccountChars > 3) {
      truncatedName = accountName.substring(0, maxAccountChars - 3) + '...';
    }

    currentPage.drawText(truncatedName, {
      x: 55,
      y: currentY - 8,
      size: fontSize - 1,
      font: fonts.helvetica,
      color: rgb(0, 0, 0),
    });

    // Right align amount
    const amountWidth_text = displayAmount.length * 4;
    currentPage.drawText(displayAmount, {
      x: 50 + tableWidth - amountWidth_text - 10,
      y: currentY - 8,
      size: fontSize - 1,
      font: fonts.helvetica,
      color: rgb(0, 0, 0),
    });

    currentY -= 15;
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render aged items table (suppliers/customers)
 */
function renderAgedItemsTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  items: any[],
  itemType: string,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  currentPage.drawText(itemType.toUpperCase(), {
    x: 50,
    y: currentY,
    size: 10,
    font: fonts.helveticaBold,
    color: colors.primaryColor,
  });
  currentY -= 20;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (currentY < 150) {
      const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
      currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
      currentY = isLandscape ? 520 : 750;
    }

    // Item name header - use wider area
    const itemName = item.supplierName || item.customerName || `Item ${i + 1}`;
    currentPage.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: width - 60, // Use more page width
      height: 15,
      color: rgb(0.9, 0.9, 0.9),
    });

    currentPage.drawText(itemName, {
      x: 60,
      y: currentY - 8,
      size: 10,
      font: fonts.helveticaBold,
      color: rgb(0, 0, 0),
    });
    currentY -= 20;

    // Item details - improved layout
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'supplierName' && key !== 'customerName' && value !== null && value !== undefined) {
        if (currentY < 80) {
          const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
          currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
          currentY = isLandscape ? 520 : 750;
        }

        const displayKey = formatFieldName(key);
        const displayValue = formatCurrencyValue(value);

        currentPage.drawText(displayKey, {
          x: 80,
          y: currentY,
          size: 9,
          font: fonts.helvetica,
          color: rgb(0.3, 0.3, 0.3),
        });

        currentPage.drawText(displayValue, {
          x: width - 150, // Better positioning for values
          y: currentY,
          size: 9,
          font: fonts.helvetica,
          color: rgb(0, 0, 0),
        });

        currentY -= 15;
      }
    });

    currentY -= 10; // Space between items
  }

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render generic line items table
 */
function renderLineItemsTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  return renderFinancialTable(page, yPosition, width, data, fonts, colors, pdfDoc, isLandscape);
}

/**
 * Render any other financial data structure
 */
function renderGenericFinancialData(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument,
  isLandscape: boolean = false
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  // Extract key-value pairs from the data
  Object.entries(data).forEach(([key, value]) => {
    if (shouldSkipField(key) || value === null || value === undefined) return;

    if (currentY < 80) {
      const dimensions = isLandscape ? PAGE_DIMENSIONS.landscape : PAGE_DIMENSIONS.portrait;
      currentPage = pdfDoc.addPage([dimensions.width, dimensions.height]);
      currentY = isLandscape ? 520 : 750;
    }

    const displayKey = formatFieldName(key);
    const displayValue = formatFinancialValue(value, key);

    currentPage.drawText(displayKey, {
      x: 70,
      y: currentY,
      size: 9,
      font: fonts.helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });

    currentPage.drawText(displayValue, {
      x: width - 200,
      y: currentY,
      size: 9,
      font: fonts.helvetica,
      color: rgb(0, 0, 0),
    });

    currentY -= 15;
  });

  return { page: currentPage, yPosition: currentY };
}

/**
 * Render table headers
 */
function renderTableHeaders(
  page: PDFPage,
  yPosition: number,
  columns: string[],
  columnWidths: number[],
  fonts: any,
  colors: any,
  fontSize: number = 7
): RenderResult {
  let currentY = yPosition;

  // Header background
  const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  page.drawRectangle({
    x: 50,
    y: currentY - 15,
    width: totalTableWidth,
    height: 20,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Draw column separators for better visual alignment
  let separatorX = 50;
  columnWidths.forEach((width, index) => {
    if (index > 0) { // Don't draw separator before first column
      page.drawLine({
        start: { x: separatorX, y: currentY - 15 },
        end: { x: separatorX, y: currentY + 5 },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    separatorX += width;
  });

  // Header text - use consistent alignment system
  let xPosition = 50;
  columns.forEach((col, index) => {
    const headerText = formatColumnHeader(col);
    const isFinancialCol = isFinancialColumn(col);
    const isItemCol = col.toLowerCase() === 'item' || 
                     col.toLowerCase() === 'description' || 
                     col.toLowerCase() === 'account';
    
    // Use the same positioning logic as row data for perfect alignment
    const textX = calculateTextPosition(
      headerText, 
      xPosition, 
      columnWidths[index], 
      fontSize, 
      isFinancialCol, 
      isItemCol
    );
    
    page.drawText(headerText, {
      x: textX,
      y: currentY - 8,
      size: fontSize,
      font: fonts.helveticaBold,
      color: rgb(1, 1, 1),
    });
    
    xPosition += columnWidths[index];
  });

  return { page, yPosition: currentY - 25 };
}

/**
 * Render table row
 */
function renderTableRow(
  page: PDFPage,
  yPosition: number,
  item: any,
  columns: string[],
  columnWidths: number[],
  fonts: any,
  rowIndex: number,
  fontSize: number = 7
): RenderResult {
  let currentY = yPosition;

  // Determine row styling
  const isHeaderRow = item.isHeader || item.category === 'header';
  const isSubtotalRow = item.isSubtotal || item.category === 'subtotal';
  const isTotalRow = item.isTotal || item.category === 'total';

  // Row background
  const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  if (isHeaderRow) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: totalTableWidth,
      height: 15,
      color: rgb(0.85, 0.85, 0.85),
    });
  } else if (isTotalRow) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: totalTableWidth,
      height: 15,
      color: rgb(0.95, 0.95, 0.95),
    });
  } else if (rowIndex % 2 === 0) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: totalTableWidth,
      height: 15,
      color: rgb(0.98, 0.98, 0.98),
    });
  }

  // Draw subtle column separators for better readability
  let separatorX = 50;
  columnWidths.forEach((width, index) => {
    if (index > 0) { // Don't draw separator before first column
      page.drawLine({
        start: { x: separatorX, y: currentY - 12 },
        end: { x: separatorX, y: currentY + 3 },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
      });
    }
    separatorX += width;
  });

  // Render cells with consistent positioning
  let xPosition = 50;
  columns.forEach((col, colIndex) => {
    let cellValue = getCellValue(item, col);
    const isFinancialCol = isFinancialColumn(col);
    const isItemCol = col.toLowerCase() === 'item' || 
                     col.toLowerCase() === 'description' || 
                     col.toLowerCase() === 'account';
    const font = (isTotalRow || isHeaderRow) ? fonts.helveticaBold : fonts.helvetica;

    // Format financial values
    if (isFinancialCol && typeof cellValue === 'number') {
      cellValue = formatCurrencyValue(cellValue);
    } else if (isFinancialCol && typeof cellValue === 'string' && cellValue !== '-' && cellValue !== '') {
      const numValue = parseFloat(cellValue.replace(/[£$€,\s]/g, ''));
      if (!isNaN(numValue)) {
        cellValue = formatCurrencyValue(numValue);
      }
    }

    // Smart text truncation with better space utilization
    const cellText = truncateTextForColumn(cellValue, columnWidths[colIndex], fontSize, isFinancialCol);

    // Use the same positioning logic as headers for perfect alignment
    const textX = calculateTextPosition(
      cellText, 
      xPosition, 
      columnWidths[colIndex], 
      fontSize, 
      isFinancialCol, 
      isItemCol
    );

    page.drawText(String(cellText || ''), {
      x: textX,
      y: currentY - 8,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    xPosition += columnWidths[colIndex];
  });

  return { page, yPosition: currentY - 15 };
}

// Utility functions

/**
 * Calculate consistent text position for both headers and data cells
 */
function calculateTextPosition(
  text: string,
  columnStartX: number,
  columnWidth: number,
  fontSize: number,
  isFinancialCol: boolean,
  isItemCol: boolean
): number {
  const charWidth = fontSize * 0.6; // More accurate character width
  const textWidth = text.length * charWidth;
  const padding = 4; // Consistent padding
  
  if (isFinancialCol) {
    // Right-align financial columns
    return Math.max(
      columnStartX + padding, 
      columnStartX + columnWidth - textWidth - padding
    );
  } else if (isItemCol) {
    // Left-align item/description columns
    return columnStartX + padding;
  } else {
    // Center-align other columns
    return Math.max(
      columnStartX + padding,
      columnStartX + (columnWidth - textWidth) / 2
    );
  }
}

/**
 * Smart text truncation that preserves meaning
 */
function truncateTextForColumn(
  value: any,
  columnWidth: number,
  fontSize: number,
  isFinancialCol: boolean
): string {
  const cellValue = String(value || '');
  if (!cellValue) return '';
  
  const charWidth = fontSize * 0.6;
  const availableWidth = columnWidth - 8; // Account for padding
  const maxChars = Math.floor(availableWidth / charWidth);
  
  if (cellValue.length <= maxChars) return cellValue;
  
  if (isFinancialCol) {
    // For financial values, preserve currency symbols and use smart abbreviation
    if (cellValue.includes('£') || cellValue.includes('$') || cellValue.includes('€')) {
      const currencySymbol = cellValue.charAt(0);
      const numPart = cellValue.substring(1).replace(/[,\s]/g, '');
      const num = parseFloat(numPart);
      
      if (!isNaN(num)) {
        if (num >= 1000000) {
          return `${currencySymbol}${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
          return `${currencySymbol}${Math.round(num / 1000)}k`;
        } else if (maxChars >= 6) {
          return `${currencySymbol}${Math.round(num)}`;
        }
      }
    }
    // If we can't abbreviate properly, truncate but keep currency symbol
    return maxChars > 3 ? cellValue.substring(0, maxChars - 1) + '…' : cellValue.substring(0, maxChars);
  } else {
    // For text columns, smart truncation at word boundaries when possible
    if (maxChars > 10) {
      const words = cellValue.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + word).length <= maxChars - 3) {
          truncated += (truncated ? ' ' : '') + word;
        } else {
          break;
        }
      }
      if (truncated.length > 0) {
        return truncated + '...';
      }
    }
    // Fallback to character truncation
    return maxChars > 3 ? cellValue.substring(0, maxChars - 3) + '...' : cellValue.substring(0, maxChars);
  }
}

function formatDocumentName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1')
            .replace(/[-_]/g, ' ')
            .replace(/^./, str => str.toUpperCase())
            .trim();
}

function formatFieldName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/days/g, ' Days')
            .replace(/over90/g, 'Over 90')
            .replace(/^./, str => str.toUpperCase())
            .trim();
}

function formatColumnHeader(colKey: string): string {
  const headerMapping: Record<string, string> = {
    item: 'Item',
    contact: 'Contact',
    note: 'Nt',
    description: 'Desc',
    account: 'Acct',
    currentyear: 'Curr £',
    previousyear: 'Prev £',
    currentYear: 'Curr £',
    previousYear: 'Prev £',
    value: '£',
    total: 'Tot £',
    debit: 'Dr £',
    credit: 'Cr £',
    // Aged report specific headers - more compact
    '1month': '<1M',
    '2months': '1-2M', 
    '3months': '2-3M',
    'older': '>3M',
    'current': 'Curr',
    '30days': '30d',
    '60days': '60d',
    '90days': '90d',
    'over90days': '>90d',
    // Additional common financial terms
    'percentage': '%',
    'percentageoftotal': '%Tot',
    'totalagedpayables': 'TotPay',
    'totalagedreceivables': 'TotRec',
    // Currency symbols for compact display
    'gbp': '£',
    'usd': '$',
    'eur': '€'
  };

  const mapped = headerMapping[colKey.toLowerCase().replace(/\s+/g, '')];
  if (mapped) return mapped;

  // Check for year patterns (e.g., "2023", "2024")
  if (/^20\d{2}$/.test(colKey)) {
    return colKey.substring(2); // Show just "23", "24" etc.
  }

  // Check for month patterns (e.g., "1 MONTH", "2 MONTHS")
  if (/\d+\s*MONTHS?/i.test(colKey)) {
    const match = colKey.match(/(\d+)\s*MONTHS?/i);
    return match ? `${match[1]}M` : colKey;
  }

  // Check for currency patterns in column names
  if (/\b(gbp|usd|eur|pound|dollar|euro)\b/i.test(colKey)) {
    const currMatch = colKey.match(/\b(gbp|pound)\b/i) ? '£' : 
                     colKey.match(/\b(usd|dollar)\b/i) ? '$' : 
                     colKey.match(/\b(eur|euro)\b/i) ? '€' : '£';
    return currMatch;
  }

  // Aggressive abbreviation for any remaining headers
  let formatted = colKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Apply aggressive abbreviations
  formatted = formatted
    .replace(/Current Year/gi, 'Curr')
    .replace(/Previous Year/gi, 'Prev')
    .replace(/Current/gi, 'Curr')
    .replace(/Previous/gi, 'Prev')
    .replace(/Percentage/gi, '%')
    .replace(/Amount/gi, '£')
    .replace(/Balance/gi, 'Bal')
    .replace(/Total/gi, 'Tot')
    .replace(/Contact/gi, 'Cont')
    .replace(/Month/gi, 'M')
    .replace(/Days/gi, 'd')
    .replace(/Over/gi, '>')
    .replace(/Under/gi, '<')
    .replace(/Between/gi, '-');

  // Final truncation - be more aggressive for landscape tables
  if (formatted.length > 8) {
    // Try to find a good break point
    const words = formatted.split(' ');
    if (words.length > 1) {
      // Use first letters of each word
      const abbreviated = words.map(word => word.charAt(0)).join('');
      if (abbreviated.length <= 6) {
        formatted = abbreviated;
      } else {
        // Too many words, use first two words abbreviated
        formatted = words.slice(0, 2).map(word => word.charAt(0)).join('');
      }
    } else {
      // Truncate single word
      formatted = formatted.substring(0, 6);
    }
  }

  return formatted;
}

function formatCurrencyValue(value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return String(value);
  if (numValue === 0) return '-';
  
  const absValue = Math.abs(numValue);
  
  // For large values, use k/M notation to save space
  if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    return `£${millions.toFixed(1)}M${numValue < 0 ? '-' : ''}`;
  } else if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return `£${thousands.toFixed(0)}k${numValue < 0 ? '-' : ''}`;
  } else {
    // For smaller values, use compact format
    return `£${absValue.toFixed(0)}${numValue < 0 ? '-' : ''}`;
  }
}

function formatFinancialValue(value: any, key: string): string {
  const financialTerms = [
    'sales', 'turnover', 'revenue', 'cost', 'expense', 'profit', 'asset', 
    'liability', 'equity', 'balance', 'income', 'total', 'capital', 'tax',
    'amount', 'value', 'current', 'debit', 'credit'
  ];
  
  const shouldBeCurrency = financialTerms.some(term => 
    key.toLowerCase().includes(term) || /\d{4}/.test(key)
  );

  if (shouldBeCurrency && (typeof value === 'number' || !isNaN(Number(value)))) {
    return formatCurrencyValue(value);
  }

  return String(value || '');
}

function isFinancialColumn(colKey: string): boolean {
  const key = colKey.toLowerCase();
  const nonFinancialColumns = ['item', 'note', 'notes', 'reference', 'ref', 'account', 'description', 'name'];
  
  if (nonFinancialColumns.includes(key)) return false;
  
  const financialTerms = [
    'year', 'amount', 'value', 'balance', 'total', 'debit', 'credit', 
    'current', 'previous', 'assets', 'liabilities', 'equity', 'profit',
    'loss', 'revenue', 'expense', 'cost'
  ];
  
  return financialTerms.some(term => key.includes(term)) || /^20\d{2}$/.test(colKey);
}

function calculateDynamicColumnWidths(columns: string[], totalWidth: number, isLandscape: boolean = false): number[] {
  const minWidth = isLandscape ? 40 : 45; // Slightly larger minimum for better readability
  const maxTableWidth = totalWidth - 40; // Reduced margins to use more page width
  const widths: number[] = [];
  
  // Enhanced column type detection and sizing
  const columnTypes = columns.map(col => {
    const lower = col.toLowerCase();
    if (lower === 'item' || lower === 'description' || lower === 'account' || lower.includes('name')) {
      return 'item';
    } else if (isFinancialColumn(col)) {
      return 'financial';
    } else if (lower.includes('contact') || lower.includes('note')) {
      return 'text';
    } else {
      return 'other';
    }
  });
  
  // Calculate base widths with more precise sizing
  columns.forEach((col, index) => {
    const type = columnTypes[index];
    
    switch (type) {
      case 'item':
        // Item columns get more space - they contain the most important descriptive text
        const itemWidth = isLandscape ? 
          Math.min(140, maxTableWidth * 0.28) : 
          Math.min(180, maxTableWidth * 0.35);
        widths.push(itemWidth);
        break;
        
      case 'financial':
        // Financial columns - optimized for currency display
        const financialWidth = isLandscape ? 65 : 80;
        widths.push(financialWidth);
        break;
        
      case 'text':
        // Text columns - moderate width for descriptions/notes
        const textWidth = isLandscape ? 50 : 70;
        widths.push(textWidth);
        break;
        
      default:
        // Other columns - compact but readable
        const otherWidth = isLandscape ? 45 : 55;
        widths.push(otherWidth);
        break;
    }
  });
  
  // Calculate current total and adjust if necessary
  let currentTotal = widths.reduce((sum, w) => sum + w, 0);
  
  if (currentTotal > maxTableWidth) {
    // Scale down proportionally but respect minimum widths
    const scaleFactor = maxTableWidth / currentTotal;
    widths.forEach((width, index) => {
      const scaledWidth = width * scaleFactor;
      widths[index] = Math.max(minWidth, scaledWidth);
    });
    
    // Recalculate after applying minimums
    currentTotal = widths.reduce((sum, w) => sum + w, 0);
    
    // If still too wide, apply equal distribution
    if (currentTotal > maxTableWidth) {
      const equalWidth = Math.max(minWidth, maxTableWidth / columns.length);
      widths.fill(equalWidth);
    }
  } else if (currentTotal < maxTableWidth * 0.85) {
    // If we have significant extra space, distribute it intelligently
    const extraSpace = maxTableWidth - currentTotal;
    const totalWeight = widths.reduce((sum, w) => sum + w, 0);
    
    widths.forEach((width, index) => {
      // Give more extra space to item columns, less to financial columns
      const type = columnTypes[index];
      let weight = 1;
      
      if (type === 'item') weight = 1.5;
      else if (type === 'financial') weight = 0.8;
      else if (type === 'text') weight = 1.2;
      
      const proportionalIncrease = (width / totalWeight) * extraSpace * weight;
      widths[index] += proportionalIncrease;
    });
  }
  
  // Final validation - ensure all widths are reasonable
  widths.forEach((width, index) => {
    const type = columnTypes[index];
    const maxWidth = type === 'item' ? 250 : type === 'financial' ? 100 : 150;
    widths[index] = Math.min(width, maxWidth);
  });
  
  return widths;
}

function getCellValue(item: any, colKey: string): any {
  // Direct lookup first
  if (item[colKey] !== undefined) return item[colKey];
  
  // Handle special cases
  if (colKey.toLowerCase() === 'item') {
    return item.item || item.description || item.account || item.name || item.lineItem || item.accountName || '';
  }
  
  if (colKey.toLowerCase().includes('note')) {
    return item.note || item.notes || item.reference || item.ref || '';
  }
  
  // Try case variations
  const variations = [
    colKey.toLowerCase(),
    colKey.toUpperCase(),
    colKey.replace(/([A-Z])/g, '_$1').toLowerCase()
  ];
  
  for (const variation of variations) {
    if (item[variation] !== undefined) {
      return item[variation];
    }
  }
  
  return '';
}

function shouldSkipField(key: string): boolean {
  const skipFields = [
    'summary', 'metadata', 'json', 'description', 'content', 
    'fileName', 'pages', 'analysisMethod', 'lineItems', 'columns',
    'companyName', 'statementTitle', 'accounts', 'suppliers', 'customers'
  ];
  
  return skipFields.includes(key) || 
         key.toLowerCase().includes('summary') ||
         key.toLowerCase().includes('description');
}

function formatDate(dateInput: any): string {
  const formattedDate = formatDateValue(dateInput);
  return formattedDate || '';
}

/**
 * Get a properly formatted date from document data with intelligent fallbacks
 */
function getFormattedDate(documentData: any): string {
  // Try multiple date fields and formats
  const possibleDateFields = [
    'createdAt',
    'updatedAt', 
    'lastUpdated',
    'dateCreated',
    'modifiedDate',
    'created',
    'updated'
  ];
  
  // Try each date field
  for (const field of possibleDateFields) {
    if (documentData[field]) {
      const formattedDate = formatDateValue(documentData[field]);
      if (formattedDate) return formattedDate;
    }
    
    // Also check nested data objects
    if (documentData.data && documentData.data[field]) {
      const formattedDate = formatDateValue(documentData.data[field]);
      if (formattedDate) return formattedDate;
    }
  }
  
  // Check if we can get a date from the current date to match the web interface
  // which shows "16 Jun 2025" - likely using today's date as fallback
  const today = new Date();
  return today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format a date value with multiple format support (same logic as web interface)
 */
function formatDateValue(dateValue: any): string | null {
  if (!dateValue) return null;
  
  try {
    let date: Date;
    
    // Handle different input types - including Firestore timestamps
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Handle various string formats
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        // ISO format
        date = new Date(dateValue);
      } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        date = new Date(dateValue + 'T00:00:00');
      } else if (dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // DD/MM/YYYY format
        const parts = dateValue.split('/');
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (dateValue.match(/^\d{1,2} \w{3} \d{4}$/)) {
        // "16 Jun 2025" format - already in the desired format!
        return dateValue;
      } else {
        // Try generic parsing
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      // Timestamp
      date = new Date(dateValue);
    } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      // Handle Firestore timestamp - this is likely the issue!
      date = new Date(dateValue.seconds * 1000);
      if (dateValue.nanoseconds) {
        date.setMilliseconds(date.getMilliseconds() + Math.floor(dateValue.nanoseconds / 1000000));
      }
    } else if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
      // Handle Firestore timestamp object with toDate method
      date = dateValue.toDate();
    } else {
      return null;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Format consistently (matching web interface format)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
}
