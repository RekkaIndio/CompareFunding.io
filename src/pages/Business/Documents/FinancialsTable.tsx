import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Eye, FileText, TrendingUp, PoundSterling, BarChart3 } from "lucide-react";

interface FinancialsTableProps {
  data: Record<string, any> | null;
  title?: string;
  summary?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  color, 
  children, 
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <>
      <tr>
        <td 
          colSpan={2} 
          className={`py-4 px-6 font-semibold text-white bg-gradient-to-r ${color} cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {icon}
              <span className="uppercase tracking-wide text-sm">{title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </td>
      </tr>
      {isExpanded && children}
    </>
  );
};

// Function to format numbers as currency or with proper formatting
const formatValue = (value: any, key: string): string => {
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
    'totalequity', 'grandtotal'
  ];
  
  // Check if the key suggests this is a financial value that should be a currency
  const shouldBeCurrency = financialTerms.some(term => 
    key.toLowerCase().includes(term)
  );
  
  // Check if value is a number or can be converted to a number
  if ((typeof value === 'number' || !isNaN(Number(value))) && value !== "") {
    const num = Number(value);
    
    // Handle currency values
    if (shouldBeCurrency || Math.abs(num) >= 100) {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
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
  
  // Handle dates
  if (typeof value === 'string' && 
     (value.match(/^\d{4}-\d{2}-\d{2}$/) || 
      value.match(/^\d{2}\/\d{2}\/\d{4}$/) ||
      value.match(/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/))) {
    return value;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Default for all other values
  return String(value);
};

const isPrimitive = (val: any) => val === null || ["string", "number", "boolean"].includes(typeof val);

// Function to format currency consistently
const formatCurrency = (amount: number | string | null | undefined): string => {
  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') return '-';
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numAmount)) return '-';
  
  // Handle zero
  if (numAmount === 0) return '-';
  
  const absAmount = Math.abs(numAmount);
  const formattedAmount = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absAmount);
  
  // Show negative amounts in parentheses for expenses
  return numAmount < 0 ? `(${formattedAmount})` : formattedAmount;
};

// Dynamic renderer for any financial data structure
const renderDynamicFinancialData = (data: any) => {
  if (!data) {
    return <p className="text-center text-gray-500 py-8">No financial data available.</p>;
  }
  
  // Debug logging to help troubleshoot
  console.log('FinancialsTable - renderDynamicFinancialData received data:', data);
  console.log('FinancialsTable - data keys:', Object.keys(data));
  if (data.lineItems) {
    console.log('FinancialsTable - lineItems sample:', data.lineItems.slice(0, 2));
    console.log('FinancialsTable - first lineItem keys:', data.lineItems.length > 0 ? Object.keys(data.lineItems[0]) : []);
  }
  
  // If lineItems is missing or empty, try to create it from available data
  if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    
    // Try to find financial data in various formats
    const extractedItems: any[] = [];
    
    // Check for direct financial values
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^\d.-]/g, ''))))) {
        if (!['pages', 'fileName', 'documentType'].includes(key)) {
          extractedItems.push({
            item: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: typeof value === 'number' ? value : parseFloat(value.replace(/[^\d.-]/g, '')),
            category: 'other'
          });
        }
      }
    });
    
    // If we found some data, use it
    if (extractedItems.length > 0) {
      data = {
        ...data,
        lineItems: extractedItems,
        columns: ['item', 'value']
      };
    } else {
      return (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Financial Data Extracted</h3>
            <p className="text-sm text-yellow-700 mb-3">
              The document was processed successfully, but no financial line items were extracted.
            </p>
            {data.companyName && (
              <p className="text-xs text-gray-600 mb-2">
                <strong>Company:</strong> {data.companyName}
              </p>
            )}
            {data.period && (
              <p className="text-xs text-gray-600 mb-2">
                <strong>Period:</strong> {data.period}
              </p>
            )}
            <div className="mt-4 text-xs text-yellow-600">
              <p>Available data keys: {Object.keys(data).join(', ')}</p>
            </div>
          </div>
        </div>
      );
    }
  }


  // Get columns dynamically from the data
  let columnsToDisplay: string[] = [];
  
  // First, try to use the columns array if provided
  if (data.columns && Array.isArray(data.columns)) {
    columnsToDisplay = data.columns.map(col => col.toLowerCase());
  } else if (data.lineItems.length > 0) {
    // Extract columns from the first line item
    const firstItem = data.lineItems[0];
    const excludeKeys = ['category', 'isHeader', 'isSubtotal', 'isTotal', 'isCalculated', 'level'];
    columnsToDisplay = Object.keys(firstItem).filter(key => !excludeKeys.includes(key));
  }
  
  // Ensure we have basic columns and 'item' is always first
  if (columnsToDisplay.length === 0) {
    columnsToDisplay = ['item', 'note'];
  } else if (!columnsToDisplay.includes('item')) {
    // Make sure 'item' column is included and is first
    columnsToDisplay = ['item', ...columnsToDisplay];
  } else {
    // Move 'item' to the front if it's not already there
    const itemIndex = columnsToDisplay.indexOf('item');
    if (itemIndex > 0) {
      columnsToDisplay.splice(itemIndex, 1);
      columnsToDisplay.unshift('item');
    }
  }


  
  // Create dynamic column header mapping
  const getColumnHeader = (colKey: string): string => {
    const key = colKey.toLowerCase();
    
    // Standard mappings
    const standardMappings: Record<string, string> = {
      'item': 'Item',
      'note': 'Note',
      'notes': 'Notes',
      'reference': 'Ref',
      'ref': 'Ref',
      'account': 'Account',
      'description': 'Description',
      'currentyear': 'Current Year £',
      'previousyear': 'Previous Year £',
      'current': 'Current £',
      'previous': 'Previous £',
      'thisyear': 'This Year £',
      'lastyear': 'Last Year £',
      'amount': 'Amount £',
      'value': 'Value £',
      'balance': 'Balance £',
      'total': 'Total £',
      'debit': 'Debit £',
      'credit': 'Credit £'
    };
    
    if (standardMappings[key]) {
      return standardMappings[key];
    }
    
    // Check if it's a year (YYYY format)
    if (/^20\d{2}$/.test(colKey)) {
      return `${colKey} £`;
    }
    
    // Check if it looks like a financial period
    if (key.includes('year') || key.includes('period') || /\d{4}/.test(key)) {
      return `${colKey} £`;
    }
    
    // Default: capitalize first letter and replace underscores/camelCase
    return colKey.replace(/([A-Z])/g, ' $1')
                 .replace(/_/g, ' ')
                 .replace(/^./, str => str.toUpperCase());
  };

  // Determine which columns contain financial values
  const isFinancialColumn = (colKey: string): boolean => {
    const key = colKey.toLowerCase();
    const nonFinancialColumns = ['item', 'note', 'notes', 'reference', 'ref', 'account', 'description'];
    
    if (nonFinancialColumns.includes(key)) return false;
    
    // Check if it contains year, amount, value, balance, etc.
    const financialTerms = ['year', 'amount', 'value', 'balance', 'total', 'debit', 'credit', 'current', 'previous', 'mar', 'jan', 'q1', 'quarter'];
    return financialTerms.some(term => key.includes(term)) || /^20\d{2}$/.test(colKey) || /\d{4}/.test(key);
  };

  return (
    <div className="my-4">      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            {columnsToDisplay.map((colKey: string, idx: number) => {
              const headerText = getColumnHeader(colKey);
              const isValueColumn = isFinancialColumn(colKey);
              const isNoteColumn = colKey.toLowerCase().includes('note') || colKey.toLowerCase().includes('ref');
              const isItemColumn = colKey.toLowerCase() === 'item';
              
              return (
                <th 
                  key={idx} 
                  className={`py-3 px-4 text-sm font-medium uppercase tracking-wider ${
                    isItemColumn ? 'w-1/3 text-left' :
                    isNoteColumn ? 'w-16 text-center' : 
                    isValueColumn ? 'text-right' : 'text-left'
                  }`}
                >
                  {headerText}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item: Record<string, any>, idx: number) => {
            const isHeaderRow = item.isHeader || item.category === 'header' || 
                              (typeof item.item === 'string' && item.item.toUpperCase() === item.item && item.item.length > 3);
            const isSubtotalRow = item.isSubtotal || item.category === 'subtotal' || 
                                (typeof item.item === 'string' && 
                                 (item.item.toLowerCase().includes('gross') || 
                                  item.item.toLowerCase().includes('operating') || 
                                  item.item.toLowerCase().includes('subtotal')));
            const isTotalRow = item.isTotal || item.category === 'total' || 
                             (typeof item.item === 'string' && 
                              (item.item.toLowerCase().includes('net profit') || 
                               item.item.toLowerCase().includes('net assets') ||
                               item.item.toLowerCase().includes('total')));

            let rowClass = "";
            if (isTotalRow) {
              rowClass = "font-bold border-t-2 border-gray-700 bg-gray-50";
            } else if (isSubtotalRow) {
              rowClass = "font-semibold bg-gray-25";
            } else if (isHeaderRow) {
              rowClass = "font-bold text-gray-700 bg-gray-100";
            }

            // Handle header rows that span all columns
            if (isHeaderRow && !hasFinancialValues(item, columnsToDisplay)) {
              return (
                <tr key={idx} className={`hover:bg-gray-100 ${rowClass}`}>
                  <td 
                    colSpan={columnsToDisplay.length} 
                    className="py-2.5 px-4 text-sm text-gray-900 font-semibold uppercase tracking-wider"
                  >
                    {item.item || item.description || item.account}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={idx} className={`border-b border-gray-200 hover:bg-gray-50 ${rowClass}`}>
                {columnsToDisplay.map((colKey: string, colIdx: number) => {
                  let cellValue = item[colKey];
                  const isValueColumn = isFinancialColumn(colKey);
                  const isItemColumn = colKey.toLowerCase() === 'item';
                  
                  // Debug logging for the first few items
                  if (idx < 3) {
                    console.log(`FinancialsTable - Row ${idx}, Column ${colKey}:`, cellValue, 'isValueColumn:', isValueColumn);
                  }
                  
                  // Handle different data access patterns more comprehensively
                  if (colKey.toLowerCase() === 'item') {
                    cellValue = item.item || item.description || item.account || item.name || item.lineItem || item.accountName || '';
                  } else if (colKey.toLowerCase().includes('note') || colKey.toLowerCase().includes('ref')) {
                    cellValue = item.note || item.notes || item.reference || item.ref || '';
                  } else if (cellValue === undefined || cellValue === null) {
                    // Try to find the value using different case variations and common aliases
                    const possibleKeys = [
                      colKey, 
                      colKey.toLowerCase(), 
                      colKey.toUpperCase(),
                      colKey.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
                      colKey.replace(/_/g, ''), // remove underscores
                      colKey.replace(/\s+/g, ''), // remove spaces
                      colKey.replace(/\s+/g, '_'), // replace spaces with underscores
                      colKey.replace(/[^\w]/g, ''), // remove all non-alphanumeric characters
                    ];
                    
                    for (const key of possibleKeys) {
                      if (item[key] !== undefined && item[key] !== null) {
                        cellValue = item[key];
                        if (idx < 3) console.log(`FinancialsTable - Found value with key "${key}":`, cellValue);
                        break;
                      }
                    }
                    
                    // If still no value, check for common column name mappings
                    const columnMappings: Record<string, string[]> = {
                      'currentyear': ['current_year', 'currentYear', 'current', 'thisYear', 'year1', 'jan-mar2025', 'janmaar2025', 'janmar2025'],
                      'previousyear': ['previous_year', 'previousYear', 'previous', 'lastYear', 'year2', 'jan-mar2024', 'janmaar2024', 'janmar2024'],
                      'value': ['amount', 'total', 'sum', 'balance'],
                      'note': ['notes', 'reference', 'ref', 'comment']
                    };
                    
                    // Check if the column key matches any period format (like "jan-mar2025")
                    const normalizedColKey = colKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (columnMappings[normalizedColKey]) {
                      for (const altKey of columnMappings[normalizedColKey]) {
                        if (item[altKey] !== undefined && item[altKey] !== null) {
                          cellValue = item[altKey];
                          if (idx < 3) console.log(`FinancialsTable - Found value with mapped key "${altKey}":`, cellValue);
                          break;
                        }
                      }
                    }
                    
                    // Special handling for period-based columns that might use different formats
                    if (!cellValue && isValueColumn) {
                      // Look for any numerical field that might be the financial value
                      const numericKeys = Object.keys(item).filter(k => {
                        const val = item[k];
                        return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val.replace(/[^\d.-]/g, ''))));
                      });
                      
                      if (numericKeys.length === 1) {
                        cellValue = item[numericKeys[0]];
                        if (idx < 3) console.log(`FinancialsTable - Found single numeric value with key "${numericKeys[0]}":`, cellValue);
                      } else if (numericKeys.length > 1) {
                        // Try to find the most likely financial value
                        for (const numKey of numericKeys) {
                          if (numKey.toLowerCase().includes('2025') || numKey.toLowerCase().includes('mar') || 
                              numKey.toLowerCase().includes('current') || numKey.toLowerCase().includes('amount')) {
                            cellValue = item[numKey];
                            if (idx < 3) console.log(`FinancialsTable - Found likely financial value with key "${numKey}":`, cellValue);
                            break;
                          }
                        }
                        
                        // If still no match, use the first numeric value
                        if (!cellValue) {
                          cellValue = item[numericKeys[0]];
                          if (idx < 3) console.log(`FinancialsTable - Using first numeric value with key "${numericKeys[0]}":`, cellValue);
                        }
                      }
                    }
                  }
                  
                  // Handle object values that shouldn't be rendered directly
                  if (typeof cellValue === 'object' && cellValue !== null) {
                    // If it's an object with amount and description, extract the amount
                    if (cellValue.hasOwnProperty('amount') && cellValue.hasOwnProperty('description')) {
                      cellValue = cellValue.amount || 0;
                    } else if (cellValue.hasOwnProperty('value')) {
                      cellValue = cellValue.value;
                    } else {
                      // For other objects, try to extract a meaningful value or stringify
                      const numericKeys = Object.keys(cellValue).filter(k => 
                        typeof cellValue[k] === 'number' || !isNaN(parseFloat(cellValue[k]))
                      );
                      if (numericKeys.length === 1) {
                        cellValue = cellValue[numericKeys[0]];
                      } else {
                        cellValue = JSON.stringify(cellValue);
                      }
                    }
                  }
                  
                  // Handle undefined/null values
                  if (cellValue === undefined || cellValue === null) {
                    cellValue = isValueColumn ? '-' : '';
                  }
                  
                  // Format financial values
                  if (typeof cellValue === 'number' && isValueColumn) {
                    cellValue = formatCurrency(cellValue);
                  } else if (typeof cellValue === 'string' && isValueColumn && cellValue !== '-' && cellValue !== '') {
                    // Try to parse and format string numbers
                    const cleanValue = cellValue.replace(/[£$€,\s]/g, '');
                    if (!isNaN(parseFloat(cleanValue))) {
                      const numValue = parseFloat(cleanValue);
                      cellValue = formatCurrency(numValue);
                    }
                  }

                  return (
                    <td 
                      key={colIdx} 
                      className={`py-2.5 px-4 text-sm text-gray-900 ${
                        isItemColumn ? 'text-left font-medium' :
                        isValueColumn ? 'text-right' : 
                        colKey.toLowerCase().includes('note') ? 'text-center' : 'text-left'
                      } ${isTotalRow && isValueColumn ? 'border-t border-gray-400 font-bold' : ''}`}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.notes && data.notes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
          {data.notes.map((note: string, idx: number) => (
            <p key={idx} className="mb-1">{note}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to check if an item has financial values
const hasFinancialValues = (item: any, columns: string[]): boolean => {
  return columns.some(col => {
    const value = item[col];
    return typeof value === 'number' || 
           (typeof value === 'string' && !isNaN(Number(value.replace(/[^\d.-]/g, ''))));
  });
};

const renderFinancialSection = (data: Record<string, any>) => {
  if (!data || !data.lineItems) { // Columns might be implicitly defined by line item keys
    return <p>Financial data is not in the expected format.</p>;
  }

  // Similar dynamic column determination for Balance Sheet etc.
  const BS_COLUMN_ORDER = ['item', 'note', 'currentYear', 'previousYear']; // Or specific for BS
  
  let columnsToDisplay = data.columns || [];
  if (!columnsToDisplay.length && data.lineItems.length > 0) {
    const firstItemKeys = Object.keys(data.lineItems[0]);
    columnsToDisplay = BS_COLUMN_ORDER.filter(col => firstItemKeys.includes(col))
                         .concat(firstItemKeys.filter(col => !BS_COLUMN_ORDER.includes(col) && col !== 'category' && col !== 'isTotal' && col !== 'calculated' && col !== 'header'));
  }
  
  // Also check for specific year columns like "2023", "2022"
  let yearColumns: string[] = [];
  if (data.lineItems.length > 0) {
    const firstItem = data.lineItems[0];
    yearColumns = Object.keys(firstItem).filter(key => /^20\d{2}$/.test(key));
    // Add year columns if not already included
    yearColumns.forEach(year => {
      if (!columnsToDisplay.includes(year)) {
        columnsToDisplay.push(year);
      }
    });
  }
  
  if (!columnsToDisplay.length) {
    columnsToDisplay = ['Item', 'Note', 'Current Year', 'Previous Year'];
  }

  const columnHeaderMapping: Record<string, string> = {
    item: "Item",
    note: "Note",
    currentyear: "Current Year £", // ensure lowercase for matching
    previousyear: "Previous Year £", // ensure lowercase for matching
  };
  
  // Add year headers (2023, 2022, etc.)
  yearColumns.forEach(year => {
    columnHeaderMapping[year] = `${year}`;
  });

  return (
    <div className="my-4">      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            {columnsToDisplay.map((colKey: string, idx: number) => {
              const headerText = columnHeaderMapping[colKey.toLowerCase()] || colKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const isValueColumn = colKey.toLowerCase().includes('year') || /^20\d{2}$/.test(colKey);
               // Check if the column key (converted to lower case) is 'note'
              const isNoteColumn = colKey.toLowerCase() === 'note';
              // Specific width for note column, and default for others
              const thClass = isNoteColumn ? 'w-16' : isValueColumn ? 'w-40 text-right' : 'text-left';


              return (
                <th 
                  key={idx} 
                  className={`py-3 px-4 text-sm font-medium uppercase tracking-wider ${thClass}`}
                >
                  {headerText}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item: Record<string, any>, idx: number) => {
            const isTotalRow = item.isTotal || item.item?.toLowerCase().includes('net assets');
            const isHeaderRow = item.category === 'header';
            const isSubtotalRow = item.category === 'subtotal';
            let rowClass = "";
            if (isTotalRow) rowClass = "font-bold border-t-2 border-gray-700";
            else if (isSubtotalRow) rowClass = "font-semibold";
            else if (isHeaderRow) rowClass = "font-bold text-gray-700 bg-gray-100";


            if (isHeaderRow) {
              return (
                <tr key={idx} className={`hover:bg-gray-100 ${rowClass}`}>
                  <td 
                    colSpan={columnsToDisplay.length} 
                    className="py-2.5 px-4 text-sm text-gray-900 font-semibold uppercase tracking-wider"
                  >
                    {item.item}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={idx} className={`border-b border-gray-200 hover:bg-gray-50 ${rowClass}`}>
                {columnsToDisplay.map((colKey: string, colIdx: number) => {
                  let cellValue = item[colKey];
                  const isValueColumn = colKey.toLowerCase().includes('year') || /^20\d{2}$/.test(colKey);
                  
                  // Handle specific column mappings with proper case sensitivity
                  if (colKey === 'item' || colKey.toLowerCase() === 'item') {
                    cellValue = item.item || item.Item;
                  } else if (colKey === 'note' || colKey.toLowerCase() === 'note') {
                    cellValue = item.note || item.Note || '';
                  } else if (colKey === 'currentYear' || colKey.toLowerCase() === 'currentyear') {
                    cellValue = typeof item.currentYear === 'number' ? formatCurrency(item.currentYear) : (item.currentYear || '');
                  } else if (colKey === 'previousYear' || colKey.toLowerCase() === 'previousyear') {
                    cellValue = typeof item.previousYear === 'number' ? formatCurrency(item.previousYear) : (item.previousYear || '');
                  } else if (typeof item[colKey] === 'number' && isValueColumn) {
                    cellValue = formatCurrency(item[colKey]);
                  } else if (cellValue === undefined || cellValue === null) {
                    cellValue = '';
                  }

                  // Handle object values that shouldn't be rendered directly
                  if (typeof cellValue === 'object' && cellValue !== null) {
                    // If it's an object with amount and description, extract the amount
                    if (cellValue.hasOwnProperty('amount') && cellValue.hasOwnProperty('description')) {
                      cellValue = cellValue.amount || 0;
                      if (isValueColumn && typeof cellValue === 'number') {
                        cellValue = formatCurrency(cellValue);
                      }
                    } else {
                      // For other objects, stringify them or use a default value
                      cellValue = JSON.stringify(cellValue);
                    }
                  }

                  return (
                    <td 
                      key={colIdx} 
                      className={`py-2.5 px-4 text-sm text-gray-900 ${isValueColumn ? 'text-right' : 'text-left'} ${isTotalRow && isValueColumn ? 'border-t border-gray-400' : ''}`}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.notes && data.notes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
          {data.notes.map((note: string, idx: number) => (
            <p key={idx} className="mb-1">{note}</p>
          ))}
        </div>
      )}
    </div>
  );
};

const renderTrialBalance = (trialBalance: Record<string, any>) => {
  const elements: JSX.Element[] = [];

  if (trialBalance.companyName) {
    elements.push(
      <tr key="trialbalance-company-title">
        <td colSpan={2} className="pt-4 pb-2 px-6 text-xl font-semibold text-center">
          {trialBalance.companyName}
        </td>
      </tr>
    );
  }
  if (trialBalance.statementTitle) {
    elements.push(
      <tr key="trialbalance-statement-title">
        <td colSpan={2} className="pb-4 px-6 text-lg text-gray-700 text-center">
          {trialBalance.statementTitle}
        </td>
      </tr>
    );
  }

  if (trialBalance.accounts && Array.isArray(trialBalance.accounts)) {
    elements.push(
      <tr key="accounts-header">
        <td colSpan={2} className="py-2 px-6 font-medium text-gray-700 bg-gray-50 text-sm uppercase tracking-wide">
          ACCOUNTS
        </td>
      </tr>
    );
    elements.push(
      <tr key="accounts-subheader" className="bg-gray-100">
        <td className="py-2 px-6 font-medium text-gray-600 text-sm">Account Name</td>
        <td className="py-2 px-6 text-right font-medium text-gray-600 text-sm">Debit / Credit</td>
      </tr>
    );
    trialBalance.accounts.forEach((account: any, index: number) => {
      const debitAmount = account.debit || 0;
      const creditAmount = account.credit || 0;
      const displayAmount = debitAmount !== 0 ? `${formatValue(debitAmount, 'debit')} Dr` : `${formatValue(creditAmount, 'credit')} Cr`;
      elements.push(
        <tr key={`account-${index}`} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-2 px-8 text-gray-700 text-sm">{account.accountName}</td>
          <td className="py-2 px-6 text-right font-mono text-gray-900 font-semibold text-sm">
            {displayAmount}
          </td>
        </tr>
      );
    });
  }

  Object.entries(trialBalance).forEach(([key, value]) => {
    if (key !== 'accounts' && key !== 'companyName' && key !== 'statementTitle' && isPrimitive(value)) {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ').trim();
      elements.push(
        <tr key={key} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-3 px-6 font-medium text-gray-700">{displayKey}</td>
          <td className="py-3 px-6 text-right font-mono text-gray-900 font-semibold">
            {formatValue(value, key)}
          </td>
        </tr>
      );
    }
  });
  return elements;
};

const renderAgedReport = (agedData: Record<string, any>, reportTitle: string) => {
  const elements: JSX.Element[] = [];
  const itemsKey = agedData.suppliers ? 'suppliers' : agedData.customers ? 'customers' : null;

  if (agedData.companyName) {
    elements.push(
      <tr key={`${reportTitle.toLowerCase().replace(/\s+/g, '-')}-company-title`}>
        <td colSpan={2} className="pt-4 pb-2 px-6 text-xl font-semibold text-center">
          {agedData.companyName}
        </td>
      </tr>
    );
  }
  if (agedData.statementTitle) {
    elements.push(
      <tr key={`${reportTitle.toLowerCase().replace(/\s+/g, '-')}-statement-title`}>
        <td colSpan={2} className="pb-4 px-6 text-lg text-gray-700 text-center">
          {agedData.statementTitle}
        </td>
      </tr>
    );
  }

  if (itemsKey && Array.isArray(agedData[itemsKey])) {
    elements.push(
      <tr key={`${itemsKey}-header`}>
        <td colSpan={2} className="py-2 px-6 font-medium text-gray-700 bg-gray-50 text-sm uppercase tracking-wide">
          {itemsKey.toUpperCase()}
        </td>
      </tr>
    );
    agedData[itemsKey].forEach((item: any, index: number) => {
      const name = item.supplierName || item.customerName || `Item ${index + 1}`;
      elements.push(
        <tr key={`${itemsKey}-${index}-name`} className="bg-gray-50">
          <td colSpan={2} className="py-2 px-6 font-medium text-gray-600 text-sm">
            {name}
          </td>
        </tr>
      );
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'supplierName' && key !== 'customerName' && isPrimitive(value)) {
          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ').replace(/days/g, ' Days').replace(/over90/g, 'Over 90').trim();
          elements.push(
            <tr key={`${itemsKey}-${index}-${key}`} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
              <td className="py-2 px-8 text-gray-600 text-sm">{displayKey}</td>
              <td className="py-2 px-6 text-right font-mono text-gray-900 font-semibold text-sm">
                {formatValue(value, key)}
              </td>
            </tr>
          );
        }
      });
    });
  }

  if (agedData.totals && typeof agedData.totals === 'object') {
    elements.push(
      <tr key="totals-header">
        <td colSpan={2} className="py-2 px-6 font-medium text-gray-700 bg-gray-50 text-sm uppercase tracking-wide">
          TOTALS
        </td>
      </tr>
    );
    Object.entries(agedData.totals).forEach(([key, value]) => {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ').replace(/days/g, ' Days').replace(/over90/g, 'Over 90').trim();
      elements.push(
        <tr key={`totals-${key}`} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-3 px-6 font-medium text-gray-700">{displayKey}</td>
          <td className="py-3 px-6 text-right font-mono text-gray-900 font-semibold">
            {formatValue(value, key)}
          </td>
        </tr>
      );
    });
  }

  Object.entries(agedData).forEach(([key, value]) => {
    if (key !== itemsKey && key !== 'totals' && key !== 'companyName' && key !== 'statementTitle' && isPrimitive(value)) {
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ').trim();
      elements.push(
        <tr key={key} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-3 px-6 font-medium text-gray-700">{displayKey}</td>
          <td className="py-3 px-6 text-right font-mono text-gray-900 font-semibold">
            {formatValue(value, key)}
          </td>
        </tr>
      );
    }
  });
  return elements;
};

// Special handling for structured financial data
const renderStructuredFinancialData = (data: Record<string, any>) => {
  const sections: JSX.Element[] = [];

  // Handle Profit & Loss data
  if (data.profitAndLoss) {
    sections.push(
      <CollapsibleSection 
        key="profit-loss"
        title="Profit & Loss"
        icon={<TrendingUp className="h-4 w-4" />}
        color="from-green-600 to-green-500"
      >
        {renderDynamicFinancialData(data.profitAndLoss)}
      </CollapsibleSection>
    );
  } else if (data.statementTitle && data.statementTitle.toLowerCase().includes('profit and loss')) {
    // Fallback for P&L data directly at the root
     sections.push(
      <CollapsibleSection 
        key="profit-loss-root"
        title="Profit & Loss"
        icon={<TrendingUp className="h-4 w-4" />}
        color="from-green-600 to-green-500"
      >
        {renderDynamicFinancialData(data)}
      </CollapsibleSection>
    );
  }


  // Handle Balance Sheet data
  if (data.balanceSheet) {
    sections.push(
      <CollapsibleSection 
        key="balance-sheet"
        title="Balance Sheet"
        icon={<BarChart3 className="h-4 w-4" />}
        color="from-blue-600 to-blue-500"
      >
        {renderFinancialSection(data.balanceSheet)}
      </CollapsibleSection>
    );
  } else if (data.statementTitle && data.statementTitle.toLowerCase().includes('balance sheet')) {
    // Fallback for Balance Sheet data directly at the root
    sections.push(
      <CollapsibleSection 
        key="balance-sheet-root"
        title="Balance Sheet"
        icon={<BarChart3 className="h-4 w-4" />}
        color="from-blue-600 to-blue-500"
      >
        {renderFinancialSection(data)}
      </CollapsibleSection>
    );
  }

  // Handle Trial Balance data
  if (data.trialBalance) {
    sections.push(
      <CollapsibleSection 
        key="trial-balance"
        title="Trial Balance"
        icon={<FileText className="h-4 w-4" />}
        color="from-purple-600 to-purple-500"
      >
        {renderTrialBalance(data.trialBalance)}
      </CollapsibleSection>
    );
  }

  // Handle Aged Payables data
  if (data.agedPayables) {
    sections.push(
      <CollapsibleSection 
        key="aged-payables"
        title="Aged Payables"
        icon={<PoundSterling className="h-4 w-4" />}
        color="from-red-600 to-red-500"
      >
        {renderAgedReport(data.agedPayables, "Aged Payables")}
      </CollapsibleSection>
    );
  }

  // Handle Aged Receivables data
  if (data.agedReceivables) {
    sections.push(
      <CollapsibleSection 
        key="aged-receivables"
        title="Aged Receivables"
        icon={<PoundSterling className="h-4 w-4" />}
        color="from-orange-600 to-orange-500"
      >
        {renderAgedReport(data.agedReceivables, "Aged Receivables")}
      </CollapsibleSection>
    );
  }
  
  // If no specific sections were rendered but it looks like a P&L or BS at root
  if (sections.length === 0 && data.lineItems && data.columns && data.statementTitle) {
    if (data.statementTitle.toLowerCase().includes('profit and loss')) {
      sections.push(
        <CollapsibleSection 
          key="profit-loss-direct"
          title="Profit & Loss"
          icon={<TrendingUp className="h-4 w-4" />}
          color="from-green-600 to-green-500"
        >
          {renderDynamicFinancialData(data)}
        </CollapsibleSection>
      );
    } else if (data.statementTitle.toLowerCase().includes('balance sheet')) {
       sections.push(
        <CollapsibleSection 
          key="balance-sheet-direct"
          title="Balance Sheet"
          icon={<BarChart3 className="h-4 w-4" />}
          color="from-blue-600 to-blue-500"
        >
          {renderFinancialSection(data)}
        </CollapsibleSection>
      );
    }
  }


  return sections;
};


const renderRows = (obj: Record<string, any>, parentKey = "", level = 0) => {
  if (!obj) {
    return [<tr key="error"><td colSpan={2} className="py-4 px-6 text-center text-gray-500 italic">No data available</td></tr>];
  }
  
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return [
        <tr key="error">
          <td colSpan={2} className="py-4 px-6 text-center text-red-500">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <span>Error parsing data: {String(e)}</span>
            </div>
          </td>
        </tr>
      ];
    }
  }
  
  if (!obj || typeof obj !== 'object') {
    return [
      <tr key="error">
        <td colSpan={2} className="py-4 px-6 text-center text-red-500">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span>Invalid data format: expected object, got {typeof obj}</span>
          </div>
        </td>
      </tr>
    ];
  }

  const isStructuredFinancialData = obj.profitAndLoss || obj.balanceSheet || obj.trialBalance || 
    obj.agedPayables || obj.agedReceivables || (obj.lineItems && obj.statementTitle && obj.columns);
  
  if (isStructuredFinancialData) {
    const structuredSections = renderStructuredFinancialData(obj);
    if (structuredSections.length > 0) {
        return structuredSections;
    }
  }

  return Object.entries(obj).map(([key, value]) => {
    if (['summary', 'metadata', 'json', 'description', 'content', 'fileName', 'pages', 'analysisMethod'].includes(key) || 
        key.toLowerCase().includes('summary') ||
        key.toLowerCase().includes('description') ||
        parentKey.toLowerCase().includes('summary')) {
      return null;
    }

    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ').trim();

    if (isPrimitive(value)) {
      return (
        <tr key={parentKey + key} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-3 px-6 font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${level === 0 ? 'from-blue-400 to-purple-500' : 'from-gray-300 to-gray-400'}`}></div>
              <span>{displayKey}</span>
            </div>
          </td>
          <td className="py-3 px-6 text-right font-mono text-gray-900 font-semibold">
            {formatValue(value, key)}
          </td>
        </tr>
      );
    } else if (typeof value === "object" && value !== null) {
      const isArray = Array.isArray(value);
      const isEmpty = Object.keys(value).length === 0;
      if (isEmpty) return null;

      return (
        <React.Fragment key={parentKey + key}>
          <CollapsibleSection
            title={`${displayKey} ${isArray ? `(${Object.keys(value).length} items)` : ''}`}
            icon={<FileText className="h-4 w-4" />}
            color="from-[#ff8000] to-[#ff6b35]" // A distinct color for generic nested objects
            defaultExpanded={level === 0}
          >
            {renderRows(value, parentKey + key + ".", level + 1)}
          </CollapsibleSection>
        </React.Fragment>
      );
    } else {
      return null;
    }
  });
};

export const FinancialsTable: React.FC<FinancialsTableProps> = ({ data, title: mainTitle, summary }) => {

  
  if (!data) {
    return <p className="text-center text-gray-500 italic py-8">No financial data available to display.</p>;
  }
  
  // Attempt to parse if data is a string (JSON)
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      return <p className="text-center text-red-500 py-8">Error: Could not parse financial data.</p>;
    }
  }


  // Extract filename and page count if available at the top level
  const fileName = parsedData.fileName;
  const pages = parsedData.pages;

  // Determine the actual data to render (could be nested under 'json')
  const dataToRender = parsedData.json || parsedData;
  
 
  
  // Check if this is structured financial data that should be rendered directly
  const isStructuredFinancialData = dataToRender.profitAndLoss || dataToRender.balanceSheet || dataToRender.trialBalance || 
    dataToRender.agedPayables || dataToRender.agedReceivables || (dataToRender.lineItems && Array.isArray(dataToRender.lineItems));


  // For structured financial data, render directly without collapsible sections
  if (isStructuredFinancialData) {
    return (
      <div className="bg-white my-8">
        {/* Render structured financial data directly */}
        <div className="space-y-8">
          {dataToRender.profitAndLoss && (
            <div>
              <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {dataToRender.profitAndLoss.statementTitle || "Profit and Loss Account"}
                </h3>
              </div>
              {renderDynamicFinancialData(dataToRender.profitAndLoss)}
            </div>
          )}
          {dataToRender.balanceSheet && (
            <div>
              <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800">
                  {dataToRender.balanceSheet.statementTitle || "Balance Sheet"}
                </h3>
              </div>
              {renderDynamicFinancialData(dataToRender.balanceSheet)}
            </div>
          )}
          {dataToRender.trialBalance && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Trial Balance</h3>
              <table className="w-full">
                <tbody>{renderTrialBalance(dataToRender.trialBalance)}</tbody>
              </table>
            </div>
          )}
          {dataToRender.agedPayables && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aged Payables</h3>
              <table className="w-full">
                <tbody>{renderAgedReport(dataToRender.agedPayables, "Aged Payables")}</tbody>
              </table>
            </div>
          )}
          {dataToRender.agedReceivables && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aged Receivables</h3>
              <table className="w-full">
                <tbody>{renderAgedReport(dataToRender.agedReceivables, "Aged Receivables")}</tbody>
              </table>
            </div>
          )}
          {/* Handle direct financial data (not nested under profitAndLoss/balanceSheet) */}
          {!dataToRender.profitAndLoss && !dataToRender.balanceSheet && dataToRender.lineItems && Array.isArray(dataToRender.lineItems) && (
            renderDynamicFinancialData(dataToRender)
          )}
          
          {/* Show diagnostic info if no financial data sections are available */}
          {!dataToRender.profitAndLoss && !dataToRender.balanceSheet && !dataToRender.trialBalance && 
           !dataToRender.agedPayables && !dataToRender.agedReceivables && 
           (!dataToRender.lineItems || (Array.isArray(dataToRender.lineItems) && dataToRender.lineItems.length === 0)) && (
            <div className="text-center py-8">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-lg mx-auto">
                <div className="flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-amber-800 mb-2">Document Processed Successfully</h3>
                <p className="text-sm text-amber-700 mb-3">
                  The document was processed but no structured financial data could be extracted.
                </p>
                <div className="bg-white rounded-md p-3 text-xs text-left space-y-1">
                  <p><strong>Document Type:</strong> {dataToRender.documentType || 'Unknown'}</p>
                  {dataToRender.companyName && <p><strong>Company:</strong> {dataToRender.companyName}</p>}
                  {dataToRender.period && <p><strong>Period:</strong> {dataToRender.period}</p>}
                  {fileName && <p><strong>File:</strong> {fileName} {pages && `(${pages} pages)`}</p>}
                  <p><strong>Currency:</strong> {dataToRender.currency || 'Not specified'}</p>
                </div>
                <div className="mt-4 text-xs text-amber-600">
                  <p className="mb-2">This may happen with scanned documents, non-standard formats, or documents without tabular financial data.</p>
                  <p className="font-medium">Try:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Uploading a text-based PDF or Excel file</li>
                    <li>Ensuring the document contains clear financial tables</li>
                    <li>Using a different document format if available</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to the original table rendering for unstructured data
  const documentTitle = dataToRender.statementTitle || mainTitle || "Financial Document Analysis";

  return (
    <div className="bg-white shadow-xl rounded-lg overflow-hidden my-8 p-6 border border-gray-200">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{documentTitle}</h1>
        {fileName && <p className="text-sm text-gray-500">File: {fileName} {pages && `(${pages} pages)`}</p>}
        {summary && <p className="text-sm text-gray-600 mt-1">{summary}</p>}
      </div>

      <table className="w-full min-w-full divide-y divide-gray-200">
        <tbody className="bg-white divide-y divide-gray-200">
          {renderRows(dataToRender)}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialsTable;
