/**
 * Application data structure
 */
export interface ApplicationData {
  id?: string;
  user_id?: string;
  business_id?: string;
  status?: string;
  loan_amount?: number;
  loan_term_months?: number;
  loan_type?: string;
  purpose?: string;
  purpose_details?: string;
  application_number?: string;
  application_date?: string;
  status_updated_at?: string;
  is_secured?: boolean;
  has_personal_guarantee?: boolean;
  viewed_by_lenders?: string[];
  matched_lenders?: string[];
  interested_lenders?: Array<{
    lender_id: string;
    lender_name?: string;
    lender_company?: string;
    expressed_at?: any;
    status?: 'pending' | 'accepted' | 'rejected';
  }>;
  offers?: Array<any>;
  isOwner?: boolean;
  isLender?: boolean;
  business?: any;
  
  // Financial data
  financial_documents?: Array<any>;
  financialDocuments?: Record<string, any>;
  financialSummaries?: Record<string, string>;
  
  // Consolidated data
  business_profile?: any;
  credit_info?: any;
  data_consolidated?: boolean;
  consolidated_at?: string;
  
  // Completion data
  completeness_percentage?: number;
  
  // Offer acceptance data
  accepted_offer_id?: string;
  has_accepted_offer?: boolean;
  accepted_at?: string;
  lender_id?: string;
  application_stage?: string;
  is_visible_to_lender?: boolean;
  
  // Flexible indexing
  [key: string]: any;
}
