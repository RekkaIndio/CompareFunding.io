import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to get dominant color from an image URL
export const extractColors = (imageUrl: string): Promise<{ primary: string; secondary: string; accent: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ 
          primary: '#3498db',   // Default FundHub blue
          secondary: '#2980b9', // Darker blue
          accent: '#e74c3c'     // Accent red
        });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors: { [key: string]: number } = {};
      
      // Sample pixels to find dominant colors
      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        
        // Skip transparent pixels
        if (a < 125) continue;
        
        // Skip white/black pixels
        if ((r > 250 && g > 250 && b > 250) || (r < 5 && g < 5 && b < 5)) continue;
        
        const hex = rgbToHex(r, g, b);
        colors[hex] = (colors[hex] || 0) + 1;
      }

      // Sort colors by frequency
      const sortedColors = Object.entries(colors)
        .sort(([,a], [,b]) => b - a)
        .map(([color]) => color)
        .filter(color => {
          const [r, g, b] = hexToRgb(color);
          const hsl = rgbToHsl(r, g, b);
          // Filter out very light or very dark colors
          return hsl[2] > 0.1 && hsl[2] < 0.9;
        });

      // Get top 3 colors or fill with defaults
      resolve({
        primary: sortedColors[0] || '#3498db',
        secondary: sortedColors[1] || '#2980b9',
        accent: sortedColors[2] || '#e74c3c'
      });
    };

    img.onerror = () => {
      resolve({ 
        primary: '#3498db',
        secondary: '#2980b9',
        accent: '#e74c3c'
      });
    };

    img.src = imageUrl;
  });
};

// Helper function to convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

// Helper function to convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [h, s, l];
};
