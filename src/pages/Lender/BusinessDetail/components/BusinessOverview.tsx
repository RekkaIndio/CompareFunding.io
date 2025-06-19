import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ThumbsUp, 
  BadgePoundSterling, 
  Building2, 
  Briefcase, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Users
} from 'lucide-react';
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
  
  // Get company city with fallback logic
  const getCompanyCity = (): string => {
    const business = applicationData?.business;
    if (!business) return 'Not specified';
    
    // Try multiple address sources and field names for city
    const addresses = [
      business.address,
      business.registered_address,
      business.trading_address
    ];
    
    for (const address of addresses) {
      if (address) {
        // Try different field names for city using type assertion for flexibility
        const addressAny = address as any;
        const city = address.city || 
                    addressAny.town || 
                    addressAny.locality || 
                    addressAny.addressLocality ||
                    addressAny.addressTown;
        if (city && city.trim()) {
          return city.trim();
        }
      }
    }
    
    return 'Not specified';
  };
  
  const companyCity = getCompanyCity();
  
  // Get company address with fallback logic
  const companyAddress = formatAddress(
    applicationData?.business?.address || 
    applicationData?.business?.registered_address || 
    applicationData?.business?.trading_address
  );

  // Helper function to render current funding
  const renderCurrentFunding = () => {
    const currentFunding = applicationData?.business?.currentFunding;
    
    if (!currentFunding) {
      return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-600">Current Funding Status</span>
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">
              Information Not Available
            </Badge>
          </div>
        </div>
      );
    }

    const { hasCurrentFunding, fundingDetails = [] } = currentFunding;

    if (hasCurrentFunding === 'no') {
      return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#ff8000]" />
              <span className="font-medium text-[#212936]">Current Funding Status</span>
            </div>
            <Badge className="bg-green-100 text-green-800 border border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              No Current Funding
            </Badge>
          </div>
        </div>
      );
    }

    if (hasCurrentFunding === 'yes' && fundingDetails.length > 0) {
      return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#ff8000]" />
              <span className="font-medium text-[#212936]">Current Funding</span>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                {fundingDetails.length} Active {fundingDetails.length === 1 ? 'Facility' : 'Facilities'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {fundingDetails.map((funding: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-500">Provider:</span>
                    <div className="text-slate-800">{funding.provider || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Product:</span>
                    <div className="text-slate-800">{funding.product || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Terms:</span>
                    <div className="text-slate-800">{funding.terms || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Balance:</span>
                    <div className="text-slate-800">{funding.currentBalance || 'Not specified'}</div>
                  </div>
                  {funding.expiryDate && (
                    <div className="col-span-2">
                      <span className="font-medium text-slate-500">Expiry:</span>
                      <div className="text-slate-800">{new Date(funding.expiryDate).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#ff8000]" />
            <span className="font-medium text-[#212936]">Current Funding Status</span>
          </div>
          <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Details Not Provided
          </Badge>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 flex flex-col h-full">
      <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white font-bold flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-[#ff8000]" /> 
            Business Overview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 flex-1">
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
                  <div>
                    <span className="text-sm text-green-700 block">City</span>
                    <span className="font-medium text-slate-800">{companyCity}</span>
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
                  {(applicationData.business as any)?.company_size && (
                    <div>
                      <span className="text-sm text-green-700 block">Company Size</span>
                      <span className="font-medium text-slate-800">{(applicationData.business as any).company_size}</span>
                    </div>
                  )}
                  {((applicationData.business as any)?.forecast_revenue || (applicationData.business as any)?.forecastRevenue) && (
                    <div>
                      <span className="text-sm text-green-700 block">Forecast Revenue</span>
                      <span className="font-medium text-slate-800">
                        {(() => {
                          const forecastValue = (applicationData.business as any)?.forecast_revenue || (applicationData.business as any)?.forecastRevenue;
                          return typeof forecastValue === 'number' 
                            ? `£${forecastValue.toLocaleString()}`
                            : `£${parseInt(forecastValue).toLocaleString()}`;
                        })()}
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
                <div className="font-medium text-slate-800 capitalize">
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
          <>
            <Alert className="bg-slate-50 border border-[#212936]/20">
              <Shield className="h-4 w-4 text-[#ff8000]" />
              <AlertTitle className="text-[#212936] font-semibold">Limited Information Available</AlertTitle>
              <AlertDescription className="text-slate-700">
                You need to create an offer to unlock the complete business profile including financial data and comprehensive business information.
              </AlertDescription>
            </Alert>

            {/* Show Company Size and Forecast Revenue even for non-matched lenders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <Building2 className="h-4 w-4 mr-1 text-[#ff8000]" /> City
                </div>
                <div className="font-medium text-slate-800">
                  {companyCity}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-[#ff8000]" /> Industry Sector
                </div>
                <div className="font-medium text-slate-800 capitalize">
                  {applicationData.business?.industry_sector || 'Not specified'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-[#ff8000]" /> Company Size
                </div>
                <div className="font-medium text-slate-800">
                  {(applicationData.business as any)?.company_size || 'Not specified'}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-sm text-slate-500 mb-2 flex items-center">
                  <BadgePoundSterling className="h-4 w-4 mr-1 text-[#ff8000]" /> Forecast Revenue
                </div>
                <div className="font-medium text-slate-800">
                  {(() => {
                    const annualRev = applicationData?.business?.annual_revenue;
                    const forecastRev = (applicationData.business as any)?.forecast_revenue || (applicationData.business as any)?.forecastRevenue;
                    const revenue = forecastRev || annualRev;
                    
                    if (!revenue) return 'Not specified';
                    
                    return typeof revenue === 'number' 
                      ? `£${revenue.toLocaleString()}`
                      : `£${parseInt(revenue).toLocaleString()}`;
                  })()}
                </div>
              </div>
            </div>
          </>
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

        {/* Current Funding Information - Always show this section */}
        <div className="mt-6">
          {renderCurrentFunding()}
        </div>
      </CardContent>
    </Card>
  );
};