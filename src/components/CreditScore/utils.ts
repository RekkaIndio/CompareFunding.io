// Utility functions for CreditScore component

// Helper function to determine credit rating color
export const getCreditRatingColor = (score: number | string | undefined): string => {
  if (!score) return 'text-gray-500';
  
  if (typeof score === 'string') {
    const lowercaseScore = score.toLowerCase();
    if (lowercaseScore === 'a' || lowercaseScore === 'b') return 'text-green-600';
    if (lowercaseScore === 'c') return 'text-yellow-600';
    if (lowercaseScore === 'd') return 'text-orange-600';
    if (lowercaseScore === 'e') return 'text-red-600';
    return 'text-gray-600';
  }
  
  if (typeof score === 'number') {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }
  
  return 'text-gray-500';
};

// Helper function to get the color for risk level badges
export const getRiskBadgeColor = (riskLevel: string | number | undefined): string => {
  if (!riskLevel) return 'bg-gray-100 text-gray-800';
  
  if (typeof riskLevel === 'string') {
    const lowercaseRisk = riskLevel.toLowerCase();
    if (lowercaseRisk.includes('low') || lowercaseRisk.includes('a') || lowercaseRisk.includes('b')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowercaseRisk.includes('moderate') || lowercaseRisk.includes('c')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowercaseRisk.includes('high') || lowercaseRisk.includes('d')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (lowercaseRisk.includes('very high') || lowercaseRisk.includes('e')) {
      return 'bg-red-100 text-red-800';
    }
  }
  
  if (typeof riskLevel === 'number') {
    if (riskLevel >= 80) return 'bg-green-100 text-green-800';
    if (riskLevel >= 60) return 'bg-green-100 text-green-800';
    if (riskLevel >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }
  
  return 'bg-gray-100 text-gray-800';
};

// Helper function to check if a company is newly incorporated
export const isNewlyIncorporated = (registrationDate: string | undefined): boolean => {
  if (!registrationDate) return false;
  
  const regDate = new Date(registrationDate);
  const now = new Date();
  const diffInMonths = (now.getFullYear() - regDate.getFullYear()) * 12 + (now.getMonth() - regDate.getMonth());
  
  return diffInMonths <= 24; // consider as new if less than 2 years old
};

// Parse JSON string if needed
export const tryParseJSON = (data: any) => {
  if (typeof data === 'string' && data.startsWith('{') && data.endsWith('}')) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  return data;
};
