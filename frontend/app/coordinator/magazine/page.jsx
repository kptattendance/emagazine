"use client";

import MagazineContentTable from "../../components/MagazineContentTable";
import { isInstituteContent } from "../../lib/departments";

export default function CoordinatorMagazinePage() {
  return (
    <MagazineContentTable
      title="Institute Magazine"
      subtitle="All institute level magazine content."
      editBasePath="/coordinator/edit"
      canManage={isInstituteContent}
      onlyShow={isInstituteContent}
      showDepartmentFilter={false}
    />
  );
}
