"use client";

import { useParams } from "next/navigation";

import SubmissionForm from "../../../../components/SubmissionForm";

export default function HODFacultyRequestEditPage() {
  const params = useParams();

  return (
    <SubmissionForm
      contentId={params.id}
      backHref="/hod/studentRequest"
    />
  );
}
