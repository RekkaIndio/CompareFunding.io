import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CircularProgressBar from "@/components/ui/CircularProgressBar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";
import { updateDocument, getDocument, createDocument } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';

// Import components from the CreditScore folder
import CompanySearch from './CompanySearch';
import CompanyList from './CompanyList';
import CompanyHeader from './CompanyHeader';
import OverviewTab from './OverviewTab';
import NegativeInformationTab from './NegativeInformationTab';
import RiskFactorsTab from './RiskFactorsTab';
import { searchCompanyByNameDirect, getCreditReportDirect } from './api';
import { getRiskBadgeColor, isNewlyIncorporated } from './utils';

// Define interfaces for better type safety
interface Company {
  name: string;
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

interface SearchResults {
  companies?: Company[];
}

interface CreditReport {
  report?: {
    companyIdentification?: {
      basicInformation?: {
        businessName?: string;
        companyRegistrationNumber?: string;
        companyRegistrationDate?: string;
        legalForm?: {
          description?: string;
        };
        companyStatus?: {
          description?: string;
        };
        contactAddress?: {
          simpleValue?: string;
        };
      };
    };
    companySummary?: {
      businessName?: string;
      companyRegistrationNumber?: string;
      companyStatus?: {
        description?: string;
      };
      creditRating?: any;
    };
    contactInformation?: {
      mainAddress?: {
        simpleValue?: string;
      };
    };
    creditScore?: {
      currentCreditRating?: any;
      previousCreditRating?: any;
      latestRatingChangeDate?: string;
      commentary?: string;
    };
    additionalInformation?: {
      negativeInformation?: any;
      ccjSummary?: any;
    };
    negativeInformation?: any;
    negativeInfo?: any;
    adverseInfo?: any;
    warnings?: any;
    riskFactors?: any;
  };
}

const CreditScorePage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth(); // Get current authenticated user
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [creditReport, setCreditReport] = useState<CreditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [reportSaved, setReportSaved] = useState<boolean>(false);
  const [isManualReload, setIsManualReload] = useState<boolean>(false);
  
  // Check if coming from business form with auto-search parameter
  const isFromBusinessForm = location.search.includes('companyName=') || sessionStorage.getItem('credit_search_company_name') !== null;

  // Function to manually reload the saved report
  const reloadSavedReport = () => {
    if (user?.uid) {
      setIsManualReload(true);
      setIsLoading(true);
      // Clear current data
      setSearchResults(null);
      setSelectedCompany(null);
      setCreditReport(null);
      // Load saved data
      loadSavedCreditReport().finally(() => {
        setIsManualReload(false);
      });
    }
  };

  // Load saved credit report data from the user's profile
  const loadSavedCreditReport = async () => {
    if (user?.uid) {
      try {
        console.log(`Attempting to load saved credit report for user ${user.uid}`);
        setIsLoading(true);
        const userProfile = await getDocument('business_profiles', user.uid);
        console.log('User profile data:', userProfile?.data);
        
        if (userProfile?.data?.credit_info && Object.keys(userProfile.data.credit_info).length > 0) {
          console.log("Found saved credit report data:", userProfile.data.credit_info);
          setReportSaved(true);
          
          // Create a company object from the saved data
          const savedCompany: Company = {
            name: userProfile.data.credit_info.company_name || userProfile.data.business_name || '',
            registrationNumber: userProfile.data.credit_info.company_number || userProfile.data.company_number || '',
            status: userProfile.data.credit_info.company_status || '',
            // If we have a connect ID, save that too for potential future API calls
            connectId: userProfile.data.credit_info.connect_id
          };
          
          // Create a credit report object from the saved data
          const savedReport: CreditReport = {
            report: {
              companyIdentification: {
                basicInformation: {
                  businessName: savedCompany.name,
                  companyRegistrationNumber: savedCompany.registrationNumber,
                  companyRegistrationDate: userProfile.data.credit_info.registration_date || userProfile.data.credit_info.incorporation_date,
                  companyStatus: { 
                    description: userProfile.data.credit_info.status || userProfile.data.credit_info.company_status || ''
                  },
                  legalForm: {
                    description: userProfile.data.credit_info.legal_form || userProfile.data.credit_info.company_type || ''
                  }
                }
              },
              companySummary: {
                businessName: savedCompany.name,
                companyRegistrationNumber: savedCompany.registrationNumber,
                companyStatus: { 
                  description: userProfile.data.credit_info.status || '' 
                }
              },
              creditScore: {
                currentCreditRating: {
                  providerValue: { 
                    value: userProfile.data.credit_info.credit_score
                  },
                  commonValue: userProfile.data.credit_info.common_value,
                  commonDescription: userProfile.data.credit_info.common_description || userProfile.data.credit_info.risk,
                  internationalScore: {
                    value: userProfile.data.credit_info.international_score,
                    description: userProfile.data.credit_info.international_score_description
                  },
                  creditLimit: {
                    value: userProfile.data.credit_info.credit_limit
                  }
                },
                previousCreditRating: {
                  commonValue: userProfile.data.credit_info.previous_rating,
                  commonDescription: userProfile.data.credit_info.previous_rating_description
                },
                latestRatingChangeDate: userProfile.data.credit_info.latest_rating_change
              },
              additionalInformation: {
                negativeInformation: userProfile.data.credit_info.negative_information
              },
              contactInformation: {
                mainAddress: {
                  simpleValue: userProfile.data.credit_info.contact_address || 
                    (userProfile.data.address ? 
                      `${userProfile.data.address.street || ''} ${userProfile.data.address.house_number || ''}, ${userProfile.data.address.city || ''}, ${userProfile.data.address.postal_code || ''}` : 
                      '')
                }
              }
            }
          };
          
          // Set the state with the saved data
          setSelectedCompany(savedCompany);
          setCreditReport(savedReport);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error loading saved credit report:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    return false;
  };

  useEffect(() => {
    const initialize = async () => {
      // Check for auto-search parameters or stored company name from business form
      const urlCompanyName = new URLSearchParams(location.search).get('companyName');
      const storedCompanyName = sessionStorage.getItem('credit_search_company_name');
      
      // Try to load saved report first
      if (user?.uid) {
        const hasLoadedSavedReport = await loadSavedCreditReport();
        
        // If we couldn't load a saved report but have a search parameter, do a fresh search
        if (!hasLoadedSavedReport && isFromBusinessForm && (urlCompanyName || storedCompanyName)) {
          const searchTerm = urlCompanyName || storedCompanyName || '';
          setSearchQuery(searchTerm);
          fetchCompanyData(searchTerm);
          
          // Clear stored company name to prevent future auto-searches
          if (storedCompanyName) {
            sessionStorage.removeItem('credit_search_company_name');
          }
        }
      } else if (isFromBusinessForm && (urlCompanyName || storedCompanyName)) {
        // If no user but have search parameters, just do the search
        const searchTerm = urlCompanyName || storedCompanyName || '';
        setSearchQuery(searchTerm);
        fetchCompanyData(searchTerm);
        
        if (storedCompanyName) {
          sessionStorage.removeItem('credit_search_company_name');
        }
      }
    };
    
    initialize();
  }, [location, isFromBusinessForm, user]);

  const fetchCompanyData = async (companyName: string) => {
    if (!companyName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    setSelectedCompany(null);
    setCreditReport(null);
    
    try {
      const results = await searchCompanyByNameDirect(companyName) as SearchResults;
      setSearchResults(results);
      
      // Auto-select first result if there's only one
      if (results && results.companies && results.companies.length === 1) {
        handleSelectCompany(results.companies[0]);
      }
    } catch (err) {
      const errorWithMessage = err as { message?: string };
      setError(errorWithMessage.message || 'An unknown error occurred while searching for companies');
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
    setReportSaved(false);

    try {
      console.log(`Fetching credit report for connectId: ${connectId}`);
      const report = await getCreditReportDirect(connectId) as CreditReport;

      // Log full report structure to console for debugging
      console.log("Credit report structure received:", report);

      setCreditReport(report);

      // Check if the request is coming from the BusinessDetailsForm
      const fromBusinessForm = sessionStorage.getItem('from_business_form') === 'true';
      
      // If the user is authenticated and we have a report, save it to the user's profile
      if (user?.uid && report && report.report) {
        console.log("Saving credit report to user profile...");
        
        try {
          // Prepare credit info for saving with more details
          const creditInfo = {
            // Credit Score Information
            credit_score: report.report?.creditScore?.currentCreditRating?.providerValue?.value || null,
            risk: report.report?.creditScore?.currentCreditRating?.commonDescription || null,
            common_value: report.report?.creditScore?.currentCreditRating?.commonValue || null,
            common_description: report.report?.creditScore?.currentCreditRating?.commonDescription || null,
            international_score: report.report?.creditScore?.currentCreditRating?.internationalScore?.value || null,
            international_score_description: report.report?.creditScore?.currentCreditRating?.internationalScore?.description || null,
            credit_limit: report.report?.creditScore?.currentCreditRating?.creditLimit?.value || null,
            
            // Rating Change Information
            latest_rating_change: report.report?.creditScore?.latestRatingChangeDate || null,
            previous_rating: report.report?.creditScore?.previousCreditRating?.commonValue || null,
            previous_rating_description: report.report?.creditScore?.previousCreditRating?.commonDescription || null,
            
            // Company Basic Information
            company_name: report.report?.companySummary?.businessName || selectedCompany?.name || '',
            company_number: report.report?.companySummary?.companyRegistrationNumber || selectedCompany?.registrationNumber || '',
            company_type: report.report?.companyIdentification?.basicInformation?.legalForm?.description || null,
            company_status: report.report?.companyIdentification?.basicInformation?.companyStatus?.description || null,
            registration_date: report.report?.companyIdentification?.basicInformation?.companyRegistrationDate || null,
            incorporation_date: report.report?.companyIdentification?.basicInformation?.companyRegistrationDate || null,
            legal_form: report.report?.companyIdentification?.basicInformation?.legalForm?.description || null,
            
            // Additional Information
            negative_information: report.report?.additionalInformation?.negativeInformation || null,
            contact_address: report.report?.contactInformation?.mainAddress?.simpleValue || null,
            status: report.report?.companyIdentification?.basicInformation?.companyStatus?.description || null,
            
            // Metadata
            report_date: new Date().toISOString(),
            connect_id: connectId
          };

          // Check if the user has a business profile document
          const userProfile = await getDocument('business_profiles', user.uid);
          
          if (userProfile && userProfile.data) {
            // Update the existing profile with credit info
            await updateDocument('business_profiles', user.uid, {
              credit_info: creditInfo,
              last_updated: new Date().toISOString()
            });
            console.log("Updated existing profile with credit info");
          } else {
            // Create a new business profile document with credit info
            await createDocument('business_profiles', {
              credit_info: creditInfo,
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString(),
              business_name: creditInfo.company_name,
              company_number: creditInfo.company_number
            }, user.uid);
            console.log("Created new business profile with credit info");
          }
          
          // If we came from the business form, clear the flag after saving
          if (fromBusinessForm) {
            sessionStorage.removeItem('from_business_form');
          }
          
          // Indicate that the report was saved successfully
          setReportSaved(true);
          console.log("Credit report saved to user profile successfully!");
        } catch (saveError) {
          console.error("Error saving credit report to user profile:", saveError);
          // Don't show this error to the user, as it's not critical
        }
      }
    } catch (err) {
      const errorWithMessage = err as { message?: string };
      setError(errorWithMessage.message || 'An unknown error occurred while fetching the credit report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
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

  // Function to render risk rating badge
  const renderRiskBadge = (riskRating: any) => {
    if (!riskRating) return null;

    const rating = typeof riskRating === 'string'
      ? riskRating
      : riskRating.commonValue || riskRating.providerValue?.value || '';
    const description = typeof riskRating === 'string'
      ? ''
      : riskRating.commonDescription || riskRating.providerDescription || '';

    return (
      <Badge className={`${getRiskBadgeColor(rating)} py-1 px-2 text-xs font-medium`}>
        {rating}{description ? ` - ${description}` : ''}
        {typeof rating === 'string' && ['a', 'b', 'c', 'd', 'e'].includes(rating.toLowerCase()) &&
          <span className="ml-1 inline-block w-2 h-2 rounded-full" style={{
            backgroundColor:
              rating.toLowerCase() === 'a' || rating.toLowerCase() === 'b' || rating.toLowerCase() === 'c' ? '#22c55e' :
                rating.toLowerCase() === 'd' ? '#ef4444' :
                  rating.toLowerCase() === 'e' ? '#f97316' : '#9ca3af'
          }}></span>
        }
      </Badge>
    );
  };

  return (
    <PageLayout showSidebar={true}>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Credit Score & Company Information</h1>
            <p className="text-gray-600">Search for companies and view their credit reports</p>
          </div>
          {user && reportSaved && (
            <button
              onClick={reloadSavedReport}
              disabled={isLoading || isManualReload}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition flex items-center"
            >
              {isManualReload ? (
                <>
                  <div className="mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>Load My Credit Report</>
              )}
            </button>
          )}
        </div>

        <CompanySearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isFromBusinessForm={isFromBusinessForm}
          isLoading={isLoading}
          missingCredentials={!import.meta.env.VITE_CREDITSAFE_USERNAME || !import.meta.env.VITE_CREDITSAFE_PASSWORD}
        />

        {!selectedCompany && (
          <CompanyList
            searchResults={searchResults}
            handleSelectCompany={handleSelectCompany}
            isLoading={isLoading}
            error={error}
          />
        )}

        {isLoading && selectedCompany && (
          <div className="flex justify-center my-12">
            <div className="loader"></div>
            <span className="ml-3 text-gray-600">Fetching credit report...</span>
          </div>
        )}

        {!isLoading && selectedCompany && creditReport && (
          <div className="mt-8">
            {/* Report saved confirmation alert */}
            {reportSaved && isManualReload && (
              <div className="mb-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  <AlertTitle className="text-blue-800 font-bold">Loaded from your profile</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    You are viewing the credit report saved to your business profile.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Report saved confirmation alert */}
            {reportSaved && !isManualReload && (
              <div className="mb-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <AlertTitle className="text-green-800 font-bold">Credit report saved!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    This credit report has been saved to your business profile.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md">
              <CompanyHeader
                creditReport={creditReport}
                selectedCompany={selectedCompany}
                renderRiskBadge={renderRiskBadge}
              />
              
              {/* Credit Report Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="px-6 pt-2 bg-[#212936] border-b-0">
                  <TabsTrigger value="overview" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="negative" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">Negative Information</TabsTrigger>
                  <TabsTrigger value="risk" className="text-white data-[state=active]:bg-orange-500 data-[state=active]:text-white">Risk Factors</TabsTrigger>
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="p-0">
                  <OverviewTab creditReport={creditReport} />
                </TabsContent>
                
                {/* Negative Information Tab */}
                <TabsContent value="negative" className="p-0">
                  <NegativeInformationTab creditReport={creditReport} />
                </TabsContent>
                
                {/* Risk Factors Tab */}
                <TabsContent value="risk" className="p-0">
                  <RiskFactorsTab creditReport={creditReport} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .loader {
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top: 3px solid rgba(59, 130, 246, 1);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Tab transitions */
        .tab-content-enter {
          opacity: 0;
          transform: translateY(8px);
        }
        
        .tab-content-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms, transform 300ms;
        }
        
        .tab-content-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .tab-content-exit-active {
          opacity: 0;
          transform: translateY(-8px);
          transition: opacity 300ms, transform 300ms;
        }
      `}</style>
    </PageLayout>
  );
};

export default CreditScorePage;
