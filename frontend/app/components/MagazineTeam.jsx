"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { GraduationCap, UserRound, Users } from "lucide-react";

import { getDepartmentLabel } from "../lib/departments";
import { TEAM_TIERS, positionRank } from "../lib/teamPositions";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ordinal = (number) =>
  ({ 1: "st", 2: "nd", 3: "rd" })[number] || "th";

/*
============================================================
Home page section listing the magazine team, level by level:
Principal and Academic Dean, institute coordinator,
department coordinators, student coordinators.

Hidden until at least one member has been added.
============================================================
*/

export default function MagazineTeam() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${API_URL}/api/team`)
      .then((response) => {
        if (!cancelled) {
          setMembers(response.data?.data || []);
        }
      })
      .catch((error) =>
        console.error("Failed to load the magazine team:", error)
      );

    return () => {
      cancelled = true;
    };
  }, []);

  if (members.length === 0) {
    return null;
  }

  // The server already sends members in display order
  const tiers = TEAM_TIERS.map((tier) => ({
    ...tier,
    items: members.filter(
      (member) => positionRank(member.position) === tier.rank
    ),
  })).filter((tier) => tier.items.length > 0);

  return (
    <section
      id="team"
      className="border-b border-slate-200 bg-gradient-to-b from-white via-teal-50/40 to-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-teal-700">
            <Users size={17} />

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-xs">
              The People Behind It
            </p>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Magazine Team
          </h2>
        </div>

        <div className="space-y-10">
          {tiers.map((tier) => (
            <div key={tier.rank}>
              <div className="mb-5 flex items-center gap-4">
                <span className="h-px flex-1 bg-slate-200" />

                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {tier.title}
                </h3>

                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
                {tier.items.map((member) => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    large={tier.rank <= 2}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberCard({ member, large }) {
  const isStudent = member.memberType === "student";

  return (
    <div
      className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
        large
          ? "w-[calc(50%-0.5rem)] sm:w-60"
          : "w-[calc(50%-0.5rem)] sm:w-52"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/40">
            {isStudent ? (
              <GraduationCap size={52} />
            ) : (
              <UserRound size={52} />
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-black text-slate-900 sm:text-base">
          {member.name}
        </p>

        <p className="mt-1 line-clamp-2 text-[11px] font-bold uppercase leading-4 tracking-wide text-teal-700">
          {member.position}
        </p>

        <p className="mt-2 truncate text-xs text-slate-500">
          {isStudent
            ? `${member.registerNumber} · ${member.year}${ordinal(member.year)} Year`
            : member.designation}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {getDepartmentLabel(member.department)}
        </p>
      </div>
    </div>
  );
}
