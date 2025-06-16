import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Offer } from './types';
import { formatCurrency } from './utils';

interface OfferResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: Offer | null;
  onAccept: (offer: Offer) => void;
  onDecline: (reason: string) => void;
}

export const OfferResponseModal: React.FC<OfferResponseModalProps> = ({
  isOpen,
  onClose,
  offer,
  onAccept,
  onDecline
}) => {
  const [showDeclineSection, setShowDeclineSection] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');

  const handleClose = () => {
    setShowDeclineSection(false);
    setDeclineReason('');
    setSelectedDeclineReason('');
    onClose();
  };

  const handleDeclineClick = () => {
    setShowDeclineSection(true);
  };

  const handleConfirmDecline = () => {
    const finalReason = selectedDeclineReason === 'other' ? declineReason : selectedDeclineReason;
    onDecline(finalReason || 'No reason provided');
    handleClose();
  };

  const declineReasons = [
    { value: 'interest_rate_too_high', label: 'Interest rate too high' },
    { value: 'loan_amount_insufficient', label: 'Loan amount insufficient' },
    { value: 'term_too_short', label: 'Term too short' },
    { value: 'term_too_long', label: 'Term too long' },
    { value: 'fees_too_high', label: 'Fees too high' },
    { value: 'found_better_offer', label: 'Found a better offer elsewhere' },
    { value: 'no_longer_need_funding', label: 'No longer need funding' },
    { value: 'other', label: 'Other (please specify)' }
  ];

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#212936] text-lg">
            <div className="p-2 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-xl">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            Respond to Offer
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Choose your response to the financing offer from {offer.lender_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Offer Summary */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-3">
              {offer.company_logo ? (
                <img 
                  src={offer.company_logo} 
                  alt={`${offer.lender_name} logo`}
                  className="h-10 w-10 rounded-xl object-contain bg-white p-2 shadow-sm border border-slate-200"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {offer.lender_name?.charAt(0).toUpperCase() || 'L'}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-[#212936]">{offer.lender_name}</h3>
                <p className="text-xs text-slate-600">
                  Offer ID: #{offer.id?.substring(0, 8)}
                </p>
              </div>
            </div>
            
            <div className="text-center mb-3">
              <p className="text-xl font-bold text-[#212936] mb-2">
                {formatCurrency(offer.offered_amount)}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                  <span className="font-semibold text-[#212936] block">Interest Rate</span>
                  <span className="text-[#ff8000] font-bold">{offer.interest_rate}%</span>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
                  <span className="font-semibold text-[#212936] block">Term</span>
                  <span className="text-[#ff8000] font-bold">{offer.offered_term_months} months</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-slate-200">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Expires:</span> {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {!showDeclineSection ? (
            <>
              {/* What happens next */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#212936] flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  What happens next?
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full">
                        <div className="h-1 w-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#212936] mb-1 text-sm">Accept: Start the funding process</p>
                      <p className="text-xs text-slate-600">The lender will be notified and will contact you with next steps</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1 bg-gradient-to-br from-red-500 to-red-600 rounded-full">
                        <div className="h-1 w-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#212936] mb-1 text-sm">Decline: Provide feedback</p>
                      <p className="text-xs text-slate-600">Let the lender know why this offer isn't suitable (optional)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-slate-200">
                <Button 
                  className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold py-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 rounded-xl"
                  onClick={() => onAccept(offer)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Offer
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-white hover:bg-red-50 font-semibold py-3 rounded-xl border-2 bg-[#212936] hover:text-red-600"
                  onClick={handleDeclineClick}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline Offer
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-[#ff8000]/10 to-[#ffaa00]/10 border border-[#ff8000]/20 rounded-xl p-3">
                <p className="text-xs text-slate-700 text-center">
                  <span className="font-semibold text-[#ff8000]">Important:</span> By accepting this offer, you agree to discuss the terms outlined in the offer details.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Decline Section */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-red-500 rounded-lg">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="font-semibold text-[#212936] text-sm">Why decline this offer?</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Your feedback helps lenders improve their offers for future applications.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[#212936]">Reason for declining (optional)</label>
                  <Select value={selectedDeclineReason} onValueChange={setSelectedDeclineReason}>
                    <SelectTrigger className="rounded-xl border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000] bg-white text-[#212936]">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {declineReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value} className="text-[#212936] hover:bg-slate-50">
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDeclineReason === 'other' && (
                    <Textarea
                      placeholder="Please specify your reason..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="min-h-[80px] rounded-xl border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000] resize-none bg-white text-[#212936] placeholder:text-slate-500"
                    />
                  )}
                </div>
              </div>

              {/* Decline Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeclineSection(false)}
                  className="bg-[#212936] border-[#212936] text-white hover:bg-[#2a3441] hover:border-[#2a3441] rounded-xl"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConfirmDecline}
                  className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 rounded-xl"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Remove the separate DeclineOfferModal as it's now integrated into the main modal
