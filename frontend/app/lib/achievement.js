/*
Keep in step with backend/src/config/achievement.js
*/

export const ACHIEVEMENT_LEVELS = [
  "Local / Community",
  "College",
  "Taluk",
  "District",
  "State",
  "National",
  "International",
];

// "First Prize · State Level"
export function achievementSummary(achievement) {
  const award = achievement?.award || "";
  const level = achievement?.level
    ? `${achievement.level} Level`
    : "";

  return [award, level].filter(Boolean).join(" · ");
}
