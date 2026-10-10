import PanelShell from "../components/PanelShell";

export const metadata = {
  title: {
    default: "Admin Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine Admin",
  },

  description:
    "KPT Mangaluru eMagazine administration dashboard.",
};

const ALLOWED_ROLES = ["admin"];

export default function AdminLayout({ children }) {
  return (
    <PanelShell panel="admin" allowedRoles={ALLOWED_ROLES}>
      {children}
    </PanelShell>
  );
}
