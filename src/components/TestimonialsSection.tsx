
import { useState } from 'react';
import TestimonialCard from './TestimonialCard';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      author: "Morten Andersen",
      date: "20.05.2025",
      rating: 4.7,
      source: "all"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      author: "Charlotte Mortensen",
      date: "20.05.2025",
      rating: 4.7,
      source: "trustpilot"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      author: "Mia Sørensen",
      date: "20.05.2025",
      rating: 4.7,
      source: "trustpilot"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      author: "Thomas Madsen",
      date: "20.05.2025",
      rating: 4.7,
      source: "google"
    },
    {
      quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      author: "Jeff Hansen",
      date: "20.05.2025",
      rating: 4.7,
      source: "google"
    },
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const filteredTestimonials = activeFilter === "all" 
    ? testimonials 
    : testimonials.filter(t => t.source === activeFilter);
  
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <section className="py-12 md:py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
            We have helped over 20 000 businesses
          </h2>
          <p className="text-base sm:text-lg px-2">
            Apply today and join our community of happy customers!
          </p>
          
          <div className="flex flex-wrap justify-center mt-6 sm:mt-8 gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
              className={`rounded-full px-4 sm:px-8 text-sm sm:text-base ${activeFilter === "all" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={activeFilter === "trustpilot" ? "default" : "outline"}
              onClick={() => setActiveFilter("trustpilot")}
              className={`rounded-full px-4 sm:px-8 text-sm sm:text-base ${activeFilter === "trustpilot" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              size="sm"
            >
              Trustpilot
            </Button>
            <Button
              variant={activeFilter === "google" ? "default" : "outline"}
              onClick={() => setActiveFilter("google")}
              className={`rounded-full px-4 sm:px-8 text-sm sm:text-base ${activeFilter === "google" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
              size="sm"
            >
              Google
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 overflow-hidden">
          {filteredTestimonials.slice(activeIndex, activeIndex + 5).map((testimonial, index) => (
            <TestimonialCard
              key={index + activeIndex}
              quote={testimonial.quote}
              author={testimonial.author}
              date={testimonial.date}
              rating={testimonial.rating}
              source={testimonial.source}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
          
          {/* If we don't have enough testimonials to fill the row */}
          {filteredTestimonials.slice(activeIndex, activeIndex + 5).length < 5 && 
            filteredTestimonials.slice(0, 5 - filteredTestimonials.slice(activeIndex, activeIndex + 5).length).map((testimonial, index) => (
              <TestimonialCard
                key={`extra-${index}`}
                quote={testimonial.quote}
                author={testimonial.author}
                date={testimonial.date}
                rating={testimonial.rating}
                source={testimonial.source}
                className="animate-fade-in"
                style={{ animationDelay: `${(index + filteredTestimonials.slice(activeIndex, activeIndex + 5).length) * 100}ms` }}
              />
            ))
          }
        </div>
        
        {/* Pagination dots */}
        <div className="flex justify-center mt-6 sm:mt-8">
          {/* We show different number of dots based on screen size */}
          <div className="block xl:hidden">
            {/* Mobile, tablet, and small desktop: fewer dots */}
            {Array.from({ length: Math.ceil(filteredTestimonials.length / (window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3)) }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 w-2 mx-1 rounded-full ${index === activeIndex ? 'bg-orange-500' : 'bg-gray-300'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="hidden xl:flex">
            {/* Large desktop: all 5 dots */}
            {Array.from({ length: Math.ceil(filteredTestimonials.length / 5) }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 w-2 mx-1 rounded-full ${index === activeIndex ? 'bg-orange-500' : 'bg-gray-300'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
