import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApplicationCard from './ApplicationCard';

interface ApplicationsListProps {
  isLoading: boolean;
  sanitizedApplications: any[];
  searchQuery: string;
  statusFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  navigate: (path: string) => void;
  handleExpressInterest: (app: any) => void;
  handleStartConversation: (app: any) => void;
  user: any;
  isApplicationDeclined: (app: any) => boolean;
  canSeeBusinessDetails: (app: any) => boolean; 
  getCreditScoreRisk: (score: number | string) => string;
  isLenderMatched: (app: any) => boolean;
}

const ApplicationsList: React.FC<ApplicationsListProps> = ({
  isLoading,
  sanitizedApplications,
  searchQuery,
  statusFilter,
  setSearchQuery,
  setStatusFilter,
  navigate,
  handleExpressInterest,
  handleStartConversation,
  user,
  isApplicationDeclined,
  canSeeBusinessDetails,
  getCreditScoreRisk,
  isLenderMatched
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-28 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }
  
  if (sanitizedApplications && sanitizedApplications.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {sanitizedApplications.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            user={user}
            isApplicationDeclined={isApplicationDeclined}
            canSeeBusinessDetails={canSeeBusinessDetails}
            handleExpressInterest={handleExpressInterest}
            navigate={navigate}
            handleStartConversation={handleStartConversation}
            isLenderMatched={isLenderMatched}
            getCreditScoreRisk={getCreditScoreRisk}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/50 shadow-lg">
      <div className="bg-[#212936] w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
        <Filter className="h-10 w-10 text-[#ff8000]" />
      </div>
      <h3 className="font-semibold text-xl text-[#212936] mb-3">No matching applications found</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        {searchQuery || statusFilter !== 'all' ? 
          'Try adjusting your search or filters to see more applications.' : 
          'Applications matching your lending criteria will appear here.'}
      </p>
      {(searchQuery || statusFilter !== 'all') && (
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
          className="border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white transition-colors shadow-sm"
        >
          <Filter className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default ApplicationsList;
