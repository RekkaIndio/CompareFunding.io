import React from 'react';
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CompanySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  isFromBusinessForm: boolean;
  isLoading: boolean;
  missingCredentials?: boolean;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isFromBusinessForm,
  isLoading,
  missingCredentials
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      {(() => {
        const urlCompanyName = typeof window !== 'undefined' ? 
          new URLSearchParams(window.location.search).get('companyName') : null;
        const storedCompanyName = typeof sessionStorage !== 'undefined' ? 
          sessionStorage.getItem('credit_search_company_name') : null;
        const displayCompanyName = urlCompanyName || storedCompanyName;

        if (isFromBusinessForm && displayCompanyName) {
          return (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-900 font-semibold mb-1">Auto-Search Active</h4>
                  <p className="text-blue-800">
                    Performing automatic search for company "{displayCompanyName}" from your business details form.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {missingCredentials ? (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-red-900 font-semibold mb-1">Configuration Required</h4>
              <p className="text-red-800">
                CreditSafe API credentials are missing. Please configure VITE_CREDITSAFE_USERNAME and VITE_CREDITSAFE_PASSWORD in your environment variables.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label htmlFor="company-search" className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Enter the full company name to search for credit information and financial reports.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="company-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Apple Inc, Microsoft Corporation..."
                className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-base
                         bg-white placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-orange-500 focus:border-orange-500 transition-all duration-200
                         hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700
                       text-white px-8 py-4 rounded-lg font-semibold text-base transition-all duration-200
                       focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105
                       disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl min-w-[120px]" 
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Searching...
                </div>
              ) : (
                <div className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySearch;
