
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: 'Tell us about your company and your needs',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&auto=format&q=80'
    },
    {
      number: 2,
      title: 'Upload your information to our cloud',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format&q=80'
    },
    {
      number: 3,
      title: 'Receive indicative offers of funding',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop&auto=format&q=80'
    }
  ];

  return (
    <>
    <section className="py-12 sm:py-16 md:py-24 bg-gray-50 relative overflow-hidden">
      {/* Background decorative element - hidden on smallest screens */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-0 hidden sm:block">
        <div className="relative flex items-center">
          {/* Orange circle */}
          <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-orange-500 rounded-full z-10"></div>
          {/* Blue curved shape overlapping behind and extending right */}
          <div className="w-20 sm:w-24 md:w-32 h-12 sm:h-16 md:h-20 bg-blue-900 rounded-r-full -ml-8 sm:-ml-10 md:-ml-12 z-0"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight text-gray-900 px-2">
            We make the whole process of accessing funding easier and quicker
          </h2>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            We do the hard-work so you don't have to. 3 simple steps and support at every stage if you need it
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <div className="h-40 sm:h-48 md:h-56">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="text-orange-500 font-semibold text-xs sm:text-sm mb-2 sm:mb-3">
                  Step {step.number}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center px-2">
          <p className="text-base sm:text-lg mb-4 sm:mb-6 text-gray-700">
            It really is that simple, and get started on your <span className="text-orange-500 font-semibold">funding journey!</span>
          </p>
          <Button 
            size="default" 
            className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base h-auto"
            asChild
          >
            <Link to="/signup">
              Apply Now
            </Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Apply for funding today section */}
    <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1494790108755-2616c9416c04?w=1200&h=600&fit=crop&auto=format&q=80"
          alt="Woman working on laptop"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Content Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-xl max-w-2xl relative">
            {/* Decorative elements - hidden on small screens */}
            <div className="absolute -bottom-8 -right-8 z-0 hidden sm:block">
              <div className="relative">
                <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-orange-500 rounded-full"></div>
                <div className="w-20 sm:w-24 md:w-32 h-12 sm:h-16 md:h-20 bg-blue-900 rounded-l-full absolute top-1/2 right-8 sm:right-10 md:right-12 transform -translate-y-1/2"></div>
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6 md:mb-8 text-gray-900">
                Apply for funding <span className="text-orange-500">today</span>
              </h2>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    We help businesses across the globe access a variety of funding solutions, in a completely transparent and value lead platform
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Whatever the need, we have the solutions
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    With one profile you can receive offers and indicative terms from the entire market
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Putting you in control of choosing the right option for you and your business
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700">
                    Not sure, or have any questions either book a session or call the team today
                  </span>
                </li>
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base h-auto"
                  asChild
                >
                  <Link to="/signup">
                    Apply Now
                  </Link>
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base h-auto"
                  asChild
                >
                  <Link to="/contact">
                    Book Free Consultation
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right side spacing for image */}
          <div className="flex-1 lg:min-h-[400px]"></div>
        </div>
      </div>
    </section>
    </>
  );
};

export default HowItWorksSection;
