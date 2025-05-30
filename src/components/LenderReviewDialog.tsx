import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createDocument, getDocument } from '@/firebase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

type LenderReviewDialogProps = {
  lenderId: string;
  lenderName: string;
  offerId: string;
  offerAmount?: number;
  onReviewSubmitted?: () => void;
  trigger?: React.ReactNode;
};

const LenderReviewDialog = ({
  lenderId,
  lenderName,
  offerId,
  offerAmount,
  onReviewSubmitted,
  trigger
}: LenderReviewDialogProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Please provide some feedback');
      return;
    }

    setIsLoading(true);

    try {
      // Get business profile to get the business name
      const { data: businessProfile } = await getDocument('businesses', user.uid);
      
      const reviewData = {
        lender_id: lenderId,
        business_id: user.uid,
        business_name: businessProfile?.business_name || 'Anonymous Business',
        rating,
        feedback,
        offer_id: offerId,
        loan_amount: offerAmount,
        created_at: new Date().toISOString()
      };

      const { data, error } = await createDocument('lender_reviews', reviewData);
      
      if (error) {
        toast.error('Failed to submit review');
        console.error('Error submitting review:', error);
        setIsLoading(false);
        return;
      }

      toast.success('Review submitted successfully');
      setIsOpen(false);
      setRating(0);
      setFeedback('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error('Error in review submission:', err);
      toast.error('An error occurred while submitting your review');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return Array(5).fill(0).map((_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          className={`h-8 w-8 cursor-pointer transition-all ${
            (hoverRating || rating) >= starValue
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starValue)}
        />
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">Leave Feedback</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            Share your feedback about working with {lenderName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-center mb-6">
            {renderStars()}
          </div>
          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              Your Feedback
            </label>
            <Textarea
              id="feedback"
              placeholder="Tell us about your experience working with this lender..."
              className="min-h-[120px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-fundhub-blue hover:bg-fundhub-blue/90"
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LenderReviewDialog;