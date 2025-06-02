import React, { useState, useEffect } from "react";
import { extractFinancialsWithOpenAI, OpenAIExtractResult } from "@/services/openai";
import FileExtractor, { ExtractedFile } from "./FileExtractor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FinancialsTable from "@/pages/Business/Documents/FinancialsTable";
import { Button } from "@/components/ui/button";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, updateDoc,
  query, orderBy, getDocs, where, limit, deleteDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';

import freeagentLogo from "@/assets/accountinglogos/freeagent.png";
import sageLogo from "@/assets/accountinglogos/sage.png";
import xeroLogo from "@/assets/accountinglogos/xero.png";
import PageLayout from "@/components/PageLayout";
import LogoModal from "./LogoModal";

// File validation utilities
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/tiff'
];

const validateFile = (file: File): { valid: boolean; message?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
    };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `File type ${file.type} not supported. Please upload a PDF, Excel, Word document or image file.`
    };
  }
  
  return { valid: true };
};

const DOCUMENT_STEPS = [
  {
    key: "pl",
    label: "Profit and Loss",
    description: "A summary of your business's revenues, costs, and expenses over a period. Shows net profit or loss."
  },
  {
    key: "bs",
    label: "Balance Sheet",
    description: "A snapshot of your business's assets, liabilities, and equity at a specific point in time."
  },
  {
    key: "tb",
    label: "Trial Balance",
    description: "A report listing all ledger accounts and their balances to check that debits equal credits."
  },
  {
    key: "ap",
    label: "Aged Payables",
    description: "A breakdown of amounts your business owes to suppliers, organized by due date."
  },
  {
    key: "ar",
    label: "Aged Receivables",
    description: "A breakdown of amounts owed to your business by customers, organized by due date."
  },
];

const BusinessDocuments: React.FC = (): JSX.Element => {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  // Modal state for each logo
  const [modal, setModal] = useState<null | "freeagent" | "sage" | "xero">(null);

  // State to track if we're loading saved documents
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);

  // Store extracted text for each document type
  const [extracted, setExtracted] = useState<{ [key: string]: ExtractedFile | null }>({});
  // Store OpenAI results for each document type
  const [aiResults, setAiResults] = useState<{ [key: string]: OpenAIExtractResult | null }>({});
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [aiError, setAiError] = useState<{ [key: string]: string | null }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: string }>({});
  const [savedDocs, setSavedDocs] = useState<{ [key: string]: { url: string; name: string; createdAt?: Date; docId?: string } }>({});

  // Sequential upload control
  const [currentUploadStep, setCurrentUploadStep] = useState<number>(0); // Index of the current document being uploaded
  const [completedUploads, setCompletedUploads] = useState<string[]>([]); // Keys of completed document uploads
  const [replacementMode, setReplacementMode] = useState<boolean>(false); // Whether we're in replacement mode
  const [replacingDocKey, setReplacingDocKey] = useState<string | null>(null); // Key of the document being replaced

  const db = getFirestore();
  const auth = getAuth();
  const storage = getStorage();

  const handleExtracted = (key: string) => async (result: ExtractedFile) => {
    // Check if we're not in replacement mode and this is not the current step
    if (!replacementMode && DOCUMENT_STEPS[currentUploadStep].key !== key) {
      toast({
        title: "Upload in sequence",
        description: `Please upload ${DOCUMENT_STEPS[currentUploadStep].label} first.`,
        variant: "destructive"
      });
      return;
    }

    // If in replacement mode, check if we're replacing the right document
    if (replacementMode && replacingDocKey !== key) {
      toast({
        title: "Invalid action",
        description: `You are currently replacing ${DOCUMENT_STEPS.find(s => s.key === replacingDocKey)?.label}.`,
        variant: "destructive"
      });
      return;
    }

    setFiles((prev) => ({ ...prev, [key]: result.file }));
    setExtracted((prev) => ({ ...prev, [key]: result }));
    setAiLoading((prev) => ({ ...prev, [key]: true }));
    setAiError((prev) => ({ ...prev, [key]: null }));
    try {
      const aiResult = await extractFinancialsWithOpenAI({
        text: result.content,
        docType: DOCUMENT_STEPS.find((s) => s.key === key)?.label || key,
      });
      setAiResults((prev) => ({ ...prev, [key]: aiResult }));
    } catch (err: any) {
      setAiError((prev) => ({ ...prev, [key]: err?.message || "OpenAI error" }));
      setAiResults((prev) => ({ ...prev, [key]: null }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Function to ensure the user has a valid business ID
  const ensureBusinessProfile = async (userId: string) => {
    try {
      console.log("Checking business profile for user:", userId);
      
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error("User document not found");
        throw new Error("User profile not found. Please try logging out and back in.");
      }
      
      const userData = userDoc.data();
      console.log("User data:", userData);
      
      let businessId = userData?.businessId;
      
      if (!businessId) {
        console.log("No business ID found, creating a new business record");
        
        // Create a new business record
        const businessesCollection = collection(db, "businesses");
        const newBusinessRef = await addDoc(businessesCollection, {
          name: auth.currentUser?.displayName || "Business Account",
          createdAt: serverTimestamp(),
          createdBy: userId,
          owner: userId,
          email: auth.currentUser?.email || "",
          active: true,
          verified: false
        });
        
        businessId = newBusinessRef.id;
        
        // Update the user record with the new business ID
        await updateDoc(userDocRef, {
          businessId: businessId,
          role: 'business' // Set the user role to 'business'
        });
        
        console.log("Created new business with ID:", businessId);
        
        toast({
          title: "Business profile created",
          description: "A new business profile has been created for you automatically.",
          variant: "default"
        });
      }
      
      return businessId;
    } catch (error) {
      console.error("Error ensuring business profile:", error);
      throw new Error("Failed to create business profile. Please try setting up your business profile first.");
    }
  };

  // Helper to generate a summary of what financial data was saved
  const getSavedDataSummary = (financialData: any, documentType: string): string => {
    try {
      let summaryParts = [];
      
      // Handle different document types
      if (documentType.toLowerCase().includes('profit') || documentType.toLowerCase().includes('loss')) {
        // Profit and Loss specific summary
        if (financialData.turnover || financialData.revenue?.total) {
          const revenue = financialData.turnover || financialData.revenue?.total || 0;
          summaryParts.push(`Revenue: £${Number(revenue).toLocaleString()}`);
        }
        
        if (financialData.profits?.netProfit || financialData.netProfit) {
          const profit = financialData.profits?.netProfit || financialData.netProfit || 0;
          summaryParts.push(`Net Profit: £${Number(profit).toLocaleString()}`);
        }
      } 
      else if (documentType.toLowerCase().includes('balance')) {
        // Balance Sheet specific summary
        if (financialData.assets?.totalAssets || financialData.totalAssets) {
          const assets = financialData.assets?.totalAssets || financialData.totalAssets || 0;
          summaryParts.push(`Total Assets: £${Number(assets).toLocaleString()}`);
        }
        
        if (financialData.liabilities?.totalLiabilities || financialData.totalLiabilities) {
          const liabilities = financialData.liabilities?.totalLiabilities || financialData.totalLiabilities || 0;
          summaryParts.push(`Total Liabilities: £${Number(liabilities).toLocaleString()}`);
        }
      }
      
      if (summaryParts.length > 0) {
        return `Saved metrics include ${summaryParts.join(', ')}.`;
      }
      
      return '';
    } catch (e) {
      console.error("Error generating data summary:", e);
      return '';
    }
  };

  const saveFinancialData = async (key: string, documentType: string) => {
    const result = aiResults[key];
    if (!result || !result.json) {
      toast({
        title: "No data to save",
        description: "Please extract financial data from a document first.",
        variant: "destructive"
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to save financial data.",
        variant: "destructive"
      });
      return;
    }

    setSaving((prev) => ({ ...prev, [key]: true }));
    setSaveStatus((prev) => ({ ...prev, [key]: "Preparing data..." }));
    
    try {
      const userId = user.uid;
      let documentUrl = null;
      
      if (files[key]) {
        setSaveStatus((prev) => ({ ...prev, [key]: "Uploading document..." }));
        const file = files[key] as File;
        const fileExtension = file.name.split('.').pop() || '';
        const fileName = `${documentType.replace(/\s/g, '_')}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `businesses/${userId}/documents/${fileName}`);
        await uploadBytes(storageRef, file);
        documentUrl = await getDownloadURL(storageRef);
      }
      
      setSaveStatus((prev) => ({ ...prev, [key]: "Saving financial data..." }));
      
      // Archive existing document if in replacement mode
      if (replacementMode && savedDocs[key]?.docId) {
        const docId = savedDocs[key].docId;
        const existingDocRef = doc(db, "businesses", userId, "financials", docId);
        const existingDocSnapshot = await getDoc(existingDocRef);
        
        if (existingDocSnapshot.exists()) {
          const existingDocData = existingDocSnapshot.data();
          
          // Create archive collection if it doesn't exist
          const archiveCollection = collection(db, "businesses", userId, "previous_financials");
          
          // Add the existing document to the archive
          await addDoc(archiveCollection, {
            ...existingDocData,
            archivedAt: serverTimestamp(),
            replacedBy: user.uid,
            originalDocId: docId
          });
          
          // Delete the existing document
          await deleteDoc(existingDocRef);
          
          console.log(`Archived document ${docId} for ${documentType}`);
        }
      }
      
      const financialsCollection = collection(db, "businesses", userId, "financials");
      
      // Extract just the summary text from the result
      let summaryText = '';
      if (typeof result.summary === 'string') {
        try {
          const parsedSummary = JSON.parse(result.summary);
          summaryText = parsedSummary.summary || '';
        } catch {
          summaryText = result.summary;
        }
      }
      
      const docRef = await addDoc(financialsCollection, {
        documentType,
        documentName: files[key]?.name || `${documentType} Document`,
        data: result.json || {},
        summary: summaryText, // Store just the summary text
        fileUrl: documentUrl,
        extractedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        documentFormat: files[key]?.type || 'unknown'
      });
      
      // Update the savedDocuments state
      setSavedDocs(prev => ({
        ...prev,
        [key]: {
          url: documentUrl || '', 
          name: files[key]?.name || `${documentType} Document`,
          createdAt: new Date(),
          docId: docRef.id // Store the document ID for future reference
        }
      }));
      
      // Update completed uploads if not in replacement mode
      if (!replacementMode) {
        setCompletedUploads(prev => {
          if (!prev.includes(key)) return [...prev, key];
          return prev;
        });
        
        // Move to next step if available
        if (currentUploadStep < DOCUMENT_STEPS.length - 1) {
          setCurrentUploadStep(currentUploadStep + 1);
        }
      } else {
        // Reset replacement mode after successful save
        setReplacementMode(false);
        setReplacingDocKey(null);
      }
      
      setSaveStatus((prev) => ({ ...prev, [key]: "Saved successfully!" }));
      
      toast({
        title: "Financial data saved",
        description: `The ${documentType} data has been saved to your business profile.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error saving financial data:", error);
      setSaveStatus((prev) => ({ ...prev, [key]: "Error saving data" }));
      toast({
        title: "Error saving data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Fetch saved documents when component mounts
  useEffect(() => {
    // Function to fetch user's saved documents from Firestore
    const fetchSavedDocuments = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        setLoadingSaved(true);
        
        // Use the user ID directly instead of getting a separate business ID
        const userId = currentUser.uid;

        // Query the financials collection for this user
        const financialsCollection = collection(db, "businesses", userId, "financials");
        const financialsQuery = query(
          financialsCollection, 
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(financialsQuery);
        const savedFinancials: { [key: string]: { url: string; name: string; createdAt?: Date; docId?: string } } = {};
        const savedResults: { [key: string]: OpenAIExtractResult } = {};
        const completedDocKeys: string[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Map document types to their corresponding keys
          const docTypeToKey: { [key: string]: string } = {
            'Profit and Loss': 'pl',
            'Balance Sheet': 'bs',
            'Trial Balance': 'tb',
            'Aged Payables': 'ap',
            'Aged Receivables': 'ar'
          };
          
          const key = docTypeToKey[data.documentType];
          if (key) {
            // Only store if we don't already have a document for this type
            // or if this document is more recent
            if (!savedFinancials[key] || 
                (data.createdAt && data.createdAt.toDate() > new Date(savedFinancials[key]?.createdAt || 0))) {
              savedFinancials[key] = {
                url: data.fileUrl || '',
                name: data.documentName || '',
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                docId: doc.id // Store the document ID for future reference
              };
              
              // Store the extracted data in savedResults
              if (data.data) {
                savedResults[key] = {
                  json: data.data,
                  summary: data.summary || ''
                };
              }
              
              // Add to completed uploads
              if (!completedDocKeys.includes(key)) {
                completedDocKeys.push(key);
              }
            }
          }
        });
        
        // Update state with saved documents and results
        setSavedDocs(savedFinancials);
        
        // Only set AI results for documents that aren't already being processed
        Object.entries(savedResults).forEach(([key, result]) => {
          if (!aiLoading[key]) {
            setAiResults(prev => ({ ...prev, [key]: result }));
          }
        });
        
        // Update completedUploads state
        setCompletedUploads(completedDocKeys);
        
        // Set the current upload step based on completed uploads
        // If all steps are complete, set to the last step
        // If some are complete, set to the next incomplete step
        if (completedDocKeys.length === DOCUMENT_STEPS.length) {
          setCurrentUploadStep(DOCUMENT_STEPS.length - 1);
        } else {
          // Find the first step that isn't completed
          const nextStepIndex = DOCUMENT_STEPS.findIndex(step => !completedDocKeys.includes(step.key));
          if (nextStepIndex !== -1) {
            setCurrentUploadStep(nextStepIndex);
          }
        }
        
        console.log("Loaded saved documents:", Object.keys(savedFinancials));
        // Find the first step that isn't completed
        const nextStepIndex = DOCUMENT_STEPS.findIndex(step => !completedDocKeys.includes(step.key));
        console.log("Current upload step set to:", nextStepIndex !== -1 ? nextStepIndex : 'last step');
      } catch (error) {
        console.error("Error fetching saved documents:", error);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedDocuments();
  }, [auth.currentUser]);

  // Component to display saved document information
  const SavedDocumentInfo = ({ docKey, documentType }: { docKey: string, documentType: string }) => {
    if (!savedDocs[docKey] || !savedDocs[docKey].url) {
      return null;
    }

    return (
      <div className="flex items-center justify-between bg-blue-50 rounded-md p-3 mt-3 text-sm">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span>
            <span className="font-medium">{documentType}</span> document saved: {savedDocs[docKey].name}
          </span>
        </div>
        <a 
          href={savedDocs[docKey].url} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
        >
          <span className="mr-1">View</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </a>
      </div>
    );
  };

  // Handle initiating document replacement
  const handleReplaceDocument = (key: string) => {
    // Only allow replacement if all documents are uploaded
    if (completedUploads.length < DOCUMENT_STEPS.length) {
      toast({
        title: "Complete all uploads first",
        description: "Please upload all required documents before replacing any.",
        variant: "destructive"
      });
      return;
    }
    
    setReplacementMode(true);
    setReplacingDocKey(key);
    
    toast({
      title: "Replacement mode",
      description: `You can now upload a new ${DOCUMENT_STEPS.find(s => s.key === key)?.label} document.`,
      variant: "default"
    });
  };

  // Document card component to handle the various states of each card
  const DocumentCard = ({ step, index }: { step: typeof DOCUMENT_STEPS[0], index: number }) => {
    const key = step.key;
    const isCompleted = completedUploads.includes(key);
    const isCurrent = currentUploadStep === index;
    const isReplacing = replacementMode && replacingDocKey === key;
    const isDisabled = !isCurrent && !isReplacing && !isCompleted;
    
    return (
      <div 
        key={key} 
        className={`
          bg-white rounded-lg shadow p-6 flex-1 min-w-[180px] max-w-[220px] 
          flex flex-col mx-auto relative
          ${isDisabled ? 'opacity-60 bg-gray-50' : 'bg-white'}
          ${isCompleted ? 'border-2 border-green-500' : ''}
          ${isCurrent ? 'border-2 border-blue-500' : ''}
          ${isReplacing ? 'border-2 border-orange-500' : ''}
          ${isDisabled && !isReplacing && !isCompleted ? 'pointer-events-none' : ''}
        `}
      >
        {/* Success badge for completed documents */}
        {isCompleted && !isReplacing && (
          <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {/* Current badge */}
        {isCurrent && !isCompleted && (
          <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
            </svg>
          </div>
        )}
        
        {/* Replacing badge */}
        {isReplacing && (
          <div className="absolute -top-3 -right-3 bg-orange-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
        
        <h2 className="text-lg font-semibold mb-2 text-center">{step.label}</h2>
        <p className="text-sm text-slate-500 mb-2 text-center">Upload your {step.label} document here.</p>
        
        {/* Show saved document info if completed */}
        {isCompleted && savedDocs[key] && !isReplacing && (
          <div className="bg-green-50 rounded p-2 mb-3 text-sm">
            <p className="text-green-700 font-medium text-center">{savedDocs[key].name}</p>
            
            {/* Replace button - only shown when all documents are uploaded */}
            {completedUploads.length === DOCUMENT_STEPS.length && (
              <button
                onClick={(e) => { 
                  e.preventDefault();
                  handleReplaceDocument(key);
                }}
                className="mt-2 w-full px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
              >
                Replace Document
              </button>
            )}
          </div>
        )}
        
        {/* Upload button - disabled if not current step and not in replacing mode */}
        {(!isCompleted || isReplacing) && (
          <>
            {/* Render disabled button UI when the card is disabled */}
            {isDisabled && !isReplacing ? (
              <span
                className="inline-block w-full px-4 py-2 font-semibold rounded text-center bg-gray-300 text-gray-500 opacity-70 cursor-not-allowed pointer-events-none"
              >
                Upload
              </span>
            ) : (
              /* Render active FileExtractor when the card is active */
              <FileExtractor
                accept="application/pdf,.csv,.xlsx,.xls,.doc,.docx,image/*"
                onExtracted={handleExtracted(key)}
                className="mb-2 block"
              >
                <span
                  className="inline-block w-full px-4 py-2 font-semibold rounded text-center cursor-pointer transition-colors bg-[#ff8000] text-white hover:bg-orange-600"
                >
                  {isReplacing ? 'Replace' : 'Upload'}
                </span>
              </FileExtractor>
            )}
            
            {files[key] && (
              <div className="text-green-700 text-sm text-center">Selected: {files[key]?.name}</div>
            )}
          </>
        )}
        
        {/* Loading indicator */}
        {aiLoading[key] && (
          <div className="flex items-center justify-center mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            <span className="text-xs text-blue-700">Processing...</span>
          </div>
        )}
        
        <div className="text-xs text-slate-400 mt-2 text-center">{step.description}</div>
      </div>
    );
  };

  return (
    <PageLayout showSidebar={true}>
      <div className="container py-8 mx-auto">
        {/* Header with instructional text and accounting software logos side by side */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">Upload Business Documents</h1>
            <p className="text-muted-foreground mb-0">Please upload the required documents for your business. Each document type has its own upload card below.</p>
          </div>
          <div className="flex items-center justify-center gap-8 flex-shrink-0">
            <img
              src={freeagentLogo}
              alt="FreeAgent"
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => setModal("freeagent")}
            />
            <img
              src={sageLogo}
              alt="Sage"
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => setModal("sage")}
            />
            <img
              src={xeroLogo}
              alt="Xero"
              className="h-10 w-auto object-contain rounded-full bg-white cursor-pointer"
              onClick={() => setModal("xero")}
            />
          </div>
        </div>

        {/* Logo Modal */}
        <LogoModal
          open={modal === "freeagent"}
          onClose={() => setModal(null)}
          imgSrc={freeagentLogo}
          alt="FreeAgent"
        />
        <LogoModal
          open={modal === "sage"}
          onClose={() => setModal(null)}
          imgSrc={sageLogo}
          alt="Sage"
        />
        <LogoModal
          open={modal === "xero"}
          onClose={() => setModal(null)}
          imgSrc={xeroLogo}
          alt="Xero"
        />

        {/* Upload status indicator - Display which document should be uploaded next */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="font-medium text-blue-700 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Upload Instructions
          </div>
          {replacementMode ? (
            <p className="text-sm text-blue-600">
              You are replacing your {DOCUMENT_STEPS.find(s => s.key === replacingDocKey)?.label} document. Your old document will be archived.
            </p>
          ) : completedUploads.length === DOCUMENT_STEPS.length ? (
            <p className="text-sm text-blue-600">
              All required documents have been uploaded. You can replace any document if needed.
            </p>
          ) : (
            <p className="text-sm text-blue-600">
              Please upload your documents in sequence. Current document to upload: 
              <span className="font-bold"> {DOCUMENT_STEPS[currentUploadStep].label}</span>
            </p>
          )}
          <div className="mt-2 flex">
            {DOCUMENT_STEPS.map((step, idx) => (
              <div 
                key={step.key} 
                className={`h-2 flex-1 mr-1 rounded ${
                  replacementMode && replacingDocKey === step.key
                    ? 'bg-orange-500' 
                    : completedUploads.includes(step.key) 
                      ? 'bg-green-500' 
                      : currentUploadStep === idx 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-6 flex-col md:flex-row md:justify-evenly">
          {DOCUMENT_STEPS.map((step, index) => (
            <DocumentCard key={step.key} step={step} index={index} />
          ))}
        </div>

        {/* Tabbed element for document details */}
        <div className="mt-12">
          <Tabs defaultValue={DOCUMENT_STEPS[0].key} className="w-full">
            <TabsList className="flex flex-wrap justify-center mb-4">
              {DOCUMENT_STEPS.map((step) => (
                <TabsTrigger
                  key={step.key}
                  value={step.key}
                  className="mx-2 data-[state=active]:text-[#ff8000] data-[state=active]:font-bold data-[state=inactive]:text-white"
                >
                  {step.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {DOCUMENT_STEPS.map((step) => (
              <TabsContent key={step.key} value={step.key} className="text-center p-4 bg-white rounded shadow">
                {/* Show OpenAI loading, error, summary, and JSON for this tab */}
                {aiLoading[step.key] && (
                  <div className="flex items-center justify-center bg-blue-50 rounded-lg p-6 my-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mr-3"></div>
                    <div className="text-blue-700">Processing document...</div>
                  </div>
                )}
                {aiError[step.key] && (
                  <div className="flex items-center bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded">
                    <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-red-800">Extraction failed</p>
                      <p className="text-sm text-red-700">{aiError[step.key]}</p>
                    </div>
                  </div>
                )}
                {/* Display ONLY the summary text, not the full JSON */}
                {aiResults[step.key]?.summary && (
                  <div className="text-left bg-white border border-gray-100 rounded-lg p-4 mt-4 mb-4 whitespace-pre-line shadow-sm">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <strong className="text-gray-800">Financial Summary</strong>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 pl-7 leading-relaxed">
                      {(() => {
                        // Extract the actual summary text from the complex string
                        const summaryContent = aiResults[step.key]?.summary;
                        
                        if (typeof summaryContent !== 'string' || !summaryContent.trim()) {
                          return "No summary available";
                        }

                        // Special handling for Trial Balance documents
                        if (step.key === 'tb') {
                          // Look for a "summary" field in the JSON
                          try {
                            // Try to find a summary property specifically for Trial Balance
                            const jsonData = aiResults[step.key]?.json;
                            if (jsonData && jsonData.summary && typeof jsonData.summary === 'string') {
                              return jsonData.summary;
                            }
                            
                            // Look for summary directly in the content
                            if (summaryContent.includes('"summary"')) {
                              const match = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
                              if (match && match[1]) {
                                return match[1].replace(/\\n/g, ' ')
                                              .replace(/\\"/g, '"')
                                              .trim();
                              }
                            }
                          } catch (e) {
                            console.error("Failed to extract Trial Balance summary:", e);
                          }
                        }
                        
                        // Check if the summary content is actually JSON
                        if (summaryContent.startsWith('{') && summaryContent.endsWith('}')) {
                          try {
                            const parsedSummary = JSON.parse(summaryContent);
                            if (parsedSummary.summary && typeof parsedSummary.summary === 'string') {
                              return parsedSummary.summary;
                            }
                          } catch (e) {
                            console.error("Failed to parse summary as JSON:", e);
                          }
                        }
                        
                        // If it contains markdown JSON with a nested summary field, extract that
                        if (summaryContent.includes('```json')) {
                          try {
                            // Extract just the actual summary text from the nested structure
                            const match = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
                            if (match && match[1]) {
                              // We found the actual summary text!
                              return match[1].replace(/\\n/g, ' ')
                                           .replace(/\\"/g, '"')
                                           .trim();
                            }
                          } catch (e) {
                            console.error("Failed to extract nested summary:", e);
                          }
                        }
                        
                        // For Trial Balance, if we still haven't found a good summary, try to extract from the JSON
                        if (step.key === 'tb' && typeof summaryContent === 'string') {
                          // The summary field might contain the entire JSON response, let's try to extract just the summary
                          const summaryMatch = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
                          if (summaryMatch && summaryMatch[1]) {
                            return summaryMatch[1].replace(/\\n/g, ' ')
                                                 .replace(/\\"/g, '"')
                                                 .trim();
                          }
                        }
                        
                        // If we couldn't extract a nested summary, just return the original
                        // But for Trial Balance, return a generic summary if everything else fails
                        if (step.key === 'tb') {
                          // Get the total debits/credits if available
                          try {
                            const jsonData = aiResults[step.key]?.json;
                            if (jsonData?.totals?.totalDebit || jsonData?.totals?.totalCredit) {
                              const totalDebit = jsonData.totals.totalDebit;
                              return `Trial Balance summary showing total debits and credits of ${totalDebit}.`;
                            }
                          } catch (e) {
                            console.error("Failed to create fallback Trial Balance summary:", e);
                          }
                          
                          return "Trial Balance summary showing accounts with their debit and credit balances.";
                        }
                        
                        return summaryContent;
                      })()}
                    </div>
                  </div>
                )}

                {/* Display saved document info if available */}
                <SavedDocumentInfo docKey={step.key} documentType={step.label} />
                
                {/* Use the FinancialsTable component to display only the JSON data, explicitly not passing summary */}
                {aiResults[step.key]?.json && (
                  <div className="text-left bg-white rounded-lg shadow p-5 mt-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <h4 className="text-lg font-semibold text-gray-800">Financial Metrics</h4>
                      </div>
                      
                      <Button 
                        onClick={() => saveFinancialData(step.key, step.label)}
                        disabled={saving[step.key]}
                        className="bg-[#ff8000] hover:bg-orange-600 text-white border-none"
                        size="sm"
                        title={files[step.key] ? "Save financial data and document to your profile" : "Save financial data to your profile"}
                      >
                        {saving[step.key] ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            {saveStatus[step.key] || "Saving..."}
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {files[step.key] ? "Save Data & Document" : "Save to Profile"}
                          </>
                        )}
                      </Button>
                    </div>

                    {files[step.key] && (
                      <div className="flex items-center bg-blue-50 rounded-md p-2 mb-4 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-blue-700">
                          Document file <span className="font-medium">{files[step.key]?.name}</span> will be saved along with the data
                        </span>
                      </div>
                    )}
                    
                    {savedDocs[step.key] && (
                      <div className="flex items-center justify-between bg-green-50 rounded-md p-3 mb-4 text-sm">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-700">
                            Document <span className="font-medium">{savedDocs[step.key].name}</span> saved successfully
                          </span>
                        </div>
                        <Button
                          onClick={() => window.open(savedDocs[step.key].url, '_blank')}
                          variant="outline" 
                          size="sm"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Document
                        </Button>
                      </div>
                    )}
                    
                    {/* Use the FinancialsTable component to display only the JSON data, explicitly not passing summary */}
                    <FinancialsTable 
                      data={(() => {
                        // Create a cleaned copy of the data without any summary fields
                        let cleanData = aiResults[step.key]?.json;
                        
                        // Safety check
                        if (!cleanData) return {};
                        
                        // If cleanData is a string, try to parse it
                        if (typeof cleanData === 'string') {
                          try {
                            cleanData = JSON.parse(cleanData);
                          } catch (e) {
                            console.error("Failed to parse JSON string:", e);
                            return {};
                          }
                        }
                        
                        // Deep clone the object to avoid modifying the original
                        cleanData = JSON.parse(JSON.stringify(cleanData));
                        
                        // Recursive function to remove summary and description fields at all levels
                        const removeSummaryFields = (obj: any): any => {
                          if (typeof obj !== 'object' || obj === null) return obj;
                          
                          if (Array.isArray(obj)) {
                            return obj.map(item => removeSummaryFields(item));
                          } else {
                            const result = {...obj};
                            
                            // Remove summary and description fields with various possible names
                            ['summary', 'Summary', 'financialSummary', 'businessSummary', 'companySummary', 
                             'description', 'Description', 'financialDescription', 'businessDescription'].forEach(key => {
                              if (key in result) delete result[key];
                            });
                            
                            // Check for keys containing "summary" or "description"
                            Object.keys(result).forEach(key => {
                              if (key.toLowerCase().includes('summary') || key.toLowerCase().includes('description')) {
                                delete result[key];
                              } else if (typeof result[key] === 'object' && result[key] !== null) {
                                result[key] = removeSummaryFields(result[key]);
                              }
                            });
                            
                            return result;
                          }
                        };
                        
                        return removeSummaryFields(cleanData);
                      })()} 
                      title={`${step.label} Financial Data`}
                    />
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessDocuments;
