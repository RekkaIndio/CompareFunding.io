import React, { useState } from 'react';
import PageLayout from '../../components/PageLayout';

const Advisor = () => {
  const [hasAdvisor, setHasAdvisor] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

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
                Invite an Advisor
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
                Get expert help managing your funding profile and applications
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {!hasAdvisor ? (
            <>
              {/* No Advisor State */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">No Advisor Assigned</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Invite a trusted advisor to help manage your funding profile, applications, and connect you with the right lenders for your business needs.
                </p>
                <button 
                  onClick={() => setShowInviteForm(true)}
                  className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
                >
                  Invite an Advisor
                </button>
              </div>

              {/* Benefits Section */}
              <div className="grid lg:grid-cols-3 gap-8 mb-12">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Expert Application Management</h3>
                  <p className="text-gray-600">
                    Your advisor will handle all funding applications, ensuring they're completed accurately and submitted to the right lenders.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Faster Approval Times</h3>
                  <p className="text-gray-600">
                    Leverage your advisor's relationships with lenders and expertise to get faster decisions on your funding applications.
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Better Funding Terms</h3>
                  <p className="text-gray-600">
                    Get access to exclusive rates and terms through your advisor's network of preferred lending partners.
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
                  <p className="text-lg text-gray-600">Simple steps to get your advisor onboard</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-600">1</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Send Invitation</h3>
                    <p className="text-gray-600">Enter your advisor's email address and send them an invitation to manage your profile.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-600">2</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Advisor Accepts</h3>
                    <p className="text-gray-600">Your advisor receives the invitation and accepts to start managing your funding journey.</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-600">3</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Expert Help</h3>
                    <p className="text-gray-600">Your advisor can now manage applications, communicate with lenders, and optimize your profile.</p>
                  </div>
                </div>
              </div>

              {/* Invitation Form Modal */}
              {showInviteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Invite Advisor</h3>
                      <button
                        onClick={() => setShowInviteForm(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <form className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advisor's Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="advisor@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advisor's Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="John Smith"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Personal Message (Optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Hi John, I'd like to invite you to manage my funding profile on Compare Funding..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Send Invitation
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInviteForm(false)}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Advisor Assigned State would go here */
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Advisor Management</h2>
              <p className="text-gray-600">Your advisor is managing your profile.</p>
            </div>
          )}

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-gray-600">Common questions about advisor invitations</p>
            </div>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What access will my advisor have?</h3>
                <p className="text-gray-600">
                  Your advisor will be able to view and manage your funding applications, communicate with lenders on your behalf, 
                  update your business profile, and access application status updates. They cannot make financial transactions or 
                  access sensitive personal data without explicit permission.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I remove an advisor later?</h3>
                <p className="text-gray-600">
                  Yes, you can revoke advisor access at any time from your account settings. You'll also be able to 
                  invite a different advisor if needed. All advisor actions are logged for your records.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a cost for advisor management?</h3>
                <p className="text-gray-600">
                  There's no additional cost for the advisor invitation feature. However, your advisor may charge 
                  their own fees for their services, which should be agreed upon directly between you and them.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What if my advisor doesn't accept the invitation?</h3>
                <p className="text-gray-600">
                  Invitations expire after 7 days. You can resend invitations or invite a different advisor. 
                  You'll receive notifications about the status of your invitation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Advisor;
