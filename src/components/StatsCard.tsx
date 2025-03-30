
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: ReactNode;
  className?: string;
}

const StatsCard = ({ title, value, change, isPositive, icon, className }: StatsCardProps) => {
  return (
    <div className={cn(
      "bg-white p-6 rounded-xl shadow-sm border border-gray-100 card-hover-effect", 
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h4 className="text-2xl md:text-3xl font-semibold mt-1">{value}</h4>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                isPositive 
                  ? "text-fundhub-success bg-fundhub-success/10" 
                  : "text-fundhub-danger bg-fundhub-danger/10"
              )}>
                {isPositive ? '↑' : '↓'} {change}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">vs. last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="p-2 rounded-lg bg-fundhub-light-blue">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
