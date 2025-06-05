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
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0">
        {/* Hero Section */}
        <div className="relative mb-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-fundhub-orange/10 to-fundhub-blue/10 rounded-3xl"></div>
          <div className="relative py-16 px-8">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-fundhub-orange to-fundhub-blue bg-clip-text text-transparent">
              Master Business Funding
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Transform your business with expert knowledge, proven strategies, and cutting-edge tools. 
              Join thousands of successful entrepreneurs who've mastered the art of funding.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-center mb-2 text-fundhub-orange">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Content */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-fundhub-orange">Featured Learning Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredContent.map((content, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                <div className="relative">
                  <img 
                    src={content.image} 
                    alt={content.title} 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-fundhub-orange text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {content.type}
                    </span>
                  </div>
                  {content.type === "Video Course" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-fundhub-orange" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{content.title}</h3>
                  <p className="text-gray-600 mb-4">{content.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {content.duration}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                      {content.difficulty}
                    </span>
                  </div>
                  <a 
                    href={content.url} 
                    className="flex items-center gap-2 bg-fundhub-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors group"
                  >
                    Start Learning
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-fundhub-orange">Learning Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((section, index) => (
              <div key={section.title} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    {section.icon}
                    <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{section.description}</p>
                  <div className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <a 
                        key={linkIndex}
                        href={link.url} 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group/link"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-fundhub-orange rounded-full"></div>
                          <span className="font-medium text-gray-900 group-hover/link:text-fundhub-orange transition-colors">
                            {link.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {link.difficulty}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover/link:text-fundhub-orange group-hover/link:translate-x-1 transition-all" />
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
        <div className="mb-16 bg-gradient-to-r from-fundhub-blue to-purple-600 rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Free Resource Library</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Download our comprehensive guides, templates, and checklists to accelerate your funding journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Funding Application Template", description: "Professional template used by successful businesses", downloads: "2.3K" },
              { title: "Credit Improvement Checklist", description: "Step-by-step guide to boost your credit score", downloads: "1.8K" },
              { title: "Lender Comparison Spreadsheet", description: "Compare offers side-by-side with our tool", downloads: "3.1K" },
            ].map((resource, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <Download className="w-6 h-6" />
                  <h3 className="font-bold">{resource.title}</h3>
                </div>
                <p className="text-sm opacity-80 mb-4">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-70">{resource.downloads} downloads</span>
                  <button className="bg-white text-fundhub-blue px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold mb-4 text-fundhub-orange">Ready to Take Action?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Apply your new knowledge and get personalized support from our funding experts. 
            Your success story starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/applications/new" 
              className="inline-flex items-center gap-2 bg-fundhub-orange text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="/help" 
              className="inline-flex items-center gap-2 bg-fundhub-blue text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Expert Help
              <Users className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LearnPage;
