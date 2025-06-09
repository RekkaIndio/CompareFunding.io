import { Button } from '@/components/ui/button';
import { ThumbsUp, FileText, ThumbsDown } from 'lucide-react';
import { ApplicationData } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import DeclineApplicationDialog from './DeclineApplicationDialog';

interface BusinessHeaderProps {
  displayName: string;
  applicationData: ApplicationData;
  isLenderMatched: boolean;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  displayName,
  applicationData,
  isLenderMatched,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  
  // Get action buttons based on match status and offer acceptance
  const getActionButtons = () => {
    if (!applicationData?.application) return null;
    
    // Use application's document ID instead of application_number for routing
    const applicationId = applicationData.application?.id || applicationData.application?.application_number;
    if (!applicationId) return null;
    
    const buttons = [];
    
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
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-lg transition-transform"
          disabled
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Declined
        </Button>
      );
      return buttons;
    }
    
    // If lender is matched or offer accepted, show different buttons
    if (isLenderMatched || hasAcceptedOffer || isApplicationApproved) {
      buttons.push(
        <Button 
          key="matched"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-lg transition-transform"
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Matched
        </Button>
      );
      
      // Add view offers button
      buttons.push(
        <Button 
          key="view-offers"
          className="bg-[#212936] hover:bg-[#2c3c53] text-white shadow-lg rounded-lg transition-transform"
          onClick={() => navigate(`/offers`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          View Offers
        </Button>
      );
      
      // Add message button
      buttons.push(
        <Button 
          key="message"
          className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg rounded-lg hover:scale-105 transition-transform"
          onClick={() => navigate('/lender/dashboard', { state: { activeTab: 'messages' } })}
        >
          <FileText className="mr-2 h-4 w-4" />
          Message Business
        </Button>
      );
      
      // Add decline button for matched applications
      buttons.push(
        <Button 
          key="decline"
          variant="destructive"
          className="shadow-lg rounded-lg hover:scale-105 transition-transform"
          onClick={() => setIsDeclineDialogOpen(true)}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Decline
        </Button>
      );
    } else {
      // Show Create Offer button for non-matched businesses
      buttons.push(
        <Button 
          key="create-offer"
          className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg rounded-lg hover:scale-105 transition-transform"
          onClick={() => navigate(`/create-offer/${applicationId}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      );
      
      // Add decline button for non-matched applications as well
      buttons.push(
        <Button 
          key="decline"
          variant="destructive"
          className="shadow-lg rounded-lg hover:scale-105 transition-transform"
          onClick={() => setIsDeclineDialogOpen(true)}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Decline
        </Button>
      );
    }
    
    return buttons;
  };

  // Check if there's an accepted offer or the application is approved
  const hasAcceptedOffer = applicationData?.application?.offers?.some(
    o => o.lender_id === user?.uid && o.status === 'accepted'
  );
  const isApplicationApproved = (applicationData?.application as any)?.status === 'approved';
  const showFullBusinessDetails = isLenderMatched || hasAcceptedOffer || isApplicationApproved;
  
  return (
    <>
      <div className={`${
        showFullBusinessDetails ? 'bg-gradient-to-r from-green-800 to-[#1d2432]' : 'bg-[#1d2432]'
      } text-white rounded-xl p-6 sm:p-8 mb-4 shadow-xl border-b-2 ${
        showFullBusinessDetails ? 'border-green-500' : 'border-[#ff8000]'
      } flex flex-col md:flex-row justify-between items-start md:items-center`}>
        <div>
          {showFullBusinessDetails ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  {applicationData?.business?.business_name || displayName}
                </h1>
                <span className="bg-green-500 text-white text-xs py-1 px-2 rounded-full uppercase font-bold tracking-wide">
                  Matched
                </span>
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
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
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
    </>
  );
};
