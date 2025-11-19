// Sample credit report data for demonstration purposes
// This data mimics the structure returned by the CreditSafe API

export const sampleCreditReport = {
  report: {
    companyIdentification: {
      basicInformation: {
        businessName: "TechStart Solutions Ltd",
        companyRegistrationNumber: "12345678",
        companyRegistrationDate: "2020-03-15",
        legalForm: {
          description: "Private Limited Company"
        },
        companyStatus: {
          description: "Active"
        },
        contactAddress: {
          simpleValue: "123 Innovation Street, Tech City, London, EC1A 1BB, United Kingdom"
        }
      }
    },
    companySummary: {
      businessName: "TechStart Solutions Ltd",
      companyRegistrationNumber: "12345678",
      companyStatus: {
        description: "Active"
      },
      creditRating: {
        providerValue: {
          value: "B"
        },
        commonValue: "B",
        commonDescription: "Good",
        creditLimit: {
          value: 50000
        }
      }
    },
    contactInformation: {
      mainAddress: {
        simpleValue: "123 Innovation Street, Tech City, London, EC1A 1BB, United Kingdom"
      }
    },
    creditScore: {
      currentCreditRating: {
        providerValue: {
          value: "B"
        },
        commonValue: "B",
        commonDescription: "Good",
        creditLimit: {
          value: 50000
        }
      },
      previousCreditRating: {
        commonValue: "C",
        commonDescription: "Fair"
      },
      latestRatingChangeDate: "2023-06-15",
      commentary: "This company demonstrates strong financial stability with consistent revenue growth and low debt levels. Recent improvements in cash flow management have contributed to the positive credit rating."
    },
    additionalInformation: {
      negativeInformation: {
        hasNegativeInfo: false,
        details: []
      },
      ccjSummary: {
        count: 0,
        totalValue: 0
      }
    },
    negativeInformation: {
      hasNegativeInfo: false,
      details: []
    },
    negativeInfo: {
      hasNegativeInfo: false,
      details: []
    },
    adverseInfo: {
      hasAdverseInfo: false,
      details: []
    },
    warnings: [],
    riskFactors: {
      riskFactors: [
        {
          type: "Low",
          description: "Company age: 4 years (relatively young but established)"
        },
        {
          type: "Low",
          description: "No negative credit events in the last 3 years"
        },
        {
          type: "Medium",
          description: "Industry sector shows moderate volatility"
        }
      ]
    }
  }
};

export const sampleCompany = {
  name: "TechStart Solutions Ltd",
  registrationNumber: "12345678",
  status: "Active",
  connectId: "sample-connect-id-12345"
};