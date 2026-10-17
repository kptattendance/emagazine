"use client";

import ReviewRequests from "../../components/ReviewRequests";

export default function DepartmentCoordinatorRequestsPage() {
  return (
    <ReviewRequests
      scopeLabel="Your Department"
      subtitle="Check student submissions. Approved ones go to the HOD for publishing."
      emptyText="There are no student submissions waiting for you."
      approveLabel="Approve & Send to HOD"
      studentEditBasePath="/staff/edit"
      facultyEditBasePath="/staff/edit"
    />
  );
}
