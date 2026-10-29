/*
The magazine accepts content from July 2026 onwards.

Keep in step with frontend/app/lib/eventDate.js
*/

export const EARLIEST_EVENT_DATE = "2026-07-01";

const EARLIEST = new Date(`${EARLIEST_EVENT_DATE}T00:00:00+05:30`);

// Error message, or null when the date is fine
export const checkEventDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Please enter a valid date.";
  }

  if (date < EARLIEST) {
    return "Only activities from July 2026 onwards are accepted.";
  }

  return null;
};
