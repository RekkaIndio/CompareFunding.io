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
}

// Types for business data
export interface Application {
  id?: string;  // Add the id field
  application_number?: string;
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
}

export interface Business {
  id?: string;
  business_name?: string;
  industry_sector?: string;
  description?: string;
  business_type?: string;
  credit_info?: any;
}

export interface ApplicationData {
  application?: Application | null;
  business?: Business | null;
  accounting?: any | null;
  creditScore?: any | null;
}

// Migration functionality has been removed
