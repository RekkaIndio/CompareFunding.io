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
  minColumnWidth: 80,
  maxColumnWidth: 200,
  currencyColumnWidth: 120,
  descriptionColumnWidth: 180
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

    // Create new page for each document after the first one
    if (docIndex > 0) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 780;
    }

    // Render the document with full data tables
    const result = renderFinancialDocument(
      currentPage, 
      currentY, 
      width, 
      docKey, 
      documentData, 
      fonts, 
      colors, 
      pdfDoc
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
  pdfDoc: PDFDocument
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

  // Document metadata
  if (documentData.createdAt) {
    const dateStr = new Date(documentData.createdAt).toLocaleDateString('en-GB');
    currentPage.drawText(`Last updated: ${dateStr}`, {
      x: 50,
      y: currentY,
      size: 9,
      font: fonts.helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    currentY -= 20;
  }

  // Render based on document structure
  if (data.profitAndLoss) {
    const result = renderProfitAndLoss(currentPage, currentY, width, data.profitAndLoss, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
  } else if (data.balanceSheet) {
    const result = renderBalanceSheet(currentPage, currentY, width, data.balanceSheet, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
  } else if (data.trialBalance) {
    const result = renderTrialBalance(currentPage, currentY, width, data.trialBalance, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
  } else if (data.agedPayables || data.agedReceivables || data.suppliers || data.customers) {
    const result = renderAgedReport(currentPage, currentY, width, data, documentName, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
  } else if (data.lineItems && Array.isArray(data.lineItems)) {
    // Generic line items structure
    const result = renderLineItemsTable(currentPage, currentY, width, data, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
  } else {
    // Fallback for other data structures
    const result = renderGenericFinancialData(currentPage, currentY, width, data, fonts, colors, pdfDoc);
    currentPage = result.page;
    currentY = result.yPosition;
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
  pdfDoc: PDFDocument
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
    const result = renderFinancialTable(currentPage, currentY, width, data, fonts, colors, pdfDoc);
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
  pdfDoc: PDFDocument
): RenderResult {
  return renderProfitAndLoss(page, yPosition, width, data, fonts, colors, pdfDoc);
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
  pdfDoc: PDFDocument
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
    const result = renderTrialBalanceTable(currentPage, currentY, width, data.accounts, fonts, colors, pdfDoc);
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
  pdfDoc: PDFDocument
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
    const result = renderAgedItemsTable(currentPage, currentY, width, data[itemsKey], itemsKey, fonts, colors, pdfDoc);
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
        currentPage = pdfDoc.addPage([595.276, 841.890]);
        currentY = 750;
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
 * Render generic line items table (P&L, Balance Sheet, etc.)
 */
function renderFinancialTable(
  page: PDFPage,
  yPosition: number,
  width: number,
  data: any,
  fonts: any,
  colors: any,
  pdfDoc: PDFDocument
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

  // Calculate column widths
  const tableWidth = width - 100;
  const columnWidths = calculateDynamicColumnWidths(columns, tableWidth);

  // Render table headers
  const headerResult = renderTableHeaders(currentPage, currentY, columns, columnWidths, fonts, colors);
  currentY = headerResult.yPosition;

  // Render rows with pagination
  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    
    // Check if we need a new page
    if (currentY < 120) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
      
      // Re-render headers on new page
      const newHeaderResult = renderTableHeaders(currentPage, currentY, columns, columnWidths, fonts, colors);
      currentY = newHeaderResult.yPosition;
    }

    const rowResult = renderTableRow(currentPage, currentY, item, columns, columnWidths, fonts, i);
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
  pdfDoc: PDFDocument
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  const tableWidth = width - 100;
  const accountNameWidth = tableWidth * 0.65; // 65% for account name
  const amountWidth = tableWidth * 0.35; // 35% for amount

  // Headers
  currentPage.drawRectangle({
    x: 50,
    y: currentY - 15,
    width: tableWidth,
    height: 20,
    color: rgb(0.2, 0.2, 0.2),
  });

  currentPage.drawText('Account Name', {
    x: 55,
    y: currentY - 8,
    size: 8,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentPage.drawText('Debit / Credit', {
    x: 50 + accountNameWidth + amountWidth - 80,
    y: currentY - 8,
    size: 8,
    font: fonts.helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 25;

  // Render accounts
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    if (currentY < 100) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
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

    // Truncate account name if too long
    const maxAccountChars = Math.floor(accountNameWidth / 5.5);
    let truncatedName = accountName;
    if (accountName.length > maxAccountChars && maxAccountChars > 3) {
      truncatedName = accountName.substring(0, maxAccountChars - 3) + '...';
    }

    currentPage.drawText(truncatedName, {
      x: 55,
      y: currentY - 8,
      size: 7,
      font: fonts.helvetica,
      color: rgb(0, 0, 0),
    });

    // Right align amount
    const amountWidth_text = displayAmount.length * 4;
    currentPage.drawText(displayAmount, {
      x: 50 + tableWidth - amountWidth_text - 10,
      y: currentY - 8,
      size: 7,
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
  pdfDoc: PDFDocument
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
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
    }

    // Item name header
    const itemName = item.supplierName || item.customerName || `Item ${i + 1}`;
    currentPage.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: width - 100,
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

    // Item details
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'supplierName' && key !== 'customerName' && value !== null && value !== undefined) {
        if (currentY < 80) {
          currentPage = pdfDoc.addPage([595.276, 841.890]);
          currentY = 750;
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
          x: width - 200,
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
  pdfDoc: PDFDocument
): RenderResult {
  return renderFinancialTable(page, yPosition, width, data, fonts, colors, pdfDoc);
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
  pdfDoc: PDFDocument
): RenderResult {
  let currentY = yPosition;
  let currentPage = page;

  // Extract key-value pairs from the data
  Object.entries(data).forEach(([key, value]) => {
    if (shouldSkipField(key) || value === null || value === undefined) return;

    if (currentY < 80) {
      currentPage = pdfDoc.addPage([595.276, 841.890]);
      currentY = 750;
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
  colors: any
): RenderResult {
  let currentY = yPosition;

  // Header background
  page.drawRectangle({
    x: 50,
    y: currentY - 15,
    width: columnWidths.reduce((sum, width) => sum + width, 0),
    height: 20,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Header text
  let xPosition = 50;
  columns.forEach((col, index) => {
    const headerText = formatColumnHeader(col);
    const isFinancialCol = isFinancialColumn(col);
    
    // Use very small font for headers to maximize space usage
    const fontSize = 6;
    
    // Calculate text positioning to fit within column bounds
    let textX = xPosition + 2;
    if (isFinancialCol) {
      // Right-align financial column headers
      const textWidth = headerText.length * (fontSize * 0.6);
      textX = Math.max(xPosition + 2, xPosition + columnWidths[index] - textWidth - 2);
    } else if (columnWidths[index] > 50) {
      // Center align for wider columns
      const textWidth = headerText.length * (fontSize * 0.6);
      textX = xPosition + (columnWidths[index] - textWidth) / 2;
    }
    
    // Ensure text doesn't exceed column boundaries
    textX = Math.max(xPosition + 1, Math.min(textX, xPosition + columnWidths[index] - 10));
    
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
  rowIndex: number
): RenderResult {
  let currentY = yPosition;

  // Determine row styling
  const isHeaderRow = item.isHeader || item.category === 'header';
  const isSubtotalRow = item.isSubtotal || item.category === 'subtotal';
  const isTotalRow = item.isTotal || item.category === 'total';

  // Row background
  if (isHeaderRow) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: 15,
      color: rgb(0.85, 0.85, 0.85),
    });
  } else if (isTotalRow) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: 15,
      color: rgb(0.95, 0.95, 0.95),
    });
  } else if (rowIndex % 2 === 0) {
    page.drawRectangle({
      x: 50,
      y: currentY - 12,
      width: columnWidths.reduce((sum, width) => sum + width, 0),
      height: 15,
      color: rgb(0.98, 0.98, 0.98),
    });
  }

  // Render cells
  let xPosition = 50;
  columns.forEach((col, colIndex) => {
    let cellValue = getCellValue(item, col);
    const isFinancialCol = isFinancialColumn(col);
    const isItemCol = col.toLowerCase() === 'item' || 
                     col.toLowerCase() === 'description' || 
                     col.toLowerCase() === 'account';
    const font = (isTotalRow || isHeaderRow) ? fonts.helveticaBold : fonts.helvetica;
    const fontSize = 6; // Very small font to fit more content

    // Format financial values
    if (isFinancialCol && typeof cellValue === 'number') {
      cellValue = formatCurrencyValue(cellValue);
    } else if (isFinancialCol && typeof cellValue === 'string' && cellValue !== '-' && cellValue !== '') {
      const numValue = parseFloat(cellValue.replace(/[£$€,\s]/g, ''));
      if (!isNaN(numValue)) {
        cellValue = formatCurrencyValue(numValue);
      }
    }

    // More aggressive text truncation based on actual column width
    const charWidth = fontSize * 0.6; // Approximate character width
    const maxChars = Math.floor((columnWidths[colIndex] - 4) / charWidth);
    
    if (typeof cellValue === 'string' && cellValue.length > maxChars && maxChars > 3) {
      if (isFinancialCol) {
        // For financial values, try to keep the number readable
        if (cellValue.includes('£')) {
          const numPart = cellValue.replace('£', '').replace(',', '');
          if (numPart.length > maxChars - 1) {
            // Convert to thousands if too long
            const num = parseFloat(numPart);
            if (!isNaN(num) && num >= 1000) {
              cellValue = `£${Math.round(num / 1000)}k`;
            } else {
              cellValue = cellValue.substring(0, maxChars - 1);
            }
          }
        } else {
          cellValue = cellValue.substring(0, maxChars - 1);
        }
      } else {
        cellValue = cellValue.substring(0, maxChars - 3) + '...';
      }
    }

    // Position text based on column type
    let textX = xPosition + 2;
    if (isFinancialCol) {
      // Right-align financial data
      const textWidth = String(cellValue || '').length * charWidth;
      textX = Math.max(xPosition + 2, xPosition + columnWidths[colIndex] - textWidth - 2);
    } else if (isItemCol && columnWidths[colIndex] > 40) {
      // Left-align item columns with padding
      textX = xPosition + 3;
    } else {
      // Center align for other small columns
      const textWidth = String(cellValue || '').length * charWidth;
      textX = xPosition + Math.max(2, (columnWidths[colIndex] - textWidth) / 2);
    }

    // Ensure text stays within column bounds
    textX = Math.max(xPosition + 1, Math.min(textX, xPosition + columnWidths[colIndex] - 2));

    page.drawText(String(cellValue || ''), {
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
    'totalagedreceivables': 'TotRec'
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
    .replace(/Days/gi, 'd');

  // Final truncation - be more aggressive
  if (formatted.length > 8) {
    // Try to find a good break point
    const words = formatted.split(' ');
    if (words.length > 1) {
      // Use first letters of each word
      formatted = words.map(word => word.charAt(0)).join('');
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

function calculateDynamicColumnWidths(columns: string[], totalWidth: number): number[] {
  const minWidth = 35; // Further reduced minimum width
  const maxTableWidth = totalWidth - 120; // More conservative margin
  const widths: number[] = [];
  
  // First pass: assign base widths
  columns.forEach(col => {
    const isItemColumn = col.toLowerCase() === 'item' || 
                        col.toLowerCase() === 'description' || 
                        col.toLowerCase() === 'account';
    const isFinancialCol = isFinancialColumn(col);
    
    if (isItemColumn) {
      // Item columns get more space but limited
      widths.push(Math.min(120, maxTableWidth * 0.25));
    } else if (isFinancialCol) {
      // Financial columns get standard width
      widths.push(65);
    } else {
      // Other columns get minimal space
      widths.push(minWidth);
    }
  });
  
  // Calculate current total
  let currentTotal = widths.reduce((sum, w) => sum + w, 0);
  
  // If we exceed available width, scale everything down proportionally
  if (currentTotal > maxTableWidth) {
    const scaleFactor = maxTableWidth / currentTotal;
    widths.forEach((_, index) => {
      widths[index] = Math.max(minWidth, widths[index] * scaleFactor);
    });
  }
  
  // Final check: if we still exceed, distribute equally among all columns
  currentTotal = widths.reduce((sum, w) => sum + w, 0);
  if (currentTotal > maxTableWidth) {
    const equalWidth = Math.max(minWidth, maxTableWidth / columns.length);
    widths.fill(equalWidth);
  }
  
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
  if (!dateInput) return '';
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}
