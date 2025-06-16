// Utility functions for Business Dashboard

// Helper function to format currency (simplified)
export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return 'N/A';
  return `£${amount.toLocaleString('en-GB')}`;
};

// Helper function to safely convert application dates
export const safeConvertDate = (dateValue: any): Date => {
  // If it's already a Date object, return it
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it has a toDate method (Firestore Timestamp), use it
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // If it's a string or number, try to convert it
  if (dateValue) {
    const converted = new Date(dateValue);
    if (!isNaN(converted.getTime())) {
      return converted;
    }
  }
  
  // Fallback to current date
  return new Date();
};

// Helper functions for financial calculations (matching OffersList)
export const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(monthlyPayment * 100) / 100;
};

export const calculateTotalCost = (amount: number, interestRate: number, termMonths: number) => {
  if (!amount || !interestRate || !termMonths) return 0;
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, termMonths);
  return Math.round(monthlyPayment * termMonths);
};

export const calculateTotalInterest = (amount: number, interestRate: number, termMonths: number) => {
  const totalRepayment = calculateTotalCost(amount, interestRate, termMonths);
  return totalRepayment - amount;
};

// Helper function to get status styling for applications
export const getApplicationStatusStyling = (status: string) => {
  const statusStyles = {
    'pending': { 
      gradient: 'from-amber-500 to-amber-600', 
      bgClass: 'bg-amber-50', 
      textClass: 'text-amber-700',
      borderColor: 'border-amber-200',
      label: 'Pending Review',
      icon: 'Clock'
    },
    'under_review': { 
      gradient: 'from-blue-500 to-blue-600', 
      bgClass: 'bg-blue-50', 
      textClass: 'text-blue-700',
      borderColor: 'border-blue-200',
      label: 'Under Review',
      icon: 'Eye'
    },
    'documents_requested': { 
      gradient: 'from-purple-500 to-purple-600', 
      bgClass: 'bg-purple-50', 
      textClass: 'text-purple-700',
      borderColor: 'border-purple-200',
      label: 'Documents Requested',
      icon: 'FileText'
    },
    'offered': { 
      gradient: 'from-emerald-500 to-emerald-600', 
      bgClass: 'bg-emerald-50', 
      textClass: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      label: 'Offers Received',
      icon: 'Star'
    },
    'approved': { 
      gradient: 'from-green-500 to-green-600', 
      bgClass: 'bg-green-50', 
      textClass: 'text-green-700',
      borderColor: 'border-green-200',
      label: 'Approved',
      icon: 'CheckCircle2'
    },
    'rejected': { 
      gradient: 'from-red-500 to-red-600', 
      bgClass: 'bg-red-50', 
      textClass: 'text-red-700',
      borderColor: 'border-red-200',
      label: 'Declined',
      icon: 'AlertTriangle'
    },
    'submitted': { 
      gradient: 'from-slate-500 to-slate-600', 
      bgClass: 'bg-slate-50', 
      textClass: 'text-slate-700',
      borderColor: 'border-slate-200',
      label: 'Submitted',
      icon: 'FileCheck2'
    }
  };
  
  return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
};
