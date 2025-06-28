/**
 * Utility functions for date formatting and manipulation
 * Used across various platform services
 */
export class DateUtils {
  /**
   * Format date for API calls
   */
  static formatForAPI(
    date: Date,
    format: "YYYY-MM-DD" | "YYYYMMDD" = "YYYY-MM-DD",
  ): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return format === "YYYY-MM-DD"
      ? `${year}-${month}-${day}`
      : `${year}${month}${day}`;
  }

  /**
   * Get date range for the last N days
   */
  static getDateRange(days: number): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    return { startDate, endDate };
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate: Date, endDate: Date): string {
    const start = this.formatForAPI(startDate);
    const end = this.formatForAPI(endDate);

    return `${start} ~ ${end}`;
  }

  /**
   * Get today's date at midnight
   */
  static getToday(): Date {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return today;
  }

  /**
   * Get yesterday's date at midnight
   */
  static getYesterday(): Date {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return yesterday;
  }

  /**
   * Check if date is within range
   */
  static isWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  /**
   * Parse date string in various formats
   */
  static parseDate(dateString: string): Date {
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(dateString + "T00:00:00");
    }

    // Handle YYYYMMDD format
    if (/^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);

      return new Date(`${year}-${month}-${day}T00:00:00`);
    }

    // Default parsing
    return new Date(dateString);
  }
}
