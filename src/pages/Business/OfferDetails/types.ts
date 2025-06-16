export type Offer = {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string;
  company_logo?: string; // Fixed: this is how it's stored in the database
  interest_rate: number;
  offered_amount: number; // Fixed field name to match OfferDetails
  offered_term_months: number; // Fixed field name to match OfferDetails
  status: string;
  offer_date: string;
  expires_at: string;
  expiry_date?: string; // Add optional expiry_date field for compatibility
  fees: Record<string, number>;
  conditions: string[];
  created_at: string;
  // Additional financial fields from OfferDetails
  apr?: number;
  monthly_payment?: number;
  total_repayment?: number;
  repayment_frequency?: string;
  arrangement_fee?: number;
  arrangement_fee_amount?: number;
  early_repayment_fee?: number;
  // For lender view
  business_name?: string;
  business_id?: string;
  application?: {
    id: string;
    application_number?: string;
    loan_amount: number;
    loan_term_months: number;
    purpose: string;
    status: string;
  };
  // For business view - application details
  applications?: {
    id: string;
    application_number?: string;
    loan_amount: number;
    loan_term_months: number;
    purpose: string;
    status: string;
    business_logo_url?: string;
    business_name?: string;
    business_id?: string; // Add business_id field
  };
};

export type GroupedOffers = {
  [applicationId: string]: {
    application_details: {
      id: string;
      application_number?: string;
      loan_amount: number;
      loan_term_months: number;
      purpose: string;
      status: string;
      business_logo_url?: string;
      business_name?: string;
      business_id?: string; // Add business_id field
    };
    offers: Offer[];
  };
};
