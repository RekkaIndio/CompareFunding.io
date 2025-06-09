import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavbarProvider } from '@/contexts/NavbarContext'; // Add this line
import { SidebarProvider } from '@/contexts/SidebarContext';
import { TourProvider } from '@/contexts/TourContext';
import { ThemeStyles } from '@/components/ThemeStyles';
import TourOverlay from '@/components/TourOverlay';
import PrivateRoute from "@/components/PrivateRoute";
import ComingSoonPage from "@/components/ComingSoonPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ForBusinesses from "./pages/ForBusinesses";
import ForLenders from "./pages/ForLenders";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CookiePolicy from "./pages/CookiePolicy";
import Sitemap from "./pages/Sitemap";
import Applications from "./pages/Applications";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import FundingMatches from "./pages/FundingMatches";
// import BusinessDetailsForm from "./pages/BusinessDetailsForm";
import BusinessProfile from "./pages/Business/business-profile";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessDocuments from "./pages/Business/Documents/documents";
// import { AccountingConnect } from "./pages/AccountingConnect";
import NewApplication from "./pages/Applications/NewApplication";
import ApplicationReview from "./pages/ApplicationReview";
import OffersList from "./pages/OffersList";
import OfferDetails from "./pages/Business/OfferDetails";
import LenderProfile from "./pages/Lender/LenderProfile";
import LenderDashboard from "./pages/Lender/LenderDashboard";
import LenderBilling from "./pages/Lender/LenderBilling";
import LenderReporting from "./pages/Lender/LenderReporting";
import LearnPage from "./pages/Learn";
import HelpPage from "./pages/Help";
import MatchedApplicationsRedirect from "./pages/MatchedApplications";
import LenderMatchedApplications from "./pages/Lender/MatchedApplications";
import Messages from "./pages/Messages";
import ApplicationDetail from "./pages/Applications/ApplicationDetail";
import CreateOffer from "./pages/CreateOffer";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import BusinessDetail from "./pages/BusinessDetail";
import CreditScorePage from "./pages/CreditScore"; // Import the CreditScorePage

// Import the new SignUpJourney components
import SignUpFundingApplication from "./pages/SignUpJourney/FundingApplication";
import SignUpBusinessDetailsForm from "./pages/SignUpJourney/BusinessDetailsForm";
import IndustrySpecifics from "./pages/SignUpJourney/IndustrySpecifics";
import EmailPasswordPage from "./pages/SignUpJourney/EmailPasswordPage";
// import SignUpCustomizeOffers from "./pages/SignUpJourney/CustomizeOffers";

// Import Funding Options pages
import CashflowPage from "./pages/FundingOptions/Cashflow";
import AssetFinancePage from "./pages/FundingOptions/AssetFinance";

// Import Integration pages
import AccountingIntegrationPage from "./pages/Integrations/Accounting";
import BankingIntegrationPage from "./pages/Integrations/Banking";

// Import Account pages
import BusinessDetailsPage from "./pages/account/BusinessDetails";
import CurrentLendingPage from "./pages/account/CurrentLending";
import UsersPage from "./pages/account/Users";
import AdvisorPage from "./pages/account/Advisor";

// Import Products page
import Products from "./pages/Products";

// Import Help pages
import BusinessInsurancePage from "./pages/help/BusinessInsurance";
import ForeignExchangePage from "./pages/help/ForeignExchange";
import RaisingEquityPage from "./pages/help/RaisingEquity";

const queryClient = new QueryClient();

const App = () => {
  // Check if we should show coming soon page
  const showComingSoon = import.meta.env.VITE_COMING_SOON === 'true';
  
  if (showComingSoon) {
    return <ComingSoonPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <NavbarProvider>
                <SidebarProvider>
                  <TourProvider>
                    <ThemeStyles />
                    <TourOverlay />
                    <Toaster />
                    <Sonner />
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/for-businesses" element={<ForBusinesses />} />
                      <Route path="/for-lenders" element={<ForLenders />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cookies" element={<CookiePolicy />} />
                      <Route path="/sitemap" element={<Sitemap />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<SignUp />} />
                      
                      {/* Original routes - keep temporarily until everything is working */}
                      <Route path="/funding-matches" element={<FundingMatches />} />
                      {/* <Route path="/business-details" element={<BusinessDetailsForm />} /> */}
                      
                      {/* New SignUpJourney routes */}
                      <Route path="/signup-journey" element={<Navigate to="/signup-journey/email-password" replace />} />
                      <Route path="/signup-journey/email-password" element={<EmailPasswordPage />} />
                      <Route path="/signup-journey/apply" element={<SignUpFundingApplication />} />
                      <Route path="/signup-journey/business-details" element={<SignUpBusinessDetailsForm />} />
                      <Route path="/signup-journey/industry-specifics" element={<IndustrySpecifics />} />
                      {/* <Route path="/signup-journey/customize-offers" element={<SignUpCustomizeOffers />} /> */}
                      
                      {/* Protected routes */}
                      <Route element={<PrivateRoute />}>
                        {/* Business user routes */}
                        <Route path="/dashboard" element={<BusinessDashboard />} />
                        <Route path="/applications" element={<Applications />} />
                        <Route path="/applications/:id" element={<ApplicationDetail />} />
                        <Route path="/business/profile" element={<BusinessProfile />} />
                        <Route path="/business/dashboard" element={<BusinessDashboard />} />
                         <Route path="/business/learn" element={<LearnPage />} />
                        {/* <Route path="/business/accounting/connect" element={<AccountingConnect />} /> */}
                        <Route path="/applications/new" element={<NewApplication />} />
                        <Route path="/applications/:id/review" element={<ApplicationReview />} />
                        <Route path="/offers" element={<OffersList />} />
                        <Route path="/offers/:id" element={<OfferDetails />} />
                        

                        {/* Business Documents page */}
                        <Route path="/business/documents" element={<BusinessDocuments />} />

                        {/* Funding Options routes */}
                        <Route path="/funding-options/cashflow" element={<CashflowPage />} />
                        <Route path="/funding-options/asset-finance" element={<AssetFinancePage />} />

                        {/* Integration routes */}
                        <Route path="/integrations/accounting" element={<AccountingIntegrationPage />} />
                        <Route path="/integrations/banking" element={<BankingIntegrationPage />} />

                        {/* Account routes */}
                        <Route path="/account/business-details" element={<BusinessDetailsPage />} />
                        <Route path="/account/current-lending" element={<CurrentLendingPage />} />
                        <Route path="/account/users" element={<UsersPage />} />
                        <Route path="/account/advisor" element={<AdvisorPage />} />

                        {/* Add the new Credit Score route for business users */}
                        <Route path="/credit-score" element={<CreditScorePage />} />

                        {/* Learn/Education page for business users */}
                        <Route path="/learn" element={<LearnPage />} />
                        {/* Help/Support page for business users */}
                        <Route path="/help" element={<HelpPage />} />

                        {/* Help sub-pages */}
                        <Route path="/help/business-insurance" element={<BusinessInsurancePage />} />
                        <Route path="/help/foreign-exchange" element={<ForeignExchangePage />} />
                        <Route path="/help/raising-equity" element={<RaisingEquityPage />} />

                        {/* Lender user routes */}
                        <Route path="/lender/profile" element={<LenderProfile />} />
                        <Route path="/lender/dashboard" element={<LenderDashboard />} />
                        <Route path="/lender/billing" element={<LenderBilling />} />
                        <Route path="/lender/reporting" element={<LenderReporting />} />
                        <Route path="/lender/applications" element={<MatchedApplicationsRedirect />} />
                        <Route path="/matched-applications" element={<MatchedApplicationsRedirect />} />
                        <Route path="/lender/matched-applications" element={<LenderMatchedApplications />} />
                        <Route path="/business/:id" element={<BusinessDetail />} />
                        <Route path="/lender/applications/:id" element={<ApplicationDetail />} />
                        <Route path="/lender/applications/:id/offer" element={<CreateOffer />} />
                        <Route path="/create-offer/:id" element={<CreateOffer />} />
                        <Route path="/lender/offers" element={<OffersList />} />
                        
                        {/* Shared routes */}
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/notifications" element={<Notifications />} />
                      </Route>
                      
                      {/* Catch-all route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TourProvider>
                </SidebarProvider>
              </NavbarProvider>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
