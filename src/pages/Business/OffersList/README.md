# OffersList Component Structure

This directory contains the refactored OffersList component, broken down into smaller, more manageable pieces.

## Files Overview

### Core Components
- **`OffersList.tsx`** - Main component that orchestrates the entire offers list functionality
- **`IndividualOfferCard.tsx`** - Component for rendering individual offer cards (used by lenders)
- **`ApplicationOffersCard.tsx`** - Component for rendering grouped offers by application (used by businesses)
- **`ApplicationLogo.tsx`** - Simple component for displaying application/business logos with fallback

### Data & Logic
- **`types.ts`** - TypeScript type definitions for Offer and GroupedOffers
- **`utils.ts`** - Utility functions for calculations and formatting
- **`useOffersData.ts`** - Custom hook for fetching offers data using React Query
- **`useOfferActions.ts`** - Custom hook for offer action handlers (accept/decline)

### UI Components
- **`OfferModals.tsx`** - Modal components for offer responses and decline dialogs

### Exports
- **`index.ts`** - Barrel export file for clean imports

## Key Features Maintained

✅ **All original styling preserved** - No visual changes made
✅ **Complete functionality** - Accept/decline offers, modals, notifications
✅ **Role-based views** - Different views for lenders vs businesses
✅ **Responsive design** - All responsive behaviors maintained
✅ **Error handling** - Proper error states and loading states
✅ **Real-time updates** - React Query for data fetching
✅ **Notifications** - Toast notifications for user actions

## Benefits of This Structure

1. **Maintainability** - Each component has a single responsibility
2. **Reusability** - Components can be easily reused in other parts of the app
3. **Testing** - Individual components can be tested in isolation
4. **Performance** - Better code splitting and bundle optimization
5. **Developer Experience** - Easier to navigate and understand the codebase

## Usage

The main OffersList component is imported and used exactly as before:

```tsx
import OffersList from '@/pages/OffersList';
// or
import OffersList from '@/pages/Business/OffersList/OffersList';
```

Individual components can also be imported for reuse:

```tsx
import { IndividualOfferCard, useOffersData } from '@/pages/Business/OffersList';
```
