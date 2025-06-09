// --- OpenAI direct integration for extracting financials and summary ---
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for browser usage
});

export interface OpenAIExtractResult {
  json: any;
  summary: string;
}

export async function extractFinancialsWithOpenAI({
  text,
  docType,
}: {
  text: string;
  docType: string;
}): Promise<OpenAIExtractResult> {
  // Enhanced prompt for OpenAI that captures ALL information from the document
  const prompt = `You are a financial data extraction assistant. Given the following ${docType} document text, extract ALL information as a comprehensive JSON object, including but not limited to financial figures, dates, text descriptions, and any other relevant information. Then, provide a short summary paragraph of the key points. No business name, address or identifying information should be included in the JSON output.

For data extraction:
1. Extract EVERY piece of information visible in the document
2. Do 
3. Organize data hierarchically by category where appropriate
4. Preserve all details, line items, dates, descriptions, and contextual information
5. For financial values, use numerical values without currency symbols (£9,340.26 should be stored as 9340.26)
6. Use standardized naming conventions (camelCase or with_underscores)
7. Include ALL line items, not just summary totals
8. For Trial Balance documents, ensure all accounts with their debits and credits are structured as individual entries
9. For Aged Receivables/Payables, include all customer/vendor details with their respective aging periods

Document text:
"""${text.slice(0, 8000)}"""

Respond in this JSON format:
{
  "json": {
    // Include ALL information from the document in a well-structured format
    // For example, for Aged Receivables/Payables, include all customer/vendor names, amounts, dates, etc.
    // For Balance Sheets or P&L, include every single line item with its value
    // Don't summarize or omit details - include everything exactly as it appears
    
    // Example structure (customize based on document type):
    "documentType": "${docType}",
    "documentDetails": {
      // Document specific metadata (date, period covered, etc.)
    },
    "lineItems": [
      // All individual entries/rows from the document
    ],
    "totals": {
      // Summary totals if present in the document
    },
    "additionalInformation": {
      // Any other information present in the document
    },
    
    // For Trial Balance, use this structure:
    ${docType === "Trial Balance" ? `"accounts": [
      // Each account with name, code, debits, credits, etc.
      {"accountName": "Account Name", "accountCode": "1234", "debit": 1000, "credit": 0},
      {"accountName": "Another Account", "accountCode": "5678", "debit": 0, "credit": 1000}
    ]` : ""}
    
    // For Aged Receivables/Payables, use this structure:
    ${docType.includes("Aged") ? `"customers": [
      // Each customer with aging breakdowns
      {"customerName": "Customer Name", "total": 1000, "current": 500, "days30": 300, "days60": 200, "days90": 0}
    ]` : ""}
  },
  "summary": "A concise paragraph that highlights the key financial metrics and what they indicate about the business's performance or financial health."
}`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant for financial document analysis. Extract structured financial data from documents." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1, // Lower temperature for more consistent outputs
      max_tokens: 1500, // Increased token limit for more detailed responses
    });
    
    // Get the response content
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI API error: Empty response");
    }
    
    // Try to parse as JSON
    let result: OpenAIExtractResult = { json: null, summary: "" };
    try {
      console.log("Parsing OpenAI response:", content.substring(0, 500) + "...");
      const parsedContent = JSON.parse(content);
      
      // Extract summary and ensure it's a string
      let summaryText = "";
      if (parsedContent.summary && typeof parsedContent.summary === 'string') {
        // Direct string summary - exactly what we want
        summaryText = parsedContent.summary;
      } else {
        summaryText = "No summary available";
      }
      
      // Enhanced processing for different document types
      let jsonData;
      
      try {
        // Based on the example provided, we expect a clean structure with json and summary fields
        if (parsedContent.json) {
          // Use the JSON data directly without deep copying to avoid circular reference issues
          jsonData = parsedContent.json;
        } else {
          // Fallback case - if there's no json property, use the whole content except summary
          jsonData = { ...parsedContent };
          
          // Remove the summary to avoid duplicating it in the JSON data
          if ('summary' in jsonData) {
            delete jsonData.summary;
          }
        }
      } catch (copyError) {
        console.error("Error copying JSON data:", copyError);
        // Fallback to simple assignment
        jsonData = parsedContent.json || parsedContent;
      }
      
      // Special handling for Trial Balance
      if (docType === "Trial Balance" && !jsonData.accounts) {
        // Try to find accounts data in different structures
        if (jsonData.lineItems && Array.isArray(jsonData.lineItems)) {
          jsonData.accounts = jsonData.lineItems;
        } else if (jsonData.items && Array.isArray(jsonData.items)) {
          jsonData.accounts = jsonData.items;
        }
        
        // Make sure the summary is properly extracted for Trial Balance
        if (typeof summaryText === 'string' && summaryText.includes('"summary"')) {
          // Try to extract the summary from JSON format
          const summaryMatch = summaryText.match(/"summary"\s*:\s*"([^"]+)"/);
          if (summaryMatch && summaryMatch[1]) {
            summaryText = summaryMatch[1]
              .replace(/\\n/g, ' ')
              .replace(/\\"/g, '"')
              .trim();
          }
        }
        
        // Store the clean summary text directly in the JSON data as well
        // This helps the UI display it properly
        jsonData.summary = summaryText;
      }
      
      // Special handling for Aged Receivables/Payables
      if ((docType === "Aged Receivables" || docType === "Aged Payables") && 
          !jsonData.customers && !jsonData.suppliers && !jsonData.vendors) {
        // Try to transform into expected format
        if (jsonData.lineItems && Array.isArray(jsonData.lineItems)) {
          if (docType === "Aged Receivables") {
            jsonData.customers = jsonData.lineItems;
          } else {
            jsonData.suppliers = jsonData.lineItems;
          }
        }
      }
      
      // Return the structured result
      result = {
        json: jsonData,        // Clean JSON data without summary
        summary: summaryText   // Only the summary text
      };
      
      // Validate that we have the expected structure
      if (!result.json) {
        console.warn("OpenAI response missing json field:", result);
      }
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      // fallback: just return the content as summary
      result.summary = content || "Failed to parse financial data.";
      
      // Try to extract JSON from the response using a regex approach
      try {
        const jsonMatch = content.match(/\{\s*"json"\s*:\s*(\{.*\}),\s*"summary"\s*:/s);
        if (jsonMatch && jsonMatch[1]) {
          result.json = JSON.parse(jsonMatch[1]);
        }
      } catch (jsonError) {
        console.error("Failed to extract JSON using regex:", jsonError);
      }
    }
    
    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("OpenAI API error: " + (error instanceof Error ? error.message : String(error)));
  }
}

// New function to analyze PDF files directly
export async function analyzeDocumentWithVision({
  file,
  docType,
}: {
  file: File;
  docType: string;
}): Promise<OpenAIExtractResult> {
  // Convert file to base64
  const fileBuffer = await file.arrayBuffer();
  const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
  
  // Enhanced prompt for vision API
  const prompt = `You are a financial data extraction assistant. Analyze this ${docType} document and extract ALL information as a comprehensive JSON object, including financial figures, dates, text descriptions, and any other relevant information. Then, provide a short summary paragraph of the key points. No business name, address or identifying information should be included in the JSON output.

For data extraction:
1. Extract EVERY piece of information visible in the document
2. Pay special attention to tables, figures, and structured data
3. Organize data hierarchically by category where appropriate
4. Preserve all details, line items, dates, descriptions, and contextual information
5. For financial values, use numerical values without currency symbols (£9,340.26 should be stored as 9340.26)
6. Use standardized naming conventions (camelCase or with_underscores)
7. Include ALL line items, not just summary totals
8. For Trial Balance documents, ensure all accounts with their debits and credits are structured as individual entries
9. For Aged Receivables/Payables, include all customer/vendor details with their respective aging periods

Respond in this JSON format:
{
  "json": {
    "documentType": "${docType}",
    "documentDetails": {
      // Document specific metadata (date, period covered, etc.)
    },
    "lineItems": [
      // All individual entries/rows from the document
    ],
    "totals": {
      // Summary totals if present in the document
    },
    "additionalInformation": {
      // Any other information present in the document
    }
    ${docType === "Trial Balance" ? `,
    "accounts": [
      // Each account with name, code, debits, credits, etc.
      {"accountName": "Account Name", "accountCode": "1234", "debit": 1000, "credit": 0}
    ]` : ""}
    ${docType.includes("Aged") ? `,
    "customers": [
      // Each customer with aging breakdowns
      {"customerName": "Customer Name", "total": 1000, "current": 500, "days30": 300, "days60": 200, "days90": 0}
    ]` : ""}
  },
  "summary": "A concise paragraph that highlights the key financial metrics and what they indicate about the business's performance or financial health."
}`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant for financial document analysis. Extract structured financial data from documents." 
        },
        { 
          role: "user", 
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64File}`,
                detail: "high"
              }
            }
          ]
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });
    
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI API error: Empty response");
    }
    
    // Parse the response similar to the text-based function
    let result: OpenAIExtractResult = { json: null, summary: "" };
    try {
      console.log("Parsing OpenAI vision response:", content.substring(0, 500) + "...");
      const parsedContent = JSON.parse(content);
      
      let summaryText = "";
      if (parsedContent.summary && typeof parsedContent.summary === 'string') {
        summaryText = parsedContent.summary;
      } else {
        summaryText = "No summary available";
      }
      
      let jsonData;
      try {
        if (parsedContent.json) {
          jsonData = parsedContent.json;
        } else {
          jsonData = { ...parsedContent };
          if ('summary' in jsonData) {
            delete jsonData.summary;
          }
        }
      } catch (copyError) {
        console.error("Error copying JSON data in vision API:", copyError);
        jsonData = parsedContent.json || parsedContent;
      }
      
      // Apply the same special handling as the text version
      if (docType === "Trial Balance" && !jsonData.accounts) {
        if (jsonData.lineItems && Array.isArray(jsonData.lineItems)) {
          jsonData.accounts = jsonData.lineItems;
        } else if (jsonData.items && Array.isArray(jsonData.items)) {
          jsonData.accounts = jsonData.items;
        }
        jsonData.summary = summaryText;
      }
      
      if ((docType === "Aged Receivables" || docType === "Aged Payables") && 
          !jsonData.customers && !jsonData.suppliers && !jsonData.vendors) {
        if (jsonData.lineItems && Array.isArray(jsonData.lineItems)) {
          if (docType === "Aged Receivables") {
            jsonData.customers = jsonData.lineItems;
          } else {
            jsonData.suppliers = jsonData.lineItems;
          }
        }
      }
      
      result = {
        json: jsonData,
        summary: summaryText
      };
      
    } catch (e) {
      console.error("Error parsing OpenAI vision response:", e);
      result.summary = content || "Failed to parse financial data.";
      
      try {
        const jsonMatch = content.match(/\{\s*"json"\s*:\s*(\{.*\}),\s*"summary"\s*:/s);
        if (jsonMatch && jsonMatch[1]) {
          result.json = JSON.parse(jsonMatch[1]);
        }
      } catch (jsonError) {
        console.error("Failed to extract JSON using regex:", jsonError);
      }
    }
    
    return result;
  } catch (error) {
    console.error("OpenAI Vision API error:", error);
    throw new Error("OpenAI Vision API error: " + (error instanceof Error ? error.message : String(error)));
  }
}
