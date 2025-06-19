import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const BankingIntegrationComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Banking Integrations"
      description="We're developing secure Open Banking integrations to connect your business bank accounts directly with our partner lenders for instant verification."
      expectedLaunch="Q2 2025"
      features={[
        'Open Banking connectivity',
        'Real-time transaction data',
        'Instant cash flow analysis',
        'Faster funding decisions'
      ]}
      backPath="/business/dashboard"
    />
  );
};

export default BankingIntegrationComingSoon;
