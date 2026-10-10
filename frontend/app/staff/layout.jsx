import PanelShell from "../components/PanelShell";

export const metadata = {
  title: {
    default: "Faculty Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine",
  },
  description: "KPT Mangaluru faculty dashboard.",
};

const ALLOWED_ROLES = ["staff"];

export default function FacultyLayout({ children }) {
  return (
    <PanelShell panel="staff" allowedRoles={ALLOWED_ROLES}>
      {children}
    </PanelShell>
  );
}
