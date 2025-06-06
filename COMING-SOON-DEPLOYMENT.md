# Coming Soon Page Deployment Guide

This guide explains how to deploy a coming soon page to your custom domain while keeping your main application private.

## Deployment Options

### Option 1: Simple HTML Coming Soon Page (Recommended for Quick Setup)

Use this approach if you want a fast, lightweight coming soon page without the full React bundle.

1. **Deploy the static coming soon page:**
   ```bash
   firebase deploy --config firebase.coming-soon.json
   ```

2. **The coming soon page will be live at your custom domain with:**
   - Beautiful gradient background
   - Email signup form
   - Responsive design
   - Your company logo (if available)

### Option 2: React-Based Coming Soon Page

Use this if you want the coming soon page to be part of your React application but conditionally shown.

1. **Build with coming soon mode:**
   ```bash
   npm run build:coming-soon
   ```

2. **Deploy to Firebase:**
   ```bash
   npm run deploy:coming-soon
   ```

3. **To switch back to full app:**
   ```bash
   npm run deploy:full
   ```

## Environment Variables

- `.env.coming-soon` - Sets `VITE_COMING_SOON=true`
- `.env.development` - Sets `VITE_COMING_SOON=false`

## Customization

### Updating the Coming Soon Page Content

Edit `/coming-soon/index.html` for the static version, or `/src/components/ComingSoonPage.tsx` for the React version.

### Email Integration

To capture emails, integrate with:
- **Mailchimp** - Add their signup form code
- **ConvertKit** - Use their API
- **Firebase Firestore** - Store emails in your database
- **Supabase** - Store in your existing database

Example Firestore integration for the React version:

```typescript
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const handleEmailSubmit = async (email: string) => {
  try {
    await addDoc(collection(db, 'early_signups'), {
      email,
      timestamp: new Date(),
    });
    alert('Thank you! We\'ll notify you when we launch.');
  } catch (error) {
    console.error('Error saving email:', error);
    alert('Sorry, there was an error. Please try again.');
  }
};
```

## Domain Configuration

Your Firebase hosting will serve the coming soon page on your custom domain. The full application will remain unpublished until you're ready to launch.

## Testing

1. **Test coming soon locally:**
   ```bash
   # For static version
   cd coming-soon && python3 -m http.server 8000
   
   # For React version
   npm run dev
   ```

2. **Preview before deployment:**
   ```bash
   firebase serve --config firebase.coming-soon.json
   ```

## Benefits

- ✅ Professional coming soon page on your custom domain
- ✅ Email capture for early access notifications
- ✅ Mobile-responsive design
- ✅ Fast loading (especially static version)
- ✅ Easy to switch between coming soon and full app
- ✅ SEO-friendly
- ✅ Maintains your brand presence

## Next Steps

1. Choose your preferred option (static HTML or React-based)
2. Customize the content and styling
3. Set up email capture integration
4. Deploy to your custom domain
5. When ready to launch, simply deploy the full application
