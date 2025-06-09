const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

// Define your application routes
const routes = [
  // Public pages
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/for-businesses', changefreq: 'monthly', priority: 0.8 },
  { url: '/for-lenders', changefreq: 'monthly', priority: 0.8 },
  { url: '/how-it-works', changefreq: 'monthly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/products', changefreq: 'monthly', priority: 0.7 },
  { url: '/login', changefreq: 'yearly', priority: 0.3 },
  { url: '/signup', changefreq: 'yearly', priority: 0.5 },
  { url: '/cookies', changefreq: 'yearly', priority: 0.3 },
  
  // Help pages
  { url: '/help/business-insurance', changefreq: 'monthly', priority: 0.5 },
  { url: '/help/foreign-exchange', changefreq: 'monthly', priority: 0.5 },
  { url: '/help/raising-equity', changefreq: 'monthly', priority: 0.5 },
  
  // Add more routes as needed
  // Note: Private routes (requiring authentication) are typically not included in sitemaps
];

async function generateSitemap() {
  const hostname = 'https://comparefunding.com'; // Replace with your actual domain
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  console.log('Generating sitemap...');
  
  const sitemap = new SitemapStream({ hostname });
  const writeStream = createWriteStream(outputPath);
  
  sitemap.pipe(writeStream);
  
  // Add each route to the sitemap
  routes.forEach(route => {
    sitemap.write({
      url: route.url,
      changefreq: route.changefreq,
      priority: route.priority,
      lastmod: new Date().toISOString().split('T')[0] // Today's date
    });
  });
  
  sitemap.end();
  
  // Wait for the stream to finish
  await streamToPromise(sitemap);
  
  console.log(`Sitemap generated successfully at ${outputPath}`);
}

// Run the function
generateSitemap().catch(console.error);
