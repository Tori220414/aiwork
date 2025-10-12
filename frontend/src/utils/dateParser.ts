import * as chrono from 'chrono-node';
import { format, parseISO } from 'date-fns';

export interface ParsedDate {
  date: Date;
  formatted: string;
  original: string;
  isValid: boolean;
}

/**
 * Parse natural language date strings
 * Examples: "tomorrow at 3pm", "next Monday", "in 2 weeks", "December 25th"
 */
export const parseNaturalLanguageDate = (input: string): ParsedDate | null => {
  if (!input || input.trim().length === 0) {
    return null;
  }

  try {
    const results = chrono.parse(input, new Date(), { forwardDate: true });

    if (results.length > 0) {
      const date = results[0].start.date();

      return {
        date,
        formatted: format(date, 'PPP p'), // e.g., "Jan 15, 2025 at 3:00 PM"
        original: input,
        isValid: true
      };
    }

    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
};

/**
 * Get human-friendly relative time
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60 && diffInMinutes >= 0) {
    return `in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`;
  } else if (diffInHours < 24 && diffInHours >= 0) {
    return `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
  } else if (diffInDays === 0) {
    return 'today';
  } else if (diffInDays === 1) {
    return 'tomorrow';
  } else if (diffInDays === -1) {
    return 'yesterday';
  } else if (diffInDays > 1 && diffInDays < 7) {
    return `in ${diffInDays} days`;
  } else if (diffInDays < -1 && diffInDays > -7) {
    return `${Math.abs(diffInDays)} days ago`;
  } else {
    return format(dateObj, 'MMM d, yyyy');
  }
};

/**
 * Common date suggestions
 */
export const commonDateSuggestions = [
  'today',
  'tomorrow',
  'next week',
  'next Monday',
  'next Friday',
  'in 2 days',
  'in 1 week',
  'end of month',
  'end of week'
];

/**
 * Validate if a string might contain a date
 */
export const mightContainDate = (input: string): boolean => {
  const dateKeywords = [
    'today', 'tomorrow', 'yesterday',
    'next', 'this', 'last',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'week', 'month', 'year',
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'am', 'pm', 'at', 'in', 'on'
  ];

  const lowerInput = input.toLowerCase();
  return dateKeywords.some(keyword => lowerInput.includes(keyword)) || /\d/.test(input);
};

/**
 * Extract date from task title if present
 */
export const extractDateFromTitle = (title: string): { cleanTitle: string; date: Date | null } => {
  const parsed = parseNaturalLanguageDate(title);

  if (parsed) {
    // Try to remove the date portion from the title
    const cleanTitle = title
      .replace(/\b(at|on|by|due|deadline)\s+/gi, '')
      .replace(parsed.original, '')
      .trim();

    return {
      cleanTitle: cleanTitle || title,
      date: parsed.date
    };
  }

  return {
    cleanTitle: title,
    date: null
  };
};
