/*
Reader feedback (comments and likes).

Keep the lists in step with backend/src/config/feedback.js
*/

export const VISITOR_TYPES = [
  "Student",
  "Parent",
  "Alumni",
  "Faculty",
  "Visitor",
];

export const VISITOR_PLACES = [
  "Mangaluru",
  "Udupi",
  "Rest of Dakshina Kannada",
  "Rest of Karnataka",
  "Outside Karnataka",
  "Outside India",
];

export const COMMENT_MAX_LENGTH = 500;

const VISITOR_KEY = "kpt-emag-visitor";
const DETAILS_KEY = "kpt-emag-commenter";

/*
A random ID this browser keeps, so a like counts once per
browser. It identifies a browser, not a person.
*/
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }

    return id;
  } catch (error) {
    // Private mode etc.: a one-off ID for this page view
    return crypto.randomUUID();
  }
}

// Remember the reader's name, type and place for next time
export function loadCommenterDetails() {
  try {
    return JSON.parse(localStorage.getItem(DETAILS_KEY)) || null;
  } catch (error) {
    return null;
  }
}

export function saveCommenterDetails(details) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  } catch (error) {
    // Not saved; the reader just types it again
  }
}
