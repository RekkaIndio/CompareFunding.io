import React, { useState } from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Briefcase, PoundSterling, CalendarDays, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateDocument } from '@/firebase';
import { toast } from 'sonner';

interface ApplicationOverviewProps {
  application: any;
  refetchApplication?: () => void;
}

const ApplicationOverview: React.FC<ApplicationOverviewProps> = ({ application, refetchApplication }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    loan_amount: application?.loan_amount || 0,
    loan_term_months: application?.loan_term_months || 0,
    loan_type: application?.loan_type || '',
    purpose: application?.purpose || '',
    purpose_details: application?.purpose_details || '',
    is_secured: application?.is_secured || false,
    has_personal_guarantee: application?.has_personal_guarantee || false,
  });

  if (!application) return null;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const startEditing = () => {
    // Reset form data to current application values
    setFormData({
      loan_amount: application?.loan_amount || 0,
      loan_term_months: application?.loan_term_months || 0,
      loan_type: application?.loan_type || '',
      purpose: application?.purpose || '',
      purpose_details: application?.purpose_details || '',
      is_secured: application?.is_secured || false,
      has_personal_guarantee: application?.has_personal_guarantee || false,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!application?.id) {
      toast.error("Application ID is missing");
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate form data
      if (formData.loan_amount <= 0) {
        toast.error("Loan amount must be greater than zero");
        setIsLoading(false);
        return;
      }

      if (formData.loan_term_months <= 0) {
        toast.error("Loan term must be greater than zero");
        setIsLoading(false);
        return;
      }

      if (!formData.loan_type) {
        toast.error("Loan type is required");
        setIsLoading(false);
        return;
      }

      if (!formData.purpose) {
        toast.error("Loan purpose is required");
        setIsLoading(false);
        return;
      }

      // Update the application in Firebase
      await updateDocument('applications', application.id, {
        ...formData,
        status_updated_at: new Date().toISOString()
      });

      toast.success("Application details updated successfully");
      setIsEditing(false);
      
      // Refresh application data
      if (refetchApplication) {
        refetchApplication();
      }
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update application details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-[#ff8000]" />
            <span className="text-white">Application Overview</span>
          </CardTitle>
          {!isEditing && application?.isOwner && (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:text-[#ff8000] hover:bg-transparent"
              onClick={startEditing}
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
        </div>
        <CardDescription className="text-gray-200">
          Key details about your funding application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isEditing ? (
            <>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <Label htmlFor="loan_amount" className="text-sm text-slate-500">Loan Amount</Label>
                <div className="flex items-center mt-1">
                  <PoundSterling className="h-4 w-4 text-[#ff8000] mr-1" />
                  <Input 
                    id="loan_amount"
                    type="number"
                    value={formData.loan_amount}
                    onChange={(e) => handleChange('loan_amount', Number(e.target.value))}
                    className="font-semibold text-slate-900"
                  />
                </div>
              </div>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <Label htmlFor="loan_term" className="text-sm text-slate-500">Loan Term (months)</Label>
                <div className="flex items-center mt-1">
                  <CalendarDays className="h-4 w-4 text-[#ff8000] mr-1" />
                  <Input 
                    id="loan_term"
                    type="number"
                    value={formData.loan_term_months}
                    onChange={(e) => handleChange('loan_term_months', Number(e.target.value))}
                    className="font-semibold text-slate-900"
                  />
                </div>
              </div>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <Label htmlFor="loan_type" className="text-sm text-slate-500">Type</Label>
                <Select
                  value={formData.loan_type}
                  onValueChange={(value) => handleChange('loan_type', value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_loan">Term Loan</SelectItem>
                    <SelectItem value="line_of_credit">Line of Credit</SelectItem>
                    <SelectItem value="invoice_financing">Invoice Financing</SelectItem>
                    <SelectItem value="asset_finance">Asset Finance</SelectItem>
                    <SelectItem value="merchant_cash_advance">Merchant Cash Advance</SelectItem>
                    <SelectItem value="commercial_mortgage">Commercial Mortgage</SelectItem>
                    <SelectItem value="bridge_loan">Bridge Loan</SelectItem>
                    <SelectItem value="equipment_financing">Equipment Financing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-500">Loan Amount</p>
                <p className="font-semibold text-slate-900 text-lg flex items-center">
                  <PoundSterling className="h-4 w-4 text-[#ff8000] mr-1" />
                  £{application.loan_amount?.toLocaleString() || 'Not specified'}
                </p>
              </div>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-500">Loan Term</p>
                <p className="font-semibold text-slate-900 text-lg flex items-center">
                  <CalendarDays className="h-4 w-4 text-[#ff8000] mr-1" />
                  {application.loan_term_months || 'Not specified'} months
                </p>
              </div>
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-500">Type</p>
                <p className="font-semibold text-slate-900 text-lg capitalize">
                  {application.loan_type?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
            </>
          )}
        </div>
        
        <Separator className="bg-slate-200" />
        
        <div>
          {isEditing ? (
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 mb-4">
              <Label htmlFor="purpose" className="text-sm text-slate-500">Purpose</Label>
              <Select
                value={formData.purpose}
                onValueChange={(value) => handleChange('purpose', value)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select loan purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_expansion">Business Expansion</SelectItem>
                  <SelectItem value="working_capital">Working Capital</SelectItem>
                  <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                  <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                  <SelectItem value="property_purchase">Property Purchase</SelectItem>
                  <SelectItem value="inventory_purchase">Inventory Purchase</SelectItem>
                  <SelectItem value="hiring_staff">Hiring Staff</SelectItem>
                  <SelectItem value="refinancing">Refinancing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="purpose_details" className="text-sm text-slate-500 mt-2">Additional Details</Label>
              <Textarea 
                id="purpose_details"
                value={formData.purpose_details}
                onChange={(e) => handleChange('purpose_details', e.target.value)}
                className="mt-1"
                placeholder="Provide additional details about your loan purpose"
              />
            </div>
          ) : (
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 mb-4">
              <p className="text-sm text-slate-500">Purpose</p>
              <p className="font-semibold text-slate-900">
                {application.purpose?.replace('_', ' ') || 'Not specified'}
              </p>
              {application.purpose_details && (
                <p className="text-sm mt-1 text-slate-600">
                  {application.purpose_details}
                </p>
              )}
            </div>
          )}
        </div>

        <Separator className="bg-slate-200" />

        <div>
          <div className="text-lg font-medium mb-3 text-[#212936]">Additional Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_secured" className="text-sm text-slate-500">Security Offered</Label>
                    <Switch
                      id="is_secured"
                      checked={formData.is_secured}
                      onCheckedChange={(checked) => handleChange('is_secured', checked)}
                    />
                  </div>
                </div>
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_personal_guarantee" className="text-sm text-slate-500">Personal Guarantee</Label>
                    <Switch
                      id="has_personal_guarantee"
                      checked={formData.has_personal_guarantee}
                      onCheckedChange={(checked) => handleChange('has_personal_guarantee', checked)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                  <p className="text-sm text-slate-500">Security Offered</p>
                  <p className="font-medium text-slate-900">
                    {application.is_secured ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                  <p className="text-sm text-slate-500">Personal Guarantee</p>
                  <p className="font-medium text-slate-900">
                    {application.has_personal_guarantee ? 'Yes' : 'No'}
                  </p>
                </div>
              </>
            )}
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Application Date</p>
              <p className="font-medium text-slate-900">
                {application.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="font-medium text-slate-900">
                {application.status_updated_at ? new Date(application.status_updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-end gap-2 bg-slate-50/70 p-4 rounded-b-lg">
          <Button variant="outline" onClick={cancelEditing} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ApplicationOverview;
