import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, sendInvoiceEmail } from '@/firebase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PurchaseCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentBalance: number;
}

const PurchaseCreditsDialog = ({ isOpen, onClose, onSuccess, currentBalance }: PurchaseCreditsDialogProps) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'invoice' | 'bank_transfer'>('invoice');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || credits < 1) return;

    setIsProcessing(true);

    try {
      // Create credit purchase request
      const { error } = await createDocument('credit_purchase_requests', {
        lender_id: user.uid,
        credits: credits,
        amount: credits * 100, // £100 per credit
        payment_method: paymentMethod,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      if (paymentMethod === 'invoice') {
        // Send invoice email
        const { error: emailError } = await sendInvoiceEmail(
          user.uid,
          credits,
          credits * 100
        );

        if (emailError) {
          console.error('Error sending invoice email:', emailError);
          toast.error('Credit purchase request submitted, but there was an error sending the invoice email.');
        } else {
          toast.success('Credit purchase request submitted. You will receive an invoice shortly.');
        }
      } else {
        toast.success('Credit purchase request submitted. Please complete the bank transfer using the provided details.');
      }
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error requesting credits:', err);
      toast.error(err.message || 'Failed to submit credit purchase request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Each credit costs £100 and allows you to view one application's details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Credits</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCredits(Math.max(1, credits - 1))}
                  disabled={credits <= 1 || isProcessing}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={credits}
                  onChange={(e) => setCredits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center"
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setCredits(credits + 1)}
                  disabled={isProcessing}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Total cost: £{(credits * 100).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <RadioGroup value={paymentMethod} onValueChange={(value: 'invoice' | 'bank_transfer') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invoice" id="invoice" />
                  <Label htmlFor="invoice">Invoice</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer">Bank Transfer</Label>
                </div>
              </RadioGroup>
              {paymentMethod === 'bank_transfer' && (
                <div className="mt-2 text-sm border rounded p-3">
                  <p className="font-medium">Bank Transfer Details:</p>
                  <p>Bank: Example Bank PLC</p>
                  <p>Account Name: FundHub Ltd</p>
                  <p>Sort Code: 12-34-56</p>
                  <p>Account Number: 12345678</p>
                  <p>Reference: FH-{user?.uid?.substring(0, 8)}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
            >
              {isProcessing ? 'Processing...' : 'Request Credits'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseCreditsDialog;