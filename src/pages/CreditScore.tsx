import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import axios from 'axios'; // Import axios

// --- START OF CREDITSAFE DIRECT API CALL CONFIGURATION ---
// Credentials are now read from .env file (e.g., VITE_CREDITSAFE_USERNAME)
const CREDITSAFE_USERNAME = import.meta.env.VITE_CREDITSAFE_USERNAME;
const CREDITSAFE_PASSWORD = import.meta.env.VITE_CREDITSAFE_PASSWORD;
const CREDITSAFE_API_BASE_URL = 'https://connect.sandbox.creditsafe.com/v1';
// --- END OF CREDITSAFE DIRECT API CALL CONFIGURATION ---

interface CreditSafeAuthResponse {
  token: string;
}

interface CreditSafeErrorDetail {
  message?: string;
  // Potentially other fields like code, details, etc.
}

interface AxiosErrorWithResponseData extends Error { // Basic structure for an Axios-like error
    isAxiosError?: boolean;
    response?: {
        status: number;
        data?: CreditSafeErrorDetail | any; // data can be CreditSafeErrorDetail or other structures
    };
}

let currentToken: string | null = null;
let tokenExpiry: Date | null = null;

// Function to authenticate with CreditSafe and get a token
const authenticateWithCreditSafe = async (): Promise<string> => {
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
const searchCompanyByNameDirect = async (companyName: string, countryCode: string = 'GB') => {
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
const getCreditReportDirect = async (connectId: string) => {
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

export { authenticateWithCreditSafe, searchCompanyByNameDirect, getCreditReportDirect };

const CreditScorePage: React.FC = () => {
  const [companyData, setCompanyData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [creditReport, setCreditReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompanyData = async (companyName: string) => {
    if (!companyName.trim()) {
      setError("Please enter a company name.");
      setSearchResults(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    setSelectedCompany(null);
    setCreditReport(null);

    if (!CREDITSAFE_USERNAME || !CREDITSAFE_PASSWORD) {
        const warningMsg = "TESTING MODE: CreditSafe credentials (VITE_CREDITSAFE_USERNAME, VITE_CREDITSAFE_PASSWORD) are missing from your .env file. API calls will fail. Please add them and restart the development server if necessary.";
        console.warn(warningMsg);
        setError(warningMsg);
        setIsLoading(false);
        return; 
    }

    try {
      console.log(`Searching for company: ${companyName}`);
      const data = await searchCompanyByNameDirect(companyName, 'GB'); 
      setSearchResults(data);
    } catch (err) {
      const errorWithMessage = err as { message?: string }; // Type assertion for error with message
      setError(errorWithMessage.message || 'An unknown error occurred');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCompanyData(searchQuery);
  };

  const fetchCreditReport = async (connectId: string) => {
    setIsLoading(true);
    setError(null);
    setCreditReport(null);
    
    try {
      console.log(`Fetching credit report for connectId: ${connectId}`);
      const report = await getCreditReportDirect(connectId);
      
      // Log full report structure to console for debugging
      console.log("Credit report structure received:", report);
      
      setCreditReport(report);
    } catch (err) {
      const errorWithMessage = err as { message?: string };
      setError(errorWithMessage.message || 'An unknown error occurred while fetching the credit report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    // Log the entire company object to inspect its structure
    console.log("Selected company object:", company);
    setSelectedCompany(company);
    
    // The connectId might be in company.id, or in a nested property
    // Try to find where connectId might be located
    const connectId = company.connectId || company.id || 
                     (company.identification?.connectId) || 
                     (company.identification?.id);
    
    if (connectId) {
      console.log("Found connectId:", connectId);
      fetchCreditReport(connectId);
    } else {
      console.error("Could not find connectId in company object:", company);
      setError("Selected company does not have a valid connectId. See console for details.");
    }
  };

  return (
    <PageLayout showSidebar={true}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Credit Score & Company Search (Direct API Test)</h1>
        
        <div className="mb-4 p-4 border border-orange-500 bg-orange-100 rounded-md">
          <p className="text-orange-700 font-semibold">IMPORTANT TESTING INFORMATION:</p>
          <p className="text-orange-700 text-sm">
            This page is configured for <strong>direct frontend API calls to CreditSafe for testing purposes</strong>.
            It attempts to read API credentials (<code>VITE_CREDITSAFE_USERNAME</code> and <code>VITE_CREDITSAFE_PASSWORD</code>) from your <code>.env</code> file.
          </p>
          <ul className="list-disc list-inside text-orange-700 text-sm mt-2">
            <li>Ensure your <code>.env</code> file at the root of the project contains your valid CreditSafe sandbox credentials.</li>
            <li>Example <code>.env</code> entries:
              <pre className="bg-orange-50 p-1 mt-1 text-xs">{'VITE_CREDITSAFE_USERNAME=your_username\\nVITE_CREDITSAFE_PASSWORD=your_password'}</pre>
            </li>
            <li>If you modify your <code>.env</code> file, you may need to restart the Vite development server for changes to take effect.</li>
            <li>This direct frontend API key usage is <strong>highly insecure for production</strong>. For deployment, API calls MUST be handled by a secure backend.</li>
          </ul>
        </div>

        <div className="mb-4 flex gap-2">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter company name" 
            className="border p-2 rounded-md flex-grow text-gray-900"
          />
          <button 
            onClick={handleSearch} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {isLoading && <p className="text-blue-600 font-medium">Loading data...</p>}
        {error && <p className="text-red-500 p-2 bg-red-100 border border-red-300 rounded font-medium">Error: {error}</p>}
        
        {searchResults && searchResults.companies && searchResults.companies.length > 0 && !selectedCompany && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">Company Search Results:</h2>
            <div className="space-y-2">
              {searchResults.companies.map((company: any) => (
                <div
                  key={company.connectId}
                  className="p-3 border rounded-md hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                  onClick={() => handleSelectCompany(company)}
                >
                  <div key={`info-${company.connectId}`}>
                    <h3 className="font-medium text-gray-800">{company.name}</h3>
                    <p className="text-sm text-gray-600">
                      {company.address?.simpleValue || 'Address not available'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {company.connectId || company.id || 
                          (company.identification?.connectId) || 
                          (company.identification?.id) || 'Not available'}
                    </p>
                  </div>
                  <button
                    key={`btn-${company.connectId}`}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent firing the parent onClick
                      handleSelectCompany(company);
                    }}
                  >
                    View Credit Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {searchResults && searchResults.companies && searchResults.companies.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
            <p className="text-yellow-700">No companies found matching your search criteria.</p>
          </div>
        )}

        {selectedCompany && (
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">Selected Company:</h2>
              <button 
                className="text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSelectedCompany(null);
                  setCreditReport(null);
                }}
              >
                Back to search results
              </button>
            </div>
            <div className="p-3 border rounded-md bg-blue-50">
              <h3 className="font-medium text-gray-800">{selectedCompany.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedCompany.address?.simpleValue || 'Address not available'}
              </p>
              <p className="text-xs text-gray-500">
                ID: {selectedCompany.connectId || selectedCompany.id || 
                    (selectedCompany.identification?.connectId) || 
                    (selectedCompany.identification?.id) || 'Not available'}
              </p>
            </div>
          </div>
        )}
        
        {creditReport && (
          <div>
            <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">Credit Report:</h2>
            <div className="bg-gray-100 p-4 rounded mt-2 overflow-hidden">
              {/* Company Identification Section */}
              <div key="company-info" className="mb-6 bg-white p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Company Name:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                         creditReport.report?.companySummary?.businessName || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Company Number:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber || 
                         creditReport.report?.companySummary?.companyRegistrationNumber || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Company Type:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Status:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                         creditReport.report?.companySummary?.companyStatus?.description || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Registration Date:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate ? 
                          new Date(creditReport.report.companyIdentification.basicInformation.companyRegistrationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Address:</span>
                      <span className="text-gray-800">
                        {creditReport.report?.contactInformation?.mainAddress?.simpleValue || 
                         creditReport.report?.companyIdentification?.basicInformation?.contactAddress?.simpleValue || 'Address not available'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Country:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companyIdentification?.basicInformation?.country || 
                         creditReport.report?.companySummary?.country || 
                         creditReport.report?.contactInformation?.mainAddress?.country || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Main Activity:</span> 
                      <span className="text-gray-800">
                        {creditReport.report?.companySummary?.mainActivity?.description || 
                         (creditReport.report?.companyIdentification?.activityClassifications?.[0]?.activities?.[0]?.description) || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Credit Information Section */}
              <div key="credit-info" className="mb-6 bg-white p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Credit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-4 p-3 border border-green-500 bg-green-50 rounded-md">
                      <p className="font-semibold text-gray-800 text-lg">
                        Credit Score: {
                          creditReport.report?.creditScore?.currentCreditRating?.providerValue?.value ||
                          creditReport.report?.companySummary?.creditRating?.providerValue?.value || 'N/A'
                        }
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Rating:</span> {
                          creditReport.report?.creditScore?.currentCreditRating?.commonValue ||
                          creditReport.report?.companySummary?.creditRating?.commonValue || 'N/A'
                        } - {
                          creditReport.report?.creditScore?.currentCreditRating?.commonDescription ||
                          creditReport.report?.companySummary?.creditRating?.commonDescription || 'N/A'
                        }
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Provider Description:</span> {
                          creditReport.report?.creditScore?.currentCreditRating?.providerDescription ||
                          creditReport.report?.companySummary?.creditRating?.providerDescription || 'N/A'
                        }
                      </p>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Credit Limit:</span> 
                      <span className="text-gray-800">{
                        creditReport.report?.creditScore?.currentCreditRating?.creditLimit?.value ?
                          `${creditReport.report.creditScore.currentCreditRating.creditLimit.value} ${creditReport.report.creditScore.currentCreditRating.creditLimit.currency || ''}` :
                          creditReport.report?.companySummary?.creditRating?.creditLimit?.value ?
                          `${creditReport.report.companySummary.creditRating.creditLimit.value} ${creditReport.report.companySummary.creditRating.creditLimit.currency || ''}` :
                          'N/A'
                      }</span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Odds of Failure:</span> 
                      <span className="text-gray-800">{
                        creditReport.report?.additionalInformation?.miscellaneous?.oddsOfFailure || 'N/A'
                      }</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Latest Rating Change:</span> 
                      <span className="text-gray-800">{
                        creditReport.report?.creditScore?.latestRatingChangeDate ? 
                        new Date(creditReport.report.creditScore.latestRatingChangeDate).toLocaleDateString() : 'N/A'
                      }</span>
                    </p>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-gray-700 block">Previously Rated:</span> 
                      <span className="text-gray-800">{
                        creditReport.report?.creditScore?.previousCreditRating?.commonValue ? 
                        `${creditReport.report.creditScore.previousCreditRating.commonValue} - ${creditReport.report.creditScore.previousCreditRating.commonDescription || ''}` : 'N/A'
                      }</span>
                    </p>
                    {creditReport.report?.additionalInformation?.scoreTiers && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs font-medium text-gray-700">Industry Ranking</p>
                        <p className="text-sm text-gray-600">
                          {creditReport.report.additionalInformation.scoreTiers[0]?.ranking?.description || 'Not available'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Commentaries and Negative Information */}
              <div key="commentaries" className="mb-6 bg-white p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Commentaries & Risk Factors</h3>
                
                {/* Credit Commentaries */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Credit Commentary:</h4>
                  {creditReport.report?.creditScore?.commentary ? (
                    <div className="p-3 border border-blue-100 bg-blue-50 rounded-md">
                      <p className="text-sm text-gray-800">
                        {creditReport.report.creditScore.commentary}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">No credit commentary available.</p>
                  )}
                </div>

                {/* Risk Assessment */}
                {creditReport.report?.additionalInformation?.riskAssessment && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Risk Assessment:</h4>
                    <div className="p-3 border border-yellow-100 bg-yellow-50 rounded-md">
                      <p className="text-sm text-gray-800">
                        {creditReport.report.additionalInformation.riskAssessment.riskBand && (
                          <span className="block mb-1">
                            <span className="font-medium">Risk Band:</span> {creditReport.report.additionalInformation.riskAssessment.riskBand}
                          </span>
                        )}
                        {creditReport.report.additionalInformation.riskAssessment.description && (
                          <span className="block">
                            {creditReport.report.additionalInformation.riskAssessment.description}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Negative Information - Legal Events */}
                <div className="mt-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Negative Information:</h4>
                  {(() => {
                    const legalEvents = creditReport.report?.additionalInformation?.negativeInformation?.legalEvents;
                    const ccjs = creditReport.report?.additionalInformation?.negativeInformation?.ccjs;
                    const otherEvents = creditReport.report?.additionalInformation?.negativeInformation?.otherEvents;
                    
                    let hasNegativeInfo = false;
                    
                    if (legalEvents?.length || ccjs?.length || otherEvents?.length) {
                      hasNegativeInfo = true;
                      return (
                        <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                          {legalEvents?.length > 0 && (
                            <>
                              <p className="font-medium text-sm text-red-700 mb-1">Legal Events:</p>
                              <ul className="list-disc pl-5 space-y-1 mb-3">
                                {legalEvents.map((event: any, index: number) => (
                                  <li key={`legal-event-${index}`} className="text-sm text-red-700">
                                    {event.type}: {event.description} 
                                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                                    {event.status && ` - ${event.status}`}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          
                          {ccjs?.length > 0 && (
                            <>
                              <p className="font-medium text-sm text-red-700 mb-1">County Court Judgments:</p>
                              <ul className="list-disc pl-5 space-y-1 mb-3">
                                {ccjs.map((ccj: any, index: number) => (
                                  <li key={`ccj-${index}`} className="text-sm text-red-700">
                                    Amount: {ccj.amount?.value} {ccj.amount?.currency}
                                    {ccj.date && ` (${new Date(ccj.date).toLocaleDateString()})`}
                                    {ccj.caseNumber && ` - Case: ${ccj.caseNumber}`}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          
                          {otherEvents?.length > 0 && (
                            <>
                              <p className="font-medium text-sm text-red-700 mb-1">Other Events:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {otherEvents.map((event: any, index: number) => (
                                  <li key={`other-event-${index}`} className="text-sm text-red-700">
                                    {event.type}: {event.description}
                                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      );
                    } 
                    
                    // Fall back to more generic structure if specific structures aren't found
                    const negativeInfo = 
                      creditReport.report?.additionalInformation?.negativeInformation ||
                      creditReport.report?.negativeInformation || 
                      creditReport.report?.negativeInfo ||
                      creditReport.report?.adverseInfo || 
                      creditReport.report?.warnings ||
                      creditReport.report?.riskFactors;
                      
                    if (negativeInfo && !hasNegativeInfo) {
                      return (
                        <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                          <ul className="list-disc pl-5 space-y-1">
                            {Array.isArray(negativeInfo) ? 
                              negativeInfo.map((item: any, index: number) => (
                                <li key={`negative-${index}`} className="text-sm text-red-700">
                                  {item.text || item.value || item.description || item.warning || JSON.stringify(item)}
                                </li>
                              )) : 
                              <li className="text-sm text-red-700">
                                {typeof negativeInfo === 'object' && Object.keys(negativeInfo).length > 0 ? 
                                  JSON.stringify(negativeInfo) : 
                                  typeof negativeInfo === 'string' ? negativeInfo : 'Negative information present but details unavailable'}
                              </li>
                            }
                          </ul>
                        </div>
                      );
                    } else {
                      return <p className="text-sm text-green-600">No negative information reported.</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Directors & Officers Section */}
              {creditReport.report?.directors && creditReport.report.directors.length > 0 && (
                <div key="directors" className="mb-6 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Directors & Officers</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointed</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {creditReport.report.directors.map((director: any, index: number) => (
                          <tr key={`director-${index}`}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {director.name || 
                               (director.firstName && director.lastName ? `${director.firstName} ${director.lastName}` : 'N/A')}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {director.position || director.title || director.role || 'Director'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {director.dateAppointed ? new Date(director.dateAppointed).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {director.status || (director.resigned ? 'Resigned' : 'Active')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Information Section */}
              {creditReport.report?.financialInformation?.yearlyFinancials && creditReport.report.financialInformation.yearlyFinancials.length > 0 && (
                <div key="financials" className="mb-6 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Financial Information</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year End</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assets</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {creditReport.report.financialInformation.yearlyFinancials.map((financial: any, index: number) => (
                          <tr key={`financial-${index}`}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {financial.yearEndDate ? new Date(financial.yearEndDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {financial.revenue?.value ? `${financial.revenue.value} ${financial.revenue.currency || ''}` : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {financial.profitOrLoss?.value ? 
                                `${financial.profitOrLoss.value} ${financial.profitOrLoss.currency || ''}` : 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {financial.totalAssets?.value ? 
                                `${financial.totalAssets.value} ${financial.totalAssets.currency || ''}` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw JSON Data (Preserved) */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Raw Report Data:</h3>
                <pre className="bg-white p-3 rounded shadow-sm overflow-x-auto text-gray-900 text-sm">
                  {JSON.stringify(creditReport, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CreditScorePage;
