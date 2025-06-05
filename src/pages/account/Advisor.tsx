import React from 'react';
import PageLayout from '../../components/PageLayout';

const Advisor = () => {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-orange-900 to-red-900 text-white py-16 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Your Advisor
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
                Connect with experienced funding advisors to optimize your borrowing strategy
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Current Advisor */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Dedicated Advisor</h2>
              </div>
              <span className="px-4 py-2 bg-green-100 text-green-800 font-medium rounded-full">
                Available Now
              </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Advisor Profile */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
                      alt="Advisor"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">James Richardson</h3>
                  <p className="text-lg text-gray-600 mb-4">Senior Funding Advisor</p>
                  <div className="flex justify-center space-x-2 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">12+ years experience in business finance</p>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors">
                      Schedule Call
                    </button>
                    <button className="w-full px-4 py-3 border border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors">
                      Send Message
                    </button>
                  </div>
                </div>
              </div>

              {/* Advisor Details */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">Business Loans</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Asset Finance</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">Invoice Finance</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">Growth Capital</span>
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm font-medium rounded-full">Property Finance</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Achievements</h4>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">£2.8M secured for manufacturing client</p>
                          <p className="text-sm text-gray-600">Asset finance for equipment expansion</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">95% application success rate this quarter</p>
                          <p className="text-sm text-gray-600">Outstanding performance metrics</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Direct Line</p>
                          <p className="text-sm text-gray-600">020 7890 1234</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">james.r@comparefunding.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advisory Services */}
          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Advisory Services</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Funding Strategy Review</h3>
                  <p className="text-sm text-gray-600">Comprehensive analysis of your financing options and recommendations</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Application Support</h3>
                  <p className="text-sm text-gray-600">Guided assistance through the entire application process</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Lender Introductions</h3>
                  <p className="text-sm text-gray-600">Direct connections to preferred lenders in our network</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Ongoing Support</h3>
                  <p className="text-sm text-gray-600">Continued guidance throughout your funding journey</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Meetings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-semibold text-gray-900">Strategy Session</p>
                    <p className="text-sm text-gray-600">Tuesday, Dec 17 at 2:00 PM</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-semibold text-gray-900">Application Review</p>
                    <p className="text-sm text-gray-600">Friday, Dec 20 at 10:30 AM</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Scheduled
                  </span>
                </div>
                <div className="text-center py-8">
                  <button className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    Schedule New Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-600">Your business loan application has been submitted to 3 lenders</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Document Review Completed</p>
                  <p className="text-sm text-gray-600">James reviewed your financial documents and provided feedback</p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Strategy Session Scheduled</p>
                  <p className="text-sm text-gray-600">Next advisory meeting booked for December 17th</p>
                  <p className="text-xs text-gray-500 mt-1">3 days ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Lender Introduction</p>
                  <p className="text-sm text-gray-600">Introduction made to specialized asset finance provider</p>
                  <p className="text-xs text-gray-500 mt-1">1 week ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Advisor Performance */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <p className="text-sm font-medium text-green-600 mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-green-900">95%</p>
                <p className="text-sm text-green-700 mt-1">Last 12 months</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-sm font-medium text-blue-600 mb-2">Clients Served</p>
                <p className="text-3xl font-bold text-blue-900">147</p>
                <p className="text-sm text-blue-700 mt-1">This year</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-sm font-medium text-purple-600 mb-2">Funding Secured</p>
                <p className="text-3xl font-bold text-purple-900">£28M</p>
                <p className="text-sm text-purple-700 mt-1">Total this year</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <p className="text-sm font-medium text-orange-600 mb-2">Avg Response</p>
                <p className="text-3xl font-bold text-orange-900">2 hrs</p>
                <p className="text-sm text-orange-700 mt-1">Response time</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-lg">
              Book Consultation
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Change Advisor
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Advisor;
