import { authenticateWithCreditSafe, searchCompanyByNameDirect, getCreditReportDirect } from '@/components/CreditScore/api';
import axios from 'axios';

// Define an interface for company structure that includes all possible properties
interface CompanySearchResult {
  name?: string;
  connectId?: string;
  id?: string;
  address?: {
    simpleValue?: string;
  };
  registrationNumber?: string;
  status?: string;
  dateOfLatestAccounts?: string;
  identification?: {
    connectId?: string;
    id?: string;
  };
}

// Fetch credit data for a company
export const fetchCreditData = async (companyName: string, countryCode: string = 'GB') => {
  try {
    const token = await authenticateWithCreditSafe();
    const searchResults: { companies?: Array<CompanySearchResult> } = await searchCompanyByNameDirect(companyName, countryCode);

    console.log('Company search results:', searchResults);

    if (searchResults.companies && searchResults.companies.length > 0) {
      const company = searchResults.companies[0];
      // Now TypeScript knows that 'identification' might exist on company
      const connectId = company.connectId || company.id || 
        (company.identification && (company.identification.connectId || company.identification.id));
        
      console.log('Extracted connectId:', connectId);

      if (!connectId) {
        console.warn('connectId is missing in the company search results:', JSON.stringify(searchResults));
        return { 
          error: 'Missing connectId',
          company: company // Return the company info we have
        };
      }

      const creditReport = await getCreditReportDirect(connectId);
      
      // Set flag in session storage to indicate we need to save the credit report when user visits CreditScore page
      sessionStorage.setItem('from_business_form', 'true');
      sessionStorage.setItem('credit_search_company_name', companyName);
      
      return creditReport;
    } else {
      console.warn('No companies found matching the provided name:', companyName);
      return {
        error: 'No companies found',
        searchQuery: companyName
      };
    }
  } catch (error) {
    console.error('Error fetching credit data:', error);
    // Return partial error information instead of throwing
    return {
      error: error instanceof Error ? error.message : 'Unknown error fetching credit data',
      timestamp: new Date().toISOString()
    };
  }
};

// Summarize website content using OpenAI
export const summarizeWebsite = async (websiteUrl: string) => {
  try {
    // Initialize OpenAI client
    const { default: OpenAI } = await import('openai');
    const openAIClient = new OpenAI({ 
      apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
      dangerouslyAllowBrowser: true // Note: This is needed for browser environments but should be used carefully
    });
    
    const completion = await openAIClient.chat.completions.create({
      model: 'gpt-4o', // Updated to a supported model
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarises website content.',
        },
        {
          role: 'user',
          content: `Summarise what this website and business does: ${websiteUrl}`,
        },
      ],
      max_tokens: 100,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing website:', error);
    throw error;
  }
};

// Fetch website logo or favicon
export const fetchWebsiteLogo = async (websiteUrl: string) => {
  try {
    const response = await axios.get(`https://logo.clearbit.com/${websiteUrl}`);
    return response.config.url; // Return the URL of the logo
  } catch (error) {
    console.error('Error fetching website logo:', error);
    throw error;
  }
};
