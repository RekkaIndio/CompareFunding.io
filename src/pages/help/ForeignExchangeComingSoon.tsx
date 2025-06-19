import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const ForeignExchangeComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Foreign Exchange Services"
      description="We're building partnerships with leading FX providers to offer competitive foreign exchange solutions for your international business needs."
      expectedLaunch="Q2 2025"
      features={[
        'Competitive exchange rates',
        'Multi-currency business accounts',
        'International payment solutions',
        'FX risk management tools'
      ]}
      backPath="/help"
    />
  );
};

export default ForeignExchangeComingSoon;
