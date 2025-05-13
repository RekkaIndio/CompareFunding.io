// import axios from 'axios';

// // Interface for financial data
// export interface FinancialData {
//   revenue?: number;
//   profit?: number;
//   grossProfit?: number;
//   operatingProfit?: number;
//   netProfit?: number;
//   assets?: number;
//   currentAssets?: number;
//   fixedAssets?: number;
//   liabilities?: number;
//   currentLiabilities?: number;
//   longTermLiabilities?: number;
//   equity?: number;
//   ebitda?: number;
//   netIncome?: number;
//   cashFlow?: number;
//   operatingCashFlow?: number;
//   investingCashFlow?: number;
//   financingCashFlow?: number;
//   debtToEquityRatio?: number;
//   currentRatio?: number;
//   quickRatio?: number;
//   returnOnAssets?: number;
//   returnOnEquity?: number;
//   year?: string;
//   // Add more financial metrics as needed
// }

// /**
//  * Extracts text content from uploaded documents using PDF.js or text extraction
//  * @param file The uploaded file to extract text from
//  * @returns Extracted text content
//  */
// export const extractTextFromDocument = async (file: File): Promise<string> => {
//   try {
//     console.log(`Starting text extraction for file: ${file.name}`);
    
//     // Import the PDF extractor 
//     const { processFileForTextExtraction } = await import('./pdfExtractor');
    
//     // Extract text using our PDF extractor service
//     const extractedText = await processFileForTextExtraction(file);
    
//     console.log(`Extraction completed for ${file.name}, text length: ${extractedText.length}`);
//     return extractedText;
//   } catch (error) {
//     console.error('Error extracting text from document:', error);
//     throw new Error(`Failed to extract text from document: ${error instanceof Error ? error.message : String(error)}`);
//   }
// };

// /**
//  * Extracts financial data from document text using AI
//  * @param text Text content extracted from a financial document
//  * @param documentType Type of the financial document (e.g., 'balance_sheet', 'income_statement', etc.)
//  * @returns Structured financial data with processing status, formatted data, and summary
//  */
// export const extractFinancialData = async (text: string, documentType: string): Promise<{ 
//   status: string, 
//   data?: FinancialData, 
//   formattedData?: Record<string, any>, 
//   summary?: string, 
//   timestamp?: string 
// }> => {
//   try {
//     // Use OpenAI to parse the extracted text into structured data with a summary
//     const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content: `You are a financial analyst expert specializing in extracting and standardizing financial data from documents.
          
// Extract key financial metrics from the provided ${documentType} text and return them in a structured JSON format.
// Your response must be valid JSON with the following structure:
// {
//   "metrics": {
//     // Key financial metrics with numerical values (no currency symbols)
//     // For profit & loss: revenue, expenses, grossProfit, operatingProfit, netProfit, etc.
//     // For balance sheet: totalAssets, currentAssets, fixedAssets, totalLiabilities, equity, etc.
//     // For aged receivables/payables: totalAmount, currentAmount, overdue30, overdue60, overdue90, etc.
//   },
//   "metadata": {
//     "currency": "GBP", // or USD, EUR, etc.
//     "period": "2022", // or Q1 2022, Jan 2022-Mar 2022, etc.
//     "companyName": "Company Name", // if available
//     "documentType": "${documentType}"
//   },
//   "summary": "A concise paragraph (3-5 sentences) summarizing the key insights from this financial document, highlighting the most important metrics and their implications."
// }`
//         },
//         {
//           role: 'user',
//           content: `Extract standardized financial data from this ${documentType}:\n\n${text}`
//         }
//       ],
//       temperature: 0.1, // Lower temperature for more consistent results
//       response_format: { type: "json_object" } // Ensure response is in JSON format
//     }, {
//       headers: {
//         'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       }
//     });

//     const aiResponse = (response.data as { choices: { message: { content: string } }[] }).choices[0].message.content;
    
//     // Parse the AI response as JSON
//     const parsedJson = JSON.parse(aiResponse);
    
//     // Extract the summary
//     const summary = parsedJson.summary;
    
//     // Extract the formatted data
//     const formattedData = parsedJson.metrics;
    
//     // Extract metadata
//     const metadata = parsedJson.metadata || {};
    
//     // Convert to our internal FinancialData format using the existing parseAIResponse function
//     const parsedData = parseAIResponse(aiResponse);
    
//     return {
//       status: 'success',
//       data: parsedData,
//       formattedData: {
//         ...formattedData,
//         metadata: parsedJson.metadata
//       },
//       summary: summary,
//       timestamp: new Date().toISOString()
//     };
//   } catch (error) {
//     console.error('Error extracting financial data:', error);
//     throw new Error('Failed to extract financial data from document');
//   }
// };

// function parseAIResponse(aiResponse: string): FinancialData {
//   // Initialize with undefined values
//   const data: FinancialData = {};
  
//   try {
//     // First try to parse as JSON if possible
//     try {
//       const jsonData = JSON.parse(aiResponse);
      
//       // If we have metrics in JSON format, extract them
//       if (jsonData.metrics) {
//         const m = jsonData.metrics;
        
//         // Map common financial fields from metrics to our FinancialData interface
//         // Revenue figures
//         if (m.revenue) data.revenue = Number(m.revenue);
        
//         // Profit figures
//         if (m.profit) data.profit = Number(m.profit);
//         if (m.grossProfit) data.grossProfit = Number(m.grossProfit);
//         if (m.operatingProfit) data.operatingProfit = Number(m.operatingProfit);
//         if (m.netProfit) data.netProfit = Number(m.netProfit);
        
//         // Asset figures
//         if (m.totalAssets) data.assets = Number(m.totalAssets);
//         if (m.currentAssets) data.currentAssets = Number(m.currentAssets);
//         if (m.fixedAssets || m.nonCurrentAssets) data.fixedAssets = Number(m.fixedAssets || m.nonCurrentAssets);
        
//         // Liability figures
//         if (m.totalLiabilities) data.liabilities = Number(m.totalLiabilities);
//         if (m.currentLiabilities) data.currentLiabilities = Number(m.currentLiabilities);
//         if (m.longTermLiabilities || m.nonCurrentLiabilities) data.longTermLiabilities = Number(m.longTermLiabilities || m.nonCurrentLiabilities);
        
//         // Equity
//         if (m.equity || m.shareholdersEquity) data.equity = Number(m.equity || m.shareholdersEquity);
        
//         // Other financial metrics
//         if (m.ebitda) data.ebitda = Number(m.ebitda);
//         if (m.netIncome) data.netIncome = Number(m.netIncome);
        
//         // Cash flow figures
//         if (m.cashFlow || m.totalCashFlow) data.cashFlow = Number(m.cashFlow || m.totalCashFlow);
//         if (m.operatingCashFlow) data.operatingCashFlow = Number(m.operatingCashFlow);
//         if (m.investingCashFlow) data.investingCashFlow = Number(m.investingCashFlow);
//         if (m.financingCashFlow) data.financingCashFlow = Number(m.financingCashFlow);
        
//         // Ratios
//         if (m.debtToEquityRatio) data.debtToEquityRatio = Number(m.debtToEquityRatio);
//         if (m.currentRatio) data.currentRatio = Number(m.currentRatio);
//         if (m.quickRatio) data.quickRatio = Number(m.quickRatio);
//         if (m.returnOnAssets || m.roa) data.returnOnAssets = Number(m.returnOnAssets || m.roa);
//         if (m.returnOnEquity || m.roe) data.returnOnEquity = Number(m.returnOnEquity || m.roe);
        
//         // Extract year/period from metadata
//         if (jsonData.metadata && jsonData.metadata.period) {
//           // Extract the first 4-digit year from the period string
//           const yearMatch = jsonData.metadata.period.match(/\d{4}/);
//           if (yearMatch) {
//             data.year = yearMatch[0];
//           }
//         }
        
//         return data;
//       }
//     } catch (e) {
//       // If JSON parsing fails, fall back to regex extraction
//       console.log('Failed to parse AI response as JSON, falling back to regex extraction');
//     }
    
//     // Fall back to the original regex approach
//     const metrics = [
//       { key: 'revenue', regex: /revenue:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'profit', regex: /(?:profit|net profit):?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'assets', regex: /(?:total )?assets:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'liabilities', regex: /(?:total )?liabilities:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'ebitda', regex: /ebitda:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'netIncome', regex: /net income:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'cashFlow', regex: /cash flow:?\s*[£$]?([\d,]+(?:\.\d+)?)/i },
//       { key: 'debtToEquityRatio', regex: /debt[- ]to[- ]equity ratio:?\s*([\d.]+)/i },
//       { key: 'currentRatio', regex: /current ratio:?\s*([\d.]+)/i },
//       { key: 'quickRatio', regex: /quick ratio:?\s*([\d.]+)/i },
//       { key: 'year', regex: /(?:year|period):?\s*(\d{4})/i }
//     ];

//     // Extract each metric
//     metrics.forEach(({ key, regex }) => {
//       const match = aiResponse.match(regex);
//       if (match) {
//         const value = match[1].replace(/,/g, '');
//         if (key === 'year') {
//           (data as any)[key] = value;
//         } else {
//           (data as any)[key] = Number(value);
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('Error parsing AI response:', error);
//   }

//   return data;
// }

// /**
//  * Analyzes financial data and provides insights
//  * @param financialData Structured financial data
//  * @returns Analysis and insights
//  */
// export const analyzeFinancialData = async (financialData: FinancialData): Promise<string> => {
//   try {
//     // Placeholder for actual AI analysis
//     // In a real application, you would call OpenAI API or another AI service
//     await new Promise(resolve => setTimeout(resolve, 2000));
    
//     return `
//     Financial Analysis:
    
//     Based on the provided financial data for ${financialData.year}:
    
//     - Revenue: $${financialData.revenue?.toLocaleString()}
//     - Profit: $${financialData.profit?.toLocaleString()} (${Math.round((financialData.profit || 0) / (financialData.revenue || 1) * 100)}% margin)
//     - EBITDA: $${financialData.ebitda?.toLocaleString()}
//     - Debt-to-Equity Ratio: ${financialData.debtToEquityRatio}
    
//     The business shows strong profitability with a healthy profit margin. 
//     The debt-to-equity ratio of ${financialData.debtToEquityRatio} indicates a sustainable level of leverage.
    
//     Recommendation: Based on these metrics, the business appears to be in good financial health.
//     `;
//   } catch (error) {
//     console.error('Error analyzing financial data:', error);
//     throw new Error('Failed to analyze financial data');
//   }
// };
