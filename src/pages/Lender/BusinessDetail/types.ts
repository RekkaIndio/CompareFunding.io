// Types for financial data
export interface FinancialDocumentData {
  data: Record<string, any>;
  summary?: string;
  createdAt: number | string | Date;
  id?: string;
  documentType?: string;
  fileUrl?: string; // URL for downloading the document
  documentUrl?: string; // Alternative URL property
  url?: string; // Another alternative URL property
  documentName?: string; // Name of the document file
  fileName?: string; // Alternative name property
}

export interface FinancialData {
  profitLoss?: FinancialDocumentData;
  balanceSheet?: FinancialDocumentData;
  trialBalance?: FinancialDocumentData;
  agedPayables?: FinancialDocumentData;
  agedReceivables?: FinancialDocumentData;
  // New document types matching the business documents page
  'signed-accounts'?: FinancialDocumentData;
  'management-accounts'?: FinancialDocumentData;
  'aged-debtors'?: FinancialDocumentData;
  'aged-creditors'?: FinancialDocumentData;
}

// Types for business data
export interface Application {
  id?: string;  // Add the id field
  application_number: string;
  business_id?: string;
  user_id?: string;
  loan_amount?: number;
  loan_term_months?: number;
  loan_purpose?: string;
  purpose?: string;
  security_offered?: string;
  personal_guarantee?: boolean;
  matched_lenders?: string[];
  interested_lenders?: Array<{
    lender_id: string;
    status: 'pending' | 'accepted' | 'declined' | 'rejected';
  }>;
  offers?: Array<{
    lender_id: string;
    [key: string]: any;
  }>;
  accepted_offer_id?: string;
  has_accepted_offer?: boolean;
  accepted_at?: string;
  status?: string;
  lender_id?: string; // ID of the approved/matched lender
  is_visible_to_lender?: boolean;
  application_stage?: string;
}

export interface Business {
  id?: string;
  business_name?: string;
  businessDescription?: string; // camelCase version used in database
  industry_sector?: string;
  description?: string;
  business_type?: string;
  logo_url?: string;
  website?: string;
  credit_info?: any;
  // Registration and company details (both camelCase and snake_case for compatibility)
  companyNumber?: string; // camelCase version used in database
  companyName?: string; // alternative company name field
  company_number?: string;
  registration_number?: string;
  // Trading information
  years_trading?: number;
  year_founded?: number;
  incorporation_date?: string;
  // Address information
  address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  registered_address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  trading_address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  // Contact and business details
  business_email?: string;
  business_phone?: string;
  annual_revenue?: string | number;
  company_size?: string;
  vat_number?: string;
}

export interface ApplicationData {
  application?: Application | null;
  business?: Business | null;
  accounting?: any | null;
  creditScore?: any | null;
}

// Migration functionality has been removed
