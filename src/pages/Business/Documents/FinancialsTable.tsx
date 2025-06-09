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
  if (!data || !data.lineItems) {
    console.error("Missing lineItems in financial data:", data);
    return <p>Financial data is not in the expected format.</p>;
  }

  console.log("Dynamic Financial Data received:", JSON.stringify(data, null, 2));

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

  console.log("Dynamic columns to display:", columnsToDisplay);
  console.log("First line item keys:", data.lineItems.length > 0 ? Object.keys(data.lineItems[0]) : 'No items');
  console.log("Sample line item:", data.lineItems.length > 0 ? data.lineItems[0] : 'No items');
  
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
    const financialTerms = ['year', 'amount', 'value', 'balance', 'total', 'debit', 'credit', 'current', 'previous'];
    return financialTerms.some(term => key.includes(term)) || /^20\d{2}$/.test(colKey);
  };

  return (
    <div className="my-4">
      {data.companyName && <h3 className="text-xl font-semibold text-center mb-1">{data.companyName}</h3>}
      {data.statementTitle && <h4 className="text-lg text-gray-700 text-center mb-4">{data.statementTitle}</h4>}
      {data.period && <p className="text-sm text-gray-600 text-center mb-4">{data.period}</p>}
      
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
                    className="py-2.5 px-4 text-sm font-semibold uppercase tracking-wider"
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
                  
                  // Handle different data access patterns
                  if (colKey.toLowerCase() === 'item') {
                    cellValue = item.item || item.description || item.account || item.name || item.lineItem || '';
                  } else if (colKey.toLowerCase().includes('note') || colKey.toLowerCase().includes('ref')) {
                    cellValue = item.note || item.notes || item.reference || item.ref || '';
                  } else if (!cellValue) {
                    // Try to find the value using different case variations
                    const possibleKeys = [colKey, colKey.toLowerCase(), colKey.toUpperCase()];
                    for (const key of possibleKeys) {
                      if (item[key] !== undefined && item[key] !== null) {
                        cellValue = item[key];
                        break;
                      }
                    }
                  }
                  
                  // Handle object values that shouldn't be rendered directly
                  if (typeof cellValue === 'object' && cellValue !== null) {
                    // If it's an object with amount and description, extract the amount
                    if (cellValue.hasOwnProperty('amount') && cellValue.hasOwnProperty('description')) {
                      cellValue = cellValue.amount || 0;
                    } else {
                      // For other objects, stringify them or use a default value
                      cellValue = JSON.stringify(cellValue);
                    }
                  }
                  
                  // Format financial values
                  if (typeof cellValue === 'number' && isValueColumn) {
                    cellValue = formatCurrency(cellValue);
                  } else if (cellValue === undefined || cellValue === null || cellValue === '') {
                    cellValue = isValueColumn ? '-' : '';
                  } else if (typeof cellValue === 'string' && isValueColumn && !isNaN(Number(cellValue.replace(/[^\d.-]/g, '')))) {
                    // Handle string numbers
                    const numValue = Number(cellValue.replace(/[^\d.-]/g, ''));
                    cellValue = formatCurrency(numValue);
                  }

                  return (
                    <td 
                      key={colIdx} 
                      className={`py-2.5 px-4 text-sm ${
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
      {data.companyName && <h3 className="text-xl font-semibold text-center mb-1">{data.companyName}</h3>}
      {data.statementTitle && <h4 className="text-lg text-gray-700 text-center mb-4">{data.statementTitle}</h4>}
      
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
                    className="py-2.5 px-4 text-sm font-semibold uppercase tracking-wider"
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
                      className={`py-2.5 px-4 text-sm ${isValueColumn ? 'text-right' : 'text-left'} ${isTotalRow && isValueColumn ? 'border-t border-gray-400' : ''}`}
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
      console.error("Failed to parse string as JSON:", e);
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
    console.error("Expected object, got:", typeof obj);
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
  console.log("FinancialsTable received data:", data);
  console.log("FinancialsTable received title:", mainTitle);
  console.log("FinancialsTable received summary:", summary);
  
  if (!data) {
    return <p className="text-center text-gray-500 italic py-8">No financial data available to display.</p>;
  }
  
  // Attempt to parse if data is a string (JSON)
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error("Error parsing main data prop:", e);
      return <p className="text-center text-red-500 py-8">Error: Could not parse financial data.</p>;
    }
  }

  console.log("Parsed data:", parsedData);

  // Extract filename and page count if available at the top level
  const fileName = parsedData.fileName;
  const pages = parsedData.pages;

  // Determine the actual data to render (could be nested under 'json')
  const dataToRender = parsedData.json || parsedData;
  
  console.log("Data to render:", dataToRender);
  console.log("Type of dataToRender:", typeof dataToRender);
  
  // Check if this is structured financial data that should be rendered directly
  const isStructuredFinancialData = dataToRender.profitAndLoss || dataToRender.balanceSheet || dataToRender.trialBalance || 
    dataToRender.agedPayables || dataToRender.agedReceivables || (dataToRender.lineItems && Array.isArray(dataToRender.lineItems));

  console.log("Is structured financial data:", isStructuredFinancialData);
  console.log("Has profitAndLoss:", !!dataToRender.profitAndLoss);
  console.log("Has balanceSheet:", !!dataToRender.balanceSheet);
  console.log("Has lineItems:", !!dataToRender.lineItems);
  console.log("LineItems is array:", Array.isArray(dataToRender.lineItems));
  console.log("Has statementTitle:", !!dataToRender.statementTitle);

  // For structured financial data, render directly without collapsible sections
  if (isStructuredFinancialData) {
    return (
      <div className="bg-white my-8">
        {/* Header section with title */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {dataToRender.profitAndLoss && dataToRender.balanceSheet ? 
                "Financial Statements" : 
                "Profit and Loss Financial Data"}
            </h1>
            {fileName && <p className="text-sm text-gray-500">File: {fileName} {pages && `(${pages} pages)`}</p>}
            {summary && <p className="text-sm text-gray-600 mt-1">{summary}</p>}
          </div>
        </div>

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
