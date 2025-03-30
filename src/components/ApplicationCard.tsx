import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Clock, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Updated to include all possible status values
export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'matching' 
  | 'matched' 
  | 'in_review' 
  | 'in-review'
  | 'pending' 
  | 'processing' 
  | 'reviewing'
  | 'approved' 
  | 'funded' 
  | 'rejected' 
  | 'cancelled' 
  | 'expired'
  | 'completed' 
  | 'declined' 
  | 'withdrawn';

interface ApplicationCardProps {
  id: string;
  amount: number;
  purpose: string;
  status: string;
  dateApplied: string;
  term?: string;
  offersCount?: number;
  className?: string;
  business_name?: string;
  logo_url?: string;
}

const ApplicationCard = ({ 
  id, 
  amount, 
  purpose, 
  status, 
  dateApplied,
  term,
  offersCount = 0,
  className,
  business_name,
  logo_url
}: ApplicationCardProps) => {
  const navigate = useNavigate();
  
  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return (
    <div className={cn(
      "bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md",
      className
    )} onClick={() => navigate(`/applications/${id}`)}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          {logo_url ? (
            <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
              <img 
                src={logo_url} 
                alt={`${business_name || 'Company'} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Application #{id.slice(0, 8)}</p>
            <h3 className="text-xl font-semibold mt-1">{formattedAmount}</h3>
            <p className="text-sm text-muted-foreground mt-1">{purpose}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
          <span>Applied: {dateApplied}</span>
        </div>
        {term && (
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 text-muted-foreground mr-2" />
            <span>Term: {term}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        {offersCount > 0 ? (
          <Badge variant="outline" className="bg-fundhub-light-blue text-fundhub-blue border-0">
            {offersCount} {offersCount === 1 ? 'offer' : 'offers'} received
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">No offers yet</span>
        )}
        
        <Button variant="ghost" size="sm" className="text-fundhub-blue" asChild>
          <Link to={`/applications/${id}`}>
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ApplicationCard;
