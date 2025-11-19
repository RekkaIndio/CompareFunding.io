import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Clock, 
  Percent, 
  PoundSterling,
  Star,
  CheckCircle,
  TrendingUp,
  Shield,
  Users
} from 'lucide-react';

type LenderProfile = {
  id: string;
  lender_name?: string;
  company_name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  postal_code?: string;
  established_year?: number;
  funding_types?: {
    [key: string]: boolean;
  };
  funding_type_criteria?: {
    [key: string]: {
      interest_rate_min?: string;
      interest_rate_max?: string;
      min_amount?: string;
      max_amount?: string;
      min_business_age_months?: string;
      processing_time_days?: string;
      max_advance_percentage?: string;
      required_turnover?: string;
      max_ltv_percentage?: string;
      max_term_months?: string;
      advance_percentage?: string;
    };
  };
  lending_criteria?: {
    [key: string]: any;
  };
  [key: string]: any;
};

type Application = {
  id: string;
  application_number?: string;
  product_type?: string;
  selectedProduct?: string;
  loan_amount: number;
  loan_term_months: number;
  purpose: string;
  business_name?: string;
  industry?: string;
  years_trading?: number;
  annual_revenue?: number;
  connected_lenders?: string[];
  declined_lenders?: string[];
  status?: 'draft' | 'active' | 'declined' | 'completed';
};

type LenderComparisonTableProps = {
  lenders: LenderProfile[];
  application: Application;
  onContactLender: (lender: LenderProfile) => void;
  productType: string;
  connectedLenders: Set<string>;
  declinedLenders: Set<string>;
  onConnectLender: (lender: LenderProfile) => Promise<void>;
  onDeclineLender: (lender: LenderProfile) => Promise<void>;
  isConnecting: Set<string>;
};

export const LenderComparisonTable: React.FC<LenderComparisonTableProps> = ({
  lenders,
  application,
  onContactLender,
  productType,
  connectedLenders,
  declinedLenders,
  onConnectLender,
  onDeclineLender,
  isConnecting
}) => {
  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    return `£${numAmount.toLocaleString()}`;
  };

  const formatPercentage = (rate: string | number | undefined) => {
    if (!rate) return 'N/A';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return `${numRate}%`;
  };

  const getProductDetails = (lender: LenderProfile) => {
    const normalizedProductType = productType.toLowerCase().replace(/-/g, '_');
    return lender.funding_type_criteria?.[normalizedProductType] || 
           lender.lending_criteria?.[normalizedProductType] || 
           lender[normalizedProductType] || {};
  };

  const getLenderRating = (lender: LenderProfile) => {
    // This would come from actual rating data
    return Math.floor(Math.random() * 2) + 4; // Mock rating between 4-5
  };

  const getProcessingSpeed = (days: string | undefined) => {
    if (!days) return { text: 'N/A', color: 'gray' };
    const numDays = parseInt(days);
    if (numDays <= 3) return { text: `${days} days`, color: 'green' };
    if (numDays <= 7) return { text: `${days} days`, color: 'yellow' };
    return { text: `${days} days`, color: 'red' };
  };

  if (lenders.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lenders to Compare</h3>
        <p className="text-gray-600">Apply some filters to see matching lenders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lender Cards Grid */}
      <div className="grid gap-6">
        {lenders.map((lender) => {
          const productDetails = getProductDetails(lender);
          const rating = getLenderRating(lender);
          const processingSpeed = getProcessingSpeed(productDetails.processing_time_days);
          const lenderName = lender.lender_name || lender.company_name || 'Unknown Lender';

          return (
            <Card key={lender.id} className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-[#ff8000]/20 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {lender.logo_url ? (
                      <img 
                        src={lender.logo_url} 
                        alt={lenderName}
                        className="w-12 h-12 rounded-lg object-contain bg-white border p-1"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#212936] flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl text-[#212936] mb-1">
                        {lenderName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({rating}.0)</span>
                      </div>
                    </div>
                  </div>
                  {productDetails.processing_time_days && (
                    <Badge 
                      variant="outline" 
                      className={`${
                        processingSpeed.color === 'green' ? 'border-green-200 text-green-700 bg-green-50' :
                        processingSpeed.color === 'yellow' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                        'border-red-200 text-red-700 bg-red-50'
                      }`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {processingSpeed.text}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
                  {/* Interest Rate */}
                  {(productDetails.interest_rate_min || productDetails.interest_rate_max) && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-700">Interest Rate</span>
                        <Percent className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-lg font-bold text-green-800">
                          {productDetails.interest_rate_min && productDetails.interest_rate_max
                            ? `${formatPercentage(productDetails.interest_rate_min)} - ${formatPercentage(productDetails.interest_rate_max)}`
                            : productDetails.interest_rate_min
                              ? `From ${formatPercentage(productDetails.interest_rate_min)}`
                              : `Up to ${formatPercentage(productDetails.interest_rate_max)}`
                          }
                        </div>
                        <div className="text-xs text-green-600 mt-2">Annual rate</div>
                      </div>
                    </div>
                  )}

                  {/* Loan Amount */}
                  {(productDetails.min_amount || productDetails.max_amount) && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-700">Amount Range</span>
                        <PoundSterling className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-lg font-bold text-blue-800">
                          {productDetails.min_amount && productDetails.max_amount
                            ? `${formatCurrency(productDetails.min_amount)} - ${formatCurrency(productDetails.max_amount)}`
                            : productDetails.min_amount
                              ? `From ${formatCurrency(productDetails.min_amount)}`
                              : productDetails.max_amount
                                ? `Up to ${formatCurrency(productDetails.max_amount)}`
                                : 'Contact for limits'
                          }
                        </div>
                        <div className="text-xs text-blue-600 mt-2">Available funding</div>
                      </div>
                    </div>
                  )}

                  {/* Processing Time */}
                  {productDetails.processing_time_days && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-amber-700">Processing Time</span>
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-xl font-bold text-amber-800">
                          {productDetails.processing_time_days} days
                        </div>
                        <div className="text-xs text-amber-600 mt-2">Typical approval</div>
                      </div>
                    </div>
                  )}

                  {/* Advance Rate (for Invoice Finance) */}
                  {(productType.includes('invoice') || productType.includes('factoring')) && (productDetails.advance_percentage || productDetails.max_advance_percentage) && (
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-indigo-700">Max Advance</span>
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-lg font-bold text-indigo-800">
                          {formatPercentage(productDetails.advance_percentage || productDetails.max_advance_percentage)}
                        </div>
                        <div className="text-xs text-indigo-600 mt-2">Of invoice value</div>
                      </div>
                    </div>
                  )}

                  {/* Business Age */}
                  {productDetails.min_business_age_months && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-700">Min. Business Age</span>
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-lg font-bold text-purple-800">
                          {Math.floor(parseInt(productDetails.min_business_age_months) / 12)} years
                        </div>
                        <div className="text-xs text-purple-600 mt-2">Trading history</div>
                      </div>
                    </div>
                  )}

                  {/* LTV Percentage (for property loans) */}
                  {productDetails.max_ltv_percentage && (
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-teal-700">Max LTV</span>
                        <Percent className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-xl font-bold text-teal-800">
                          {productDetails.max_ltv_percentage}%
                        </div>
                        <div className="text-xs text-teal-600 mt-2">Loan to value</div>
                      </div>
                    </div>
                  )}

                  {/* Required Turnover */}
                  {productDetails.required_turnover && (
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 rounded-xl border border-cyan-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-cyan-700">Min. Turnover</span>
                        <TrendingUp className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-lg font-bold text-cyan-800">
                          {formatCurrency(productDetails.required_turnover)}
                        </div>
                        <div className="text-xs text-cyan-600 mt-2">Annual requirement</div>
                      </div>
                    </div>
                  )}

                  {/* Max Term */}
                  {productDetails.max_term_months && (
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-xl border border-rose-200 min-h-[120px] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-rose-700">Max Term</span>
                        <Clock className="h-4 w-4 text-rose-600" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-xl font-bold text-rose-800">
                          {Math.round(parseInt(productDetails.max_term_months) / 12)} years
                        </div>
                        <div className="text-xs text-rose-600 mt-2">Maximum term</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Fee Structure for Invoice Finance */}
                {(productType.includes('invoice') || productType.includes('factoring')) && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <PoundSterling className="h-5 w-5 mr-2 text-[#ff8000]" />
                      Fee Structure & Terms
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {/* Service Charge */}
                      {(productDetails.service_charge_percentage || productDetails.service_charge_amount) && (
                        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm min-h-[100px] flex flex-col justify-between">
                          <div className="text-sm font-medium text-gray-600 mb-2">Service Charge</div>
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="text-lg font-bold text-gray-900">
                              {productDetails.service_charge_percentage 
                                ? `${productDetails.service_charge_percentage}%`
                                : productDetails.service_charge_amount 
                                  ? formatCurrency(productDetails.service_charge_amount)
                                  : '0.15%'
                              }
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Per transaction</div>
                          </div>
                        </div>
                      )}

                      {/* Interest Margin */}
                      {(productDetails.interest_margin || productDetails.interest_rate_min) && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="text-sm font-medium text-gray-600 mb-1">Interest Margin</div>
                          <div className="text-lg font-bold text-gray-900">
                            {productDetails.interest_margin 
                              ? `${productDetails.interest_margin}%`
                              : productDetails.interest_rate_min 
                                ? `${productDetails.interest_rate_min}%`
                                : '1.8%'
                            }
                          </div>
                          <div className="text-xs text-gray-500">Monthly rate</div>
                        </div>
                      )}

                      {/* Bad Debt Protection */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Bad Debt Protection</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.bad_debt_protection || 'Required'}
                        </div>
                        <div className="text-xs text-gray-500">Coverage available</div>
                      </div>

                      {/* Trust Account Charges */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Trust Account Charges</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.trust_account_charges || '£40'}
                        </div>
                        <div className="text-xs text-gray-500">Monthly fee</div>
                      </div>

                      {/* Audit Fees */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Audit Fees</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.audit_fees || '£500'}
                        </div>
                        <div className="text-xs text-gray-500">Annual cost</div>
                      </div>

                      {/* Arrangement Fees */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Arrangement Fees</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.arrangement_fee || productDetails.arrangement_fees || '£5000'}
                        </div>
                        <div className="text-xs text-gray-500">One-time setup</div>
                      </div>

                      {/* TT Fees */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">TT Fees</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.tt_fees || '£15'}
                        </div>
                        <div className="text-xs text-gray-500">Per transfer</div>
                      </div>

                      {/* Management Fees */}
                      {productDetails.management_fee && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="text-sm font-medium text-gray-600 mb-1">Management Fee</div>
                          <div className="text-lg font-bold text-gray-900">
                            {productDetails.management_fee}
                          </div>
                          <div className="text-xs text-gray-500">Monthly charge</div>
                        </div>
                      )}

                      {/* Early Settlement */}
                      {productDetails.early_settlement_fee && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="text-sm font-medium text-gray-600 mb-1">Early Settlement</div>
                          <div className="text-lg font-bold text-gray-900">
                            {productDetails.early_settlement_fee}
                          </div>
                          <div className="text-xs text-gray-500">If applicable</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Business Loan Specific Fees */}
                {productType.includes('business') && productType.includes('loan') && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <PoundSterling className="h-5 w-5 mr-2 text-[#ff8000]" />
                      Loan Terms & Fees
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Application Fee */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Application Fee</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.application_fee || 'Free'}
                        </div>
                        <div className="text-xs text-gray-500">One-time cost</div>
                      </div>

                      {/* Origination Fee */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Origination Fee</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.origination_fee || '2-5%'}
                        </div>
                        <div className="text-xs text-gray-500">Of loan amount</div>
                      </div>

                      {/* Early Repayment */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Early Repayment</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.early_repayment_fee || 'Allowed'}
                        </div>
                        <div className="text-xs text-gray-500">Penalty terms</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Asset Finance Specific Terms */}
                {productType.includes('asset') && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <PoundSterling className="h-5 w-5 mr-2 text-[#ff8000]" />
                      Asset Finance Terms
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Documentation Fee */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Documentation Fee</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.documentation_fee || '£250'}
                        </div>
                        <div className="text-xs text-gray-500">Per agreement</div>
                      </div>

                      {/* Balloon Payment */}
                      {productDetails.balloon_payment_option && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="text-sm font-medium text-gray-600 mb-1">Balloon Payment</div>
                          <div className="text-lg font-bold text-gray-900">
                            {productDetails.balloon_payment_option}
                          </div>
                          <div className="text-xs text-gray-500">Available option</div>
                        </div>
                      )}

                      {/* Asset Valuation */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-600 mb-1">Asset Valuation</div>
                        <div className="text-lg font-bold text-gray-900">
                          {productDetails.valuation_fee || 'Included'}
                        </div>
                        <div className="text-xs text-gray-500">Assessment cost</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Funding Types */}
                {lender.funding_types && Object.values(lender.funding_types).some(Boolean) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Available Funding Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(lender.funding_types)
                        .filter(([key, value]) => value === true)
                        .map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-600" />
                    Contact Information
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {lender.phone && (
                        <a 
                          href={`tel:${lender.phone}`} 
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {lender.phone}
                        </a>
                      )}
                      {lender.email && (
                        <a 
                          href={`mailto:${lender.email}`} 
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {lender.email}
                        </a>
                      )}
                      {lender.website && (
                        <a 
                          href={lender.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          Visit Website
                        </a>
                      )}
                    </div>
                    
                    {/* Action Buttons - Streamlined for Automated Matching */}
                    <div className="flex items-center gap-3">
                      {connectedLenders.has(lender.id) ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Connected & Under Review</span>
                        </div>
                      ) : declinedLenders.has(lender.id) ? (
                        <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg border border-gray-200">
                          <span className="font-medium">Declined</span>
                        </div>
                      ) : connectedLenders.size >= 5 ? (
                        <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg border border-amber-200">
                          <span className="font-medium text-sm">Connection Limit Reached (5/5)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => onDeclineLender(lender)}
                            className="border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            Not Interested
                          </Button>
                          <Button
                            onClick={() => onConnectLender(lender)}
                            disabled={isConnecting.has(lender.id)}
                            className="bg-[#ff8000] hover:bg-[#e6720e] text-white px-8 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConnecting.has(lender.id) ? 'Connecting...' : 'Connect Now'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
