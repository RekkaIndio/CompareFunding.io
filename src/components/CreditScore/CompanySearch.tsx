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
            <Alert className="mb-4" variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Auto-search</AlertTitle>
              <AlertDescription>
                Performing search for company "{displayCompanyName}" from business details form.
              </AlertDescription>
            </Alert>
          );
        }
        return null;
      })()}

      {missingCredentials ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>CreditSafe API credentials not configured</AlertTitle>
          <AlertDescription>
            CreditSafe API credentials are not set up in the environment variables. Please add VITE_CREDITSAFE_USERNAME and VITE_CREDITSAFE_PASSWORD to your .env file.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a company by name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500" 
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompanySearch;
