import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const BusinessInsuranceComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Business Insurance"
      description="We're developing comprehensive business insurance solutions and partnerships to help protect your business while you grow."
      expectedLaunch="Q2 2025"
      features={[
        'Compare insurance providers',
        'Tailored business coverage options',
        'Integrated quotes and applications',
        'Expert insurance guidance'
      ]}
      backPath="/help"
    />
  );
};

export default BusinessInsuranceComingSoon;
