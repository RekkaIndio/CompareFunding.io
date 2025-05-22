import React from "react";


import PageLayout from '@/components/PageLayout';

const resources = [
  {
    title: "Funding Basics",
    description: "Understand the core concepts of business funding, from types of products to application tips.",
    icon: "💡",
    links: [
      { label: "Types of Business Funding", url: "#" },
      { label: "Preparing for a Funding Application", url: "#" },
      { label: "Interest Rates & Terms Explained", url: "#" },
    ],
  },
  {
    title: "Credit & Financial Health",
    description: "Learn how your business credit score works and how to improve your financial profile.",
    icon: "📈",
    links: [
      { label: "How Business Credit Scores Are Calculated", url: "#" },
      { label: "Tips to Improve Your Credit Score", url: "#" },
      { label: "Common Mistakes to Avoid", url: "#" },
    ],
  },
  {
    title: "Useful Resources",
    description: "Explore guides, webinars, and support to help you make informed decisions.",
    icon: "🛠️",
    links: [
      { label: "External Guides & Articles", url: "#" },
      { label: "Upcoming Webinars & Workshops", url: "#" },
      { label: "FAQs & Support", url: "#" },
    ],
  },
];

const featured = {
  title: "Featured Guide: How to Compare Funding Offers",
  description: "Learn how to evaluate and compare funding offers from different lenders, so you can choose the best option for your business.",
  image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  url: "#",
};

const LearnPage: React.FC = () => {
  return (
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2 text-fundhub-orange">Learning & Resources</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Empower your business with knowledge. Explore guides, tips, and tools to help you make smarter financial decisions and grow with confidence.
          </p>
        </div>

        {/* Featured Guide */}
        <div className="flex flex-col md:flex-row items-center bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
          <img src={featured.image} alt="Featured Guide" className="w-full md:w-1/3 h-48 object-cover md:h-64" />
          <div className="p-6 flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-fundhub-orange">{featured.title}</h2>
            <p className="mb-4 text-gray-700">{featured.description}</p>
            <a href={featured.url} className="inline-block bg-fundhub-orange text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 transition">Read Guide</a>
          </div>
        </div>

        {/* Resource Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {resources.map((section) => (
            <div key={section.title} className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
              <div className="text-3xl mb-3">{section.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-fundhub-orange">{section.title}</h3>
              <p className="mb-4 text-gray-600">{section.description}</p>
              <ul className="space-y-2 w-full">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.url} className="text-fundhub-blue hover:underline font-medium flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-fundhub-blue rounded-full"></span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-2 text-fundhub-orange">Have Questions or Need Help?</h2>
          <p className="mb-4 text-lg text-slate-300">Our team is here to support your funding journey. Explore our FAQs or contact us for personalized guidance.</p>
          <a href="/help" className="inline-block bg-fundhub-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition">Visit Help Center</a>
        </div>
      </div>
    </PageLayout>
  );
};

export default LearnPage;
