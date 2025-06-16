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
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-tour="credit-score-header">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff8800] to-[#ffaa00] rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full -translate-x-16 -translate-y-16 blur-2xl"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8">
          <div className="flex-grow">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                 creditReport.report?.companySummary?.businessName || selectedCompany.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4">
                {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description && (
                  <Badge className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-4 py-2 font-semibold border border-white/20 rounded-full shadow-lg">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description}
                  </Badge>
                )}
                
                {isNewlyIncorporated(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate) && (
                  <Badge className="bg-emerald-500/20 backdrop-blur-sm text-emerald-200 hover:bg-emerald-500/30 px-4 py-2 font-semibold border border-emerald-500/30 rounded-full shadow-lg">
                    Newly Incorporated
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start text-gray-200">
                  <div className="p-2 bg-[#ff8800]/20 rounded-xl mr-4 mt-1">
                    <MapPin className="w-5 h-5 text-[#ff8800]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Registered Address</p>
                    <p className="text-white leading-relaxed">
                      {creditReport.report?.contactInformation?.mainAddress?.simpleValue || 
                       creditReport.report?.companyIdentification?.basicInformation?.contactAddress?.simpleValue || 
                       selectedCompany.address?.simpleValue || 'Address not available'}
                    </p>
                  </div>
                </div>
                
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber && (
                  <div className="flex items-center text-gray-200">
                    <div className="p-2 bg-[#ff8800]/20 rounded-xl mr-4">
                      <Building2 className="w-5 h-5 text-[#ff8800]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">Company Number</p>
                      <p className="text-white font-mono text-lg">
                        {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate && (
                  <div className="flex items-center text-gray-200">
                    <div className="p-2 bg-[#ff8800]/20 rounded-xl mr-4">
                      <Calendar className="w-5 h-5 text-[#ff8800]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">Incorporation Date</p>
                      <p className="text-white text-lg">
                        {new Date(creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}
                
                {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description && (
                  <div className="flex items-center text-gray-200">
                    <div className="p-2 bg-[#ff8800]/20 rounded-xl mr-4">
                      <FileText className="w-5 h-5 text-[#ff8800]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">Legal Form</p>
                      <p className="text-white text-lg">
                        {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Credit Score Section */}
          {(creditReport.report?.creditScore?.currentCreditRating || creditReport.report?.companySummary?.creditRating) && (
            <div className="lg:min-w-[360px]">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-[#ff8800]/20 rounded-xl mr-4">
                    <TrendingUp className="w-7 h-7 text-[#ff8800]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Credit Rating</h3>
                </div>
                
                <div className="flex items-center justify-center mb-8">
                  <CircularProgressBar
                    value={
                      Number(
                        creditReport.report?.creditScore?.currentCreditRating?.providerValue?.value ??
                        creditReport.report?.companySummary?.creditRating?.providerValue?.value ?? 0
                      )
                    }
                    size={140}
                    strokeWidth={14}
                    isNewlyIncorporated={isNewlyIncorporated(
                      creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Current Rating</p>
                    <div className="flex justify-center">
                      {renderRiskBadge(creditReport.report?.creditScore?.currentCreditRating || creditReport.report?.companySummary?.creditRating)}
                    </div>
                  </div>
                  
                  {creditReport.report?.creditScore?.previousCreditRating && (
                    <div>
                      <p className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Previous Rating</p>
                      <div className="flex justify-center">
                        {renderRiskBadge(creditReport.report?.creditScore?.previousCreditRating)}
                      </div>
                    </div>
                  )}
                  
                  {creditReport.report?.creditScore?.latestRatingChangeDate && (
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Last Updated</p>
                      <p className="text-white text-center">
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
