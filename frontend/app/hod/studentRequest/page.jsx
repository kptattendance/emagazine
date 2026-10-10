"use client";

import ReviewRequests from "../../components/ReviewRequests";

export default function HODMagazinePage() {
  return (
    <ReviewRequests
      scopeLabel="Your Department"
      subtitle="Review student and faculty submissions before publishing."
      emptyText="There are no magazine submissions waiting for approval in your department."
      studentEditBasePath="/hod/studentRequest/edit"
      facultyEditBasePath="/hod/studentRequest/faculty"
    />
  );
}
