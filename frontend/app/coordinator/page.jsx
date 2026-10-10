"use client";

import ReviewRequests from "../components/ReviewRequests";

export default function CoordinatorRequestsPage() {
  return (
    <ReviewRequests
      scopeLabel="Institute Level"
      subtitle="Review institute level submissions before publishing."
      emptyText="There are no institute level submissions waiting for approval."
      studentEditBasePath="/coordinator/edit"
      facultyEditBasePath="/coordinator/edit"
    />
  );
}
