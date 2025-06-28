/**
 * Date formatting utilities for consistent date handling across the application
 */

/**
 * Format date to YYYY-MM-DD format
 * Used for API calls that require date-only format
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Format date to ISO string
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse date string to Date object
 * Handles various date formats
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Get date range for last N days
 */
export const getDateRangeForLastNDays = (
  days: number,
): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();

  startDate.setDate(startDate.getDate() - days);

  return { startDate, endDate };
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date: Date, locale = "en-US"): string => {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is within range
 */
export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date,
): boolean => {
  return date >= startDate && date <= endDate;
};
