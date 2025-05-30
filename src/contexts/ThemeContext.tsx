import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getDocument } from '@/firebase';
import { extractColors } from '@/lib/utils';

interface ThemeContextType {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const defaultColors = {
  primary: '#ff8000',   // Default FundHub blue
  secondary: '#000000', // Darker blue
  accent: '#e74c3c'     // Accent red
};

const ThemeContext = createContext<ThemeContextType>({ colors: defaultColors });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [colors, setColors] = useState(defaultColors);

  useEffect(() => {
    const loadUserTheme = async () => {
      if (!user?.uid) return;

      // Try to load from both business and lender profiles
      const [businessProfile, lenderProfile] = await Promise.all([
        getDocument('businesses', user.uid),
        getDocument('lender_profiles', user.uid)
      ]);

      const profile = businessProfile.data || lenderProfile.data;
      
      if (profile?.logo_url) {
        try {
          const extractedColors = await extractColors(profile.logo_url);
          setColors(extractedColors);
          
          // Store colors in localStorage for faster initial load
          localStorage.setItem('theme_colors', JSON.stringify(extractedColors));
        } catch (error) {
          console.error('Error extracting colors:', error);
        }
      }
    };

    // First try to load from localStorage for immediate display
    const savedColors = localStorage.getItem('theme_colors');
    if (savedColors) {
      setColors(JSON.parse(savedColors));
    }

    loadUserTheme();
  }, [user]);

  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);