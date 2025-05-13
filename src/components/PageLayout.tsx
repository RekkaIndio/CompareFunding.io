
import { ReactNode } from 'react';
import Navbar from './Navbar';
import FooterUpdated from './FooterUpdated';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  withoutPadding?: boolean;
  showSidebar?: boolean;
}

const PageLayout = ({ 
  children, 
  className, 
  fullWidth = false,
  withoutPadding = false,
  showSidebar = false
}: PageLayoutProps) => {
  const { user } = useAuth();
  
  // Only show sidebar if user is logged in AND showSidebar is true
  const shouldShowSidebar = Boolean(user) && showSidebar;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        {shouldShowSidebar && <Sidebar className="fixed h-screen pt-16" />}
        
        <main className={cn(
          "flex-1", 
          shouldShowSidebar && "ml-64",
          "pt-20", 
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
      </div>
      
      <FooterUpdated className={cn(shouldShowSidebar && "ml-64")} />
    </div>
  );
};

export default PageLayout;
