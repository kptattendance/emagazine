import AdminSidebar from "./components/AdminSidebar";

export const metadata = {
  title: {
    default: "Admin Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine Admin",
  },

  description:
    "KPT Mangaluru eMagazine administration dashboard.",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      <main className="min-h-screen lg:pl-[270px]">
        <div className="px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}