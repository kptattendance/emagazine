"use client";

import ReviewRequests from "../../components/ReviewRequests";

export default function DepartmentCoordinatorRequestsPage() {
  return (
    <ReviewRequests
      scopeLabel="Your Department"
      subtitle="Check your department students' submissions. Approved ones go to the HOD, or to the Institute Coordinator for institute level content."
      emptyText="There are no student submissions waiting for you."
      forwarding
      studentEditBasePath="/staff/edit"
      facultyEditBasePath="/staff/edit"
    />
  );
}
