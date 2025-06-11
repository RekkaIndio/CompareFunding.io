export type FilterOption = {
  key: string;
  label: string;
  type: 'range' | 'select' | 'boolean' | 'rating';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

export type ProductFilterConfig = {
  [productType: string]: {
    displayName: string;
    filters: FilterOption[];
  };
};

export const productFilters: ProductFilterConfig = {
  'invoice-finance': {
    displayName: 'Invoice Finance',
    filters: [
      {
        key: 'facility_limit',
        label: 'Facility Limit',
        type: 'range',
        min: 10000,
        max: 10000000,
        step: 10000,
        unit: '£'
      },
      {
        key: 'advance_rate',
        label: 'Advance Rate',
        type: 'range',
        min: 50,
        max: 95,
        step: 5,
        unit: '%'
      },
      {
        key: 'arrangement_fee',
        label: 'Arrangement Fee',
        type: 'range',
        min: 0,
        max: 5000,
        step: 100,
        unit: '£'
      },
      {
        key: 'total_cost',
        label: 'Total Cost',
        type: 'range',
        min: 0,
        max: 50000,
        step: 1000,
        unit: '£'
      },
      {
        key: 'processing_time',
        label: 'Processing Time',
        type: 'select',
        options: [
          { value: '1-3', label: '1-3 days' },
          { value: '3-7', label: '3-7 days' },
          { value: '7-14', label: '7-14 days' },
          { value: '14+', label: '14+ days' }
        ]
      },
      {
        key: 'software_rating',
        label: 'Software Rating',
        type: 'rating',
        min: 1,
        max: 5
      },
      {
        key: 'has_relationship_manager',
        label: 'Named Relationship Manager',
        type: 'boolean'
      }
    ]
  },
  'asset-finance': {
    displayName: 'Asset Finance',
    filters: [
      {
        key: 'loan_to_value',
        label: 'Loan to Value (LTV)',
        type: 'range',
        min: 50,
        max: 100,
        step: 5,
        unit: '%'
      },
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        type: 'range',
        min: 2,
        max: 15,
        step: 0.1,
        unit: '%'
      },
      {
        key: 'loan_amount',
        label: 'Loan Amount',
        type: 'range',
        min: 5000,
        max: 5000000,
        step: 5000,
        unit: '£'
      },
      {
        key: 'loan_term',
        label: 'Loan Term',
        type: 'range',
        min: 12,
        max: 84,
        step: 6,
        unit: 'months'
      },
      {
        key: 'asset_type',
        label: 'Asset Type',
        type: 'select',
        options: [
          { value: 'machinery', label: 'Machinery' },
          { value: 'vehicles', label: 'Vehicles' },
          { value: 'equipment', label: 'Equipment' },
          { value: 'technology', label: 'Technology' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        key: 'processing_time',
        label: 'Processing Time',
        type: 'select',
        options: [
          { value: '1-3', label: '1-3 days' },
          { value: '3-7', label: '3-7 days' },
          { value: '7-14', label: '7-14 days' },
          { value: '14+', label: '14+ days' }
        ]
      }
    ]
  },
  'business-loans': {
    displayName: 'Business Loans',
    filters: [
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        type: 'range',
        min: 3,
        max: 25,
        step: 0.1,
        unit: '%'
      },
      {
        key: 'loan_amount',
        label: 'Loan Amount',
        type: 'range',
        min: 1000,
        max: 2000000,
        step: 1000,
        unit: '£'
      },
      {
        key: 'loan_term',
        label: 'Loan Term',
        type: 'range',
        min: 3,
        max: 120,
        step: 3,
        unit: 'months'
      },
      {
        key: 'security_required',
        label: 'Security Required',
        type: 'select',
        options: [
          { value: 'secured', label: 'Secured' },
          { value: 'unsecured', label: 'Unsecured' },
          { value: 'both', label: 'Both' }
        ]
      },
      {
        key: 'processing_time',
        label: 'Processing Time',
        type: 'select',
        options: [
          { value: '1-3', label: '1-3 days' },
          { value: '3-7', label: '3-7 days' },
          { value: '7-14', label: '7-14 days' },
          { value: '14+', label: '14+ days' }
        ]
      },
      {
        key: 'early_repayment',
        label: 'Early Repayment Allowed',
        type: 'boolean'
      }
    ]
  },
  'revolving-credit': {
    displayName: 'Revolving Credit Facilities',
    filters: [
      {
        key: 'credit_limit',
        label: 'Credit Limit',
        type: 'range',
        min: 5000,
        max: 1000000,
        step: 5000,
        unit: '£'
      },
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        type: 'range',
        min: 2,
        max: 20,
        step: 0.1,
        unit: '%'
      },
      {
        key: 'arrangement_fee',
        label: 'Arrangement Fee',
        type: 'range',
        min: 0,
        max: 5000,
        step: 100,
        unit: '£'
      },
      {
        key: 'renewal_period',
        label: 'Renewal Period',
        type: 'select',
        options: [
          { value: '6', label: '6 months' },
          { value: '12', label: '12 months' },
          { value: '24', label: '24 months' },
          { value: '36', label: '36 months' }
        ]
      },
      {
        key: 'processing_time',
        label: 'Processing Time',
        type: 'select',
        options: [
          { value: '1-3', label: '1-3 days' },
          { value: '3-7', label: '3-7 days' },
          { value: '7-14', label: '7-14 days' },
          { value: '14+', label: '14+ days' }
        ]
      }
    ]
  },
  'commercial-property': {
    displayName: 'Commercial Property Loans',
    filters: [
      {
        key: 'loan_to_value',
        label: 'Loan to Value (LTV)',
        type: 'range',
        min: 50,
        max: 80,
        step: 5,
        unit: '%'
      },
      {
        key: 'interest_rate',
        label: 'Interest Rate',
        type: 'range',
        min: 2,
        max: 12,
        step: 0.1,
        unit: '%'
      },
      {
        key: 'loan_amount',
        label: 'Loan Amount',
        type: 'range',
        min: 50000,
        max: 10000000,
        step: 10000,
        unit: '£'
      },
      {
        key: 'loan_term',
        label: 'Loan Term',
        type: 'range',
        min: 12,
        max: 300,
        step: 12,
        unit: 'months'
      },
      {
        key: 'property_type',
        label: 'Property Type',
        type: 'select',
        options: [
          { value: 'office', label: 'Office' },
          { value: 'retail', label: 'Retail' },
          { value: 'industrial', label: 'Industrial' },
          { value: 'warehouse', label: 'Warehouse' },
          { value: 'mixed-use', label: 'Mixed Use' }
        ]
      }
    ]
  }
};

// Helper function to get filters for a specific product type
export const getFiltersForProduct = (productType: string): FilterOption[] => {
  const normalizedProductType = productType.toLowerCase().replace(/_/g, '-');
  return productFilters[normalizedProductType]?.filters || [];
};

// Helper function to get display name for a product type
export const getProductDisplayName = (productType: string): string => {
  const normalizedProductType = productType.toLowerCase().replace(/_/g, '-');
  return productFilters[normalizedProductType]?.displayName || productType;
};

// Helper function to get all available product types
export const getAvailableProductTypes = (): string[] => {
  return Object.keys(productFilters);
};
