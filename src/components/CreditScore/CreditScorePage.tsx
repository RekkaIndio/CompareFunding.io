import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CircularProgressBar from "@/components/ui/CircularProgressBar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Info, AlertCircle, CheckCircle, RefreshCw, Building2, BarChart3, AlertTriangle, Shield } from "lucide-react";
import { updateDocument, getDocument, createDocument } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { normalizeCreditScoreData, createFinancialsCreditScoreDocument } from '@/lib/creditScoreUtils';

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
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

        setIsLoading(true);
        
        // First try to get data from the credit_score subcollection
        const creditScoreDoc = await getDocument('businesses', `${user.uid}/credit_score/latest`);

        
        // If we found data in the subcollection, use that
        if (creditScoreDoc?.data && Object.keys(creditScoreDoc.data).length > 0) {

          setReportSaved(true);
          
          // Create a company object from the saved data
          const savedCompany: Company = {
            name: creditScoreDoc.data.company_name || '',
            registrationNumber: creditScoreDoc.data.company_number || '',
            status: creditScoreDoc.data.company_status || '',
            // If we have a connect ID, save that too for potential future API calls
            connectId: creditScoreDoc.data.connect_id
          };
          
          // Create a credit report object from the saved data
          const savedReport: CreditReport = {
            report: creditScoreDoc.data.raw_report || {
              companyIdentification: {
                basicInformation: {
                  businessName: savedCompany.name,
                  companyRegistrationNumber: savedCompany.registrationNumber,
                  companyRegistrationDate: creditScoreDoc.data.registration_date || creditScoreDoc.data.incorporation_date,
                  companyStatus: { 
                    description: creditScoreDoc.data.status || creditScoreDoc.data.company_status || ''
                  },
                  legalForm: {
                    description: creditScoreDoc.data.legal_form || creditScoreDoc.data.company_type || ''
                  }
                }
              },
              companySummary: {
                businessName: savedCompany.name,
                companyRegistrationNumber: savedCompany.registrationNumber,
                companyStatus: { 
                  description: creditScoreDoc.data.status || '' 
                }
              },
              creditScore: {
                currentCreditRating: {
                  providerValue: { 
                    value: creditScoreDoc.data.credit_score
                  },
                  commonValue: creditScoreDoc.data.common_value,
                  commonDescription: creditScoreDoc.data.common_description || creditScoreDoc.data.risk,
                  creditLimit: {
                    value: creditScoreDoc.data.credit_limit
                  }
                },
                previousCreditRating: {
                  commonValue: creditScoreDoc.data.previous_rating,
                  commonDescription: creditScoreDoc.data.previous_rating_description
                },
                latestRatingChangeDate: creditScoreDoc.data.latest_rating_change
              },
              additionalInformation: {
                negativeInformation: creditScoreDoc.data.negative_information
              },
              contactInformation: {
                mainAddress: {
                  simpleValue: creditScoreDoc.data.contact_address || 
                    (creditScoreDoc.data.address ? 
                      `${creditScoreDoc.data.address.street || ''} ${creditScoreDoc.data.address.house_number || ''}, ${creditScoreDoc.data.address.city || ''}, ${creditScoreDoc.data.address.postal_code || ''}` : 
                      '')
                }
              }
            }
          };
          
          // Set the state with the saved data
          setSelectedCompany(savedCompany);
          setCreditReport(savedReport);
          return true;
        } else {
          // Fallback to the old method - try to get data from the main business document
          const userProfile = await getDocument('businesses', user.uid);

          
          if (userProfile?.data?.credit_info && Object.keys(userProfile.data.credit_info).length > 0) {

            setReportSaved(true);
            
            // Create a company object from the saved data
            const savedCompany: Company = {
              name: userProfile.data.credit_info.company_name || userProfile.data.business_name || '',
              registrationNumber: userProfile.data.credit_info.company_number || userProfile.data.company_number || '',
              status: userProfile.data.credit_info.company_status || '',
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
                    commonDescription: userProfile.data.credit_info.common_description || userProfile.data.credit_info.risk
                  }
                }
              }
            };
            
            setSelectedCompany(savedCompany);
            setCreditReport(savedReport);
            
            // Also migrate this data to the new subcollection structure for future use

            try {
              await createDocument('businesses', {
                ...userProfile.data.credit_info,
                raw_report: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                migrated_from_main_doc: true
              }, `${user.uid}/credit_score/latest`);
              

            } catch (migrationError) {
              console.error("Error migrating credit info to subcollection:", migrationError);
            }
            
            return true;
          }
          
          return false;
        }
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
          fetchCompanyData(searchTerm);
          
          // Clear stored company name to prevent future auto-searches
          if (storedCompanyName) {
            sessionStorage.removeItem('credit_search_company_name');
          }
        }
      } else if (isFromBusinessForm && (urlCompanyName || storedCompanyName)) {
        // If no user but have search parameters, just do the search
        const searchTerm = urlCompanyName || storedCompanyName || '';
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
    setSelectedCompany(null);
    setCreditReport(null);
    
    try {
      const results = await searchCompanyByNameDirect(companyName) as SearchResults;
      
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
  
  const fetchCreditReport = async (connectId: string) => {
    setIsLoading(true);
    setError(null);
    setCreditReport(null);
    setReportSaved(false);

    try {

      const report = await getCreditReportDirect(connectId) as CreditReport;

      // Log full report structure to console for debugging


      setCreditReport(report);

      // Check if the request is coming from the BusinessDetailsForm
      const fromBusinessForm = sessionStorage.getItem('from_business_form') === 'true';
      
      // If the user is authenticated and we have a report, save it to the user's profile
      if (user?.uid && report && report.report) {

        
        try {
          // Prepare credit info for saving with more details
          const creditInfo = {
            // Credit Score Information
            credit_score: report.report?.creditScore?.currentCreditRating?.providerValue?.value || null,
            risk: report.report?.creditScore?.currentCreditRating?.commonDescription || null,
            common_value: report.report?.creditScore?.currentCreditRating?.commonValue || null,
            common_description: report.report?.creditScore?.currentCreditRating?.commonDescription || null,
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
          const userProfile = await getDocument('businesses', user.uid);
          
          // Save detailed credit score in the credit_score subcollection
          await createDocument('businesses', {
            ...creditInfo,
            raw_report: report.report || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, `${user.uid}/credit_score/latest`);
          

          
          // Also update the main business document if it exists, but only with basic info
          if (userProfile && userProfile.data) {
            // Update the existing profile with minimal credit info
            await updateDocument('businesses', user.uid, {
              business_name: creditInfo.company_name,
              company_number: creditInfo.company_number,
              credit_score_updated_at: new Date().toISOString()
            });

          } else {
            // Create a new business profile document with basic info
            await createDocument('businesses', {
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString(),
              business_name: creditInfo.company_name,
              company_number: creditInfo.company_number,
              credit_score_updated_at: new Date().toISOString()
            }, user.uid);

          }
          
          // If we came from the business form, clear the flag after saving
          if (fromBusinessForm) {
            sessionStorage.removeItem('from_business_form');
          }
          
          // Only save to businesses collection for data consolidation
          const db = getFirestore();
          try {
            // Normalize credit info for consistent structure
            const normalizedCreditInfo = normalizeCreditScoreData(creditInfo);
            
            // First, ensure the business document exists
            const businessRef = doc(db, "businesses", user.uid);
            await setDoc(businessRef, {
              name: creditInfo.company_name,
              business_name: creditInfo.company_name,
              company_number: creditInfo.company_number,
              credit_info: normalizedCreditInfo,
              updatedAt: serverTimestamp(),
              active: true
            }, { merge: true });
            
            // Then save detailed credit score to financials subcollection as credit_score document
            const creditScoreRef = doc(collection(db, "businesses", user.uid, "financials"), "credit_score");
            await setDoc(creditScoreRef, createFinancialsCreditScoreDocument(
              creditInfo,
              creditInfo.company_name,
              creditInfo.company_number,
              report.report
            ));

          } catch (error) {
            console.error("Error saving to businesses collection:", error);
          }

          // Indicate that the report was saved successfully
          setReportSaved(true);

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

    setSelectedCompany(company);

    // The connectId might be in company.id, or in a nested property
    // Try to find where connectId might be located
    const connectId = company.connectId || company.id ||
      (company.identification?.connectId) ||
      (company.identification?.id);

    if (connectId) {

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Business Credit Analysis
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Comprehensive credit reports and financial insights for informed business decisions
                  </p>
                </div>
                {user && reportSaved && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Report Saved</span>
                    </div>
                    <button
                      onClick={reloadSavedReport}
                      disabled={isLoading || isManualReload}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                               text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center 
                               shadow-lg hover:shadow-xl transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isManualReload ? (
                        <>
                          <div className="mr-3 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2" />
                          Refresh Report
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State - when no company data is available */}
          {!isLoading && !selectedCompany && !creditReport && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Credit Report Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Complete your business details form to automatically generate and view your company's credit report.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                  <div className="absolute top-0 left-0 h-16 w-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedCompany ? 'Generating Credit Report' : 'Loading Credit Data'}
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  {selectedCompany 
                    ? 'Please wait while we fetch the latest credit information and risk analysis...'
                    : isManualReload 
                      ? 'Refreshing your saved credit report...'
                      : 'Processing your request...'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Credit Report Section */}
          {!isLoading && selectedCompany && creditReport && (
            <div className="space-y-8">
              {/* Status Alerts */}
              {reportSaved && isManualReload && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <Info className="h-6 w-6 text-blue-600 mt-0.5 mr-4 flex-shrink-0" />
                    <div>
                      <h4 className="text-blue-900 font-semibold mb-2">Loaded from Profile</h4>
                      <p className="text-blue-800">You are viewing the credit report saved to your business profile.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {reportSaved && !isManualReload && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 mr-4 flex-shrink-0" />
                    <div>
                      <h4 className="text-green-900 font-semibold mb-2">Report Saved Successfully</h4>
                      <p className="text-green-800">This credit report has been saved to your business profile for future reference.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Main Credit Report Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <CompanyHeader
                  creditReport={creditReport}
                  selectedCompany={selectedCompany}
                  renderRiskBadge={renderRiskBadge}
                />
                
                {/* Enhanced Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="bg-gray-50 border-b border-gray-200 px-6">
                    <TabsList className="bg-transparent h-auto space-x-2 py-4">
                      <TabsTrigger 
                        value="overview" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white 
                                 data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900
                                 data-[state=inactive]:hover:bg-white data-[state=inactive]:bg-transparent
                                 px-6 py-3 rounded-lg font-medium transition-all duration-200 border-0 shadow-sm"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="negative" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white 
                                 data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900
                                 data-[state=inactive]:hover:bg-white data-[state=inactive]:bg-transparent
                                 px-6 py-3 rounded-lg font-medium transition-all duration-200 border-0 shadow-sm"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Risk Analysis
                      </TabsTrigger>
                      <TabsTrigger 
                        value="risk" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white 
                                 data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900
                                 data-[state=inactive]:hover:bg-white data-[state=inactive]:bg-transparent
                                 px-6 py-3 rounded-lg font-medium transition-all duration-200 border-0 shadow-sm"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Risk Factors
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="bg-white">
                    <TabsContent value="overview" className="p-0 m-0">
                      <OverviewTab creditReport={creditReport} />
                    </TabsContent>
                    
                    <TabsContent value="negative" className="p-0 m-0">
                      <NegativeInformationTab creditReport={creditReport} />
                    </TabsContent>
                    
                    <TabsContent value="risk" className="p-0 m-0">
                      <RiskFactorsTab creditReport={creditReport} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        /* Enhanced tab transitions */
        .tab-content-enter {
          opacity: 0;
          transform: translateY(12px);
        }
        
        .tab-content-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
        }
        
        .tab-content-exit {
          opacity: 1;
          transform: translateY(0);
        }
        
        .tab-content-exit-active {
          opacity: 0;
          transform: translateY(-12px);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
        }

        /* Smooth gradient animations */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }

        /* Enhanced loading animation */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Card hover effects */
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Professional button styling */
        .btn-professional {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn-professional::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .btn-professional:hover::before {
          left: 100%;
        }
        
        .btn-professional:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }

        /* Improved text gradients */
        .text-gradient {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </PageLayout>
  );
};

export default CreditScorePage;
