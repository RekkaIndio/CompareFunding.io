import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CircularProgressBar from "@/components/ui/CircularProgressBar";
import { Building2, Calendar, FileText, CreditCard, TrendingUp, Hash, Star, AlertCircle } from 'lucide-react';
import { isNewlyIncorporated } from './utils';

interface OverviewTabProps {
  creditReport: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ creditReport }) => {
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (statusLower.includes('dormant')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (statusLower.includes('dissolved')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getRatingColor = (rating: string) => {
    const ratingLower = rating?.toLowerCase() || '';
    if (['a1', 'a2', 'a', 'aaa'].includes(ratingLower)) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (['b1', 'b2', 'b', 'bb'].includes(ratingLower)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['c1', 'c2', 'c', 'cc'].includes(ratingLower)) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (['d', 'e'].includes(ratingLower)) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Company Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Details Card */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4 border-b border-slate-700">
            <CardTitle className="flex items-center text-lg font-semibold text-white">
              <Building2 className="w-5 h-5 mr-2 text-[#ff8000]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300 mb-1">Company Name</p>
                    <p className="text-lg font-semibold text-white">
                      {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                       creditReport.report?.companySummary?.businessName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center mb-2">
                    <Hash className="w-4 h-4 mr-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">Company Number</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-white">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber || 
                     creditReport.report?.companySummary?.companyRegistrationNumber || 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">Company Type</p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <p className="text-sm font-medium text-slate-300">Incorporation Date</p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate ? 
                      new Date(creditReport.report.companyIdentification.basicInformation.companyRegistrationDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-sm font-medium text-slate-300 mb-2">Status</p>
                  <Badge className={`${getStatusColor(
                    creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                    creditReport.report?.companySummary?.companyStatus?.description || ''
                  )} border font-medium`}>
                    {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                     creditReport.report?.companySummary?.companyStatus?.description || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Rating Card */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4 border-b border-slate-700">
            <CardTitle className="flex items-center text-lg font-semibold text-white">
              <Star className="w-5 h-5 mr-2 text-[#ff8000]" />
              Credit Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-lg p-4 border border-[#ff8000]/30">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 mr-2 text-[#ff8000]" />
                  <p className="text-sm font-medium text-[#ff8000]">Current Rating</p>
                </div>
                <Badge className={`${getRatingColor(
                  creditReport.report?.creditScore?.currentCreditRating?.commonValue || ''
                )} border font-bold text-lg px-3 py-1`}>
                  {creditReport.report?.creditScore?.currentCreditRating?.commonValue || 'N/A'}
                </Badge>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-sm font-medium text-slate-300 mb-1">Previous Rating</p>
                <Badge className={`${getRatingColor(
                  creditReport.report?.creditScore?.previousCreditRating?.commonValue || ''
                )} border font-medium`}>
                  {creditReport.report?.creditScore?.previousCreditRating?.commonValue || 'E - Not Scored'}
                </Badge>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-300">Last Rating Change</p>
                </div>
                <p className="text-sm font-semibold text-white">
                  {creditReport.report?.creditScore?.latestRatingChangeDate ? 
                    new Date(creditReport.report.creditScore.latestRatingChangeDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Details Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4 border-b border-slate-700">
          <CardTitle className="flex items-center text-lg font-semibold text-white">
            <CreditCard className="w-5 h-5 mr-2 text-[#ff8000]" />
            Credit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center mb-2">
                <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">Credit Limit</p>
              </div>
              <p className="text-lg font-bold text-white">
                {creditReport.report?.creditScore?.currentCreditRating?.creditLimit?.value ?
                  `${creditReport.report.creditScore.currentCreditRating.creditLimit.value} ${creditReport.report.creditScore.currentCreditRating.creditLimit.currency || 'GBP'}` :
                  creditReport.report?.companySummary?.creditRating?.creditLimit?.value ?
                  `${creditReport.report.companySummary.creditRating.creditLimit.value} ${creditReport.report.companySummary.creditRating.creditLimit.currency || 'GBP'}` :
                  '500 GBP'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-400" />
                <p className="text-sm font-medium text-amber-300">Odds of Failure</p>
              </div>
              <p className="text-lg font-bold text-white">
                {creditReport.report?.additionalInformation?.miscellaneous?.oddsOfFailure || '109:1'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-lg p-4 border border-[#ff8000]/30">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-4 h-4 mr-2 text-[#ff8000]" />
                <p className="text-sm font-medium text-[#ff8000]">Rating Trend</p>
              </div>
              <p className="text-lg font-bold text-white">
                {creditReport.report?.creditScore?.previousCreditRating?.commonValue && 
                 creditReport.report?.creditScore?.currentCreditRating?.commonValue
                  ? creditReport.report.creditScore.currentCreditRating.commonValue > creditReport.report.creditScore.previousCreditRating.commonValue
                    ? '↗ Improved'
                    : creditReport.report.creditScore.currentCreditRating.commonValue < creditReport.report.creditScore.previousCreditRating.commonValue
                    ? '↘ Declined'
                    : '→ Stable'
                  : 'New Rating'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
