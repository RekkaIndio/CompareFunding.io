import { ReactNode } from 'react';
import Navbar from './Navbar';
import FooterUpdated from './FooterUpdated';
import Sidebar from './Sidebar';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

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
  const { sidebarWidth } = useSidebar();
  
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
            role={user?.role as 'business' | 'lender'}
          />
        )}

        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            "min-h-[calc(100vh-4rem)]", // Adjust for navbar height
            className
          )}
          style={{
            marginLeft: shouldShowSidebar ? sidebarWidth : '0',
          }}
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
