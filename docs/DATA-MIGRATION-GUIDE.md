# Data Migration Guide

This document explains the data consolidation strategy for the Fund Connector application.

## The Problem

The application has data spread across multiple collections which creates inconsistency and makes it difficult to retrieve information reliably:

1. **Credit Score Data** is found in multiple places:
   - `business_profiles.credit_info` (original location)
   - `businesses` collection (new canonical location)
   - `credit_scores` collection (alternative location)

2. **Financial Documents** are found in multiple places:
   - Embedded in `businesses` documents under `financials` or `financial_data` fields
   - As documents in subcollection `businesses/{businessId}/financials`
   - As documents in `business_financials` collection with `business_id` field
   - As documents in `financial_documents` collection with `business_id` field

## The Solution

We've implemented a data consolidation strategy that migrates data to a canonical structure:

### Canonical Data Structure

- `businesses/{businessId}` - Main document with:
  - Basic business information
  - `credit_info` field containing credit score data
  - Business status and metadata

- `businesses/{businessId}/financials/{documentType}` - Subcollection with financial documents:
  - Profit and Loss (`profitLoss`)
  - Balance Sheet (`balanceSheet`)
  - Trial Balance (`trialBalance`)
  - Aged Payables (`agedPayables`)
  - Aged Receivables (`agedReceivables`)
  - Other financial documents

### Migration Process

The application includes a migration system that:

1. Searches all possible locations for data
2. Normalizes data to a consistent format
3. Stores data in the canonical location
4. Adds metadata to track the migration status

### How to Use the Migration Tools

#### For Developers

1. **Admin Panel**: In development mode, BusinessDetail.tsx includes an admin panel for running migrations.
   - Navigate to any business detail page
   - Use the "Run Data Migration" button to consolidate data for that business

2. **Migration Service API**: You can programmatically run migrations:
   ```typescript
   import { consolidateBusinessData } from '@/services';
   
   // To migrate all data for a business
   const result = await consolidateBusinessData('businessId');
   
   // To migrate only credit score data
   const result = await migrateCreditScoreData('businessId');
   
   // To migrate only financial documents
   const result = await migrateFinancialDocuments('businessId');
   ```

#### For Admins

To perform a full data migration across all businesses:

1. A batch migration script is available in `/scripts/data-migration.js` (TODO)
2. Run this script on production data using:
   ```
   npm run migrate-data
   ```

## Data Structure Details

### Credit Score Data

Normalized credit score structure:

```typescript
{
  score: number,           // Credit score value (e.g., 750)
  risk_level: string,      // Risk assessment (e.g., "Good")
  last_updated: string,    // ISO date when the score was last updated
  details: {              // Original data for backwards compatibility
    // All original fields from the source
  },
  _dataVersion: string     // Version of the data format
}
```

### Financial Document Structure

```typescript
{
  documentType: string,    // Document type identifier (e.g., "profitLoss")
  data: object,           // The actual financial data
  createdAt: timestamp,    // When the document was created
  updatedAt: timestamp,    // When the document was last updated
  summary: string,         // Optional summary of the document
  _sourceCollection: string, // Where the data was migrated from
  _sourceDocId: string,     // Original document ID
  _dataVersion: string      // Version of the data format
}
```

## Best Practices

When working with business data:

1. Always read from the canonical location first (`businesses` collection)
2. Fall back to other locations if data is not found
3. Use the `normalizeCreditScoreData` function to handle different data formats
4. Consider running data migration when encountering inconsistencies

---

This migration strategy ensures data consistency while maintaining backward compatibility during the transition period.
