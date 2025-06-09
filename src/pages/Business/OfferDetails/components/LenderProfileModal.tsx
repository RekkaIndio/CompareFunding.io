import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2, BadgeCheck, Mail, Phone, Globe, MessageSquare } from 'lucide-react';
import { getDocument } from '@/firebase';

interface LenderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  isLender: boolean;
}

export const LenderProfileModal: React.FC<LenderProfileModalProps> = ({
  isOpen,
  onClose,
  offer,
  isLender
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#212936]">
            Lender Profile
          </DialogTitle>
          <DialogDescription>
            Detailed information about {offer?.lender_name || 'this lender'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingLenderProfile ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#212936]"></div>
          </div>
        ) : lenderProfile ? (
          <div className="space-y-6">
            {/* Lender Header */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border">
              <div className="flex-shrink-0">
                <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                  <AvatarImage 
                    src={lenderProfile.logo_url || lenderProfile.company_logo || offer?.company_logo} 
                    alt={`${lenderProfile.lender_name || lenderProfile.company_name} logo`}
                  />
                  <AvatarFallback className="bg-[#212936] text-white">
                    {(lenderProfile.lender_name || lenderProfile.company_name || 'L').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#212936]">
                  {lenderProfile.lender_name || lenderProfile.company_name || 'Unnamed Lender'}
                </h3>
                {lenderProfile.business_type && (
                  <p className="text-sm text-gray-600">{lenderProfile.business_type}</p>
                )}
                {lenderProfile.established_year && (
                  <p className="text-sm text-gray-500">Established: {lenderProfile.established_year}</p>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <BadgeCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lenderProfile.company_size && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-2">Company Size</h4>
                  <p className="text-sm text-slate-600">{lenderProfile.company_size}</p>
                </div>
              )}
              
              {lenderProfile.industry_focus && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-2">Industry Focus</h4>
                  <p className="text-sm text-slate-600">{lenderProfile.industry_focus}</p>
                </div>
              )}

              {lenderProfile.lending_criteria && (
                <div className="bg-white p-4 rounded-lg border md:col-span-2">
                  <h4 className="font-medium text-slate-900 mb-2">Lending Criteria</h4>
                  <div className="text-sm text-slate-600 space-y-2">
                    {typeof lenderProfile.lending_criteria === 'string' ? (
                      <p>{lenderProfile.lending_criteria}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lenderProfile.lending_criteria.min_loan_amount && (
                          <div>
                            <span className="font-medium">Min Loan:</span> £{lenderProfile.lending_criteria.min_loan_amount.toLocaleString()}
                          </div>
                        )}
                        {lenderProfile.lending_criteria.max_loan_amount && (
                          <div>
                            <span className="font-medium">Max Loan:</span> £{lenderProfile.lending_criteria.max_loan_amount.toLocaleString()}
                          </div>
                        )}
                        {lenderProfile.lending_criteria.min_annual_revenue && (
                          <div>
                            <span className="font-medium">Min Annual Revenue:</span> £{lenderProfile.lending_criteria.min_annual_revenue.toLocaleString()}
                          </div>
                        )}
                        {lenderProfile.lending_criteria.min_business_age_months && (
                          <div>
                            <span className="font-medium">Min Business Age:</span> {lenderProfile.lending_criteria.min_business_age_months} months
                          </div>
                        )}
                        {lenderProfile.lending_criteria.funding_speed_days && (
                          <div>
                            <span className="font-medium">Funding Speed:</span> {lenderProfile.lending_criteria.funding_speed_days} days
                          </div>
                        )}
                        {lenderProfile.lending_criteria.interest_rate_range && (
                          <div>
                            <span className="font-medium">Interest Rate:</span> {
                              typeof lenderProfile.lending_criteria.interest_rate_range === 'string' 
                                ? lenderProfile.lending_criteria.interest_rate_range
                                : `${lenderProfile.lending_criteria.interest_rate_range.min}% - ${lenderProfile.lending_criteria.interest_rate_range.max}%`
                            }
                          </div>
                        )}
                        {lenderProfile.lending_criteria.preferred_industries && Array.isArray(lenderProfile.lending_criteria.preferred_industries) && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Preferred Industries:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lenderProfile.lending_criteria.preferred_industries.map((industry: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {industry}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {lenderProfile.lending_criteria.funding_types && Array.isArray(lenderProfile.lending_criteria.funding_types) && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Funding Types:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lenderProfile.lending_criteria.funding_types.map((type: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(lenderProfile.min_loan_amount || lenderProfile.max_loan_amount) && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-2">Loan Range</h4>
                  <p className="text-sm text-slate-600">
                    {lenderProfile.min_loan_amount && `£${lenderProfile.min_loan_amount.toLocaleString()}`}
                    {lenderProfile.min_loan_amount && lenderProfile.max_loan_amount && ' - '}
                    {lenderProfile.max_loan_amount && `£${lenderProfile.max_loan_amount.toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {(lenderProfile.contact_email || lenderProfile.phone || lenderProfile.website) && (
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-medium text-slate-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  {lenderProfile.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">{lenderProfile.contact_email}</span>
                    </div>
                  )}
                  {lenderProfile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600">{lenderProfile.phone}</span>
                    </div>
                  )}
                  {lenderProfile.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <a 
                        href={lenderProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {lenderProfile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Description */}
            {lenderProfile.company_description && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-slate-900 mb-2">About</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {lenderProfile.company_description}
                </p>
              </div>
            )}

            {/* Specializations */}
            {lenderProfile.specializations && lenderProfile.specializations.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-slate-900 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {lenderProfile.specializations.map((spec: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No detailed profile information available for this lender.</p>
            <p className="text-sm text-slate-500 mt-1">
              Basic information about {offer?.lender_name || 'this lender'} is available in the offer details.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
          {!isLender && lenderProfile && (
            <Button 
              className="bg-[#212936] hover:bg-[#212936]/90"
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
