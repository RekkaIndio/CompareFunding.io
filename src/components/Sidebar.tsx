import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Briefcase, MessageSquare, LineChart, BarChart, User, Users, HelpCircle, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import ProfileLogo from './ProfileLogo';

interface SidebarProps {
  className?: string;
  role?: 'business' | 'lender';
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  isCollapsed?: boolean;
}

const NavItem = ({ to, icon, children, active = false, isCollapsed = false }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center rounded-lg transition-colors relative group",
        isCollapsed ? "justify-center py-2 w-full" : "px-4 py-3 gap-3",
        active ? "text-fundhub-orange font-medium" : "text-gray-300 hover:text-fundhub-orange hover:bg-slate-800"
      )}
    >
      <span className={cn("text-fundhub-orange", isCollapsed && "flex justify-center")}>{icon}</span>
      {!isCollapsed && <span className="text-base truncate">{children}</span>}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          {children}
        </div>
      )}
    </Link>
  );
};

//Business menu items 
const businessMenuItems = [
  { to: "/business/dashboard", icon: <BookOpen size={22} />, label: "Dashboard" },
  { to: "/funding-options", icon: <Briefcase size={22} />, label: "Funding Options" },
  { to: "/business/learn", icon: <BookOpen size={22} />, label: "Learn" },
  { to: "/applications", icon: <Briefcase size={22} />, label: "Applications" },
  { to: "/business/documents", icon: <BookOpen size={22} />, label: "Documents" },
  { to: "/credit-score", icon: <LineChart size={22} />, label: "Credit Score" },
  { to: "/integrations", icon: <LinkIcon size={22} />, label: "Integrations" },
  { to: "/help", icon: <HelpCircle size={22} />, label: "Can We Help?" },
  { to: "/account", icon: <User size={22} />, label: "Your Account" },
];

//Lender menu items
const lenderMenuItems = [
  { to: "/lender/dashboard", icon: <BarChart size={22} />, label: "Dashboard" },
  { to: "/lender/applications", icon: <Briefcase size={22} />, label: "Applications" },
  { to: "/lender/messages", icon: <MessageSquare size={22} />, label: "Messages" },
  { to: "/lender/reporting", icon: <LineChart size={22} />, label: "Reporting" },
  { to: "/lender/account", icon: <User size={22} />, label: "Account" },
  { to: "/lender/users", icon: <Users size={22} />, label: "Users" },
];

// //Advisor Menu Items
// const advisorMenuItems = [
//   { to: "/advisor/dashboard", icon: <BookOpen size={22} />, label: "Dashboard" },
//   { to: "/advisor/clients", icon: <Briefcase size={22} />, label: "Clients" },
//   { to: "/advisor/users", icon: <BookOpen size={22} />, label: "Users" },
//   { to: "/advisor/applications", icon: <BookOpen size={22} />, label: "Applications" },
//   { to: "/advisor/help", icon: <HelpCircle size={22} />, label: "Help" },
//   { to: "/advisor/messages", icon: <BookOpen size={22} />, label: "Messages" },
// ]

export const Sidebar: React.FC<SidebarProps> = ({ className, role = 'business' }) => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const menuItems = role === 'lender' ? lenderMenuItems : businessMenuItems;
  const location = useLocation();

  // Hide sidebar during the signup journey
  const isSignUpJourney = location.pathname.startsWith('/signup-journey') && location.pathname !== '/signup-journey/eligibility';
  if (isSignUpJourney) {
    return null;
  }

  // Set the CSS variable for width properly
  useEffect(() => {
    // Update CSS variables to match actual sidebar widths
    document.documentElement.style.setProperty('--sidebar-width', '16rem');
    document.documentElement.style.setProperty('--sidebar-width-collapsed', '3rem');
  }, []);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(true);
  };

  // Check if the current path matches a menu item
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        "bg-[#212936] text-white flex flex-col h-full transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn("flex items-center justify-between", isCollapsed ? "p-1" : "p-4")}>
        <div className={cn("transition-all duration-300 overflow-hidden", isCollapsed ? "w-8" : "w-full")}>
          <ProfileLogo role={role} isCollapsed={isCollapsed} />
        </div>
        {/* Button no longer has onClick, icon reflects hover state */}
        <div className={cn("rounded-lg", isCollapsed ? "p-1" : "p-2")} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {isCollapsed ? (
            <ChevronRight size={16} className="text-gray-300 pointer-events-none" />
          ) : (
            <ChevronLeft size={20} className="text-gray-300 pointer-events-none" />
          )}
        </div>
      </div>

      <nav className={cn("flex-1 mt-4 space-y-4", isCollapsed ? "px-0" : "px-2")}>
        {menuItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            isCollapsed={isCollapsed}
            active={isActive(item.to)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
