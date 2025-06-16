import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import type { BusinessProfile } from '../types';

interface DashboardHeaderProps {
  businessProfile: BusinessProfile | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ businessProfile }) => {
  const { user } = useAuth();
  
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Welcome back{businessProfile?.company_name ? `, ${businessProfile.company_name}` : ''}
            </h1>
            <p className="text-slate-600 mt-1">Manage your funding applications and grow your business</p>
          </div>
          <div className="flex items-center gap-4" data-tour="profile-section">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-700">Online</span>
              </div>
            </div>
            <Avatar className="h-12 w-12 ring-2 ring-[#ff8800]/20">
              <AvatarImage src={businessProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] text-white font-semibold text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};
