// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { getDocument, updateDocument } from '@/firebase';
// import { toast } from 'sonner';
// import PageLayout from '@/components/PageLayout';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { ArrowLeft, CheckCircle, AlertTriangle, Download, Shield } from 'lucide-react';
// import StatusBadge from '@/components/StatusBadge';

// const ApplicationReview = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const queryClient = useQueryClient();
  
//   // Log the ID parameter to help with debugging
//   useEffect(() => {
//     console.log("Application ID from URL:", id);
//   }, [id]);
  
//   // Fetch application data using Firebase
//   const { data: application, isLoading, error } = useQuery({
//     queryKey: ['application', id],
//     queryFn: async () => {
//       console.log("Fetching application with ID:", id);
      
//       if (!id) {
//         const error = new Error("Application ID is missing");
//         setErrorMessage(error.message);
//         throw error;
//       }
      
//       try {
//         const { data, error } = await getDocument('applications', id);
        
//         if (error) {
//           console.error("Firebase error:", error);
//           setErrorMessage(`Failed to load application: ${error.message || 'Unknown error'}`);
//           throw error;
//         }
        
//         if (!data) {
//           const notFoundError = new Error("Application not found in database");
//           setErrorMessage(notFoundError.message);
//           throw notFoundError;
//         }
        
//         console.log("Application data retrieved:", data);
//         return data;
//       } catch (err) {
//         console.error("Error in queryFn:", err);
//         setErrorMessage(`Error loading application: ${err instanceof Error ? err.message : 'Unknown error'}`);
//         throw err;
//       }
//     },
//     enabled: !!id,
//     retry: 1, // Only retry once to avoid excessive requests if there's a persistent issue
//     staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
//   });

//   const handleSubmit = async () => {
//     if (isSubmitting) return; // Prevent multiple submissions
    
//     try {
//       setIsSubmitting(true);
//       console.log("Submitting application with ID:", id);
      
//       if (!id) {
//         const error = new Error("Application ID is missing");
//         setErrorMessage(error.message);
//         throw error;
//       }
      
//       const updateData = { 
//         status: 'submitted',
//         status_updated_at: new Date().toISOString(),
//         application_date: application?.application_date || new Date().toISOString() // Ensure application_date exists
//       };
      
//       console.log("Updating document with data:", updateData);
      
//       const { data, error } = await updateDocument('applications', id, updateData);
      
//       if (error) {
//         console.error("Error submitting application:", error);
//         setErrorMessage(`Failed to submit application: ${error.message || 'Unknown error'}`);
//         throw error;
//       }
      
//       // Invalidate both the single application query and the applications list query
//       queryClient.invalidateQueries({ queryKey: ['application', id] });
//       queryClient.invalidateQueries({ queryKey: ['applications'] });
      
//       console.log("Application submitted successfully:", data);
//       toast.success('Application submitted successfully');
//       navigate('/applications');
//     } catch (err) {
//       console.error('Error submitting application:', err);
//       toast.error(`Failed to submit application: ${err instanceof Error ? err.message : 'Unknown error'}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSaveAsDraft = async () => {
//     if (isSubmitting) return;
    
//     try {
//       setIsSubmitting(true);
      
//       if (!id) {
//         const error = new Error("Application ID is missing");
//         setErrorMessage(error.message);
//         throw error;
//       }
      
//       const { data, error } = await updateDocument('applications', id, { 
//         status: 'draft',
//         status_updated_at: new Date().toISOString()
//       });
      
//       if (error) {
//         console.error("Error saving application as draft:", error);
//         setErrorMessage(`Failed to save application: ${error.message || 'Unknown error'}`);
//         throw error;
//       }
      
//       // Invalidate the query to refresh data if user navigates back
//       queryClient.invalidateQueries({ queryKey: ['application', id] });
      
//       toast.success('Application saved as draft');
//       navigate('/applications');
//     } catch (err) {
//       console.error('Error saving application:', err);
//       toast.error(`Failed to save application: ${err instanceof Error ? err.message : 'Unknown error'}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <PageLayout>
//       <div className="container py-8">
//         <Button
//           variant="ghost"
//           className="mb-6"
//           onClick={() => navigate('/applications')}
//         >
//           <ArrowLeft className="mr-2 h-4 w-4" />
//           Back to Applications
//         </Button>
        
//         <div className="max-w-4xl mx-auto">
//           <h1 className="text-3xl font-bold mb-2">Review Your Application</h1>
//           <p className="text-muted-foreground mb-8">
//             Review your application details before submitting to lenders
//           </p>
          
//           {isLoading ? (
//             <div className="h-64 animate-pulse bg-gray-100 rounded-xl"></div>
//           ) : application ? (
//             <>
//               <Card className="mb-8">
//                 <CardHeader>
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <CardTitle className="text-xl">Application Summary</CardTitle>
//                       <CardDescription>
//                         Application #{application.application_number || id?.substring(0, 8)}
//                       </CardDescription>
//                     </div>
//                     <StatusBadge status={application.status} />
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-sm text-muted-foreground">Loan Amount</p>
//                       <p className="font-medium">${application.loan_amount?.toLocaleString()}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Loan Term</p>
//                       <p className="font-medium">{application.loan_term_months} months</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Purpose</p>
//                       <p className="font-medium">{application.purpose}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-muted-foreground">Type</p>
//                       <p className="font-medium capitalize">{application.loan_type?.replace('_', ' ')}</p>
//                     </div>
//                   </div>
                  
//                   <Separator />
                  
//                   <div>
//                     <h3 className="font-semibold mb-2">Guarantees and Security</h3>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <p className="text-sm text-muted-foreground">Personal Guarantee</p>
//                         <p className="font-medium">{application.has_personal_guarantee ? 'Yes' : 'No'}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-muted-foreground">Secured Loan</p>
//                         <p className="font-medium">{application.is_secured ? 'Yes' : 'No'}</p>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
              
//               <Card className="mb-8">
//                 <CardHeader>
//                   <CardTitle className="text-xl flex items-center">
//                     <Shield className="mr-2 h-5 w-5 text-fundhub-blue" />
//                     Data Privacy & Redaction
//                   </CardTitle>
//                   <CardDescription>
//                     We protect your sensitive information when sharing with lenders
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Alert className="mb-4">
//                     <AlertTriangle className="h-4 w-4" />
//                     <AlertTitle>Information visible to lenders</AlertTitle>
//                     <AlertDescription>
//                       <p className="mb-2">
//                         The following information will be visible to matching lenders:
//                       </p>
//                       <ul className="list-disc pl-5 space-y-1">
//                         <li>Loan amount and term</li>
//                         <li>Purpose of financing</li>
//                         <li>Business industry and size</li>
//                         <li>Years in operation</li>
//                         <li>Financial summary (revenue ranges, not exact figures)</li>
//                       </ul>
//                     </AlertDescription>
//                   </Alert>
                  
//                   <Alert variant="success">
//                     <CheckCircle className="h-4 w-4" />
//                     <AlertTitle>Protected information</AlertTitle>
//                     <AlertDescription>
//                       <p className="mb-2">
//                         The following information will be redacted or anonymized:
//                       </p>
//                       <ul className="list-disc pl-5 space-y-1">
//                         <li>Business name and exact location</li>
//                         <li>Owner names and contact details</li>
//                         <li>Bank account information</li>
//                         <li>Exact financial figures from accounting integrations</li>
//                       </ul>
//                     </AlertDescription>
//                   </Alert>
//                 </CardContent>
//               </Card>
              
//               <Card>
//                 <CardContent className="pt-6">
//                   <Alert>
//                     <AlertTriangle className="h-4 w-4" />
//                     <AlertTitle>Ready to submit?</AlertTitle>
//                     <AlertDescription>
//                       Once submitted, your application will be matched with suitable lenders based on your profile and requirements.
//                       You'll be notified as lenders review your application and make offers.
//                     </AlertDescription>
//                   </Alert>
//                 </CardContent>
//                 <CardFooter className="flex justify-between">
//                   <Button variant="outline" onClick={handleSaveAsDraft}>
//                     Save as Draft
//                   </Button>
//                   <div className="space-x-3">
//                     <Button
//                       variant="outline"
//                       className="gap-2"
//                     >
//                       <Download className="h-4 w-4" />
//                       Download PDF
//                     </Button>
//                     <Button 
//                       className="bg-fundhub-blue hover:bg-fundhub-blue/90"
//                       onClick={handleSubmit}
//                     >
//                       Submit Application
//                     </Button>
//                   </div>
//                 </CardFooter>
//               </Card>
//             </>
//           ) : (
//             <Alert variant="destructive">
//               <AlertTriangle className="h-4 w-4" />
//               <AlertTitle>Application not found</AlertTitle>
//               <AlertDescription>
//                 {errorMessage || "The application you're looking for doesn't exist or you don't have permission to view it."}
//                 <br />
//                 <span className="text-xs mt-2 block">Debug info: ID parameter: {id || 'missing'}</span>
//               </AlertDescription>
//             </Alert>
//           )}
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default ApplicationReview;
