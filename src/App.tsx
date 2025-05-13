import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
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
import BusinessProfile from "./pages/BusinessProfile";
import BusinessDashboard from "./pages/BusinessDashboard";
// import { AccountingConnect } from "./pages/AccountingConnect";
import NewApplication from "./pages/NewApplication";
// import ApplicationReview from "./pages/ApplicationReview";
import OffersList from "./pages/OffersList";
import OfferDetails from "./pages/OfferDetails";
import LenderProfile from "./pages/LenderProfile";
import LenderDashboard from "./pages/LenderDashboard";
import LenderBilling from "./pages/LenderBilling";
import MatchedApplications from "./pages/MatchedApplications";
import ApplicationDetail from "./pages/ApplicationDetail";
import CreateOffer from "./pages/CreateOffer";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import BusinessDetail from "./pages/BusinessDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
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
              
              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                {/* Business user routes */}
                <Route path="/applications" element={<Applications />} />
                <Route path="/applications/:id" element={<ApplicationDetail />} />
                <Route path="/business/profile" element={<BusinessProfile />} />
                <Route path="/business/dashboard" element={<BusinessDashboard />} />
                {/* <Route path="/business/accounting/connect" element={<AccountingConnect />} /> */}
                <Route path="/applications/new" element={<NewApplication />} />
                {/* <Route path="/applications/:id/review" element={<ApplicationReview />} /> */}
                <Route path="/offers" element={<OffersList />} />
                <Route path="/offers/:id" element={<OfferDetails />} />
                
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
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
