
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  date: string;
  rating: number;
  source: string;
  avatar?: string | ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TestimonialCard = ({ 
  quote, 
  author, 
  date,
  rating,
  source,
  avatar,
  className,
  style
}: TestimonialCardProps) => {
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    // Render filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      );
    }
    
    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half-star" className="relative">
          <Star className="h-5 w-5 text-yellow-400" />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }
    
    // Add empty stars to make it 5 total
    const emptyStarsCount = 5 - stars.length;
    for (let i = 0; i < emptyStarsCount; i++) {
      stars.push(
        <Star key={`empty-star-${i}`} className="h-5 w-5 text-yellow-400" />
      );
    }
    
    return stars;
  };
  
  const renderSourceIcon = () => {
    if (source === "trustpilot") {
      return (
        <div className="flex items-center justify-center text-xs text-white bg-green-600 h-5 w-5 rounded-full">T</div>
      );
    } else if (source === "google") {
      return (
        <div className="flex items-center justify-center text-xs text-white bg-blue-500 h-5 w-5 rounded-full">G</div>
      );
    }
    return null;
  };
  
  return (
    <div 
      className={cn(
        "bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-gray-200 transition-all duration-300 flex flex-col h-full", 
        className
      )}
      style={style}
    >
      <div className="mb-3 sm:mb-4 flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center mr-2 sm:mr-3 overflow-hidden">
          {avatar || (
            <img 
              src={`https://i.pravatar.cc/40?u=${author}`} 
              alt={author} 
              className="w-full h-full object-cover" 
            />
          )}
        </div>
        
        <div>
          <p className="font-medium text-xs sm:text-sm">{author}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      
      <p className="text-xs sm:text-sm text-foreground mb-3 sm:mb-4 line-clamp-6">{quote}</p>
      
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex">
            {renderStars()}
          </div>
          <span className="ml-1 sm:ml-2 text-xs sm:text-sm">{rating}/5</span>
        </div>
        
        {renderSourceIcon()}
      </div>
    </div>
  );
};

export default TestimonialCard;
