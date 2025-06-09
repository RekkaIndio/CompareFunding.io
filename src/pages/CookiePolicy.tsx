import PageLayout from "@/components/PageLayout";

export default function CookiePolicy() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 lg:p-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Cookie Policy</h1>
              <p className="text-slate-600 text-lg">
                Last updated: June 9, 2025
              </p>
            </div>

            <div className="prose prose-slate max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">What Are Cookies</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                  They are widely used to make websites work more efficiently and to provide information to website owners.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  CompareFunding uses cookies to enhance your experience, analyze website traffic, and provide personalized 
                  content and advertisements.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Cookies</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  We use cookies for various purposes, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>To remember your preferences and settings</li>
                  <li>To authenticate and secure your account</li>
                  <li>To analyze website performance and usage patterns</li>
                  <li>To provide personalized content and recommendations</li>
                  <li>To improve our services and user experience</li>
                  <li>To display relevant advertisements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Types of Cookies We Use</h2>
                
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Essential Cookies</h3>
                    <p className="text-slate-700 leading-relaxed">
                      These cookies are necessary for the website to function properly. They enable basic features 
                      like page navigation, access to secure areas, and authentication. The website cannot function 
                      properly without these cookies.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Performance Cookies</h3>
                    <p className="text-slate-700 leading-relaxed">
                      These cookies collect information about how visitors use our website, such as which pages are 
                      visited most often and if users receive error messages. This information helps us improve 
                      website performance and user experience.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Functional Cookies</h3>
                    <p className="text-slate-700 leading-relaxed">
                      These cookies allow the website to remember choices you make and provide enhanced, more 
                      personalized features. They may be set by us or by third-party providers whose services 
                      we have added to our pages.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Targeting/Advertising Cookies</h3>
                    <p className="text-slate-700 leading-relaxed">
                      These cookies are used to deliver advertisements that are more relevant to you and your interests. 
                      They also help limit the number of times you see an advertisement and measure the effectiveness 
                      of advertising campaigns.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Third-Party Cookies</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Some cookies on our website are set by third-party services that appear on our pages. These may include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Google Analytics:</strong> Used to analyze website traffic and user behavior</li>
                  <li><strong>Social Media Platforms:</strong> For social sharing features and embedded content</li>
                  <li><strong>Authentication Services:</strong> For secure login and account management</li>
                  <li><strong>Payment Processors:</strong> For secure payment processing</li>
                  <li><strong>Customer Support Tools:</strong> For chat and support functionality</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Managing Your Cookie Preferences</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You have several options for managing cookies:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 mb-3">Browser Settings</h3>
                    <p className="text-orange-800 leading-relaxed">
                      Most web browsers allow you to control cookies through their settings. You can typically 
                      block all cookies, allow only first-party cookies, or delete existing cookies. Note that 
                      blocking cookies may affect website functionality.
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Cookie Consent Manager</h3>
                    <p className="text-blue-800 leading-relaxed">
                      When you first visit our website, you'll see a cookie consent banner where you can choose 
                      which types of cookies to accept. You can change your preferences at any time by accessing 
                      the cookie settings in the website footer.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Cookie Retention</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Cookies have different lifespans:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until manually deleted</li>
                  <li><strong>Authentication Cookies:</strong> Typically expire after 30 days of inactivity</li>
                  <li><strong>Analytics Cookies:</strong> Usually expire after 2 years</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibant text-slate-900 mb-4">Updates to This Policy</h2>
                <p className="text-slate-700 leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                  other operational, legal, or regulatory reasons. We will notify you of any material changes by 
                  posting the updated policy on our website with a revised "last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Us</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  If you have any questions about this Cookie Policy or our use of cookies, please contact us:
                </p>
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="space-y-3">
                    <p className="text-slate-700">
                      <strong>Email:</strong> hello@comparefunding.io
                    </p>
                    <p className="text-slate-700">
                      <strong>Phone:</strong> +44 20 7946 0958
                    </p>
                    <p className="text-slate-700">
                      <strong>Address:</strong> 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ
                    </p>
                  </div>
                </div>
              </section>

              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200 mt-8">
                <p className="text-orange-800 text-sm leading-relaxed">
                  <strong>Note:</strong> This Cookie Policy is part of our overall Privacy Policy. 
                  For information about how we collect, use, and protect your personal data, 
                  please review our complete Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
