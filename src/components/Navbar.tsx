import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, ChevronDown, User, LogOut, Bell, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbar } from '@/contexts/NavbarContext'; // Add this line
import { useNotifications } from '@/hooks/useNotifications';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import comparefundingUrl from '@/assets/comparefunding.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { isNavbarVisible } = useNavbar(); // Add this line
  const { unreadNotifications, unreadMessages, hasNewOffers, hasNewMessages } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Public nav links shown to all users (not logged in)
  const publicNavLinks = [
    { name: 'For Businesses', path: '/for-businesses' },
    { name: 'For Lenders', path: '/for-lenders' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About Us', path: '/about' },
  ];
  
  // Business role specific nav links
  const businessNavLinks = [
    { name: 'Dashboard', path: '/business/dashboard' },
    { name: 'Applications', path: '/applications' },
    { name: 'Offers', path: '/offers' },
    { name: 'Account', path: '/business/profile' },
  ];
  
  // Lender role specific nav links
  const lenderNavLinks = [
    { name: 'Dashboard', path: '/lender/dashboard' },
    { name: 'Applications', path: '/matched-applications' },
    { name: 'Account', path: '/lender/profile' },
  ];
  
  // Determine which nav links to show based on user role
  const getNavLinks = () => {
    if (!user) return publicNavLinks;
    
    if (user.role === 'business') {
      return businessNavLinks;
    } else if (user.role === 'lender') {
      return lenderNavLinks;
    }
    
    // Fallback to showing public links if role undefined
    return publicNavLinks;
  };
  
  // Get the appropriate profile path based on user role
  const getProfilePath = () => {
    if (!user) return '/';
    
    return user.role === 'lender' ? '/lender/profile' : '/business/profile';
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const navLinks = getNavLinks();

  // Comment out the navbar visibility check to ensure it always shows
  // if (!isNavbarVisible) { 
  //   return null;
  // }

  return (
    <div 
      className="!fixed !top-0 !left-0 !right-0 !z-[9999] w-full h-16"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999,
        width: '100%',
        height: '4rem'
      }}
    >
      <header 
        className={cn(
          "w-full h-full transition-all duration-300 relative overflow-hidden",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white",
          isScrolled && "shadow-lg backdrop-blur-sm"
        )}
      >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-orange-600/5"></div>
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className="w-full flex justify-between items-center px-4 h-full relative z-10"> {/* Added relative z-10 */}
        {/* Logo Section */}
        <Link 
          to={user ? (user.role === 'lender' ? '/lender/dashboard' : '/business/dashboard') : '/'} 
          className="flex items-center space-x-2 group"
        > {/* Removed mr-auto here */}
          <img
            src={cflogowhiteUrl}
            alt="Compare Funding Logo"
            className={cn("transition-all duration-300", isScrolled ? "h-8" : "h-10")}
          />
          <img
            src={comparefundingUrl}
            alt="Compare Funding Text"
            className={cn("transition-all duration-300", isScrolled ? "h-20" : "h-20")}
          />
        </Link>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "nav-link transition-all duration-300 text-white",
                isActive(link.path) ? "nav-link-active" : "",
                isScrolled ? "py-1.5" : "py-2"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Desktop CTA Buttons or User Menu */}
        <div className="hidden md:flex items-center space-x-3 text-white">
          {user ? (
            <>
              {/* Notifications Icon */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10" asChild>
                  <Link to="/notifications">
                    <Bell size={20} />
                  </Link>
                </Button>
                {unreadNotifications > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center p-0"
                  >
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Badge>
                )}
              </div>

              {/* Messages Icon */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10" asChild>
                  <Link to="/messages">
                    <MessageSquare size={20} />
                  </Link>
                </Button>
                {unreadMessages > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center p-0"
                  >
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </div>

              {/* User Account Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={isScrolled ? "sm" : "default"} className="flex items-center gap-2">
                    <User size={16} />
                    My Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.displayName || 'My Account'}</DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {user.role === 'business' ? 'Business Account' : 'Lender Account'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {user.role === 'business' ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/business/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/applications" className="cursor-pointer w-full">Applications</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/offers" className="cursor-pointer w-full">Offers</Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/lender/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/matched-applications" className="cursor-pointer w-full">Applications</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to={getProfilePath()} className="cursor-pointer w-full">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-red-500 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" size={isScrolled ? "sm" : "default"} asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button size={isScrolled ? "sm" : "default"} className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-fundhub-navy" />
          ) : (
            <Menu className="h-6 w-6 text-fundhub-navy" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg animate-slide-down relative overflow-hidden">
          {/* Background Pattern for Mobile Menu */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-orange-600/5"></div>
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
          <div className="container mx-auto px-4 py-4 flex flex-col relative z-10">
            <nav className="flex flex-col space-y-3 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 rounded-md text-white",
                    isActive(link.path) 
                      ? "bg-fundhub-orange text-white font-medium" 
                      : "hover:bg-gray-700"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {user ? (
              <div className="flex flex-col gap-2">
                {/* Notifications and Messages for mobile */}
                <div className="flex gap-2 mb-2">
                  <Link 
                    to="/notifications" 
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-white hover:bg-gray-700 flex-1"
                  >
                    <Bell size={16} />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <Badge className="bg-red-500 text-white text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center p-0 ml-auto">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </Badge>
                    )}
                  </Link>
                  <Link 
                    to="/messages" 
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-white hover:bg-gray-700 flex-1"
                  >
                    <MessageSquare size={16} />
                    <span>Messages</span>
                    {unreadMessages > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs min-w-[1.25rem] h-5 rounded-full flex items-center justify-center p-0 ml-auto">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </div>

                {user.role === 'business' ? (
                  <>
                    <Link to="/business/profile" className="px-4 py-2 rounded-md text-white hover:bg-gray-700">
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/lender/profile" className="px-4 py-2 rounded-md text-white hover:bg-gray-700">
                      Profile
                    </Link>
                  </>
                )}
                
                <Button 
                  variant="outline" 
                  className="justify-start text-red-500 text-white border-white hover:bg-gray-700" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button variant="outline" className="w-full text-white border-white hover:bg-gray-700" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button className="w-full bg-fundhub-orange hover:bg-fundhub-orange/90 text-white" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      </header>
    </div>
  );
};

export default Navbar;
