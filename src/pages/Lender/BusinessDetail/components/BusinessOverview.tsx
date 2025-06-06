import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Shield, ThumbsUp, BadgePoundSterling, Building2, Briefcase, Calendar } from 'lucide-react';
import { ApplicationData } from '../types';
import { formatAddress } from '@/lib/formatters';

interface BusinessOverviewProps {
  applicationData: ApplicationData;
  canSeeBusinessDetails: boolean;
  isLenderMatched?: boolean;
}

export const BusinessOverview: React.FC<BusinessOverviewProps> = ({
  applicationData,
  canSeeBusinessDetails,
  isLenderMatched
}) => {
  // Check if offer has been accepted
  const hasAcceptedOffer = applicationData?.application?.offers?.some(
    (o: any) => o.status === 'accepted'
  );
  const isApplicationApproved = (applicationData?.application as any)?.status === 'approved';
  const showEnhancedDetails = isLenderMatched || hasAcceptedOffer || isApplicationApproved;
  
  // Get company details for matched businesses
  const registrationNumber = (applicationData?.business as any)?.registration_number || 
                             (applicationData?.business as any)?.company_number || 
                             'Not provided';
                             
  // We use formatAddress imported from @/lib/formatters
  
  const companyAddress = formatAddress((applicationData?.business as any)?.address || 
                                      (applicationData?.business as any)?.registered_address);
                                      
  const yearsTrading = (applicationData?.business as any)?.years_trading || 
                       ((applicationData?.business as any)?.year_founded ? 
                        new Date().getFullYear() - (applicationData?.business as any).year_founded : 
                        'Unknown');
  
  // Check for document access
  const hasFinancialsAccess = showEnhancedDetails && applicationData?.accounting;
  const hasDocumentsAccess = showEnhancedDetails && (applicationData as any)?.documents;
                        
  return (
    <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0">
      <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white font-bold flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-[#ff8000]" /> 
            Business Overview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {canSeeBusinessDetails ? (
          // Show full business details when lender has expressed interest or made an offer
          <>
            <div>
              <h3 className="font-semibold mb-2 text-[#212936] border-l-4 border-[#ff8000] pl-3 flex items-center">
                {applicationData.business?.business_name || 'Business Details'}
              </h3>
              <p className="text-slate-700 leading-relaxed ml-4 mt-2">
                {applicationData.business?.description || 'No business description available.'}
              </p>
            </div>

            <Separator className="my-5 bg-slate-200" />

            {showEnhancedDetails && (
              <div className="mb-6 bg-green-50 border border-green-100 rounded-lg p-4">
                <h4 className="text-green-800 font-semibold mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-600" /> Full Business Information Available
                </h4>
                <p className="text-green-700 text-sm mb-3">
                  This business has accepted your offer. You now have access to complete business details.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-green-700 block">Company Registration</span>
                    <span className="font-medium text-slate-800">{registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-sm text-green-700 block">Years Trading</span>
                    <span className="font-medium text-slate-800">{yearsTrading}</span>
                  </div>
                </div>
                
                <div className="text-sm text-green-700">Registered Address</div>
                <p className="font-medium text-slate-800 mb-4">{companyAddress}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-[#ff8000]" /> Industry Sector
                </div>
                <div className="font-medium text-slate-800">
                  {applicationData.business?.industry_sector || 'Not specified'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <Building2 className="h-4 w-4 mr-1 text-[#ff8000]" /> Business Type
                </div>
                <div className="font-medium text-slate-800">
                  {applicationData.business?.business_type || 'Not specified'}
                </div>
              </div>
            </div>
            
            {showEnhancedDetails && (
              <div className="mt-6">
                <h4 className="font-semibold text-[#212936] mb-3">Financial Documents</h4>
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {['pl', 'bs', 'tb', 'ap', 'ar'].map(docKey => {
                      const docTypes = {
                        'pl': 'Profit and Loss',
                        'bs': 'Balance Sheet',
                        'tb': 'Trial Balance',
                        'ap': 'Aged Payables',
                        'ar': 'Aged Receivables'
                      };
                      
                      const docUrl = (applicationData as any)?.documents?.[docKey]?.url;
                      const docName = (applicationData as any)?.documents?.[docKey]?.name || `${docTypes[docKey as keyof typeof docTypes]} Document`;
                      
                      return (
                        <div key={docKey} className="bg-white p-3 rounded-md border border-blue-100 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-slate-800">{docTypes[docKey as keyof typeof docTypes]}</span>
                            {docUrl ? (
                              <span className="text-xs block text-blue-600 truncate max-w-[200px]">{docName}</span>
                            ) : (
                              <span className="text-xs block text-slate-500">No document uploaded</span>
                            )}
                          </div>
                          {docUrl && (
                            <a 
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-md"
                              download={docName}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Show limited info for non-matched lenders
          <Alert className="bg-slate-50 border border-[#212936]/20">
            <Shield className="h-4 w-4 text-[#ff8000]" />
            <AlertTitle className="text-[#212936] font-semibold">Limited Information Available</AlertTitle>
            <AlertDescription className="text-slate-700">
              Create an offer to view the complete business profile including financial data and comprehensive business information.
            </AlertDescription>
          </Alert>
        )}

        {/* Always show application details */}
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <h3 className="font-semibold mb-4 flex items-center text-[#212936] border-b border-slate-200 pb-2">
            <BadgePoundSterling className="h-5 w-5 mr-2 text-[#ff8000]" />
            Funding Request
          </h3>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="bg-white p-3 rounded-md border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Amount</div>
              <div className="font-medium text-slate-800 text-lg">
                £{applicationData.application?.loan_amount?.toLocaleString() || 'Not specified'}
              </div>
            </div>
            <div className="bg-white p-3 rounded-md border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Term</div>
              <div className="font-medium text-slate-800 text-lg flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-[#ff8000]" />
                {applicationData.application?.loan_term_months || 0} months
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 text-sm bg-white p-4 rounded-md border border-slate-100">
            <div className="text-slate-500 font-medium">Purpose:</div>
            <div className="font-medium capitalize text-slate-800">
              {applicationData.application?.purpose || 'Not specified'}
            </div>

            <div className="text-slate-500 font-medium">Security Offered:</div>
            <div className="font-medium text-slate-800">
              {applicationData.application?.security_offered || 'None'}
            </div>

            <div className="text-slate-500 font-medium">Personal Guarantee:</div>
            <div className="font-medium text-slate-800">
              {applicationData.application?.personal_guarantee ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};