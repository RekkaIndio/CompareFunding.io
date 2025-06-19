import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const RaisingEquityComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Raising Equity"
      description="We're developing a comprehensive equity raising platform to connect growing businesses with angel investors and venture capital firms."
      expectedLaunch="Q3 2025"
      features={[
        'Investor matching platform',
        'Equity valuation tools',
        'Pitch deck templates',
        'Due diligence support'
      ]}
      backPath="/help"
    />
  );
};

export default RaisingEquityComingSoon;
