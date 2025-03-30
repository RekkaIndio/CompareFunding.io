import axios from 'axios';

const COMPANIES_HOUSE_API_BASE = 'https://api.company-information.service.gov.uk';
const API_KEY = '7ff84d5b-3c71-40f4-b8ed-98b5f21f2daf'; // Replace with your actual API key

const companiesHouseClient = axios.create({
  baseURL: COMPANIES_HOUSE_API_BASE,
  auth: {
    username: API_KEY,
    password: '' // Password can be left empty for Companies House API
  }
});

export const getCompanyData = async (companyNumber: string) => {
  try {
    const response = await companiesHouseClient.get(`/company/${companyNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company data:', error);
    throw error;
  }
};

export const searchCompanies = async (query: string) => {
  try {
    const response = await companiesHouseClient.get('/search/companies', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
};