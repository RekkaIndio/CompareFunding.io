import React from "react";
import PageLayout from '@/components/PageLayout';

const helpResources = [
  {
    title: "Getting Started",
    description: "New to Compare Funding? Learn how to set up your account, complete your profile, and start your funding journey.",
    icon: "🚀",
    links: [
      { label: "How to Create an Account", url: "#" },
      { label: "Completing Your Business Profile", url: "#" },
      { label: "Navigating the Dashboard", url: "#" },
    ],
  },
  {
    title: "Application & Offers",
    description: "Find answers about submitting applications, reviewing offers, and managing your funding process.",
    icon: "📄",
    links: [
      { label: "How to Submit a Funding Application", url: "#" },
      { label: "Understanding Offer Terms", url: "#" },
      { label: "Tracking Application Status", url: "#" },
    ],
  },
  {
    title: "Support & Contact",
    description: "Need more help? Access our support resources or get in touch with our team.",
    icon: "💬",
    links: [
      { label: "FAQs & Troubleshooting", url: "#" },
      { label: "Contact Support Team", url: "mailto:support@comparefunding.io" },
      { label: "Book a 1:1 Call", url: "#" },
    ],
  },
];

const featured = {
  title: "Featured: Live Chat Support",
  description: "Get instant answers to your questions with our live chat support. Our team is available to help you in real time during business hours.",
  image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  url: "#",
};

const HelpPage: React.FC = () => {
  return (
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2 text-fundhub-orange">How Can We Help?</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Find answers, get support, and connect with our team. We're here to help you succeed at every step of your funding journey.
          </p>
        </div>

        {/* Featured Support */}
        <div className="flex flex-col md:flex-row items-center bg-white rounded-xl shadow-lg mb-12 overflow-hidden">
          <img src={featured.image} alt="Featured Support" className="w-full md:w-1/3 h-48 object-cover md:h-64" />
          <div className="p-6 flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-fundhub-orange">{featured.title}</h2>
            <p className="mb-4 text-gray-700">{featured.description}</p>
            <a href={featured.url} className="inline-block bg-fundhub-orange text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 transition">Start Live Chat</a>
          </div>
        </div>

        {/* Help Resource Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {helpResources.map((section) => (
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
          <h2 className="text-2xl font-bold mb-2 text-fundhub-orange">Still Need Help?</h2>
          <p className="mb-4 text-lg text-slate-300">If you can't find what you're looking for, reach out to our support team for personalized assistance.</p>
          <a href="mailto:support@comparefunding.io" className="inline-block bg-fundhub-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition">Email Support</a>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpPage;
