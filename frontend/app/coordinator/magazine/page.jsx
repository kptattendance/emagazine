"use client";

import SubmissionList from "../../components/SubmissionList";

export default function CoordinatorMagazinePage() {
  return (
    <SubmissionList
      endpoint="review"
      title="Institute Magazine"
      subtitle="All institute level magazine content."
      emptyText="There is no institute level magazine content yet."
      newHref="/coordinator/new"
      editBasePath="/coordinator/edit"
      canManagePublished
    />
  );
}
