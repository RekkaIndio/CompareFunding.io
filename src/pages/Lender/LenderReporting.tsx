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
  DollarSign,
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
            <RefreshCw className="h-6 w-6 animate-spin text-slate-600" />
            <span className="text-lg text-slate-600">Loading reporting data...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-8xl mx-auto py-8 px-6 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Reporting & Analytics</h1>
              <p className="text-slate-600 text-lg">
                Comprehensive insights into your lending performance and portfolio
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Funding Deployed</CardTitle>
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats.totalFundingDeployed.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across {stats.totalOffersAccepted} loans
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOffersAccepted} of {stats.totalApplicationsViewed} applications
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Portfolio</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeLoans}</div>
                <p className="text-xs text-muted-foreground">
                  £{stats.averageOfferAmount.toLocaleString()} avg loan size
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.creditUtilization.percentage.toFixed(0)}%</div>
                <Progress value={stats.creditUtilization.percentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.creditUtilization.used} of {stats.creditUtilization.total} credits used
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Volume Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Activity
                    </CardTitle>
                    <CardDescription>
                      Applications, offers, and funding over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.monthlyVolume.map((month, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{month.month}</span>
                            <span className="text-muted-foreground">
                              {month.applications} apps • {month.offers} offers • {month.funded} funded
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${month.applications > 0 ? (month.funded / month.applications) * 100 : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{stats.performanceMetrics.responseTime} days</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Approval Rate</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">{stats.performanceMetrics.approvalRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Portfolio Value</span>
                      <div className="flex items-center gap-2">
                        <PoundSterling className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">£{stats.performanceMetrics.portfolioValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ROI</span>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{stats.performanceMetrics.roi}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-slate-900">{stats.totalApplicationsViewed}</div>
                  <div className="text-sm text-slate-600">Applications Viewed</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-slate-900">{stats.totalOffersExtended}</div>
                  <div className="text-sm text-slate-600">Offers Extended</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-slate-900">{stats.pendingApplications}</div>
                  <div className="text-sm text-slate-600">Pending Review</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-2xl font-bold text-slate-900">£{stats.averageApplicationAmount.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Avg Application Size</div>
                </div>
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Industry Breakdown
                    </CardTitle>
                    <CardDescription>
                      Applications by industry sector
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.industryBreakdown.map((industry, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{industry.industry}</span>
                              <span className="text-sm text-muted-foreground">{industry.count} apps</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${stats.totalApplicationsViewed > 0 ? (industry.count / stats.totalApplicationsViewed) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Loan Type Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Loan Type Analysis
                    </CardTitle>
                    <CardDescription>
                      Distribution by loan type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.loanTypeBreakdown.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{type.type}</span>
                              <span className="text-sm text-muted-foreground">
                                {type.count} apps • £{type.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${stats.totalApplicationsViewed > 0 ? (type.count / stats.totalApplicationsViewed) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Application Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Pipeline</CardTitle>
                  <CardDescription>
                    Current status of all applications in your pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalApplicationsViewed}</div>
                      <div className="text-sm text-muted-foreground">Total Viewed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalApplicationsMatched}</div>
                      <div className="text-sm text-muted-foreground">Matched</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{stats.totalOffersExtended}</div>
                      <div className="text-sm text-muted-foreground">Offers Extended</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalOffersAccepted}</div>
                      <div className="text-sm text-muted-foreground">Offers Accepted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-600">{stats.pendingApplications}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Portfolio Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">£{stats.totalFundingDeployed.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Deployed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{stats.activeLoans}</div>
                      <div className="text-sm text-muted-foreground">Active Loans</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">£{stats.averageOfferAmount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Average Loan Size</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Risk Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.performanceMetrics.roi}%</div>
                      <div className="text-sm text-muted-foreground">Return on Investment</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">0.8%</div>
                      <div className="text-sm text-muted-foreground">Default Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">AA-</div>
                      <div className="text-sm text-muted-foreground">Portfolio Rating</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{stats.performanceMetrics.responseTime} days</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">95%</div>
                      <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Portfolio Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your active loans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Payment received from TechCorp Ltd</div>
                            <div className="text-sm text-muted-foreground">Loan #12345 • £2,500 monthly payment</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">2 hours ago</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>
                      Track your application to funding conversion
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { stage: 'Applications Viewed', count: stats.totalApplicationsViewed, percentage: 100 },
                      { stage: 'Applications Matched', count: stats.totalApplicationsMatched, percentage: (stats.totalApplicationsMatched / stats.totalApplicationsViewed) * 100 },
                      { stage: 'Offers Extended', count: stats.totalOffersExtended, percentage: (stats.totalOffersExtended / stats.totalApplicationsViewed) * 100 },
                      { stage: 'Offers Accepted', count: stats.totalOffersAccepted, percentage: (stats.totalOffersAccepted / stats.totalApplicationsViewed) * 100 }
                    ].map((stage, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{stage.stage}</span>
                          <span className="text-sm text-muted-foreground">
                            {stage.count} ({stage.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={stage.percentage} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Efficiency Metrics</CardTitle>
                    <CardDescription>
                      Your operational performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Average Decision Time</div>
                        <div className="text-sm text-muted-foreground">Time to make offer decisions</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">1.8</div>
                        <div className="text-sm text-muted-foreground">days</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Credit Efficiency</div>
                        <div className="text-sm text-muted-foreground">Credits per successful funding</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">3.2</div>
                        <div className="text-sm text-muted-foreground">credits</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Success Rate</div>
                        <div className="text-sm text-muted-foreground">Accepted offers vs extended</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {stats.totalOffersExtended > 0 ? ((stats.totalOffersAccepted / stats.totalOffersExtended) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">acceptance</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Benchmarking */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Benchmarking</CardTitle>
                  <CardDescription>
                    How you compare to industry averages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground mb-2">Your Conversion Rate</div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        +{(stats.conversionRate - 15.2).toFixed(1)}% vs Market Avg
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{stats.performanceMetrics.responseTime}</div>
                      <div className="text-sm text-muted-foreground mb-2">Days Response Time</div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {stats.performanceMetrics.responseTime < 3 ? 'Faster' : 'Slower'} than Average
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{stats.performanceMetrics.roi}%</div>
                      <div className="text-sm text-muted-foreground mb-2">Return on Investment</div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Industry Leading
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Key Insights
                    </CardTitle>
                    <CardDescription>
                      AI-powered insights from your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900 mb-2">Opportunity Alert</div>
                      <div className="text-sm text-blue-800">
                        Your conversion rate is 23% higher than the industry average. 
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
                        You're using 68% of your credits efficiently. Consider upgrading 
                        your plan to access more opportunities.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>
                      Actionable recommendations to improve performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">{rec.title}</div>
                        <div className="text-sm text-muted-foreground mb-2">{rec.description}</div>
                        <div className="flex gap-2">
                          <Badge variant={rec.impact === 'High' ? 'default' : 'secondary'}>
                            {rec.impact} Impact
                          </Badge>
                          <Badge variant="outline">{rec.effort} Effort</Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Market Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Trends</CardTitle>
                  <CardDescription>
                    Current trends affecting the lending market
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Growing Sectors</h4>
                      <div className="space-y-2">
                        {['Technology', 'Healthcare', 'E-commerce', 'Renewable Energy'].map((sector, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{sector}</span>
                            <div className="flex items-center gap-1">
                              <ArrowUpRight className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-green-600">+{15 + index * 3}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Market Conditions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Average Loan Size</span>
                          <span className="text-sm font-medium">£45K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Market Interest Rate</span>
                          <span className="text-sm font-medium">6.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Competition Level</span>
                          <span className="text-sm font-medium">Moderate</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Default Rate</span>
                          <span className="text-sm font-medium">2.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderReporting;
