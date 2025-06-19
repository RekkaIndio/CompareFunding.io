import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import mailgunService from '@/services/mailgunService';
import PageLayout from '@/components/PageLayout';

const MailgunTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('jamie@comparefunding.io');
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    text: '',
    html: ''
  });
  const [templateTest, setTemplateTest] = useState({
    type: 'welcome',
    to: '',
    firstName: 'John',
    role: 'business' as 'business' | 'lender',
    businessName: 'Test Business Ltd',
    lenderName: 'Test Lender'
  });
  const [lastResult, setLastResult] = useState<any>(null);

  // Get Mailgun configuration status
  const status = mailgunService.getStatus();

  const handleQuickTest = async () => {
    setIsLoading(true);
    try {
      const result = await mailgunService.sendTestEmail(testEmail);
      setLastResult(result);
      
      if (result.success) {
        toast.success('Test email sent successfully!');
      } else {
        if (result.helpMessage) {
          toast.error(result.helpMessage);
        } else {
          toast.error('Failed to send test email');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while sending the email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject) {
      toast.error('Please fill in recipient and subject fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await mailgunService.sendEmail({
        to: customEmail.to,
        subject: customEmail.subject,
        text: customEmail.text || undefined,
        html: customEmail.html || undefined
      });
      
      setLastResult(result);
      
      if (result.success) {
        toast.success('Custom email sent successfully!');
        // Reset form
        setCustomEmail({ to: '', subject: '', text: '', html: '' });
      } else {
        toast.error('Failed to send custom email');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while sending the email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateTest = async () => {
    setIsLoading(true);
    try {
      let result;
      
      switch (templateTest.type) {
        case 'welcome':
          result = await mailgunService.sendWelcomeEmail({
            to: templateTest.to,
            firstName: templateTest.firstName,
            role: templateTest.role
          });
          break;
          
        case 'application_submitted':
          result = await mailgunService.sendApplicationSubmittedEmail({
            to: templateTest.to,
            firstName: templateTest.firstName,
            businessName: templateTest.businessName,
            applicationNumber: 'APP-12345',
            loanAmount: 50000
          });
          break;
          
        case 'offer_received':
          result = await mailgunService.sendOfferReceivedEmail({
            to: templateTest.to,
            firstName: templateTest.firstName,
            businessName: templateTest.businessName,
            lenderName: templateTest.lenderName,
            offerAmount: 45000,
            interestRate: 8.5,
            termMonths: 24
          });
          break;
          
        case 'document_invitation':
          result = await mailgunService.sendDocumentInvitationEmail({
            to: templateTest.to,
            colleagueName: templateTest.firstName,
            businessName: templateTest.businessName,
            inviterName: 'Test User',
            uploadUrl: 'https://comparefunding.io/upload/documents',
            message: 'Please help me upload the required financial documents for our funding application.'
          });
          break;
          
        case 'lender_invitation':
          result = await mailgunService.sendLenderInvitationEmail({
            to: templateTest.to,
            firstName: templateTest.firstName,
            lastName: 'Smith',
            organizationName: templateTest.lenderName,
            inviterName: 'Test Manager',
            role: 'analyst',
            acceptUrl: 'https://comparefunding.io/accept-invitation'
          });
          break;
          
        default:
          throw new Error('Unknown template type');
      }
      
      setLastResult(result);
      
      if (result.success) {
        toast.success(`${templateTest.type.replace('_', ' ')} email sent successfully!`);
      } else {
        if (result.helpMessage) {
          toast.error(result.helpMessage);
        } else {
          toast.error(`Failed to send ${templateTest.type.replace('_', ' ')} email`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while sending the template email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-fundhub-orange mb-2">
              Mailgun Integration Test
            </h1>
            <p className="text-muted-foreground">
              Test your Mailgun email functionality before deploying
            </p>
          </div>

          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Status</CardTitle>
              <CardDescription>
                Check if Mailgun is properly configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${status.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>API Key: {status.apiKey ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${status.domain ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Domain: {status.domain ? 'Configured' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span>Overall: {status.configured ? 'Ready' : 'Not Configured'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Test */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Test</CardTitle>
              <CardDescription>
                Send a pre-configured test email to verify basic functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address to test"
                />
              </div>
              <Button 
                onClick={handleQuickTest}
                disabled={isLoading || !status.configured}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Email Test */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Email Test</CardTitle>
              <CardDescription>
                Send a custom email with your own content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customTo">To</Label>
                <Input
                  id="customTo"
                  type="email"
                  value={customEmail.to}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customSubject">Subject</Label>
                <Input
                  id="customSubject"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <Label htmlFor="customText">Text Content</Label>
                <Textarea
                  id="customText"
                  value={customEmail.text}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Plain text email content"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="customHtml">HTML Content (Optional)</Label>
                <Textarea
                  id="customHtml"
                  value={customEmail.html}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, html: e.target.value }))}
                  placeholder="<h1>HTML email content</h1>"
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleCustomEmail}
                disabled={isLoading || !status.configured}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Send Custom Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Email Template Testing */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template Testing</CardTitle>
              <CardDescription>
                Test the different email templates used throughout the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <select
                  id="templateType"
                  value={templateTest.type}
                  onChange={(e) => setTemplateTest(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="welcome">Welcome Email</option>
                  <option value="application_submitted">Application Submitted</option>
                  <option value="offer_received">Offer Received</option>
                  <option value="document_invitation">Document Upload Invitation</option>
                  <option value="lender_invitation">Lender Team Invitation</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateTo">To Email</Label>
                  <Input
                    id="templateTo"
                    type="email"
                    value={templateTest.to}
                    onChange={(e) => setTemplateTest(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="recipient@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="templateFirstName">First Name</Label>
                  <Input
                    id="templateFirstName"
                    value={templateTest.firstName}
                    onChange={(e) => setTemplateTest(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
              </div>
              
              {templateTest.type === 'welcome' && (
                <div>
                  <Label htmlFor="templateRole">User Role</Label>
                  <select
                    id="templateRole"
                    value={templateTest.role}
                    onChange={(e) => setTemplateTest(prev => ({ ...prev, role: e.target.value as 'business' | 'lender' }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="business">Business</option>
                    <option value="lender">Lender</option>
                  </select>
                </div>
              )}
              
              {(templateTest.type === 'application_submitted' || 
                templateTest.type === 'offer_received' || 
                templateTest.type === 'document_invitation') && (
                <div>
                  <Label htmlFor="templateBusinessName">Business Name</Label>
                  <Input
                    id="templateBusinessName"
                    value={templateTest.businessName}
                    onChange={(e) => setTemplateTest(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Test Business Ltd"
                  />
                </div>
              )}
              
              {(templateTest.type === 'offer_received' || templateTest.type === 'lender_invitation') && (
                <div>
                  <Label htmlFor="templateLenderName">Lender/Organization Name</Label>
                  <Input
                    id="templateLenderName"
                    value={templateTest.lenderName}
                    onChange={(e) => setTemplateTest(prev => ({ ...prev, lenderName: e.target.value }))}
                    placeholder="Test Lender"
                  />
                </div>
              )}
              
              <Button 
                onClick={handleTemplateTest}
                disabled={isLoading || !status.configured || !templateTest.to}
                className="w-full"
              >
                {isLoading ? 'Sending...' : `Send ${templateTest.type.replace('_', ' ')} Email`}
              </Button>
            </CardContent>
          </Card>

          {/* Last Result */}
          {lastResult && (
            <Card>
              <CardHeader>
                <CardTitle>Last Operation Result</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={lastResult.success ? 'border-green-500' : 'border-red-500'}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">
                        {lastResult.success ? '✅ Success' : '❌ Failed'}
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(lastResult, null, 2)}
                      </pre>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {!status.configured && (
            <Alert>
              <AlertDescription>
                ⚠️ Mailgun is not properly configured. Please check your API key and domain settings.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MailgunTest;
