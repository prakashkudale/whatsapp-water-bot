/**
 * Utility functions for timezone and time handling
 */

/**
 * Get current date string in 'YYYY-MM-DD' format for a given timezone
 * @param {string} timezone - e.g. 'Asia/Kolkata'
 * @param {Date} [dateObj=new Date()]
 * @returns {string} - 'YYYY-MM-DD'
 */
const getCurrentDateString = (timezone = process.env.TIMEZONE || 'Asia/Kolkata', dateObj = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj); // en-CA gives YYYY-MM-DD format
  } catch (err) {
    return dateObj.toISOString().split('T')[0];
  }
};

/**
 * Get current hour and minute in a given timezone
 * @param {string} timezone
 * @param {Date} [dateObj=new Date()]
 * @returns {{ hour: number, minute: number, totalMinutes: number }}
 */
const getCurrentTimeInTimezone = (timezone = process.env.TIMEZONE || 'Asia/Kolkata', dateObj = new Date()) => {
  try {
    const timeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(dateObj);

    const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0', 10);

    return {
      hour: hour === 24 ? 0 : hour,
      minute,
      totalMinutes: (hour === 24 ? 0 : hour) * 60 + minute
    };
  } catch (err) {
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    return {
      hour,
      minute,
      totalMinutes: hour * 60 + minute
    };
  }
};

/**
 * Parse flexible user time input into 24-hour and formatted 12-hour string
 * Examples: "8:00 AM", "8am", "8", "11:30 PM", "23:00", "07:45"
 * @param {string} input
 * @returns {{ valid: boolean, hour24?: number, minute?: number, formatted?: string, error?: string }}
 */
const parseTimeString = (input) => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Please provide a valid time.' };
  }

  const clean = input.trim().toUpperCase();

  // Pattern 1: 12-hour format e.g. "8:00 AM", "8:30 PM", "8 AM", "8PM"
  const twelveHourMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    let hour = parseInt(twelveHourMatch[1], 10);
    const minute = twelveHourMatch[2] ? parseInt(twelveHourMatch[2], 10) : 0;
    const period = twelveHourMatch[3].toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return { valid: false, error: 'Hour must be 1-12 and minute 0-59.' };
    }

    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;

    const formatted = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    return { valid: true, hour24, minute, formatted };
  }

  // Pattern 2: 24-hour format e.g. "08:00", "23:30", "14:00"
  const twentyFourHourMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour = parseInt(twentyFourHourMatch[1], 10);
    const minute = parseInt(twentyFourHourMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { valid: false, error: 'Hour must be 0-23 and minute 0-59.' };
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const formatted = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;

    return { valid: true, hour24: hour, minute, formatted };
  }

  // Pattern 3: Simple hour number e.g. "8", "9", "23"
  const simpleHourMatch = clean.match(/^(\d{1,2})$/);
  if (simpleHourMatch) {
    let hour = parseInt(simpleHourMatch[1], 10);
    if (hour >= 0 && hour <= 23) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const formatted = `${hour12}:00 ${period}`;
      return { valid: true, hour24: hour, minute: 0, formatted };
    }
  }

  return {
    valid: false,
    error: 'Invalid time format. Please use examples like "8:00 AM" or "11:00 PM".'
  };
};

/**
 * Check if the current time falls within user's wake-up and sleep window
 * @param {object} user - User document
 * @param {string} [timezone]
 * @returns {boolean}
 */
const isTimeWithinWakeWindow = (user, timezone = process.env.TIMEZONE || 'Asia/Kolkata') => {
  const current = getCurrentTimeInTimezone(user.timezone || timezone);
  const currentTotal = current.totalMinutes;

  const wakeTotal = (user.wakeUpHour ?? 8) * 60 + (user.wakeUpMinute ?? 0);
  const sleepTotal = (user.sleepHour ?? 23) * 60 + (user.sleepMinute ?? 0);

  if (wakeTotal <= sleepTotal) {
    // Normal day window e.g. 8:00 AM (480 min) to 11:00 PM (1380 min)
    return currentTotal >= wakeTotal && currentTotal < sleepTotal;
  } else {
    // Window spanning overnight e.g. 8:00 PM to 6:00 AM next morning
    return currentTotal >= wakeTotal || currentTotal < sleepTotal;
  }
};

module.exports = {
  getCurrentDateString,
  getCurrentTimeInTimezone,
  parseTimeString,
  isTimeWithinWakeWindow
};
