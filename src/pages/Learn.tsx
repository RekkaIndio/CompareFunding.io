import React from "react";
import { BookOpen, TrendingUp, Users, Award, ArrowRight, Play, Download, Calendar } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const resources = [
  {
    title: "Funding Fundamentals",
    description: "Master the essentials of business finance with our comprehensive guides and expert insights.",
    icon: <BookOpen className="w-8 h-8 text-fundhub-orange" />,
    color: "from-orange-500 to-red-500",
    links: [
      { label: "Complete Guide to Business Funding Types", url: "#", difficulty: "Beginner" },
      { label: "Preparing Your Perfect Application", url: "#", difficulty: "Intermediate" },
      { label: "Understanding Interest Rates & Terms", url: "#", difficulty: "Beginner" },
      { label: "Funding Timeline & What to Expect", url: "#", difficulty: "Beginner" },
    ],
  },
  {
    title: "Credit & Financial Excellence",
    description: "Build and maintain a strong financial profile that attracts the best funding opportunities.",
    icon: <TrendingUp className="w-8 h-8 text-fundhub-orange" />,
    color: "from-blue-500 to-purple-500",
    links: [
      { label: "Business Credit Score Deep Dive", url: "#", difficulty: "Intermediate" },
      { label: "10 Proven Ways to Boost Your Credit", url: "#", difficulty: "Beginner" },
      { label: "Financial Health Checklist", url: "#", difficulty: "Beginner" },
      { label: "Common Credit Mistakes & How to Fix Them", url: "#", difficulty: "Advanced" },
    ],
  },
  {
    title: "Expert Resources & Tools",
    description: "Access premium content, interactive tools, and live expert sessions to accelerate your growth.",
    icon: <Users className="w-8 h-8 text-fundhub-orange" />,
    color: "from-green-500 to-teal-500",
    links: [
      { label: "Interactive Funding Calculator", url: "#", difficulty: "Tool" },
      { label: "Monthly Expert Webinars", url: "#", difficulty: "Live" },
      { label: "Industry Reports & Market Insights", url: "#", difficulty: "Advanced" },
      { label: "24/7 Support & FAQ Hub", url: "#", difficulty: "Support" },
    ],
  },
];

const featuredContent = [
  {
    type: "Guide",
    title: "The Complete Funding Comparison Framework",
    description: "Learn our proven 5-step methodology for evaluating and comparing funding offers. Used by 10,000+ successful businesses.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    duration: "15 min read",
    difficulty: "Intermediate",
    url: "#",
  },
  {
    type: "Video Course",
    title: "Funding Success Masterclass",
    description: "A comprehensive video series covering everything from application to approval. Featuring real case studies.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    duration: "2.5 hours",
    difficulty: "All Levels",
    url: "#",
  },
];

const stats = [
  { number: "10,000+", label: "Businesses Funded", icon: <Award className="w-6 h-6" /> },
  { number: "£500M+", label: "Total Funding Secured", icon: <TrendingUp className="w-6 h-6" /> },
  { number: "95%", label: "Success Rate", icon: <Users className="w-6 h-6" /> },
  { number: "48hrs", label: "Average Response Time", icon: <BookOpen className="w-6 h-6" /> },
];

const LearnPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section - OffersList inspired header */}
          <div className="relative mb-12">
            {/* Enhanced status indicator bar matching OffersList */}
            <div className="h-3 w-full bg-gradient-to-r from-fundhub-orange to-red-500 rounded-t-xl"></div>
            
            {/* Header with gradient background matching OffersList */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-b-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative px-8 py-16 text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-fundhub-orange via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Master Business Funding
                </h1>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                  Transform your business with expert knowledge, proven strategies, and cutting-edge tools. 
                  Join thousands of successful entrepreneurs who've mastered the art of funding.
                </p>
                
                {/* Stats with OffersList card styling */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  {stats.map((stat, index) => (
                    <div key={index} className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-slate-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                      {/* Status indicator bar */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-fundhub-orange to-red-500"></div>
                      <div className="p-6 text-center">
                        <div className="flex items-center justify-center mb-3 text-fundhub-orange">
                          {stat.icon}
                        </div>
                        <div className="text-3xl font-bold text-slate-800 mb-2">{stat.number}</div>
                        <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Content */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Featured Learning Resources</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Handpicked content to accelerate your funding journey</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredContent.map((content, index) => (
                <div key={index} className="group relative overflow-hidden bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  {/* Status indicator bar matching OffersList */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-fundhub-orange to-red-500"></div>
                  
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-gradient-to-br from-fundhub-orange/10 to-red-500/10 rounded-xl">
                        {content.type === "Video Course" ? (
                          <Play className="h-8 w-8 text-fundhub-orange" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-fundhub-orange" />
                        )}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-fundhub-orange to-red-500 text-white shadow-sm">
                        {content.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-fundhub-orange transition-colors">
                      {content.title}
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">{content.description}</p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {content.duration}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {content.difficulty}
                      </span>
                    </div>
                    
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-fundhub-orange to-red-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium">
                      Start Learning
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Categories */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">Learning Categories</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Explore comprehensive resources tailored to your business funding journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {resources.map((section, index) => (
                <div key={section.title} className="group relative overflow-hidden bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Status indicator bar matching OffersList */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${section.color}`}></div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-br from-fundhub-orange/10 to-red-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {section.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-6 leading-relaxed">{section.description}</p>
                    <div className="space-y-3">
                      {section.links.map((link, linkIndex) => (
                        <a 
                          key={linkIndex}
                          href={link.url} 
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-fundhub-orange/20 transition-all duration-300 group/link"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-gradient-to-r from-fundhub-orange to-red-500 rounded-full"></div>
                            <span className="font-medium text-slate-700 group-hover/link:text-fundhub-orange transition-colors">
                              {link.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-full">
                              {link.difficulty}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover/link:text-fundhub-orange group-hover/link:translate-x-1 transition-all" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Downloads */}
          <div className="mb-16">
            {/* Enhanced header matching OffersList */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-xl shadow-xl mb-12">
              <div className="h-1.5 w-full bg-gradient-to-r from-fundhub-orange to-red-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative px-8 py-12 text-center">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-fundhub-orange via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Free Resource Library
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Download our comprehensive guides, templates, and checklists to accelerate your funding journey
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Funding Application Template", description: "Professional template used by successful businesses", downloads: "2.3K" },
                { title: "Credit Improvement Checklist", description: "Step-by-step guide to boost your credit score", downloads: "1.8K" },
                { title: "Lender Comparison Spreadsheet", description: "Compare offers side-by-side with our tool", downloads: "3.1K" },
              ].map((resource, index) => (
                <div key={index} className="group relative overflow-hidden bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Status indicator bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-fundhub-orange to-red-500"></div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-fundhub-orange/10 to-red-500/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Download className="w-8 h-8 text-fundhub-orange" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xl group-hover:text-fundhub-orange transition-colors">{resource.title}</h3>
                    </div>
                    <p className="text-slate-600 mb-6 leading-relaxed">{resource.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 flex items-center gap-1 font-medium">
                        <Users className="w-4 h-4" />
                        {resource.downloads} downloads
                      </span>
                      <button className="px-6 py-3 bg-gradient-to-r from-fundhub-orange to-red-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium flex items-center gap-2">
                        Download
                        <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Call to Action */}
        <div className="text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black rounded-3xl"></div>
          <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-12 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-fundhub-orange to-red-500 bg-clip-text text-transparent">
                Ready to Take Action?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Apply your new knowledge and get personalized support from our funding experts. 
                Your success story starts here.
              </p>
            </div>
          {/* Call to Action */}
          <div className="text-center">
            {/* Enhanced CTA card matching OffersList */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-xl shadow-xl">
              <div className="h-1.5 w-full bg-gradient-to-r from-fundhub-orange to-red-500"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="relative px-8 py-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-fundhub-orange via-yellow-400 to-red-500 bg-clip-text text-transparent">
                  Ready to Take Action?
                </h2>
                <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Apply your new knowledge and get personalized support from our funding experts. 
                  Your success story starts here.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <a 
                    href="/applications/new" 
                    className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-fundhub-orange to-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 group"
                  >
                    Start Your Application
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a 
                    href="/help" 
                    className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group"
                  >
                    Get Expert Help
                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
};

export default LearnPage;
