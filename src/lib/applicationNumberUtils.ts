/**
 * Utility functions for generating and managing application numbers
 */

/**
 * Generates a unique application number
 * Format: APP-{6-character-random}-{6-digit-timestamp}
 * @returns A unique application number string
 */
export const generateApplicationNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase(); // 6 random alphanumeric chars
  return `APP-${randomPart}-${timestamp}`;
};

/**
 * Validates if a string follows the application number format
 * @param applicationNumber - The string to validate
 * @returns boolean indicating if the format is valid
 */
export const isValidApplicationNumber = (applicationNumber: string): boolean => {
  const pattern = /^APP-[A-Z0-9]{6}-\d{6}$/;
  return pattern.test(applicationNumber);
};

/**
 * Extracts timestamp from an application number
 * @param applicationNumber - The application number to extract from
 * @returns The timestamp as a number, or null if invalid
 */
export const extractTimestampFromApplicationNumber = (applicationNumber: string): number | null => {
  if (!isValidApplicationNumber(applicationNumber)) {
    return null;
  }
  
  const parts = applicationNumber.split('-');
  if (parts.length !== 3) {
    return null;
  }
  
  const timestampPart = parts[2];
  return parseInt(timestampPart, 10);
};
