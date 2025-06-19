import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, XCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { formatCurrency } from '../utils';

interface ActionCardProps {
  offer: any;
  isLender: boolean;
  isExpired: boolean;
  isAccepted: boolean;
  isDeclined: boolean;
  isWithdrawn: boolean;
  isPending: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onWithdraw: () => void;
  declineReason: string;
  setDeclineReason: (reason: string) => void;
  isDeclineDialogOpen: boolean;
  setIsDeclineDialogOpen: (open: boolean) => void;
  conversation?: any;
  onNavigateToMessages?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  offer,
  isLender,
  isExpired,
  isAccepted,
  isDeclined,
  isWithdrawn,
  isPending,
  onAccept,
  onDecline,
  onWithdraw,
  declineReason,
  setDeclineReason,
  isDeclineDialogOpen,
  setIsDeclineDialogOpen,
  conversation,
  onNavigateToMessages
}) => {
  const handleDeclineSubmit = () => {
    onDecline();
  };

  return (
    <>
      <Card className={`bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
        isExpired ? 'border-gray-200' :
        isAccepted ? 'border-green-200' :
        isDeclined ? 'border-red-200' :
        isWithdrawn ? 'border-gray-200' :
        'border-blue-200'
      }`}>
        <CardHeader className={`${
          isExpired ? 'bg-gray-100' :
          isAccepted ? 'bg-green-50' :
          isDeclined ? 'bg-red-50' :
          isWithdrawn ? 'bg-gray-100' :
          'bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white'
        } rounded-t-xl`}>
          <CardTitle className={`${
            isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-800 font-bold' : ''
          } flex items-center gap-2`}>
            {isExpired ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Offer Expired
              </>
            ) : isAccepted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Offer Accepted
              </>
            ) : isDeclined ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Offer Declined
              </>
            ) : isWithdrawn ? (
              <>
                <AlertCircle className="h-5 w-5 text-gray-600" />
                Offer Withdrawn
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Action Required
              </>
            )}
          </CardTitle>
          <CardDescription className={`${
            isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-700' : 'text-gray-100'
          }`}>
            {isExpired 
              ? 'This offer has expired and can no longer be accepted.'
              : isAccepted
              ? 'This offer has been successfully accepted.'
              : isDeclined
              ? 'This offer has been declined.'
              : isWithdrawn
              ? 'This offer has been withdrawn by the lender.'
              : isLender
              ? 'Your offer is pending response from the business.'
              : 'Choose your response to this funding offer.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isExpired ? (
            <div className="text-center py-6">
              <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                This offer expired on {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString('en-GB')}
              </p>
              <p className="text-sm text-gray-500">
                Contact the lender directly if you're still interested in this funding.
              </p>
            </div>
          ) : isAccepted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                You accepted this offer for <span className="font-semibold">{formatCurrency(offer.offered_amount)}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                The lender has been notified and will be in touch with next steps.
              </p>
              {conversation && onNavigateToMessages && (
                <Button 
                  onClick={onNavigateToMessages}
                  className="bg-[#ff8000] hover:bg-blue-700 text-white"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message Lender
                </Button>
              )}
            </div>
          ) : isDeclined ? (
            <div className="text-center py-6">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                You declined this offer on {new Date(offer.updated_at).toLocaleDateString('en-GB')}
              </p>
              <p className="text-sm text-gray-500">
                The lender has been notified of your decision.
              </p>
            </div>
          ) : isWithdrawn ? (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                This offer was withdrawn by the lender
              </p>
              <p className="text-sm text-gray-500">
                The offer is no longer available for acceptance.
              </p>
            </div>
          ) : isPending && isLender ? (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Waiting for business response to your offer of <span className="font-semibold">{formatCurrency(offer.offered_amount)}</span>
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={onWithdraw}
              >
                Withdraw Offer
              </Button>
            </div>
          ) : !isLender ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-[#212936] mb-2">
                  Offer Amount: {formatCurrency(offer.offered_amount)}
                </p>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={onAccept}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Offer
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setIsDeclineDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline Offer
                </Button>
              </div>
              
              {conversation && onNavigateToMessages && (
                <Button 
                  variant="outline"
                  onClick={onNavigateToMessages}
                  className="w-full mt-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message Lender
                </Button>
              )}
              
              <p className="text-xs text-gray-500 text-center mt-4">
                By accepting this offer, you agree to the terms and conditions outlined above.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-[#212936] text-lg">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              Decline Offer
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm mt-2">
              Please provide a reason for declining this offer. This will help the lender understand your decision and improve their future offers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Offer Summary */}
            <div className="bg-gradient-to-br from-slate-50 via-red-50 to-rose-50 rounded-xl p-4 border border-slate-200/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-[#212936] text-sm">Declining Offer</h3>
                  <p className="text-xs text-slate-600">Amount: {formatCurrency(offer.offered_amount)}</p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#212936] flex items-center gap-2 text-sm">
                <div className="p-1 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                What happens when you decline?
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1 bg-gradient-to-br from-[#212936] to-[#2a3441] rounded-full">
                      <div className="h-1 w-1 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-[#212936] mb-1 text-sm">Lender is notified immediately</p>
                    <p className="text-xs text-slate-600">The lender will receive your decline notification along with your feedback</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full">
                      <div className="h-1 w-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-[#212936] mb-1 text-sm">Offer becomes unavailable</p>
                    <p className="text-xs text-slate-600">This action cannot be undone - the offer will be permanently declined</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#212936]">Reason for declining (optional)</label>
              <Textarea
                placeholder="e.g., Looking for a lower interest rate, different terms, or found alternative funding..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="min-h-[100px] bg-white border-slate-200 focus:border-red-300 focus:ring-red-200 rounded-xl"
              />
              <p className="text-xs text-slate-500">
                Your feedback helps lenders improve their offers for future applications.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              onClick={() => setIsDeclineDialogOpen(false)}
              className="bg-[#212936] border-[#212936] text-white hover:bg-[#2a3441] hover:border-[#2a3441] flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeclineSubmit}
              className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline Offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
