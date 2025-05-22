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
  hideNavbar?: boolean; // Added prop to control navbar visibility
}

const PageLayout = ({ 
  children, 
  className, 
  fullWidth = true,
  withoutPadding = false,
  showSidebar = false
}: PageLayoutProps) => {
  const { user } = useAuth();
  // Always show sidebar for logged-in users by default, unless explicitly set to false
  const shouldShowSidebar = Boolean(user); // We'll show sidebar by default for logged-in users
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Keep the navbar above everything with higher z-index */}
      <Navbar />

      <div className="flex flex-1 mt-16"> {/* Added mt-16 to create space for the navbar */}
        {/* Render sidebar if user is logged in */}
        {shouldShowSidebar && (
          <Sidebar 
            className="sticky left-0 top-16 h-[calc(100vh-4rem)] z-40" 
            role={user?.role as 'business' | 'lender'}
          />
        )}

        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            // Only add margin if sidebar is visible
            shouldShowSidebar ? "ml-[3rem]" : "",
            "min-h-[calc(100vh-4rem)]", // Adjust for navbar height
            className
          )}
          style={{ width: '100vw', maxWidth: '100vw' }}
        >
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>

      <FooterUpdated />
    </div>
  );
};

export default PageLayout;
