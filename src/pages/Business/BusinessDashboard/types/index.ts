// TypeScript Interfaces for Business Dashboard
export interface BaseAudit {
  created_at: Date | any; // Firestore Timestamp or Date
  updated_at: Date | any; // Firestore Timestamp or Date
  created_by: string;
  updated_by: string;
}

export interface CreditScoreData {
  credit_score?: number;
  previous_rating?: number;
  common_description?: string;
  common_value?: string;
  risk?: string;
  latest_rating_change?: string;
  raw_report?: any;
}

export interface Application extends BaseAudit {
  id: string;
  application_number?: string; // Added missing application_number field
  user_id: string;
  company_name: string;
  loan_amount: number;
  loan_purpose: string;
  purpose_category?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'under_review' | 'documents_requested' | 'submitted' | 'offered';
  application_date: string | Date; // ISO string or Date
  documents_submitted?: string[];
  matched_lenders?: string[]; // Array of lender IDs
  businesses_snapshot?: BusinessProfile; // Snapshot at time of application
  is_prefilled?: boolean; // Flag for auto-created applications
  prefill_source?: string; // Source of prefill data
}

export interface Offer extends BaseAudit {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name?: string; // Denormalized
  lender_avatar_url?: string; // Denormalized
  offer_amount: number;
  interest_rate: number;
  term_months: number;
  status: 'pending_acceptance' | 'accepted' | 'declined' | 'expired';
  offer_date: string | Date;
  expiry_date: string | Date;
  conditions?: string;
}

export interface Notification extends BaseAudit {
  id: string;
  user_id: string;
  type: 'new_offer' | 'application_update' | 'message_received' | 'document_request';
  title: string;
  message: string;
  read: boolean;
  link?: string; // e.g., to application or offer
}

export interface BusinessProfile extends BaseAudit {
  id: string; // Should be same as user_id
  user_id: string;
  company_name: string;
  industry: string;
  registration_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  description?: string;
  founded_year?: number;
  number_of_employees?: number;
  annual_revenue?: number;
  avatar_url?: string;
  documents?: Array<{ name: string; url: string; uploaded_at: Date | any }>;
}

export interface Conversation {
  id: string; // Composite ID e.g., businessUserId_lenderId_applicationId
  userId: string; // Business user ID
  lenderId: string;
  lenderName: string;
  lenderAvatar: string;
  applicationId: string;
  applicationPurpose: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export interface MessagePayload { // For creating messages, sent_at is serverTimestamp
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: any; // Firestore serverTimestamp()
  read: boolean;
}

export interface Message extends Omit<MessagePayload, 'sent_at'> {
  id: string;
  sent_at: Date; // Converted to Date object on client
}
