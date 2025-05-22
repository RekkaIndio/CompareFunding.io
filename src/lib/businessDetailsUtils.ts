import { authenticateWithCreditSafe, searchCompanyByNameDirect, getCreditReportDirect } from '@/pages/CreditScore';
import axios from 'axios';

// Fetch credit data for a company
export const fetchCreditData = async (companyName: string, countryCode: string = 'GB') => {
  try {
    const token = await authenticateWithCreditSafe();
    const searchResults: { companies?: Array<{ connectId?: string; id?: string }> } = await searchCompanyByNameDirect(companyName, countryCode);

    console.log('Company search results:', searchResults);

    if (searchResults.companies && searchResults.companies.length > 0) {
      const company = searchResults.companies[0];
      const connectId = company.connectId || company.id; // Use `id` as a fallback
      console.log('Extracted connectId:', connectId);

      if (!connectId) {
        throw new Error('connectId is missing in the company search results. Full results: ' + JSON.stringify(searchResults));
      }

      const creditReport = await getCreditReportDirect(connectId);
      return creditReport;
    } else {
      throw new Error('No companies found matching the provided name.');
    }
  } catch (error) {
    console.error('Error fetching credit data:', error);
    throw error;
  }
};

// Summarize website content using OpenAI
export const summarizeWebsite = async (websiteUrl: string) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4', // Updated to a supported model
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
    }, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPEN_AI_API_KEY}`,
      },
    });

    // Define the expected response structure
    type OpenAIResponse = {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    const data = response.data as OpenAIResponse;
    return data.choices[0].message.content.trim();
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
