import { getDocument } from '../firebase';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export interface SignupFundingData {
  amount?: string | number;
  fundingPurpose?: string;
  duration?: string;
  timeframe?: string;
  marketingConsent?: boolean;
}

export interface MappedApplicationData {
  loan_amount?: number;
  purpose_category?: string;
  purpose?: string;
  loan_term_months?: number;
  loan_type?: string;
}

/**
 * Maps signup journey funding data to application form structure
 */
export const mapSignupDataToApplication = (signupData: SignupFundingData): MappedApplicationData => {
  const mappedData: MappedApplicationData = {};
  
  // Map funding amount
  if (signupData.amount) {
    let amount = signupData.amount;
    if (typeof amount === 'string') {
      // Handle ranges like "100000" or "250000-500000"
      amount = parseInt(amount.replace(/[^\d]/g, ''));
    }
    mappedData.loan_amount = amount;
  }
  
  // Map funding purpose to purpose_category
  if (signupData.fundingPurpose) {
    mappedData.purpose_category = signupData.fundingPurpose;
    
    // Generate a basic purpose description based on the category
    const purposeDescriptions: Record<string, string> = {
      expansion: 'Business expansion and growth initiatives',
      equipment: 'Purchase of equipment and machinery for business operations',
      inventory: 'Inventory purchase and stock management',
      cashflow: 'Working capital and cash flow management',
      marketing: 'Marketing and advertising campaigns',
      renovation: 'Property renovation and improvement',
      debt: 'Debt consolidation and refinancing',
      startup: 'Startup capital and initial business setup',
      other: 'Other business funding requirements'
    };
    
    mappedData.purpose = purposeDescriptions[signupData.fundingPurpose] || 'Business funding requirements';
  }
  
  // Map duration to loan_term_months
  if (signupData.duration) {
    const durationMapping: Record<string, number> = {
      '6_months': 6,
      '12_months': 12,
      '18_months': 18,
      '2_years': 24,
      '3_years': 36,
      '5_years': 60
    };
    
    mappedData.loan_term_months = durationMapping[signupData.duration] || 12;
  }
  
  // Set default loan type
  mappedData.loan_type = 'term_loan';
  
  return mappedData;
};

/**
 * Fetches signup funding data for a user
 */
export const fetchSignupFundingData = async (userId: string): Promise<SignupFundingData | null> => {
  try {
    const { data: userData, error } = await getDocument('users', userId);
    
    if (error || !userData?.fundingApplication) {
      return null;
    }
    
    return userData.fundingApplication;
  } catch (error) {
    console.error('Error fetching signup funding data:', error);
    return null;
  }
};

/**
 * Gets business details from signup journey
 */
export const fetchSignupBusinessData = async (userId: string) => {
  try {
    // Check businesses collection first (where BusinessDetailsForm saves data)
    const { data: businessData, error: businessError } = await getDocument('businesses', userId);
    
    if (!businessError && businessData) {
      return {
        business_name: businessData.business_name || businessData.name,
        company_number: businessData.company_number,
        industry: businessData.industry || businessData.industry_sector,
        company_size: businessData.company_size,
        website: businessData.website,
        annual_revenue: businessData.annual_revenue || businessData.forecastRevenue,
        description: businessData.description || businessData.website_summary
      };
    }
    
    // Fallback to business_profiles collection
    const { data: profileData, error: profileError } = await getDocument('business_profiles', userId);
    
    if (!profileError && profileData) {
      return {
        business_name: profileData.business_name,
        company_number: profileData.company_number,
        industry: profileData.industry_sector,
        company_size: profileData.company_size,
        website: profileData.website,
        annual_revenue: profileData.annual_revenue,
        description: profileData.description
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching signup business data:', error);
    return null;
  }
};

/**
 * Creates a draft application based on signup data
 */
export const createDraftApplication = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔄 Creating draft application for user:', userId);
    
    // Check if a draft already exists
    const db = getFirestore();
    const applicationRef = doc(db, 'applications', `${userId}_draft`);
    const existingDoc = await getDoc(applicationRef);
    
    if (existingDoc.exists() && existingDoc.data()?.status === 'draft') {
      console.log('ℹ️ Draft application already exists, skipping creation');
      return false;
    }
    
    // Fetch signup data
    const [signupFundingData, businessData] = await Promise.all([
      fetchSignupFundingData(userId),
      fetchSignupBusinessData(userId)
    ]);
    
    if (!signupFundingData && !businessData) {
      console.log('⚠️ No signup data found, cannot create draft');
      return false;
    }
    
    // Map the data
    const mappedFundingData = signupFundingData ? mapSignupDataToApplication(signupFundingData) : {};
    
    // Create the draft application
    const draftApplication = {
      user_id: userId,
      status: 'draft',
      is_prefilled: true,
      prefill_source: 'signup_journey',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      
      // Funding data from signup
      ...mappedFundingData,
      
      // Business data from signup
      business_name: businessData?.business_name || '',
      company_number: businessData?.company_number || '',
      industry: businessData?.industry || '',
      company_size: businessData?.company_size || '',
      website: businessData?.website || '',
      annual_revenue: businessData?.annual_revenue || '',
      business_description: businessData?.description || '',
      
      // Default values for required fields that weren't in signup
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      business_address: {
        line1: '',
        line2: '',
        city: '',
        postcode: '',
        country: 'UK'
      },
      
      // Default loan details if not from signup
      loan_amount: mappedFundingData.loan_amount || 50000,
      loan_term_months: mappedFundingData.loan_term_months || 12,
      loan_type: mappedFundingData.loan_type || 'term_loan',
      purpose_category: mappedFundingData.purpose_category || 'expansion',
      purpose: mappedFundingData.purpose || 'Business expansion and growth initiatives',
      
      // Required checkboxes
      terms_accepted: false,
      privacy_accepted: false,
      marketing_consent: signupFundingData?.marketingConsent || false
    };
    
    await setDoc(applicationRef, draftApplication);
    console.log('✅ Draft application created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error creating draft application:', error);
    throw error;
  }
};
