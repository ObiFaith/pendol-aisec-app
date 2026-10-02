import { ShieldCheck } from "lucide-react";

export function EmptyDetail() {
  return (
    <div className="empty-detail">
      <ShieldCheck size={28} />
      <p>Select a company from the register</p>
    </div>
  );
}
