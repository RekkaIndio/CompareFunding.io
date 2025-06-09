// Helper to format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper to format repayment frequency
export const formatRepaymentFrequency = (frequency?: string) => {
  if (!frequency) return "Monthly";
  
  switch (frequency) {
    case "monthly": return "Monthly";
    case "bi_weekly": return "Bi-weekly";
    case "weekly": return "Weekly";
    default: return "Monthly";
  }
};
