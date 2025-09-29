/**
 * Date and Timestamp Utility Functions
 * ====================================
 * 
 * Centralized utilities for handling dates, timestamps, and time formatting
 * across the StockPulse application.
 */

/**
 * Normalize timestamp to milliseconds and validate it's reasonable
 */
export function normalizeTimestamp(timestamp: number): number {
  if (!timestamp || !isFinite(timestamp) || timestamp <= 0) {
    return Date.now();
  }

  // Use 2010 threshold for more conservative conversion (1262304000000 = Jan 1, 2010)
  const year2010InMs = 1262304000000;
  const normalizedTimestamp = timestamp < year2010InMs ? timestamp * 1000 : timestamp;
  
  // Validate timestamp is reasonable (between 2010 and 10 years from now)
  const now = Date.now();
  const tenYearsFromNow = now + (10 * 365 * 24 * 60 * 60 * 1000);
  
  if (normalizedTimestamp < year2010InMs || normalizedTimestamp > tenYearsFromNow) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Invalid timestamp detected: ${timestamp} -> ${normalizedTimestamp}, using current time`);
    }
    return now;
  }
  
  return normalizedTimestamp;
}

/**
 * Format timestamp for chart display with timezone awareness
 */
export function formatChartTimeLabel(timestamp: number, totalPoints: number = 0): string {
  const date = new Date(normalizeTimestamp(timestamp));
  const now = new Date();
  
  // Check if the date is from today
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  // For many data points, show abbreviated format
  if (totalPoints > 20) {
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  
  // For fewer data points, show more detail
  if (isToday) {
    return date.toLocaleTimeString();
  } else if (isYesterday) {
    return 'Yesterday ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }
}

/**
 * Format timestamp for display in tooltips and UI elements
 */
export function formatDisplayTime(timestamp: number): string {
  const date = new Date(normalizeTimestamp(timestamp));
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

/**
 * Get relative time description (e.g., "2 minutes ago")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const normalizedTimestamp = normalizeTimestamp(timestamp);
  const diffMs = now - normalizedTimestamp;
  
  if (diffMs < 0) {
    return 'just now'; // Future timestamps become "just now"
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 30) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return new Date(normalizedTimestamp).toLocaleDateString();
  }
}

/**
 * Check if a timestamp represents a valid trading time
 * (rough approximation - doesn't account for holidays)
 */
export function isTradingTime(timestamp: number): boolean {
  const date = new Date(normalizeTimestamp(timestamp));
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getHours();
  
  // Rough trading hours: Monday-Friday, 9:30 AM - 4:00 PM ET
  // This is a simplification and doesn't account for pre-market/after-hours
  const isWeekday = day >= 1 && day <= 5;
  const isTradingHour = hour >= 9 && hour <= 16;
  
  return isWeekday && isTradingHour;
}

/**
 * Format timestamp for logging purposes
 */
export function formatLogTime(timestamp: number): string {
  const date = new Date(normalizeTimestamp(timestamp));
  return date.toISOString();
}

/**
 * Validate if timestamp is within reasonable bounds for financial data
 */
export function isValidFinancialTimestamp(timestamp: number): boolean {
  const normalized = normalizeTimestamp(timestamp);
  const year2010InMs = 1262304000000;
  const tenYearsFromNow = Date.now() + (10 * 365 * 24 * 60 * 60 * 1000);
  
  return normalized >= year2010InMs && normalized <= tenYearsFromNow;
}