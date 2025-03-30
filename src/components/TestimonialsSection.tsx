
import { useState } from 'react';
import TestimonialCard from './TestimonialCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "FundHub completely transformed how we secure financing. The platform connected us with multiple lenders who competed for our business, resulting in much better terms than we've ever had before.",
      author: "Sarah Johnson",
      role: "CFO",
      company: "TechGrowth Solutions",
    },
    {
      quote: "As a lender, FundHub has dramatically reduced our customer acquisition costs. The quality of businesses on the platform is excellent, and the transparent matching system works brilliantly.",
      author: "David Chen",
      role: "Director of SME Lending",
      company: "Horizon Capital",
    },
    {
      quote: "We were struggling to find fair financing until we found FundHub. Within days, we had multiple offers and secured the capital we needed to expand our production line.",
      author: "Michael Okafor",
      role: "Managing Director",
      company: "Premium Packaging Ltd",
    },
    {
      quote: "The FundHub platform is intuitive and powerful. We can now manage all our financing applications in one place and get funding decisions much faster than with traditional brokers.",
      author: "Emma Richards",
      role: "Finance Manager",
      company: "Sustainable Living Co.",
    },
    {
      quote: "What sets FundHub apart is their technology. The accounting integration and matching algorithm helped us find the perfect lender for our specific industry and needs.",
      author: "Robert Patel",
      role: "CEO",
      company: "Innovative Manufacturing",
    },
    {
      quote: "We've been able to reach qualified borrowers at a fraction of the cost. The subscription model aligns FundHub's interests with ours - quality matches rather than pushing large loans.",
      author: "Jessica Wong",
      role: "Head of Business Development",
      company: "Alliance Finance",
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
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div className="max-w-2xl">
            <p className="text-fundhub-blue font-medium mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What our clients say
            </h2>
            <p className="text-lg text-muted-foreground">
              Businesses and lenders alike are transforming how they connect through our platform.
            </p>
          </div>
          
          <div className="flex space-x-2 mt-6 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
              aria-label="Next testimonials"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(activeIndex, activeIndex + 3).map((testimonial, index) => (
            <TestimonialCard
              key={index + activeIndex}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              company={testimonial.company}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
          
          {/* If we don't have enough testimonials to fill the row */}
          {testimonials.slice(activeIndex, activeIndex + 3).length < 3 && 
            testimonials.slice(0, 3 - testimonials.slice(activeIndex, activeIndex + 3).length).map((testimonial, index) => (
              <TestimonialCard
                key={`extra-${index}`}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                className="animate-fade-in"
                style={{ animationDelay: `${(index + testimonials.slice(activeIndex, activeIndex + 3).length) * 100}ms` }}
              />
            ))
          }
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
