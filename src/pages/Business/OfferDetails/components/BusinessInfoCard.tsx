import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2, User, MapPin, Globe } from 'lucide-react';
import { displayLenderName } from '../utils';

interface BusinessInfoCardProps {
  offer: any;
  isLender: boolean;
  onOpenLenderProfile: () => void;
}

export const BusinessInfoCard: React.FC<BusinessInfoCardProps> = ({
  offer,
  isLender,
  onOpenLenderProfile
}) => {
  const businessName = offer.business?.business_name || 
    (offer.applications?.business_name || 'Business');

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle className="text-white flex items-center gap-3">
          {isLender ? (
            <>
              <Building2 className="h-5 w-5" />
              Business Information
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              Lender Information
            </>
          )}
        </CardTitle>
        <CardDescription className="text-gray-200">
          About the {isLender ? 'business' : 'lender'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-gray-200">
            <AvatarImage 
              src={isLender ? offer.business?.logo_url : offer.company_logo} 
              alt={`${isLender ? businessName : displayLenderName(offer.lender_name)} logo`}
            />
            <AvatarFallback className="bg-[#212936] text-white text-lg font-semibold">
              {isLender 
                ? businessName.charAt(0).toUpperCase()
                : displayLenderName(offer.lender_name)?.charAt(0).toUpperCase() || 'L'
              }
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#212936]">
              {isLender ? businessName : displayLenderName(offer.lender_name)}
            </h3>
            {isLender ? (
              <p className="text-sm text-gray-600">
                {offer.business?.industry_sector || 'Business'}
              </p>
            ) : (
              <p className="text-sm text-gray-600">Financing Partner</p>
            )}
          </div>
        </div>

        {isLender ? (
          <div className="space-y-3">
            {offer.business?.company_size && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Company Size:</span>
                <span className="font-medium">{offer.business.company_size}</span>
              </div>
            )}
            {offer.business?.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{offer.business.location}</span>
              </div>
            )}
            {offer.business?.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Website:</span>
                <a 
                  href={offer.business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {offer.business.website}
                </a>
              </div>
            )}
            {offer.business?.description && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
                <p className="text-sm text-gray-700">{offer.business.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {displayLenderName(offer.lender_name)} is offering you financing terms for your business funding application.
            </p>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onOpenLenderProfile}
            >
              <User className="mr-2 h-4 w-4" />
              View Lender Profile
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              All lenders on our platform are verified and regulated
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
