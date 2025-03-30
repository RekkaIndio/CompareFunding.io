
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BarChart, Trophy, Globe } from 'lucide-react';

const About = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const team = [
    {
      name: 'Sarah Anderson',
      role: 'CEO & Co-Founder',
      bio: 'Former fintech executive with experience at major UK banks and lending platforms.',
      image: ''
    },
    {
      name: 'James Wilson',
      role: 'CTO & Co-Founder',
      bio: 'Technology leader with previous experience building digital platforms in the financial sector.',
      image: ''
    },
    {
      name: 'Priya Sharma',
      role: 'Head of Business Development',
      bio: 'Experienced in building partnerships with financial institutions and SME organizations.',
      image: ''
    },
    {
      name: 'David Chen',
      role: 'Head of Product',
      bio: 'Product specialist with a background in creating user-friendly fintech solutions.',
      image: ''
    },
    {
      name: 'Michael Johnson',
      role: 'Chief Risk Officer',
      bio: 'Expert in credit risk with experience in major lending institutions and credit bureaus.',
      image: ''
    },
    {
      name: 'Emma Roberts',
      role: 'Head of Customer Success',
      bio: 'Customer experience specialist focused on helping businesses and lenders achieve their goals.',
      image: ''
    }
  ];

  return (
    <PageLayout>
      <section className="py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 animate-slide-up">Our Mission</h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            FundHub is on a mission to transform business funding by removing traditional barriers
            and creating transparent, direct connections between businesses and lenders.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              FundHub was founded in 2023 by a team of fintech and lending experts who recognized a fundamental 
              problem in the business funding ecosystem: the traditional broker model was creating unnecessary 
              costs and inefficiencies.
            </p>
            <p className="text-muted-foreground mb-4">
              We observed that businesses were paying higher interest rates while lenders were paying significant 
              commissions to brokers – creating a system that didn't serve either party optimally.
            </p>
            <p className="text-muted-foreground mb-4">
              Our solution was to create a transparent platform with a subscription/credits model instead of 
              commissions, aligning our incentives with quality matches rather than transaction size.
            </p>
            <p className="text-muted-foreground">
              Today, FundHub is helping thousands of businesses access better funding while enabling lenders 
              to reduce customer acquisition costs and build relationships with qualified businesses.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80" 
              alt="FundHub Team Meeting" 
              className="w-full h-auto" 
            />
          </div>
        </div>
      </section>

      <section className="py-12 bg-fundhub-light-gray rounded-xl my-12 p-8">
        <h2 className="text-2xl font-bold mb-10 text-center">Our Values</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Users className="h-8 w-8 text-fundhub-blue" />,
              title: 'Transparency',
              description: 'We believe in complete transparency in all our operations, pricing, and processes.'
            },
            {
              icon: <Globe className="h-8 w-8 text-fundhub-blue" />,
              title: 'Fairness',
              description: 'Our platform is designed to create fair outcomes for both businesses and lenders.'
            },
            {
              icon: <BarChart className="h-8 w-8 text-fundhub-blue" />,
              title: 'Innovation',
              description: 'We continuously innovate to create better financing solutions and experiences.'
            },
            {
              icon: <Trophy className="h-8 w-8 text-fundhub-blue" />,
              title: 'Excellence',
              description: 'We strive for excellence in our technology, security, and customer service.'
            }
          ].map((value, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm text-center"
            >
              <div className="flex justify-center mb-4">
                {value.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-10 text-center">Our Team</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md"
            >
              <div className="w-20 h-20 bg-fundhub-light-blue rounded-full mb-4 mx-auto flex items-center justify-center">
                <span className="text-xl font-medium text-fundhub-blue">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-center mb-1">{member.name}</h3>
              <p className="text-fundhub-blue text-sm font-medium text-center mb-3">{member.role}</p>
              <p className="text-muted-foreground text-center">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-fundhub-navy rounded-xl text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-lg text-white/80 mb-8">
            We're looking for talented individuals who are passionate about transforming business 
            financing through technology and innovation.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-fundhub-navy hover:bg-white/90" 
            asChild
          >
            <Link to="/careers">
              View Open Positions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
