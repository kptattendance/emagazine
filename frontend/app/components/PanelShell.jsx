import RoleProtected from "./RoleProtected";
import PanelSidebar from "./PanelSidebar";

/*
============================================================
Page frame shared by every dashboard:
role check, sidebar, and the content area beside it.
============================================================
*/

export default function PanelShell({
  panel,
  allowedRoles,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <RoleProtected allowedRoles={allowedRoles}>
        <PanelSidebar panel={panel} />

        <main className="min-h-screen lg:pl-[270px]">
          <div className="px-4 pb-12 pt-[5.5rem] sm:px-6 lg:px-10 lg:pt-10">
            {children}
          </div>
        </main>
      </RoleProtected>
    </div>
  );
}
