import FormData from "form-data";
import Mailgun from "mailgun.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables with explicit path
const envPath = path.resolve(process.cwd(), '.env');
console.log(`📁 Loading .env from: ${envPath}`);
console.log(`📄 .env exists: ${fs.existsSync(envPath)}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("❌ Error loading .env:", result.error);
} else {
  console.log("✅ .env loaded successfully");
}

async function testMailgun() {
  console.log("🧪 Testing Mailgun integration...\n");
  
  // Debug: Show available environment variables
  console.log("🔍 Debug: Environment variables:");
  Object.keys(process.env).filter(key => key.includes('MAILGUN')).forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? '✅ Set' : '❌ Not set'}`);
  });
  
  // Check specific key
  console.log(`🔑 VITE_MAILGUN_API_KEY: ${process.env.VITE_MAILGUN_API_KEY ? 'Found' : 'Not found'}`);
  if (process.env.VITE_MAILGUN_API_KEY) {
    console.log(`   Value length: ${process.env.VITE_MAILGUN_API_KEY.length}`);
  }
  console.log();

  // Check if API key is configured
  const apiKey = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    console.error("❌ VITE_MAILGUN_API_KEY not found in environment variables");
    console.log("💡 Please check your .env file");
    console.log("🔍 Available env vars:", Object.keys(process.env).filter(key => key.includes('MAILGUN')));
    return;
  }

  console.log("✅ API Key found");
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: apiKey,
    // For EU domains, uncomment:
    // url: "https://api.eu.mailgun.net"
  });

  const domain = "sandboxf2f0c984027c49578c790323dcaa3174.mailgun.org";

  try {
    console.log("📧 Sending test email...");
    
    const data = await mg.messages.create(domain, {
      from: `Mailgun Sandbox <postmaster@${domain}>`,
      to: ["jamie@comparefunding.io"],
      subject: "Mailgun Test - Compare Funding Integration",
      text: "Hello! This is a test email to verify that Mailgun is working correctly with Compare Funding. Integration successful! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff8000;">🎉 Mailgun Test Successful!</h2>
          <p>Hello!</p>
          <p>This is a test email to verify that <strong>Mailgun is working correctly</strong> with Compare Funding.</p>
          <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #ff8000; margin: 20px 0;">
            <p><strong>✅ Integration successful!</strong></p>
          </div>
          <p>You can now implement email functionality across your application.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This test email was sent from the Compare Funding application using Mailgun.
          </p>
        </div>
      `
    });

    console.log("✅ Email sent successfully!");
    console.log("📋 Response details:");
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("❌ Error sending email:");
    console.error(error);
    
    if (error.status === 401) {
      console.log("\n💡 This looks like an authentication error. Please check:");
      console.log("   - Your API key is correct");
      console.log("   - The API key has the necessary permissions");
    } else if (error.status === 400) {
      console.log("\n💡 This looks like a bad request. Please check:");
      console.log("   - The domain is correct");
      console.log("   - The email format is valid");
    }
  }
}

// Run the test
testMailgun();
