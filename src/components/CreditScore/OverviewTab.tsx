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
    <div className="p-8 space-y-8 bg-gradient-to-br from-white to-slate-50/50">
      {/* Company Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Details Card */}
        <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-6 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <div className="p-2 bg-gradient-to-br from-[#ff8800]/10 to-[#ff8800]/5 rounded-xl mr-3">
                <Building2 className="w-6 h-6 text-[#ff8800]" />
              </div>
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Company Name</p>
                    <p className="text-xl font-bold text-slate-900 leading-tight">
                      {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                       creditReport.report?.companySummary?.businessName || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center mb-3">
                    <Hash className="w-5 h-5 mr-2 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Company Number</p>
                  </div>
                  <p className="font-mono text-base font-bold text-slate-900">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber || 
                     creditReport.report?.companySummary?.companyRegistrationNumber || 'N/A'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 mr-2 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Company Type</p>
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center mb-3">
                    <Calendar className="w-5 h-5 mr-2 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Incorporation Date</p>
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate ? 
                      new Date(creditReport.report.companyIdentification.basicInformation.companyRegistrationDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">Status</p>
                  <Badge className={`${getStatusColor(
                    creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                    creditReport.report?.companySummary?.companyStatus?.description || ''
                  )} border font-semibold px-3 py-1.5 text-sm`}>
                    {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                     creditReport.report?.companySummary?.companyStatus?.description || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Rating Card */}
        <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-6 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <div className="p-2 bg-gradient-to-br from-[#ff8800]/10 to-[#ff8800]/5 rounded-xl mr-3">
                <Star className="w-6 h-6 text-[#ff8800]" />
              </div>
              Credit Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gradient-to-br from-[#ff8800]/10 to-[#ffaa00]/5 rounded-xl p-6 border border-[#ff8800]/20 shadow-sm">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 mr-3 text-[#ff8800]" />
                  <p className="text-sm font-semibold text-[#ff8800] uppercase tracking-wide">Current Rating</p>
                </div>
                <Badge className={`${getRatingColor(
                  creditReport.report?.creditScore?.currentCreditRating?.commonValue || ''
                )} border font-bold text-lg px-4 py-2 shadow-sm`}>
                  {creditReport.report?.creditScore?.currentCreditRating?.commonValue || 'N/A'}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">Previous Rating</p>
                <Badge className={`${getRatingColor(
                  creditReport.report?.creditScore?.previousCreditRating?.commonValue || ''
                )} border font-semibold px-3 py-1.5`}>
                  {creditReport.report?.creditScore?.previousCreditRating?.commonValue || 'E - Not Scored'}
                </Badge>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center mb-3">
                  <Calendar className="w-5 h-5 mr-2 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Last Rating Change</p>
                </div>
                <p className="text-base font-bold text-slate-900">
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

      {/* Enhanced Credit Details Card */}
      <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="pb-6 border-b border-slate-100">
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <div className="p-2 bg-gradient-to-br from-[#ff8800]/10 to-[#ff8800]/5 rounded-xl mr-3">
              <CreditCard className="w-6 h-6 text-[#ff8800]" />
            </div>
            Credit Details & Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-6 border border-emerald-200/50 shadow-sm transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Credit Limit</p>
              </div>
              <p className="text-2xl font-bold text-emerald-800">
                {creditReport.report?.creditScore?.currentCreditRating?.creditLimit?.value ?
                  `${creditReport.report.creditScore.currentCreditRating.creditLimit.value} ${creditReport.report.creditScore.currentCreditRating.creditLimit.currency || 'GBP'}` :
                  creditReport.report?.companySummary?.creditRating?.creditLimit?.value ?
                  `${creditReport.report.companySummary.creditRating.creditLimit.value} ${creditReport.report.companySummary.creditRating.creditLimit.currency || 'GBP'}` :
                  '500 GBP'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl p-6 border border-amber-200/50 shadow-sm transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Odds of Failure</p>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {creditReport.report?.additionalInformation?.miscellaneous?.oddsOfFailure || '109:1'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#ff8800]/10 to-[#ffaa00]/5 rounded-xl p-6 border border-[#ff8800]/20 shadow-sm transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-[#ff8800]/10 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-[#ff8800]" />
                </div>
                <p className="text-sm font-semibold text-[#ff8800] uppercase tracking-wide">Rating Trend</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">
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
