import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HandCoins, ThumbsUp, BarChart4 } from 'lucide-react';

interface OffersSectionProps {
  application: any;
  handleRespondToInterest: (lender: any, response: 'accepted' | 'rejected') => Promise<void>;
}

const OffersSection: React.FC<OffersSectionProps> = ({ 
  application, 
  handleRespondToInterest
}) => {
  if (!application) return null;

  // If there are no offers but there are interested lenders and user is owner
  if (application.interested_lenders?.length > 0 && application.isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ThumbsUp className="mr-2 h-5 w-5 text-fundhub-blue" />
            Interested Lenders
          </CardTitle>
          <CardDescription>
            These lenders have expressed interest in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {application.interested_lenders.map((lender: any, index: number) => (
              <div key={lender.lender_id || index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{lender.lender_name || 'Lender'}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {lender.lender_company || 'Financial Institution'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Interest expressed on {lender.expressed_at ? new Date(lender.expressed_at.seconds * 1000).toLocaleDateString() : 'recently'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lender.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600"
                          onClick={() => handleRespondToInterest(lender, 'rejected')}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                          onClick={() => handleRespondToInterest(lender, 'accepted')}
                        >
                          Accept
                        </Button>
                      </>
                    ) : (
                      <Badge variant={lender.status === 'accepted' ? 'default' : 'destructive'}>
                        {lender.status === 'accepted' ? 'Accepted' : 'Declined'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <p>By accepting, you'll connect with this lender to discuss potential financing options.</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no offers but application is submitted, show the "under review" message
  if ((!application.offers || application.offers.length === 0) && application.status === 'submitted') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart4 className="h-12 w-12 mx-auto text-fundhub-blue mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Application Under Review
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your application is being reviewed by matching lenders. 
              You'll be notified when you receive offers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there are offers, render them
  if (application.offers && application.offers.length > 0) {
    return (
      <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-[#212936] text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <HandCoins className="mr-2 h-5 w-5 text-[#ff8000]" />
            <span className="text-white">Funding Offers</span>
          </CardTitle>
          <CardDescription className="text-gray-200">
            Lender offers for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {application.offers.map((offer, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className={`p-4 ${offer.status === 'approved' ? 'bg-green-50 border-b border-green-200' : offer.status === 'rejected' ? 'bg-red-50 border-b border-red-200' : 'bg-blue-50 border-b border-blue-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[#212936]">
                        £{Number(offer.amount).toLocaleString()}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {offer.term} months • {offer.interest_rate}% interest
                      </p>
                    </div>
                    <Badge 
                      className={`
                        ${offer.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                         offer.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                         'bg-blue-100 text-blue-800 border-blue-200'}
                      `}
                    >
                      {offer.status === 'approved' ? 'Accepted' :
                       offer.status === 'rejected' ? 'Declined' :
                       'Pending'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  {offer.lender_name && (
                    <div className="mb-3">
                      <span className="text-sm text-slate-500">From</span>
                      <div className="font-medium text-slate-800">{offer.lender_name}</div>
                    </div>
                  )}
                  
                  {offer.note && (
                    <div className="mb-3">
                      <span className="text-sm text-slate-500">Note</span>
                      <p className="text-slate-800 text-sm">{offer.note}</p>
                    </div>
                  )}
                  
                  {offer.status === 'pending' && !application.isLender && (
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {/* Handle approve */}}
                      >
                        <ThumbsUp className="mr-1 h-3 w-3" /> Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {/* Handle reject */}}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fallback
  return null;
};

export default OffersSection;
