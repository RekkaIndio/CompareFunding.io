# Draft Application Auto-Creation Implementation

## Overview
This implementation enables automatic creation of draft funding applications based on data collected during the user signup journey. The draft appears on the business dashboard immediately after signup completion.

## Key Components

### 1. Core Utility Functions (`/src/lib/signupDataUtils.ts`)
- `mapSignupDataToApplication()`: Maps signup data to application form structure
- `fetchSignupFundingData()`: Retrieves funding preferences from signup
- `fetchSignupBusinessData()`: Retrieves business details from signup
- `createDraftApplication()`: Creates a draft application with prefilled data

### 2. Tour Context Integration (`/src/contexts/TourContext.tsx`)
- Modified `endTour()` to automatically create draft application when tour completes
- Includes error handling and user notification via toast

### 3. Eligibility Page Integration (`/src/pages/SignUpJourney/EligibilityPage.tsx`)
- Modified `handleSkipTour()` to create draft application when user skips tour
- Ensures draft is created regardless of whether user takes tour or not

### 4. Dashboard Display (`/src/pages/BusinessDashboard.tsx`)
- Added `renderDraftApplications()` function to display draft applications
- Updated Application interface to include 'draft' status
- Shows drafts in a separate section above regular applications

### 5. New Application Page (`/src/pages/Applications/NewApplication/index.tsx`)
- Maintains existing prefill logic for when users visit the page directly
- Prevents duplicate draft creation with existence checks

## Data Flow

1. **Signup Journey**:
   - User completes Email & Password step
   - User fills Funding Application form (amount, purpose, duration, etc.)
   - User provides Business Details (company name, industry, website, etc.)
   - Data saved to Firebase collections (`users`, `businesses`, `business_profiles`)

2. **Signup Completion** (EligibilityPage):
   - User either starts platform tour or skips to dashboard
   - Draft application created automatically using `createDraftApplication()`
   - Draft includes all available signup data mapped to application structure

3. **Dashboard Display**:
   - Dashboard fetches all applications including drafts
   - Drafts displayed in separate "Draft Applications" section
   - User can continue editing draft applications

## Key Features

### Automatic Prefilling
- Funding amount, purpose, and duration from signup
- Business name, industry, website, and company details
- Marketing consent preferences
- Intelligent mapping between signup and application fields

### Duplicate Prevention
- Checks for existing drafts before creation
- Uses consistent document ID format (`${userId}_draft`)
- Prevents multiple drafts for same user

### Error Handling
- Graceful fallback if signup data is incomplete
- Background operation - doesn't block user flow
- Console logging for debugging

### User Experience
- Draft visible immediately on dashboard after signup
- Toast notification when draft is created
- Seamless transition from signup to application editing

## Data Mapping

### Funding Data
- `amount` → `loan_amount` (parsed as integer)
- `fundingPurpose` → `purpose_category` + `purpose` (with descriptions)
- `duration` → `loan_term_months` (mapped from strings like "2_years" to 24)
- `timeframe` → Used for application urgency (future enhancement)

### Business Data
- `business_name` → `business_name`
- `company_number` → `company_number`
- `industry` → `industry`
- `company_size` → `company_size`
- `website` → `website`
- `annual_revenue` → `annual_revenue`
- `description` → `business_description`

## Testing

### Manual Testing Flow
1. Start fresh signup journey at `/signup-journey/email-password`
2. Complete all steps through EligibilityPage
3. Either start tour or skip to dashboard
4. Check dashboard for "Draft Applications" section
5. Verify draft contains prefilled data from signup

### Automated Testing
- Test scripts in `/test-draft-creation.js`
- Console debugging with detailed logging
- Unit tests for mapping functions

## Configuration

### Draft Application Defaults
- Status: 'draft'
- Document ID: `${userId}_draft`
- Prefill flags: `is_prefilled: true`, `prefill_source: 'signup_journey'`
- Required fields initialized with empty strings or defaults
- Loan type defaults to 'term_loan'

### Error Recovery
- Missing signup data doesn't prevent draft creation
- Partial data creates partial draft
- Failed creation logged but doesn't impact user flow

## Future Enhancements

1. **Multiple Drafts**: Support for multiple draft applications per user
2. **Draft Expiration**: Auto-delete old unused drafts
3. **Advanced Mapping**: More sophisticated field mapping based on business type
4. **Draft Sync**: Real-time sync of draft changes across devices
5. **Draft Templates**: Pre-configured drafts based on industry/business size

## Files Modified

### Core Implementation
- `/src/lib/signupDataUtils.ts` - Main utility functions
- `/src/contexts/TourContext.tsx` - Tour completion integration
- `/src/pages/SignUpJourney/EligibilityPage.tsx` - Skip tour integration

### Dashboard & Application
- `/src/pages/BusinessDashboard.tsx` - Draft display
- `/src/pages/Applications/NewApplication/index.tsx` - Existing prefill logic

### Testing & Documentation
- `/test-draft-creation.js` - Testing utilities
- Multiple test scripts for validation

## Status: ✅ Complete

The implementation successfully creates draft applications automatically at the end of the signup journey and displays them on the business dashboard. Users can immediately see and continue editing their funding applications without manual intervention.
