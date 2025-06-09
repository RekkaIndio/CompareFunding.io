import PageLayout from "@/components/PageLayout";

export default function SitemapPage() {
  const sitemapRoutes = [
    { url: '/', title: 'Home', description: 'CompareFunding - Connect with the right lenders' },
    { url: '/for-businesses', title: 'For Businesses', description: 'Funding solutions for businesses' },
    { url: '/for-lenders', title: 'For Lenders', description: 'Partner with us as a lender' },
    { url: '/how-it-works', title: 'How It Works', description: 'Learn how our platform works' },
    { url: '/about', title: 'About Us', description: 'About CompareFunding' },
    { url: '/contact', title: 'Contact', description: 'Get in touch with us' },
    { url: '/products', title: 'Products', description: 'Our funding products and services' },
    { url: '/login', title: 'Login', description: 'Sign in to your account' },
    { url: '/signup', title: 'Sign Up', description: 'Create a new account' },
    { url: '/cookies', title: 'Cookie Policy', description: 'Our cookie policy' },
  ];

  const helpRoutes = [
    { url: '/help/business-insurance', title: 'Business Insurance', description: 'Information about business insurance' },
    { url: '/help/foreign-exchange', title: 'Foreign Exchange', description: 'Foreign exchange solutions' },
    { url: '/help/raising-equity', title: 'Raising Equity', description: 'Guide to raising equity' },
  ];

  const fundingRoutes = [
    { url: '/funding-options/cashflow', title: 'Cashflow Funding', description: 'Cashflow funding solutions' },
    { url: '/funding-options/asset-finance', title: 'Asset Finance', description: 'Asset financing options' },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 lg:p-12">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Site Map</h1>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Explore all pages and resources available on CompareFunding
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Main Pages */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-2">
                  Main Pages
                </h2>
                {sitemapRoutes.map((route) => (
                  <div key={route.url} className="group">
                    <a
                      href={route.url}
                      className="block p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {route.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{route.description}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{route.url}</span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Help Pages */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-2">
                  Help & Resources
                </h2>
                {helpRoutes.map((route) => (
                  <div key={route.url} className="group">
                    <a
                      href={route.url}
                      className="block p-4 rounded-lg border border-slate-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                    >
                      <h3 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                        {route.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{route.description}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{route.url}</span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Funding Options */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-2">
                  Funding Options
                </h2>
                {fundingRoutes.map((route) => (
                  <div key={route.url} className="group">
                    <a
                      href={route.url}
                      className="block p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                    >
                      <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {route.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{route.description}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{route.url}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* XML Sitemap Link */}
            <div className="mt-12 p-6 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">For Search Engines</h3>
              <p className="text-slate-600 mb-4">
                Looking for our XML sitemap for search engine indexing?
              </p>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View XML Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
