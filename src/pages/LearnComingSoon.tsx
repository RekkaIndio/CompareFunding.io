import React from 'react';
import InternalComingSoon from '@/components/InternalComingSoon';

const LearnComingSoon: React.FC = () => {
  return (
    <InternalComingSoon
      title="Learning Hub"
      description="We're building a comprehensive learning platform with expert guides, video courses, and resources to help you master business funding."
      expectedLaunch="Q1 2025"
      features={[
        'Interactive funding guides',
        'Video tutorials and webinars',
        'Industry-specific resources',
        'Expert Q&A sessions'
      ]}
      backPath="/business/dashboard"
    />
  );
};

export default LearnComingSoon;
