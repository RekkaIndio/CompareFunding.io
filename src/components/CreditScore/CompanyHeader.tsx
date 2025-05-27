import React from 'react';
import { Badge } from '@/components/ui/badge';
import CircularProgressBar from '@/components/ui/CircularProgressBar';
import { isNewlyIncorporated } from './utils';

interface CompanyHeaderProps {
  creditReport: any;
  selectedCompany: any;
  renderRiskBadge: (riskRating: any) => React.ReactNode;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  creditReport,
  selectedCompany,
  renderRiskBadge,
}) => {
  return (
    <div className="bg-[#212936] rounded-t-lg text-white p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex-grow">
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-white">
              {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
               creditReport.report?.companySummary?.businessName || selectedCompany.name}
            </h1>
            
            {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description && (
              <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-100">
                {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-orange-100 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-white">
              {creditReport.report?.contactInformation?.mainAddress?.simpleValue || 
               creditReport.report?.companyIdentification?.basicInformation?.contactAddress?.simpleValue || 
               selectedCompany.address?.simpleValue || 'Address not available'}
            </span>
            
            {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber && (
              <span className="flex items-center text-white before:content-['•'] before:mx-2 before:text-white">
                Registration: {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber}
              </span>
            )}
            
            {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate && (
              <span className="flex items-center text-white before:content-['•'] before:mx-2 before:text-white">
                Established: {new Date(creditReport.report.companyIdentification.basicInformation.companyRegistrationDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="mb-2 sm:mb-0 sm:mr-3">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <CircularProgressBar
                  value={
                    Number(
                      creditReport.report?.creditScore?.currentCreditRating?.providerValue?.value ??
                      creditReport.report?.companySummary?.creditRating?.providerValue?.value ?? 0
                    )
                  }
                  size={100}
                  strokeWidth={10}
                  isNewlyIncorporated={isNewlyIncorporated(
                    creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate
                  )}
                />
              </div>
            </div>
            
            <div>
              <div className="text-center sm:text-left">
                <div className="text-sm font-medium text-white">Credit Score</div>
                <div className="mt-1">
                  {renderRiskBadge(
                    creditReport.report?.creditScore?.currentCreditRating ||
                    creditReport.report?.companySummary?.creditRating
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-white mt-2">
            Last updated: {
              creditReport.report?.creditScore?.latestRatingChangeDate ? 
              new Date(creditReport.report.creditScore.latestRatingChangeDate).toLocaleDateString() : 
              'N/A'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;
