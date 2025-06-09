# Sitemap Implementation

This document explains how sitemaps are implemented in the CompareFunding application.

## Overview

The application uses both XML sitemaps for search engines and a user-friendly HTML sitemap page. The sitemap is automatically generated during the build process.

## Files

### Generated Files
- `public/sitemap.xml` - XML sitemap for search engines
- `public/robots.txt` - Robots.txt file that references the sitemap

### Source Files
- `scripts/generate-sitemap.mjs` - Script that generates the XML sitemap
- `src/pages/Sitemap.tsx` - User-friendly HTML sitemap page

## Usage

### Manual Generation
```bash
npm run generate-sitemap
```

### Automatic Generation
The sitemap is automatically generated during the build process:
```bash
npm run build  # Generates sitemap then builds the app
```

## Configuration

### Adding New Routes
To add new public routes to the sitemap, edit `scripts/generate-sitemap.mjs`:

```javascript
const publicRoutes = [
  // Add your new route here
  { url: '/new-page', changefreq: 'monthly', priority: 0.6 },
  // ... existing routes
];
```

### SEO Parameters
- **Priority**: 0.0 to 1.0 (1.0 = highest priority)
- **Change Frequency**: always, hourly, daily, weekly, monthly, yearly, never
- **Last Modified**: Automatically set to current date

### Route Priorities Guide
- Homepage: 1.0
- Main landing pages: 0.8
- Important content pages: 0.6-0.7
- Secondary content: 0.4-0.5
- Auth/legal pages: 0.3

## Best Practices

### Include in Sitemap
- ✅ Public pages accessible without authentication
- ✅ Important content pages
- ✅ Landing pages for marketing
- ✅ Help and resource pages

### Exclude from Sitemap
- ❌ Pages requiring authentication (dashboard, profile, etc.)
- ❌ API endpoints
- ❌ Admin pages
- ❌ Error pages (404, etc.)
- ❌ Temporary or staging pages

## SEO Integration

### Google Search Console
1. Submit `https://yourdomain.com/sitemap.xml` to Google Search Console
2. Monitor indexing status and coverage issues

### Robots.txt
The `robots.txt` file automatically references the sitemap:
```
Sitemap: https://comparefunding.com/sitemap.xml
```

### HTML Sitemap
Users can access a friendly sitemap at `/sitemap` which:
- Lists all public pages with descriptions
- Provides easy navigation
- Links to the XML sitemap for technical users

## Environment Variables

You can customize the hostname using environment variables:
```bash
VITE_APP_URL=https://yourdomain.com
```

If not set, defaults to `https://comparefunding.com`.

## Monitoring

### Validation
- Validate XML sitemap: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Test robots.txt: https://support.google.com/webmasters/answer/6062598

### Analytics
Monitor sitemap performance in:
- Google Search Console
- Google Analytics
- Your chosen SEO tools

## Troubleshooting

### Common Issues
1. **Sitemap not found (404)**: Ensure the file is in the `public` directory
2. **Invalid XML**: Check the console output for generation errors
3. **Routes not indexed**: Verify routes are included in `publicRoutes` array
4. **Wrong hostname**: Check `VITE_APP_URL` environment variable

### Debug Commands
```bash
# Check if sitemap exists
ls -la public/sitemap.xml

# Validate sitemap structure
curl -s https://yourdomain.com/sitemap.xml | head -20

# Test robots.txt
curl -s https://yourdomain.com/robots.txt
```
