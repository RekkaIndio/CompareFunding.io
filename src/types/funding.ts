// Shared funding-related types for consistency across components

// Sign-up journey funding details structure
export interface SignUpFundingDetails {
  provider: string;
  product: string;
  terms: string;
  expiryDate: string;
  currentBalance: string;
  interestRate?: string;
  monthlyPayment?: string;
  securityType?: string;
  notes?: string;
}

// Sign-up journey current funding structure
export interface SignUpCurrentFunding {
  hasCurrentFunding: 'yes' | 'no' | '';
  fundingDetails: SignUpFundingDetails[];
  updatedAt?: any; // Firebase serverTimestamp
}

// Account page current loan structure
export interface CurrentLoan {
  id: string;
  lender_name: string;
  loan_type: string;
  original_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  repayment_frequency: string;
  status: 'current' | 'paid_off' | 'defaulted';
  security_type?: string;
  notes?: string;
}

// Account page current lending structure
export interface CurrentLendingData {
  user_id: string;
  loans: CurrentLoan[];
  total_outstanding: number;
  total_monthly_payments: number;
  updated_at: string;
}

// Utility functions for data conversion
export const parseAmount = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(/[£,\s]/g, '')) || 0;
};

export const parseInterestRate = (value: string): number => {
  if (!value) return 0;
  // Extract number from strings like "5.9% APR" or "5.9"
  const match = value.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
};

export const formatCurrency = (amount: number): string => {
  return `£${amount.toLocaleString('en-GB')}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// Convert sign-up funding details to current lending format
export const convertSignUpToCurrentLending = (
  signUpFunding: SignUpCurrentFunding,
  userId: string
): CurrentLendingData | null => {
  if (signUpFunding.hasCurrentFunding !== 'yes' || !signUpFunding.fundingDetails?.length) {
    return null;
  }

  const loans: CurrentLoan[] = signUpFunding.fundingDetails.map((detail, index) => {
    const outstandingAmount = parseAmount(detail.currentBalance);
    const interestRate = parseInterestRate(detail.interestRate || detail.terms || '');
    const monthlyPayment = parseAmount(detail.monthlyPayment);

    return {
      id: `converted_${Date.now()}_${index}`,
      lender_name: detail.provider || 'Unknown Provider',
      loan_type: detail.product || 'Other',
      original_amount: outstandingAmount, // Use current balance as original since we don't have historical data
      outstanding_amount: outstandingAmount,
      interest_rate: interestRate,
      monthly_payment: monthlyPayment,
      start_date: '',
      end_date: detail.expiryDate || '',
      repayment_frequency: 'Monthly',
      status: 'current' as const,
      security_type: detail.securityType || 'Unsecured',
      notes: [
        detail.terms ? `Terms: ${detail.terms}` : '',
        detail.notes ? `Notes: ${detail.notes}` : '',
        'Converted from sign-up journey'
      ].filter(Boolean).join(' | ')
    };
  });

  const total_outstanding = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0);
  const total_monthly_payments = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);

  return {
    user_id: userId,
    loans,
    total_outstanding,
    total_monthly_payments,
    updated_at: new Date().toISOString()
  };
};
