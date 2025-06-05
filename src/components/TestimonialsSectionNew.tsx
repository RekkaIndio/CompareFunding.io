import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Compare Funding transformed our financing process. No broker fees and direct lender access saved us over £15,000 and got us funding in 48 hours.",
      author: "Sarah Johnson",
      role: "CFO",
      company: "TechGrowth Solutions",
      rating: 5,
      avatar: "SJ"
    },
    {
      quote: "As a lender, this platform has dramatically improved our lead quality. The businesses are pre-qualified and the transparent system works perfectly.",
      author: "David Chen", 
      role: "Director of SME Lending",
      company: "Horizon Capital",
      rating: 5,
      avatar: "DC"
    },
    {
      quote: "We struggled with traditional brokers for months. Compare Funding connected us with 3 lenders in one week, saving time and thousands in fees.",
      author: "Michael Okafor",
      role: "Managing Director", 
      company: "Premium Packaging Ltd",
      rating: 5,
      avatar: "MO"
    },
    {
      quote: "The platform is intuitive and powerful. Direct communication with lenders and transparent pricing made our funding journey stress-free.",
      author: "Emma Richards",
      role: "Finance Manager",
      company: "Sustainable Living Co.",
      rating: 5,
      avatar: "ER"
    },
    {
      quote: "The accounting integration and smart matching helped us find the perfect lender for our manufacturing business. Highly recommended.",
      author: "Robert Patel",
      role: "CEO",
      company: "Innovative Manufacturing",
      rating: 5,
      avatar: "RP"
    },
    {
      quote: "Quality borrowers at a fraction of traditional acquisition costs. The subscription model aligns perfectly with our business objectives.",
      author: "Jessica Wong",
      role: "Head of Business Development", 
      company: "Alliance Finance",
      rating: 5,
      avatar: "JW"
    },
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);
  
  const nextSlide = () => {
    setActiveIndex((prevIndex) => 
      prevIndex + 3 >= testimonials.length ? 0 : prevIndex + 3
    );
  };
  
  const prevSlide = () => {
    setActiveIndex((prevIndex) => 
      prevIndex - 3 < 0 ? Math.max(0, testimonials.length - 3) : prevIndex - 3
    );
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="h-4 w-4 fill-current" />
            <span>Client Success Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Trusted by thousands of
            <span className="block text-blue-600">growing businesses</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            See how businesses and lenders are transforming their funding relationships 
            through our platform.
          </p>
        </div>
        
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(activeIndex, activeIndex + 3).map((testimonial, index) => (
              <div
                key={index + activeIndex}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200"
              >
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <div className="mb-6">
                  <Quote className="h-8 w-8 text-blue-600/20 mb-4" />
                  <p className="text-slate-700 leading-relaxed text-lg italic">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-600">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fill remaining slots if needed */}
            {testimonials.slice(activeIndex, activeIndex + 3).length < 3 && 
              testimonials.slice(0, 3 - testimonials.slice(activeIndex, activeIndex + 3).length).map((testimonial, index) => (
                <div
                  key={`extra-${index}`}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200"
                >
                  <div className="flex items-center space-x-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <Quote className="h-8 w-8 text-blue-600/20 mb-4" />
                    <p className="text-slate-700 leading-relaxed text-lg italic">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.author}</p>
                      <p className="text-sm text-slate-600">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center space-x-4 mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={prevSlide}
              className="rounded-full w-12 h-12 p-0 border-slate-300 hover:bg-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={nextSlide}
              className="rounded-full w-12 h-12 p-0 border-slate-300 hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
