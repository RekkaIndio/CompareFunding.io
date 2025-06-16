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
import { PoundSterling, AlertTriangle, CheckCircle, CreditCard, Building2 } from 'lucide-react';

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
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#212936] text-lg">
            <div className="p-2 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-xl">
              <PoundSterling className="h-4 w-4 text-white" />
            </div>
            Confirm Offer Submission
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-sm mt-2">
            Please review the billing information before submitting your offer to {businessName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Billing Notice */}
          <div className="bg-gradient-to-r from-[#ff8000]/10 to-[#ffaa00]/10 border border-[#ff8000]/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#ff8000] rounded-xl">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#212936] text-sm">Billing Notice</h3>
                <p className="text-xs text-slate-700">Offer submission fee applies</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 ml-11">
              You will be invoiced £250 for submitting this financing offer to the business.
            </p>
          </div>

          {/* Offer Summary */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <Building2 className="h-4 w-4 text-[#212936]" />
              </div>
              <div>
                <h3 className="font-bold text-[#212936] text-sm">Offer Details</h3>
                <p className="text-xs text-slate-600">Summary of your submission</p>
              </div>
            </div>
            
            <div className="space-y-2 ml-11">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Business:</span>
                <span className="font-medium text-[#212936]">{businessName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Offer Amount:</span>
                <span className="font-semibold text-[#212936]">£{offerAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-xl">
                <CreditCard className="h-4 w-4 text-[#ff8000]" />
              </div>
              <div>
                <h3 className="font-bold text-[#212936] text-sm">Cost Breakdown</h3>
                <p className="text-xs text-slate-600">Fees and charges</p>
              </div>
            </div>
            
            <div className="space-y-2 ml-11">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Submission Fee:</span>
                <span className="font-medium text-[#ff8000]">£250</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-[#212936]">Total Cost:</span>
                <span className="text-[#ff8000]">£250</span>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#212936] flex items-center gap-2 text-sm">
              <div className="p-1 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
              What happens next?
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-full">
                    <div className="h-1 w-1 bg-[#ff8000] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#212936] mb-1 text-sm">Offer sent immediately</p>
                  <p className="text-xs text-slate-600">Your financing offer will be delivered to {businessName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full">
                    <div className="h-1 w-1 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#212936] mb-1 text-sm">Invoice generated</p>
                  <p className="text-xs text-slate-600">You'll receive an invoice for £250 within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="bg-[#212936] border-[#212936] text-white hover:bg-[#2a3441] hover:border-[#2a3441] flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm & Submit Offer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferConfirmationModal;
