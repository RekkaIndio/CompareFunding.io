import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDocument } from '../services/firebase';
import { cn } from '../lib/utils';

interface ProfileLogoProps {
  role: 'business' | 'lender';
  isCollapsed: boolean;
  className?: string;
}

const ProfileLogo: React.FC<ProfileLogoProps> = ({ role, isCollapsed, className }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      const collection = role === 'lender' ? 'lender_profiles' : 'business_profiles';
      const { data, error } = await getDocument(collection, user.uid);
      
      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user, role]);

  if (!profile) {
    return null;
  }

  const logoUrl = profile.logo_url;
  const name = profile.company_name || '';

  return (
    <div className={cn(
      "flex items-center gap-2",
      isCollapsed ? "justify-center" : "",
      className
    )}>
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt={`${name} logo`}
          className={cn(
            "object-contain",
            isCollapsed ? "w-8 h-8" : "w-10 h-10"
          )}
        />
      )}
      {!isCollapsed && name && (
        <span className="text-sm font-medium text-white truncate">
          {name}
        </span>
      )}
    </div>
  );
};

export default ProfileLogo;
