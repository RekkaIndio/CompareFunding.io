import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument } from '@/firebase';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BadgeCheck, Receipt, Building2 } from 'lucide-react';
import PurchaseCreditsDialog from '@/components/PurchaseCreditsDialog';

function LenderBillingInner() {
  const { user } = useAuth();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // Fetch billing data
  const { data: billingData, refetch: refetchBilling } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getDocument('lender_billing', user.uid);
      
      if (error) {
        return {
          credits_balance: 0,
          credits_used: 0,
          payment_method: null
        };
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });

  // Calculate usage statistics
  const creditsAvailable = (billingData?.credits_balance || 0) - (billingData?.credits_used || 0);
  const creditUsagePercentage = billingData?.credits_balance 
    ? (billingData.credits_used / billingData.credits_balance) * 100 
    : 0;

  return (
    <PageLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center"
          onClick={() => window.location.href = '/lender/dashboard'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Credits & Billing</h1>
          <p className="text-muted-foreground mb-8">
            Purchase credits to view applications and make offers
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Credits Available</CardTitle>
                <CardDescription>Application views</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BadgeCheck className="h-5 w-5 text-fundhub-blue mr-2" />
                  <div className="text-2xl font-bold">
                    {creditsAvailable}
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">
                    / {billingData?.credits_balance || 0}
                  </span>
                </div>
                <Progress 
                  value={creditUsagePercentage} 
                  className="h-2 mt-2" 
                />
                <div className="text-sm text-muted-foreground mt-2">
                  {billingData?.credits_used || 0} credits used
                </div>
                <Button 
                  className="w-full mt-4 bg-fundhub-blue hover:bg-fundhub-blue/90"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                >
                  Purchase Credits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Available payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 text-fundhub-blue mr-2" />
                    <div>
                      <div className="font-medium">Invoice</div>
                      <div className="text-sm text-muted-foreground">
                        Request an invoice for payment
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-fundhub-blue mr-2" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        Pay directly via bank transfer
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Credit Information</CardTitle>
              <CardDescription>
                How credits work and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-fundhub-blue mt-1" />
                <div>
                  <span className="font-medium">Fixed Rate:</span> Each credit costs £100
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-fundhub-blue mt-1" />
                <div>
                  <span className="font-medium">Usage:</span> One credit is required to view the details of a business loan application
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-fundhub-blue mt-1" />
                <div>
                  <span className="font-medium">Validity:</span> Credits are valid for 12 months from the date of purchase
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <BadgeCheck className="h-4 w-4 text-fundhub-blue mt-1" />
                <div>
                  <span className="font-medium">Payment Methods:</span> Pay via invoice or bank transfer
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PurchaseCreditsDialog 
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        onSuccess={() => refetchBilling()}
        currentBalance={billingData?.credits_balance || 0}
      />
    </PageLayout>
  );
}

export default LenderBillingInner;
