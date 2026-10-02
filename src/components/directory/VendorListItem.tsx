import { ChevronRight } from "lucide-react";
import type { Vendor } from "../../types/vendor";
import { websiteLabel } from "../../utils/formatters";

type VendorListItemProps = {
  vendor: Vendor;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function VendorListItem({
  vendor,
  index,
  isSelected,
  onSelect,
}: VendorListItemProps) {
  return (
    <button
      role="option"
      aria-selected={isSelected}
      className={`vendor-row ${isSelected ? "selected" : ""}`}
      type="button"
      onClick={() => onSelect(vendor.id)}
    >
      <span className="row-number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="vendor-row-copy">
        <strong>{vendor.name}</strong>
        <small>{websiteLabel(vendor.website)}</small>
      </span>
      <ChevronRight className="row-chevron" size={16} />
    </button>
  );
}
