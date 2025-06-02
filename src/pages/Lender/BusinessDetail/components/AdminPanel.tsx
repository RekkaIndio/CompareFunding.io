import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';
import { MigrationStatus } from '../types';

interface AdminPanelProps {
  migrationStatus: MigrationStatus;
  handleDataMigration: () => Promise<void>;
  businessId: string | undefined;
  queryClient: QueryClient;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  migrationStatus,
  handleDataMigration,
  businessId,
  queryClient
}) => {
  return (
    <div className="container mt-8 mb-12">
      <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl">
        <CardHeader className="bg-purple-800 text-white rounded-t-xl border-b-2 border-purple-500">
          <CardTitle className="text-white text-lg flex items-center">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded mr-3">ADMIN</span>
            Data Migration and Debugging Tools
          </CardTitle>
          <CardDescription className="text-purple-100">
            These tools help consolidate data across collections and fix inconsistencies.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-semibold mb-2">Data Migration</h3>
              <p className="text-sm text-slate-600 mb-4">
                Consolidate data from multiple collections into the canonical data structure
                (credit_info in businesses collection and financials in a subcollection).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDataMigration}
                  disabled={migrationStatus.isRunning}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  {migrationStatus.isRunning ? 'Migrating...' : 'Run Data Migration'}
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['businessDetail', businessId] });
                    queryClient.invalidateQueries({ queryKey: ['businessFinancials'] });
                    toast.info('Refreshing all business data...');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Refresh Data
                </Button>
              </div>
              
              {/* Migration status */}
              {migrationStatus.results && (
                <div className="mt-4 p-4 bg-slate-50 rounded border text-xs font-mono overflow-auto max-h-60">
                  <div className={`mb-2 font-bold ${migrationStatus.results.success ? 'text-green-600' : 'text-amber-600'}`}>
                    {migrationStatus.results.success ? 'Success: ' : 'Warning: '}
                    {migrationStatus.results.message}
                  </div>
                  
                  {migrationStatus.results.sourceFound && migrationStatus.results.sourceFound.length > 0 && (
                    <div className="mb-2">
                      <span className="font-semibold">Sources found:</span> {migrationStatus.results.sourceFound.join(', ')}
                    </div>
                  )}
                  
                  {migrationStatus.results.dataMigrated && migrationStatus.results.dataMigrated.length > 0 && (
                    <div className="mb-2">
                      <span className="font-semibold">Data migrated:</span> {migrationStatus.results.dataMigrated.join(', ')}
                    </div>
                  )}
                  
                  {migrationStatus.results.errors && migrationStatus.results.errors.length > 0 && (
                    <div>
                      <span className="font-semibold text-red-600">Errors:</span>
                      <ul className="list-disc pl-4 text-red-500">
                        {migrationStatus.results.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {migrationStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <div className="font-bold">Error:</div>
                  <div>{migrationStatus.error}</div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-md font-semibold mb-2">Data Locations</h3>
              <p className="text-sm text-slate-600 mb-4">
                This shows where different data was found for this business.
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="font-semibold mb-1">Business Profile</div>
                  <div className="text-slate-700">
                    Location: {businessId ? `businesses/${businessId}` : 'Unknown'}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded border">
                  <div className="font-semibold mb-1">Credit Score</div>
                  <div className="text-slate-700">
                    Primary: businesses/{businessId}/credit_info<br/>
                    Fallback: credit_scores/{businessId}
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded border col-span-2">
                  <div className="font-semibold mb-1">Financial Documents</div>
                  <div className="text-slate-700">
                    Primary: businesses/{businessId}/financials<br/>
                    Fallbacks: business_financials, financial_documents
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
