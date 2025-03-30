import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, createDocument, deleteDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, ArrowLeft, Check, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// This is a mock implementation - in a real app, this would integrate with actual OAuth flows
const AccountingConnect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState<any>(null);
  const [connectingXero, setConnectingXero] = useState(false);
  const [connectingQuickBooks, setConnectingQuickBooks] = useState(false);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Use Firebase to fetch accounting integration
        const { data, error } = await getDocument('accounting_integrations', user.uid);
          
        if (error) {
          // Not an error if document doesn't exist yet
          console.log('No existing accounting connection found');
          setIsLoading(false);
          return;
        }
        
        if (data) {
          setConnection(data);
        }
      } catch (err) {
        console.error('Error loading accounting connection:', err);
        toast.error('Failed to load accounting integration status');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConnectionStatus();
  }, [user]);

  const connectXero = async () => {
    if (!user) return;
    
    setConnectingXero(true);
    
    try {
      // Simulate an OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would be replaced with an actual OAuth flow in production
      // Mock successful connection
      const connectionData = {
        provider: 'xero',
        auth_status: 'connected',
        access_token: 'mock_token',
        refresh_token: 'mock_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        provider_account_id: `xero_${Math.random().toString(36).substring(7)}`,
        oauth_metadata: {
          organisation_name: 'Your Business Ltd',
          connection_date: new Date().toISOString()
        },
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + 86400000).toISOString(),
        sync_frequency: 'daily',
        user_id: user.uid
      };
      
      // Create or update the integration document in Firestore
      const result = await createDocument('accounting_integrations', connectionData, user.uid);
          
      if (result.error) {
        throw result.error;
      }
      
      // Fetch the updated connection
      const { data: updatedConnection, error: fetchError } = await getDocument('accounting_integrations', user.uid);
        
      if (fetchError) {
        throw fetchError;
      }
      
      setConnection(updatedConnection);
      toast.success('Successfully connected to Xero');
      
    } catch (err: any) {
      console.error('Error connecting to Xero:', err);
      toast.error(err.message || 'Failed to connect to Xero');
    } finally {
      setConnectingXero(false);
    }
  };

  const connectQuickBooks = async () => {
    if (!user) return;
    
    setConnectingQuickBooks(true);
    
    try {
      // Simulate an OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This would be replaced with an actual OAuth flow in production
      // Mock successful connection
      const connectionData = {
        provider: 'quickbooks',
        auth_status: 'connected',
        access_token: 'mock_token',
        refresh_token: 'mock_refresh_token',
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        provider_account_id: `qb_${Math.random().toString(36).substring(7)}`,
        oauth_metadata: {
          company_name: 'Your Business Ltd',
          connection_date: new Date().toISOString()
        },
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + 86400000).toISOString(),
        sync_frequency: 'daily',
        user_id: user.uid
      };
      
      // Create or update the integration document in Firestore
      const result = await createDocument('accounting_integrations', connectionData, user.uid);
          
      if (result.error) {
        throw result.error;
      }
      
      // Fetch the updated connection
      const { data: updatedConnection, error: fetchError } = await getDocument('accounting_integrations', user.uid);
        
      if (fetchError) {
        throw fetchError;
      }
      
      setConnection(updatedConnection);
      toast.success('Successfully connected to QuickBooks');
      
    } catch (err: any) {
      console.error('Error connecting to QuickBooks:', err);
      toast.error(err.message || 'Failed to connect to QuickBooks');
    } finally {
      setConnectingQuickBooks(false);
    }
  };

  const disconnectAccounting = async () => {
    if (!connection || !user) return;
    
    try {
      const { error } = await deleteDocument('accounting_integrations', user.uid);
        
      if (error) {
        throw error;
      }
      
      setConnection(null);
      toast.success('Accounting connection removed successfully');
      
    } catch (err: any) {
      console.error('Error disconnecting accounting:', err);
      toast.error(err.message || 'Failed to disconnect accounting');
    }
  };

  const getFormattedProvider = (provider: string) => {
    return provider === 'xero' ? 'Xero' : 
           provider === 'quickbooks' ? 'QuickBooks' : 
           provider;
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/business/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Accounting Integration</h1>
          <p className="text-muted-foreground mb-8">
            Connect your accounting software to FundHub to improve your application accuracy and approval chances
          </p>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-fundhub-blue" />
            </div>
          ) : connection && connection.auth_status === 'connected' ? (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center">
                  <CheckCircle className="text-green-600 mr-2 h-5 w-5" />
                  <CardTitle>Connected to {getFormattedProvider(connection.provider)}</CardTitle>
                </div>
                <CardDescription>
                  Your accounting data is syncing with FundHub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Connected Account</p>
                      <p className="font-medium">
                        {connection.oauth_metadata?.organisation_name || 
                         connection.oauth_metadata?.company_name || 
                         'Your Business'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Connection Status</p>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        <CheckCircle className="mr-1 h-3 w-3" /> Active
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Synced</p>
                      <p className="font-medium">
                        {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Sync</p>
                      <p className="font-medium">
                        {connection.next_sync_at ? new Date(connection.next_sync_at).toLocaleString() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Financial data ready for applications</AlertTitle>
                    <AlertDescription>
                      Your accounting data will be used to pre-fill some fields when creating loan applications,
                      and to provide lenders with a better understanding of your financial position.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={disconnectAccounting}
                >
                  Disconnect
                </Button>
                <Button
                  className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                  onClick={() => navigate('/applications/new')}
                >
                  Create Application
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Connect Your Accounting Software</CardTitle>
                  <CardDescription>
                    Securely connect your accounting software to enhance your funding applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Why connect your accounting software?</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        Connecting your accounting software allows FundHub to:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Automatically extract key financial data for your applications</li>
                        <li>Improve accuracy of information provided to lenders</li>
                        <li>Increase your chances of approval with verified financial data</li>
                        <li>Save time by avoiding manual data entry</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/en/3/3d/Xero_software_logo.svg" 
                            alt="Xero"
                            className="h-6 mr-2" 
                          />
                          Xero
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your Xero account to import invoices, bank transactions, and financial reports.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90"
                          onClick={connectXero}
                          disabled={connectingXero}
                        >
                          {connectingXero ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect Xero
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e1/QuickBooks_Logo.svg" 
                            alt="QuickBooks"
                            className="h-6 mr-2" 
                          />
                          QuickBooks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your QuickBooks account to import profit & loss statements, balance sheets, and cash flow.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90"
                          onClick={connectQuickBooks}
                          disabled={connectingQuickBooks}
                        >
                          {connectingQuickBooks ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect QuickBooks
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Don't use these accounting platforms?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    You can still create applications without connecting your accounting software,
                    but you'll need to enter your financial information manually.
                  </p>
                  <Button
                    className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                    onClick={() => navigate('/applications/new')}
                  >
                    Continue Without Connecting
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AccountingConnect;
