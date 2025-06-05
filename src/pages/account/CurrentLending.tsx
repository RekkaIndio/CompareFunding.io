import React from 'react';
import PageLayout from '../../components/PageLayout';

const CurrentLending = () => {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-green-900 to-teal-900 text-white py-16 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Current Lending
              </h1>
              <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
                Monitor your active loans and repayment schedules in one place
              </p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">£85,000</h3>
              <p className="text-sm text-gray-600">Total Outstanding</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm text-blue-600 font-medium">Monthly</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">£4,250</h3>
              <p className="text-sm text-gray-600">Next Payment</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-sm text-purple-600 font-medium">Due</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Dec 15</h3>
              <p className="text-sm text-gray-600">Next Due Date</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-sm text-orange-600 font-medium">Rate</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">6.5%</h3>
              <p className="text-sm text-gray-600">Avg Interest</p>
            </div>
          </div>

          {/* Active Loans */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Loans</h2>
            <div className="space-y-6">
              {/* Loan 1 */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Business Term Loan</h3>
                      <p className="text-sm text-gray-600">Santander Business Finance</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Current
                  </span>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Original Amount</p>
                    <p className="text-lg font-semibold text-gray-900">£50,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                    <p className="text-lg font-semibold text-gray-900">£35,400</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
                    <p className="text-lg font-semibold text-gray-900">5.9%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                    <p className="text-lg font-semibold text-gray-900">£1,850</p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">29% paid</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '29%' }}></div>
                  </div>
                </div>
              </div>

              {/* Loan 2 */}
              <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Asset Finance</h3>
                      <p className="text-sm text-gray-600">Close Brothers Asset Finance</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Current
                  </span>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Original Amount</p>
                    <p className="text-lg font-semibold text-gray-900">£75,000</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                    <p className="text-lg font-semibold text-gray-900">£49,600</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
                    <p className="text-lg font-semibold text-gray-900">7.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                    <p className="text-lg font-semibold text-gray-900">£2,400</p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">34% paid</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '34%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Calendar */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Payments</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Business Term Loan</p>
                    <p className="text-sm text-gray-600">Due Dec 15, 2024</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">£1,850</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Asset Finance</p>
                    <p className="text-sm text-gray-600">Due Dec 20, 2024</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-purple-600">£2,400</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
              Make Payment
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Download Statement
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CurrentLending;
