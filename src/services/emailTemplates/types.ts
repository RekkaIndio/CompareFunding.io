// Shared types and interfaces for email templates
export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Common email styles used across templates
export const commonEmailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
  .header { padding: 40px 30px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
  .content { padding: 40px 30px; }
  .btn { display: inline-block; background: #ff8000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
  .btn:hover { background: #e67300; }
  .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
`;

// Helper function to create email wrapper
export const createEmailWrapper = (content: string, styles?: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      ${commonEmailStyles}
      ${styles || ''}
    </style>
  </head>
  <body>
    <div class="container">
      ${content}
    </div>
  </body>
  </html>
`;
