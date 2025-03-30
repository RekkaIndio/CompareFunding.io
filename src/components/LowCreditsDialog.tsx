import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from 'lucide-react';

interface LowCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
  availableCredits: number;
}

const LowCreditsDialog = ({ isOpen, onClose, requiredCredits, availableCredits }: LowCreditsDialogProps) => {
  const navigate = useNavigate();

  const handlePurchaseCredits = () => {
    navigate('/lender/billing?tab=credits');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insufficient Credits</DialogTitle>
          <DialogDescription>
            You need more credits to view this application's details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Required Credits</div>
              <div className="text-sm text-muted-foreground">For this application</div>
            </div>
            <div className="text-lg font-bold">{requiredCredits}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Available Credits</div>
              <div className="text-sm text-muted-foreground">Your current balance</div>
            </div>
            <div className="text-lg font-bold text-red-500">{availableCredits}</div>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded">
            <BadgeCheck className="h-4 w-4 text-fundhub-blue" />
            <span>Each credit costs £100 and is valid for 12 months</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="bg-fundhub-blue hover:bg-fundhub-blue/90"
            onClick={handlePurchaseCredits}
          >
            Purchase Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LowCreditsDialog;