import { Button } from '@/components/ui/button';
import { ThumbsUp, FileText, ThumbsDown, MessageSquare } from 'lucide-react';
import { ApplicationData } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import DeclineApplicationDialog from './DeclineApplicationDialog';
import { RequestDocumentsDialog } from '@/components/RequestDocumentsDialog';

interface BusinessHeaderProps {
  displayName: string;
  applicationData: ApplicationData;
  isLenderMatched: boolean;
  hasLenderMadeOffer: boolean;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  displayName,
  applicationData,
  isLenderMatched,
  hasLenderMadeOffer,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  
  // Get action buttons based on match status and offer acceptance
  const getActionButtons = () => {
    if (!applicationData?.application) return null;
    
    // Use application's document ID instead of application_number for routing
    const applicationId = applicationData.application?.id || applicationData.application?.application_number;
    if (!applicationId) return null;
    
    const buttons = [];
    
    // Debug logging
    console.log('BusinessHeader Debug:', {
      isLenderMatched,
      hasLenderMadeOffer,
      applicationId,
      user: user?.uid
    });
    
    // Check if there's an accepted offer made by this lender
    const hasAcceptedOffer = applicationData.application.offers?.some(
      o => o.lender_id === user?.uid && o.status === 'accepted'
    );
    
    // Check if application has been approved (meaning an offer was accepted)
    const isApplicationApproved = (applicationData.application as any)?.status === 'approved';
    
    // Check if this lender has declined the application
    const hasDeclined = applicationData.application.interested_lenders?.some(
      l => l.lender_id === user?.uid && (l.status === 'declined' || l.status === 'rejected' || (l.status as any) === 'interest_declined')
    );
    
    // If lender has declined, show different buttons
    if (hasDeclined) {
      buttons.push(
        <Button 
          key="declined"
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-lg transition-transform px-4 py-2"
          disabled
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Declined
        </Button>
      );
      return (
        <div className="flex flex-wrap gap-2 lg:gap-3">
          {buttons}
        </div>
      );
    }
    
    // If lender has made an offer or has accepted offer, show matched status buttons
    if (hasLenderMadeOffer || hasAcceptedOffer || isApplicationApproved) {
      buttons.push(
        <Button 
          key="matched"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-lg transition-transform px-4 py-2"
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          {hasAcceptedOffer || isApplicationApproved ? 'Offer Accepted' : 'Offer Submitted'}
        </Button>
      );
      
      // Add message button
      buttons.push(
        <Button 
          key="message"
          className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => navigate('/messages')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Message Business
        </Button>
      );
      
      // Don't add decline button for matched applications since they are already matched
    } else if (isLenderMatched) {
      // Lender is connected but hasn't made an offer yet - show Create Offer and Request buttons
      buttons.push(
        <Button 
          key="create-offer"
          className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => navigate(`/create-offer/${applicationId}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      );
      
      // Add Request button
      buttons.push(
        <Button 
          key="request-info"
          className="bg-[#212936] hover:bg-[#2c3c53] text-white shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => setIsRequestDialogOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Request
        </Button>
      );
      
      // Add decline button for connected applications
      buttons.push(
        <Button 
          key="decline"
          variant="destructive"
          className="shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => setIsDeclineDialogOpen(true)}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Decline
        </Button>
      );
    } else {
      // Not connected at all - this shouldn't happen in normal flow since we check connections
      // but keep as fallback - treat same as connected for now
      buttons.push(
        <Button 
          key="create-offer"
          className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => navigate(`/create-offer/${applicationId}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      );
      
      // Add Request button to fallback section as well
      buttons.push(
        <Button 
          key="request-info"
          className="bg-[#212936] hover:bg-[#2c3c53] text-white shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => setIsRequestDialogOpen(true)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Request
        </Button>
      );
      
      // Add decline button for non-matched applications as well
      buttons.push(
        <Button 
          key="decline"
          variant="destructive"
          className="shadow-lg rounded-lg hover:scale-105 transition-transform px-4 py-2"
          onClick={() => setIsDeclineDialogOpen(true)}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Decline
        </Button>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2 lg:gap-3">
        {buttons}
      </div>
    );
  };

  // Check if there's an accepted offer or the application is approved
  const hasAcceptedOffer = applicationData?.application?.offers?.some(
    o => o.lender_id === user?.uid && o.status === 'accepted'
  );
  const isApplicationApproved = (applicationData?.application as any)?.status === 'approved';
  // Only show full business details if an offer has been made, accepted, or application approved
  const showFullBusinessDetails = hasLenderMadeOffer || hasAcceptedOffer || isApplicationApproved;
  
  return (
    <>
      <div className={`${
        showFullBusinessDetails ? 'bg-gradient-to-r from-green-800 to-[#1d2432]' : 'bg-[#1d2432]'
      } text-white rounded-xl p-6 sm:p-8 mb-4 shadow-xl border-b-2 ${
        showFullBusinessDetails ? 'border-green-500' : 'border-[#ff8000]'
      } flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
        <div className="flex items-start gap-6">
          {showFullBusinessDetails && (applicationData?.business as any)?.logo_url && (
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <img
                src={(applicationData.business as any).logo_url}
                alt={`${applicationData?.business?.business_name || 'Company'} logo`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain bg-white/10 backdrop-blur-sm border border-green-400/30 shadow-lg"
                onError={(e) => {
                  // Hide the image if it fails to load
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              <span className="bg-green-500 text-white text-xs py-1 px-2 rounded-full uppercase font-bold tracking-wide">
                Matched
              </span>
            </div>
          )}
          {showFullBusinessDetails && !(applicationData?.business as any)?.logo_url && (
            <div className="flex-shrink-0">
              <span className="bg-green-500 text-white text-xs py-1 px-2 rounded-full uppercase font-bold tracking-wide">
                Matched
              </span>
            </div>
          )}
          <div className="flex-grow">
            {showFullBusinessDetails ? (
              <>
                <div className="mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {applicationData?.business?.business_name || displayName}
                  </h1>
                </div>
                <p className="text-gray-200 text-base sm:text-lg flex flex-wrap gap-2 items-center">
                  <span>{applicationData?.business?.industry_sector || 'Business'}</span>
                  {(applicationData?.business as any)?.year_founded && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>Founded {(applicationData.business as any).year_founded}</span>
                    </>
                  )}
                  {(applicationData?.business as any)?.company_size && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{(applicationData.business as any).company_size} employees</span>
                    </>
                  )}
                </p>
                {(applicationData?.business as any)?.website && (
                  <a href={(applicationData.business as any).website} target="_blank" rel="noopener noreferrer" 
                     className="text-green-300 hover:text-green-100 text-sm mt-1 inline-block">
                    {(applicationData.business as any).website.replace(/(https?:\/\/)?(www\.)?/i, '')}
                  </a>
                )}
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-white">
                  Application #{applicationData?.application?.application_number || 'Unknown'}
                </h1>
                <p className="text-gray-200 text-base sm:text-lg">
                  {applicationData?.business?.industry_sector || 'Business Details'} | {displayName}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 min-w-fit">
          {getActionButtons()}
        </div>
      </div>

      {/* Decline Application Dialog */}
      <DeclineApplicationDialog
        isOpen={isDeclineDialogOpen}
        setIsOpen={setIsDeclineDialogOpen}
        applicationData={applicationData}
        onDeclineSuccess={() => {
          // Refresh the page or navigate back to show updated status
          window.location.reload();
        }}
      />

      {/* Request Documents Dialog */}
      <RequestDocumentsDialog
        isOpen={isRequestDialogOpen}
        setIsOpen={setIsRequestDialogOpen}
        applicationData={applicationData}
        onRequestSuccess={() => {
          // Could refresh data or show success state
          console.log('Request sent successfully');
        }}
      />
    </>
  );
};
