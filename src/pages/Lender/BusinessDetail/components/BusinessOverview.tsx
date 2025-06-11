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
  
  // Check if current user has made an offer
  const currentUserOffer = applicationData?.application?.offers?.find(
    (o: any) => o.lender_id === (window as any).currentUser?.uid
  );
  
  // Only show enhanced details if an offer has been made AND accepted, or application is approved
  const showEnhancedDetails = hasAcceptedOffer || isApplicationApproved;
  
  // Get company details for matched businesses with improved fallback logic
  const getCompanyNumber = (): string => {
    const business = applicationData?.business;
    if (!business) return 'Not provided';
    
    // Try multiple field names for company number (registration number)
    // Check both camelCase and snake_case variations
    return (business as any).companyNumber || 
           business.company_number || 
           business.registration_number || 
           'Not provided';
  };

  const getYearsTrading = (): string => {
    const business = applicationData?.business;
    if (!business) return 'Unknown';
    
    // If years_trading is directly available
    if (business.years_trading !== undefined && business.years_trading !== null) {
      return business.years_trading.toString();
    }
    
    // Calculate from year_founded
    if (business.year_founded) {
      const years = new Date().getFullYear() - business.year_founded;
      return years > 0 ? years.toString() : '0';
    }
    
    // Calculate from incorporation_date
    if (business.incorporation_date) {
      const incorporationYear = new Date(business.incorporation_date).getFullYear();
      const years = new Date().getFullYear() - incorporationYear;
      return years > 0 ? years.toString() : '0';
    }
    
    return 'Unknown';
  };
  
  const companyNumber = getCompanyNumber();
  const yearsTrading = getYearsTrading();
  
  // Get company address with fallback logic
  const companyAddress = formatAddress(
    applicationData?.business?.address || 
    applicationData?.business?.registered_address || 
    applicationData?.business?.trading_address
  );
                        
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
                {applicationData.business?.business_name || 
                 (applicationData.business as any)?.companyName || 
                 'Business Details'}
              </h3>
              <p className="text-slate-700 leading-relaxed ml-4 mt-2">
                {(applicationData.business as any)?.businessDescription || 
                 applicationData.business?.description || 
                 'No business description available.'}
              </p>
            </div>

            <Separator className="my-5 bg-slate-200" />

            {showEnhancedDetails && (
              <div className="mb-6 bg-green-50 border border-green-100 rounded-lg p-4">
                <h4 className="text-green-800 font-semibold mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-600" /> Full Business Information Available
                </h4>
                <p className="text-green-700 text-sm mb-3">
                  {hasAcceptedOffer 
                    ? "An offer has been accepted for this application. You now have access to complete business details."
                    : isApplicationApproved 
                    ? "This application has been approved. You now have access to complete business details."
                    : "You have created an offer for this application. You now have access to complete business details."
                  }
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-green-700 block">Company Registration</span>
                    <span className="font-medium text-slate-800">{companyNumber}</span>
                  </div>
                  <div>
                    <span className="text-sm text-green-700 block">Years Trading</span>
                    <span className="font-medium text-slate-800">{yearsTrading}</span>
                  </div>
                  {applicationData.business?.annual_revenue && (
                    <div>
                      <span className="text-sm text-green-700 block">Annual Revenue</span>
                      <span className="font-medium text-slate-800">
                        {typeof applicationData.business.annual_revenue === 'number' 
                          ? `£${applicationData.business.annual_revenue.toLocaleString()}`
                          : applicationData.business.annual_revenue
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                {(applicationData.business?.business_email || applicationData.business?.business_phone || applicationData.business?.website) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                    {applicationData.business?.business_email && (
                      <div>
                        <span className="text-sm text-green-700 block">Business Email</span>
                        <span className="font-medium text-slate-800">{applicationData.business.business_email}</span>
                      </div>
                    )}
                    {applicationData.business?.business_phone && (
                      <div>
                        <span className="text-sm text-green-700 block">Business Phone</span>
                        <span className="font-medium text-slate-800">{applicationData.business.business_phone}</span>
                      </div>
                    )}
                    {applicationData.business?.website && (
                      <div>
                        <span className="text-sm text-green-700 block">Website</span>
                        <a 
                          href={applicationData.business.website.startsWith('http') 
                            ? applicationData.business.website 
                            : `https://${applicationData.business.website}`
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 underline"
                        >
                          {applicationData.business.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
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
          </>
        ) : (
          // Show limited info for non-matched lenders
          <Alert className="bg-slate-50 border border-[#212936]/20">
            <Shield className="h-4 w-4 text-[#ff8000]" />
            <AlertTitle className="text-[#212936] font-semibold">Limited Information Available</AlertTitle>
            <AlertDescription className="text-slate-700">
              You need to create an offer to unlock the complete business profile including financial data and comprehensive business information.
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