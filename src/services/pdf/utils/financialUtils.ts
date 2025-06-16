/**
 * Helper function to extract line items from financial data
 */
export function extractLineItems(data: any): any[] {
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
      if (typeof value === 'object' || typeof value === 'number' || typeof value === 'string') {
        extractedItems.push({
          item: key,
          value: value
        });
      }
    });
  }
  
  return extractedItems;
}

/**
 * Helper function to get column headers from financial data
 */
export function getFinancialColumns(lineItems: any[]): string[] {
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
      return a.localeCompare(b);
    }
    
    return a.localeCompare(b);
  });
  
  // Combine: text columns first, then financial columns
  return [...textColumns, ...financialColumns];
}

/**
 * Helper function to check if a column contains financial data
 */
export function isFinancialColumn(colKey: string): boolean {
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

/**
 * Helper function to format column header for display
 */
export function formatColumnHeader(colKey: string): string {
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

/**
 * Format financial values for display
 */
export function formatFinancialValue(value: any, key: string): string {
  // Handle object values first to prevent rendering objects directly
  if (typeof value === 'object' && value !== null) {
    // If it's an object with amount and description, extract the amount
    if (value.hasOwnProperty('amount') && value.hasOwnProperty('description')) {
      return formatFinancialValue(value.amount, key);
    } else {
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
    if (num === 0) return '£0';
    
    // Handle currency values
    if (shouldBeCurrency || Math.abs(num) >= 100) {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    }
    else if (key.toLowerCase().includes('percentage') || 
             key.toLowerCase().includes('ratio') || 
             key.toLowerCase().includes('margin') || 
             (num !== 0 && Math.abs(num) <= 100)) {
      return `${num.toFixed(1)}%`;
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

/**
 * Helper function to calculate dynamic column widths based on content
 */
export function calculateColumnWidths(columns: string[], items: any[], totalWidth: number): number[] {
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
      widths.push(Math.max(minWidth * 2, 150)); // More space for text columns
    } else if (isFinancialCol) {
      widths.push(Math.max(minWidth, 90)); // Standard space for financial columns
    } else {
      widths.push(minWidth);
    }
  });
  
  // Ensure total width doesn't exceed available space
  const totalCalculated = widths.reduce((sum, w) => sum + w, 0);
  if (totalCalculated > maxTableWidth) {
    const scaleFactor = maxTableWidth / totalCalculated * 0.9;
    widths.forEach((_, index) => {
      widths[index] = Math.max(minWidth, widths[index] * scaleFactor);
    });
  }
  
  return widths;
}

/**
 * Helper function to get X position for a column
 */
export function getColumnXPosition(columnIndex: number, columnWidths: number[]): number {
  const baseX = 50; // Starting X position
  let xPos = baseX;
  
  for (let i = 0; i < columnIndex; i++) {
    xPos += columnWidths[i];
  }
  
  return xPos;
}
