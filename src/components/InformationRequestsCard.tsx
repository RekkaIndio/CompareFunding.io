import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, updateDocument, createDocument } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  MessageSquare,
  Calendar,
  Building2,
  X
} from 'lucide-react';

interface InformationRequest {
  id: string;
  application_id: string;
  business_id: string;
  lender_id: string;
  lender_name: string;
  request_title: string;
  request_message: string;
  requested_categories: string[];
  custom_requests: string[];
  urgency: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'pending' | 'fulfilled' | 'overdue';
  created_at: string;
  responses?: any[];
}

interface InformationRequestsProps {
  applicationId?: string;
}

const DOCUMENT_CATEGORIES = {
  financial: 'Financial Statements',
  bank_statements: 'Bank Statements',
  tax_returns: 'Tax Returns',
  business_plan: 'Business Plan',
  cashflow: 'Cash Flow Projections',
  management_accounts: 'Management Accounts',
  company_info: 'Company Information',
  director_details: 'Director Details',
  contracts: 'Key Contracts/Agreements',
  insurance: 'Insurance Documents',
  other: 'Other Documents'
};

export const InformationRequestsCard: React.FC<InformationRequestsProps> = ({
  applicationId
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<InformationRequest | null>(null);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Fetch information requests for the user's applications
  const { data: informationRequests, isLoading } = useQuery({
    queryKey: ['informationRequests', user?.uid, applicationId],
    queryFn: async () => {
      if (!user?.uid) return [];

      const filters: any[] = [
        { field: 'business_id', operator: '==', value: user.uid }
      ];

      if (applicationId) {
        filters.push({ field: 'application_id', operator: '==', value: applicationId });
      }

      const { data, error } = await getDocuments('information_requests', filters, [
        { field: 'created_at', direction: 'desc' }
      ]);

      if (error) {
        console.error('Error fetching information requests:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Check for new requests every 30 seconds
  });

  // Handle responding to a request
  const respondToRequest = useMutation({
    mutationFn: async ({ requestId, message, files }: { 
      requestId: string; 
      message: string; 
      files: File[] 
    }) => {
      // Create response document
      const responseData = {
        request_id: requestId,
        business_id: user?.uid,
        response_message: message,
        responded_at: new Date().toISOString(),
        // For now, we'll just store file names - in a real app you'd upload to storage
        uploaded_files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      };

      const { error: responseError } = await createDocument('information_request_responses', responseData);
      if (responseError) throw responseError;

      // Update request status
      const { error: updateError } = await updateDocument('information_requests', requestId, {
        status: 'fulfilled',
        updated_at: new Date().toISOString()
      });
      if (updateError) throw updateError;

      return responseData;
    },
    onSuccess: () => {
      toast.success('Response submitted successfully');
      setIsResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage('');
      setUploadedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['informationRequests'] });
    },
    onError: (error) => {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string, dueDate?: string) => {
    if (status === 'fulfilled') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'overdue' || (dueDate && new Date(dueDate) < new Date())) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <Clock className="h-5 w-5 text-orange-500" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
        <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
          <CardTitle className="text-white font-bold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#ff8000]" />
            Information Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!informationRequests || informationRequests.length === 0) {
    return (
      <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
        <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
          <CardTitle className="text-white font-bold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#ff8000]" />
            Information Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No information requests yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Lenders will request additional information here when needed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
        <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
          <CardTitle className="text-white font-bold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-[#ff8000]" />
            Information Requests
            {informationRequests.filter(req => req.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-[#ff8000] text-white">
                {informationRequests.filter(req => req.status === 'pending').length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {informationRequests.map((request) => (
            <div
              key={request.id}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(request.status, request.due_date)}
                    <h3 className="font-semibold text-[#212936]">
                      {request.request_title}
                    </h3>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency} priority
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {request.lender_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    {request.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due: {new Date(request.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {request.requested_categories.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-slate-700">Requested Documents: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.requested_categories.map(categoryId => (
                          <Badge key={categoryId} variant="outline" className="text-xs">
                            {DOCUMENT_CATEGORIES[categoryId as keyof typeof DOCUMENT_CATEGORIES] || categoryId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.custom_requests.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-slate-700">Custom Requests: </span>
                      <ul className="list-disc list-inside text-sm text-slate-600 mt-1">
                        {request.custom_requests.map((customReq, index) => (
                          <li key={index}>{customReq}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {request.request_message && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                      {request.request_message}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {request.status === 'pending' ? (
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsResponseDialogOpen(true);
                      }}
                      className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white"
                    >
                      Respond
                    </Button>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      Responded
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl border-0">
          <DialogHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000] -m-6 mb-6 p-6">
            <DialogTitle className="flex items-center text-xl text-white">
              <MessageSquare className="mr-2 h-5 w-5 text-[#ff8000]" />
              Respond to Information Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 px-6 pb-6">
              {/* Request Summary */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <h4 className="font-medium text-[#212936] mb-2">Request from {selectedRequest.lender_name}:</h4>
                <p className="text-sm text-slate-700 mb-2">{selectedRequest.request_title}</p>
                {selectedRequest.request_message && (
                  <p className="text-sm text-slate-600 italic">"{selectedRequest.request_message}"</p>
                )}
              </div>

              {/* Response Message */}
              <div className="space-y-2">
                <Label htmlFor="response-message" className="text-[#212936] font-medium">
                  Your Response
                </Label>
                <Textarea
                  id="response-message"
                  placeholder="Provide details about the documents you're uploading or any additional context..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="min-h-[100px] border-slate-200 focus:border-[#ff8000] focus:ring focus:ring-[#ff8000]/20"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-[#212936] font-medium">Upload Documents</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#ff8000] transition-colors">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-2">
                    Click to upload files or drag and drop
                  </p>
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-[#ff8000] hover:text-[#ff8000]/90 font-medium"
                  >
                    Choose Files
                  </Label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Uploaded Files:</span>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <span className="text-sm text-slate-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 px-6 pb-6 bg-slate-50 -mx-6 -mb-6 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsResponseDialogOpen(false);
                setSelectedRequest(null);
                setResponseMessage('');
                setUploadedFiles([]);
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  respondToRequest.mutate({
                    requestId: selectedRequest.id,
                    message: responseMessage,
                    files: uploadedFiles
                  });
                }
              }}
              disabled={respondToRequest.isPending || (!responseMessage.trim() && uploadedFiles.length === 0)}
              className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {respondToRequest.isPending ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
