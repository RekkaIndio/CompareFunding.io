import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

export function ThemeStyles() {
  const { colors } = useTheme();

  useEffect(() => {
    if (!colors) return;

    // Convert hex colors to RGB for opacity support
    const hexToRGB = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const primaryRGB = hexToRGB(colors.primary);
    const secondaryRGB = hexToRGB(colors.secondary);
    const accentRGB = hexToRGB(colors.accent);

    // Set CSS custom properties
    const root = document.documentElement;
    
    if (primaryRGB && secondaryRGB && accentRGB) {
      // Set hex values
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-secondary', colors.secondary);
      root.style.setProperty('--theme-accent', colors.accent);
      
      // Set RGB values for opacity variations
      root.style.setProperty('--theme-primary-rgb', `${primaryRGB.r} ${primaryRGB.g} ${primaryRGB.b}`);
      root.style.setProperty('--theme-secondary-rgb', `${secondaryRGB.r} ${secondaryRGB.g} ${secondaryRGB.b}`);
      root.style.setProperty('--theme-accent-rgb', `${accentRGB.r} ${accentRGB.g} ${accentRGB.b}`);

      // Also set the fundhub-specific colors
      root.style.setProperty('--fundhub-blue', colors.primary);
      root.style.setProperty('--fundhub-secondary', colors.secondary);
      root.style.setProperty('--fundhub-accent', colors.accent);
    }
  }, [colors]);

  return null;
}