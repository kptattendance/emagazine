"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { GraduationCap, UserRound, Users } from "lucide-react";

import { getDepartmentLabel } from "../lib/departments";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ordinal = (number) =>
  ({ 1: "st", 2: "nd", 3: "rd" })[number] || "th";

/*
============================================================
Home page section listing the magazine team.
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

  const groups = [
    {
      title: "Faculty Coordinators",
      items: members.filter((m) => m.memberType === "faculty"),
    },
    {
      title: "Student Coordinators",
      items: members.filter((m) => m.memberType === "student"),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section
      id="team"
      className="border-b border-slate-200 bg-[#f7faf9]"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2 text-teal-700">
            <Users size={17} />

            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-xs">
              The People Behind It
            </p>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Magazine Team
          </h2>
        </div>

        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                {group.title}
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((member) => {
                  const isStudent = member.memberType === "student";

                  return (
                    <div
                      key={member._id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
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

                        {member.position && (
                          <span className="absolute inset-x-3 bottom-3 truncate rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 shadow-sm">
                            {member.position}
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <p className="truncate text-sm font-black text-slate-900 sm:text-base">
                          {member.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {isStudent
                            ? `${member.registerNumber} · ${member.semester}${ordinal(member.semester)} Sem`
                            : member.designation}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-teal-700">
                          {getDepartmentLabel(member.department)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
