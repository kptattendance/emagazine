import PanelShell from "../components/PanelShell";

export const metadata = {
  title: {
    default: "Coordinator Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine",
  },
  description: "KPT Mangaluru coordinator dashboard.",
};

const ALLOWED_ROLES = ["mag_coordinator"];

export default function CoordinatorLayout({ children }) {
  return (
    <PanelShell panel="coordinator" allowedRoles={ALLOWED_ROLES}>
      {children}
    </PanelShell>
  );
}
