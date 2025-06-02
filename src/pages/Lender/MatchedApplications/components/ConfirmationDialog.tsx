import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ThumbsUp,
  Briefcase,
  Tag,
  PoundSterling,
  CalendarClock,
  Lightbulb,
  Shield,
  CheckCircle,
  BadgeCheck
} from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedApplication: any;
  confirmExpressInterest: () => void;
  handleDeclineInterest: () => void;
  isSubmitting: boolean;
  getCreditScoreRisk: (score: number | string) => string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  setIsOpen,
  selectedApplication,
  confirmExpressInterest,
  handleDeclineInterest,
  isSubmitting,
  getCreditScoreRisk
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white border-none shadow-2xl max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-[#212936] text-2xl font-semibold flex items-center gap-2">
            <div className="bg-[#ff8000] p-1.5 rounded-full">
              <ThumbsUp className="h-5 w-5 text-white" />
            </div>
            Express Interest
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Are you interested in this funding application? Your information will be shared with the 
            business and they will be notified of your interest.
          </DialogDescription>
        </DialogHeader>
        
        {selectedApplication && (
          <div className="py-4">
            <div className="font-medium mb-3 text-[#212936] flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#ff8000]" />
              Application Details:
            </div>
            
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 shadow-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-slate-500 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  Application:
                </div>
                <div className="font-medium text-[#212936]">#{selectedApplication.application_number || selectedApplication.id?.substring(0, 8)}</div>
                
                <div className="text-slate-500 flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-slate-400" />
                  Amount:
                </div>
                <div className="font-medium text-[#212936]">£{selectedApplication.loan_amount?.toLocaleString()}</div>
                
                <div className="text-slate-500 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  Term:
                </div>
                <div className="font-medium text-[#212936]">{selectedApplication.loan_term_months} months</div>
                
                <div className="text-slate-500 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-slate-400" />
                  Purpose:
                </div>
                <div className="font-medium text-[#212936]">{selectedApplication.purpose || 'Not specified'}</div>
              </div>
              
              {selectedApplication.credit_score && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-200 rounded-full p-1">
                      <Shield className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-slate-500">Credit Score:</span>
                  </div>
                  <Badge 
                    className={`${
                      selectedApplication.credit_score >= 71 ? 'bg-green-100 text-green-700 border-green-200' : 
                      selectedApplication.credit_score >= 51 ? 'bg-green-100 text-green-700 border-green-200' : 
                      selectedApplication.credit_score >= 30 ? 'bg-green-100 text-green-700 border-green-200' : 
                      selectedApplication.credit_score >= 21 ? 'bg-red-100 text-red-700 border-red-200' :
                      selectedApplication.credit_score >= 1 ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedApplication.credit_score} - {getCreditScoreRisk(selectedApplication.credit_score)}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="mt-4 bg-gradient-to-r from-[#f0f6ff] to-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BadgeCheck className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">What happens next?</p>
                  <p className="text-xs text-blue-600 mt-1">
                    If the business accepts your interest, you'll be matched and can view their full business profile, credit details, and financial information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            className="min-w-[100px] bg-[#212936] text-white hover:bg-[#2c3649] hover:text-white border-[#2c3649] py-2.5 font-medium"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleDeclineInterest}
            disabled={isSubmitting}
            className="min-w-[100px] border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:bg-red-100 py-2.5 font-medium"
          >
            {isSubmitting ? 'Declining...' : 'Decline'}
          </Button>
          <Button 
            className="min-w-[140px] bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white shadow-md py-2.5 font-medium"
            onClick={confirmExpressInterest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-pulse mr-2">•••</span>
                Sending...
              </>
            ) : (
              <>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Confirm Interest
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
