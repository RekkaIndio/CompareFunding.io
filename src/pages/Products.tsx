import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { ArrowRight, TrendingUp, Building, CreditCard, PiggyBank } from 'lucide-react';

const Products = () => {
  const fundingProducts = [
    {
      id: 'business-loans',
      title: 'Business Loans',
      description: 'Traditional term loans for established businesses with predictable revenue streams.',
      icon: <Building className="h-8 w-8 text-blue-600" />,
      features: [
        'Fixed or variable rates',
        '£10K - £500K funding',
        '6 months - 5 years terms',
        'Established businesses (2+ years)',
      ],
      route: '/signup-journey/email-password?product=business-loans',
      backgroundColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'cashflow-finance',
      title: 'Cashflow Finance',
      description: 'Quick access to working capital to smooth out cashflow gaps and seasonal fluctuations.',
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      features: [
        'Fast approval (24-48 hours)',
        '£5K - £250K funding',
        'Flexible repayment terms',
        'Based on monthly revenue',
      ],
      route: '/funding-options/cashflow',
      backgroundColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'asset-finance',
      title: 'Asset Finance',
      description: 'Finance equipment, vehicles, and machinery to grow your business operations.',
      icon: <CreditCard className="h-8 w-8 text-purple-600" />,
      features: [
        'Up to 100% asset value',
        '£1K - £1M funding',
        'Hire purchase & leasing',
        'Equipment as security',
      ],
      route: '/funding-options/asset-finance',
      backgroundColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'invoice-finance',
      title: 'Invoice Finance',
      description: 'Unlock cash tied up in unpaid invoices to improve your working capital.',
      icon: <PiggyBank className="h-8 w-8 text-orange-600" />,
      features: [
        'Up to 90% invoice value',
        'Same-day funding',
        'Factoring & discounting',
        'Credit protection available',
      ],
      route: '/signup-journey/email-password?product=invoice-finance',
      backgroundColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'merchant-cash',
      title: 'Merchant Cash Advance',
      description: 'Fast funding based on your card transaction history, ideal for retail businesses.',
      icon: <CreditCard className="h-8 w-8 text-indigo-600" />,
      features: [
        'Based on card sales',
        '£5K - £200K funding',
        '24-hour decisions',
        'Daily collection',
      ],
      route: '/signup-journey/email-password?product=merchant-cash',
      backgroundColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'property-finance',
      title: 'Commercial Property',
      description: 'Finance for purchasing, refinancing, or developing commercial property.',
      icon: <Building className="h-8 w-8 text-red-600" />,
      features: [
        'Up to 80% LTV',
        '£100K - £10M funding',
        'Purchase & refinance',
        'Development finance',
      ],
      route: '/signup-journey/email-password?product=property-finance',
      backgroundColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Funding Solution
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our range of business funding options designed to meet different business needs. 
              Select the product that best fits your requirements to get started.
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {fundingProducts.map((product) => (
              <div
                key={product.id}
                className={`${product.backgroundColor} ${product.borderColor} border-2 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center mb-6">
                  <div className="mr-4">
                    {product.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{product.title}</h3>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {product.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to={product.route}
                  className="inline-flex items-center justify-center w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Not Sure Which Option is Right for You?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our funding experts can help you understand which option works best for your business situation. 
              Book a free consultation to get personalized advice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup-journey/email-password"
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Start Application
              </Link>
              <Link
                to="/contact"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Book Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Products;
