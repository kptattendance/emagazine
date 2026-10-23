"use client";

import { ACHIEVEMENT_LEVELS } from "../lib/achievement";

/*
============================================================
Extra fields for an achievement: the level it was won at
and the prize or position.
============================================================
*/

export default function AchievementFields({
  level,
  award,
  onChange,
  inputClass,
  labelClass,
}) {
  return (
    <>
      <div>
        <label className={labelClass}>
          Level
          <span className="ml-1 text-red-500">*</span>
        </label>

        <select
          name="achievementLevel"
          value={level}
          onChange={onChange}
          className={inputClass}
        >
          <option value="">Select level</option>

          {ACHIEVEMENT_LEVELS.map((item) => (
            <option key={item} value={item}>
              {item} Level
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>
          Prize / Position
          <span className="ml-1 text-red-500">*</span>
        </label>

        <input
          type="text"
          name="achievementAward"
          value={award}
          onChange={onChange}
          placeholder="Example: First Prize, Selected, Gold Medal"
          className={inputClass}
        />
      </div>
    </>
  );
}
