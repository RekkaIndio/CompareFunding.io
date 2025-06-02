import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDocument } from '../services/firebase';
import { cn } from '../lib/utils';

interface ProfileLogoProps {
  role: 'business' | 'lender';
  isCollapsed: boolean;
  className?: string;
}

const ProfileLogo: React.FC<ProfileLogoProps> = ({ role: propRole, isCollapsed, className }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  // Use the user's role from the auth context if available, otherwise use the prop
  const role = user?.role || propRole;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
        // First try the new structure
        const collection = role === 'lender' ? 'lender_profiles' : 'businesses';
        const result = await getDocument(collection, user.uid);
        
        if (result && result.data) {
          setProfile(result.data);
          return;
        }
        
        // Fallback to the old structure if needed
        if (role === 'business') {
          const oldResult = await getDocument('businesses', user.uid);
          if (oldResult && oldResult.data) {
            setProfile(oldResult.data);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
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
