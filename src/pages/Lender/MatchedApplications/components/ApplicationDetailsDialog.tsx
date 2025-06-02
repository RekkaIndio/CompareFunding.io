import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { expressInterestInApplication } from '@/firebase';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ThumbsUp, CheckCircle } from 'lucide-react';

interface ApplicationDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedApplication: any;
  user: any;
  lenderProfile: any;
  queryClient: any;
}

const ApplicationDetailsDialog: React.FC<ApplicationDetailsDialogProps> = ({
  isOpen,
  setIsOpen,
  selectedApplication,
  user,
  lenderProfile,
  queryClient
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      setIsSubmitting(true);
      const { data, error } = await expressInterestInApplication(
        applicationId, 
        user.uid,
        lenderProfile
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Interest expressed successfully! The business will be notified.');
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lenderApplications', user?.uid] });
    },
    onError: (error) => {
      toast.error(`Failed to express interest: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const confirmInterest = () => {
    if (!selectedApplication) return;
    expressInterestMutation.mutate(selectedApplication.id);
  };
  
  if (!selectedApplication) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="bg-[#ff8000] p-1.5 rounded-full">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            Application Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Application overview details */}
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h2 className="text-lg font-semibold mb-4">Application Overview</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Business Name</p>
                <p className="font-semibold">{selectedApplication.business?.business_name || 'Not Available'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-600">Application ID</p>
                <p className="font-semibold">#{selectedApplication.application_number || selectedApplication.id?.substring(0, 8)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-600">Loan Amount</p>
                <p className="font-semibold">£{selectedApplication.loan_amount?.toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-600">Term</p>
                <p className="font-semibold">{selectedApplication.loan_term_months} months</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm font-medium text-slate-600">Funding Purpose</p>
                <p className="font-medium">{selectedApplication.purpose || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmInterest}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Express Interest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;
