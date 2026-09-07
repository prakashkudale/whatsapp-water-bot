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
 * Get yesterday's date string in 'YYYY-MM-DD' format
 * @param {string} timezone
 * @param {Date} [dateObj=new Date()]
 * @returns {string}
 */
const getPreviousDateString = (timezone = process.env.TIMEZONE || 'Asia/Kolkata', dateObj = new Date()) => {
  const yesterday = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
  return getCurrentDateString(timezone, yesterday);
};

/**
 * Get current hour and minute in a given timezone
 * @param {string} timezone
 * @param {Date} [dateObj=new Date()]
 * @returns {{ hour: number, minute: number, totalMinutes: number }}
 */
const getCurrentTimeInTimezone = (timezone = process.env.TIMEZONE || 'Asia/Kolkata', dateObj = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.format(dateObj).split(':');
    let hour = parseInt(parts[0], 10);
    if (hour === 24) hour = 0; // Fix ICU midnight 24:00 edge case
    const minute = parseInt(parts[1] || '0', 10);

    return {
      hour,
      minute,
      totalMinutes: hour * 60 + minute
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
 * Supports context awareness ('wake' vs 'sleep'), 12/24h format, and Hinglish phrasing
 * Examples: "8:00 AM", "8am", "8", "11", "11:30 PM", "23:00", "subah 8 baje", "raat 11 baje"
 * @param {string} input
 * @param {'wake'|'sleep'|'auto'} [context='auto']
 * @returns {{ valid: boolean, hour24?: number, minute?: number, formatted?: string, error?: string }}
 */
const parseTimeString = (input, context = 'auto') => {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Please provide a valid time.' };
  }

  let clean = input.trim().toLowerCase();

  // Normalize dot notation e.g. "8.30" -> "8:30"
  clean = clean.replace(/(\d{1,2})\.(\d{2})/, '$1:$2');

  // Detect explicit Hindi / natural keywords
  let explicitPeriod = null;
  if (/subah|morning|savere|sawere/i.test(clean)) {
    explicitPeriod = 'AM';
  } else if (/raat|night|shaam|evening|dopahar|afternoon/i.test(clean)) {
    explicitPeriod = 'PM';
  }

  // Remove natural filler words
  clean = clean.replace(/subah|morning|savere|sawere|raat|night|shaam|evening|dopahar|afternoon|baje|ko|around|at|approx/gi, '').trim();

  // Pattern 1: 12-hour format with explicit AM/PM e.g. "8:00 AM", "8:30 PM", "8 AM", "8PM", "11pm"
  const twelveHourMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
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

  // Pattern 2: 24-hour format or time with colon e.g. "08:00", "23:30", "14:00", "8:30", "11:00"
  const colonMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    let hour = parseInt(colonMatch[1], 10);
    const minute = parseInt(colonMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { valid: false, error: 'Hour must be 0-23 and minute 0-59.' };
    }

    // If explicit 24h format (e.g. 13 to 23 or 0)
    if (hour > 12 || hour === 0) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const formatted = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      return { valid: true, hour24: hour, minute, formatted };
    }

    // 1-12 with colon but no AM/PM (e.g. "8:30" or "11:00")
    let period = explicitPeriod;
    if (!period) {
      if (context === 'wake') {
        period = hour >= 1 && hour <= 11 ? 'AM' : 'PM';
      } else if (context === 'sleep') {
        period = (hour >= 8 && hour <= 11) ? 'PM' : (hour === 12 || (hour >= 1 && hour <= 4) ? 'AM' : 'PM');
      } else {
        period = hour >= 12 ? 'PM' : 'AM';
      }
    }

    let hour24 = hour;
    if (period === 'AM' && hour === 12) hour24 = 0;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;

    const formatted = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    return { valid: true, hour24, minute, formatted };
  }

  // Pattern 3: Simple hour number e.g. "8", "9", "11", "23"
  const simpleHourMatch = clean.match(/^(\d{1,2})$/);
  if (simpleHourMatch) {
    let hour = parseInt(simpleHourMatch[1], 10);
    if (hour >= 0 && hour <= 23) {
      // If 24h number like 13-23
      if (hour > 12) {
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        const formatted = `${hour12}:00 PM`;
        return { valid: true, hour24: hour, minute: 0, formatted };
      }
      if (hour === 0) {
        return { valid: true, hour24: 0, minute: 0, formatted: '12:00 AM' };
      }

      // Hour is 1-12
      let period = explicitPeriod;
      if (!period) {
        if (context === 'wake') {
          // Wake up times: 4 to 11 are AM; 12, 1, 2 are afternoon PM
          period = (hour >= 4 && hour <= 11) ? 'AM' : 'PM';
        } else if (context === 'sleep') {
          // Bedtimes: 7, 8, 9, 10, 11 are PM; 12 is midnight AM; 1, 2, 3, 4, 5 are late night AM
          period = (hour >= 7 && hour <= 11) ? 'PM' : 'AM';
        } else {
          period = hour >= 12 ? 'PM' : 'AM';
        }
      }

      let hour24 = hour;
      if (period === 'AM' && hour === 12) hour24 = 0;
      if (period === 'PM' && hour !== 12) hour24 = hour + 12;

      const formatted = `${hour}:00 ${period}`;
      return { valid: true, hour24, minute: 0, formatted };
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
    // Window spanning overnight e.g. 8:00 PM (1200 min) to 6:00 AM (360 min) or 1:00 AM (60 min)
    return currentTotal >= wakeTotal || currentTotal < sleepTotal;
  }
};

module.exports = {
  getCurrentDateString,
  getPreviousDateString,
  getCurrentTimeInTimezone,
  parseTimeString,
  isTimeWithinWakeWindow
};
