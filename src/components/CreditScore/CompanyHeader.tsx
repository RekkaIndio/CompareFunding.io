import React from 'react';
import { Badge } from '@/components/ui/badge';
import CircularProgressBar from '@/components/ui/CircularProgressBar';
import { Building2, MapPin, Calendar, FileText, TrendingUp } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
          <div className="flex-grow">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
                {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                 creditReport.report?.companySummary?.businessName || selectedCompany.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3">
                {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-4 py-2 font-medium border-0">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description}
                  </Badge>
                )}
                
                {isNewlyIncorporated(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate) && (
                  <Badge className="bg-green-500/20 backdrop-blur-sm text-green-100 hover:bg-green-500/30 px-4 py-2 font-medium border-0">
                    Newly Incorporated
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start text-blue-100">
                  <MapPin className="w-5 h-5 mr-3 text-blue-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-200 mb-1">Registered Address</p>
                    <p className="text-white leading-relaxed">
                      {creditReport.report?.contactInformation?.mainAddress?.simpleValue || 
                       creditReport.report?.companyIdentification?.basicInformation?.contactAddress?.simpleValue || 
                       selectedCompany.address?.simpleValue || 'Address not available'}
                    </p>
                  </div>
                </div>
                
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber && (
                  <div className="flex items-center text-blue-100">
                    <Building2 className="w-5 h-5 mr-3 text-blue-300" />
                    <div>
                      <p className="text-sm font-medium text-blue-200 mb-1">Company Number</p>
                      <p className="text-white font-mono">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate && (
                  <div className="flex items-center text-blue-100">
                    <Calendar className="w-5 h-5 mr-3 text-blue-300" />
                    <div>
                      <p className="text-sm font-medium text-blue-200 mb-1">Incorporation Date</p>
                      <p className="text-white">
                        {new Date(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}
                
                {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description && (
                  <div className="flex items-center text-blue-100">
                    <FileText className="w-5 h-5 mr-3 text-blue-300" />
                    <div>
                      <p className="text-sm font-medium text-blue-200 mb-1">Legal Form</p>
                      <p className="text-white">
                        {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Credit Score Section */}
          {(creditReport.report?.creditScore?.currentCreditRating || creditReport.report?.companySummary?.creditRating) && (
            <div className="lg:min-w-[320px]">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-200" />
                  <h3 className="text-xl font-semibold text-white">Credit Rating</h3>
                </div>
                
                <div className="flex items-center justify-center mb-6">
                  <CircularProgressBar
                    value={
                      Number(
                        creditReport.report?.creditScore?.currentCreditRating?.providerValue?.value ??
                        creditReport.report?.companySummary?.creditRating?.providerValue?.value ?? 0
                      )
                    }
                    size={120}
                    strokeWidth={12}
                    isNewlyIncorporated={isNewlyIncorporated(
                      creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-blue-200 mb-2">Current Rating</p>
                    {renderRiskBadge(creditReport.report?.creditScore?.currentCreditRating || creditReport.report?.companySummary?.creditRating)}
                  </div>
                  
                  {creditReport.report?.creditScore?.previousCreditRating && (
                    <div>
                      <p className="text-sm font-medium text-blue-200 mb-2">Previous Rating</p>
                      {renderRiskBadge(creditReport.report?.creditScore?.previousCreditRating)}
                    </div>
                  )}
                  
                  {creditReport.report?.creditScore?.latestRatingChangeDate && (
                    <div className="pt-3 border-t border-white/20">
                      <p className="text-sm font-medium text-blue-200 mb-1">Last Updated</p>
                      <p className="text-white text-sm">
                        {new Date(creditReport.report?.creditScore?.latestRatingChangeDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyHeader;
