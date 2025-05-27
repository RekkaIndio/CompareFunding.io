import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CircularProgressBar from "@/components/ui/CircularProgressBar";
import { isNewlyIncorporated } from './utils';

interface OverviewTabProps {
  creditReport: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ creditReport }) => {
  return (
    <div className="grid grid-cols-1 gap-0">
      {/* Company & Credit Information */}
      <Card className="bg-white rounded-none">
        <CardHeader className="bg-[#212936]">
          <CardTitle className="text-white">Company & Credit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <dl className="space-y-2">
              {/* Company Information */}
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.companyIdentification?.basicInformation?.businessName || 
                   creditReport.report?.companySummary?.businessName || 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Company Number</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationNumber || 
                   creditReport.report?.companySummary?.companyRegistrationNumber || 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Company Type</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.companyIdentification?.basicInformation?.legalForm?.description || 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.companyIdentification?.basicInformation?.companyStatus?.description || 
                   creditReport.report?.companySummary?.companyStatus?.description || 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.companyIdentification?.basicInformation?.companyRegistrationDate ? 
                    new Date(creditReport.report.companyIdentification.basicInformation.companyRegistrationDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                </dd>
              </div>
            </dl>

            {/* Credit Score Information */}
            <dl className="space-y-2">
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Latest Rating Change</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.creditScore?.latestRatingChangeDate ? 
                    new Date(creditReport.report.creditScore.latestRatingChangeDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Common Value</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.creditScore?.currentCreditRating?.commonValue || 'N/A'}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">International Score</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.creditScore?.currentCreditRating?.internationalScore?.value || 'N/A'}
                  {creditReport.report?.creditScore?.currentCreditRating?.internationalScore?.description && 
                    ` - ${creditReport.report.creditScore.currentCreditRating.internationalScore.description}`
                  }
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500">Previous Rating</dt>
                <dd className="text-gray-900">
                  {creditReport.report?.creditScore?.previousCreditRating?.commonValue ? 
                    `${creditReport.report.creditScore.previousCreditRating.commonValue}${
                      creditReport.report.creditScore.previousCreditRating.commonDescription ? 
                      ` - ${creditReport.report.creditScore.previousCreditRating.commonDescription}` : 
                      ''
                    }` : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4">
          <div className="font-medium text-gray-700">Credit Details</div>
          <dl className="mt-2 space-y-2">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500">Credit Limit</dt>
              <dd className="text-gray-900">
                {creditReport.report?.creditScore?.currentCreditRating?.creditLimit?.value ?
                  `${creditReport.report.creditScore.currentCreditRating.creditLimit.value} ${creditReport.report.creditScore.currentCreditRating.creditLimit.currency || ''}` :
                  creditReport.report?.companySummary?.creditRating?.creditLimit?.value ?
                  `${creditReport.report.companySummary.creditRating.creditLimit.value} ${creditReport.report.companySummary.creditRating.creditLimit.currency || ''}` :
                  'N/A'}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500">Latest Rating Change</dt>
              <dd className="text-gray-900">
                {creditReport.report?.creditScore?.latestRatingChangeDate ? 
                  new Date(creditReport.report.creditScore.latestRatingChangeDate).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500">Previously Rated</dt>
              <dd className="text-gray-900">
                {creditReport.report?.creditScore?.previousCreditRating?.commonValue ? 
                  `${creditReport.report.creditScore.previousCreditRating.commonValue} - ${creditReport.report.creditScore.previousCreditRating.commonDescription || ''}` : 'N/A'}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500">Odds of Failure</dt>
              <dd className="text-gray-900">
                {creditReport.report?.additionalInformation?.miscellaneous?.oddsOfFailure || 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Credit Commentary & Risk Factors section removed and moved exclusively to the Negative Information tab */}
    </div>
  );
};

export default OverviewTab;
