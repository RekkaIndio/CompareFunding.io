import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
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
  setIsDeclineDialogOpen
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
              <p className="text-sm text-gray-500">
                The lender has been notified and will be in touch with next steps.
              </p>
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
              
              <p className="text-xs text-gray-500 text-center mt-4">
                By accepting this offer, you agree to the terms and conditions outlined above.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Offer</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this offer. This will help the lender understand your decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for declining (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeclineDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeclineSubmit}
              >
                Decline Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
