import { LoaderCircle } from "lucide-react";
import type { Vendor } from "../../types/vendor";
import { VendorListItem } from "./VendorListItem";

type VendorListProps = {
  vendors: Vendor[];
  selectedId: string | null;
  onSelectVendor: (id: string) => void;
  loading: boolean;
};

export function VendorList({
  vendors,
  selectedId,
  onSelectVendor,
  loading,
}: VendorListProps) {
  return (
    <div className="company-list" role="listbox" aria-label="Companies">
      {loading && (
        <div className="list-message">
          <LoaderCircle className="spin" size={18} /> Loading register
        </div>
      )}
      {!loading && vendors.length === 0 && (
        <div className="list-message">No companies match this search.</div>
      )}
      {!loading &&
        vendors.map((vendor, index) => (
          <VendorListItem
            key={vendor.id}
            vendor={vendor}
            index={index}
            isSelected={vendor.id === selectedId}
            onSelect={onSelectVendor}
          />
        ))}
    </div>
  );
}
