"use client";

import SubmissionList from "../components/SubmissionList";

export default function StaffSubmissionsPage() {
  return (
    <SubmissionList
      endpoint="my"
      title="My Submissions"
      subtitle="Track the magazine content you have submitted."
      emptyText="You have not submitted any magazine content yet."
      newHref="/staff/new"
      editBasePath="/staff/edit"
    />
  );
}
