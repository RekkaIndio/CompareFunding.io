import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  CalendarClock,
  MapPin,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import cfLogoWhite from '@/assets/cflogowhite.png';

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
  hasLenderMadeOffer?: (app: any) => boolean;
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
  getCreditScoreRisk,
  hasLenderMadeOffer
}) => {
  // Helper function to safely convert various date formats
  const safeConvertDate = (dateValue: any): Date => {
    // If it's already a Date object, return it
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // If it has a toDate method (Firestore Timestamp), use it
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    
    // If it's a string or number, try to convert it
    if (dateValue) {
      const converted = new Date(dateValue);
      if (!isNaN(converted.getTime())) {
        return converted;
      }
    }
    
    // Fallback to current date
    return new Date();
  };

  // Helper function to format dates safely
  const formatDate = (dateValue: any, label: string = ''): string => {
    try {
      const date = safeConvertDate(dateValue);
      const formatted = date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      return label ? `${label} ${formatted}` : formatted;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return label ? `${label} Recently` : 'Recently';
    }
  };

  // Action button component
  const getActionButton = () => {
    // Common button styles for consistent sizing and appearance
    const buttonBaseClass = "px-4 py-2.5 font-medium shadow-md";
    
    // Check if we have an existing offer
    const hasExistingOffer = app.offers?.some(o => o.lender_id === user?.uid);
    if (hasExistingOffer) {
      return (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className={`text-green-700 border-green-200 bg-gradient-to-r from-green-50 to-green-100 ${buttonBaseClass}`}
            disabled
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Offer Sent
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${app.id}`);
            }}
            className="bg-[#212936] text-white hover:bg-[#394355] border-[#212936]"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View Details
          </Button>
        </div>
      );
    }

    // Check both matched_lenders and interested_lenders
    const isMatched = app.matched_lenders?.includes(user?.uid);
    const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status;

    if (isMatched || interestStatus === 'accepted') {
      return (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className={`text-green-700 border-green-300 bg-gradient-to-r from-green-50 to-green-100 hover:bg-green-100 ${buttonBaseClass}`}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Matched
          </Button>
          <Button
            size="sm"
            className={`bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white ${buttonBaseClass}`}
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
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className={`text-[#212936] border-[#212936]/30 bg-gradient-to-r from-[#212936]/5 to-[#323f4e]/5 ${buttonBaseClass}`}
            disabled
          >
            <ThumbsUp className="mr-1.5 h-4 w-4" />
            Interest Sent
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${app.id}`);
            }}
            className="bg-[#212936] text-white hover:bg-[#394355] border-[#212936]"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View Details
          </Button>
        </div>
      );
    }
    
    if (interestStatus === 'rejected' || interestStatus === 'declined' || 
        interestStatus === 'interest_declined' || interestStatus === 'interest declined') {
      return (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className={`text-red-700 border-red-300 bg-gradient-to-r from-red-50 to-red-100 ${buttonBaseClass}`}
            disabled
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Interest Declined
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/business/${app.id}`);
            }}
            className="bg-[#212936] text-white hover:bg-[#394355] border-[#212936]"
          >
            <Eye className="mr-1.5 h-4 w-4" />
            View Details
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
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
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/business/${app.id}`);
          }}
          className="bg-[#212936] text-white hover:bg-[#394355] border-[#212936]"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          View Details
        </Button>
      </div>
    );
  };
  
  // Helper function to get the current status for styling
  const getCurrentStatus = () => {
    if (isApplicationDeclined(app)) return 'declined';
    if (hasLenderMadeOffer && !hasLenderMadeOffer(app)) return 'new';
    if (app.status === 'accepted' || app.status === 'completed' || app.status === 'approved') return 'accepted';
    if (app.isMatched) return 'matched';
    return app.status;
  };

  const currentStatus = getCurrentStatus();

  return (
    <Card 
      key={app.id} 
      className={`bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 ${
        currentStatus === 'declined' ? 'border-red-200' : 
        currentStatus === 'accepted' ? 'border-green-200' : 
        currentStatus === 'new' ? 'border-orange-200' : 
        currentStatus === 'matched' ? 'border-green-200' : 
        'border-slate-200'
      }`}
      onClick={() => navigate(`/business/${app.id}`)}
    >
      {/* Status indicator bar */}
      <div className={`h-3 w-full ${
        currentStatus === 'declined' ? 'bg-gradient-to-r from-red-400 to-red-500' : 
        currentStatus === 'accepted' ? 'bg-gradient-to-r from-green-400 to-green-500' : 
        currentStatus === 'new' ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
        currentStatus === 'matched' ? 'bg-gradient-to-r from-green-400 to-green-500' : 
        app.status === 'submitted' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
        app.status === 'approved' || app.status === 'has_offers' ? 'bg-gradient-to-r from-[#ff7000] to-[#ff9500]' :
        'bg-gradient-to-r from-slate-400 to-slate-500'
      }`}></div>
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Business logo */}
          <div>
            {app.business?.logo_url && canSeeBusinessDetails(app) ? (
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src={app.business.logo_url}
                  alt={`${app.business?.business_name || 'Business'} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center">
                <img
                  src={cfLogoWhite}
                  alt="CompareFunding logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
          </div>
          
          {/* Application header */}
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-[#212936]">
                {canSeeBusinessDetails(app) && app.business?.business_name 
                  ? app.business.business_name 
                  : `Application #${app.application_number || app.id?.substring(0, 8)}`}
              </h3>
              <StatusBadge status={
                isApplicationDeclined(app) ? 'declined' : 
                hasLenderMadeOffer && !hasLenderMadeOffer(app) ? 'new' : 
                app.status === 'approved' ? 'accepted' :
                app.status
              } />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>#{app.application_number || app.id?.substring(0, 8)}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(app.created_at, 'Applied')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Funding Amount */}
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold text-[#212936] mb-2">
              £{app.loan_amount?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Requested Amount • {app.loan_term_months} months
            </div>
          </div>
          
          {/* Purpose */}
          <div className="text-center md:text-left">
            <div className="text-sm font-medium text-gray-700 mb-1">Funding Purpose</div>
            <div className="text-gray-600 text-sm">
              {app.purpose || 'Business funding'}
            </div>
          </div>
        </div>

        {/* Business details tags - only show if not declined */}
        {!isApplicationDeclined(app) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {canSeeBusinessDetails(app) && app.business?.industry_sector && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Building className="h-3 w-3 mr-1" />
                {app.business.industry_sector}
              </Badge>
            )}
            {canSeeBusinessDetails(app) && app.location && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <MapPin className="h-3 w-3 mr-1" />
                {app.location}
              </Badge>
            )}
            {app.years_trading && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CalendarClock className="h-3 w-3 mr-1" />
                {app.years_trading} years
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          {getActionButton()}
          
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{formatDate(app.updated_at || app.created_at, 'Updated')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
