/*
Choices readers pick from when they comment.

Keep in step with frontend/app/lib/feedback.js
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

// A small list of common abusive words; anything it misses
// can be deleted by the admin, coordinator or HOD.
export const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "dick",
  "pussy",
  "slut",
  "whore",
  "motherfucker",
  "idiot",
  "stupid",
];
