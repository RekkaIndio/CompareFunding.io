import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, MessageSquare, Clock, Eye } from 'lucide-react';
import { formatApplicationNumber } from '@/lib/applicationUtils';

interface DeclineFeedbackCardProps {
  notifications: any[];
  applications: any[];
}

const DeclineFeedbackCard: React.FC<DeclineFeedbackCardProps> = ({ 
  notifications, 
  applications 
}) => {
  // Filter notifications for decline feedback
  const declineNotifications = notifications?.filter(notification => 
    notification.type === 'application_declined' && 
    notification.decline_feedback &&
    notification.decline_feedback !== 'No feedback provided'
  ) || [];

  // Get feedback from interested_lenders in applications
  const getDeclineFeedbackFromApplications = () => {
    const feedbackItems: any[] = [];
    
    applications?.forEach(app => {
      if (app.interested_lenders) {
        app.interested_lenders.forEach((lender: any) => {
          if (lender.status === 'declined' && lender.decline_feedback && lender.decline_feedback !== 'No feedback provided') {
            feedbackItems.push({
              id: `${app.id}-${lender.lender_id}`,
              applicationId: app.id,
              applicationNumber: app.application_number,
              lenderName: lender.lender_name || 'Anonymous Lender',
              feedback: lender.decline_feedback,
              declinedAt: lender.declined_at,
              businessName: app.business_name || 'Your Business'
            });
          }
        });
      }
    });
    
    return feedbackItems;
  };

  const applicationFeedback = getDeclineFeedbackFromApplications();
  const allFeedback = [
    ...declineNotifications.map(notif => ({
      id: notif.id,
      applicationId: notif.application_id,
      applicationNumber: applications?.find(app => app.id === notif.application_id)?.application_number,
      lenderName: 'Lender',
      feedback: notif.decline_feedback,
      declinedAt: notif.created_at || notif.sent_at,
      businessName: 'Your Business',
      isNotification: true
    })),
    ...applicationFeedback
  ];

  // Sort by date, most recent first
  allFeedback.sort((a, b) => new Date(b.declinedAt).getTime() - new Date(a.declinedAt).getTime());

  if (allFeedback.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Lender Feedback</h2>
            <p className="text-sm text-orange-100">
              Feedback from lenders who declined your applications
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {allFeedback.slice(0, 3).map((feedback) => (
            <div 
              key={feedback.id}
              className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Application #{formatApplicationNumber(
                      applications?.find(app => app.id === feedback.applicationId), 
                      feedback.applicationId
                    )}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(feedback.declinedAt)}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {feedback.feedback}
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Full Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-500" />
                      Decline Feedback
                    </DialogTitle>
                    <DialogDescription>
                      Feedback from a lender regarding Application #{formatApplicationNumber(
                        applications?.find(app => app.id === feedback.applicationId), 
                        feedback.applicationId
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Lender Feedback:</span>
                      </div>
                      <p className="text-sm text-orange-800 whitespace-pre-wrap">
                        {feedback.feedback}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Declined on {formatDate(feedback.declinedAt)}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Use this feedback to improve your future applications. 
                        Consider addressing the concerns raised when applying to other lenders.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
          
          {allFeedback.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                And {allFeedback.length - 3} more feedback{allFeedback.length - 3 > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeclineFeedbackCard;
