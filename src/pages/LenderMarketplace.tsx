import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbar } from '@/contexts/NavbarContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, createDocument, updateDocument, getDocument } from '@/firebase';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HorizontalProductFilters, FilterValues } from '@/components/HorizontalProductFilters';
import { LenderComparisonTable } from '@/components/LenderComparisonTable';
import LenderSearchLoading from '@/components/LenderSearchLoading';
import { getFiltersForProduct, getProductDisplayName } from '@/lib/productFilters';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Target, 
  PoundSterling, 
  Calendar, 
  Building2, 
  Trophy, 
  Search, 
  SortAsc, 
  AlertCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Percent,
  Filter,
  TrendingUp,
  RefreshCw,
  Star,
  Users
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

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
  // New structure (actual structure used by LenderProfile.tsx)
  product_type?: {
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
    min_loan_amount?: number;
    max_loan_amount?: number;
    preferred_industries?: string[];
    excluded_industries?: string[];
    min_business_age_months?: number;
    min_annual_revenue?: number;
    funding_speed_days?: number;
    interest_rate_range?: {
      min: number;
      max: number;
    };
  };
  // Legacy structure support
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
    [key: string]: any;
  };
  preferred_industries?: string[];
  excluded_industries?: {
    funding_speed_days: number;
  };
  created_at?: string;
  updated_at?: string;
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
  company_number?: string; // Add company_number field
  industry?: string;
  years_trading?: number;
  annual_revenue?: number;
  connected_lenders?: string[]; // Array of lender IDs
  declined_lenders?: string[]; // Array of lender IDs
  status?: 'draft' | 'active' | 'declined' | 'completed';
};

// Add new type for lender connection status
type LenderConnectionStatus = 'available' | 'connected' | 'declined' | 'limit_reached';

const LenderMarketplace = () => {
  const { user } = useAuth();
  const { showNavbar } = useNavbar();
  const location = useLocation();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('interest_rate'); // interest_rate, amount, speed
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [connectedLenders, setConnectedLenders] = useState<Set<string>>(new Set());
  const [declinedLenders, setDeclinedLenders] = useState<Set<string>>(new Set());
  const [isConnecting, setIsConnecting] = useState<Set<string>>(new Set());
  const [showLoading, setShowLoading] = useState(true);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [revealedLenders, setRevealedLenders] = useState<LenderProfile[]>([]);
  const [allMatchedLenders, setAllMatchedLenders] = useState<LenderProfile[]>([]);
  
  // Fetch application data from URL parameter if not available in navigation state
  const { data: fetchedApplication, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      
      const { data, error } = await getDocument('applications', applicationId);
      
      if (error) {
        console.error('Error fetching application:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!applicationId, // Always fetch if we have an applicationId
  });
  
  // Fetch existing offers for this application
  const { data: existingOffers } = useQuery({
    queryKey: ['applicationOffers', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];
      
      const { data, error } = await getDocuments(
        'offers',
        [{ field: 'application_id', operator: '==', value: applicationId }]
      );
      
      if (error) {
        console.error('Error fetching offers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!applicationId,
  });

  // Get application data - prioritize fresh fetched data over navigation state
  const application = fetchedApplication || location.state?.application;
  
  // Initialize connected and declined lenders from application data
  useEffect(() => {
    if (application) {
      const newConnectedLenders = new Set<string>(application.connected_lenders || []);
      const newDeclinedLenders = new Set<string>(application.declined_lenders || []);
      
      setConnectedLenders(newConnectedLenders);
      setDeclinedLenders(newDeclinedLenders);
    }
  }, [application]);

  // Get connection status for a lender
  const getLenderConnectionStatus = (lenderId: string): LenderConnectionStatus => {
    if (declinedLenders.has(lenderId)) return 'declined';
    if (connectedLenders.has(lenderId)) return 'connected';
    if (connectedLenders.size >= 5) return 'limit_reached';
    return 'available';
  };

  // Handle manual connection with a lender - requires user confirmation
  const handleConnectLender = async (lender: LenderProfile) => {
    if (!user || !application) return;
    
    if (connectedLenders.size >= 5) {
      toast.error('You can only connect with a maximum of 5 lenders per application.');
      return;
    }

    if (connectedLenders.has(lender.id)) {
      toast.error('You are already connected with this lender.');
      return;
    }

    // User manually chooses to connect - proceed with connection
    await handleConfirmConnection(lender);
  };

  // Handle actual connection after automatic matching
  const handleConfirmConnection = async (lender: LenderProfile) => {
    if (!lender || !user || !application) return;
    
    // Check and fix legacy application without application_number
    if (!application.application_number) {
      try {
        const { generateApplicationNumber } = await import('@/lib/applicationUtils');
        const newApplicationNumber = generateApplicationNumber(application.company_number);
        
        // Update the application with the new application number
        await updateDocument('applications', application.id, {
          application_number: newApplicationNumber
        });
        
        // Update the local application object
        application.application_number = newApplicationNumber;
        toast.success(`Application updated with number: ${newApplicationNumber}`);
      } catch (error) {
        console.error('Failed to update legacy application:', error);
        // Continue with fallback logic below
      }
    }    
    setIsConnecting(prev => new Set(prev).add(lender.id));

    try {
      // Update application with connected lender
      const updatedConnectedLenders = [...Array.from(connectedLenders), lender.id];
      
      // Only update the specific fields we need to change
      await updateDocument('applications', application.id, {
        connected_lenders: updatedConnectedLenders,
        status: 'active' as const
      });

      // Create a connection record for the lender dashboard
      const connectionData = {
        application_id: application.id,
        lender_id: lender.id,
        business_id: user.uid,
        application_data: {
          application_number: application.application_number || `APP-LEGACY-${application.id.slice(0, 8)}`, // Fallback for legacy applications
          business_name: application.business_name || 'Business Name Not Available',
          product_type: application.product_type || application.selectedProduct || 'Unknown Product',
          loan_amount: application.loan_amount || 0,
          loan_term_months: application.loan_term_months || 12,
          purpose: application.purpose || 'Purpose not specified',
          industry: application.industry || 'Unknown Industry',
          years_trading: application.years_trading || 0,
          annual_revenue: application.annual_revenue || 0
        },
        status: 'pending',
        connected_at: new Date().toISOString(),
      };

      const connectionResult = await createDocument('lender_connections', connectionData);
      
      if (connectionResult.error) {
        throw new Error(`Failed to create connection: ${connectionResult.error.message}`);
      }
      
      if (!connectionResult.data) {
        throw new Error('Connection creation returned no data');
      }

      // Generate and send prospect notification email with PDF attachment
      await sendLenderProspectNotificationEmail(lender, application, user);

      // Update local state
      setConnectedLenders(prev => new Set(prev).add(lender.id));
      
      toast.success(`Successfully connected with ${lender.lender_name || lender.company_name}! They have been notified and are now reviewing your application.`);
    } catch (error) {
      console.error('Error connecting with lender:', error);
      toast.error('Failed to connect with lender. Please try again.');
    } finally {
      setIsConnecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(lender.id);
        return newSet;
      });
    }
  };

  // Send lender prospect notification email
  const sendLenderProspectNotificationEmail = async (lender: LenderProfile, application: Application, user: any) => {
    try {
      // Import services
      const { mailgunService } = await import('@/services/mailgunService');
      
      // Check if lender has a valid email
      if (!lender.email) {
        console.warn('Lender does not have an email address, skipping notification:', lender.id);
        return;
      }

      console.log('📧 Sending lender prospect notification to:', lender.email);

      // Prepare email data
      const emailData = {
        lenderName: lender.lender_name || lender.company_name || 'Lender',
        lenderEmail: lender.email,
        businessName: application.business_name || 'Business',
        applicationNumber: application.application_number || `APP-LEGACY-${application.id.slice(0, 8)}`,
        productType: application.product_type || application.selectedProduct || 'Funding',
        loanAmount: application.loan_amount,
        annualRevenue: application.annual_revenue,
        yearsTrading: application.years_trading,
        industry: application.industry,
        connectionUrl: `${window.location.origin}/lender/connections`,
        businessDetailUrl: `${window.location.origin}/lender/business-details/${application.id}`
      };

      // Send the notification email
      const emailResult = await mailgunService.sendLenderProspectNotificationEmail(emailData);
      
      if (emailResult.success) {
        console.log('✅ Lender prospect notification sent successfully:', lender.email);
        toast.success(`Lender notification sent to ${lender.lender_name || lender.company_name}`);
      } else {
        console.error('❌ Failed to send lender prospect notification:', emailResult.error);
        // Don't show error to user as connection should still be successful
        console.warn('Connection successful but email notification failed');
      }
      
    } catch (error) {
      console.error('Error sending lender prospect notification:', error);
      // Don't throw error as the connection itself was successful
    }
  };

  // Handle declining a lender
  const handleDeclineLender = async (lender: LenderProfile) => {
    if (!user || !application) return;

    if (declinedLenders.has(lender.id)) {
      toast.error('You have already declined this lender.');
      return;
    }

    const lenderName = lender.lender_name || lender.company_name || 'this lender';

    try {
      // Update application with declined lender
      const updatedDeclinedLenders = [...Array.from(declinedLenders), lender.id];
      
      // Only update the specific fields we need to change
      const updateData = {
        declined_lenders: updatedDeclinedLenders
      };
      
      const result = await updateDocument('applications', application.id, updateData);
      
      if (result.error) {
        throw new Error(`Firebase update failed: ${result.error.message}`);
      }
      
      // Verify the update worked by fetching the document
      const verificationResult = await getDocument('applications', application.id);
      if (verificationResult.data) {
        // Invalidate and refetch the application data to ensure we have the latest data
        if (applicationId) {
          await queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
        }
      }
      // Update local state
      setDeclinedLenders(prev => new Set(prev).add(lender.id));
      
      toast.success(`${lenderName} has been declined and removed from your list.`);
    } catch (error) {
      console.error('Error declining lender:', error);
      toast.error('Failed to decline lender. Please try again.');
    }
  };

  // Check if application should be marked as declined (all matching lenders declined)
  const checkApplicationDeclinedStatus = async () => {
    if (!application || !matchingLenders) return;
    
    const totalMatchingLenders = matchingLenders.length;
    const totalDeclinedLenders = declinedLenders.size;
    
    // If all matching lenders have been declined, mark application as declined
    if (totalMatchingLenders > 0 && totalDeclinedLenders >= totalMatchingLenders) {
      try {
        await updateDocument('applications', application.id, {
          status: 'declined'
        });
        
        toast.info('Application has been moved to declined status as all matching lenders were declined.');
        
        // Navigate back to applications after a delay
        setTimeout(() => {
          navigate('/applications');
        }, 2000);
      } catch (error) {
        console.error('Error updating application status:', error);
      }
    }
  };

  // Get product-specific filters
  const productType = application?.product_type || application?.selectedProduct;
  const availableFilters = productType ? getFiltersForProduct(productType) : [];
  
  // Filter handler functions
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilterValues({});
  };

  // Apply filters to lender list
  const applyFilters = (lenders: LenderProfile[]) => {
    return lenders.filter(lender => {
      // Apply each active filter
      for (const [filterKey, filterValue] of Object.entries(filterValues)) {
        // Skip empty, null, undefined, or 'all' values
        if (!filterValue || 
            filterValue === 'all' ||
            filterValue === '' ||
            (Array.isArray(filterValue) && filterValue.length === 0)) {
          continue;
        }
        
        const filter = availableFilters.find(f => f.key === filterKey);
        if (!filter) continue;

        const productType = (application.product_type || application.selectedProduct)?.toLowerCase().replace(/-/g, '_');
        
        // Get lender criteria from the appropriate data structure
        let lenderCriteria = null;
        
        // Try product_type.funding_type_criteria first (new structure)
        if (lender.product_type?.funding_type_criteria?.[productType]) {
          lenderCriteria = lender.product_type.funding_type_criteria[productType];
        }
        // Try lending_criteria.funding_type_criteria (legacy structure)  
        else if (lender.lending_criteria?.funding_type_criteria?.[productType]) {
          lenderCriteria = lender.lending_criteria.funding_type_criteria[productType];
        }
        // Try direct product_type access (old structure)
        else if (lender.product_type?.[productType]) {
          lenderCriteria = lender.product_type[productType];
        }
        // Try funding_type_criteria at root level
        else if (lender.funding_type_criteria?.[productType]) {
          lenderCriteria = lender.funding_type_criteria[productType];
        }
        // Try lending_criteria at root level
        else if (lender.lending_criteria?.[productType]) {
          lenderCriteria = lender.lending_criteria[productType];
        }
        // Try direct lender key
        else if (lender[productType]) {
          lenderCriteria = lender[productType];
        }
        
        if (!lenderCriteria) continue;

        switch (filter.type) {
          case 'range':
            if (Array.isArray(filterValue)) {
              let lenderValue: number | undefined;
              
              // Map filter keys to lender data keys
              switch (filterKey) {
                case 'facility_limit':
                case 'credit_limit':
                case 'loan_amount':
                  lenderValue = parseInt(lenderCriteria.max_amount || '0');
                  break;
                case 'advance_rate':
                  lenderValue = parseInt(lenderCriteria.advance_percentage || lenderCriteria.max_advance_percentage || '0');
                  break;
                case 'interest_rate':
                  lenderValue = parseFloat(lenderCriteria.interest_rate_min || '0');
                  break;
                case 'loan_to_value':
                  lenderValue = parseInt(lenderCriteria.max_ltv_percentage || '0');
                  break;
                case 'arrangement_fee':
                  // This would need to be added to lender data structure
                  lenderValue = 0;
                  break;
              }
              
              if (lenderValue !== undefined) {
                const [min, max] = filterValue;
                if (lenderValue < min || lenderValue > max) {
                  return false;
                }
              }
            }
            break;
            
          case 'select':
            switch (filterKey) {
              case 'processing_time':
                const processingDays = parseInt(lenderCriteria.processing_time_days || '0');
                const [minDays, maxDays] = filterValue.split('-').map(d => parseInt(d.replace('+', '')));
                
                if (filterValue.includes('+')) {
                  if (processingDays < minDays) return false;
                } else {
                  if (processingDays < minDays || processingDays > maxDays) return false;
                }
                break;
                
              case 'asset_type':
              case 'property_type':
              case 'security_required':
                // These would need additional lender data structure
                break;
            }
            break;
            
          case 'boolean':
            switch (filterKey) {
              case 'has_relationship_manager':
                // This would need to be added to lender data
                break;
              case 'early_repayment':
                // This would need to be added to lender data
                break;
            }
            break;
            
          case 'rating':
            // Software rating would need to be added to lender data
            break;
        }
      }
      
      return true;
    });
  };
  
  useEffect(() => {
    showNavbar();
  }, [showNavbar]);

  // Redirect if no application data and no application ID
  useEffect(() => {
    if (!applicationId && !application) {
      toast.error('No application data found. Redirecting to applications page.');
      navigate('/applications');
    }
  }, [applicationId, application, navigate]);

  // Fetch all lender profiles that match the application's product type
  const { data: matchingLenders, isLoading, error, refetch: refetchLenders } = useQuery({
    queryKey: ['matchingLenders', application?.product_type || application?.selectedProduct],
    queryFn: async () => {
      if (!application) return [];
      
      const productType = application.product_type || application.selectedProduct;
      if (!productType) {
        throw new Error('No product type specified in application');
      }

      // Get all lender profiles
      const { data: allLenders, error } = await getDocuments('lender_profiles');
      
      if (error) {
        console.error('Error fetching lender profiles:', error);
        throw error;
      }

      if (!allLenders || allLenders.length === 0) {
        return [];
      }

      // Normalize product type for matching (handle variations like invoice_finance vs invoice-finance)
      const normalizeProductType = (productType: string) => {
        return productType.toLowerCase()
          .replace(/_/g, '-') // Convert underscores to hyphens
          .replace(/\s+/g, '-') // Convert spaces to hyphens
          .trim();
      };

      const normalizedApplicationProductType = normalizeProductType(productType);
      
      // Filter lenders that offer the required product type
      const matchingLenders = allLenders.filter(lender => {
        const lenderName = lender.lender_name || lender.company_name || 'Unnamed';
        
        // Check both possible structures for lender data:
        // 1. New structure: lender.product_type.funding_types and lender.product_type.funding_type_criteria
        // 2. Legacy structure: lender.lending_criteria.funding_types and lender.lending_criteria.funding_type_criteria
        const productTypeData = lender.product_type;
        const lendingCriteriaData = lender.lending_criteria;
        
        const fundingTypes = productTypeData?.funding_types || lendingCriteriaData?.funding_types;
        const fundingTypeCriteria = productTypeData?.funding_type_criteria || lendingCriteriaData?.funding_type_criteria;
        
        // List of product type variations to check
        const variations = [
          'invoice_finance', // Most common format
          productType.toLowerCase().replace(/-/g, '_'), // Convert hyphens to underscores
          productType.toLowerCase(), // Original lowercase
          normalizedApplicationProductType.replace(/-/g, '_'), // Normalized with underscores
          'asset_finance',
          'business_loans',
          'factoring',
          'revolving_credit_facilities',
          'commercial_property_loans',
          'stock_funding',
          'supply_chain_finance'
        ];

        // Check each variation
        for (const variation of variations) {
          // Check if this funding type is enabled in funding_types
          const isEnabled = fundingTypes?.[variation] === true;
          
          if (isEnabled) {
            // Check if there are criteria to validate
            const productCriteria = fundingTypeCriteria?.[variation];
            if (productCriteria) {
              // Validate amount range
              if (application.loan_amount) {
                const minAmount = productCriteria.min_amount ? parseInt(productCriteria.min_amount) : null;
                const maxAmount = productCriteria.max_amount ? parseInt(productCriteria.max_amount) : null;
                
                if (minAmount && application.loan_amount < minAmount) {
                  continue; // Try next variation
                }
                if (maxAmount && application.loan_amount > maxAmount) {
                  continue; // Try next variation
                }
              }

              // Validate business age
              if (application.years_trading && productCriteria.min_business_age_months) {
                const minBusinessAgeMonths = parseInt(productCriteria.min_business_age_months);
                const businessAgeMonths = application.years_trading * 12;
                
                if (businessAgeMonths < minBusinessAgeMonths) {
                  continue; // Try next variation
                }
              }

              return true;
            } else {
              return true;
            }
          }
        }
        
        // Fallback: Check for direct keys on the lender object (old structure)
        const fallbackVariations = [
            productType, // Original (e.g., "invoice-finance")
            productType.toLowerCase(), // Lowercase
            normalizedApplicationProductType, // Normalized (invoice-finance)
            productType.toLowerCase().replace(/-/g, '_'), // Convert hyphens to underscores (invoice_finance)
            productType.toLowerCase().replace(/\s+/g, '_'), // Convert spaces to underscores
            'invoice_finance', // Direct check for invoice_finance
            'invoicefinance', // No separators
            'asset_finance', // Other common types
            'business_loans',
            'cashflow_finance',
            'revolving_credit_facilities'
        ];

        // Check if any of the product type variations exist as direct keys on the lender
        for (const variation of fallbackVariations) {
            if (lender[variation]) {
                const productCriteria = lender[variation];
                
                // Check amount range
                if (application.loan_amount && productCriteria) {
                    if (productCriteria.min_amount && application.loan_amount < productCriteria.min_amount) {
                        return false;
                    }
                    if (productCriteria.max_amount && application.loan_amount > productCriteria.max_amount) {
                        return false;
                    }
                }

                // Check business age if available
                if (application.years_trading && productCriteria && productCriteria.min_business_age_months) {
                    const businessAgeMonths = application.years_trading * 12;
                    if (businessAgeMonths < productCriteria.min_business_age_months) {
                        return false;
                    }
                }

                return true;
            }
        }
        
        // Fallback: Check the old structure with product_type object
        if (lender.product_type && typeof lender.product_type === 'object') {
          // Check if product_type has the funding type directly
          for (const variation of fallbackVariations) {
            if (lender.product_type[variation]) {
              const productCriteria = lender.product_type[variation];
              
              // Check amount range
              if (application.loan_amount && productCriteria) {
                if (productCriteria.min_amount && application.loan_amount < productCriteria.min_amount) {
                  continue;
                }
                if (productCriteria.max_amount && application.loan_amount > productCriteria.max_amount) {
                  continue;
                }
              }

              // Check business age if available
              if (application.years_trading && productCriteria && productCriteria.min_business_age_months) {
                const businessAgeMonths = application.years_trading * 12;
                if (businessAgeMonths < productCriteria.min_business_age_months) {
                  continue;
                }
              }

              return true;
            }
          }
        }

        return false;
      });

      return matchingLenders as LenderProfile[];
    },
    enabled: !!application && !!(application.product_type || application.selectedProduct),
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is in background
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount to get latest data
    refetchOnReconnect: true, // Refetch when reconnecting to internet
  });

  // Check declined status when declined lenders change
  useEffect(() => {
    if (matchingLenders) {
      checkApplicationDeclinedStatus();
    }
  }, [declinedLenders, matchingLenders?.length]);

  // Handle loading completion
  const handleLoadingComplete = () => {
    setLoadingComplete(true);
    setTimeout(() => {
      setShowLoading(false);
    }, 300); // Small delay for smooth transition
  };

  // Show loading animation initially
  useEffect(() => {
    // Reset loading state when component mounts or application changes
    if (application) {
      setShowLoading(true);
      setLoadingComplete(false);
      setRevealedLenders([]);
      setAllMatchedLenders([]);
    }
  }, [application?.id]);

  // Handle lender data when it arrives
  useEffect(() => {
    if (matchingLenders && matchingLenders.length > 0 && !loadingComplete) {
      setAllMatchedLenders(matchingLenders);
      
      // Start revealing lenders gradually
      let currentIndex = 0;
      const revealInterval = setInterval(() => {
        if (currentIndex < matchingLenders.length) {
          setRevealedLenders(prev => [...prev, matchingLenders[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(revealInterval);
          handleLoadingComplete();
        }
      }, 600); // Reveal a new lender every 600ms

      // Complete loading after all lenders are revealed or after maximum time
      const maxTime = Math.min(matchingLenders.length * 600 + 1000, 5000); // Max 5 seconds
      const completeTimer = setTimeout(() => {
        clearInterval(revealInterval);
        setRevealedLenders(matchingLenders);
        handleLoadingComplete();
      }, maxTime);

      return () => {
        clearInterval(revealInterval);
        clearTimeout(completeTimer);
      };
    }
  }, [matchingLenders, loadingComplete]);

  // Auto-complete loading after data is loaded
  useEffect(() => {
    if (matchingLenders && !isLoading && !loadingComplete && allMatchedLenders.length === 0) {
      setAllMatchedLenders(matchingLenders);
    }
  }, [matchingLenders, isLoading, loadingComplete, allMatchedLenders.length]);

  // DISABLED: Automatic connection logic - let businesses choose their own lenders
  // useEffect(() => {
  //   const handleAutomaticConnections = async () => {
  //     if (!matchingLenders || !application || !user || isLoading) return;
  //     
  //     // Only auto-connect if we have fewer than 5 connections and there are available lenders
  //     const availableLenders = matchingLenders.filter(lender => 
  //       !connectedLenders.has(lender.id) && !declinedLenders.has(lender.id)
  //     );
  //     
  //     if (connectedLenders.size >= 5 || availableLenders.length === 0) return;
  //     
  //     // Calculate how many more connections we can make
  //     const connectionsNeeded = Math.min(5 - connectedLenders.size, availableLenders.length);
  //     
  //     // Score and rank lenders based on matching criteria
  //     const scoredLenders = availableLenders.map(lender => {
  //       let score = 0;
  //       const productType = (application.product_type || application.selectedProduct)?.toLowerCase().replace(/-/g, '_');
  //       
  //       // Get product criteria
  //       let productCriteria = null;
  //       if (lender.product_type?.funding_type_criteria?.[productType]) {
  //         productCriteria = lender.product_type.funding_type_criteria[productType];
  //       } else if (lender.lending_criteria?.funding_type_criteria?.[productType]) {
  //         productCriteria = lender.lending_criteria.funding_type_criteria[productType];
  //       } else if (lender.funding_type_criteria?.[productType]) {
  //         productCriteria = lender.funding_type_criteria[productType];
  //       }
  //       
  //       if (productCriteria) {
  //         // Score based on interest rate (lower is better)
  //         const interestRate = parseFloat(productCriteria.interest_rate_min || '10');
  //         score += Math.max(0, 100 - interestRate * 10); // Lower rates get higher scores
  //         
  //         // Score based on processing speed (faster is better)
  //         const processingDays = parseInt(productCriteria.processing_time_days || '30');
  //         score += Math.max(0, 100 - processingDays * 2); // Faster processing gets higher scores
  //         
  //         // Score based on loan amount capacity (higher capacity is better for larger loans)
  //         const maxAmount = parseInt(productCriteria.max_amount || '0');
  //         if (maxAmount >= application.loan_amount) {
  //           score += 50; // Bonus for being able to handle the full amount
  //         }
  //         
  //         // Score based on business age requirements (more flexible is better)
  //         const minBusinessAge = parseInt(productCriteria.min_business_age_months || '0');
  //         const businessAge = (application.years_trading || 0) * 12;
  //         if (businessAge >= minBusinessAge) {
  //           score += 30; // Bonus for meeting business age requirements
  //         }
  //       }
  //       
  //       // Established year bonus (older lenders might be more reliable)
  //       if (lender.established_year) {
  //         const yearsInBusiness = new Date().getFullYear() - lender.established_year;
  //         score += Math.min(20, yearsInBusiness); // Up to 20 points for experience
  //       }
  //       
  //       return { lender, score };
  //     });
  //     
  //     // Sort by score (highest first) and take the best matches
  //     const bestMatches = scoredLenders
  //       .sort((a, b) => b.score - a.score)
  //       .slice(0, connectionsNeeded)
  //       .map(item => item.lender);
  //     
  //     // Auto-connect with the best matching lenders
  //     if (bestMatches.length > 0) {
  //       toast.info(`Automatically connecting with ${bestMatches.length} best matching lender${bestMatches.length > 1 ? 's' : ''}...`);
  //       
  //       // Connect with each lender sequentially to avoid overwhelming the system
  //       for (const lender of bestMatches) {
  //         try {
  //           await handleConfirmConnection(lender);
  //           // Small delay between connections
  //           await new Promise(resolve => setTimeout(resolve, 500));
  //         } catch (error) {
  //           console.error('Error in automatic connection:', error);
  //         }
  //       }
  //     }
  //   };
  //   
  //   // Only run automatic connections once when matching lenders are first loaded
  //   if (matchingLenders && matchingLenders.length > 0 && connectedLenders.size === 0) {
  //     handleAutomaticConnections();
  //   }
  // }, [matchingLenders, application, user, isLoading, connectedLenders.size, declinedLenders.size]);

  // Filter and sort lenders based on search, filters, and sort criteria
  const filteredBySearch = (showLoading ? revealedLenders : matchingLenders)?.filter(lender => 
    !searchTerm || 
    lender.lender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lender.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const filteredByProductFilters = applyFilters(filteredBySearch);
  
  // Filter out declined lenders so they don't appear in the list
  const filteredByDeclined = filteredByProductFilters.filter(lender => 
    !declinedLenders.has(lender.id)
  );
  
  const processedLenders = filteredByDeclined.sort((a, b) => {
    const productType = (application.product_type || application.selectedProduct)?.toLowerCase().replace(/-/g, '_');
    
    // Get criteria from the appropriate data structure
    const getProductCriteria = (lender: LenderProfile) => {
      // Try product_type.funding_type_criteria first (new structure)
      if (lender.product_type?.funding_type_criteria?.[productType]) {
        return lender.product_type.funding_type_criteria[productType];
      }
      // Try lending_criteria.funding_type_criteria (legacy structure)
      if (lender.lending_criteria?.funding_type_criteria?.[productType]) {
        return lender.lending_criteria.funding_type_criteria[productType];
      }
      // Try direct product_type access (old structure)
      if (lender.product_type?.[productType]) {
        return lender.product_type[productType];
      }
      // Try funding_type_criteria at root level
      if (lender.funding_type_criteria?.[productType]) {
        return lender.funding_type_criteria[productType];
      }
      return null;
    };
    
    const aProduct = getProductCriteria(a);
    const bProduct = getProductCriteria(b);

    switch (sortBy) {
      case 'interest_rate':
        const aRate = aProduct ? parseFloat(aProduct.interest_rate_min || '0') : 0;
        const bRate = bProduct ? parseFloat(bProduct.interest_rate_min || '0') : 0;
        return aRate - bRate;
      case 'amount':
        const aAmount = aProduct ? parseInt(aProduct.max_amount || '0') : 0;
        const bAmount = bProduct ? parseInt(bProduct.max_amount || '0') : 0;
        return bAmount - aAmount;
      case 'speed':
        const aSpeed = aProduct ? parseInt(aProduct.processing_time_days || '999') : 999;
        const bSpeed = bProduct ? parseInt(bProduct.processing_time_days || '999') : 999;
        return aSpeed - bSpeed;
        default:
          return a.lender_name?.localeCompare(b.lender_name || '') || 0;
      }
    });

  const handleBackToApplications = () => {
    navigate('/applications');
  };

  const handleContactLender = (lender: LenderProfile) => {
    // This could navigate to a contact form or initiate an application
    toast.success(`Contacting ${lender.lender_name}...`);
    // You could navigate to a detailed lender page or application form
    // navigate(`/lenders/${lender.id}/apply`, { state: { application, lender } });
  };

  if (isLoadingApplication) {
    return (
      <PageLayout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="container px-6 py-8 mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!application) {
    return null; // Will redirect in useEffect
  }

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container px-6 py-8 mx-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#212936] via-[#2a3441] to-[#212936] text-white rounded-xl p-4 mb-6 shadow-lg border border-slate-200/20 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff8000] rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full translate-y-12 -translate-x-12 blur-2xl"></div>
            </div>
            
            <div className="relative z-10">
              <Button
                variant="ghost"
                onClick={handleBackToApplications}
                className="text-white hover:bg-white/10 mb-3 -ml-2 h-8 px-2"
                size="sm"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Applications
              </Button>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-[#ff8000]/20 rounded-lg border border-[#ff8000]/30">
                  <Target className="h-4 w-4 text-[#ff8000]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Lender Marketplace
                  </h1>
                  <p className="text-gray-300 text-sm">
                    Choose the best lenders for your {application.product_type || application.selectedProduct} application
                  </p>
                </div>
              </div>

              {/* Compact Application Summary */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 mb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <PoundSterling className="h-3 w-3 text-[#ff8000]" />
                    <span>Amount: <strong>{formatCurrency(application.loan_amount)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span>Term: <strong>{application.loan_term_months}m</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-green-400" />
                    <span>Purpose: <strong>{application.purpose}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-400" />
                    <span>Product: <strong>{getProductDisplayName(productType || '')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Compact Status */}
              {(existingOffers && existingOffers.length > 0) || connectedLenders.size > 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {existingOffers && existingOffers.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-emerald-400" />
                        <span><strong>{existingOffers.filter(offer => ['pending', 'negotiating'].includes(offer.status?.toLowerCase())).length}</strong> active offers</span>
                      </div>
                    )}
                    {connectedLenders.size > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-400" />
                        <span><strong>{connectedLenders.size}</strong> connected</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-[#ff8000]" />
                      <span><strong>{5 - connectedLenders.size}</strong> more available</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="h-3 w-3 text-[#ff8000]" />
                    <span className="text-white/90">
                      Connect with up to <strong>5 best-matched lenders</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Full Width Layout */}
          <div className="space-y-4">
            {/* Combined Search, Sort, and Product-Specific Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <HorizontalProductFilters
                  filters={availableFilters}
                  values={filterValues}
                  onChange={handleFilterChange}
                  onClear={handleClearFilters}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  lendersCount={processedLenders.length}
                  connectedLendersCount={connectedLenders.size}
                />
              </div>
            </div>

            {/* Lender Comparison Table */}
            <div className="w-full">
              {isLoading && revealedLenders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : processedLenders.length === 0 && !showLoading ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {declinedLenders.size > 0 ? 'No More Lenders Available' : 'No Matching Lenders Found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {declinedLenders.size > 0 
                      ? `You have marked ${declinedLenders.size} lender${declinedLenders.size > 1 ? 's' : ''} as not interested. ${
                          connectedLenders.size > 0 
                            ? `You are connected with ${connectedLenders.size} lender${connectedLenders.size > 1 ? 's' : ''}.`
                            : 'No connections made yet.'
                        }`
                      : `Our matching system couldn't find lenders that match your ${productType} requirements. New lenders are evaluated and added as they become available.`
                    }
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    {connectedLenders.size > 0 && (
                      <div className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                        ✓ Connected with {connectedLenders.size} out of 5 possible lenders
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Auto-refreshing lender list...
                      </div>
                      <Button onClick={handleBackToApplications} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Applications
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <LenderComparisonTable
                  lenders={processedLenders}
                  application={application}
                  onContactLender={handleContactLender}
                  productType={productType || ''}
                  connectedLenders={connectedLenders}
                  declinedLenders={declinedLenders}
                  onConnectLender={handleConnectLender}
                  onDeclineLender={handleDeclineLender}
                  isConnecting={isConnecting}
                />
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="bg-red-50 border-red-200 mb-8">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Error loading lenders: {error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Loading Overlay */}
        {showLoading && (
          <LenderSearchLoading 
            applicationAmount={application.loan_amount}
            productType={getProductDisplayName(productType || '')}
            onComplete={handleLoadingComplete}
            foundLendersCount={revealedLenders.length}
            isOverlay={true}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default LenderMarketplace;
