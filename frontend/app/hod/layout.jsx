import RoleProtected from "../components/RoleProtected";
import HODSidebar from "./components/HODSidebar";

export const metadata = {
  title: {
    default: "HOD Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine",
  },
  description: "KPT Mangaluru HOD dashboard.",
};

export default function HODLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <RoleProtected allowedRoles={["hod"]}>

      <HODSidebar />

      <main className="min-h-screen lg:pl-[260px]">
        <div className="px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
      </RoleProtected>
    </div>
  );
}