
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import MomentumSection from '@/components/MomentumSection';
import CTASection from '@/components/CTASection';

const Index = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout withoutPadding fullWidth>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MomentumSection />
      <CTASection />
    </PageLayout>
  );
};

export default Index;
