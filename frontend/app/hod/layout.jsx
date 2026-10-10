import PanelShell from "../components/PanelShell";

export const metadata = {
  title: {
    default: "HOD Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine",
  },
  description: "KPT Mangaluru HOD dashboard.",
};

const ALLOWED_ROLES = ["hod"];

export default function HODLayout({ children }) {
  return (
    <PanelShell panel="hod" allowedRoles={ALLOWED_ROLES}>
      {children}
    </PanelShell>
  );
}
