import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, FileText, PoundSterling, Users, Building2, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { createDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface RequestDocumentsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  applicationData: any;
  onRequestSuccess?: () => void;
}

// Predefined document categories for quick selection
const DOCUMENT_CATEGORIES = [
  { id: 'financial', label: 'Financial Statements', icon: PoundSterling },
  { id: 'bank_statements', label: 'Bank Statements', icon: BarChart3 },
  { id: 'tax_returns', label: 'Tax Returns', icon: FileText },
  { id: 'business_plan', label: 'Business Plan', icon: Building2 },
  { id: 'cashflow', label: 'Cash Flow Projections', icon: BarChart3 },
  { id: 'management_accounts', label: 'Management Accounts', icon: PoundSterling },
  { id: 'company_info', label: 'Company Information', icon: Building2 },
  { id: 'director_details', label: 'Director Details', icon: Users },
  { id: 'contracts', label: 'Key Contracts/Agreements', icon: FileText },
  { id: 'insurance', label: 'Insurance Documents', icon: FileText },
  { id: 'other', label: 'Other Documents', icon: FileText },
];

export const RequestDocumentsDialog: React.FC<RequestDocumentsDialogProps> = ({
  isOpen,
  setIsOpen,
  applicationData,
  onRequestSuccess
}) => {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [customRequests, setCustomRequests] = useState<string[]>(['']);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle document category selection
  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  // Add custom request field
  const addCustomRequest = () => {
    setCustomRequests([...customRequests, '']);
  };

  // Remove custom request field
  const removeCustomRequest = (index: number) => {
    const newRequests = customRequests.filter((_, i) => i !== index);
    setCustomRequests(newRequests);
  };

  // Update custom request text
  const updateCustomRequest = (index: number, value: string) => {
    const newRequests = [...customRequests];
    newRequests[index] = value;
    setCustomRequests(newRequests);
  };

  // Submit the request
  const handleSubmitRequest = async () => {
    if (!user?.uid || !applicationData?.application?.id) {
      toast.error('Missing required information');
      return;
    }

    // Validate that at least something is requested
    const hasSelectedCategories = selectedCategories.size > 0;
    const hasCustomRequests = customRequests.some(req => req.trim() !== '');
    
    if (!hasSelectedCategories && !hasCustomRequests) {
      toast.error('Please select at least one document category or add a custom request');
      return;
    }

    if (!requestTitle.trim()) {
      toast.error('Please provide a title for your request');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get lender profile for company name
      const { getDocument } = await import('@/firebase');
      const { data: lenderProfile } = await getDocument('lender_profiles', user.uid);
      
      const lenderName = lenderProfile?.company_name || lenderProfile?.lender_name || 'Lender';

      console.log('Creating information request with data:', {
        application_id: applicationData.application.id,
        business_id: applicationData.application.user_id,
        lender_id: user.uid,
        lender_name: lenderName
      });

      // Create the information request
      const requestData = {
        application_id: applicationData.application.id,
        business_id: applicationData.application.user_id,
        lender_id: user.uid,
        lender_name: lenderName,
        request_title: requestTitle.trim(),
        request_message: requestMessage.trim(),
        requested_categories: Array.from(selectedCategories),
        custom_requests: customRequests.filter(req => req.trim() !== ''),
        urgency,
        due_date: dueDate || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Submitting information request:', requestData);

      const result = await createDocument('information_requests', requestData);
      
      console.log('Information request creation result:', result);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Create notification for the business
      const notificationData = {
        user_id: applicationData.application.user_id,
        recipient_id: applicationData.application.user_id, // Also include recipient_id for consistency
        type: 'information_request',
        title: 'Information Request',
        message: `${lenderName} has requested additional information for your application`,
        data: {
          application_id: applicationData.application.id,
          request_id: result.data.id,
          lender_name: lenderName,
          request_title: requestTitle.trim(),
        },
        read: false,
        created_at: new Date().toISOString(),
      };

      console.log('Creating notification:', notificationData);

      const notificationResult = await createDocument('notifications', notificationData);
      
      console.log('Notification creation result:', notificationResult);

      toast.success('Information request sent successfully');
      setIsOpen(false);
      
      // Reset form
      setSelectedCategories(new Set());
      setCustomRequests(['']);
      setRequestTitle('');
      setRequestMessage('');
      setUrgency('medium');
      setDueDate('');
      
      if (onRequestSuccess) {
        onRequestSuccess();
      }
    } catch (error) {
      console.error('Error sending information request:', error);
      toast.error('Failed to send information request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-xl border-0">
        <DialogHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000] -m-6 mb-6 p-6">
          <DialogTitle className="flex items-center text-xl text-white">
            <FileText className="mr-2 h-5 w-5 text-[#ff8000]" />
            Request Additional Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Request Title */}
          <div className="space-y-2">
            <Label htmlFor="request-title" className="text-[#212936] font-medium">Request Title *</Label>
            <Input
              id="request-title"
              placeholder="e.g., Additional Financial Documentation Required"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              className="w-full border-slate-200 focus:border-[#ff8000] focus:ring focus:ring-[#ff8000]/20"
            />
          </div>

          {/* Urgency and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency" className="text-[#212936] font-medium">Urgency Level</Label>
              <select
                id="urgency"
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff8000]/20 focus:border-[#ff8000]"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date" className="text-[#212936] font-medium">Due Date (Optional)</Label>
              <Input
                id="due-date"
                type="date"
                min={getMinDate()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-slate-200 focus:border-[#ff8000] focus:ring focus:ring-[#ff8000]/20"
              />
            </div>
          </div>

          {/* Document Categories */}
          <div className="space-y-3">
            <Label className="text-[#212936] font-medium border-l-4 border-[#ff8000] pl-3">Select Document Categories</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOCUMENT_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategories.has(category.id);
                
                return (
                  <div
                    key={category.id}
                    className={`
                      cursor-pointer p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg
                      ${isSelected 
                        ? 'border-[#ff8000] bg-[#ff8000]/10 text-[#ff8000] shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }
                    `}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`h-4 w-4 ${isSelected ? 'text-[#ff8000]' : 'text-slate-600'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-[#ff8000]' : 'text-slate-700'}`}>
                        {category.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[#212936] font-medium border-l-4 border-[#ff8000] pl-3">Custom Information Requests</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomRequest}
                className="flex items-center border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000]/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Request
              </Button>
            </div>
            
            <div className="space-y-2">
              {customRequests.map((request, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="e.g., Latest board meeting minutes"
                    value={request}
                    onChange={(e) => updateCustomRequest(index, e.target.value)}
                    className="flex-1 border-slate-200 focus:border-[#ff8000] focus:ring focus:ring-[#ff8000]/20"
                  />
                  {customRequests.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomRequest(index)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="request-message" className="text-[#212936] font-medium">Additional Message (Optional)</Label>
            <Textarea
              id="request-message"
              placeholder="Provide any additional context or specific requirements..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="min-h-[100px] border-slate-200 focus:border-[#ff8000] focus:ring focus:ring-[#ff8000]/20"
            />
          </div>

          {/* Summary */}
          {(selectedCategories.size > 0 || customRequests.some(req => req.trim() !== '')) && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-sm">
              <h4 className="font-medium mb-2 text-[#212936] border-l-4 border-[#ff8000] pl-3">Request Summary:</h4>
              <div className="space-y-2 ml-4">
                {selectedCategories.size > 0 && (
                  <div>
                    <span className="text-sm text-slate-600 font-medium">Document Categories: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(selectedCategories).map(categoryId => {
                        const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
                        return (
                          <Badge key={categoryId} className="text-xs bg-[#ff8000]/10 text-[#ff8000] border-[#ff8000]/20">
                            {category?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                {customRequests.some(req => req.trim() !== '') && (
                  <div>
                    <span className="text-sm text-slate-600 font-medium">Custom Requests: </span>
                    <ul className="list-disc list-inside text-sm mt-1 text-slate-700">
                      {customRequests.filter(req => req.trim() !== '').map((request, index) => (
                        <li key={index}>{request}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 px-6 pb-6 bg-slate-50 -mx-6 -mb-6 pt-6 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            disabled={isSubmitting}
            className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
