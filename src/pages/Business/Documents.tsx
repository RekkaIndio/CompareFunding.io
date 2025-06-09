import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import freeagentLogo from "@/assets/accountinglogos/freeagent.png";
import sageLogo from "@/assets/accountinglogos/sage.png";
import xeroLogo from "@/assets/accountinglogos/xero.png";
import LogoModal from "./Documents/LogoModal";
import PageLayout from "@/components/PageLayout";

const DOCUMENT_STEPS = [
  {
    key: "pl",
    label: "Profit and Loss",
    description: "A summary of your business’s revenues, costs, and expenses over a period. Shows net profit or loss."
  },
  {
    key: "bs",
    label: "Balance Sheet",
    description: "A snapshot of your business’s assets, liabilities, and equity at a specific point in time."
  },
  {
    key: "tb",
    label: "Trial Balance",
    description: "A report listing all ledger accounts and their balances to check that debits equal credits."
  },
  {
    key: "ap",
    label: "Aged Payables",
    description: "A breakdown of amounts your business owes to suppliers, organised by due date."
  },
  {
    key: "ar",
    label: "Aged Receivables",
    description: "A breakdown of amounts owed to your business by customers, organised by due date."
  },
];


const BusinessDocuments: React.FC = () => {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  // Modal state for each logo
  const [modal, setModal] = useState<null | "freeagent" | "sage" | "xero">(null);

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container py-8 mx-auto px-4 md:px-6">
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

          {/* Enhanced document upload cards with premium styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {DOCUMENT_STEPS.map((step) => (
              <div 
                key={step.key} 
                className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200/50 hover:border-slate-300 overflow-hidden"
              >
                {/* Status indicator bar */}
                <div className={`h-1.5 w-full ${
                  files[step.key] 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-gray-300 to-gray-400'
                }`}></div>
                
                <div className="p-6 flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-3 text-center text-gray-800">{step.label}</h2>
                    <p className="text-sm text-slate-600 mb-4 text-center leading-relaxed">
                      Upload your {step.label} document.
                    </p>
                    
                    {/* Enhanced file input */}
                    <div className="relative mb-4">
                      <input
                        type="file"
                        accept="application/pdf,.csv,.xlsx,.xls,.doc,.docx,image/*"
                        onChange={(e) => handleFileChange(e, step.key)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-blue-50 file:to-blue-100 file:text-blue-700 hover:file:from-blue-100 hover:file:to-blue-200 file:cursor-pointer file:transition-all file:duration-200"
                      />
                    </div>
                    
                    {/* File selection status */}
                    {files[step.key] && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-green-700 text-sm font-medium">
                            Selected: {files[step.key]?.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Description at bottom */}
                  <div className="mt-auto">
                    <div className="text-xs text-slate-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3">
                      {step.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced tabbed element for document details */}
          <div className="mt-12">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              {/* Gradient header bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
              
              <div className="p-6 md:p-8">
                <Tabs defaultValue={DOCUMENT_STEPS[0].key} className="w-full">
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
                      className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/50 shadow-inner"
                    >
                      <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">{step.label}</h3>
                        <p className="text-slate-600 leading-relaxed text-base">{step.description}</p>
                        {/* Placeholder for more details or preview in the future */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700 italic">
                            Document preview and additional details will be displayed here once uploaded.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessDocuments;
