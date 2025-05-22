import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, BarChart3, TrendingUp, PoundSterling, Users } from 'lucide-react';

// Import your existing utility functions and hooks as needed

const LenderDashboardNew = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data - replace with your actual data fetching logic
  const stats = {
    prospects: 2,
    applications: {
      matched: 0,
      available: 2,
      total: 2
    },
    offers: {
      extended: 1,
      accepted: 0
    },
    totalFunded: 0
  };

  const recentApplications = [
    {
      id: '1',
      business: 'Business - £74,998',
      description: 'We would like purchase new machines for our expanding healthcare business',
      months: '12 months',
      isNew: true
    },
    {
      id: '2',
      business: 'Business - £25,000',
      description: 'jxfkuyfkuyfguygkuygiukyvg',
      months: '12 months',
      isNew: true
    }
  ];

  const conversionTrend = [
    { month: 'January', percentage: '10%' },
    { month: 'February', percentage: '15%' },
    { month: 'March', percentage: '20%' },
    { month: 'April', percentage: '25%' },
    { month: 'May', percentage: '30%' }
  ];

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Lender Dashboard</h1>
              <p className="text-slate-400">Welcome back, Lender</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-sm">
                  <span className="text-slate-400">Available Credits</span>
                  <div className="flex items-center">
                    <span className="font-semibold">25 credits</span>
                    <span className="text-slate-400 text-xs ml-2">£100 per credit</span>
                  </div>
                </div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 flex items-center">
                View Matched Applications
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-6">
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('overview')}
            >
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </div>
            </button>
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'applications' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('applications')}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Applications
              </div>
            </button>
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'offers' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('offers')}
            >
              <div className="flex items-center">
                <PoundSterling className="h-4 w-4 mr-2" />
                Offers
              </div>
            </button>
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'messages' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('messages')}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Messages
              </div>
            </button>
            <button 
              className={`px-4 py-2 mr-4 font-medium ${activeTab === 'feedback' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('feedback')}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Feedback
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards - using flex layout with equal width and proper spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* New Prospects Card */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <h3 className="text-sm font-medium text-slate-300 mb-1">New Prospects</h3>
                <p className="text-xs text-slate-400">Unviewed applications</p>
                <div className="mt-4 flex items-center">
                  <Users className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-2xl font-bold">{stats.prospects}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Needs your review</p>
              </div>

              {/* Applications Card */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <h3 className="text-sm font-medium text-slate-300 mb-1">Applications</h3>
                <p className="text-xs text-slate-400">Available opportunities</p>
                <div className="mt-4 flex items-center">
                  <FileText className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-2xl font-bold">{stats.applications.total}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {stats.applications.matched} matched · {stats.applications.available} available
                </p>
              </div>

              {/* Offers Extended Card */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <h3 className="text-sm font-medium text-slate-300 mb-1">Offers Extended</h3>
                <p className="text-xs text-slate-400">Conversion metrics</p>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-2xl font-bold">{stats.offers.extended}</span>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="bg-slate-700 h-1.5 rounded-full w-full mr-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-xs font-medium">0%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {stats.offers.accepted} offers accepted
                </p>
              </div>

              {/* Total Funded Card */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <h3 className="text-sm font-medium text-slate-300 mb-1">Total Funded</h3>
                <p className="text-xs text-slate-400">Accepted offers</p>
                <div className="mt-4 flex items-center">
                  <PoundSterling className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-2xl font-bold">{stats.totalFunded}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Across {stats.offers.accepted} accepted offers
                </p>
              </div>
            </div>

            {/* Monthly Report and Recent Applications - using grid for responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly Report */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300">Monthly Report</h3>
                    <p className="text-xs text-slate-400">Performance summary for May</p>
                  </div>
                  <button className="bg-slate-700 hover:bg-slate-600 rounded px-3 py-1.5 text-xs">
                    Export Report
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400">Monthly Prospects</p>
                    <p className="text-xl font-bold">{stats.prospects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Monthly Conversion</p>
                    <p className="text-xl font-bold">0%</p>
                  </div>
                </div>

                <div className="border-t border-slate-700 my-4"></div>

                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-2">Conversion Trend</p>
                  <div className="space-y-1">
                    {conversionTrend.map((item, index) => (
                      <div key={index} className="text-xs">
                        {item.month}: {item.percentage}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-slate-800 rounded-xl p-5 w-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300">Recent Applications</h3>
                    <p className="text-xs text-slate-400">Latest business financing needs matched to your criteria</p>
                  </div>
                  <button className="hover:underline text-xs text-blue-400">View All</button>
                </div>

                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center mb-1">
                            <p className="font-medium text-sm">{app.business}</p>
                            {app.isNew && (
                              <span className="ml-2 bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{app.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{app.months}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Metrics would go here if needed */}
          </div>
        )}

        {/* Other tabs would go here */}
      </div>
    </div>
  );
};

export default LenderDashboardNew;
