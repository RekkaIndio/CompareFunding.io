import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SignUpLayout from '@/components/SignUpLayout';
import { getFirestore, doc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { analyzeFinancialDocument } from '@/services/openai/profitAndLoss';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Plus,
  Download
} from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  required: boolean;
  description: string;
  uploaded: boolean;
  file?: File;
}

const DocumentUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // Document upload state
  const [documents, setDocuments] = useState<DocumentType[]>([
    {
      id: 'signed-accounts',
      name: 'Signed Accounts',
      required: true,
      description: 'Most Recent Period',
      uploaded: false
    },
    {
      id: 'management-accounts',
      name: 'Management Accounts',
      required: true,
      description: 'Most Recent Period',
      uploaded: false
    },
    {
      id: 'aged-debtors',
      name: 'Aged Debtors',
      required: true,
      description: 'Most recent month end',
      uploaded: false
    },
    {
      id: 'aged-creditors',
      name: 'Aged Creditors',
      required: true,
      description: 'Most recent month end',
      uploaded: false
    }
  ]);

  // Colleague invitation state
  const [shouldInviteColleague, setShouldInviteColleague] = useState<string>('');
  const [colleagueEmail, setColleagueEmail] = useState<string>('');
  const [colleagueMessage, setColleagueMessage] = useState<string>('Hi there! I\'m applying for business funding and need your help uploading some financial documents. The platform is secure and will guide you through the process. Thanks for your assistance!');
  const [inviteSent, setInviteSent] = useState<boolean>(false);

  // Navigation steps
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Additional Details', path: '/signup-journey/additional-details' },
    { label: 'Current Funding', path: '/signup-journey/current-funding' },
    { label: 'HMRC Status', path: '/signup-journey/hmrc-status' },
    { label: 'Document Upload', path: '/signup-journey/document-upload' },
    { label: 'Lender Preferences', path: '/signup-journey/lender-preferences' },
    { label: 'Review & Submit', path: '/signup-journey/application-review' },
  ];
  const currentStep = 5;

  useEffect(() => {
    hideNavbar();
    
    // Try to restore form data from session storage
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      const savedFormData = sessionStorage.getItem('documentUploadFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setShouldInviteColleague(parsedData.shouldInviteColleague || '');
          setColleagueEmail(parsedData.colleagueEmail || '');
          setColleagueMessage(parsedData.colleagueMessage || 'Hi there! I\'m applying for business funding and need your help uploading some financial documents. The platform is secure and will guide you through the process. Thanks for your assistance!');
          setInviteSent(parsedData.inviteSent || false);
          // Note: We don't restore actual File objects, but we can restore the document upload status
          if (parsedData.documentsStatus) {
            setDocuments(prev => prev.map(doc => {
              const savedDoc = parsedData.documentsStatus.find((d: any) => d.id === doc.id);
              return savedDoc ? { ...doc, uploaded: savedDoc.uploaded } : doc;
            }));
          }
        } catch (error) {
          console.error('Error parsing saved document upload form data:', error);
        }
      }
    }
    
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  // Save form data to session storage whenever it changes
  useEffect(() => {
    const currentSession = sessionStorage.getItem('currentSignupSession');
    const formData = {
      shouldInviteColleague,
      colleagueEmail: shouldInviteColleague === 'yes' ? colleagueEmail : '',
      colleagueMessage: shouldInviteColleague === 'yes' ? colleagueMessage : '',
      inviteSent,
      // Store document upload status (but not the actual File objects)
      documentsStatus: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        uploaded: doc.uploaded
      }))
    };
    
    if (currentSession && (shouldInviteColleague !== '' || colleagueEmail !== '' || 
        documents.some(doc => doc.uploaded))) {
      sessionStorage.setItem('documentUploadFormData', JSON.stringify(formData));
    }
  }, [shouldInviteColleague, colleagueEmail, colleagueMessage, inviteSent, documents]);

  // Initialize Firebase references
  const db = getFirestore();
  const auth = getAuth();
  const storage = getStorage();

  const handlePrevious = () => {
    navigate('/signup-journey/hmrc-status', { state: userInfo });
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      toast({
        title: "Form incomplete",
        description: "Please complete all required fields before continuing.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save document upload data to user profile
      if (user?.uid) {
        const db = getFirestore();
        
        // If user chose to upload documents themselves and there are uploaded documents
        const hasUploadedDocuments = shouldInviteColleague === 'no' && 
          documents.some(doc => doc.uploaded && doc.file);
        
        const documentUploadData = {
          shouldInviteColleague,
          colleagueEmail: shouldInviteColleague === 'yes' ? colleagueEmail : '',
          colleagueMessage: shouldInviteColleague === 'yes' ? colleagueMessage : '',
          inviteSent,
          documentsStatus: documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            uploaded: doc.uploaded,
            required: doc.required,
            description: doc.description
          })),
          documentsUploaded: hasUploadedDocuments,
          updatedAt: serverTimestamp()
        };

        // Save to users collection
        await setDoc(doc(db, 'users', user.uid), {
          ...userInfo,
          documentUpload: documentUploadData
        }, { merge: true });

        // Also save to businesses collection for consistency
        await setDoc(doc(db, 'businesses', user.uid), {
          documentUpload: documentUploadData
        }, { merge: true });

        if (hasUploadedDocuments) {
          toast({
            title: "Documents uploaded",
            description: "Your documents have been uploaded successfully.",
            variant: "default"
          });
        }
      }

      // Navigate to next step with updated data
      navigate('/signup-journey/lender-preferences', { 
        state: { 
          ...userInfo, 
          documents,
          shouldInviteColleague,
          colleagueEmail: shouldInviteColleague === 'yes' ? colleagueEmail : '',
          colleagueMessage: shouldInviteColleague === 'yes' ? colleagueMessage : '',
          documentsUploaded: shouldInviteColleague === 'no' && documents.some(doc => doc.uploaded && doc.file)
        } 
      });
    } catch (error) {
      console.error('Error saving document upload data:', error);
      toast({
        title: "Save error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    const currentFormData = {
      documents,
      shouldInviteColleague,
      colleagueEmail: shouldInviteColleague === 'yes' ? colleagueEmail : '',
      colleagueMessage: shouldInviteColleague === 'yes' ? colleagueMessage : ''
    };

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
        navigate('/signup-journey/hmrc-status', { state: userInfo });
        break;
      case 5:
        // Current page
        break;
      case 6:
        navigate('/signup-journey/lender-preferences', { state: userInfo });
        break;
      case 7:
        navigate('/signup-journey/application-review', { state: { ...userInfo, ...currentFormData } });
        break;
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    // Check colleague invitation question is answered
    const colleagueQuestionAnswered = shouldInviteColleague !== '';
    
    if (!colleagueQuestionAnswered) return false;
    
    // If inviting colleague, check that email is provided and invite has been sent
    if (shouldInviteColleague === 'yes') {
      const colleagueValid = colleagueEmail.trim() !== '' && inviteSent;
      return colleagueValid;
    }
    
    // If not inviting colleague, check if required documents are uploaded
    if (shouldInviteColleague === 'no') {
      const requiredDocsUploaded = documents.filter(doc => doc.required).every(doc => doc.uploaded);
      return requiredDocsUploaded;
    }
    
    return false;
  };

  // Add function to process and save documents to Firebase with immediate analysis
  const saveDocumentForProcessing = async (documentId: string, file: File) => {
    const user = getAuth().currentUser;
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }

    try {
      const db = getFirestore();
      const storage = getStorage();
      
      // Upload file to storage
      const documentType = documents.find(doc => doc.id === documentId)?.name || 'Unknown Document';
      const storageRef = ref(storage, `businesses/${user.uid}/documents/${documentId}-${file.name}`);
      
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Process the document with OpenAI immediately in the background
      // This happens without user knowledge or loading indicators
      const aiResult = await analyzeFinancialDocument(file);
      
      // Add document reference to Firestore with processed data
      const financialsCollection = collection(db, "businesses", user.uid, "financials");
      await addDoc(financialsCollection, {
        documentType,
        documentName: file.name,
        documentKey: documentId, // Using the document ID as the key to match with document processing
        fileUrl: downloadURL,
        status: 'processed', // Mark as already processed
        data: aiResult.json || {},
        summary: aiResult.summary || '',
        uploadedAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        documentFormat: file.type
      });
      
      toast({
        title: "Document uploaded",
        description: `${documentType} has been uploaded successfully.`,
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error("Error processing document:", error);
      
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Handle file upload
  const handleFileUpload = (documentId: string, file: File | null) => {
    if (file) {
      // Save document for processing
      saveDocumentForProcessing(documentId, file);
    }
    
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, uploaded: !!file, file: file || undefined }
        : doc
    ));
  };

  // Handle document deletion
  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, uploaded: false, file: undefined }
        : doc
    ));
    
    toast({
      title: "Document removed",
      description: "The document has been removed. You can upload a new one.",
      variant: "default"
    });
  };

  // Handle colleague invitation change
  const handleShouldInviteColleagueChange = (value: string) => {
    setShouldInviteColleague(value);
    if (value === 'no') {
      setColleagueEmail('');
      setColleagueMessage('');
      setInviteSent(false);
    } else if (value === 'yes') {
      setInviteSent(false);
      // Reset to default message if it was cleared
      if (!colleagueMessage.trim()) {
        setColleagueMessage('Hi there! I\'m applying for business funding and need your help uploading some financial documents. The platform is secure and will guide you through the process. Thanks for your assistance!');
      }
    }
  };

  // Handle sending invite to colleague
  const handleSendInvite = async () => {
    if (!colleagueEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your colleague's email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implement actual email sending logic here
      // This would typically call a backend API to send the invitation email
      
      setInviteSent(true);
      
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${colleagueEmail}. We'll notify you when they upload the documents.`,
        variant: "default"
      });
      
      console.log('Sending invite to:', colleagueEmail);
      console.log('Message:', colleagueMessage);
      
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Failed to send invitation",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Save user profile information
  const saveUserProfile = async (profileData: any) => {
    if (!user) return;

    try {
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      
      // Set or update the user profile document
      await setDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      toast({
        title: "Profile saved",
        description: "Your profile information has been saved.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error saving user profile:", error);
      toast({
        title: "Save failed",
        description: "Failed to save profile information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sidebarProps = {
    title: "Document Upload",
    description: "Upload required documents yourself or invite a colleague to help with document submission.",
    highlight: "Seamless processing & analysis",
    tips: [
      "Upload documents yourself or invite someone to help",
      "Documents are automatically processed in the background",
      "Financial data is extracted and ready for your application",
      "All documents are encrypted and securely stored",
      "Documents can be updated anytime before final submission"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canGoBack={true}
      canGoNext={isFormValid()}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Document Upload
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Choose how you'd like to provide the required documents for your funding application
          </p>
        </div>

        <div className="space-y-6">
          {/* Colleague Invitation Section - Now at the top */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
                <Download className="h-5 w-5 text-blue-600" />
                Document Upload Method
              </CardTitle>
              <CardDescription className="text-gray-600">
                How would you like to provide the required documents for your application?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={shouldInviteColleague} 
                onValueChange={handleShouldInviteColleagueChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="invite-no" />
                  <Label htmlFor="invite-no" className="text-sm font-medium text-[#2a3441]">
                    No - I'll upload all documents myself
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="invite-yes" />
                  <Label htmlFor="invite-yes" className="text-sm font-medium text-[#2a3441]">
                    Yes - Invite a colleague or advisor to help
                  </Label>
                </div>
              </RadioGroup>

              {shouldInviteColleague === 'yes' && (
                <div className="mt-4 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-2 font-medium">
                      <Download className="h-4 w-4 inline mr-1" />
                      Collaborative Document Upload
                    </p>
                    <p className="text-sm text-blue-600 mb-2">
                      Your colleague will receive an email invitation to securely upload documents on your behalf
                    </p>
                    <p className="text-sm text-blue-600 mb-2">
                      We will notify you when your documents have been uploaded and are ready for review.
                    </p>
                    <p className="text-xs text-blue-500 italic">
                      You can continue to the next step after sending the invitation. Documents can be uploaded later.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="colleague-email" className="text-sm sm:text-base font-medium text-[#2a3441]">Colleague Email Address</Label>
                      <Input
                        id="colleague-email"
                        type="email"
                        value={colleagueEmail}
                        onChange={(e) => setColleagueEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="colleague-message" className="text-sm sm:text-base font-medium text-[#2a3441]">Personal Message (Optional)</Label>
                      <Textarea
                        id="colleague-message"
                        value={colleagueMessage}
                        onChange={(e) => setColleagueMessage(e.target.value)}
                        placeholder="Add a personal message to your invitation..."
                        className="bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                        rows={3}
                      />
                    </div>

                    <div className="pt-2">
                      {!inviteSent ? (
                        <Button
                          onClick={handleSendInvite}
                          disabled={!colleagueEmail.trim()}
                          className="w-full h-10 sm:h-12 bg-[#ff8000] hover:bg-[#e6720a] text-white font-medium rounded-lg sm:rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Send Invite
                        </Button>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-sm text-green-700 font-medium">
                              Invitation Sent Successfully
                            </p>
                          </div>
                          <p className="text-sm text-green-600 mb-2">
                            We've sent an invitation to <strong>{colleagueEmail}</strong>
                          </p>
                          <p className="text-sm text-green-600">
                            We will notify you when your documents have been uploaded and you can continue your application.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Show different messages based on selection */}
              {shouldInviteColleague === 'no' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-2 font-medium">
                    📋 Document Upload
                  </p>
                  <p className="text-sm text-green-600 mb-2">
                    You can upload your documents below to continue with your application.
                  </p>
                  <p className="text-sm text-green-700">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Documents will be processed automatically and ready for your application.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Upload Section - Only show when user chooses to upload themselves */}
          {shouldInviteColleague === 'no' && (
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Required Documents
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Upload the following documents to proceed with your application. 
                  Documents will be automatically processed to extract financial data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="group relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-blue-300 rounded-xl p-6 transition-all duration-200 hover:shadow-md">
                    {/* Header with title and status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${document.uploaded ? 'bg-green-100' : 'bg-blue-100'}`}>
                          <FileText className={`h-5 w-5 ${document.uploaded ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#2a3441] text-lg">
                              {document.name}
                            </h3>
                            {document.required && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{document.description}</p>
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex-shrink-0">
                        {document.uploaded ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Uploaded
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Upload area */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                          onChange={(e) => handleFileUpload(document.id, e.target.files?.[0] || null)}
                          className="h-12 bg-white border-2 border-dashed border-gray-300 hover:border-[#ff8000] focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg text-sm transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-[#ff8000] file:text-white hover:file:bg-[#e6720a]"
                        />
                        {!document.uploaded && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-gray-400 text-sm bg-white px-2 ml-32">
                              Choose file or drag and drop
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* File info */}
                      {document.uploaded && document.file && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800 truncate">
                              {document.file.name}
                            </p>
                            <p className="text-xs text-green-600">
                              File uploaded successfully
                            </p>
                          </div>
                          <Button
                            onClick={() => handleDeleteDocument(document.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            title="Remove document"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Supported formats */}
                      <div className="text-xs text-gray-500 mt-2">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Feature Note */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                Secure Document Processing
              </CardTitle>
              <CardDescription className="text-blue-600">
                Documents are securely stored and automatically processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                Your documents are encrypted in transit and at rest. Once uploaded, our system automatically 
                processes and extracts relevant financial data for your funding application. All information 
                is securely stored and ready for use in your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SignUpLayout>
  );
};

export default DocumentUpload;
