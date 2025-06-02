import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ApplicationData } from '../types';

interface InterestConfirmDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  applicationData: ApplicationData;
  id: string | undefined;
  confirmExpressInterest: () => void;
  isSubmitting: boolean;
}

export const InterestConfirmDialog: React.FC<InterestConfirmDialogProps> = ({
  isOpen,
  setIsOpen,
  applicationData,
  id,
  confirmExpressInterest,
  isSubmitting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#212936] text-xl">Express Interest</DialogTitle>
          <DialogDescription>
            Are you interested in this loan application? Your information will be shared with the 
            business and they will be notified of your interest.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="font-medium mb-2 text-[#212936]">Application Details:</div>
          <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="text-muted-foreground">Application:</div>
            <div className="font-medium">#{applicationData?.application?.application_number || id?.substring(0, 8)}</div>
            
            <div className="text-muted-foreground">Amount:</div>
            <div className="font-medium">£{applicationData?.application?.loan_amount?.toLocaleString()}</div>
            
            <div className="text-muted-foreground">Term:</div>
            <div className="font-medium">{applicationData?.application?.loan_term_months} months</div>
            
            <div className="text-muted-foreground">Purpose:</div>
            <div className="font-medium capitalize">{applicationData?.application?.purpose || 'Not specified'}</div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-slate-200 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white"
            onClick={confirmExpressInterest}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Confirm Interest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
