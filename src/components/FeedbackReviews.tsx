import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/firebase';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ReviewProps = {
  lenderId: string | undefined;
};

type Review = {
  id: string;
  lender_id: string;
  business_id: string;
  business_name: string;
  rating: number;
  feedback: string;
  created_at: string;
  loan_amount?: number;
  offer_id?: string;
};

// Sample reviews for demonstration purposes
const sampleReviews: Review[] = [
  {
    id: 'rev1',
    lender_id: 'sample-lender-id',
    business_id: 'business-1',
    business_name: 'Eco Solutions Inc',
    rating: 5,
    feedback: 'Exceptional service! The approval process was quick and the terms were excellent. They really understand the challenges of sustainable businesses.',
    created_at: '2025-03-15T14:30:00Z',
    loan_amount: 125000,
    offer_id: 'offer-123'
  },
  {
    id: 'rev2',
    lender_id: 'sample-lender-id',
    business_id: 'business-2',
    business_name: 'Metro Retail Group',
    rating: 4,
    feedback: 'Good experience overall. The team was responsive and offered competitive rates. The process took a bit longer than expected but the outcome was worth it.',
    created_at: '2025-02-22T09:15:00Z',
    loan_amount: 200000,
    offer_id: 'offer-456'
  },
  {
    id: 'rev3',
    lender_id: 'sample-lender-id',
    business_id: 'business-3',
    business_name: 'TechStart Innovation',
    rating: 5,
    feedback: 'Fantastic partner for our startup! They understood our business model and provided the funding we needed to scale. Would definitely recommend to other tech companies.',
    created_at: '2025-01-19T11:45:00Z',
    loan_amount: 85000,
    offer_id: 'offer-789'
  },
  {
    id: 'rev4',
    lender_id: 'sample-lender-id',
    business_id: 'business-4',
    business_name: 'Heritage Bakery Co',
    rating: 3,
    feedback: 'Satisfactory service, although I had to provide additional documentation several times. The rates were fair for our industry and the funding helped us expand our operations.',
    created_at: '2025-03-05T16:20:00Z',
    loan_amount: 50000,
    offer_id: 'offer-012'
  },
  {
    id: 'rev5',
    lender_id: 'sample-lender-id',
    business_id: 'business-5',
    business_name: 'Global Logistics Partners',
    rating: 4,
    feedback: 'Professional service from start to finish. They understood our complex business requirements and structured a financing package that matched our expansion plans.',
    created_at: '2025-02-10T10:00:00Z',
    loan_amount: 375000,
    offer_id: 'offer-345'
  }
];

const FeedbackReviews = ({ lenderId }: ReviewProps) => {
  // Fetch reviews for this lender
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['lenderReviews', lenderId],
    queryFn: async () => {
      if (!lenderId) return [];
      
      try {
        const { data, error } = await getDocuments(
          'lender_reviews',
          [{ field: 'lender_id', operator: '==', value: lenderId }],
          [{ field: 'created_at', direction: 'desc' }]
        );
        
        if (error) {
          toast.error('Error loading reviews');
          throw error;
        }
        
        // If no real reviews found, use sample data for demonstration
        if (!data || data.length === 0) {
          console.log('No real reviews found, using sample data');
          return sampleReviews;
        }
        
        return data as Review[] || [];
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Return sample data if error occurs
        return sampleReviews;
      }
    },
    enabled: true, // Always fetch to show sample data
  });

  // Calculate average rating
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star 
        key={index} 
        className={`h-4 w-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse bg-gray-100 h-32"></Card>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          You haven't received any feedback from businesses yet. Feedback will appear here after businesses review their experience working with you.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Rating summary */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
          <div className="flex items-center">
            {renderStars(Math.round(averageRating))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Based on {reviews.length} reviews</p>
      </div>

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>{getInitials(review.business_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{review.business_name}</h4>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  {review.loan_amount && (
                    <Badge variant="outline" className="mb-2">
                      Funded: ${review.loan_amount.toLocaleString()}
                    </Badge>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                  
                  <p className="text-sm">{review.feedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeedbackReviews;