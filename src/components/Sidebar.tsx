import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Briefcase, MessageSquare, LineChart, BarChart, User, Users, HelpCircle, Link as LinkIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FileText, PoundSterling, Building, Shield, Globe, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import ProfileLogo from './ProfileLogo';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { getDocument } from '../services/firebase';

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
  dataTour?: string;
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
  dataTour?: string;
  location: ReturnType<typeof useLocation>;
}

const NavItem = ({ to, icon, children, active = false, isCollapsed = false, subItems, isExpanded = false, onToggle, dataTour, location }: NavItemProps) => {
  const hasSubItems = subItems && subItems.length > 0;
  
  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems && !isCollapsed) {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div data-tour={dataTour}>
      <Link
        to={hasSubItems ? "#" : to}
        onClick={handleClick}
        className={cn(
          "flex items-center rounded-lg transition-colors relative group",
          isCollapsed ? "justify-center py-2 w-full" : "px-4 py-3 gap-3",
          active 
            ? "font-medium bg-fundhub-orange/10 border-l-4 border-fundhub-orange" 
            : "text-gray-300 hover:text-fundhub-orange hover:bg-slate-800/30"
        )}
        style={active ? { color: '#ff8000' } : {}}
      >
        <span className={cn(
          active ? "" : "text-gray-400", 
          isCollapsed && "flex justify-center"
        )} style={active ? { color: '#ff8000' } : {}}>{icon}</span>
        {!isCollapsed && <span className={cn("text-base truncate flex-1")} style={active ? { color: '#ff8000' } : { color: '#d1d5db' }}>{children}</span>}
        {!isCollapsed && hasSubItems && (
          <span className={cn(active ? "" : "text-gray-300")} style={active ? { color: '#ff8000' } : {}}>
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
          {subItems.map((subItem) => {
            const isSubItemActive = location.pathname.startsWith(subItem.to);
            return (
              <Link
                key={subItem.to}
                to={subItem.to}
                className={cn(
                  "block px-4 py-2 text-sm transition-colors rounded-md",
                  isSubItemActive 
                    ? "font-medium bg-slate-800/30" 
                    : "text-gray-400 hover:text-fundhub-orange"
                )}
                style={isSubItemActive ? { color: '#ff8000' } : {}}
              >
                {subItem.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

//Business menu items 
const businessMenuItems: MenuItem[] = [
  { to: "/business/dashboard", icon: <BookOpen size={22} />, label: "Dashboard", dataTour: "sidebar-dashboard" },
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
    dataTour: "sidebar-applications",
    subItems: [
      { to: "/applications", label: "Current applications" },
    ]
  },
  { to: "/business/documents", icon: <FileText size={22} />, label: "Documents", dataTour: "sidebar-documents" },
  { to: "/messages", icon: <MessageSquare size={22} />, label: "Messages", dataTour: "sidebar-messages" },
  { to: "/credit-score", icon: <LineChart size={22} />, label: "Credit Score", dataTour: "sidebar-credit-score" },
  { 
    to: "/integrations", 
    icon: <LinkIcon size={22} />, 
    label: "Integrations",
    subItems: [
      { to: "/integrations/accounting", label: "Accounting" },
      { to: "/integrations/banking", label: "Banking" },
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
    to: "/business/profile", 
    icon: <User size={22} />, 
    label: "Your Account",
    dataTour: "sidebar-business-profile",
    subItems: [
      { to: "/account/business-details", label: "Business Details" },
      { to: "/account/current-lending", label: "Current Lending" },
      { to: "/account/users", label: "Users" },
      { to: "/account/advisor", label: "Advisor" },
    ]
  },
];

//Lender menu items
const lenderMenuItems = [
  { to: "/lender/dashboard", icon: <BarChart size={22} />, label: "Dashboard" },
  { to: "/lender/applications", icon: <Briefcase size={22} />, label: "Applications" },
  { to: "/messages", icon: <MessageSquare size={22} />, label: "Messages" },
  { to: "/lender/billing", icon: <PoundSterling size={22} />, label: "Billing" },
  { to: "/lender/reporting", icon: <LineChart size={22} />, label: "Reporting" },
  { to: "/lender/profile", icon: <User size={22} />, label: "Account" },
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
  const [businessName, setBusinessName] = useState<string>('');
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed, setSidebarWidth } = useSidebar();
  
  // Use the user's role from the auth context if available, otherwise use the prop (fallback)
  const role = user?.role || propRole || 'business';
  console.log("Current user:", user);
  console.log("Sidebar using role:", role);
  const menuItems = role === 'lender' ? lenderMenuItems : businessMenuItems;

  // Hide sidebar during the signup journey (including eligibility page)
  const location = useLocation();
  const isSignUpJourney = location.pathname.startsWith('/signup-journey');
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
        "bg-slate-900 text-white flex flex-col fixed left-0 z-40 transition-all duration-300 ease-in-out relative overflow-hidden",
        isCollapsed ? "w-12" : "w-64",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto'
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      <div className={cn(
        "flex items-center justify-between pt-2 relative z-10",
        isCollapsed ? "p-1" : "p-4"
      )}>
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          isCollapsed ? "w-8" : "w-full"
        )}>
          <div className="flex-shrink-0">
            <ProfileLogo role={role === 'business_owner' ? 'business' : role} isCollapsed={isCollapsed} />
          </div>
          {!isCollapsed && businessName && (
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {businessName}
              </p>
            </div>
          )}
        </div>
        <button 
          className={cn("rounded-lg", isCollapsed ? "p-1" : "p-2")}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight size={16} className="text-gray-300" />
          ) : (
            <ChevronLeft size={20} className="text-gray-300" />
          )}
        </button>
      </div>

      <nav className={cn("flex-1 mt-4 space-y-2 overflow-y-auto relative z-10", isCollapsed ? "px-0" : "px-2")}>
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
            dataTour={item.dataTour}
            location={location}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
