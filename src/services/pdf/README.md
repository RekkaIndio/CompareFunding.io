# PDF Service Documentation

## Overview
The PDF service has been refactored into a modular structure for better maintainability and organization.

## Structure

```
src/services/pdf/
├── index.ts                    # Main exports
├── types.ts                    # Type definitions
├── utils/                      # Utility functions
│   ├── index.ts
│   ├── formatters.ts           # Currency, date, and text formatting
│   ├── financialUtils.ts       # Financial data processing
│   └── filenameUtils.ts        # PDF filename generation
├── renderers/                  # Section renderers
│   ├── index.ts
│   ├── creditRenderer.ts       # Credit information rendering
│   ├── hmrcRenderer.ts         # HMRC status rendering
│   ├── financialRenderer.ts    # Financial data tables
│   └── fundingRenderer.ts      # Current funding rendering
└── generators/                 # Main PDF generators
    ├── index.ts
    ├── matchedPdfGenerator.ts   # Full details for matched lenders
    └── unmatchedPdfGenerator.ts # Limited details for unmatched lenders
```

## Usage

### Basic Usage
```typescript
import { 
  generateMatchedApplicationPdf, 
  generateUnmatchedApplicationPdf,
  downloadPdf 
} from '@/services/pdf';

// Generate PDF for matched lender
const pdfBytes = await generateMatchedApplicationPdf(
  applicationData, 
  { isLenderMatched: true, lenderName: 'Bank Name' }
);

// Download the PDF
downloadPdf(pdfBytes, 'application.pdf');
```

### Backward Compatibility
The existing `applicationPdfService.ts` has been updated to use the new modular structure while maintaining the same API:

```typescript
import { generateApplicationPdf } from '@/services/applicationPdfService';

// This still works as before
const pdfBytes = await generateApplicationPdf(
  applicationData, 
  { isLenderMatched: true }
);
```

## Benefits

1. **Maintainability**: Code is now split into logical modules
2. **Reusability**: Individual renderers and utilities can be reused
3. **Testability**: Each module can be tested independently
4. **Reduced Duplication**: Common utilities are shared between matched and unmatched generators
5. **Cleaner Code**: Each file has a single responsibility

## Migration Notes

- The old `matchedApplicationPdfService.ts` and `unmatchedApplicationPdfService.ts` files can be removed after verification
- All existing imports through `applicationPdfService.ts` continue to work
- Type definitions have been centralized in `types.ts`
- Helper functions have been extracted to reusable utilities

## Individual Module Purposes

### Utils
- **formatters.ts**: Currency, date formatting, text wrapping, PDF download
- **financialUtils.ts**: Financial data extraction, column management, table rendering
- **filenameUtils.ts**: PDF filename generation for both matched/unmatched

### Renderers
- **creditRenderer.ts**: Credit score and risk information
- **hmrcRenderer.ts**: Tax status and HMRC data
- **financialRenderer.ts**: Financial statements and tables
- **fundingRenderer.ts**: Current funding arrangements

### Generators
- **matchedPdfGenerator.ts**: Complete business details for matched lenders
- **unmatchedPdfGenerator.ts**: Anonymous preview for unmatched lenders
