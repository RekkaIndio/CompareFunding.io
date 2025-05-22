import axios from 'axios';

const BASE_URL = 'https://connect.sandbox.creditsafe.com/v1'; // Use the live URL in production
const USERNAME = process.env.VITE_CREDITSAFE_USERNAME || '';
const PASSWORD = process.env.VITE_CREDITSAFE_PASSWORD || '';

/**
 * Authenticate and get a bearer token
 */
async function authenticate(): Promise<string> {
  try {
    const response = await axios.post(`${BASE_URL}/authenticate`, {
      username: USERNAME,
      password: PASSWORD
    });

    const token = response.data.token;
    console.log('🔐 Token received:', token);
    return token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Use token to search for a company
 */
async function searchCompany(token: string) {
  try {
    const response = await axios.get(`${BASE_URL}/companies`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        countryCode: 'GB', // For example: GB (UK), US, DE, etc.
        name: 'OpenAI'
      }
    });

    console.log('🏢 Company search result:', response.data);
  } catch (error) {
    console.error('❌ Company search failed:', error.response?.data || error.message);
  }
}

/**
 * Run everything
 */
async function main() {
  const token = await authenticate();
  await searchCompany(token);
}

main();
