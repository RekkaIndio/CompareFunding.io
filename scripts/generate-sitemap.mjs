import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your public routes with SEO metadata
const publicRoutes = [
  // Main pages
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/for-businesses', changefreq: 'monthly', priority: 0.8 },
  { url: '/for-lenders', changefreq: 'monthly', priority: 0.8 },
  { url: '/how-it-works', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/products', changefreq: 'monthly', priority: 0.7 },
  
  // Auth pages (lower priority)
  { url: '/login', changefreq: 'yearly', priority: 0.3 },
  { url: '/signup', changefreq: 'yearly', priority: 0.5 },
  
  // Legal pages
  { url: '/cookies', changefreq: 'yearly', priority: 0.3 },
  { url: '/sitemap', changefreq: 'monthly', priority: 0.4 },
  
  // Help/Education pages
  { url: '/help/business-insurance', changefreq: 'monthly', priority: 0.5 },
  { url: '/help/foreign-exchange', changefreq: 'monthly', priority: 0.5 },
  { url: '/help/raising-equity', changefreq: 'monthly', priority: 0.5 },
  
  // Funding option pages
  { url: '/funding-options/cashflow', changefreq: 'monthly', priority: 0.6 },
  { url: '/funding-options/asset-finance', changefreq: 'monthly', priority: 0.6 },
];

// Routes to exclude from sitemap (private/auth-required routes)
const excludedRoutes = [
  '/dashboard',
  '/applications',
  '/business/profile',
  '/lender/dashboard',
  '/messages',
  '/settings',
  '/notifications',
  // Add any other private routes
];

async function generateSitemap() {
  const hostname = process.env.VITE_APP_URL || 'https://comparefunding.com';
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  console.log('🚀 Generating sitemap...');
  console.log(`📍 Hostname: ${hostname}`);
  console.log(`📁 Output: ${outputPath}`);
  
  const sitemap = new SitemapStream({ 
    hostname,
    pretty: true // This formats the XML nicely
  });
  const writeStream = createWriteStream(outputPath);
  
  sitemap.pipe(writeStream);
  
  // Add each public route to the sitemap
  publicRoutes.forEach(route => {
    sitemap.write({
      url: route.url,
      changefreq: route.changefreq,
      priority: route.priority,
      lastmod: new Date().toISOString().split('T')[0]
    });
    
    console.log(`✅ Added: ${route.url} (priority: ${route.priority})`);
  });
  
  sitemap.end();
  
  // Wait for the stream to finish
  await streamToPromise(sitemap);
  
  console.log(`🎉 Sitemap generated successfully!`);
  console.log(`📊 Total URLs: ${publicRoutes.length}`);
}

// Run the function
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap().catch(console.error);
}

export { generateSitemap };
