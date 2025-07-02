import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2, BadgeCheck, Mail, Phone, Globe, MessageSquare } from 'lucide-react';
import { getDocument } from '@/firebase';
import { displayLenderName } from '../utils';

interface LenderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  isLender: boolean;
  isAccepted?: boolean;
}

export const LenderProfileModal: React.FC<LenderProfileModalProps> = ({
  isOpen,
  onClose,
  offer,
  isLender,
  isAccepted = false
}) => {
  // Fetch detailed lender profile for modal
  const { data: lenderProfile, isLoading: isLoadingLenderProfile } = useQuery({
    queryKey: ['lenderProfile', offer?.lender_id],
    queryFn: async () => {
      if (!offer?.lender_id) return null;
      
      try {
        // First try to get from lender_profiles collection
        const { data: lenderData } = await getDocument('lender_profiles', offer.lender_id);
        if (lenderData) {
          return {
            ...lenderData,
            source: 'lender_profiles'
          };
        }
        
        // Fallback to users collection
        const { data: userData } = await getDocument('users', offer.lender_id);
        if (userData) {
          return {
            ...userData,
            lender_name: userData.company_name || userData.name || 'Unnamed Lender',
            source: 'users'
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching lender profile:', error);
        return null;
      }
    },
    enabled: !!offer?.lender_id && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-xl flex flex-col">
        <DialogHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl p-4 -m-6 mb-4 flex-shrink-0">
          <DialogTitle className="text-lg font-bold text-white">
            Lender Profile
          </DialogTitle>
          <DialogDescription className="text-gray-200 text-sm">
            Detailed information about {displayLenderName(offer?.lender_name)}
          </DialogDescription>
        </DialogHeader>
        
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 px-1 min-h-0">
          {isLoadingLenderProfile ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#212936]"></div>
            </div>
          ) : lenderProfile ? (
            <div className="space-y-6 py-2">
              {/* Lender Header */}
              <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                      <AvatarImage 
                        src={lenderProfile.logo_url || lenderProfile.company_logo || offer?.company_logo} 
                        alt={`${lenderProfile.lender_name || lenderProfile.company_name} logo`}
                      />
                      <AvatarFallback className="bg-[#212936] text-white text-lg font-bold">
                        {(lenderProfile.lender_name || lenderProfile.company_name || 'L').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#212936] mb-2">
                      {displayLenderName(lenderProfile.lender_name || lenderProfile.company_name)}
                    </h3>
                    {lenderProfile.business_type && (
                      <p className="text-sm text-slate-600 mb-1">{lenderProfile.business_type}</p>
                    )}
                    {lenderProfile.established_year && (
                      <p className="text-xs text-slate-500">Established: {lenderProfile.established_year}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 shadow-sm">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>

            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {lenderProfile.company_size && (
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                      <Building2 className="h-3 w-3 text-white" />
                    </div>
                    Company Size
                  </h4>
                  <p className="text-sm text-slate-600">{lenderProfile.company_size}</p>
                </div>
              )}
              
              {lenderProfile.industry_focus && (
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                      <Building2 className="h-3 w-3 text-white" />
                    </div>
                    Industry Focus
                  </h4>
                  <p className="text-sm text-slate-600">{lenderProfile.industry_focus}</p>
                </div>
              )}

              {(lenderProfile.min_loan_amount || lenderProfile.max_loan_amount) && (
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                    Loan Range
                  </h4>
                  <p className="text-sm text-slate-600">
                    {lenderProfile.min_loan_amount && `£${lenderProfile.min_loan_amount.toLocaleString()}`}
                    {lenderProfile.min_loan_amount && lenderProfile.max_loan_amount && ' - '}
                    {lenderProfile.max_loan_amount && `£${lenderProfile.max_loan_amount.toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>

            {/* Lending Criteria */}
            {lenderProfile.lending_criteria && (
              <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </div>
                  Lending Criteria
                </h4>
                <div className="text-sm text-slate-600">
                  {typeof lenderProfile.lending_criteria === 'string' ? (
                    <p>{lenderProfile.lending_criteria}</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {lenderProfile.lending_criteria.min_loan_amount && (
                        <div className="bg-white p-3 rounded border">
                          <span className="font-medium text-slate-700">Min:</span> 
                          <span className="ml-1">£{lenderProfile.lending_criteria.min_loan_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {lenderProfile.lending_criteria.max_loan_amount && (
                        <div className="bg-white p-3 rounded border">
                          <span className="font-medium text-slate-700">Max:</span> 
                          <span className="ml-1">£{lenderProfile.lending_criteria.max_loan_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {lenderProfile.lending_criteria.interest_rate_range && (
                        <div className="bg-white p-3 rounded border">
                          <span className="font-medium text-slate-700">Rate:</span> 
                          <span className="ml-1">{
                            typeof lenderProfile.lending_criteria.interest_rate_range === 'string' 
                              ? lenderProfile.lending_criteria.interest_rate_range
                              : `${lenderProfile.lending_criteria.interest_rate_range.min}%-${lenderProfile.lending_criteria.interest_rate_range.max}%`
                          }</span>
                        </div>
                      )}
                      {lenderProfile.lending_criteria.funding_speed_days && (
                        <div className="bg-white p-3 rounded border">
                          <span className="font-medium text-slate-700">Speed:</span> 
                          <span className="ml-1">{lenderProfile.lending_criteria.funding_speed_days}d</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(lenderProfile.contact_email || lenderProfile.phone || lenderProfile.website) && (
              <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                    <Mail className="h-3 w-3 text-white" />
                  </div>
                  Contact Information
                </h4>
                <div className="inline-flex flex-wrap gap-3">
                  {lenderProfile.contact_email && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded border">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span className="text-sm text-slate-600">{lenderProfile.contact_email}</span>
                    </div>
                  )}
                  {lenderProfile.phone && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded border">
                      <Phone className="h-3 w-3 text-slate-500" />
                      <span className="text-sm text-slate-600">{lenderProfile.phone}</span>
                    </div>
                  )}
                  {lenderProfile.website && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded border">
                      <Globe className="h-3 w-3 text-slate-500" />
                      <a 
                        href={lenderProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {lenderProfile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specializations */}
            {lenderProfile.specializations && lenderProfile.specializations.length > 0 && (
              <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </div>
                  Specializations
                </h4>
                <div className="bg-white p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {lenderProfile.specializations.map((spec: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-slate-50 hover:bg-slate-100 transition-colors">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Company Description */}
            {lenderProfile.company_description && (
              <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  About
                </h4>
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {lenderProfile.company_description}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-md">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">No detailed profile information available for this lender.</p>
              <p className="text-xs text-slate-500">
                Basic information about {displayLenderName(offer?.lender_name)} is available in the offer details.
              </p>
            </div>
          </div>
        )}
        </div>
        
        <DialogFooter className="bg-slate-50 p-4 -m-6 mt-4 rounded-b-xl border-t border-slate-200 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="hover:bg-slate-100 transition-colors text-white bg-slate-700 border-slate-700 hover:bg-slate-800"
          >
            Close
          </Button>
          {!isLender && lenderProfile && isAccepted && (
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => {
                onClose();
                // Scroll to messaging section
                const messagingElement = document.querySelector('[data-messaging="true"]');
                if (messagingElement) {
                  messagingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Lender
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
