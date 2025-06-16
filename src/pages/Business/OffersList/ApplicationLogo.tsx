import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ApplicationLogoProps {
  logoUrl?: string;
  businessName?: string;
}

export const ApplicationLogo: React.FC<ApplicationLogoProps> = ({ logoUrl, businessName }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg p-1.5 shadow-lg flex items-center justify-center">
      {logoUrl && !imageError ? (
        <img 
          src={logoUrl} 
          alt={`${businessName || 'Company'} logo`}
          className="h-12 w-12 object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <Building2 className="h-12 w-12 text-white" />
      )}
    </div>
  );
};
