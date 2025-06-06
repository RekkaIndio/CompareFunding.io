import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PoundSterling, AlertTriangle, CheckCircle } from 'lucide-react';

interface OfferConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  offerAmount: number;
  businessName?: string;
}

export const OfferConfirmationModal: React.FC<OfferConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  offerAmount,
  businessName = "this business"
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5 text-orange-600" />
            Confirm Offer Submission
          </DialogTitle>
          <DialogDescription>
            Please review the billing information before submitting your offer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Billing Notice:</strong> You will be invoiced £250 for submitting this financing offer.
            </AlertDescription>
          </Alert>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Offer Amount:</span>
              <span className="font-medium">£{offerAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Submission Fee:</span>
              <span className="font-medium text-orange-600">£250</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>Total Cost:</span>
              <span className="text-orange-600">£250</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              This fee covers our platform costs and ensures serious offers are submitted to businesses.
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              You will receive an invoice within 24 hours of submitting this offer.
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? 'Submitting...' : 'Confirm & Submit Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferConfirmationModal;
