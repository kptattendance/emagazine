"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import SubmissionList from "../components/SubmissionList";
import { getCurrentUser } from "../lib/currentUser";

export default function StaffSubmissionsPage() {
  const { user } = useUser();

  // Direct publishers may also remove their published posts
  const [publishesDirectly, setPublishesDirectly] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    getCurrentUser(user.id)
      .then((response) =>
        setPublishesDirectly(
          response.data?.data?.role === "welfare_officer"
        )
      )
      .catch(() => setPublishesDirectly(false));
  }, [user?.id]);

  return (
    <SubmissionList
      endpoint="my"
      title="My Submissions"
      subtitle="Track the magazine content you have submitted."
      emptyText="You have not submitted any magazine content yet."
      newHref="/staff/new"
      editBasePath="/staff/edit"
      canManagePublished={publishesDirectly}
    />
  );
}
