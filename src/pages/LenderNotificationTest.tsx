import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { testLenderNotificationWithoutPDF, testLenderProspectNotification } from '@/services/testLenderNotification';
import { emailDebugger } from '@/services/emailDebugger';
import { mailgunService } from '@/services/mailgunService';
import { Mail, FileText, CheckCircle, XCircle, AlertCircle, Bug, Send, Search } from 'lucide-react';

const LenderNotificationTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('jamie@comparefunding.io');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const runTest = async (testFunction: Function, testName: string) => {
    setIsLoading(true);
    try {
      console.log(`Running ${testName}...`);
      const result = await testFunction();
      
      const testResult = {
        name: testName,
        timestamp: new Date().toLocaleTimeString(),
        success: result.success,
        error: result.error?.message || result.error,
        helpMessage: result.helpMessage,
        details: result.result
      };
      
      setTestResults(prev => [testResult, ...prev]);
    } catch (error) {
      const testResult = {
        name: testName,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        error: error.message,
        details: null
      };
      
      setTestResults(prev => [testResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    try {
      console.log('🔍 Running email delivery diagnostic...');
      const result = await emailDebugger.diagnoseEmailDelivery(recipientEmail);
      
      const diagnosticResult = {
        name: 'Email Delivery Diagnostic',
        timestamp: new Date().toLocaleTimeString(),
        success: result.apiTest.success && result.configTest.success,
        error: !result.apiTest.success ? result.apiTest.message : !result.configTest.success ? result.configTest.message : null,
        helpMessage: result.debugInfo.recommendations.join('; '),
        details: result
      };
      
      setTestResults(prev => [diagnosticResult, ...prev]);
    } catch (error) {
      const diagnosticResult = {
        name: 'Email Delivery Diagnostic',
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        error: error.message,
        details: null
      };
      
      setTestResults(prev => [diagnosticResult, ...prev]);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const runQuickTest = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Running quick email test...');
      const success = await emailDebugger.quickTest(recipientEmail);
      
      const testResult = {
        name: 'Quick Email Test',
        timestamp: new Date().toLocaleTimeString(),
        success,
        error: success ? null : 'Email delivery failed',
        helpMessage: success ? 'Check your inbox!' : 'Check console for details',
        details: { recipientEmail }
      };
      
      setTestResults(prev => [testResult, ...prev]);
    } catch (error) {
      const testResult = {
        name: 'Quick Email Test',
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        error: error.message,
        details: null
      };
      
      setTestResults(prev => [testResult, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lender Notification Email Test
        </h1>
        <p className="text-gray-600">
          Test the new lender prospect notification email with PDF attachment functionality
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => runTest(testLenderNotificationWithoutPDF, 'Simple Email Test')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Test Email Only
            </Button>
            
            <Button
              onClick={() => runTest(testLenderProspectNotification, 'Email Notification Test')}
              disabled={isLoading}
              variant="default"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Test Email Notification
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-600">
                {testResults.length} test{testResults.length !== 1 ? 's' : ''} run
              </span>
              <Button onClick={clearResults} variant="ghost" size="sm">
                Clear Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          
          {testResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${
              result.success 
                ? 'border-l-green-500 bg-green-50' 
                : 'border-l-red-500 bg-red-50'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {result.name}
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {result.timestamp}
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                {result.success ? (
                  <Alert className="bg-green-100 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Test completed successfully! Check your email inbox.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Alert className="bg-red-100 border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <div className="font-medium">Error:</div>
                        {result.error}
                      </AlertDescription>
                    </Alert>
                    
                    {result.helpMessage && (
                      <Alert className="bg-amber-100 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <div className="font-medium">Help:</div>
                          {result.helpMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                {result.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Technical Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            What These Tests Do
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <strong>Simple Email Test:</strong> Sends a prospect notification email without additional processing to verify basic email functionality.
          </div>
          <div>
            <strong>Email Notification Test:</strong> Sends a complete prospect notification email with all business details, lender information, and dashboard links.
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <strong className="text-blue-800">Note:</strong> These tests send emails to jamie@comparefunding.io. 
            Make sure your Mailgun API key is configured in your environment variables.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LenderNotificationTest;
