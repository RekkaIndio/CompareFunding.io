import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, PlusCircle, Calendar, Building, ArrowRight, Search, Filter, FileText, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { safeConvertDate, formatCurrency, getApplicationStatusStyling, calculateMonthlyPayment, calculateTotalCost, calculateTotalInterest } from '../utils';
import { formatApplicationTitle } from '@/lib/applicationUtils';
import type { Application } from '../types';

interface ActiveApplicationsProps {
  applications: Application[];
}

export const ActiveApplications: React.FC<ActiveApplicationsProps> = ({ applications }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter to show submitted and under review applications (without offers yet)
  const activeApplications = applications.filter(application => {
    const status = application.status?.toLowerCase?.();
    return ['submitted', 'under_review', 'documents_requested'].includes(status);
  });

  // Filter by search term
  const filteredApplications = activeApplications.filter(app => 
    !searchTerm || 
    app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.loan_purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatApplicationTitle(app, app.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedApplications = filteredApplications.sort((a, b) => 
    safeConvertDate(b.created_at).getTime() - safeConvertDate(a.created_at).getTime()
  );

  // Calculate stats
  const stats = {
    submitted: activeApplications.filter(app => app.status?.toLowerCase() === 'submitted').length,
    underReview: activeApplications.filter(app => app.status?.toLowerCase() === 'under_review').length,
    documentsRequested: activeApplications.filter(app => app.status?.toLowerCase() === 'documents_requested').length,
    totalValue: activeApplications.reduce((sum, app) => sum + (app.loan_amount || 0), 0),
  };

  if (activeApplications.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">Submitted</div>
                <div className="text-2xl font-bold text-blue-900">0</div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700">Under Review</div>
                <div className="text-2xl font-bold text-orange-900">0</div>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700">Docs Requested</div>
                <div className="text-2xl font-bold text-yellow-900">0</div>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700">Total Value</div>
                <div className="text-2xl font-bold text-purple-900">£0</div>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Applications</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              You don't have any submitted applications currently being processed.
            </p>
            <Button 
              onClick={() => navigate('/applications/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Submitted</div>
              <div className="text-2xl font-bold text-blue-900">{stats.submitted}</div>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-orange-700">Under Review</div>
              <div className="text-2xl font-bold text-orange-900">{stats.underReview}</div>
            </div>
            <Eye className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-700">Docs Requested</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.documentsRequested}</div>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">Total Value</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalValue)}</div>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Active Applications</h3>
          <p className="text-gray-600">Applications currently being processed by lenders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Active Applications</h4>
            <span className="text-sm text-slate-300">
              {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedApplications.map((application) => {
            const statusStyling = getApplicationStatusStyling(application.status);
            
            return (
              <div 
                key={application.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/applications/${application.id}/review`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyling.bgClass} ${statusStyling.textClass}`}>
                        {statusStyling.label}
                      </div>
                    </div>
                    
                    {/* Application details */}
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">
                      {formatApplicationTitle(application, application.id)}
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Requested Amount</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(application.loan_amount)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Purpose</div>
                        <div className="text-sm text-gray-900">{application.loan_purpose || 'Business funding'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Submitted</div>
                        <div className="text-sm text-gray-900">{safeConvertDate(application.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <div className="ml-6">
                    <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
