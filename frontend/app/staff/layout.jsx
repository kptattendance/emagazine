import PanelShell from "../components/PanelShell";

export const metadata = {
  title: {
    default: "Faculty Dashboard | KPT eMagazine",
    template: "%s | KPT eMagazine",
  },
  description: "KPT Mangaluru faculty dashboard.",
};

// Department coordinators and club in-charges are faculty too
const ALLOWED_ROLES = [
  "staff",
  "dept_coordinator",
  "club_incharge",
];

export default function FacultyLayout({ children }) {
  return (
    <PanelShell panel="staff" allowedRoles={ALLOWED_ROLES}>
      {children}
    </PanelShell>
  );
}
