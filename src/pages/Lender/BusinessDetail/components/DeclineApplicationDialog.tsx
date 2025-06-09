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
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { updateDocument, createDocument } from '@/firebase';
import { ThumbsDown, X } from 'lucide-react';

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
          declined_at: new Date().toISOString()
        };
      } else {
        // Add a new entry with declined status (for cases where they decline without expressing interest first)
        const declineEntry = {
          lender_id: user.uid,
          lender_name: user.displayName || 'Unnamed Lender',
          lender_company: '', // Will be populated from lender profile if available
          status: 'declined',
          expressed_at: new Date().toISOString(),
          declined_at: new Date().toISOString()
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
        message: `A lender has declined your funding application #${formatApplicationNumber(applicationData.application, applicationId)}`,
        application_id: applicationId,
        lender_id: user.uid,
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <ThumbsDown className="h-5 w-5 text-red-500" />
            Decline Application
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Are you sure you want to decline this funding application? This action will:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Mark this application as declined in your dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Move the application to your "Declined" tab</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Notify the business owner of your decision</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Remove this application from your active matches</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeclineApplication}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            {isSubmitting ? 'Declining...' : 'Decline Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineApplicationDialog;
