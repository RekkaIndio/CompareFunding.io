
import { ArrowRight, DollarSign, Building, Home, TrendingUp, Truck, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturesSection = () => {
  const fundingOptions = [
    {
      title: 'Cashflow Finance',
      description: 'Flexible financing for business cashflow',
      icon: (
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
        </div>
      ),
      featured: true
    },
    {
      title: 'Asset Finance',
      description: 'Spread cost of vital equipment',
      icon: (
        <div className="w-10 h-10 rounded border border-gray-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <rect x="7" y="7" width="3" height="9"/>
            <rect x="14" y="7" width="3" height="5"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Property Finance',
      description: 'Flexible loans for property deals',
      icon: (
        <div className="w-10 h-10 rounded border border-gray-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Growth Finance',
      description: 'Capital for scaling your business',
      icon: (
        <div className="w-10 h-10 rounded border border-gray-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="m22 21-3-3m0 0v-2.5A2.5 2.5 0 0 0 16.5 13H16.5a2.5 2.5 0 0 0-2.5 2.5V18"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Trade Finance',
      description: 'Import-export deals made smoother',
      icon: (
        <div className="w-10 h-10 rounded border border-gray-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
      )
    },
    {
      title: 'Start Up Finance',
      description: 'Early-stage funding for new ventures',
      icon: (
        <div className="w-10 h-10 rounded border border-gray-300 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      )
    }
  ];

  const leftColumnOptions = [
    'Invoice Finance / Factoring',
    'Commercial Mortgages',
    'Revolving Credit Facilities',
    'Stock Finance'
  ];

  const rightColumnOptions = [
    'Purchase Order Finance',
    'Bridging Loans',
    'Secured Loans',
    'VAT Loans'
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
            Find the right funding option for you, whatever the need we have solutions.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left side - Funding Options */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Funding Options</h3>
            <div className="space-y-2">
              {fundingOptions.map((option, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 group ${
                    option.featured 
                      ? 'bg-orange-50 border-l-4 border-orange-500' 
                      : 'hover:bg-white cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {option.icon}
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base">{option.title}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  {option.featured && (
                    <ArrowRight className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Featured Cashflow Finance */}
          <div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-80">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
                  alt="Man working on laptop outdoors"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-3xl font-bold text-white mb-2">Cashflow Finance</h3>
                  <Link 
                    to="/cashflow-finance"
                    className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Bottom financing options grid */}
            <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-6">
              {/* Left column */}
              <div className="space-y-4">
                {leftColumnOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-700 text-sm">{option}</span>
                  </div>
                ))}
              </div>
              
              {/* Right column */}
              <div className="space-y-4">
                {rightColumnOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-gray-700 text-sm">{option}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex gap-4 mt-8">
              <Link 
                to="/contact"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Book A Call To Discuss Options
              </Link>
              <Link 
                to="/apply"
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Apply Today
              </Link>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-24 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Scott Kirby */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-blue-800">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face&auto=format&q=80"
                  alt="Scott Kirby"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs opacity-80">Co-Founder & CEO</p>
                <p className="font-semibold text-sm">Scott Kirby</p>
              </div>
            </div>

            {/* Robin Souter */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face&auto=format&q=80"
                  alt="Robin Souter"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs opacity-80">CEO</p>
                <p className="font-semibold text-sm">Robin Souter</p>
              </div>
            </div>

            {/* Michael Jacobson */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face&auto=format&q=80"
                  alt="Michael Jacobson"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs opacity-80">Head of Software Engineering</p>
                <p className="font-semibold text-sm">Michael Jacobson</p>
              </div>
            </div>

            {/* Jamie Mason-Wright */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-800 to-orange-500">
                <img 
                  src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face&auto=format&q=80"
                  alt="Jamie Mason-Wright"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs opacity-80">Co-Founder & CTO</p>
                <p className="font-semibold text-sm">Jamie Mason-Wright</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Access Section */}
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Transparent access to finance, no hidden fees
          </h3>
          <p className="text-gray-600 text-lg mb-12">
            Remove the broker, access all products with Compare Funding and see the savings!
          </p>
          
          {/* Lender Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="h-8 flex items-center">
              <span className="text-2xl font-bold text-gray-800">LUNAR</span>
            </div>
            <div className="h-8 flex items-center">
              <span className="text-xl font-semibold text-gray-800">Revolut</span>
            </div>
            <div className="h-8 flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">NW</span>
              </div>
              <span className="text-xl font-semibold text-gray-800">NatWest</span>
            </div>
            <div className="h-8 flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded mr-2"></div>
              <span className="text-xl font-semibold text-gray-800">Santander</span>
            </div>
            <div className="h-8 flex items-center">
              <div className="w-8 h-8 bg-black rounded-full mr-2 flex items-center justify-center">
                <span className="text-white text-xs">🐎</span>
              </div>
              <span className="text-xl font-bold text-gray-800">LLOYDS</span>
            </div>
            <div className="h-8 flex items-center">
              <span className="text-xl font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded">Klarna.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
