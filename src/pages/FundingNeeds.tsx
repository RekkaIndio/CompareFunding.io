import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { 
  TrendingUp, 
  Package, 
  Building, 
  BarChart3, 
  Ship, 
  Rocket,
  ArrowRight
} from 'lucide-react';

const FundingNeeds = () => {
  const fundingNeeds = [
    {
      id: 'cashflow',
      title: 'Cashflow',
      description: 'Manage your day-to-day business expenses and bridge cash flow gaps',
      icon: <TrendingUp className="h-12 w-12 text-blue-600" />,
      color: 'blue'
    },
    {
      id: 'asset',
      title: 'Asset',
      description: 'Finance equipment, machinery, and other business assets',
      icon: <Package className="h-12 w-12 text-green-600" />,
      color: 'green'
    },
    {
      id: 'property',
      title: 'Property',
      description: 'Commercial property purchase, refinancing, or development',
      icon: <Building className="h-12 w-12 text-purple-600" />,
      color: 'purple'
    },
    {
      id: 'growth',
      title: 'Growth',
      description: 'Expand your business, hire staff, or enter new markets',
      icon: <BarChart3 className="h-12 w-12 text-orange-600" />,
      color: 'orange'
    },
    {
      id: 'trade',
      title: 'Trade',
      description: 'Import/export financing, trade finance, and supply chain funding',
      icon: <Ship className="h-12 w-12 text-teal-600" />,
      color: 'teal'
    },
    {
      id: 'startup',
      title: 'Start Up Finance',
      description: 'Get your new business off the ground with startup funding',
      icon: <Rocket className="h-12 w-12 text-red-600" />,
      color: 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:border-blue-300 hover:bg-blue-100',
        text: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:border-green-300 hover:bg-green-100',
        text: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:border-purple-300 hover:bg-purple-100',
        text: 'text-purple-600'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        hover: 'hover:border-orange-300 hover:bg-orange-100',
        text: 'text-orange-600'
      },
      teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        hover: 'hover:border-teal-300 hover:bg-teal-100',
        text: 'text-teal-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:border-red-300 hover:bg-red-100',
        text: 'text-red-600'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              All the different needs for funding
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tell us what you need funding for and we'll match you with the most suitable financial products and lenders
            </p>
          </div>

          {/* Funding Needs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {fundingNeeds.map((need) => {
              const colors = getColorClasses(need.color);
              return (
                <Link
                  key={need.id}
                  to={`/signup-journey/email-password?need=${need.id}`}
                  className={`group ${colors.bg} ${colors.border} ${colors.hover} border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 text-center cursor-pointer`}
                >
                  <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {need.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors duration-300">
                    {need.title}
                  </h3>
                  <p className="text-gray-600 mb-6 group-hover:text-gray-800 transition-colors duration-300">
                    {need.description}
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm font-semibold">
                    <span className={`${colors.text} group-hover:text-gray-700 transition-colors duration-300`}>
                      Get matched now
                    </span>
                    <ArrowRight className={`h-4 w-4 ${colors.text} group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300`} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Not sure what you need?
              </h2>
              <p className="text-gray-600 mb-6">
                Our funding experts can help you identify the best options for your specific situation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  Speak with an Expert
                </Link>
                <Link
                  to="/products"
                  className="bg-[#212936] hover:bg-[#2c3c53] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default FundingNeeds;
