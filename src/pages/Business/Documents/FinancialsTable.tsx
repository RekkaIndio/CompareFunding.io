import React from "react";

interface FinancialsTableProps {
  data: Record<string, any> | null;
  title?: string;
  summary?: string;
}

// Function to format numbers as currency or with proper formatting
const formatValue = (value: any, key: string): string => {
  // Fixed key terms that should always be formatted as currency
  const financialTerms = [
    'sales', 'turnover', 'revenue', 'cost', 'expense', 'profit', 'asset', 
    'liability', 'equity', 'balance', 'income', 'total', 'capital', 'tax', 'ebitda'
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

const renderRows = (obj: Record<string, any>, parentKey = "", level = 0) => {
  if (!obj) {
    return [<tr key="error"><td colSpan={2}>No data available</td></tr>];
  }
  
  // Handle the case where we have stringified JSON
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      console.error("Failed to parse string as JSON:", e);
      return [<tr key="error"><td colSpan={2}>Error parsing data: {String(e)}</td></tr>];
    }
  }
  
  // Safety check - ensure obj is actually an object
  if (!obj || typeof obj !== 'object') {
    console.error("Expected object, got:", typeof obj);
    return [<tr key="error"><td colSpan={2}>Invalid data format: expected object, got {typeof obj}</td></tr>];
  }

  return Object.entries(obj).map(([key, value]) => {
    // Enhanced filtering: Skip summary, metadata and any fields that should be displayed elsewhere
    if (['summary', 'metadata', 'json', 'description'].includes(key) || 
        key.toLowerCase().includes('summary') ||
        key.toLowerCase().includes('description') ||
        parentKey.toLowerCase().includes('summary')) {
      return null;
    }

    // Convert key from camelCase to Title Case for display
    const displayKey = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();

    if (isPrimitive(value)) {
      return (
        <tr key={parentKey + key} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
          <td className="py-3 px-6 font-medium text-gray-700">{displayKey}</td>
          <td className="py-3 px-6 text-right font-mono text-gray-900 font-semibold">
            {formatValue(value, key)}
          </td>
        </tr>
      );
    } else if (typeof value === "object" && value !== null) {
      const isArray = Array.isArray(value);
      const isEmpty = Object.keys(value).length === 0;

      // Skip empty objects/arrays
      if (isEmpty) return null;

      return (
        <React.Fragment key={parentKey + key}>
          <tr>
            <td 
              colSpan={2} 
              className={`py-3 px-6 font-semibold text-white bg-gradient-to-r from-[#ff8000] to-[#ff6b35] ${level === 0 ? 'uppercase tracking-wide text-sm' : 'text-sm'}`}
            >
              {displayKey} {isArray ? `(${Object.keys(value).length} items)` : ''}
            </td>
          </tr>
          {renderRows(value, parentKey + key + ".", level + 1)}
        </React.Fragment>
      );
    } else {
      return null;
    }
  });
};

export const FinancialsTable: React.FC<FinancialsTableProps> = ({ data, title, summary }) => {
  // If there's no data to display
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-gray-500 italic text-center">
        No financial data available. Try uploading a different document.
      </div>
    );
  }
  
  // Try to handle different data structures we might receive
  let displayData = data;
  
  // Handle nested JSON structures from OpenAI responses
  if (data && typeof data === 'object') {
    // Case 1: data has a json property that's an object
    if (data.json && typeof data.json === 'object') {
      displayData = data.json;
      
      // Check for nested json structure like {"json": {"json": { actual data }}}
      if (displayData.json && typeof displayData.json === 'object') {
        displayData = displayData.json;
      }
    }
    // Case 2: data has a json property that's a string (serialized JSON)
    else if (data.json && typeof data.json === 'string') {
      try {
        displayData = JSON.parse(data.json);
        
        // Check for nested json structure after parsing
        if (displayData.json && typeof displayData.json === 'object') {
          displayData = displayData.json;
        }
      } catch (e) {
        console.error("Failed to parse JSON string:", e);
      }
    }
  }
  
  // Handle case where entire data is a string
  if (typeof displayData === 'string') {
    try {
      displayData = JSON.parse(displayData);
    } catch (e) {
      console.error("Failed to parse data as JSON string:", e);
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-bold">Error</p>
          <p>Unable to parse financial data. The data may be malformed.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">View raw data</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
  }

  // Remove summary fields at the top level to avoid duplication
  if (displayData && typeof displayData === 'object') {
    // Create a clean copy without summary fields
    const cleanData = { ...displayData };
    
    // Remove summary fields with various possible naming conventions
    if ('summary' in cleanData) delete cleanData.summary;
    if ('Summary' in cleanData) delete cleanData.Summary;
    if ('financialSummary' in cleanData) delete cleanData.financialSummary;
    if ('businessSummary' in cleanData) delete cleanData.businessSummary;
    if ('companySummary' in cleanData) delete cleanData.companySummary;
    
    // Also remove any json fields to avoid nesting confusion
    if ('json' in cleanData) delete cleanData.json;
    
    displayData = cleanData;
  }
  
  // One final check to ensure we're not displaying "json" properties in our data table
  if (displayData && typeof displayData === 'object' && 'json' in displayData) {
    displayData = displayData.json;
  }
  
  return (
    <div className="overflow-x-auto my-4">
      {title && (
        <div className="mb-4">
          <h3 className="font-bold text-xl text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
      )}
      
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
        {/* Gradient header bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
        
        <table className="min-w-[350px] w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gradient-to-r from-[#212936] to-[#2c3c53]">
              <th className="py-4 px-6 text-left font-semibold text-white">Metric</th>
              <th className="py-4 px-6 text-right font-semibold text-white">Value</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {renderRows(displayData)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialsTable;
