import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "py-3 bg-white/80 backdrop-blur-md shadow-nav" : "py-5 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Logo type="full" size={isScrolled ? "sm" : "md"} showTagline={!isScrolled && !isMobile} />
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "nav-link transition-all duration-300",
                isActive(link.path) ? "nav-link-active" : "",
                isScrolled ? "py-1.5" : "py-2"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Desktop CTA Buttons or User Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
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
          ) : (
            <>
              <Button variant="outline" size={isScrolled ? "sm" : "default"} asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button size={isScrolled ? "sm" : "default"} className="bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col">
            <nav className="flex flex-col space-y-3 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 rounded-md",
                    isActive(link.path) 
                      ? "bg-fundhub-light-blue text-fundhub-blue font-medium" 
                      : "text-fundhub-navy hover:bg-gray-50"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {user ? (
              <div className="flex flex-col gap-2">
                {user.role === 'business' ? (
                  <>
                    <Link to="/business/profile" className="px-4 py-2 rounded-md text-fundhub-navy hover:bg-gray-50">
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/lender/profile" className="px-4 py-2 rounded-md text-fundhub-navy hover:bg-gray-50">
                      Profile
                    </Link>
                  </>
                )}
                
                <Button 
                  variant="outline" 
                  className="justify-start text-red-500" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
