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
    <div className="bg-[#212936] text-white border-b border-slate-700" data-tour="credit-score-header">
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
                  <Badge className="bg-slate-700/50 backdrop-blur-sm text-slate-200 hover:bg-slate-600/50 px-4 py-2 font-medium border border-slate-600">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description}
                  </Badge>
                )}
                
                {isNewlyIncorporated(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate) && (
                  <Badge className="bg-emerald-500/20 backdrop-blur-sm text-emerald-200 hover:bg-emerald-500/30 px-4 py-2 font-medium border border-emerald-500/30">
                    Newly Incorporated
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start text-slate-300">
                  <MapPin className="w-5 h-5 mr-3 text-[#ff8000] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">Registered Address</p>
                    <p className="text-white leading-relaxed">
                      {creditReport.report?.contactInformation?.mainAddress?.simpleValue || 
                       creditReport.report?.companyIdentification?.basicInformation?.contactAddress?.simpleValue || 
                       selectedCompany.address?.simpleValue || 'Address not available'}
                    </p>
                  </div>
                </div>
                
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber && (
                  <div className="flex items-center text-slate-300">
                    <Building2 className="w-5 h-5 mr-3 text-[#ff8000]" />
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Company Number</p>
                      <p className="text-white font-mono">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate && (
                  <div className="flex items-center text-slate-300">
                    <Calendar className="w-5 h-5 mr-3 text-[#ff8000]" />
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Incorporation Date</p>
                      <p className="text-white">
                        {new Date(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}
                
                {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description && (
                  <div className="flex items-center text-slate-300">
                    <FileText className="w-5 h-5 mr-3 text-[#ff8000]" />
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Legal Form</p>
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
              <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-6 h-6 mr-3 text-[#ff8000]" />
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
                    <p className="text-sm font-medium text-slate-400 mb-2">Current Rating</p>
                    {renderRiskBadge(creditReport.report?.creditScore?.currentCreditRating || creditReport.report?.companySummary?.creditRating)}
                  </div>
                  
                  {creditReport.report?.creditScore?.previousCreditRating && (
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-2">Previous Rating</p>
                      {renderRiskBadge(creditReport.report?.creditScore?.previousCreditRating)}
                    </div>
                  )}
                  
                  {creditReport.report?.creditScore?.latestRatingChangeDate && (
                    <div className="pt-3 border-t border-slate-600">
                      <p className="text-sm font-medium text-slate-400 mb-1">Last Updated</p>
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
