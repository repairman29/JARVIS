/**
 * Clock skill — current date and time in any timezone.
 * Use so JARVIS never says "I don't have real-time access" for date/time questions.
 */

async function get_current_time({ timezone = '', format = 'friendly' } = {}) {
  const opts = timezone ? { timeZone: timezone } : {};
  const now = new Date();

  let dateStr;
  let timeStr;
  try {
    if (timezone) {
      dateStr = new Intl.DateTimeFormat('en-US', { ...opts, dateStyle: 'long' }).format(now);
      timeStr = new Intl.DateTimeFormat('en-US', { ...opts, timeStyle: 'medium' }).format(now);
    } else {
      dateStr = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(now);
      timeStr = new Intl.DateTimeFormat('en-US', { timeStyle: 'medium' }).format(now);
    }
  } catch (e) {
    return {
      success: false,
      error: `Invalid timezone or format: ${e.message}`,
      hint: 'Use IANA names like America/Denver, Europe/London, UTC',
    };
  }

  let output;
  switch (format) {
    case 'iso':
      output = timezone
        ? new Intl.DateTimeFormat('en-CA', { ...opts, dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(now).replace(', ', 'T')
        : now.toISOString();
      break;
    case 'short':
      output = `${dateStr}, ${timeStr}`;
      break;
    default:
      output = `${dateStr} at ${timeStr}`;
  }

  return {
    success: true,
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    date: dateStr,
    time: timeStr,
    formatted: output,
    iso: now.toISOString(),
  };
}

module.exports = {
  tools: {
    get_current_time,
  },
};
