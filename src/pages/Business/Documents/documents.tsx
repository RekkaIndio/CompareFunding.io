import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeFinancialDocument, FinancialDataResult } from "@/services/openai/profitAndLoss";
import FileExtractor, { ExtractedFile } from "./FileExtractor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FinancialsTable from "@/pages/Business/Documents/FinancialsTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, updateDoc,
  query, orderBy, getDocs, where, limit, deleteDoc
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { auth } from '@/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

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
    key: "signed-accounts",
    label: "Signed Accounts",
    description: "Most Recent Period"
  },
  {
    key: "management-accounts",
    label: "Management Accounts",
    description: "Most Recent Period"
  },
  {
    key: "aged-debtors",
    label: "Aged Debtors",
    description: "Most recent month end"
  },
  {
    key: "aged-creditors",
    label: "Aged Creditors",
    description: "Most recent month end"
  },
];

const BusinessDocuments: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  // Modal state for each logo
  const [modal, setModal] = useState<null | "freeagent" | "sage" | "xero">(null);
  // State for completion popup
  const [showCompletionDialog, setShowCompletionDialog] = useState<boolean>(false);

  // State to track if we're loading saved documents
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);

  // Add state to track processing of pending documents from signup
  const [processingPendingDocs, setProcessingPendingDocs] = useState<boolean>(false);
  const [pendingDocsCount, setPendingDocsCount] = useState<number>(0);

  // Store extracted text for each document type
  const [extracted, setExtracted] = useState<{ [key: string]: ExtractedFile | null }>({});
  // Store OpenAI results for each document type
  const [aiResults, setAiResults] = useState<{ [key: string]: FinancialDataResult | null }>({});
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const [aiError, setAiError] = useState<{ [key: string]: string | null }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: string }>({});
  const [savedDocs, setSavedDocs] = useState<{ [key: string]: { url: string; name: string; createdAt?: Date; docId?: string } }>({});

  // Sequential upload control
  const [currentUploadStep, setCurrentUploadStep] = useState<number>(0); // Index of the current document being uploaded
  const [completedUploads, setCompletedUploads] = useState<string[]>([]); // Keys of completed document uploads
  const [skippedUploads, setSkippedUploads] = useState<string[]>([]); // Keys of skipped document uploads
  const [replacementMode, setReplacementMode] = useState<boolean>(false); // Whether we're in replacement mode
  const [replacingDocKey, setReplacingDocKey] = useState<string | null>(null); // Key of the document being replaced
  // Track when documents were last processed to prevent overwriting fresh data
  const [lastProcessedTime, setLastProcessedTime] = useState<{ [key: string]: number }>({});
  
  // Tab control - automatically sync with current upload step
  const [activeTab, setActiveTab] = useState<string>(DOCUMENT_STEPS[0].key);

  const db = getFirestore();
  const storage = getStorage();

  const handleExtracted = (key: string) => async (result: ExtractedFile) => {
    // In replacement mode, check if we're replacing the right document
    if (replacementMode && replacingDocKey !== key) {
      toast({
        title: "Invalid action",
        description: `You are currently replacing ${DOCUMENT_STEPS.find(s => s.key === replacingDocKey)?.label}.`,
        variant: "destructive"
      });
      return;
    }
    
    // No longer forcing strict sequence - users can upload any document

    // Check if another document is currently processing
    const isAnotherDocLoading = Object.values(aiLoading).some(val => val === true);
    if (isAnotherDocLoading) {
      toast({
        title: "Document already processing",
        description: "Please wait for the current document to finish processing before uploading another.",
        variant: "destructive"
      });
      return;
    }
    
    setFiles((prev) => ({ ...prev, [key]: result.file }));
    setExtracted((prev) => ({ ...prev, [key]: result }));
    setAiLoading((prev) => ({ ...prev, [key]: true }));
    setAiError((prev) => ({ ...prev, [key]: null }));
    
    try {
      const documentType = DOCUMENT_STEPS.find((s) => s.key === key)?.label || key;
      
      // Use the new comprehensive analyzer for all financial documents
      const aiResult = await analyzeFinancialDocument(result.file);
      
      setAiResults((prev) => ({ ...prev, [key]: aiResult }));
      
      // Track when this document was processed
      setLastProcessedTime(prev => ({ ...prev, [key]: Date.now() }));
      
      // Check if meaningful financial data was extracted
      const hasFinancialData = aiResult.json && (
        (aiResult.json.lineItems && Array.isArray(aiResult.json.lineItems) && aiResult.json.lineItems.length > 0) ||
        aiResult.json.profitAndLoss ||
        aiResult.json.balanceSheet ||
        aiResult.json.trialBalance ||
        aiResult.json.agedPayables ||
        aiResult.json.agedReceivables
      );
      
      if (hasFinancialData) {
        toast({
          title: "Processing complete",
          description: `${documentType} data extracted successfully.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Document processed",
          description: `${documentType} was processed but limited financial data was extracted. This may be due to document format or quality.`,
          variant: "default"
        });
      }
    } catch (err: any) {
      console.error(`AI processing failed for ${key}:`, err);
      setAiError((prev) => ({ ...prev, [key]: err?.message || "Processing error" }));
      setAiResults((prev) => ({ ...prev, [key]: null }));
      
      toast({
        title: "Processing failed",
        description: `Failed to process ${DOCUMENT_STEPS.find((s) => s.key === key)?.label || key}. Please try again or upload a different format.`,
        variant: "destructive"
      });
    } finally {
      setAiLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Add useEffect for auto-saving when aiResults changes
  useEffect(() => {
    const autoSaveDocument = async (key: string) => {
      const result = aiResults[key];
      if (!result || !result.json) return;
      
      if (!aiLoading[key] && !saving[key]) {
        const documentType = DOCUMENT_STEPS.find((s) => s.key === key)?.label || key;
        await saveFinancialData(key, documentType);
      }
    };

    // Check each document type for new results
    DOCUMENT_STEPS.forEach(step => {
      if (aiResults[step.key]) {
        autoSaveDocument(step.key);
      }
    });
  }, [aiResults]);

  // New useEffect to process pending documents from signup journey
  useEffect(() => {
    const processPendingDocuments = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const financialsCollection = collection(db, "businesses", currentUser.uid, "financials");
        
        // Query for documents with pending_processing status (legacy documents that weren't immediately processed)
        const pendingQuery = query(
          financialsCollection,
          where("status", "==", "pending_processing"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(pendingQuery);
        
        if (!querySnapshot.empty) {
          setPendingDocsCount(querySnapshot.size);
          setProcessingPendingDocs(true);
          
          // Process each pending document
          for (const docSnapshot of querySnapshot.docs) {
            const docData = docSnapshot.data();
            const documentKey = docData.documentKey;
            const fileUrl = docData.fileUrl;
            const documentType = docData.documentType;
            
            if (!fileUrl || !documentKey) continue;
            
            try {
              // Skip if this document type is already being processed or completed
              if (aiLoading[documentKey] || completedUploads.includes(documentKey)) {
                continue;
              }
              
              // Fetch the file from Storage
              const response = await fetch(fileUrl);
              const blob = await response.blob();
              const file = new File([blob], docData.documentName || 'document', { 
                type: docData.documentFormat || 'application/pdf' 
              });
              
              // Set loading state
              setAiLoading(prev => ({ ...prev, [documentKey]: true }));
              setAiError(prev => ({ ...prev, [documentKey]: null }));
              
              // Process the document with OpenAI
              const aiResult = await analyzeFinancialDocument(file);
              
              // Update the document status and add processed data
              await updateDoc(doc(db, "businesses", currentUser.uid, "financials", docSnapshot.id), {
                status: 'processed',
                data: aiResult.json || {},
                summary: aiResult.summary || '',
                processedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              
              // Update local state
              setFiles(prev => ({ ...prev, [documentKey]: file }));
              setAiResults(prev => ({ ...prev, [documentKey]: aiResult }));
              setSavedDocs(prev => ({
                ...prev,
                [documentKey]: {
                  url: fileUrl,
                  name: docData.documentName || `${documentType} Document`,
                  createdAt: docData.createdAt ? docData.createdAt.toDate() : new Date(),
                  docId: docSnapshot.id
                }
              }));
              
              // Mark as completed
              setCompletedUploads(prev => {
                if (!prev.includes(documentKey)) {
                  return [...prev, documentKey];
                }
                return prev;
              });
              
              toast({
                title: "Document processed",
                description: `${documentType} from signup journey has been processed successfully.`,
                variant: "default"
              });
              
            } catch (error) {
              console.error(`Error processing pending document ${documentKey}:`, error);
              setAiError(prev => ({ ...prev, [documentKey]: error.message || "Processing failed" }));
              
              // Update document status to error
              await updateDoc(doc(db, "businesses", currentUser.uid, "financials", docSnapshot.id), {
                status: 'error',
                errorMessage: error.message || "Processing failed",
                updatedAt: serverTimestamp()
              });
              
              toast({
                title: "Processing failed",
                description: `Failed to process ${documentType} from signup journey.`,
                variant: "destructive"
              });
            } finally {
              setAiLoading(prev => ({ ...prev, [documentKey]: false }));
            }
          }
          
          setProcessingPendingDocs(false);
          setPendingDocsCount(0);
        }
      } catch (error) {
        console.error("Error checking for pending documents:", error);
        setProcessingPendingDocs(false);
        setPendingDocsCount(0);
      }
    };

    // Process pending documents after initial load
    const timer = setTimeout(() => {
      processPendingDocuments();
    }, 2000); // Wait 2 seconds to ensure component is fully loaded

    return () => clearTimeout(timer);
  }, [auth.currentUser]); // Only run when user changes

  // Function to ensure the user has a valid business ID
  const ensureBusinessProfile = async (userId: string) => {
    try {

      
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error("User document not found");
        throw new Error("User profile not found. Please try logging out and back in.");
      }
      
      const userData = userDoc.data();

      
      let businessId = userData?.businessId;
      
      if (!businessId) {

        
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
          const newCompleted = prev.includes(key) ? prev : [...prev, key];
          
          // Check if all documents are now either completed or skipped
          const totalProcessed = newCompleted.length + skippedUploads.length;
          if (totalProcessed === DOCUMENT_STEPS.length && !showCompletionDialog) {
            // Show completion dialog after a short delay to ensure UI updates
            setTimeout(() => {
              setShowCompletionDialog(true);
            }, 500);
          }
          
          return newCompleted;
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
      
      setSaveStatus((prev) => ({ ...prev, [key]: "Auto-saved successfully!" }));
      
      toast({
        title: "Document auto-saved",
        description: `${documentType} has been automatically saved to your business profile.`,
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

      // Don't fetch if we're currently in replacement mode to avoid overwriting freshly processed data
      if (replacementMode) {
        return;
      }

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
        const savedResults: { [key: string]: FinancialDataResult } = {};
        const completedDocKeys: string[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Map document types to their corresponding keys
          const docTypeToKey: { [key: string]: string } = {
            'Signed Accounts': 'signed-accounts',
            'Management Accounts': 'management-accounts', 
            'Aged Debtors': 'aged-debtors',
            'Aged Creditors': 'aged-creditors',
            // Legacy mappings for backwards compatibility
            'Profit and Loss': 'signed-accounts',
            'Balance Sheet': 'signed-accounts',
            'Trial Balance': 'management-accounts',
            'Aged Payables': 'aged-creditors',
            'Aged Receivables': 'aged-debtors'
          };
          
          // Try to find the key using documentType first
          let key = docTypeToKey[data.documentType];
          
          // If no key found from documentType, try documentKey for signup journey documents
          if (!key && data.documentKey) {
            key = data.documentKey;
          }
          
          // If still no key, check if it's one of our expected document step keys
          if (!key && DOCUMENT_STEPS.some(step => step.key === data.documentType)) {
            key = data.documentType;
          }
          
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
              
              // Store the extracted data in savedResults only if processed
              if (data.data && data.status !== 'pending_processing') {
                savedResults[key] = {
                  json: data.data,
                  summary: data.summary || ''
                };
                
                // Add to completed uploads only if processed
                if (!completedDocKeys.includes(key)) {
                  completedDocKeys.push(key);
                }
              } else {
                // Skip if this document type not fully processed yet
              }
            }
          } else {
            // No mapping found for document type
          }
        });
        
        // Update state with saved documents and results
        setSavedDocs(savedFinancials);
        
        // Set AI results for all saved documents - we want to load them back into the UI
        Object.entries(savedResults).forEach(([key, result]) => {
          setAiResults(prev => ({ ...prev, [key]: result }));
        });
        
        // Update completedUploads state
        setCompletedUploads(completedDocKeys);
        
        // Set the current upload step based on completed uploads
        // If all steps are complete, set to the last step
        // If some are complete, set to the next incomplete step
        if (completedDocKeys.length === DOCUMENT_STEPS.length) {
          setCurrentUploadStep(DOCUMENT_STEPS.length - 1);
        } else {
          // Find the first step that isn't completed or skipped
          const nextStepIndex = DOCUMENT_STEPS.findIndex(step => 
            !completedDocKeys.includes(step.key) && !skippedUploads.includes(step.key)
          );
          if (nextStepIndex !== -1) {
            setCurrentUploadStep(nextStepIndex);
          }
        }
        

        // Find the first step that isn't completed
        const nextStepIndex = DOCUMENT_STEPS.findIndex(step => !completedDocKeys.includes(step.key));

      } catch (error) {
        console.error("Error fetching saved documents:", error);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedDocuments();
  }, [auth.currentUser, replacementMode]);

  // Automatically update active tab when current upload step changes
  useEffect(() => {
    if (!replacementMode && currentUploadStep < DOCUMENT_STEPS.length) {
      // Find the next step that isn't completed or skipped
      const nextStepIndex = DOCUMENT_STEPS.findIndex(step => 
        !completedUploads.includes(step.key) && !skippedUploads.includes(step.key)
      );
      
      if (nextStepIndex !== -1) {
        setActiveTab(DOCUMENT_STEPS[nextStepIndex].key);
      } else if (DOCUMENT_STEPS[currentUploadStep]) {
        setActiveTab(DOCUMENT_STEPS[currentUploadStep].key);
      }
    }
  }, [currentUploadStep, replacementMode, completedUploads, skippedUploads]);

  // Component to display saved document information
  const SavedDocumentInfo = ({ docKey, documentType }: { docKey: string, documentType: string }) => {
    if (!savedDocs[docKey] || !savedDocs[docKey].url) {
      return null;
    }

    return (
      <div className="flex items-center justify-between bg-blue-50 rounded-md p-3 mt-3 text-sm">
        <div className="flex items-center flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span>
            <span className="font-medium">{documentType}</span> document saved: {savedDocs[docKey].name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { 
              e.preventDefault();
              if (window.confirm('Are you sure you want to delete this document?')) {
                handleDeleteDocument(docKey);
              }
            }}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
    setActiveTab(key); // Set the active tab to the document being replaced
    
    toast({
      title: "Replacement mode",
      description: `You can now upload a new ${DOCUMENT_STEPS.find(s => s.key === key)?.label} document.`,
      variant: "default"
    });
  };

  // Handler for "Make Application" button in completion dialog
  const handleMakeApplication = () => {
    setShowCompletionDialog(false);
    navigate('/applications/new'); // Navigate to application page
  };

  // Handler for "Explore Dashboard" button in completion dialog
  const handleExploreDashboard = () => {
    setShowCompletionDialog(false);
    navigate('/business/dashboard'); // Navigate to business dashboard
  };

  // Handler for skipping a document
  const handleSkipDocument = (key: string) => {
    // No longer enforce strict sequencing - users can skip any document that isn't completed

    // Add to skipped uploads
    setSkippedUploads(prev => {
      if (!prev.includes(key)) return [...prev, key];
      return prev;
    });

    // Move to next step if available
    if (currentUploadStep < DOCUMENT_STEPS.length - 1) {
      setCurrentUploadStep(currentUploadStep + 1);
    } else {
      // Check if all documents are either completed or skipped
      const totalProcessed = completedUploads.length + skippedUploads.length + 1; // +1 for current skip
      if (totalProcessed === DOCUMENT_STEPS.length && !showCompletionDialog) {
        setTimeout(() => {
          setShowCompletionDialog(true);
        }, 500);
      }
    }

    toast({
      title: "Document skipped",
      description: `${DOCUMENT_STEPS.find(s => s.key === key)?.label} has been skipped. You can upload it later if needed.`,
      variant: "default"
    });
  };

  // Document card component to handle the various states of each card
  const DocumentCard = ({ step, index }: { step: typeof DOCUMENT_STEPS[0], index: number }) => {
    const key = step.key;
    const isCompleted = completedUploads.includes(key);
    const isSkipped = skippedUploads.includes(key);
    const isCurrent = currentUploadStep === index;
    const isReplacing = replacementMode && replacingDocKey === key;
    const isDisabled = false; // No longer disable any document cards - users can interact with any document
    
    return (
      <div 
        key={key} 
        className={`
          bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 
          border border-slate-200/50 hover:border-slate-300 overflow-hidden p-6 flex flex-col h-full relative
          ${isDisabled ? 'opacity-60' : ''}
          ${isCompleted ? 'border-green-400 shadow-green-100' : ''}
          ${isSkipped ? 'border-yellow-400 shadow-yellow-100' : ''}
          ${isCurrent ? 'border-blue-400 shadow-blue-100' : ''}
          ${isReplacing ? 'border-orange-400 shadow-orange-100' : ''}
        `}
      >
        {/* Enhanced status indicator bar */}
        <div className={`h-1.5 w-full absolute top-0 left-0 ${
          isReplacing ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
          isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 
          isSkipped ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
          isCurrent ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
          'bg-gradient-to-r from-gray-300 to-gray-400'
        }`}></div>

        {/* Enhanced success badge for completed documents */}
        {isCompleted && !isReplacing && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {/* Enhanced current badge */}
        {isCurrent && !isCompleted && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
            </svg>
          </div>
        )}
        
        {/* Enhanced replacing badge */}
        {isReplacing && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
        
        {/* Enhanced skipped badge */}
        {isSkipped && !isReplacing && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1 pt-2">
          <h2 className="text-lg font-semibold mb-3 text-center text-gray-800">{step.label}</h2>
          <p className="text-sm text-slate-600 mb-4 text-center leading-relaxed">
            Upload your {step.label} document here.
          </p>
          
          {/* Enhanced saved document info */}
          {isCompleted && savedDocs[key] && !isReplacing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-700 font-medium text-sm flex-1">{savedDocs[key].name}</p>
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    if (window.confirm('Are you sure you want to delete this document?')) {
                      handleDeleteDocument(key);
                    }
                  }}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {/* Enhanced replace button */}
              {(completedUploads.length + skippedUploads.length) === DOCUMENT_STEPS.length && (
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    handleReplaceDocument(key);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-lg hover:from-orange-200 hover:to-orange-300 transition-all duration-200 font-medium"
                >
                  Replace Document
                </button>
              )}
            </div>
          )}
          
          {/* Enhanced skipped document info */}
          {isSkipped && !isReplacing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-yellow-700 font-medium text-sm">Document Skipped</p>
              </div>
              <p className="text-yellow-600 text-xs mb-3">You can upload this later if needed</p>
              
              {/* Enhanced upload button for skipped documents */}
              {(completedUploads.length + skippedUploads.length) === DOCUMENT_STEPS.length && (
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    setSkippedUploads(prev => prev.filter(skipped => skipped !== key));
                    setReplacementMode(true);
                    setReplacingDocKey(key);
                    setActiveTab(key);
                  }}
                  className="w-full px-3 py-2 text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 font-medium"
                >
                  Upload Now
                </button>
              )}
            </div>
          )}
          
          {/* Enhanced upload section */}
          {(!isCompleted && !isSkipped) || isReplacing ? (
            <>
              {/* Disabled state */}
              {isDisabled && !isReplacing ? (
                <div className="space-y-3">
                  <div className="w-full px-4 py-3 font-medium rounded-lg text-center bg-gray-200 text-gray-500 opacity-70 cursor-not-allowed">
                    Upload
                  </div>
                  <div className="w-full px-4 py-2 text-sm font-medium rounded-lg text-center bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed">
                    Skip
                  </div>
                </div>
              ) : (
                /* Enhanced active FileExtractor */
                <div className="space-y-3">
                  <FileExtractor
                    accept="application/pdf,.csv,.xlsx,.xls,.doc,.docx,image/*"
                    onExtracted={handleExtracted(key)}
                    className="block"
                  >
                    <div className="w-full px-4 py-3 font-semibold rounded-lg text-center cursor-pointer transition-all duration-200 bg-gradient-to-r from-[#ff8000] to-[#ff6b35] text-white hover:from-[#e67300] hover:to-[#e55a00] hover:shadow-lg transform hover:scale-105">
                      {isReplacing ? 'Replace' : 'Upload'}
                    </div>
                  </FileExtractor>
                    
                    {/* Enhanced skip button */}
                    {isCurrent && !isReplacing && (
                      <button
                        onClick={(e) => { 
                          e.preventDefault();
                          handleSkipDocument(key);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg text-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                      >
                        Skip for Now
                      </button>
                    )}
                  </div>
              )}
              
              {/* Enhanced file selection indicator */}
              {files[key] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="text-blue-700 text-sm font-medium">
                      Selected: {files[key]?.name}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
          
          {/* Enhanced loading indicator */}
          {aiLoading[key] && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
                <span className="text-sm text-blue-700 font-medium">Processing document...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced description at bottom */}
        <div className="mt-auto pt-4">
          <div className="text-xs text-slate-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3">
            {step.description}
          </div>
        </div>
      </div>
    );
  };

  // Handler for deleting a document
  const handleDeleteDocument = async (key: string) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to delete documents.",
          variant: "destructive"
        });
        return;
      }

      if (!savedDocs[key]?.docId) {
        toast({
          title: "Error", 
          description: "No document found to delete.",
          variant: "destructive"
        });
        return;
      }

      const db = getFirestore();
      const storage = getStorage();
      const docId = savedDocs[key].docId;
      
      // Delete from Firestore
      const docRef = doc(db, "businesses", user.uid, "financials", docId);
      await deleteDoc(docRef);
      
      // Try to delete from Storage if there's a file URL
      if (savedDocs[key].url) {
        try {
          const storageRef = ref(storage, savedDocs[key].url);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn("Could not delete file from storage:", storageError);
          // Continue with deletion even if storage deletion fails
        }
      }

      // Update local state
      setSavedDocs(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      setCompletedUploads(prev => prev.filter(completed => completed !== key));
      setAiResults(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      setExtracted(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      toast({
        title: "Document deleted",
        description: `${DOCUMENT_STEPS.find(s => s.key === key)?.label} has been deleted successfully.`,
        variant: "default"
      });

    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container py-8 mx-auto px-4 md:px-6" data-tour="document-upload">
          {/* Enhanced header with premium gradient background */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Upload Business Documents
                  </h1>
                  <p className="text-gray-200 mb-0 text-lg">
                    Please upload the required documents for your business. Each document type has its own upload card below.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-6 flex-shrink-0">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={freeagentLogo}
                        alt="FreeAgent"
                        className="h-8 w-auto object-contain cursor-pointer hover:scale-110 transition-transform duration-200"
                        onClick={() => setModal("freeagent")}
                      />
                      <img
                        src={sageLogo}
                        alt="Sage"
                        className="h-8 w-auto object-contain cursor-pointer hover:scale-110 transition-transform duration-200"
                        onClick={() => setModal("sage")}
                      />
                      <img
                        src={xeroLogo}
                        alt="Xero"
                        className="h-8 w-auto object-contain rounded-full bg-white cursor-pointer hover:scale-110 transition-transform duration-200"
                        onClick={() => setModal("xero")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Pending Documents Processing Notification */}
        {processingPendingDocs && pendingDocsCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Processing Legacy Documents
                </h3>
                <p className="text-sm text-blue-600 mt-1">
                  Found {pendingDocsCount} document{pendingDocsCount !== 1 ? 's' : ''} that need processing. 
                  Analyzing them now...
                </p>
              </div>
            </div>
          </div>
        )}

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

          {/* Enhanced upload status indicator */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-6 mb-8 overflow-hidden">
            {/* Status indicator bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-purple-500 mb-4"></div>
            
            <div className="font-semibold text-slate-800 mb-3 flex items-center">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              Upload Instructions
            </div>
            
            {replacementMode ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-700 font-medium">
                  🔄 You are replacing your {DOCUMENT_STEPS.find(s => s.key === replacingDocKey)?.label} document. Your old document will be archived.
                </p>
              </div>
            ) : (completedUploads.length + skippedUploads.length) === DOCUMENT_STEPS.length ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700 font-medium">
                  ✅ All documents have been processed ({completedUploads.length} uploaded, {skippedUploads.length} skipped). You can upload skipped documents or replace any document if needed.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-700">
                  <p className="mb-2 font-medium">
                    📋 You can upload any document. Recommended next document: 
                    <span className="font-bold text-blue-800"> {DOCUMENT_STEPS[currentUploadStep].label}</span>
                  </p>
                  <p className="text-xs text-blue-600 mb-2 flex items-center">
                    <span className="mr-1">📄</span> Documents are automatically processed and saved after upload - no manual save required!
                  </p>
                  <p className="text-xs text-amber-700 flex items-center">
                    <span className="mr-1">💡</span> Don't have a document ready? You can skip it and upload it later.
                  </p>
                </div>
              </div>
            )}
            
            {/* Enhanced progress bar */}
            <div className="mb-3">
              <div className="flex gap-1">
                {DOCUMENT_STEPS.map((step, idx) => (
                  <div 
                    key={step.key} 
                    className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                      replacementMode && replacingDocKey === step.key
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm' 
                        : completedUploads.includes(step.key) 
                          ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-sm' 
                          : skippedUploads.includes(step.key)
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm'
                            : currentUploadStep === idx 
                              ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm' 
                              : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Enhanced progress bar legend */}
            <div className="flex flex-wrap gap-6 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-2 shadow-sm"></div>
                <span className="text-slate-600 font-medium">Uploaded</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mr-2 shadow-sm"></div>
                <span className="text-slate-600 font-medium">Skipped</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mr-2 shadow-sm"></div>
                <span className="text-slate-600 font-medium">Current</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                <span className="text-slate-600 font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Enhanced document upload cards with premium styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {DOCUMENT_STEPS.map((step, index) => (
              <DocumentCard key={step.key} step={step} index={index} />
            ))}
          </div>

          {/* Enhanced tabbed element for document details */}
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              {/* Gradient header bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
              
              <div className="p-6 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex flex-wrap justify-center mb-6 bg-gray-100/80 rounded-xl p-2">
                    {DOCUMENT_STEPS.map((step) => (
                      <TabsTrigger
                        key={step.key}
                        value={step.key}
                        className="mx-1 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#ff8000] data-[state=active]:to-[#ff6b35] data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-lg data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white/80"
                      >
                        {step.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {DOCUMENT_STEPS.map((step) => (
                    <TabsContent 
                      key={step.key} 
                      value={step.key} 
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/50 shadow-inner p-6"
                    >
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
                      
                      {/* Auto-save status indicator */}
                      {saving[step.key] ? (
                        <div className="flex items-center text-sm text-orange-600">
                          <span className="animate-spin mr-2">⏳</span>
                          <span className="font-medium">{saveStatus[step.key] || "Auto-saving..."}</span>
                        </div>
                      ) : completedUploads.includes(step.key) ? (
                        <div className="flex items-center text-sm text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Auto-saved</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Processing...</span>
                        </div>
                      )}
                    </div>

                    {files[step.key] && !completedUploads.includes(step.key) && (
                      <div className="flex items-center bg-blue-50 rounded-md p-2 mb-4 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-blue-700">
                          Document file <span className="font-medium">{files[step.key]?.name}</span> will be auto-saved with the extracted data
                        </span>
                      </div>
                    )}
                    
                    {savedDocs[step.key] && (
                      <div className="flex items-center justify-between bg-green-50 rounded-md p-3 mb-4 text-sm">
                        <div className="flex items-center flex-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-700">
                            <span className="font-medium">Auto-saved:</span> {savedDocs[step.key].name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { 
                              e.preventDefault();
                              if (window.confirm('Are you sure you want to delete this document?')) {
                                handleDeleteDocument(step.key);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <a 
                            href={savedDocs[step.key].url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 hover:underline flex items-center"
                          >
                            <span className="mr-1">View</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Use the FinancialsTable component to display only the JSON data, explicitly not passing summary */}
                    <FinancialsTable 
                      data={(() => {
                        // Create a cleaned copy of the data without any summary fields
                        let cleanData = aiResults[step.key]?.json;
                        
                        // Safety check
                        if (!cleanData) {
                          return {};
                        }
                        
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
          </div>
        </div>

        {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#2a3441] mb-2">
              🎉 Document Process Complete!
            </DialogTitle>
            <DialogDescription className="text-center text-lg text-gray-600">
              {skippedUploads.length > 0 ? (
                <>
                  You've completed the document upload process! {completedUploads.length} document{completedUploads.length !== 1 ? 's' : ''} uploaded
                  {skippedUploads.length > 0 && ` and ${skippedUploads.length} skipped`}. 
                  Your profile is ready for lender review.
                </>
              ) : (
                <>
                  Congratulations! You've successfully uploaded all required business documents. 
                  Your profile is now complete and ready for lender review.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 mb-4">
                What would you like to do next?
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              onClick={handleMakeApplication}
              className="bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              Make an Application
            </Button>
            <Button
              onClick={handleExploreDashboard}
              variant="outline"
              className="border-2 border-[#2a3441] text-[#2a3441] hover:bg-[#2a3441] hover:text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 w-full sm:w-auto"
            >
              Explore Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </PageLayout>
  );
};

export default BusinessDocuments;
