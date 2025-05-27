import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NavbarProvider } from '@/contexts/NavbarContext'; // Add this line
import { ThemeStyles } from '@/components/ThemeStyles';
import PrivateRoute from "@/components/PrivateRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ForBusinesses from "./pages/ForBusinesses";
import ForLenders from "./pages/ForLenders";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
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
import OfferDetails from "./pages/OfferDetails";
import LenderProfile from "./pages/Lender/LenderProfile";
import LenderDashboard from "./pages/Lender/LenderDashboard";
import LenderBilling from "./pages/Lender/LenderBilling";
import LearnPage from "./pages/Learn";
import HelpPage from "./pages/Help";
import MatchedApplications from "./pages/MatchedApplications";
import ApplicationDetail from "./pages/ApplicationDetail";
import CreateOffer from "./pages/CreateOffer";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import BusinessDetail from "./pages/BusinessDetail";
import CreditScorePage from "./pages/CreditScore"; // Import the CreditScorePage

// Import the new SignUpJourney components
import SignUpFundingApplication from "./pages/SignUpJourney/FundingApplication";
import SignUpFundingMatches from "./pages/SignUpJourney/FundingMatches";
import SignUpBusinessDetailsForm from "./pages/SignUpJourney/BusinessDetailsForm";
import EligibilityPage from "./pages/SignUpJourney/EligibilityPage";
import EmailPasswordPage from "./pages/SignUpJourney/EmailPasswordPage";
// import SignUpCustomizeOffers from "./pages/SignUpJourney/CustomizeOffers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <NavbarProvider> {/* Add this line */}
              <ThemeStyles />
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
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Original routes - keep temporarily until everything is working */}
                <Route path="/funding-matches" element={<FundingMatches />} />
                {/* <Route path="/business-details" element={<BusinessDetailsForm />} /> */}
                
                {/* New SignUpJourney routes */}
                <Route path="/signup-journey" element={<Navigate to="/signup-journey/email-password" replace />} />
                <Route path="/signup-journey/email-password" element={<EmailPasswordPage />} />
                <Route path="/signup-journey/apply" element={<SignUpFundingApplication />} />
                <Route path="/signup-journey/funding-matches" element={<SignUpFundingMatches />} />
                <Route path="/signup-journey/business-details" element={<SignUpBusinessDetailsForm />} />
                <Route path="/signup-journey/eligibility" element={<EligibilityPage />} />
                {/* <Route path="/signup-journey/customize-offers" element={<SignUpCustomizeOffers />} /> */}
                
                {/* Protected routes */}
                <Route element={<PrivateRoute />}>
                  {/* Business user routes */}
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

                  {/* Add the new Credit Score route for business users */}
                  <Route path="/credit-score" element={<CreditScorePage />} />

                  {/* Learn/Education page for business users */}
                  <Route path="/learn" element={<LearnPage />} />
                  {/* Help/Support page for business users */}
                  <Route path="/help" element={<HelpPage />} />

                  {/* Lender user routes */}
                  <Route path="/lender/profile" element={<LenderProfile />} />
                  <Route path="/lender/dashboard" element={<LenderDashboard />} />
                  <Route path="/lender/billing" element={<LenderBilling />} />
                  <Route path="/lender/applications" element={<MatchedApplications />} />
                  <Route path="/matched-applications" element={<MatchedApplications />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/lender/applications/:id" element={<ApplicationDetail />} />
                  <Route path="/lender/applications/:id/offer" element={<CreateOffer />} />
                  <Route path="/create-offer/:id" element={<CreateOffer />} />
                  <Route path="/lender/offers" element={<OffersList />} />
                  
                  {/* Shared routes */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NavbarProvider> {/* Add this line */}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
