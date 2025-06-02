import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { formatAddress } from '@/lib/formatters';

interface BusinessProfileCardProps {
  application: any;
}

const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({ application }) => {
  if (!application) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Building2 className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Business Profile</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Company details and registration information
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {application?.business ? (
          <div className="space-y-4">
            <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
              <h3 className="font-semibold text-[#212936] text-lg mb-1">{application.business.business_name || application.business.name || 'Unnamed Business'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                {application.business.website && (
                  <div><span className="font-medium">Website:</span> <a href={application.business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{application.business.website}</a></div>
                )}
                {application.business.company_number && (
                  <div><span className="font-medium">Company Number:</span> {application.business.company_number}</div>
                )}
                {application.business.industry && (
                  <div><span className="font-medium">Industry:</span> {application.business.industry}</div>
                )}
                {application.business.company_size && (
                  <div><span className="font-medium">Size:</span> {application.business.company_size}</div>
                )}
                {application.business.business_email && (
                  <div><span className="font-medium">Email:</span> {application.business.business_email}</div>
                )}
                {application.business.business_phone && (
                  <div><span className="font-medium">Phone:</span> {application.business.business_phone}</div>
                )}
                {application.business.incorporation_date && (
                  <div><span className="font-medium">Incorporation Date:</span> {new Date(application.business.incorporation_date).toLocaleDateString()}</div>
                )}
              </div>
              <div className="mt-3 flex items-center">
                <Badge variant="outline" className="border-[#212936] text-[#212936]">
                  {application.business.years_trading || 0} years trading
                </Badge>
              </div>
            </div>
            {/* Address */}
            {application.business.address && (
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-700">Business Address:</div>
                <p>
                  {formatAddress(application.business.address)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-gray-50/80 border border-gray-200/70 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-600">No business profile available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessProfileCard;
