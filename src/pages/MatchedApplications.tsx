import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, getLenderApplications, expressInterestInApplication, getDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  PoundSterling, 
  Tag, 
  Building, 
  CalendarClock,
  Briefcase,
  ThumbsUp,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MatchedApplications = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState({ field: 'created_at', direction: 'desc' });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Fetch lender profile
  const { data: lenderProfile } = useQuery({
    queryKey: ['lenderProfile', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocument('lender_profiles', user?.uid);
      
      if (error) {
        toast.error('Error loading profile data');
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });
  
  // Fetch all relevant applications for the lender using the getLenderApplications function
  const { data: lenderApplications, isLoading } = useQuery({
    queryKey: ['lenderApplications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getLenderApplications(user.uid);
      
      if (error) {
        toast.error('Failed to load applications');
        throw error;
      }

      // For each application, fetch the business profile data
      const enhancedApplications = await Promise.all((data || []).map(async (app) => {
        // Always try to get business data using user_id
        if (app.user_id) {
          const { data: businessData } = await getDocument('business_profiles', app.user_id);
          if (businessData) {
            return {
              ...app,
              business: {
                business_name: businessData.business_name || 'Unnamed Business',
                logo_url: businessData.logo_url,
                industry_sector: businessData.industry_sector
              }
            };
          }
        }
        return app;
      }));
      
      console.log('Enhanced applications with business data:', enhancedApplications);
      return enhancedApplications;
    },
    enabled: !!user?.uid,
  });
  
  // Express interest mutation
  const expressInterestMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      setIsSubmitting(true);
      const { data, error } = await expressInterestInApplication(
        applicationId, 
        user.uid,
        lenderProfile
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Interest expressed successfully! The business will be notified.');
      setIsConfirmDialogOpen(false);
      setSelectedApplication(null);
      queryClient.invalidateQueries({ queryKey: ['lenderApplications', user?.uid] });
    },
    onError: (error) => {
      toast.error(`Failed to express interest: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Separate matched from available applications
  const matchedApplications = lenderApplications?.filter(app => {
    // Check both matched_lenders array and interested_lenders with accepted status
    const isInMatchedLenders = app.matched_lenders?.includes(user?.uid);
    const isAcceptedInterest = app.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'accepted'
    );
    const isMatched = isInMatchedLenders || isAcceptedInterest;
    
    // Add isMatched flag to the application object
    app.isMatched = isMatched;
    
    // Debug the business data
    console.log(`App ${app.id} matched: ${isMatched}`, {
      business: app.business,
      hasBusinessName: app.business?.business_name ? true : false,
      businessName: app.business?.business_name,
      isMatched
    });
    
    return isMatched;
  }) || [];

  const availableApplications = lenderApplications?.filter(app => {
    // Don't show if already matched or has expressed interest
    const isInMatchedLenders = app.matched_lenders?.includes(user?.uid);
    const hasInteractedWith = app.interested_lenders?.some(
      l => l.lender_id === user?.uid
    );
    app.isMatched = false;
    return !isInMatchedLenders && !hasInteractedWith;
  }) || [];

  // Combine all applications for filtering
  const allApplications = [...(matchedApplications || []), ...(availableApplications || [])];
  
  // Filter and sort applications
  const filteredApplications = allApplications?.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.loan_amount?.toString().includes(searchQuery);

    if (statusFilter === 'all') return matchesSearch;
      
    // New - fresh applications that haven't been matched yet
    if (statusFilter === 'submitted') {
      return matchesSearch && 
        app.status === 'submitted' && 
        !app.matched_lenders?.includes(user?.uid) &&
        !app.interested_lenders?.some(l => l.lender_id === user?.uid);
    }
    
    // Active - applications where we're either matched or have expressed interest
    if (statusFilter === 'matched') {
      const isMatched = app.matched_lenders?.includes(user?.uid);
      const hasExpressedInterest = app.interested_lenders?.some(
        l => l.lender_id === user?.uid && l.status !== 'rejected'
      );
      return matchesSearch && (isMatched || hasExpressedInterest);
    }
    
    // With Offers - applications where we've created an offer
    if (statusFilter === 'approved') {
      return matchesSearch && app.offers?.some(o => o.lender_id === user?.uid);
    }
    
    return false;
  }).sort((a, b) => {
    const field = sortOrder.field;
    const direction = sortOrder.direction === 'asc' ? 1 : -1;
    
    if (field === 'loan_amount') {
      return (a.loan_amount - b.loan_amount) * direction;
    }
    
    if (field === 'created_at') {
      return (new Date(a.created_at || Date.now()).getTime() - new Date(b.created_at || Date.now()).getTime()) * direction;
    }
    
    return 0;
  });
  
  // Calculate credit cost based on loan amount
  const getCreditCost = (loanAmount) => {
    if (!loanAmount) return 1;
    if (loanAmount <= 50000) return 1;
    if (loanAmount <= 250000) return 2;
    return 3;
  };
  
  const handleSort = (field) => {
    setSortOrder({
      field,
      direction: sortOrder.field === field && sortOrder.direction === 'desc' ? 'asc' : 'desc'
    });
  };
  
  const handleExpressInterest = (application) => {
    setSelectedApplication(application);
    setIsConfirmDialogOpen(true);
  };
  
  const confirmExpressInterest = () => {
    if (!selectedApplication) return;
    expressInterestMutation.mutate(selectedApplication.id);
  };
  
  const getActionButton = (app) => {
    // Check both matched_lenders and interested_lenders
    const isMatched = app.matched_lenders?.includes(user?.uid);
    const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status;

    if (isMatched || interestStatus === 'accepted') {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600"
          disabled
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Matched
        </Button>
      );
    }
    
    if (interestStatus === 'pending') {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600"
          disabled
        >
          <ThumbsUp className="mr-1 h-3 w-3" />
          Interest Sent
        </Button>
      );
    }
    
    if (interestStatus === 'rejected') {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-600"
          disabled
        >
          Interest Declined
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        className="bg-fundhub-blue hover:bg-fundhub-blue/90"
        onClick={() => handleExpressInterest(app)}
      >
        Express Interest
        <ChevronRight className="ml-1 h-3 w-3" />
      </Button>
    );
  };
  
  const isLenderMatched = (app) => {
    if (!app) return false;
    const isInMatchedLenders = app.matched_lenders?.includes(user?.uid);
    const isAcceptedInterest = app.interested_lenders?.some(
      l => l.lender_id === user?.uid && l.status === 'accepted'
    );
    return isInMatchedLenders || isAcceptedInterest;
  };
  
  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">All Applications</h1>
        <p className="text-muted-foreground mb-8">
          Browse all business loan applications available to you
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="text-sm font-medium">Status:</div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="submitted">New</TabsTrigger>
                <TabsTrigger value="matched">Active</TabsTrigger>
                <TabsTrigger value="approved">With Offers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              All applications matching your lending criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded"></div>
                ))}
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <div>
                <div className="hidden md:flex text-xs font-medium text-muted-foreground mb-2 px-4">
                  <div className="w-6/12">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs p-0 h-auto font-medium flex items-center gap-1"
                      onClick={() => handleSort('created_at')}
                    >
                      Business & Loan Details
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-2/12 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs p-0 h-auto font-medium flex items-center gap-1 mx-auto"
                      onClick={() => handleSort('loan_amount')}
                    >
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-2/12 text-center">Status</div>
                  <div className="w-2/12 text-center">View Cost</div>
                </div>
                
                <div className="space-y-3">
                  {filteredApplications.map(app => (
                    <div 
                      key={app.id} 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/business/${app.id}`)}
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="w-full md:w-6/12">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                              {app.business?.logo_url ? (
                                <img 
                                  src={app.business.logo_url} 
                                  alt={`${app.business?.business_name} logo`}
                                  className="h-full w-full object-contain bg-white"
                                />
                              ) : (
                                <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                                  <Building className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {app.isMatched ? (
                                  <>
                                    <span className="text-base font-bold">{app.business?.business_name || 'Unnamed Business'}</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Matched
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span>Application #{app.application_number || app.id?.substring(0, 8)}</span>
                                    {app.hasExpressedInterest && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Interest Sent
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {app.isMatched && (
                                <div className="text-sm text-muted-foreground mt-0.5">
                                  Application #{app.application_number || app.id?.substring(0, 8)}
                                </div>
                              )}
                              <div className="text-sm flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                <div className="flex items-center gap-1">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {app.business?.industry_sector || 'Industry not specified'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground capitalize">
                                    {app.loan_type?.replace('_', ' ') || 'Business Loan'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {app.years_trading || '?'} years in business
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-2/12 text-center hidden md:block">
                          <div className="font-medium">
                            £{app.loan_amount?.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {app.loan_term_months} months
                          </div>
                        </div>
                        
                        <div className="w-full md:w-2/12 text-center hidden md:block">
                          <StatusBadge status={app.status} />
                        </div>
                        
                        <div className="w-full md:w-2/12 md:text-center flex md:block justify-between items-center">
                          <Badge variant="outline" className="bg-gray-50">
                            {getCreditCost(app.loan_amount)} credit{getCreditCost(app.loan_amount) > 1 ? 's' : ''}
                          </Badge>
                          
                          {getActionButton(app)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-3">
                  <Filter className="h-10 w-10 text-gray-300 mx-auto" />
                </div>
                <h3 className="font-medium text-lg">No matching applications found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all' ? 
                    'Try adjusting your search or filters.' : 
                    'Applications matching your criteria will appear here.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Express Interest</DialogTitle>
            <DialogDescription>
              Are you interested in this loan application? Your information will be shared with the 
              business and they will be notified of your interest.
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="py-4">
              <div className="font-medium mb-2">Application Details:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Application:</div>
                <div>#{selectedApplication.application_number || selectedApplication.id?.substring(0, 8)}</div>
                
                <div className="text-muted-foreground">Amount:</div>
                <div>£{selectedApplication.loan_amount?.toLocaleString()}</div>
                
                <div className="text-muted-foreground">Term:</div>
                <div>{selectedApplication.loan_term_months} months</div>
                
                <div className="text-muted-foreground">Purpose:</div>
                <div>{selectedApplication.purpose || 'Not specified'}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
              onClick={confirmExpressInterest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Confirm Interest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default MatchedApplications;
