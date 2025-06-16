import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { updateDocument, createDocument } from '@/firebase';
import { ThumbsDown, X, Info } from 'lucide-react';

interface DeclineApplicationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applicationData: any;
  onDeclineSuccess?: () => void;
}

const DeclineApplicationDialog: React.FC<DeclineApplicationDialogProps> = ({
  isOpen,
  setIsOpen,
  applicationData,
  onDeclineSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineFeedback, setDeclineFeedback] = useState('');
  const { user } = useAuth();

  const handleDeclineApplication = async () => {
    if (!applicationData?.application || !user) {
      toast.error('Missing application or user data');
      return;
    }

    try {
      setIsSubmitting(true);
      const applicationId = applicationData.application.id;

      // Get current interested lenders array
      const interestedLenders = applicationData.application.interested_lenders || [];
      
      // Check if this lender has already expressed interest
      const existingLenderIndex = interestedLenders.findIndex(
        (l: any) => l.lender_id === user.uid
      );

      let updatedInterestedLenders;

      if (existingLenderIndex !== -1) {
        // Update existing interest entry to declined status
        updatedInterestedLenders = [...interestedLenders];
        updatedInterestedLenders[existingLenderIndex] = {
          ...updatedInterestedLenders[existingLenderIndex],
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_feedback: declineFeedback || 'No feedback provided'
        };
      } else {
        // Add a new entry with declined status (for cases where they decline without expressing interest first)
        const declineEntry = {
          lender_id: user.uid,
          lender_name: user.displayName || 'Unnamed Lender',
          lender_company: '', // Will be populated from lender profile if available
          status: 'declined',
          expressed_at: new Date().toISOString(),
          declined_at: new Date().toISOString(),
          decline_feedback: declineFeedback || 'No feedback provided'
        };
        updatedInterestedLenders = [...interestedLenders, declineEntry];
      }

      // Update the application with the declined status
      const { error: updateError } = await updateDocument('applications', applicationId, {
        interested_lenders: updatedInterestedLenders,
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        throw updateError;
      }

      // Create a notification for the business owner
      const notificationData = {
        recipient_id: applicationData.application.user_id,
        type: 'application_declined',
        title: 'Application Declined',
        message: `A lender has declined your funding application #${formatApplicationNumber(applicationData.application, applicationId)}${declineFeedback ? ' with feedback' : ''}`,
        application_id: applicationId,
        lender_id: user.uid,
        decline_feedback: declineFeedback || 'No feedback provided',
        read: false,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Create the notification (don't throw error if this fails)
      try {
        await createDocument('notifications', notificationData);
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the whole operation if notification creation fails
      }

      toast.success('Application declined successfully');
      setIsOpen(false);
      setDeclineFeedback(''); // Reset feedback
      
      // Call success callback if provided
      if (onDeclineSuccess) {
        onDeclineSuccess();
      }

    } catch (error: any) {
      console.error('Error declining application:', error);
      toast.error(`Failed to decline application: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setDeclineFeedback(''); // Reset feedback when dialog closes
      }
    }}>
      <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl p-6 -m-6 mb-4 border-b-2 border-[#ff8000]">
          <DialogTitle className="flex items-center gap-3 text-white text-xl font-bold">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <ThumbsDown className="h-5 w-5 text-red-300" />
            </div>
            Decline Application
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            Please provide feedback on why you're declining this application. This will help the business understand your decision and improve future applications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <Label htmlFor="decline-feedback" className="text-sm font-semibold text-[#212936] flex items-center gap-2">
              <div className="w-2 h-2 bg-[#ff8000] rounded-full"></div>
              Reason for declining (required)
            </Label>
            <Textarea
              id="decline-feedback"
              placeholder="Please explain why you're declining this application. This feedback will be shared with the business to help them improve their application."
              value={declineFeedback}
              onChange={(e) => setDeclineFeedback(e.target.value)}
              className="min-h-[120px] bg-white border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20"
              required
            />
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-[#ff8000]/30 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-[#ff8000]/20 p-1.5 rounded-full mt-0.5">
                <Info className="h-4 w-4 text-[#ff8000]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#212936] mb-1">
                  Important Note
                </p>
                <p className="text-sm text-slate-700">
                  Your feedback will be shared with the business owner to help them understand your decision and improve future applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-slate-200">
            <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              // Reset will be handled by onOpenChange
            }}
            disabled={isSubmitting}
            className="flex items-center gap-2 border-slate-300 text-white hover:bg-slate-50 px-6"
            >
            <X className="h-4 w-4" />
            Cancel
            </Button>
          <Button
            variant="destructive"
            onClick={handleDeclineApplication}
            disabled={isSubmitting || !declineFeedback.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg px-6"
          >
            <ThumbsDown className="h-4 w-4" />
            {isSubmitting ? 'Declining...' : 'Decline with Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineApplicationDialog;
