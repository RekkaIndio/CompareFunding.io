import React from 'react';

const ComingSoonPage: React.FC = () => {
  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    // Here you can integrate with your email service
    alert('Thank you for your interest! We\'ll notify you when we launch.');
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white">
      <div className="text-center max-w-2xl px-6">
        <img 
          src="/assets/cflogowhite.png" 
          alt="Fund Connector Logo" 
          className="w-32 h-auto mx-auto mb-8"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          Fund Connector
        </h1>
        
        <p className="text-xl mb-8 opacity-90 leading-relaxed">
          We're building something amazing to connect businesses with the perfect funding opportunities. 
          Get ready for a revolutionary platform that will transform how businesses find and secure funding.
        </p>
        
        <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
          <input
            type="email"
            name="email"
            placeholder="Enter your email for early access"
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Notify Me
          </button>
        </form>
        
        <p className="text-sm opacity-70 mb-8">Launching Soon • Be the first to know</p>
        
        <div className="flex justify-center gap-6 text-sm">
          <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Privacy Policy</a>
          <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">Terms of Service</a>
          <a href="mailto:info@fundconnector.com" className="opacity-80 hover:opacity-100 transition-opacity">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
