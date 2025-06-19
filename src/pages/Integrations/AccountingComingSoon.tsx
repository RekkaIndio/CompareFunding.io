import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const AccountingIntegrationComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Accounting Integrations"
      description="We're building secure integrations with major accounting platforms to streamline your funding applications with real-time financial data."
      expectedLaunch="Q1 2025"
      features={[
        'Xero & QuickBooks integration',
        'Real-time financial data sharing',
        'Automated application pre-filling',
        'Enhanced lender confidence'
      ]}
      backPath="/business/dashboard"
    />
  );
};

export default AccountingIntegrationComingSoon;
