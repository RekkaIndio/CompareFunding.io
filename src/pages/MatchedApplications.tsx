import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, getLenderApplications, expressInterestInApplication, getDocument, updateDocument, createDocument } from '@/firebase';
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
  CheckCircle,
  BadgeCheck,
  MapPin,
  Users2,
  Clock,
  MessageSquare
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

      // For each application, fetch the business profile data and enhance with sample financial data
      const enhancedApplications = await Promise.all((data || []).map(async (app) => {
        // Add sample financial data for matched applications
        const isMatched = app.matched_lenders?.includes(user.uid) || 
                         app.interested_lenders?.some(l => l.lender_id === user.uid && l.status === 'accepted');
        
        let enhancedApp = { ...app };
        
        if (isMatched) {
          // Add realistic sample financial data
          enhancedApp = {
            ...enhancedApp,
            annual_revenue: 2500000, // £2.5M annual revenue
            monthly_revenue: 208333, // ~£2.5M / 12
            credit_score: 85, // Out of 100
            risk_score: "Low",
            asset_value: 1750000, // £1.75M in assets
            profit_margin: 18, // 18% profit margin
            years_trading: 7,
            location: "Greater London",
            employees: 25,
            credit_utilization: 45, // 45% credit utilization
            debt_service_ratio: 1.8, // 1.8x debt service coverage ratio
            working_capital: 450000 // £450k working capital
          };
        }

        // Always try to get business data using user_id
        if (app.user_id) {
          const { data: businessData } = await getDocument('business_profiles', app.user_id);
          if (businessData) {
            return {
              ...enhancedApp,
              business: {
                business_name: businessData.business_name || 'Unnamed Business',
                logo_url: businessData.logo_url,
                industry_sector: businessData.industry_sector
              }
            };
          }
        }
        return enhancedApp;
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

  // Decline interest mutation
  const declineInterestMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      setIsSubmitting(true);
      // Fetch application and update interested_lenders for this lender
      const { data: appDoc, error: appError } = await getDocument('applications', applicationId);
      if (appError || !appDoc) throw new Error(appError?.message || 'Application not found');
      const updatedLenders = (appDoc.interested_lenders || []).map(l =>
        l.lender_id === user.uid ? { ...l, status: 'rejected', responded_at: new Date() } : l
      );
      if (!updatedLenders.find(l => l.lender_id === user.uid)) {
        updatedLenders.push({ lender_id: user.uid, status: 'rejected', responded_at: new Date() });
      }
      const { error: updateError } = await updateDocument('applications', applicationId, {
        interested_lenders: updatedLenders
      });
      if (updateError) throw new Error(updateError.message);
      return true;
    },
    onSuccess: () => {
      toast.success('You have declined this application.');
      setIsConfirmDialogOpen(false);
      setSelectedApplication(null);
      queryClient.invalidateQueries({ queryKey: ['lenderApplications', user?.uid] });
    },
    onError: (error) => {
      toast.error(`Failed to decline: ${error.message}`);
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
  // FIX: Use all lenderApplications for 'all' status, not just matched + available
  const allApplications = statusFilter === 'all'
    ? (lenderApplications || [])
    : [...(matchedApplications || []), ...(availableApplications || [])];

  // Filter and sort applications
  const filteredApplications = allApplications?.filter(app => {
    // For declined applications, only search by ID/number
    const isDeclined = app.interested_lenders?.find(l => 
      l.lender_id === user?.uid)?.status?.toLowerCase() === 'rejected';
    
    const matchesSearch = searchQuery === '' || 
      (!isDeclined && app.business_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (!isDeclined && app.purpose?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.loan_amount?.toString().includes(searchQuery) ||
      app.id?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
      
    // New - fresh applications that haven't been matched yet
    if (statusFilter === 'submitted') {
      return matchesSearch && 
        app.status === 'submitted' && 
        !app.matched_lenders?.includes(user?.uid) &&
        !app.interested_lenders?.some(l => l.lender_id === user?.uid) &&
        !app.offers?.some(o => o.lender_id === user?.uid);
    }
    
    // Active - applications where we're either matched or have expressed interest
    if (statusFilter === 'matched') {
      const isMatched = app.matched_lenders?.includes(user?.uid);
      const hasExpressedInterest = app.interested_lenders?.some(
        l => l.lender_id === user?.uid && l.status !== 'rejected'
      );
      const hasNoOffer = !app.offers?.some(o => o.lender_id === user?.uid);
      return matchesSearch && (isMatched || hasExpressedInterest) && hasNoOffer;
    }
    
    // With Offers - applications where we've created an offer, have an accepted offer, or status is 'offered' or 'has_offers'
    if (statusFilter === 'approved') {
      // Check for any offers made by this lender
      const hasOffer = app.offers?.some(o => o.lender_id === user?.uid);
      // Check for any accepted offers where this lender is involved
      const hasAcceptedOffer = app.accepted_offers?.some(o => o.lender_id === user?.uid);
      // Check if the application status is 'offered' or 'has_offers'
      const isOffered = app.status === 'offered' || app.status === 'has_offers';
      // Also check the offer_status if it exists
      const hasOfferStatus = app.offer_status === 'approved' || app.offer_status === 'accepted';
      
      return matchesSearch && (hasOffer || hasAcceptedOffer || hasOfferStatus || isOffered);
    }

    // Declined - applications where this lender has declined or had their interest declined
    if (statusFilter === 'declined') {
      // Show applications where this lender has 'Interest Declined' status
      const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status?.toLowerCase();
      const isInterestDeclined = interestStatus === 'rejected' || interestStatus === 'declined' || 
                                interestStatus === 'interest_declined' || interestStatus === 'interest declined';
      return matchesSearch && isInterestDeclined;
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

  const handleDeclineInterest = () => {
    if (!selectedApplication) return;
    declineInterestMutation.mutate(selectedApplication.id);
  };
  
  // Function to handle starting a conversation with a business
  const handleStartConversation = async (app) => {
    try {
      // Check if a conversation already exists for this application
      const { data: existingConversations } = await getDocuments(
        'conversations',
        [
          { field: 'lender_id', operator: '==', value: user.uid },
          { field: 'application_id', operator: '==', value: app.id }
        ]
      );
      
      let conversationId;
      
      // If conversation exists, navigate to it, otherwise create a new one
      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        toast.info("Opening existing conversation");
      } else {
        // Create a new conversation
        const conversationData = {
          lender_id: user.uid,
          business_id: app.user_id,
          application_id: app.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: "Conversation started",
          last_message_time: new Date().toISOString()
        };
        
        const { data: newConversation, error } = await createDocument('conversations', conversationData);
        
        if (error || !newConversation) {
          throw new Error(error?.message || "Failed to create conversation");
        }
        
        conversationId = newConversation.id;
        toast.success("New conversation created");
      }
      
      // Navigate to messages page with the conversation selected
      navigate('/messages?conversation=' + conversationId);
      
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation: " + error.message);
    }
  };
  
  const getActionButton = (app) => {
    // Check if we have an existing offer
    const hasExistingOffer = app.offers?.some(o => o.lender_id === user?.uid);
    if (hasExistingOffer) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600"
          disabled
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Offer Sent
        </Button>
      );
    }

    // Check both matched_lenders and interested_lenders
    const isMatched = app.matched_lenders?.includes(user?.uid);
    const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status;

    if (isMatched || interestStatus === 'accepted') {
      return (
        <div className="flex flex-col md:flex-row gap-2 w-full justify-center">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600 w-full md:w-auto"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Matched
          </Button>
          <Button
            size="sm"
            className="bg-[#ff8000] hover:bg-[#ff8000]/90 w-full md:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              handleStartConversation(app);
            }}
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Message
          </Button>
        </div>
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
  
  // Check if an application is declined
  const isApplicationDeclined = (app) => {
    if (!app || !user?.uid) return false;
    const interestStatus = app.interested_lenders?.find(l => l.lender_id === user?.uid)?.status?.toLowerCase();
    return interestStatus === 'rejected';
  };

  // Sanitize application data to hide sensitive info for declined applications
  const sanitizeApplicationData = (app) => {
    if (!app) return null;
    if (isApplicationDeclined(app)) {
      return {
        ...app,
        business_name: `Application #${app.application_number || app.id?.substring(0, 8)}`,
        business: {
          business_name: `Application #${app.application_number || app.id?.substring(0, 8)}`,
          logo_url: null,
          industry_sector: 'Confidential'
        }
      };
    }
    return app;
  };

  // Apply sanitization to filtered applications
  const sanitizedApplications = filteredApplications?.map(sanitizeApplicationData);

  const getDisplayData = (app) => {
    // ...existing code...
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Applications</h1>
            <p className="text-muted-foreground">
              Browse all business funding applications available to you
            </p>
          </div>
        </div>
        
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
                <TabsTrigger value="declined">Declined</TabsTrigger>
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
            ) : sanitizedApplications && sanitizedApplications.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {sanitizedApplications.map((app) => (
                  <Card key={app.id} className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-[1fr,auto] gap-4 items-start">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {app.business?.logo_url ? (
                              <img
                                src={app.business.logo_url}
                                alt={`${app.business.business_name} logo`}
                                className="w-8 h-8 object-contain rounded"
                              />
                            ) : !isApplicationDeclined(app) && (
                              <Building className="w-8 h-8 text-gray-400" />
                            )}
                            <div>
                              <h3 className="font-semibold">{app.business?.business_name || `Application #${app.id}`}</h3>
                              {!isApplicationDeclined(app) && app.business?.industry_sector && (
                                <p className="text-sm text-gray-500">{app.business.industry_sector}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Application #{app.application_number}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
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
                              <Users2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {app.employees || '?'} employees
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {app.years_trading || '?'} years trading
                              </span>
                            </div>
                            {app.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{app.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Add key financial metrics */}
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
                            {app.annual_revenue && (
                              <div className="text-xs space-y-1">
                                <div className="text-muted-foreground">Annual Revenue</div>
                                <div className="font-semibold">£{(app.annual_revenue).toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Monthly: £{(app.monthly_revenue).toLocaleString()}</div>
                              </div>
                            )}
                            
                            <div className="text-xs space-y-1">
                              <div className="text-muted-foreground">Business Health</div>
                              <div className="font-semibold flex items-center gap-1">
                                <div className={`h-2 w-2 rounded-full ${app.risk_score === 'Low' ? 'bg-green-500' : app.risk_score === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                {app.risk_score} Risk
                              </div>
                              <div className="text-xs text-muted-foreground">Score: {app.credit_score}/100</div>
                            </div>

                            <div className="text-xs space-y-1">
                              <div className="text-muted-foreground">Assets & Capital</div>
                              <div className="font-semibold">£{(app.asset_value || 0).toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">WC: £{(app.working_capital || 0).toLocaleString()}</div>
                            </div>

                            <div className="text-xs space-y-1">
                              <div className="text-muted-foreground">Performance</div>
                              <div className="font-semibold">{app.profit_margin}% Margin</div>
                              <div className="text-xs text-muted-foreground">DSR: {app.debt_service_ratio}x</div>
                            </div>
                          </div>

                          {/* Add purpose details with improved styling */}
                          {app.purpose && (
                            <div className="mt-3">
                              <div className="text-xs text-muted-foreground mb-1">Loan Purpose:</div>
                              <div className="text-sm bg-blue-50 p-2 rounded-md border border-blue-100">
                                {app.purpose}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Amount column with enhanced styling */}
                        <div className="w-full md:w-2/12 flex md:block items-center justify-between md:text-center md:justify-center">
                          <div className="md:hidden font-medium text-sm text-muted-foreground">Amount:</div>
                          <div className="bg-white p-3 rounded-lg shadow-sm border">
                            <div className="font-bold text-lg text-fundhub-blue">
                              £{app.loan_amount?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium">
                              {app.loan_term_months} months
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                              {app.interested_lenders?.length > 0 && (
                                <div className="flex items-center justify-center gap-1">
                                  <Users2 className="h-3 w-3" />
                                  <span className="font-medium">{app.interested_lenders.length}</span> interested
                                </div>
                              )}
                              {app.expires_at && (
                                <div className="flex items-center justify-center gap-1 text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  Expires in {Math.ceil((new Date(app.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status & Action column - 3/12 width */}
                        <div className="w-full md:w-3/12 flex flex-col md:items-center gap-2 mt-3 md:mt-0">
                          <StatusBadge status={app.status} />
                          <div className="mt-2">
                            {getActionButton(app)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              Are you interested in this funding application? Your information will be shared with the 
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
              variant="destructive"
              onClick={handleDeclineInterest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Declining...' : 'Decline'}
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
