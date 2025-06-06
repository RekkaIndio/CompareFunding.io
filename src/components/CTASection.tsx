
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { useState } from 'react';

// FAQ interface
interface FAQItem {
  question: string;
  answer: string;
  isOpen?: boolean;
}

const CTASection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      isOpen: true
    },
    {
      question: "Lorem ipsum dolor sit amet ?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Lorem ipsum dolor sit consectetur adipiscing elit?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit/dolor sit amet?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Lorem ipsum dolor sit amet dolor sit amet ?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
    {
      question: "Lorem ipsum dolor sit/dolor sit amet amet  dolor sit amet?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    },
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(faqs.map((faq, i) => {
      if (i === index) {
        return { ...faq, isOpen: !faq.isOpen };
      }
      return faq;
    }));
  };

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-white relative overflow-hidden">
      {/* Background decorative elements - hidden on small screens */}
      <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 hidden sm:block">
        <div className="absolute top-0 right-0 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-fundhub-orange rounded-full -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-fundhub-navy rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 hidden sm:block">
        <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-fundhub-navy rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 bg-fundhub-orange rounded-full translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2">
            Frequently asked questions
          </h2>
          <p className="text-center mb-8 md:mb-12 text-gray-600 px-2">
            Here you will find answers to the most common questions
          </p>

          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 sm:pb-6">
                <button 
                  className="flex justify-between items-start sm:items-center w-full text-left pr-2"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-base sm:text-lg font-medium pr-4">{faq.question}</h3>
                  <div className="mt-1 sm:mt-0">
                    {faq.isOpen ? (
                      <MinusCircle className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 text-fundhub-orange" />
                    ) : (
                      <PlusCircle className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 text-fundhub-orange" />
                    )}
                  </div>
                </button>
                
                {faq.isOpen && (
                  <div className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg p-5 sm:p-8 shadow-lg border border-gray-100 relative">
            <h3 className="text-base sm:text-lg font-medium mb-2">Do you have other questions?</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Contact us through our contact form or book free consultation</p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                className="border-fundhub-navy text-fundhub-navy hover:bg-fundhub-navy hover:text-white text-sm sm:text-base py-2 h-auto"
                asChild
              >
                <Link to="/contact">
                  Contact Form
                </Link>
              </Button>
              
              <Button 
                className="bg-fundhub-orange text-white hover:bg-fundhub-orange/90 text-sm sm:text-base py-2 h-auto"
                asChild
              >
                <Link to="/consultation">
                  Book Free Consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
