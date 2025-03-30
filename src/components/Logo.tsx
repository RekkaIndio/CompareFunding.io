import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  type?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  type = 'full',
  size = 'md',
  showTagline = false
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <Link to="/" className={cn("flex items-center", className)}>
      <div className="flex items-center">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-fundhub-blue to-fundhub-blue opacity-40 blur-sm rounded-full" />
          <div className="relative bg-white rounded-full p-1.5">
            <svg 
              width={size === 'sm' ? "18" : size === 'md' ? "24" : "30"} 
              height={size === 'sm' ? "18" : size === 'md' ? "24" : "30"} 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-fundhub-navy"
            >
              <path 
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M12 6V12L16 14" 
                stroke="#0d84ff" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        
        {type === 'full' && (
          <div className="ml-2 font-semibold flex flex-col">
            <span className={cn("text-fundhub-navy", sizeClasses[size])}>
              Compare<span className="text-fundhub-blue">Funding</span>
            </span>
            {showTagline && (
              <span className="text-xs text-muted-foreground -mt-1">Business Funding Made Simple</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default Logo;
