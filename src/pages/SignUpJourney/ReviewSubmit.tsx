import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignUpLayout from '@/components/SignUpLayout';
import { CheckCircle, User, Building, FileText, PoundSterling, Activity } from 'lucide-react';
import { doc, getDoc, getFirestore, collection } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

const ReviewSubmit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const [userInfo, setUserInfo] = useState(location.state || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState<{score: number | null, risk_level: string | null}>({ score: null, risk_level: null });

  // Navigation steps
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Additional Details', path: '/signup-journey/additional-details' },
    { label: 'Current Funding', path: '/signup-journey/current-funding' },
    { label: 'HMRC Status', path: '/signup-journey/hmrc-status' },
    { label: 'Document Upload', path: '/signup-journey/document-upload' },
    { label: 'Lender Preferences', path: '/signup-journey/lender-preferences' },
    { label: 'Review & Submit', path: '/signup-journey/review' },
  ];
  const currentStep = 7;

  useEffect(() => {
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  // Fetch credit score data
  useEffect(() => {
    const fetchCreditData = async () => {
      if (!user?.uid) return;

      try {
        const db = getFirestore();
        console.log('Attempting to fetch credit score data for user:', user.uid);
        
        // Try to fetch from credit_score/latest first (most reliable location)
        const creditScoreDoc = await getDoc(doc(db, 'businesses', user.uid, 'credit_score', 'latest'));
        
        if (creditScoreDoc.exists()) {
          const data = creditScoreDoc.data();
          console.log('Found credit score in credit_score/latest:', data);
          setCreditScore({
            score: data.data?.score || data.score || null,
            risk_level: data.data?.risk_level || data.risk_level || null
          });
        } else {
          console.log('No data in credit_score/latest, trying financials/credit_score');
          // Try to fetch from financials/credit_score as fallback
          const financialsDoc = await getDoc(doc(db, 'businesses', user.uid, 'financials', 'credit_score'));
          
          if (financialsDoc.exists()) {
            const data = financialsDoc.data();
            console.log('Found credit score in financials/credit_score:', data);
            setCreditScore({
              score: data.data?.score || data.score || null,
              risk_level: data.data?.risk_level || data.risk_level || null
            });
          } else {
            console.log('No data in financials/credit_score, trying main business document');
            // Finally, try to fetch from main business document
            const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
            
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              console.log('Found business document:', businessData);
              
              if (businessData.credit_info) {
                const creditInfo = businessData.credit_info;
                console.log('Found credit_info in business document:', creditInfo);
                setCreditScore({
                  score: creditInfo.score || null,
                  risk_level: creditInfo.risk_level || null
                });
              } else {
                console.log('No credit_info in business document');
              }
            } else {
              console.log('No business document exists');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching credit score data:', error);
      }
    };

    // Always attempt to fetch credit data
    fetchCreditData();

  }, [user?.uid]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          setUserInfo(prev => ({ ...prev, ...userDoc.data() }));
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, [user?.uid]);

  const handlePrevious = () => {
    navigate('/signup-journey/lender-preferences', { state: userInfo });
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    switch (stepIndex) {
      case 0:
        navigate('/signup-journey/email-password', { state: userInfo });
        break;
      case 1:
        navigate('/signup-journey/business-details', { state: userInfo });
        break;
      case 2:
        navigate('/signup-journey/additional-details', { state: userInfo });
        break;
      case 3:
        navigate('/signup-journey/current-funding', { state: userInfo });
        break;
      case 4:
        navigate('/signup-journey/hmrc', { state: userInfo });
        break;
      case 5:
        navigate('/signup-journey/document-upload', { state: userInfo });
        break;
      case 6:
        navigate('/signup-journey/lender-preferences', { state: userInfo });
        break;
      case 7:
        // Current page
        break;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page or dashboard
      navigate('/business/dashboard', { 
        state: { 
          message: 'Application submitted successfully! We\'ll be in touch soon.' 
        } 
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      setIsSubmitting(false);
    }
  };

  const sidebarProps = {
    title: "Review & Submit",
    description: "Review your information and submit your funding application. We'll match you with suitable lenders.",
    highlight: "Almost there!",
    tips: [
      "Double-check all information is accurate",
      "You can edit any section by clicking on the previous steps",
      "Once submitted, we'll start matching you with lenders",
      "You'll receive updates via email and in your dashboard"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onPrevious={handlePrevious}
      canGoNext={true}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Review Your Application
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Please review your information before submitting your funding application
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-[#ff8000]" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{userInfo.firstName} {userInfo.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{userInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="font-medium">{userInfo.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium capitalize">{userInfo.role?.replace(/_/g, ' ')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-blue-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="font-medium">{userInfo.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company Number</p>
                <p className="font-medium">{userInfo.companyNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="font-medium capitalize">{userInfo.industry?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company Size</p>
                <p className="font-medium">{userInfo.companySize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <p className="font-medium">{userInfo.website}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Forecast Annual Revenue</p>
                <p className="font-medium">£{parseInt(userInfo.forecastRevenue || '0').toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Credit Score Information */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-purple-600" />
                Credit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Credit Score</p>
                {creditScore.score !== null ? (
                  <p className="font-medium">{creditScore.score}</p>
                ) : (
                  <p className="font-medium text-amber-600">Data being processed</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                {creditScore.risk_level !== null ? (
                  <p className="font-medium capitalize">{creditScore.risk_level}</p>
                ) : (
                  <p className="font-medium text-amber-600">Data being processed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Funding Requirements */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PoundSterling className="h-5 w-5 text-green-600" />
                Funding Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Selected Product</p>
                <p className="font-medium capitalize">{userInfo.selectedProduct?.replace(/-/g, ' ') || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Funding Purpose</p>
                <p className="font-medium capitalize">{userInfo.fundingPurpose?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Funding Amount</p>
                <p className="font-medium">£{parseInt(userInfo.fundingAmount || '0').toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Timeframe</p>
                <p className="font-medium capitalize">{userInfo.fundingTimeframe?.replace(/_/g, ' ')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {userInfo.additionalInfo && (
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{userInfo.additionalInfo}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Application...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Submit Application</span>
              </div>
            )}
          </Button>
        </div>

        {/* Terms and Conditions */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          <p>
            By submitting this application, you agree to our{' '}
            <a href="/terms" className="text-[#ff8000] hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#ff8000] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </SignUpLayout>
  );
};

export default ReviewSubmit;
