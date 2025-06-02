import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tag, 
  Building, 
  CalendarClock,
  MapPin,
  Users2,
  MessageSquare,
  Lightbulb,
  ThumbsUp,
  CheckCircle,
  XCircle,
  PoundSterling,
  Clock,
  Eye
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import cfLogoWhite from '@/assets/cflogowhite.png';
import CreditScoreDisplay from './CreditScoreDisplay';

interface ApplicationCardProps {
  app: any;
  user: any;
  isApplicationDeclined: (app: any) => boolean;
  canSeeBusinessDetails: (app: any) => boolean;
  handleExpressInterest: (application: any) => void;
  navigate: (path: string) => void;
  handleStartConversation: (app: any) => void;
  isLenderMatched: (app: any) => boolean;
  getCreditScoreRisk: (score: number | string) => string;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  app,
  user, 
  isApplicationDeclined,
  canSeeBusinessDetails,
  handleExpressInterest,
  navigate,
  handleStartConversation,
  isLenderMatched,
  getCreditScoreRisk
}) => {
  // Action button component
  const getActionButton = () => {
    // Common button styles for consistent sizing and appearance
    const buttonBaseClass = "w-full min-w-[150px] px-4 py-2.5 font-medium shadow-md";
    
    // Check if we have an existing offer
    const hasExistingOffer = app.offers?.some(o => o.lender_id === user?.uid);
    if (hasExistingOffer) {
      return (
        <Button
          size="sm"
          variant="outline"
          className={`text-green-700 border-green-200 bg-gradient-to-r from-green-50 to-green-100 ${buttonBaseClass}`}
          disabled
        >
          <CheckCircle className="mr-1.5 h-4 w-4" />
          Offer Sent
        </Button>
      );
    }

    // Check both matched_lenders and interested_lenders
    const isMatched = app.matched_lenders?.includes(user?.uid);
    const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status;

    if (isMatched || interestStatus === 'accepted') {
      return (
        <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
          <Button
            size="sm"
            variant="outline"
            className={`text-green-700 border-green-300 bg-gradient-to-r from-green-50 to-green-100 hover:bg-green-100 ${buttonBaseClass} md:w-auto`}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Matched
          </Button>
          <Button
            size="sm"
            className={`bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white ${buttonBaseClass} md:w-auto`}
            onClick={(e) => {
              e.stopPropagation();
              handleStartConversation(app);
            }}
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Message
          </Button>
        </div>
      );
    }
    
    if (interestStatus === 'pending') {
      return (
        <Button
          size="sm"
          variant="outline"
          className={`text-[#212936] border-[#212936]/30 bg-gradient-to-r from-[#212936]/5 to-[#323f4e]/5 ${buttonBaseClass}`}
          disabled
        >
          <ThumbsUp className="mr-1.5 h-4 w-4" />
          Interest Sent
        </Button>
      );
    }
    
    if (interestStatus === 'rejected') {
      return (
        <Button
          size="sm"
          variant="outline"
          className={`text-red-700 border-red-300 bg-gradient-to-r from-red-50 to-red-100 ${buttonBaseClass}`}
          disabled
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Interest Declined
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        className={`bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white ${buttonBaseClass}`}
        onClick={(e) => {
          e.stopPropagation();
          handleExpressInterest(app);
        }}
      >
        <ThumbsUp className="mr-1.5 h-4 w-4" />
        Express Interest
      </Button>
    );
  };
  
  return (
    <Card 
      key={app.id} 
      className={`relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
        isApplicationDeclined(app) ? 'border-red-200 hover:border-red-300' : 
        app.isMatched ? 'border-green-200 hover:border-green-300' : 'border-slate-200/80 hover:border-slate-300'
      } rounded-xl`}
      onClick={() => navigate(`/business/${app.id}`)}
    >
      {/* Status indicator bar - made thicker and with gradient */}
      <div className={`h-1.5 w-full ${
        isApplicationDeclined(app) ? 'bg-gradient-to-r from-red-400 to-red-500' : 
        app.isMatched ? 'bg-gradient-to-r from-green-400 to-green-500' : 
        app.status === 'submitted' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
        app.status === 'approved' || app.status === 'has_offers' ? 'bg-gradient-to-r from-[#ff7000] to-[#ff9500]' :
        'bg-gradient-to-r from-slate-400 to-slate-500'
      }`}></div>
      
      <CardContent className="p-4 md:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1.5fr] gap-6 items-start">
          {/* Left Column: Business Info with enhanced styling */}
          <div className="space-y-4">
            {/* Top row with business info and application details */}
            <div className="flex items-start gap-4">
              {/* Business logo with enhanced shadow and 3D effect */}
              <div>
                {app.business?.logo_url && isLenderMatched(app) ? (
                  <div className="w-16 h-16 rounded-md bg-white border border-slate-100 shadow-lg flex items-center justify-center p-1.5 overflow-hidden hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
                    <img
                      src={app.business.logo_url}
                      alt={`${canSeeBusinessDetails(app) && app.business?.business_name 
                        ? app.business.business_name 
                        : 'Business'} logo`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-md bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-0.5">
                    <img
                      src={cfLogoWhite}
                      alt="CompareFunding logo"
                      className="w-11 h-11 object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-semibold text-lg text-[#212936]">
                      {canSeeBusinessDetails(app) && app.business?.business_name 
                        ? app.business.business_name 
                        : `Application #${app.application_number || app.id?.substring(0, 8)}`}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-sm text-slate-500 mt-1">
                    <span>Application #{app.application_number || app.id?.substring(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                    {app.loan_type && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-2 py-0 h-5">
                          <Tag className="h-3 w-3" />
                          <span className="capitalize">{app.loan_type.replace(/_/g, ' ')}</span>
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Business details and tags */}
            {!isApplicationDeclined(app) && (
              <div className="flex flex-wrap gap-3 text-xs">
                {/* Enhanced business detail tags */}
                {canSeeBusinessDetails(app) && app.business?.industry_sector && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1.5 border border-blue-100 shadow-sm">
                    <div className="bg-blue-500/10 rounded-full p-0.5">
                      <Building className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-blue-700 font-medium text-xs">{app.business.industry_sector}</span>
                  </div>
                )}
                
                {canSeeBusinessDetails(app) && app.location && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1.5 border border-amber-100 shadow-sm">
                    <div className="bg-amber-500/10 rounded-full p-0.5">
                      <MapPin className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-amber-700 font-medium text-xs">{app.location}</span>
                  </div>
                )}
                
                {app.years_trading && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                    <div className="bg-emerald-500/10 rounded-full p-0.5">
                      <CalendarClock className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-emerald-700 font-medium text-xs">{app.years_trading} years trading</span>
                  </div>
                )}

                {app.employees && (
                  <div className="bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 px-2 py-1 rounded-full flex items-center gap-1.5 border border-sky-100 shadow-sm">
                    <div className="bg-sky-500/10 rounded-full p-0.5">
                      <Users2 className="h-3 w-3 text-sky-600" />
                    </div>
                    <span className="text-sky-700 font-medium text-xs">{app.employees} employees</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Purpose Card */}
            {app.purpose && !isApplicationDeclined(app) && (
              <div className="bg-gradient-to-r from-[#e8f4ff] to-[#f0f9ff] p-4 rounded-xl border border-[#d1e9ff] shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="bg-gradient-to-br from-[#ff8000] to-[#ff9a44] rounded-full p-2 shadow-sm">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#212936] text-sm">Funding Purpose</p>
                    {app.purpose_category && (
                      <p className="text-xs text-[#ff8000] font-medium">{app.purpose_category}</p>
                    )}
                  </div>
                </div>
                
                <div className="ml-9 bg-white/70 p-2.5 rounded-lg border border-blue-100/50 shadow-sm">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {app.purpose}
                  </p>
                </div>
                
                {/* Additional purpose details if available */}
                {(app.purpose_duration || app.purpose_timeline) && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-9">
                    {app.purpose_duration && (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs py-0.5">
                        <CalendarClock className="mr-1 h-3 w-3" />
                        {app.purpose_duration}
                      </Badge>
                    )}
                    {app.purpose_timeline && (
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs py-0.5">
                        <Clock className="mr-1 h-3 w-3" />
                        {app.purpose_timeline}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Credit Score under Purpose Card */}
            {app.credit_score && !isApplicationDeclined(app) && (
              <CreditScoreDisplay 
                creditScore={app.credit_score}
                getCreditScoreRisk={getCreditScoreRisk}
              />
            )}
            
            {/* Financial Metrics - only if matched */}
            {isLenderMatched(app) && !isApplicationDeclined(app) && app.annual_revenue && (
              <div className="grid grid-cols-2 gap-3">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-3.5 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-medium text-blue-700">Annual Revenue</p>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-1.5 shadow-sm">
                      <PoundSterling className="h-3.5 w-3.5 text-blue-700" />
                    </div>
                  </div>
                  <p className="font-bold text-[#212936] text-base">£{app.annual_revenue.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1">Monthly: ~£{Math.round(app.annual_revenue/12).toLocaleString()}</p>
                </div>
                
                {/* Profit Margin Card */}
                <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 p-3.5 rounded-xl border border-green-100 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-medium text-green-700">Profit Margin</p>
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full p-1.5 shadow-sm">
                      <Clock className="h-3.5 w-3.5 text-green-700" />
                    </div>
                  </div>
                  <p className="font-bold text-[#212936] text-base">{app.profit_margin}%</p>
                  <p className="text-xs text-green-500 mt-1">
                    {app.profit_margin > 20 ? 'High margin business' : 
                     app.profit_margin > 10 ? 'Good margin business' : 
                     'Moderate margin business'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column: Action buttons and loan amount */}
          <div className="space-y-4">
            {/* Action buttons at the top */}
            <div className="flex flex-col gap-2.5">
              {/* Express Interest Button */}
              {app.status === 'submitted' && !app.isMatched && !isApplicationDeclined(app) && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpressInterest(app);
                  }}
                  className="w-full bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white shadow-md py-2.5 font-medium"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Express Interest
                </Button>
              )}
              
              {/* View Details Button - Now shown for all applications */}
              <Button 
                variant="default" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${app.id}`);
                }}
                className="w-full bg-[#212936] text-white hover:bg-[#394355] transition-colors py-2.5 font-medium mt-2"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </div>
            
            {/* Loan Amount Card */}
            <div className="bg-gradient-to-b from-white to-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 shadow-md">
                    <PoundSterling className="h-4 w-4 text-[#ff8000]" />
                  </div>
                  <p className="font-semibold text-[#212936]">Loan Amount</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full shadow-inner">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-600" />
                  <p className="text-xs font-medium text-slate-700">{app.loan_term_months} months</p>
                </div>
              </div>
              
              {/* Loan amount with animation */}
              <div className="text-center my-2 relative">
                <div className="absolute inset-0 bg-[#ff8000]/10 blur-sm rounded-full"></div>
                <p className="text-2xl font-bold text-[#212936] relative">£{app.loan_amount?.toLocaleString()}</p>
              </div>
              
              {/* Interest rate information if available */}
              {app.interest_rate && (
                <div className="w-full mt-2 px-3 py-2 bg-[#212936]/5 rounded-lg text-center">
                  <p className="text-xs font-medium text-slate-500">Est. Interest Rate</p>
                  <p className="text-sm font-bold text-[#212936]">{app.interest_rate}%</p>
                </div>
              )}
            </div>
            
            {/* Application Status Timeline */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#212936] rounded-full p-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#ff8000]" />
                </div>
                <p className="text-sm font-semibold text-[#212936]">Application Timeline</p>
              </div>
              
              <div className="flex items-center justify-between relative py-2">
                {/* Progress bar */}
                <div className="absolute left-0 right-0 h-0.5 bg-slate-200">
                  <div 
                    className={`h-full ${
                      app.status === 'approved' || app.status === 'has_offers' ? 'bg-[#ff8000] w-full' :
                      app.isMatched ? 'bg-green-500 w-2/3' :
                      app.status === 'submitted' ? 'bg-blue-500 w-1/3' :
                      'bg-slate-400 w-0'
                    }`}
                  ></div>
                </div>
                
                {/* Status points */}
                <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                  app.status === 'submitted' || app.isMatched || app.status === 'approved' ? 'bg-blue-500' : 'bg-slate-200'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                
                <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                  app.isMatched || app.status === 'approved' ? 'bg-green-500' : 'bg-slate-200'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                
                <div className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                  app.status === 'approved' || app.status === 'has_offers' ? 'bg-[#ff8000]' : 'bg-slate-200'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-600">Submitted</span>
                <span className="text-slate-600">Matched</span>
                <span className="text-slate-600">Offered</span>
              </div>
              
              {/* Application expiry badge if available */}
              {app.expires_at && (
                <div className="mt-3 text-center">
                  <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs py-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.ceil((new Date(app.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </div>
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
