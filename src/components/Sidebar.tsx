import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Briefcase, MessageSquare, LineChart, BarChart, User, Users, HelpCircle, Link as LinkIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, DollarSign, Building, Shield, Globe, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import ProfileLogo from './ProfileLogo';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

interface SidebarProps {
  className?: string;
  role?: 'business' | 'lender';
}

interface SubMenuItem {
  to: string;
  label: string;
}

interface MenuItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  subItems?: SubMenuItem[];
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  isCollapsed?: boolean;
  subItems?: SubMenuItem[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

const NavItem = ({ to, icon, children, active = false, isCollapsed = false, subItems, isExpanded = false, onToggle }: NavItemProps) => {
  const hasSubItems = subItems && subItems.length > 0;
  
  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems && !isCollapsed) {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div>
      <Link
        to={hasSubItems ? "#" : to}
        onClick={handleClick}
        className={cn(
          "flex items-center rounded-lg transition-colors relative group",
          isCollapsed ? "justify-center py-2 w-full" : "px-4 py-3 gap-3",
          active ? "text-fundhub-orange font-medium" : "text-gray-300 hover:text-fundhub-orange hover:bg-slate-800"
        )}
      >
        <span className={cn("text-fundhub-orange", isCollapsed && "flex justify-center")}>{icon}</span>
        {!isCollapsed && <span className="text-base truncate flex-1">{children}</span>}
        {!isCollapsed && hasSubItems && (
          <span className="text-gray-300">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {children}
          </div>
        )}
      </Link>
      
      {/* Sub-items */}
      {!isCollapsed && hasSubItems && isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {subItems.map((subItem) => (
            <Link
              key={subItem.to}
              to={subItem.to}
              className="block px-4 py-2 text-sm text-gray-400 hover:text-fundhub-orange transition-colors"
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

//Business menu items 
const businessMenuItems: MenuItem[] = [
  { to: "/business/dashboard", icon: <BookOpen size={22} />, label: "Dashboard" },
  { 
    to: "/funding-options", 
    icon: <Briefcase size={22} />, 
    label: "Funding Options",
    subItems: [
      { to: "/funding-options/cashflow", label: "Cashflow" },
      { to: "/funding-options/asset-finance", label: "Asset Finance" },
    ]
  },
  { to: "/business/learn", icon: <BookOpen size={22} />, label: "Learn" },
  { 
    to: "/applications", 
    icon: <Briefcase size={22} />, 
    label: "Applications",
    subItems: [
      { to: "/applications/current", label: "Current applications" },
      { to: "/applications/messages", label: "Messages" },
    ]
  },
  { to: "/business/documents", icon: <FileText size={22} />, label: "Documents" },
  { to: "/credit-score", icon: <LineChart size={22} />, label: "Credit Score" },
  { 
    to: "/integrations", 
    icon: <LinkIcon size={22} />, 
    label: "Integrations",
    subItems: [
      { to: "/integrations/accounting", label: "Accounting" },
      { to: "/integrations/banking", label: "Banking" },
      { to: "/integrations/hmrc", label: "HMRC" },
    ]
  },
  { 
    to: "/help", 
    icon: <HelpCircle size={22} />, 
    label: "How else can we help you?",
    subItems: [
      { to: "/help/business-insurance", label: "Business Insurance" },
      { to: "/help/foreign-exchange", label: "Foreign Exchange" },
      { to: "/help/raising-equity", label: "Raising Equity" },
    ]
  },
  { 
    to: "/account", 
    icon: <User size={22} />, 
    label: "Your Account",
    subItems: [
      { to: "/account/business-details", label: "Business Details" },
      { to: "/account/current-lending", label: "Current Lending" },
      { to: "/account/hmrc-status", label: "HMRC Status" },
      { to: "/account/document-upload", label: "Document Upload" },
      { to: "/account/users", label: "Users" },
      { to: "/account/advisor", label: "Advisor" },
    ]
  },
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

export const Sidebar: React.FC<SidebarProps> = ({ className, role: propRole }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed, setSidebarWidth } = useSidebar();
  
  // Use the user's role from the auth context if available, otherwise use the prop (fallback)
  const role = user?.role || propRole || 'business';
  console.log("Current user:", user);
  console.log("Sidebar using role:", role);
  const menuItems = role === 'lender' ? lenderMenuItems : businessMenuItems;
  const location = useLocation();

  // Hide sidebar during the signup journey
  const isSignUpJourney = location.pathname.startsWith('/signup-journey') && location.pathname !== '/signup-journey/eligibility';
  if (isSignUpJourney) {
    return null;
  }

  // Update sidebar width when collapsed state changes
  useEffect(() => {
    const collapsedWidth = '3rem';
    const expandedWidth = '16rem';
    setSidebarWidth(isCollapsed ? collapsedWidth : expandedWidth);
  }, [isCollapsed, setSidebarWidth]);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(true);
  };

  const toggleExpanded = (itemTo: string) => {
    setExpandedItems(prev => {
      const newSet = new Set<string>();
      // If the clicked item is already open, close it
      if (prev.has(itemTo)) {
        // Return empty set - close all items
        return newSet;
      } else {
        // Close all other items and only open the clicked one
        newSet.add(itemTo);
        return newSet;
      }
    });
  };

  // Check if the current path matches a menu item or its sub-items
  const isActive = (item: MenuItem) => {
    if (location.pathname.startsWith(item.to)) {
      return true;
    }
    // Check sub-items
    if (item.subItems) {
      return item.subItems.some(subItem => location.pathname.startsWith(subItem.to));
    }
    return false;
  };

  return (
    <div
      className={cn(
        "bg-[#212936] text-white flex flex-col fixed left-0 z-40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: '64px', // Move down to account for navbar height (16 tailwind units = 64px)
        height: 'calc(100vh - 64px)', // Adjust height to account for navbar
        overflowY: 'auto'
      }}
    >
      <div className={cn("flex items-center justify-between pt-2", isCollapsed ? "p-1" : "p-4")}>
        <div className={cn("transition-all duration-300 overflow-hidden", isCollapsed ? "w-8" : "w-full")}>
          <ProfileLogo role={role} isCollapsed={isCollapsed} />
        </div>
        <div className={cn("rounded-lg", isCollapsed ? "p-1" : "p-2")} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {isCollapsed ? (
            <ChevronRight size={16} className="text-gray-300 pointer-events-none" />
          ) : (
            <ChevronLeft size={20} className="text-gray-300 pointer-events-none" />
          )}
        </div>
      </div>

      <nav className={cn("flex-1 mt-4 space-y-2 overflow-y-auto", isCollapsed ? "px-0" : "px-2")}>
        {menuItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            isCollapsed={isCollapsed}
            active={isActive(item)}
            subItems={item.subItems}
            isExpanded={expandedItems.has(item.to)}
            onToggle={() => toggleExpanded(item.to)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
