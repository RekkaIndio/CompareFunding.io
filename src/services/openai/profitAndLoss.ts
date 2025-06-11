import OpenAI, { OpenAIError } from "openai";
import * as pdfjsLib from 'pdfjs-dist';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Set up PDF.js worker to match library version
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface FinancialDataResult {
  json: any;
  summary: string;
}

// Convert ArrayBuffer to Base64 safely in chunks
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 1024;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Convert PDF pages to Base64 images
async function convertPDFToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    if (!ctx) throw new Error('Canvas context error');
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png').split(',')[1]);
  }
  return images;
}

// Build a flexible extraction prompt that adapts to different financial document structures
function getPrompt(pageCount: number): string {
  return `You are a financial data extraction specialist analyzing a ${pageCount}-page financial document. 

CRITICAL MISSION: Extract ALL numerical values and line items from financial tables. The document contains financial data with REAL NUMBERS that must be extracted as actual numeric values, not text or empty fields.

URGENT NUMBER EXTRACTION RULES:
1. Look for financial tables with columns like "2023", "2022", "Current Year", "Previous Year"
2. Extract EVERY number you see - revenue amounts, expense amounts, asset values, liability amounts
3. Convert text numbers like "9,860,854" to actual numbers: 9860854
4. Convert parentheses like "(7,622,268)" to negative numbers: -7622268
5. Remove commas and currency symbols, return pure numbers
6. DO NOT return empty strings, null, or zero for fields that contain actual numbers in the document
7. If you see a number in the table, extract it as a number type, not a string

IMPORTANT: Extract ALL financial data from EVERY page. Many financial documents contain BOTH Profit & Loss AND Balance Sheet statements. Analyze all pages and extract both sections when present.

EXAMPLE FOR PROFIT & LOSS + BALANCE SHEET DOCUMENT (note the numbers are actual numeric values):
{
  "documentType": "mixed_financial",
  "companyName": "Opogo Limited",
  "statementTitle": "Full Accounts",
  "period": "Year ended 31 August 2023",
  "currency": "GBP",
  "profitAndLoss": {
    "statementTitle": "Profit and Loss Account for the Year Ended 31 August 2023",
    "columns": ["item", "note", "2023", "2022"],
    "lineItems": [
      {
        "item": "Turnover",
        "note": "",
        "2023": 9860854,
        "2022": 5978396,
        "category": "revenue"
      },
      {
        "item": "Cost of sales", 
        "note": "",
        "2023": -7622268,
        "2022": -4482232,
        "category": "expense"
      },
      {
        "item": "Gross profit",
        "note": "",
        "2023": 2238586,
        "2022": 1496164,
        "category": "subtotal"
      }
    ]
  },
  "balanceSheet": {
    "statementTitle": "Balance Sheet as at 31 August 2023",
    "columns": ["item", "note", "2023", "2022"],
    "lineItems": [
      {
        "item": "Intangible assets",
        "note": "5",
        "2023": 47173,
        "2022": 47173,
        "category": "asset"
      },
      {
        "item": "Tangible assets",
        "note": "6", 
        "2023": 12719,
        "2022": 17477,
        "category": "asset"
      }
    ]
  }
}

FOR SINGLE STATEMENT DOCUMENTS:
{
  "documentType": "profit_and_loss" | "balance_sheet" | "aged_payables" | "aged_receivables",
  "companyName": "Exact company name",
  "statementTitle": "Exact statement title",
  "period": "Exact period",
  "currency": "GBP",
  "columns": ["item", "currentYear", "previousYear"], // Use actual column names
  "lineItems": [
    {
      "item": "Line item name",
      "note": "Note reference",
      "currentYear": 1234567,  // MUST include actual numbers
      "previousYear": 987654,
      "category": "revenue" | "expense" | "asset" | "liability" | "equity"
    }
  ]
}

CRITICAL RULES:
- NEVER return zero or null for values that exist in the document
- Extract EVERY number you can see in financial tables
- Use negative numbers for expenses (not parentheses)
- Include ALL line items, even section headers
- Extract exact column names (years, periods) as they appear
- Categories: "revenue", "expense", "asset", "liability", "equity", "header", "subtotal", "total"
- If a cell appears empty or has a dash (-), use 0 as the value
- For aged reports, include ALL aging buckets (current, 30 days, 60 days, etc.)

CRITICAL OUTPUT REQUIREMENTS:
1. You MUST return valid JSON only - no explanatory text before or after
2. Every lineItem must have an "item" field with the description
3. Every numerical column (years, amounts) must contain actual numbers, not strings
4. Use 0 for empty cells, not null or undefined
5. Include all rows from the financial tables
6. Preserve the exact column headers as they appear in the document

EXAMPLE OUTPUT VALIDATION:
- ✅ "2023": 1234567 (number)
- ❌ "2023": "1,234,567" (string)
- ❌ "2023": null (null)
- ✅ "2023": 0 (for empty cells)

ABSOLUTE REQUIREMENT: Return ONLY valid JSON. No text before or after the JSON structure.`;
}

export async function analyzeFinancialDocument(
  file: File
): Promise<FinancialDataResult> {
  const openaiClient = new OpenAI({
    apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  let pageCount = 1;

  const messages: ChatCompletionMessageParam[] = [
    { 
      role: 'system', 
      content: 'You are a financial data extraction expert. Your mission is to extract ALL numerical values from financial tables and statements. Focus on getting every number - revenue, expenses, assets, liabilities, etc. Convert parentheses like (1,234) to negative numbers like -1234. Return structured JSON with all financial data.' 
    }
  ];
  
  if (file.type === 'application/pdf') {
    const images = await convertPDFToImages(file);
    pageCount = images.length;
    
    // The content must be an array for multimodal messages
    let content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [];
    
    // Add the prompt as text content
    content.push({ 
      type: 'text', 
      text: getPrompt(pageCount) 
    });
    
    // Add each page as an image
    images.forEach((img, idx) => {
      content.push({ 
        type: 'text', 
        text: `--- PAGE ${idx + 1} of ${pageCount} ---` 
      });
      
      content.push({ 
        type: 'image_url', 
        image_url: { 
          url: `data:image/png;base64,${img}`, 
          detail: 'high' 
        } 
      });
    });
    
    // Add the content array to the messages
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else if (file.type.startsWith('image/')) {
    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    
    // For image files, create the content array
    const content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [
      { 
        type: 'text', 
        text: getPrompt(1) 
      },
      { 
        type: 'image_url', 
        image_url: { 
          url: `data:${file.type};base64,${b64}`, 
          detail: 'high' 
        } 
      }
    ];
    
    // Add the content array to the messages
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else {
    throw new Error('Unsupported file type');
  }
  
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4.1',
    messages,
    temperature: 0.1,
    max_tokens: 8000, // Increased token limit for more complex extractions
  });
  const content = completion.choices[0].message.content;
  if (!content) throw new Error('Empty OpenAI response');
  
  console.log('Raw OpenAI response:', content);
  console.log('Response length:', content.length);
  
  // Parse JSON from response with robust error handling
  let parsed;
  try {
    parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    console.log('Successfully parsed OpenAI response:', parsed);
    console.log('Parsed response keys:', Object.keys(parsed));
    console.log('Parsed response type:', typeof parsed);
    
    // Log the structure to help with debugging
    if (parsed.lineItems) {
      console.log('Direct lineItems found:', parsed.lineItems.length, 'items');
      if (parsed.lineItems.length > 0) {
        console.log('First lineItem sample:', parsed.lineItems[0]);
        console.log('First lineItem keys:', Object.keys(parsed.lineItems[0]));
      }
    }
    if (parsed.profitAndLoss?.lineItems) {
      console.log('P&L lineItems found:', parsed.profitAndLoss.lineItems.length, 'items');
      if (parsed.profitAndLoss.lineItems.length > 0) {
        console.log('First P&L item sample:', parsed.profitAndLoss.lineItems[0]);
        console.log('First P&L item keys:', Object.keys(parsed.profitAndLoss.lineItems[0]));
      }
    }
    if (parsed.balanceSheet?.lineItems) {
      console.log('BS lineItems found:', parsed.balanceSheet.lineItems.length, 'items');
      if (parsed.balanceSheet.lineItems.length > 0) {
        console.log('First BS item sample:', parsed.balanceSheet.lineItems[0]);
        console.log('First BS item keys:', Object.keys(parsed.balanceSheet.lineItems[0]));
      }
    }
    
    // Log all numerical values found in the response
    const logNumericalValues = (obj: any, path = '') => {
      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'number') {
            console.log(`Found number at ${currentPath}:`, value);
          } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
            console.log(`Found string number at ${currentPath}:`, value);
          } else if (typeof value === 'object' && value !== null) {
            logNumericalValues(value, currentPath);
          }
        });
      }
    };
    
    logNumericalValues(parsed, 'root');
  } catch (e) {
    console.log('Initial JSON parse failed, attempting to clean and retry:', e);
    console.log('Raw content:', content);
    
    // Extract JSON block from response
    const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If we can't find JSON, try a retry with more specific instructions
      console.log('No JSON found, attempting retry with enhanced prompt...');
      return await retryExtractionWithEnhancedPrompt(openaiClient, messages, file, pageCount);
    }
    
    let jsonStr = jsonMatch[0];
    console.log('Extracted JSON string:', jsonStr);
    
    // Apply multiple cleanup strategies
    jsonStr = cleanMalformedJSON(jsonStr);
    
    try {
      parsed = JSON.parse(jsonStr);
      console.log('Successfully parsed cleaned JSON');
    } catch (secondError) {
      console.error('Failed to parse even after cleanup:', secondError);
      console.log('Final JSON string:', jsonStr);
      
      // Last resort: try to extract key data manually
      parsed = extractDataManually(jsonStr);
      if (!parsed) {
        throw new Error(`Failed to parse JSON after all cleanup attempts: ${secondError}`);
      }
    }
  }
  
  // Validate that we have meaningful data
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI returned invalid data structure');
  }
  
  // Ensure we have at least some basic structure
  if (!parsed.lineItems && !parsed.profitAndLoss && !parsed.balanceSheet && !parsed.trialBalance && !parsed.agedPayables && !parsed.agedReceivables) {
    console.warn('No structured financial data found, creating minimal structure');
    console.log('Available parsed keys:', Object.keys(parsed));
    
    // Try to extract any available financial data from the parsed result
    const extractedLineItems: any[] = [];
    
    // Look for any numerical data in the parsed object
    const extractNumbers = (obj: any, prefix = '') => {
      if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
            extractedLineItems.push({
              item: prefix ? `${prefix} - ${key}` : key,
              value: typeof value === 'number' ? value : parseFloat(value),
              category: 'other'
            });
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            extractNumbers(value, key);
          }
        });
      }
    };
    
    extractNumbers(parsed);
    
    parsed = {
      documentType: parsed.documentType || 'financial_statement',
      companyName: parsed.companyName || 'Unknown Company',
      currency: parsed.currency || 'GBP',
      lineItems: extractedLineItems.length > 0 ? extractedLineItems : [],
      columns: extractedLineItems.length > 0 ? ['item', 'value'] : ['item'],
      notes: extractedLineItems.length === 0 ? ['No structured financial data could be extracted from this document'] : []
    };
    
    console.log('Created minimal structure with extracted data:', parsed);
  }
  
  // Add debugging information about what was extracted
  console.log('Final parsed result structure:');
  console.log('- Document type:', parsed.documentType);
  console.log('- Company name:', parsed.companyName);
  console.log('- Has lineItems:', !!parsed.lineItems);
  console.log('- LineItems count:', parsed.lineItems?.length || 0);
  console.log('- Has profitAndLoss:', !!parsed.profitAndLoss);
  console.log('- P&L lineItems count:', parsed.profitAndLoss?.lineItems?.length || 0);
  console.log('- Has balanceSheet:', !!parsed.balanceSheet);
  console.log('- BS lineItems count:', parsed.balanceSheet?.lineItems?.length || 0);
  
  console.log('Final parsed result:', parsed);
  
  return { json: { fileName: file.name, pages: pageCount, ...parsed }, summary: `Extracted financial data (${pageCount} pages)` };
}

// Helper function to clean malformed JSON from OpenAI
function cleanMalformedJSON(jsonStr: string): string {
  console.log('Cleaning malformed JSON...');
  
  // Remove any text before the first { and after the last }
  const startIndex = jsonStr.indexOf('{');
  const lastIndex = jsonStr.lastIndexOf('}');
  if (startIndex !== -1 && lastIndex !== -1) {
    jsonStr = jsonStr.substring(startIndex, lastIndex + 1);
  }
  
  // Fix common malformed JSON issues
  let cleaned = jsonStr
    // Fix unquoted property names (common OpenAI issue)
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties (basic case)
    .replace(/}(\s*)([a-zA-Z_$"])/g, '},$1$2')
    .replace(/](\s*)([a-zA-Z_$"])/g, '],$1$2')
    // Fix numbers with parentheses to negative numbers
    .replace(/:\s*\(([0-9,]+)\)/g, ': -$1')
    // Remove commas from numbers inside quotes
    .replace(/"([0-9,]+)"/g, (match, number) => {
      return number.replace(/,/g, '');
    });
  
  console.log('Cleaned JSON:', cleaned);
  return cleaned;
}

// Manual extraction as last resort
function extractDataManually(jsonStr: string): any | null {
  console.log('Attempting manual data extraction...');
  
  try {
    // Basic manual parsing for simple cases
    const result: any = {
      lineItems: [],
      columns: ['item'],
      notes: []
    };
    
    // Extract company name
    const companyMatch = jsonStr.match(/"companyName"\s*:\s*"([^"]+)"/);
    if (companyMatch) result.companyName = companyMatch[1];
    
    // Extract document type
    const docTypeMatch = jsonStr.match(/"documentType"\s*:\s*"([^"]+)"/);
    if (docTypeMatch) result.documentType = docTypeMatch[1];
    
    // Extract period
    const periodMatch = jsonStr.match(/"period"\s*:\s*"([^"]+)"/);
    if (periodMatch) result.period = periodMatch[1];
    
    // Extract currency
    const currencyMatch = jsonStr.match(/"currency"\s*:\s*"([^"]+)"/);
    if (currencyMatch) result.currency = currencyMatch[1];
    
    // Try to extract line items using basic patterns
    const lineItemsMatch = jsonStr.match(/"lineItems"\s*:\s*\[([\s\S]*?)\]/);
    if (lineItemsMatch) {
      try {
        // Try to find individual line item patterns
        const itemPattern = /\{\s*"item"\s*:\s*"([^"]+)"[^}]*\}/g;
        let match;
        while ((match = itemPattern.exec(lineItemsMatch[1])) !== null) {
          result.lineItems.push({
            item: match[1],
            category: 'other'
          });
        }
      } catch (e) {
        console.log('Failed to extract individual line items');
      }
    }
    
    // Try to extract any numerical data patterns
    const numberPattern = /"([^"]*)":\s*(-?\d+(?:\.\d+)?)/g;
    let numMatch;
    const extractedData: any = {};
    while ((numMatch = numberPattern.exec(jsonStr)) !== null) {
      const key = numMatch[1];
      const value = parseFloat(numMatch[2]);
      if (!['pages', 'fileName'].includes(key)) {
        extractedData[key] = value;
      }
    }
    
    // If we found numerical data but no line items, create basic line items
    if (result.lineItems.length === 0 && Object.keys(extractedData).length > 0) {
      Object.entries(extractedData).forEach(([key, value]) => {
        result.lineItems.push({
          item: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value: value,
          category: 'other'
        });
      });
    }
    
    // If we got some basic data, return it
    if (result.companyName || result.documentType || result.lineItems.length > 0) {
      console.log('Manual extraction successful with data:', result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Manual extraction failed:', error);
    return null;
  }
}

// Retry extraction with enhanced prompt focusing on numerical data
async function retryExtractionWithEnhancedPrompt(
  openaiClient: OpenAI,
  originalMessages: ChatCompletionMessageParam[],
  file: File,
  pageCount: number
): Promise<FinancialDataResult> {
  console.log('Retrying extraction with enhanced numerical focus prompt...');
  
  const enhancedPrompt = `URGENT DATA EXTRACTION REQUEST:

This PDF contains financial tables with NUMBERS that must be extracted. I can see the tables have numerical data, but you're only returning item names without the numbers.

SPECIFIC REQUIREMENTS:
1. Look for tables with columns like "2023", "2022", "Current Year", "Previous Year"
2. Extract EVERY number from these tables - revenue, expenses, assets, liabilities
3. Convert text like "9,860,854" to number 9860854
4. Convert parentheses like "(7,622,268)" to negative number -7622268
5. Include zeros if they appear in the document

For a document with both P&L and Balance Sheet:
{
  "documentType": "mixed_financial",
  "companyName": "Extract exact company name",
  "period": "Extract exact period",
  "currency": "GBP",
  "profitAndLoss": {
    "lineItems": [
      {"item": "Turnover", "2023": 9860854, "2022": 5978396, "category": "revenue"},
      {"item": "Cost of sales", "2023": -7622268, "2022": -4482232, "category": "expense"},
      {"item": "Gross profit", "2023": 2238586, "2022": 1496164, "category": "subtotal"}
    ]
  },
  "balanceSheet": {
    "lineItems": [
      {"item": "Intangible assets", "2023": 47173, "2022": 47173, "category": "asset"},
      {"item": "Tangible assets", "2023": 12719, "2022": 17477, "category": "asset"}
    ]
  }
}

CRITICAL: You MUST include the numerical values. If you can see numbers in the table, extract them as numbers, not text.

Return ONLY the JSON object.`;

  // Create new messages with enhanced prompt
  const enhancedMessages: ChatCompletionMessageParam[] = [...originalMessages];
  
  // Replace the text content in the last message with enhanced prompt
  if (enhancedMessages.length > 1 && enhancedMessages[enhancedMessages.length - 1].role === 'user') {
    const lastMessage = enhancedMessages[enhancedMessages.length - 1];
    if (Array.isArray(lastMessage.content)) {
      // Update the text content while keeping images
      lastMessage.content = lastMessage.content.map(item => {
        if (item.type === 'text') {
          return { type: 'text', text: enhancedPrompt };
        }
        return item;
      });
    }
  }
  
  const retryCompletion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: enhancedMessages,
    temperature: 0.05, // Even lower temperature for more consistent results
    max_tokens: 8000,
  });
  
  const retryContent = retryCompletion.choices[0].message.content;
  if (!retryContent) throw new Error('Empty retry response');
  
  console.log('Retry response:', retryContent);
  
  try {
    const retryParsed = JSON.parse(retryContent);
    return { 
      json: { fileName: file.name, pages: pageCount, ...retryParsed }, 
      summary: `Extracted financial data (${pageCount} pages) - Enhanced extraction` 
    };
  } catch (parseError) {
    // If retry also fails, return basic structure with what we can extract
    console.error('Retry extraction also failed:', parseError);
    return {
      json: {
        fileName: file.name,
        pages: pageCount,
        documentType: 'other',
        companyName: '',
        lineItems: [],
        columns: ['item'],
        notes: ['Extraction failed - please check document format']
      },
      summary: `Document processed (${pageCount} pages) but extraction incomplete`
    };
  }
}

// Convert string numbers to actual numbers in the extracted data
function convertStringNumbersToNumbers(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const convertObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(convertObject);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip non-numeric fields
        if (typeof value === 'string' && 
            !['item', 'note', 'category', 'description', 'companyName', 'statementTitle', 'period', 'currency', 'documentType', 'contact', 'name'].includes(key)) {
          
          // Clean the string - remove commas, spaces, currency symbols
          let cleanStr = value.replace(/[,\s£$€]/g, '').trim();
          
          // Handle parentheses as negative numbers
          if (cleanStr.match(/^\([0-9,.]+\)$/)) {
            cleanStr = '-' + cleanStr.replace(/[()]/g, '');
          }
          
          // Handle dash or empty as zero
          if (cleanStr === '-' || cleanStr === '' || cleanStr === 'nil') {
            converted[key] = 0;
            console.log(`Converted "${value}" to 0 for key ${key}`);
            continue;
          }
          
          // Handle percentage strings
          if (cleanStr.endsWith('%')) {
            const numStr = cleanStr.slice(0, -1);
            const num = parseFloat(numStr);
            if (!isNaN(num)) {
              converted[key] = num;
              console.log(`Converted percentage "${value}" to number ${num} for key ${key}`);
              continue;
            }
          }
          
          // Handle regular numbers (including decimals)
          if (cleanStr.match(/^-?[0-9.,]+\.?[0-9]*$/)) {
            // Remove any remaining commas for thousands separators
            const numStr = cleanStr.replace(/,/g, '');
            const num = parseFloat(numStr);
            if (!isNaN(num)) {
              converted[key] = num;
              console.log(`Converted string "${value}" to number ${num} for key ${key}`);
              continue;
            }
          }
          
          // Handle numbers with 'Dr' or 'Cr' suffix (accounting format)
          if (cleanStr.match(/^[0-9.,]+\s*(Dr|Cr)$/i)) {
            const numPart = cleanStr.replace(/\s*(Dr|Cr)$/i, '');
            const num = parseFloat(numPart.replace(/,/g, ''));
            if (!isNaN(num)) {
              // Make debits positive and credits negative (or vice versa based on context)
              const isCredit = cleanStr.toLowerCase().endsWith('cr');
              converted[key] = isCredit ? -num : num;
              console.log(`Converted accounting format "${value}" to number ${converted[key]} for key ${key}`);
              continue;
            }
          }
        }
        
        // Recursively convert nested objects
        converted[key] = convertObject(value);
      }
      return converted;
    }
    
    return obj;
  };
  
  const result = convertObject(data);
  console.log('String to number conversion completed');
  return result;
}

// Validate that extracted data contains meaningful numerical values
function validateExtractedData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check for numerical data in various structures
  let hasNumbers = false;
  let numberCount = 0;
  let totalItems = 0;
  
  // Helper function to check if a value is a meaningful number (including zero)
  const isMeaningfulNumber = (value: any): boolean => {
    return typeof value === 'number' || 
           (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '');
  };
  
  // Check lineItems for numerical values (accept zeros as valid)
  if (data.lineItems && Array.isArray(data.lineItems)) {
    totalItems += data.lineItems.length;
    data.lineItems.forEach((item: any) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'item' && key !== 'note' && key !== 'category' && key !== 'description') {
          if (isMeaningfulNumber(value)) {
            hasNumbers = true;
            numberCount++;
            console.log(`Found meaningful value in lineItems[${key}]:`, value);
          }
        }
      });
    });
  }
  
  // Check profitAndLoss lineItems
  if (data.profitAndLoss?.lineItems) {
    totalItems += data.profitAndLoss.lineItems.length;
    data.profitAndLoss.lineItems.forEach((item: any) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'item' && key !== 'note' && key !== 'category' && key !== 'description') {
          if (isMeaningfulNumber(value)) {
            hasNumbers = true;
            numberCount++;
            console.log(`Found meaningful value in P&L[${key}]:`, value);
          }
        }
      });
    });
  }
  
  // Check balanceSheet lineItems
  if (data.balanceSheet?.lineItems) {
    totalItems += data.balanceSheet.lineItems.length;
    data.balanceSheet.lineItems.forEach((item: any) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'item' && key !== 'note' && key !== 'category' && key !== 'description') {
          if (isMeaningfulNumber(value)) {
            hasNumbers = true;
            numberCount++;
            console.log(`Found meaningful value in BS[${key}]:`, value);
          }
        }
      });
    });
  }
  
  // Check agedPayables and agedReceivables
  const checkAgedData = (agedData: any, type: string) => {
    if (agedData && typeof agedData === 'object') {
      Object.entries(agedData).forEach(([key, value]) => {
        if (key !== 'companyName' && key !== 'statementTitle' && key !== 'period') {
          if (Array.isArray(value)) {
            value.forEach((item: any) => {
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                if (itemKey !== 'item' && itemKey !== 'contact' && itemKey !== 'name') {
                  if (isMeaningfulNumber(itemValue)) {
                    hasNumbers = true;
                    numberCount++;
                    console.log(`Found meaningful value in ${type}[${itemKey}]:`, itemValue);
                  }
                }
              });
            });
          } else if (isMeaningfulNumber(value)) {
            hasNumbers = true;
            numberCount++;
            console.log(`Found meaningful value in ${type}[${key}]:`, value);
          }
        }
      });
    }
  };
  
  if (data.agedPayables) checkAgedData(data.agedPayables, 'agedPayables');
  if (data.agedReceivables) checkAgedData(data.agedReceivables, 'agedReceivables');
  
  // More lenient validation - if we have structured data with items but no numbers, still consider it valid
  // This handles cases where OpenAI extracted structure but didn't convert numbers properly
  if (!hasNumbers && totalItems > 0) {
    console.log(`No numbers found but ${totalItems} items detected - will attempt string conversion`);
    return false; // This will trigger string number conversion
  }
  
  // Very lenient - accept if we have any structure at all
  const hasAnyStructure = (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) ||
                          (data.profitAndLoss?.lineItems && Array.isArray(data.profitAndLoss.lineItems) && data.profitAndLoss.lineItems.length > 0) ||
                          (data.balanceSheet?.lineItems && Array.isArray(data.balanceSheet.lineItems) && data.balanceSheet.lineItems.length > 0) ||
                          data.agedPayables || data.agedReceivables;
  
  console.log(`Data validation result: ${hasNumbers ? 'Has numerical data' : hasAnyStructure ? 'Has structure but no numbers' : 'Missing data'} (${numberCount} numbers found, ${totalItems} total items)`);
  return hasNumbers || hasAnyStructure;
}
