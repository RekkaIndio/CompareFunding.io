import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Company {
  id?: string;
  connectId?: string;
  name?: string;
  address?: {
    simpleValue?: string;
  };
  status?: string;
  registrationNumber?: string;
  [key: string]: any;
}

interface CompanyListProps {
  searchResults: any;
  handleSelectCompany: (company: any) => void;
  isLoading: boolean;
  error: string | null;
}

export const CompanyList: React.FC<CompanyListProps> = ({
  searchResults,
  handleSelectCompany,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="loader"></div>
        <span className="ml-3 text-gray-600">Searching for companies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!searchResults) {
    return null;
  }

  const companies = searchResults.companies || [];

  if (companies.length === 0) {
    return (
      <Alert className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No results found</AlertTitle>
        <AlertDescription>
          No companies match your search criteria. Please try a different search term.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
        <CardDescription>Select a company to view its credit report</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {companies.map((company: Company, index: number) => (
            <div key={company.id || index} className="p-3 border rounded hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-medium text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {company.address?.simpleValue || 'Address not available'}
                    {company.registrationNumber && ` • Reg: ${company.registrationNumber}`}
                    {company.status && ` • Status: ${company.status}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={() => handleSelectCompany(company)}
                >
                  View Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyList;
