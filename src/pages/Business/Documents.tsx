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

        <div className="flex gap-6 flex-col md:flex-row md:justify-evenly">
          {DOCUMENT_STEPS.map((step) => (
            <div key={step.key} className="bg-white rounded-lg shadow p-6 flex-1 min-w-[180px] max-w-[220px] flex flex-col mx-auto">
              <h2 className="text-lg font-semibold mb-2 text-center">{step.label}</h2>
              <p className="text-sm text-slate-500 mb-2 text-center">Upload your {step.label} document.</p>
              <input
                type="file"
                accept="application/pdf,.csv,.xlsx,.xls,.doc,.docx,image/*"
                onChange={(e) => handleFileChange(e, step.key)}
                className="mb-2"
              />
              {files[step.key] && (
                <div className="text-green-700 text-sm text-center">Selected: {files[step.key]?.name}</div>
              )}
              <div className="text-xs text-slate-400 mt-2 text-center">{step.description}</div>
            </div>
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
                <h3 className="text-lg font-semibold mb-2">{step.label}</h3>
                <p className="text-slate-600 mb-2">{step.description}</p>
                {/* Placeholder for more details or preview in the future */}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessDocuments;
