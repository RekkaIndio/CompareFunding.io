
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string | ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TestimonialCard = ({ 
  quote, 
  author, 
  role, 
  company, 
  avatar,
  className,
  style
}: TestimonialCardProps) => {
  return (
    <div 
      className={cn(
        "bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 flex flex-col", 
        className
      )}
      style={style}
    >
      <div className="mb-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.33333 13.3333H4V18.6667H9.33333V24H4V18.6667C4 15.7211 6.38781 13.3333 9.33333 13.3333Z" fill="#0d84ff" fillOpacity="0.2"/>
          <path d="M20 13.3333H14.6667V18.6667H20V24H14.6667V18.6667C14.6667 15.7211 17.0545 13.3333 20 13.3333Z" fill="#0d84ff" fillOpacity="0.2"/>
          <path d="M9.33333 8H4V13.3333H9.33333V8Z" fill="#0d84ff"/>
          <path d="M20 8H14.6667V13.3333H20V8Z" fill="#0d84ff"/>
        </svg>
      </div>
      
      <p className="text-foreground italic mb-6">{quote}</p>
      
      <div className="mt-auto flex items-center">
        {typeof avatar === 'string' ? (
          <img src={avatar} alt={author} className="w-10 h-10 rounded-full mr-3 object-cover" />
        ) : avatar ? (
          <div className="mr-3">{avatar}</div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-fundhub-light-blue text-fundhub-blue flex items-center justify-center mr-3 font-medium">
            {author.charAt(0)}
          </div>
        )}
        
        <div>
          <p className="font-medium text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">
            {role}, {company}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
