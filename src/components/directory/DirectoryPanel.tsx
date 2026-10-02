import { SlidersHorizontal } from "lucide-react";
import type { PageFilter, Vendor } from "../../types/vendor";
import { SearchInput } from "./SearchInput";
import { PageFilterTabs } from "./PageFilterTabs";
import { VendorList } from "./VendorList";

type DirectoryPanelProps = {
  vendors: Vendor[];
  selectedId: string | null;
  onSelectVendor: (id: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  pageFilter: PageFilter;
  onPageFilterChange: (filter: PageFilter) => void;
  loading: boolean;
};

export function DirectoryPanel({
  vendors,
  selectedId,
  onSelectVendor,
  search,
  onSearchChange,
  pageFilter,
  onPageFilterChange,
  loading,
}: DirectoryPanelProps) {
  return (
    <aside className="directory-panel">
      <div className="directory-heading">
        <div>
          <span className="section-index">01</span>
          <h2>Companies</h2>
        </div>
        <button
          className="icon-button filter-icon"
          type="button"
          aria-label="Filter companies"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
      <SearchInput value={search} onChange={onSearchChange} />
      <PageFilterTabs
        currentFilter={pageFilter}
        onFilterChange={onPageFilterChange}
        resultCount={vendors.length}
      />
      <VendorList
        vendors={vendors}
        selectedId={selectedId}
        onSelectVendor={onSelectVendor}
        loading={loading}
      />
      <div className="directory-foot">
        <span>Sorted alphabetically</span>
        <span>Pages 01-02</span>
      </div>
    </aside>
  );
}
