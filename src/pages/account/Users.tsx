import React from 'react';
import PageLayout from '../../components/PageLayout';

const Users = () => {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-cyan-900 to-blue-900 text-white py-16 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                User Management
              </h1>
              <p className="text-xl md:text-2xl text-cyan-100 max-w-3xl mx-auto">
                Manage team access and permissions for your business account
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Add User Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Invite New User</h2>
              </div>
              <button className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                Send Invitation
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                  <option>Finance</option>
                  <option>Operations</option>
                  <option>Management</option>
                  <option>HR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Users */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-12">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Team Members (5)</h2>
                </div>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Export List
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Bulk Actions
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                {/* User 1 - Admin */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-6">
                      JD
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">John Davis</h3>
                      <p className="text-sm text-gray-600">john.davis@company.com</p>
                      <div className="flex items-center mt-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3">
                          Admin
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mr-3">
                          Active
                        </span>
                        <span className="text-sm text-gray-500">Finance Department</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* User 2 - Editor */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-6">
                      SM
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sarah Mitchell</h3>
                      <p className="text-sm text-gray-600">sarah.mitchell@company.com</p>
                      <div className="flex items-center mt-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mr-3">
                          Editor
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mr-3">
                          Active
                        </span>
                        <span className="text-sm text-gray-500">Operations</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* User 3 - Viewer */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-6">
                      MB
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Michael Brown</h3>
                      <p className="text-sm text-gray-600">michael.brown@company.com</p>
                      <div className="flex items-center mt-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full mr-3">
                          Viewer
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mr-3">
                          Active
                        </span>
                        <span className="text-sm text-gray-500">Management</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* User 4 - Pending */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-6">
                      LJ
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Lisa Johnson</h3>
                      <p className="text-sm text-gray-600">lisa.johnson@company.com</p>
                      <div className="flex items-center mt-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mr-3">
                          Editor
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full mr-3">
                          Pending
                        </span>
                        <span className="text-sm text-gray-500">HR Department</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full hover:bg-yellow-200 transition-colors">
                      Resend Invite
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* User 5 - Inactive */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 opacity-75">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-slate-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-6">
                      RW
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-500">Robert Wilson</h3>
                      <p className="text-sm text-gray-400">robert.wilson@company.com</p>
                      <div className="flex items-center mt-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full mr-3">
                          Viewer
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full mr-3">
                          Inactive
                        </span>
                        <span className="text-sm text-gray-400">Finance Department</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full hover:bg-green-200 transition-colors">
                      Reactivate
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Overview */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Role Permissions</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Admin</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Full system access
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    User management
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Financial settings
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Export data
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Editor</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Edit applications
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Upload documents
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Contact lenders
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View reports
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Viewer</h3>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View applications
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View documents
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View dashboards
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Export basic reports
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors shadow-lg">
              Manage Permissions
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Download User Report
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Users;
