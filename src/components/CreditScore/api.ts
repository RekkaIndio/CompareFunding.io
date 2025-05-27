import axios from 'axios';

// --- CREDITSAFE DIRECT API CALL CONFIGURATION ---
const CREDITSAFE_USERNAME = import.meta.env.VITE_CREDITSAFE_USERNAME;
const CREDITSAFE_PASSWORD = import.meta.env.VITE_CREDITSAFE_PASSWORD;
const CREDITSAFE_API_BASE_URL = 'https://connect.sandbox.creditsafe.com/v1';

interface CreditSafeAuthResponse {
  token: string;
}

interface CreditSafeErrorDetail {
  message?: string;
  // Potentially other fields like code, details, etc.
}

interface AxiosErrorWithResponseData extends Error {
  isAxiosError?: boolean;
  response?: {
    status: number;
    data?: CreditSafeErrorDetail | any; // data can be CreditSafeErrorDetail or other structures
  };
}

let currentToken: string | null = null;
let tokenExpiry: Date | null = null;

// Function to authenticate with CreditSafe and get a token
export const authenticateWithCreditSafe = async (): Promise<string> => {
  if (currentToken && tokenExpiry && new Date() < tokenExpiry) {
    console.log('Using cached CreditSafe token.');
    return currentToken;
  }

  if (!CREDITSAFE_USERNAME || !CREDITSAFE_PASSWORD) {
    throw new Error("CreditSafe credentials are not configured in your .env file. Please set VITE_CREDITSAFE_USERNAME and VITE_CREDITSAFE_PASSWORD.");
  }

  try {
    console.log('Attempting to authenticate with CreditSafe...');
    // Explicitly type the expected response data for the POST request
    const response = await axios.post<CreditSafeAuthResponse>(`${CREDITSAFE_API_BASE_URL}/authenticate`, {
      username: CREDITSAFE_USERNAME,
      password: CREDITSAFE_PASSWORD,
    });
    currentToken = response.data.token; // Now response.data is typed as CreditSafeAuthResponse
    tokenExpiry = new Date(new Date().getTime() + 4.5 * 60 * 1000); // Cache token for 4.5 minutes
    console.log('Successfully authenticated with CreditSafe.');
    return currentToken;
  } catch (error) {
    console.error('CreditSafe authentication failed. Full error object:', error); // Log the full error object
    currentToken = null;
    tokenExpiry = null;
    const axiosError = error as AxiosErrorWithResponseData;

    let detailedErrorMessage = 'CreditSafe authentication failed. Check console for details.';

    if (axiosError.isAxiosError && axiosError.response) {
      const status = axiosError.response.status;
      const responseData = axiosError.response.data;
      console.error(`CreditSafe API responded with status ${status}. Response data:`, responseData);

      // Attempt to extract a message from common error structures
      let apiMessage = '';
      if (responseData && typeof responseData === 'object') {
        if ('message' in responseData && typeof responseData.message === 'string') {
          apiMessage = responseData.message;
        } else if ('error' in responseData && typeof responseData.error === 'string') {
          apiMessage = responseData.error;
        } else if ('detail' in responseData && typeof responseData.detail === 'string') {
          apiMessage = responseData.detail;
        }
        // If the responseData itself is a string, use it (some APIs return plain text errors)
        else if (typeof responseData === 'string') {
          apiMessage = responseData;
        }
      }

      if (apiMessage) {
        detailedErrorMessage = `CreditSafe authentication failed: ${status} - ${apiMessage}`;
      } else {
        detailedErrorMessage = `CreditSafe authentication failed: ${status}. Response: ${JSON.stringify(responseData) || 'No additional data in response.'}`;
      }
    } else if (error instanceof Error) {
      detailedErrorMessage = `CreditSafe authentication failed: ${error.message}`;
    }
    throw new Error(detailedErrorMessage);
  }
};

// Function to search for a company by name
export const searchCompanyByNameDirect = async (companyName: string, countryCode: string = 'GB') => {
  const token = await authenticateWithCreditSafe();

  try {
    console.log(`Searching for company "${companyName}" in country ${countryCode} using direct API call.`);
    const response = await axios.get(`${CREDITSAFE_API_BASE_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { countries: countryCode, name: companyName, language: 'en' },
    });
    console.log('CreditSafe company search successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('CreditSafe company search failed. Full error object:', error); // Log the full error object
    const axiosError = error as AxiosErrorWithResponseData;
    let detailedErrorMessage = 'CreditSafe company search failed. Check console for details.';

    if (axiosError.isAxiosError && axiosError.response) {
      const status = axiosError.response.status;
      const responseData = axiosError.response.data;
      console.error(`CreditSafe API responded with status ${status}. Response data:`, responseData);
      
      let apiMessage = '';
      if (responseData && typeof responseData === 'object') {
        if ('message' in responseData && typeof responseData.message === 'string') {
          apiMessage = responseData.message;
        } else if ('error' in responseData && typeof responseData.error === 'string') {
          apiMessage = responseData.error;
        } else if ('detail' in responseData && typeof responseData.detail === 'string') {
          apiMessage = responseData.detail;
        } else if (typeof responseData === 'string') {
          apiMessage = responseData;
        }
      }

      if (apiMessage) {
        detailedErrorMessage = `CreditSafe company search failed: ${status} - ${apiMessage}`;
      } else {
        detailedErrorMessage = `CreditSafe company search failed: ${status}. Response: ${JSON.stringify(responseData) || 'No additional data in response.'}`;
      }
    } else if (error instanceof Error) {
      detailedErrorMessage = `CreditSafe company search failed: ${error.message}`;
    }
    throw new Error(detailedErrorMessage);
  }
};

// Function to get a detailed credit report for a company using its connectId
export const getCreditReportDirect = async (connectId: string) => {
  const token = await authenticateWithCreditSafe();

  try {
    console.log(`Fetching credit report for company with connectId: ${connectId}`);
    const response = await axios.get(`${CREDITSAFE_API_BASE_URL}/companies/${connectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('CreditSafe credit report fetch successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('CreditSafe credit report fetch failed. Full error object:', error);
    const axiosError = error as AxiosErrorWithResponseData;
    let detailedErrorMessage = 'CreditSafe credit report fetch failed. Check console for details.';

    if (axiosError.isAxiosError && axiosError.response) {
      const status = axiosError.response.status;
      const responseData = axiosError.response.data;
      console.error(`CreditSafe API responded with status ${status}. Response data:`, responseData);
      
      let apiMessage = '';
      if (responseData && typeof responseData === 'object') {
        if ('message' in responseData && typeof responseData.message === 'string') {
          apiMessage = responseData.message;
        } else if ('error' in responseData && typeof responseData.error === 'string') {
          apiMessage = responseData.error;
        } else if ('detail' in responseData && typeof responseData.detail === 'string') {
          apiMessage = responseData.detail;
        } else if (typeof responseData === 'string') {
          apiMessage = responseData;
        }
      }

      if (apiMessage) {
        detailedErrorMessage = `CreditSafe credit report fetch failed: ${status} - ${apiMessage}`;
      } else {
        detailedErrorMessage = `CreditSafe credit report fetch failed: ${status}. Response: ${JSON.stringify(responseData) || 'No additional data in response.'}`;
      }
    } else if (error instanceof Error) {
      detailedErrorMessage = `CreditSafe credit report fetch failed: ${error.message}`;
    }
    throw new Error(detailedErrorMessage);
  }
};
