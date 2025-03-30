import { cn } from '@/lib/utils';

// Updated to include both hyphenated and underscore versions
type StatusType = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'in-review' 
  | 'in_review' 
  | 'processing' 
  | 'completed' 
  | 'draft'
  | 'submitted'
  | 'matched'
  | 'declined'
  | 'negotiating'
  | 'expired'
  | 'withdrawn';

interface StatusBadgeProps {
  status: StatusType | string; // Accept string to handle any status value
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  // Normalize status by replacing underscores with hyphens for consistency
  const normalizedStatus = status?.replace(/_/g, '-');
  
  const statusConfig: Record<string, { label: string, className: string }> = {
    'pending': {
      label: 'Pending',
      className: 'bg-orange-100 text-orange-700'
    },
    'approved': {
      label: 'Approved',
      className: 'bg-green-100 text-green-700'
    },
    'rejected': {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700'
    },
    'in-review': {
      label: 'In Review',
      className: 'bg-blue-100 text-blue-700'
    },
    'processing': {
      label: 'Processing',
      className: 'bg-violet-100 text-violet-700'
    },
    'completed': {
      label: 'Completed',
      className: 'bg-teal-100 text-teal-700'
    },
    'draft': {
      label: 'Draft',
      className: 'bg-gray-100 text-gray-700'
    },
    'submitted': {
      label: 'Submitted',
      className: 'bg-blue-100 text-blue-700'
    },
    'matched': {
      label: 'Matched',
      className: 'bg-purple-100 text-purple-700'
    },
    'declined': {
      label: 'Declined',
      className: 'bg-red-100 text-red-700'
    },
    'negotiating': {
      label: 'Negotiating',
      className: 'bg-indigo-100 text-indigo-700'
    },
    'expired': {
      label: 'Expired',
      className: 'bg-orange-100 text-orange-700'
    },
    'withdrawn': {
      label: 'Withdrawn',
      className: 'bg-gray-100 text-gray-700'
    }
  };

  // Provide fallback for unknown status values
  const { label = status, className: statusClassName = 'bg-gray-100 text-gray-700' } = 
    statusConfig[normalizedStatus] || {};

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", 
      statusClassName,
      className
    )}>
      {label}
    </span>
  );
};

export default StatusBadge;
