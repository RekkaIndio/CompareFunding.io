import { Offer } from './types';

// Helper function to format currency
export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '£0';
  return `£${amount.toLocaleString('en-GB')}`;
};

// Helper function to calculate total cost
export const calculateTotalCost = (offer: Offer) => {
  // Use provided total_repayment if available
  if (offer.total_repayment && offer.total_repayment > 0) {
    return offer.total_repayment;
  }
  
  const amount = offer.offered_amount;
  const interestRate = offer.interest_rate;
  const termMonths = offer.offered_term_months;
  
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = amount * monthlyRate * termMonths / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return Math.round(totalPayments);
};

// Helper function to calculate monthly payment
export const calculateMonthlyPayment = (offer: Offer) => {
  // Use provided monthly_payment if available
  if (offer.monthly_payment && offer.monthly_payment > 0) {
    return offer.monthly_payment;
  }
  
  const amount = offer.offered_amount;
  const interestRate = offer.interest_rate;
  const termMonths = offer.offered_term_months;
  
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
};

// Helper function to calculate total interest
export const calculateTotalInterest = (offer: Offer) => {
  const totalRepayment = calculateTotalCost(offer);
  return totalRepayment - offer.offered_amount;
};

// Helper function to format repayment frequency
export const formatRepaymentFrequency = (frequency?: string) => {
  const frequencies: Record<string, string> = {
    'monthly': 'Monthly',
    'weekly': 'Weekly',
    'fortnightly': 'Fortnightly',
    'quarterly': 'Quarterly',
    'annually': 'Annually'
  };
  return frequencies[frequency?.toLowerCase() || 'monthly'] || 'Monthly';
};

// Helper function to get status styling
export const getStatusStyling = (status: string) => {
  const statusStyles = {
    'pending': { 
      gradient: 'from-amber-500 to-amber-600', 
      bgClass: 'bg-amber-50', 
      textClass: 'text-amber-700',
      label: 'Awaiting Response'
    },
    'accepted': { 
      gradient: 'from-slate-500 to-slate-600', 
      bgClass: 'bg-slate-50', 
      textClass: 'text-slate-700',
      label: 'Accepted'
    },
    'negotiating': { 
      gradient: 'from-blue-500 to-blue-600', 
      bgClass: 'bg-blue-50', 
      textClass: 'text-blue-700',
      label: 'In Negotiation'
    },
    'expired': { 
      gradient: 'from-gray-500 to-gray-600', 
      bgClass: 'bg-gray-50', 
      textClass: 'text-gray-700',
      label: 'Expired'
    },
    'declined': { 
      gradient: 'from-red-500 to-red-600', 
      bgClass: 'bg-red-50', 
      textClass: 'text-red-700',
      label: 'Declined'
    },
    'withdrawn': { 
      gradient: 'from-purple-500 to-purple-600', 
      bgClass: 'bg-purple-50', 
      textClass: 'text-purple-700',
      label: 'Withdrawn'
    },
    'completed': { 
      gradient: 'from-slate-600 to-slate-700', 
      bgClass: 'bg-slate-100', 
      textClass: 'text-slate-800',
      label: 'Completed'
    }
  };
  
  return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
};
