import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, PlusCircle, Calendar, Building, ArrowRight, Zap, Search, Filter, FileText, Trash2, Save } from 'lucide-react';
import { safeConvertDate, formatCurrency } from '../utils';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import type { Application } from '../types';

interface DraftApplicationsProps {
  applications: Application[];
}

export const DraftApplications: React.FC<DraftApplicationsProps> = ({ applications }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter to show only draft applications
  const draftApplications = applications.filter(application => 
    application.status === 'draft'
  );

  // Filter by search term
  const filteredApplications = draftApplications.filter(app => 
    !searchTerm || 
    app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.loan_purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatApplicationNumber(app, app.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort drafts by date, most recent first
  const sortedDrafts = filteredApplications.sort((a, b) => 
    safeConvertDate(b.created_at).getTime() - safeConvertDate(a.created_at).getTime()
  );

  // Calculate stats
  const stats = {
    totalDrafts: draftApplications.length,
    autoFilled: draftApplications.filter(app => app.is_prefilled).length,
    manualDrafts: draftApplications.filter(app => !app.is_prefilled).length,
    totalValue: draftApplications.reduce((sum, app) => sum + (app.loan_amount || 0), 0),
  };

  if (draftApplications.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700">Total Drafts</div>
                <div className="text-2xl font-bold text-yellow-900">0</div>
              </div>
              <Edit3 className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">Auto-filled</div>
                <div className="text-2xl font-bold text-blue-900">0</div>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Manual</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
              </div>
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700">Total Value</div>
                <div className="text-2xl font-bold text-purple-900">£0</div>
              </div>
              <Save className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
            <Edit3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Draft Applications</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              You don't have any draft applications. Start creating your first application to connect with lenders.
            </p>
            <Button 
              onClick={() => navigate('/applications/new')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-700">Total Drafts</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.totalDrafts}</div>
            </div>
            <Edit3 className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Auto-filled</div>
              <div className="text-2xl font-bold text-blue-900">{stats.autoFilled}</div>
            </div>
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Manual</div>
              <div className="text-2xl font-bold text-gray-900">{stats.manualDrafts}</div>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">Total Value</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalValue)}</div>
            </div>
            <Save className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Draft Applications</h3>
          <p className="text-gray-600">Continue working on your incomplete applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drafts..."
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
            <h4 className="font-semibold text-white">Draft Applications</h4>
            <span className="text-sm text-slate-300">
              {sortedDrafts.length} draft{sortedDrafts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedDrafts.map((application) => (
            <div 
              key={application.id} 
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/applications/new?draft=${application.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header with status */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Draft
                    </div>
                    {application.is_prefilled && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-filled
                      </div>
                    )}
                  </div>
                  
                  {/* Application details */}
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">
                    Application #{formatApplicationNumber(application, application.id)}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Requested Amount</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(application.loan_amount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Purpose</div>
                      <div className="text-sm text-gray-900">{application.loan_purpose || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created</div>
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
          ))}
        </div>
      </div>
    </div>
  );
};
