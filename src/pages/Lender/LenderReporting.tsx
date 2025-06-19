import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  PoundSterling, 
  Calendar,
  Download,
  Filter,
  Search,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  PieChart,
  Activity,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  MapPin,
  Briefcase,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getDocuments, getLenderApplications } from '@/firebase';
import { toast } from 'sonner';
import { formatAddress, getBusinessDisplayName } from '@/lib/formatters';

// Types for reporting data
interface ReportingStats {
  totalApplicationsViewed: number;
  totalApplicationsMatched: number;
  totalOffersExtended: number;
  totalOffersAccepted: number;
  totalFundingDeployed: number;
  conversionRate: number;
  averageOfferAmount: number;
  averageApplicationAmount: number;
  activeLoans: number;
  pendingApplications: number;
  monthlyVolume: Array<{ month: string; applications: number; offers: number; funded: number }>;
  industryBreakdown: Array<{ industry: string; count: number; funded: number }>;
  loanTypeBreakdown: Array<{ type: string; count: number; totalAmount: number }>;
  creditUtilization: {
    used: number;
    total: number;
    percentage: number;
  };
  performanceMetrics: {
    responseTime: number;
    approvalRate: number;
    portfolioValue: number;
    roi: number;
  };
}

const LenderReporting = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('last-3-months');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch lender profile
  const { data: lenderProfile } = useQuery({
    queryKey: ['lenderProfile', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocument('lender_profiles', user?.uid);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch billing data
  const { data: billingData } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocument('lender_billing', user?.uid);
      if (error) {
        return {
          subscription_plan: 'free',
          total_credits: 25,
          credits_used: 0,
          credits_balance: 25,
        };
      }
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch applications data
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['lenderApplications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      const { data, error } = await getLenderApplications(user.uid);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch offers data
  const { data: offersData } = useQuery({
    queryKey: ['lenderOffers', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocuments('offers', 
        [{ field: 'lender_id', operator: '==', value: user?.uid }]
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Calculate reporting statistics
  const calculateStats = (): ReportingStats => {
    const applications = applicationsData || [];
    const offers = offersData || [];
    
    const matchedApplications = applications.filter(app => app.isMatched);
    const acceptedOffers = offers.filter(offer => offer.status === 'accepted');
    const totalFunded = acceptedOffers.reduce((sum, offer) => sum + (offer.loan_amount || 0), 0);
    
    // Industry breakdown
    const industryMap = new Map();
    applications.forEach(app => {
      const industry = app.business?.industry_sector || 'Other';
      const current = industryMap.get(industry) || { count: 0, funded: 0 };
      current.count++;
      if (app.has_accepted_offer) {
        current.funded += app.loan_amount || 0;
      }
      industryMap.set(industry, current);
    });
    
    // Loan type breakdown
    const loanTypeMap = new Map();
    applications.forEach(app => {
      const type = app.loan_type || 'Business Loan';
      const current = loanTypeMap.get(type) || { count: 0, totalAmount: 0 };
      current.count++;
      current.totalAmount += app.loan_amount || 0;
      loanTypeMap.set(type, current);
    });

    // Monthly volume (last 6 months)
    const monthlyVolume = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.application_date || app.created_at);
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
      });
      
      const monthOffers = offers.filter(offer => {
        const offerDate = new Date(offer.created_at);
        return offerDate.getMonth() === date.getMonth() && offerDate.getFullYear() === date.getFullYear();
      });
      
      const monthFunded = monthOffers.filter(offer => offer.status === 'accepted').length;
      
      monthlyVolume.push({
        month: monthName,
        applications: monthApplications.length,
        offers: monthOffers.length,
        funded: monthFunded
      });
    }

    return {
      totalApplicationsViewed: applications.length,
      totalApplicationsMatched: matchedApplications.length,
      totalOffersExtended: offers.length,
      totalOffersAccepted: acceptedOffers.length,
      totalFundingDeployed: totalFunded,
      conversionRate: applications.length > 0 ? (acceptedOffers.length / applications.length) * 100 : 0,
      averageOfferAmount: offers.length > 0 ? offers.reduce((sum, offer) => sum + (offer.loan_amount || 0), 0) / offers.length : 0,
      averageApplicationAmount: applications.length > 0 ? applications.reduce((sum, app) => sum + (app.loan_amount || 0), 0) / applications.length : 0,
      activeLoans: acceptedOffers.length,
      pendingApplications: applications.filter(app => app.status === 'pending' || app.status === 'under_review').length,
      monthlyVolume,
      industryBreakdown: Array.from(industryMap.entries()).map(([industry, data]) => ({
        industry,
        count: data.count,
        funded: data.funded
      })),
      loanTypeBreakdown: Array.from(loanTypeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        totalAmount: data.totalAmount
      })),
      creditUtilization: {
        used: billingData?.credits_used || 0,
        total: billingData?.total_credits || 25,
        percentage: billingData?.total_credits ? ((billingData.credits_used || 0) / billingData.total_credits) * 100 : 0
      },
      performanceMetrics: {
        responseTime: 2.4, // Average days - could be calculated from actual data
        approvalRate: applications.length > 0 ? (acceptedOffers.length / applications.length) * 100 : 0,
        portfolioValue: totalFunded,
        roi: 12.5 // This would be calculated from actual loan performance data
      }
    };
  };

  const stats = calculateStats();

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      generated: new Date().toISOString(),
      lender: lenderProfile?.lender_name || 'Unknown Lender',
      stats
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `lender-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Report exported successfully');
  };

  if (applicationsLoading) {
    return (
      <PageLayout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-[#ff8000]" />
            <span className="text-lg text-[#212936]">Loading reporting data...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container px-6 py-8 mx-auto space-y-8">
          {/* Enhanced Header Section - Matching Dashboard Style */}
          <div className="relative mb-8">
            {/* Enhanced status indicator bar matching OffersList */}
            <div className="h-3 w-full bg-gradient-to-r from-[#ff8000] to-[#ffaa00] rounded-t-xl"></div>
            
            {/* Header with gradient background matching site style */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-b-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-full opacity-50"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#ff8000]/10 to-[#ffaa00]/10 rounded-full opacity-40"></div>
              
              <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-white mb-3">Reporting & Analytics</h1>
                    <p className="text-white/90 text-lg">
                      Comprehensive insights into your lending performance and portfolio
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                        <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                        <SelectItem value="all-time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={exportReport} 
                      variant="secondary"
                      className="bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators - Enhanced Dashboard Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
              <div className="pt-6 px-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <PoundSterling className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Total Funding Deployed</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      £{stats.totalFundingDeployed.toLocaleString()}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Across {stats.totalOffersAccepted} loans
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
              <div className="pt-6 px-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <Target className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {stats.conversionRate.toFixed(1)}%
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.totalOffersAccepted} of {stats.totalApplicationsViewed} applications
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
              <div className="pt-6 px-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <Activity className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Active Portfolio</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {stats.activeLoans}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      £{stats.averageOfferAmount.toLocaleString()} avg loan size
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
              <div className="pt-6 px-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <CreditCard className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Credit Utilization</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {stats.creditUtilization.percentage.toFixed(0)}%
                    </h3>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(stats.creditUtilization.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {stats.creditUtilization.used} of {stats.creditUtilization.total} credits used
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs Navigation - Dashboard Style */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="border-b border-slate-200/50">
                <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0 rounded-none">
                  <TabsTrigger 
                    value="overview"
                    className="flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8000] data-[state=active]:text-[#212936] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000]/5 data-[state=active]:to-[#212936]/5 text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="applications"
                    className="flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8000] data-[state=active]:text-[#212936] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000]/5 data-[state=active]:to-[#212936]/5 text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  >
                    <Users className="h-4 w-4" />
                    Applications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="portfolio"
                    className="flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8000] data-[state=active]:text-[#212936] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000]/5 data-[state=active]:to-[#212936]/5 text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  >
                    <PieChart className="h-4 w-4" />
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance"
                    className="flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8000] data-[state=active]:text-[#212936] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000]/5 data-[state=active]:to-[#212936]/5 text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insights"
                    className="flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 rounded-none border-b-2 border-transparent data-[state=active]:border-[#ff8000] data-[state=active]:text-[#212936] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000]/5 data-[state=active]:to-[#212936]/5 text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  >
                    <Eye className="h-4 w-4" />
                    Insights
                  </TabsTrigger>
                </TabsList>
              </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Volume Chart */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Monthly Activity</h3>
                        <p className="text-sm text-slate-300">Applications, offers, and funding over time</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.monthlyVolume.map((month, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-[#212936]">{month.month}</span>
                            <span className="text-slate-600">
                              {month.applications} apps • {month.offers} offers • {month.funded} funded
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] h-3 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${month.applications > 0 ? (month.funded / month.applications) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
                        <p className="text-sm text-slate-300">Key performance indicators</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#212936]">Response Time</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-600" />
                        <span className="font-semibold text-[#212936]">{stats.performanceMetrics.responseTime} days</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#212936]">Approval Rate</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-[#212936]">{stats.performanceMetrics.approvalRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#212936]">Portfolio Value</span>
                      <div className="flex items-center gap-2">
                        <PoundSterling className="h-4 w-4 text-slate-600" />
                        <span className="font-semibold text-[#212936]">£{stats.performanceMetrics.portfolioValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#212936]">ROI</span>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-slate-600" />
                        <span className="font-semibold text-[#212936]">{stats.performanceMetrics.roi}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="text-2xl font-bold text-[#212936]">{stats.totalApplicationsViewed}</div>
                  <div className="text-sm text-slate-600">Applications Viewed</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="text-2xl font-bold text-[#212936]">{stats.totalOffersExtended}</div>
                  <div className="text-sm text-slate-600">Offers Extended</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="text-2xl font-bold text-[#212936]">{stats.pendingApplications}</div>
                  <div className="text-sm text-slate-600">Pending Review</div>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="text-2xl font-bold text-[#212936]">£{stats.averageApplicationAmount.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Avg Application Size</div>
                </div>
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Industry Breakdown</h3>
                        <p className="text-sm text-slate-300">Applications by industry sector</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {stats.industryBreakdown.map((industry, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[#212936]">{industry.industry}</span>
                              <span className="text-sm text-slate-600">{industry.count} apps</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] h-3 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${stats.totalApplicationsViewed > 0 ? (industry.count / stats.totalApplicationsViewed) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loan Type Breakdown */}
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Loan Type Analysis</h3>
                        <p className="text-sm text-slate-300">Distribution by loan type</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {stats.loanTypeBreakdown.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[#212936]">{type.type}</span>
                              <span className="text-sm text-slate-600">
                                {type.count} apps • £{type.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${stats.totalApplicationsViewed > 0 ? (type.count / stats.totalApplicationsViewed) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Pipeline */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-[#212936]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff8000] rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Application Pipeline</h3>
                      <p className="text-sm text-slate-300">Current status of all applications in your pipeline</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalApplicationsViewed}</div>
                      <div className="text-sm text-slate-600">Total Viewed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalApplicationsMatched}</div>
                      <div className="text-sm text-slate-600">Matched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{stats.totalOffersExtended}</div>
                      <div className="text-sm text-slate-600">Offers Extended</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalOffersAccepted}</div>
                      <div className="text-sm text-slate-600">Offers Accepted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-600">{stats.pendingApplications}</div>
                      <div className="text-sm text-slate-600">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <PoundSterling className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Portfolio Summary</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-[#212936]">£{stats.totalFundingDeployed.toLocaleString()}</div>
                      <div className="text-sm text-slate-600">Total Deployed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">{stats.activeLoans}</div>
                      <div className="text-sm text-slate-600">Active Loans</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">£{stats.averageOfferAmount.toLocaleString()}</div>
                      <div className="text-sm text-slate-600">Average Loan Size</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Percent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Risk Metrics</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.performanceMetrics.roi}%</div>
                      <div className="text-sm text-slate-600">Return on Investment</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">0.8%</div>
                      <div className="text-sm text-slate-600">Default Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">AA-</div>
                      <div className="text-sm text-slate-600">Portfolio Rating</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Performance</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-[#212936]">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-slate-600">Conversion Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">{stats.performanceMetrics.responseTime} days</div>
                      <div className="text-sm text-slate-600">Avg Response Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#212936]">95%</div>
                      <div className="text-sm text-slate-600">Client Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-[#212936]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff8000] rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Recent Portfolio Activity</h3>
                      <p className="text-sm text-slate-300">Latest updates from your active loans</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center justify-between p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-[#212936]">Payment received from TechCorp Ltd</div>
                            <div className="text-sm text-slate-600">Loan #12345 • £2,500 monthly payment</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">2 hours ago</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Conversion Funnel</h3>
                        <p className="text-sm text-slate-300">Track your application to funding conversion</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { stage: 'Applications Viewed', count: stats.totalApplicationsViewed, percentage: 100 },
                      { stage: 'Applications Matched', count: stats.totalApplicationsMatched, percentage: (stats.totalApplicationsMatched / Math.max(stats.totalApplicationsViewed, 1)) * 100 },
                      { stage: 'Offers Extended', count: stats.totalOffersExtended, percentage: (stats.totalOffersExtended / Math.max(stats.totalApplicationsViewed, 1)) * 100 },
                      { stage: 'Offers Accepted', count: stats.totalOffersAccepted, percentage: (stats.totalOffersAccepted / Math.max(stats.totalApplicationsViewed, 1)) * 100 }
                    ].map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-[#212936]">{stage.stage}</span>
                          <span className="text-sm text-slate-600">
                            {stage.count} ({stage.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Efficiency Metrics</h3>
                        <p className="text-sm text-slate-300">Your operational performance metrics</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#212936]">Average Decision Time</div>
                        <div className="text-sm text-slate-600">Time to make offer decisions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#212936]">1.8</div>
                        <div className="text-sm text-slate-600">days</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#212936]">Credit Efficiency</div>
                        <div className="text-sm text-slate-600">Credits per successful funding</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#212936]">3.2</div>
                        <div className="text-sm text-slate-600">credits</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#212936]">Success Rate</div>
                        <div className="text-sm text-slate-600">Accepted offers vs extended</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#212936]">
                          {stats.totalOffersExtended > 0 ? ((stats.totalOffersAccepted / stats.totalOffersExtended) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-slate-600">acceptance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benchmarking */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-[#212936]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff8000] rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Market Benchmarking</h3>
                      <p className="text-sm text-slate-300">How you compare to industry averages</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="text-3xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-slate-600 mb-2">Your Conversion Rate</div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{(stats.conversionRate - 15.2).toFixed(1)}% vs Market Avg
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="text-3xl font-bold text-blue-600">{stats.performanceMetrics.responseTime}</div>
                      <div className="text-sm text-slate-600 mb-2">Days Response Time</div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stats.performanceMetrics.responseTime < 3 ? 'Faster' : 'Slower'} than Average
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="text-3xl font-bold text-purple-600">{stats.performanceMetrics.roi}%</div>
                      <div className="text-sm text-slate-600 mb-2">Return on Investment</div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Industry Leading
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Key Insights</h3>
                        <p className="text-sm text-slate-300">AI-powered insights from your data</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900 mb-2">Opportunity Alert</div>
                      <div className="text-sm text-blue-800">
                        Your conversion rate is {stats.conversionRate > 15.2 ? (stats.conversionRate - 15.2).toFixed(0) : '0'}% higher than the industry average. 
                        Consider increasing your application volume to maximize returns.
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-medium text-green-900 mb-2">Performance Highlight</div>
                      <div className="text-sm text-green-800">
                        Technology sector applications show 35% higher success rates. 
                        Consider targeting more tech businesses.
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="font-medium text-amber-900 mb-2">Credit Optimization</div>
                      <div className="text-sm text-amber-800">
                        You're using {stats.creditUtilization.percentage.toFixed(0)}% of your credits efficiently. Consider upgrading 
                        your plan to access more opportunities.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-[#212936]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#ff8000] rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Recommendations</h3>
                        <p className="text-sm text-slate-300">Actionable recommendations to improve performance</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      {
                        title: "Reduce Response Time",
                        description: "Aim to respond to applications within 24 hours to improve conversion rates.",
                        impact: "High",
                        effort: "Medium"
                      },
                      {
                        title: "Focus on Tech Sector",
                        description: "Technology businesses show highest acceptance rates in your portfolio.",
                        impact: "Medium",
                        effort: "Low"
                      },
                      {
                        title: "Optimize Offer Amounts",
                        description: "Consider offering £25K-£50K loans for better acceptance rates.",
                        impact: "Medium",
                        effort: "Low"
                      }
                    ].map((rec, index) => (
                      <div key={index} className="p-3 border border-slate-200 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-md transition-all duration-200">
                        <div className="font-medium mb-1 text-[#212936]">{rec.title}</div>
                        <div className="text-sm text-slate-600 mb-2">{rec.description}</div>
                        <div className="flex gap-2">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rec.impact === 'High' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rec.impact} Impact
                          </div>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {rec.effort} Effort
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market Trends */}
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-[#212936]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff8000] rounded-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Market Trends</h3>
                      <p className="text-sm text-slate-300">Current trends affecting the lending market</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-[#212936]">Growing Sectors</h4>
                      <div className="space-y-2">
                        {['Technology', 'Healthcare', 'E-commerce', 'Renewable Energy'].map((sector, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-[#212936]">{sector}</span>
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-green-600">+{15 + index * 3}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-[#212936]">Market Conditions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#212936]">Average Loan Size</span>
                          <span className="text-sm font-medium text-[#212936]">£45K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#212936]">Market Interest Rate</span>
                          <span className="text-sm font-medium text-[#212936]">6.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#212936]">Competition Level</span>
                          <span className="text-sm font-medium text-[#212936]">Moderate</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#212936]">Default Rate</span>
                          <span className="text-sm font-medium text-[#212936]">2.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderReporting;
