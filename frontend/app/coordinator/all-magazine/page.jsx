"use client";

import MagazineContentTable from "../../components/MagazineContentTable";
import { isInstituteContent } from "../../lib/departments";

export default function CoordinatorAllMagazinePage() {
  return (
    <MagazineContentTable
      title="All Magazine Content"
      subtitle="Every submission from every department. You can edit and delete institute level content."
      editBasePath="/coordinator/edit"
      canManage={isInstituteContent}
    />
  );
}
