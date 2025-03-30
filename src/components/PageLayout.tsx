
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  withoutPadding?: boolean;
}

const PageLayout = ({ 
  children, 
  className, 
  fullWidth = false,
  withoutPadding = false
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className={cn(
        "flex-1 pt-20", 
        !withoutPadding && "py-8 md:py-12",
        className
      )}>
        {fullWidth ? (
          children
        ) : (
          <div className="container mx-auto px-4">
            {children}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default PageLayout;
