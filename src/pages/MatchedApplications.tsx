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
  MessageSquare,
  Lightbulb,
  XCircle
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
          className="text-green-600 border-green-200 bg-green-50 shadow-sm"
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
            className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 shadow-sm w-full md:w-auto"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Matched
          </Button>
          <Button
            size="sm"
            className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white w-full md:w-auto shadow-sm"
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
      return (          <Button
            size="sm"
            variant="outline"
            className="text-[#212936] border-[#212936]/20 bg-[#212936]/5 shadow-sm"
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
          className="text-red-600 border-red-200 bg-red-50 shadow-sm"
          disabled
        >
          <XCircle className="mr-1 h-3 w-3" />
          Interest Declined
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          handleExpressInterest(app);
        }}
      >
        <ThumbsUp className="mr-1 h-3 w-3" />
        Express Interest
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container px-6 py-8 mx-auto">
          {/* Main Header Section */}
          <div className="bg-[#212936] text-white rounded-xl p-6 sm:p-8 mb-8 shadow-xl border-b-2 border-[#ff8000] flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight text-white">Funding Applications</h1>
              <p className="text-gray-200 text-base sm:text-lg">
                Browse, match and offer funding to businesses that meet your criteria
              </p>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="mb-8 bg-white backdrop-blur-sm rounded-lg border border-slate-200/50 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#ff8000]" />
                <Input
                  placeholder="Search applications..."
                  className="pl-9 border-slate-200 focus-visible:ring-[#212936] hover:border-[#212936]/20"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                <div className="text-sm font-medium text-[#212936]">Filter by status:</div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                  <TabsList className="bg-slate-100 border border-slate-200">
                    <TabsTrigger value="all" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">All</TabsTrigger>
                    <TabsTrigger value="submitted" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">New</TabsTrigger>
                    <TabsTrigger value="matched" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">Active</TabsTrigger>
                    <TabsTrigger value="approved" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">With Offers</TabsTrigger>
                    <TabsTrigger value="declined" className="data-[state=active]:bg-[#212936] data-[state=active]:text-white">Declined</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-2 ml-0 md:ml-4 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" onClick={() => handleSort('loan_amount')} className="border-slate-300">
                    <PoundSterling className="h-3.5 w-3.5 mr-1" />
                    Amount
                    <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'loan_amount' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => handleSort('created_at')} className="border-slate-300">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Date
                    <ArrowUpDown className={`ml-1 h-3.5 w-3.5 ${sortOrder.field === 'created_at' ? 'opacity-100' : 'opacity-40'}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Total Applications Card */}
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <Briefcase className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Total Applications</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        sanitizedApplications?.length || 0
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Matched Applications Card */}
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <BadgeCheck className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Matched Applications</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        matchedApplications?.length || 0
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total Value Card */}
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <PoundSterling className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Total Loan Value</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        `£${(sanitizedApplications?.reduce((sum, app) => sum + (app.loan_amount || 0), 0) || 0).toLocaleString()}`
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* New Applications Card */}
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                    <ChevronRight className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">New Applications</p>
                    <h3 className="text-2xl font-bold text-[#212936]">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        lenderApplications?.filter(app => app.status === 'submitted').length || 0
                      )}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Applications Card */}
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
            <CardHeader className="bg-[#212936] text-white rounded-t-lg">
              <CardTitle className="flex items-center text-white">
                <Briefcase className="mr-2 h-5 w-5 text-[#ff8000]" />
                <span className="text-white">Applications</span>
              </CardTitle>
              <CardDescription className="text-gray-200">
                {statusFilter === 'all' ? 'All applications' : 
                 statusFilter === 'submitted' ? 'New applications waiting for interest' :
                 statusFilter === 'matched' ? 'Active applications you are matched with' :
                 statusFilter === 'approved' ? 'Applications where you have made offers' :
                 'Applications you have declined or were declined'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-28 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              ) : sanitizedApplications && sanitizedApplications.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {sanitizedApplications.map((app) => (
                    <Card 
                      key={app.id} 
                      className={`relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 ${
                        isApplicationDeclined(app) ? 'border-red-200' : 
                        app.isMatched ? 'border-green-200' : 'border-slate-200/80'
                      }`}
                      onClick={() => navigate(`/business/${app.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr,1fr] gap-4 items-start">
                          {/* Left Column: Business Info */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              {app.business?.logo_url ? (
                                <div className="w-14 h-14 rounded-md bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1">
                                  <img
                                    src={app.business.logo_url}
                                    alt={`${app.business.business_name} logo`}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              ) : !isApplicationDeclined(app) && (
                                <div className="w-14 h-14 rounded-md bg-[#212936] flex items-center justify-center">
                                  <Building className="w-7 h-7 text-[#ff8000]" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg text-[#212936]">
                                    {app.business?.business_name || `Application #${app.application_number || app.id?.substring(0, 8)}`}
                                  </h3>
                                  <StatusBadge status={app.status} />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <span>Application #{app.application_number || app.id?.substring(0, 8)}</span>
                                  <span>•</span>
                                  <span>{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Industry and Details */}
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                              {app.business?.industry_sector && !isApplicationDeclined(app) && (
                                <div className="flex items-center gap-1.5">
                                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-slate-700">{app.business.industry_sector}</span>
                                </div>
                              )}
                              
                              {app.loan_type && (
                                <div className="flex items-center gap-1.5">
                                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-slate-700 capitalize">{app.loan_type.replace('_', ' ')}</span>
                                </div>
                              )}
                              
                              {app.location && !isApplicationDeclined(app) && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-slate-700">{app.location}</span>
                                </div>
                              )}
                              
                              {app.years_trading && !isApplicationDeclined(app) && (
                                <div className="flex items-center gap-1.5">
                                  <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-slate-700">{app.years_trading} years trading</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Purpose Card - Only show if not declined */}
                            {app.purpose && !isApplicationDeclined(app) && (
                              <div className="bg-gradient-to-r from-[#212936]/5 to-[#ff8000]/5 p-3 rounded-md border border-[#212936]/10 mt-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Lightbulb className="h-4 w-4 text-[#ff8000]" />
                                  <p className="text-xs font-medium text-[#212936]">Funding Purpose</p>
                                </div>
                                <p className="text-sm text-slate-700">{app.purpose}</p>
                              </div>
                            )}
                            
                            {/* Financial Metrics - Only if matched and not declined */}
                            {isLenderMatched(app) && !isApplicationDeclined(app) && app.annual_revenue && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-md border border-slate-200/80 shadow-sm mt-3">
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500">Revenue</p>
                                  <p className="font-semibold text-[#212936]">£{app.annual_revenue.toLocaleString()}</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500">Credit Score</p>
                                  <div className="flex items-center gap-1">
                                    <div className={`h-2 w-2 rounded-full ${
                                      app.credit_score > 70 ? 'bg-green-500' : 
                                      app.credit_score > 50 ? 'bg-[#ff8000]' : 
                                      'bg-red-500'
                                    }`}></div>
                                    <p className="font-semibold text-[#212936]">{app.credit_score}/100</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500">Profit Margin</p>
                                  <p className="font-semibold text-[#212936]">{app.profit_margin}%</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500">Debt Service Ratio</p>
                                  <p className="font-semibold text-[#212936]">{app.debt_service_ratio}x</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Middle Column: Amount and Term */}
                          <div className="bg-white rounded-lg p-4 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="bg-[#212936]/10 rounded-full p-2 mb-2">
                              <PoundSterling className="h-5 w-5 text-[#ff8000]" />
                            </div>
                            <p className="text-sm text-slate-600 mb-1">Loan Amount</p>
                            <p className="text-3xl font-bold text-[#212936]">£{app.loan_amount?.toLocaleString()}</p>
                            <p className="text-sm font-medium text-slate-700 mb-3">{app.loan_term_months} months</p>
                            
                            <div className="mt-1 w-full">
                              <div className="flex items-center justify-center gap-2 text-xs">
                                <Badge variant="outline" className="bg-white shadow-sm border-slate-300 text-[#212936]">
                                  {isApplicationDeclined(app) ? 'No Credit Cost' : `${getCreditCost(app.loan_amount)} credits`}
                                </Badge>
                                
                                {app.expires_at && (
                                  <Badge variant="outline" className="bg-[#212936]/5 shadow-sm border-[#212936]/20 text-[#212936]">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {Math.ceil((new Date(app.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column: Status and Actions */}
                          <div className="flex flex-col items-center space-y-3">
                            {/* Interest Indicator */}
                            {app.interested_lenders && app.interested_lenders.length > 0 && !isApplicationDeclined(app) && (
                              <Badge className="bg-[#212936]/10 text-[#212936] border-[#212936]/20 hover:bg-[#212936]/15 shadow-sm transition-colors">
                                <Users2 className="mr-1 h-3 w-3" />
                                {app.interested_lenders.length} lender{app.interested_lenders.length !== 1 ? 's' : ''} interested
                              </Badge>
                            )}
                            
                            {/* Main Action Button */}
                            <div className="w-full flex justify-center">
                              {getActionButton(app)}
                            </div>
                            
                            {/* View Details Button - Always show except for declined */}
                            {!isApplicationDeclined(app) && (                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white transition-colors shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/business/${app.id}`);
                  }}
                >
                  View Details
                </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/50 shadow-lg">
                  <div className="bg-[#212936] w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Filter className="h-10 w-10 text-[#ff8000]" />
                  </div>
                  <h3 className="font-semibold text-xl text-[#212936] mb-3">No matching applications found</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'all' ? 
                      'Try adjusting your search or filters to see more applications.' : 
                      'Applications matching your lending criteria will appear here.'}
                  </p>
                  {(searchQuery || statusFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white transition-colors shadow-sm"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Tips Section */}
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-xl text-blue-900">
                <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                Quick Tips for Lenders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-1">Express Interest</h3>
                  <p className="text-sm text-slate-600">
                    When you express interest in an application, the business receives a notification and can choose to connect with you.
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-1">Credit Usage</h3>
                  <p className="text-sm text-slate-600">
                    Credits are only deducted when you view the full application details after being matched.
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-1">Making Offers</h3>
                  <p className="text-sm text-slate-600">
                    Once matched, you can communicate with the business and make formal offers directly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#212936] text-xl font-semibold">Express Interest</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you interested in this funding application? Your information will be shared with the 
              business and they will be notified of your interest.
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="py-4">
              <div className="font-medium mb-2 text-[#212936]">Application Details:</div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-slate-500">Application:</div>
                  <div className="font-medium">#{selectedApplication.application_number || selectedApplication.id?.substring(0, 8)}</div>
                  
                  <div className="text-slate-500">Amount:</div>
                  <div className="font-medium">£{selectedApplication.loan_amount?.toLocaleString()}</div>
                  
                  <div className="text-slate-500">Term:</div>
                  <div className="font-medium">{selectedApplication.loan_term_months} months</div>
                  
                  <div className="text-slate-500">Purpose:</div>
                  <div className="font-medium">{selectedApplication.purpose || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="mt-4 bg-[#212936]/5 p-3 rounded-md border border-[#212936]/10">
                <p className="text-sm text-[#212936]">
                  <BadgeCheck className="inline-block h-4 w-4 mr-1 text-[#ff8000]" />
                  If the business accepts your interest, you'll be matched and can view their full details
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeclineInterest}
              disabled={isSubmitting}
              className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            >
              {isSubmitting ? 'Declining...' : 'Decline'}
            </Button>
            <Button 
              className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-sm"
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
