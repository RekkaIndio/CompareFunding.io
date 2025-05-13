import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, CreditCard, HelpCircle, LineChart, Link as LinkIcon, User } from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from './Logo';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const NavItem = ({ to, icon, children, active = false }: NavItemProps) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 px-4 py-3 text-lg rounded-lg transition-colors",
      active ? "text-fundhub-orange font-medium" : "text-gray-300 hover:text-fundhub-orange hover:bg-slate-800"
    )}
  >
    <span className="text-fundhub-orange">{icon}</span>
    <span>{children}</span>
  </Link>
);

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <div className={cn("w-64 bg-slate-900 text-white flex flex-col h-full", className)}>
      <div className="p-4">
        <Logo className="h-10" />
      </div>

      <nav className="flex-1 mt-4 space-y-1 px-2">
        <NavItem to="/dashboard" icon={<BookOpen size={22} />}>
          Dashboard
        </NavItem>
        
        <NavItem to="/funding-options" icon={<Briefcase size={22} />}>
          Funding Options
        </NavItem>
        
        <NavItem to="/learn" icon={<BookOpen size={22} />}>
          Learn
        </NavItem>
        
        <NavItem to="/applications" icon={<Briefcase size={22} />}>
          Applications
        </NavItem>
        
        <NavItem to="/credit-score" icon={<LineChart size={22} />}>
          Credit Score
        </NavItem>
        
        <NavItem to="/integrations" icon={<LinkIcon size={22} />}>
          Integrations
        </NavItem>
        
        <NavItem to="/help" icon={<HelpCircle size={22} />}>
          Can We Help?
        </NavItem>
        
        <NavItem to="/account" icon={<User size={22} />}>
          Your Account
        </NavItem>
      </nav>
    </div>
  );
};

export default Sidebar;
